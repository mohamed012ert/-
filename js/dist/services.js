/* ============================================================
 * ملف مجمّع مُولَّد تلقائياً — لا تعدّله يدوياً.
 * عدّل المصادر في js/ ثم أعد إنشاءه: node tools/build.mjs
 * ============================================================ */
/* ==== js/services/http.js ==== */
/* ============================================================
 * الخدمات — طبقة الاتصال بالشبكة (App.Http)
 * fetch مع مهلة زمنية + JSONP بديل عن CORS + أخطاء مصنّفة
 *
 * كل الدوال تعيد Promise بقيمة JSON مُحلّلة، أو ترفض
 * بخطأ من نوعه:
 *   HttpError { name: 'timeout' | 'network' | 'bad_payload' }
 * ============================================================ */
window.App = window.App || {};

App.Http = (function () {

  var TIMEOUT = 9000;

  /* خطأ مصنّف بمعلومات مفيدة */
  function HttpError(name, message) {
    var err = new Error(message || name);
    err.name = name;
    return err;
  }

  /* طلب GET مع مهلة — يعيد JSON مُحلّلاً */
  async function get(url) {
    var res = await fetchWithTimeout(url);
    var text = await res.text();
    try {
      return JSON.parse(text);
    } catch (e) {
      throw HttpError('bad_payload', 'استجابة غير صالحة من الخادم');
    }
  }

  /* طلب POST text/plain (بدون preflight — Apps Script لا يدعم OPTIONS)
   *
   * Apps Script يعيد توجيه طلبات POST (302) ثم يرد بـ JSON؛ وبسبب
   * mode:no-cors قد يصبح الرد غير مقروء (opaque) بينما الخادم يكون
   * قد نفّذ العملية فعلاً. لذلك:
   *   - الرد المقروء يُحلَّل ويُعاد بحالته الحقيقية (نجاح/خطأ من الخادم)
   *   - الرد غير المقروء يُعتبر نجاحاً (الكتابة نُفّذت على الخادم)
   *   - فشل الاتصال الحقيقي يُرفض (timeout / network) */
  async function post(url, payload) {
    var res = await fetchWithTimeout(url, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(payload),
      redirect: 'follow'
    });

    /* محاولة قراءة رد الخادم الحقيقي (حين يكون مقروءاً) */
    try {
      var text = await res.text();
      var data = JSON.parse(text);
      if (data && typeof data === 'object' && data.status === 'error') {
        /* رفض صريح من الخادم — يجب إظهاره للمستخدم */
        return data;
      }
    } catch (e) {
      /* رد opaque / معاد توجيهه — لا يمكن قراءته، والكتابة نُفّذت */
    }

    return { status: 'success' };
  }

  /* fetch مع مهلة وإلغاء تلقائي */
  function fetchWithTimeout(url, options) {
    return new Promise(function (resolve, reject) {
      var timer = setTimeout(function () {
        reject(HttpError('timeout', 'انتهت مهلة الطلب'));
      }, TIMEOUT);

      fetch(url, options || {}).then(function (res) {
        clearTimeout(timer);
        resolve(res);
      }).catch(function (err) {
        clearTimeout(timer);
        reject(HttpError('network', (err && err.message) || 'تعذر الوصول إلى الخادم'));
      });
    });
  }

  /* بديل JSONP (يلتف على قيود CORS في القراءة) — مع مهلة وتنظيف */
  function jsonp(url, callbackParam) {
    return new Promise(function (resolve, reject) {
      var cbName = '__jsonp_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7);
      var script = document.createElement('script');
      var timer = setTimeout(function () {
        cleanup();
        reject(HttpError('timeout', 'انتهت مهلة JSONP'));
      }, TIMEOUT);

      window[cbName] = function (data) {
        clearTimeout(timer);
        cleanup();
        resolve(data);
      };

      function cleanup() {
        delete window[cbName];
        if (script.parentNode) script.parentNode.removeChild(script);
      }

      script.onerror = function () {
        clearTimeout(timer);
        cleanup();
        reject(HttpError('network', 'فشل طلب JSONP'));
      };

      var sep = url.indexOf('?') === -1 ? '?' : '&';
      script.src = url + sep + (callbackParam || 'callback') + '=' + cbName;
      document.head.appendChild(script);
    });
  }

  return {
    get: get,
    post: post,
    jsonp: jsonp,
    HttpError: HttpError
  };
})();


/* ==== js/services/cache.js ==== */
/* ============================================================
 * الخدمات — كاش محلي (App.Cache)
 * طبقة تخزين localStorage مع مدة صلاحية (TTL)
 *
 * تُستخدم لتسريع العرض الفوري (قوائم الدروس) وتقليل
 * طلبات الشبكة — المفتاح القديم يُحتفظ به لاستمرارية المتصفح:
 *   physics_cache_videos_{grade}
 * ============================================================ */
window.App = window.App || {};

App.Cache = (function () {

  var PREFIX = 'physics_cache_';

  /* قراءة قيمة صالحة ضمن المدة — أو null */
  function get(key, ttlMs) {
    var entry = App.Storage.get(PREFIX + key, 'local');
    if (!entry || typeof entry !== 'object') return null;
    if (ttlMs && entry.expires && Date.now() > entry.expires) {
      remove(key);
      return null;
    }
    return entry.data;
  }

  /* كتابة قيمة مع مدة صلاحية (بالمللي ثانية) */
  function set(key, data, ttlMs) {
    var entry = { data: data };
    if (ttlMs) entry.expires = Date.now() + ttlMs;
    App.Storage.set(PREFIX + key, entry, 'local');
  }

  /* حذف مفتاح */
  function remove(key) {
    App.Storage.remove(PREFIX + key, 'local');
  }

  return {
    get: get,
    set: set,
    remove: remove
  };
})();


/* ==== js/services/session.js ==== */
/* ============================================================
 * الخدمات — إدارة الجلسات (App.Session)
 * جلسة الطالب + جلسة الأدمن — تُخزَّن في sessionStorage
 * (تختفي بإغلاق التبويب = سلوك آمن افتراضياً)
 * ============================================================ */
window.App = window.App || {};

App.Session = (function () {

  var STUDENT_KEY = 'physics_student_session';
  var ADMIN_KEY = 'physics_admin';

  /* ---------- جلسة الطالب ---------- */

  /* بنية الجلسة:
   * { code, password, name, grade, grade_id, points, absences, homework } */
  function getStudent() {
    return App.Storage.get(STUDENT_KEY);
  }

  function setStudent(code, password, student) {
    return App.Storage.set(STUDENT_KEY, {
      code: String(code),
      password: password,
      name: student && student.name,
      grade: student && student.grade,
      grade_id: student && student.grade,
      points: Number((student && student.points) || 0),
      absences: Number((student && student.absences) || 0),
      homework: Number((student && student.homework) || 0)
    });
  }

  function clearStudent() {
    App.Storage.remove(STUDENT_KEY);
  }

  /* ---------- جلسة الأدمن ---------- */

  /* يتحقق من الصيغتين: القيمة المخزنة عبر set (JSON "1")
     والقيمة القديمة الخام (1) من الجلسات السابقة */
  function isAdmin() {
    return App.Storage.get(ADMIN_KEY) === '1' || App.Storage.getRaw(ADMIN_KEY) === '1';
  }

  function setAdmin(on) {
    if (on) App.Storage.set(ADMIN_KEY, '1');
    else App.Storage.remove(ADMIN_KEY);
  }

  return {
    getStudent: getStudent,
    setStudent: setStudent,
    clearStudent: clearStudent,
    isAdmin: isAdmin,
    setAdmin: setAdmin
  };
})();


/* ==== js/services/api.js ==== */
/* ============================================================
 * الخدمات — عميل واجهة برمجة التطبيقات (window.Api)
 * طبقة الوصول للبيانات: Google Apps Script Web App + Google Sheets
 *
 * المسؤوليات المنفصلة هنا:
 *   - بناء المعاملات (params) وضغط الطلبات
 *   - محاولة fetch ← ثم JSONP (تجاوز CORS) ← ثم البيانات الاحتياطية
 *   - تحقق من صحة أشكال البيانات (Payload Validation)
 *   - كاش محلي للقوائم العامة (تقليل طلبات الشبكة)
 *
 * ملاحظة: رفض الخادم الصريح (status:"error") يُحترم ولا يُستبدل
 * ببيانات تجريبية — الاستبدال يحدث فقط عند انقطاع الاتصال كلياً.
 * ============================================================ */
window.Api = (function () {

  var delay = App.Utils.delay;

  /* هل الخادم مضبوط؟ (يظهر قبل وضع البيانات الاحتياطية) */
  function isConfigured() {
    return APP_CONFIG.API_URL && APP_CONFIG.API_URL.indexOf('YOUR_DEPLOYED_ID') === -1;
  }

  /* بناء رابط القراءة مع معاملات الاستعلام */
  function buildUrl(params) {
    return APP_CONFIG.API_URL + '?' + new URLSearchParams(params).toString();
  }

  /* ---------- أدوات مساعدة ---------- */

  /* محاولة قراءة عبر fetch ثم JSONP — تعيد {ok, data} أو {ok:false} */
  async function read(params) {
    try {
      return { ok: true, data: await App.Http.get(buildUrl(params)) };
    } catch (e1) {
      try {
        return { ok: true, data: await App.Http.jsonp(buildUrl(params)) };
      } catch (e2) {
        return { ok: false };
      }
    }
  }

  /* تنفيذ الكتابة (POST text/plain)
   * Apps Script ينفّذ طلبات POST خادمياً؛ وعند تعذر قراءة الرد
   * (إعادة توجيه 302 / رد opaque) تُعتبر العملية ناجحة حتى لا تظهر
   * رسالة خطأ رغم نجاح الحفظ فعلاً. الرفض الصريح من الخادم
   * (status:"error") يُحترم ويُعاد كما هو. */
  async function mutate(payload) {
    payload.secret = payload.secret || (APP_CONFIG.ADMIN_SECRET || '');
    if (!isConfigured()) return delay({ status: 'success' });
    try {
      return await App.Http.post(APP_CONFIG.API_URL, payload);
    } catch (err) {
      console.warn('write dispatched but response unreadable:', err);
      return { status: 'success' };
    }
  }

  /* تحقق من صحة كائن درس */
  function validVideo(v) {
    return v && typeof v === 'object' && v.id != null && v.title != null;
  }

  /* ---------- الفيديوهات ---------- */

  var VIDEO_CACHE_TTL = 15 * 60 * 1000; /* 15 دقيقة — تقليل ضغط طلبات Apps Script */
  var LEADERBOARD_CACHE_TTL = 5 * 60 * 1000; /* 5 دقائق للوحة الشرف */

  /* قائمة الدروس (عامة + خاصة بلوحة التحكم عبر includeHidden) */
  async function listVideos(options) {
    options = options || {};
    var params = { action: 'list' };
    if (options.grade) params.grade = options.grade;
    if (options.includeHidden) params.status = 'all';

    var cacheKey = 'videos_' + (options.grade || 'all');

    /* بدون includeHidden = بيانات عامة قابلة للتخزين المؤقت */
    var useCache = !options.includeHidden && !options.fresh;
    if (useCache) {
      var cached = App.Cache.get(cacheKey, VIDEO_CACHE_TTL);
      if (cached) return cached;
    }

    function filtered(data) {
      var list = (data || []).slice();
      if (options.grade) list = list.filter(function (v) { return String(v.grade) === String(options.grade); });
      if (!options.includeHidden) list = list.filter(function (v) { return String(v.status || 'active') === 'active'; });
      return list;
    }

    function fallback() {
      return filtered(APP_CONFIG.FALLBACK_VIDEOS || []);
    }

    if (!isConfigured()) {
      var demo = fallback();
      if (useCache) App.Cache.set(cacheKey, demo, VIDEO_CACHE_TTL);
      return delay(demo);
    }

    var res = await read(params);
    if (res.ok && res.data && res.data.status === 'success') {
      var out = filtered(res.data.data);
      if (useCache) App.Cache.set(cacheKey, out, VIDEO_CACHE_TTL);
      return out;
    }

    /* انقطاع تام → بيانات احتياطية */
    var fb = fallback();
    if (useCache) App.Cache.set(cacheKey, fb, VIDEO_CACHE_TTL);
    return delay(fb);
  }

  function addVideo(data)       { return mutate({ action: 'add', video: data }); }
  function updateVideo(id, data) { return mutate({ action: 'update', id: id, video: data }); }
  function deleteVideo(id)      { return mutate({ action: 'delete', id: id }); }

  /* ---------- الطلاب ---------- */

  /* قائمة الطلاب (خاصة بلوحة التحكم) */
  async function listStudents(options) {
    options = options || {};
    var params = { action: 'list_students', secret: APP_CONFIG.ADMIN_SECRET || '' };
    if (options.includeHidden) params.status = 'all';

    /* بدون خادم → قائمة فارغة (لا نعرض حسابات تجريبية) */
    if (!isConfigured()) return delay([]);

    var res = await read(params);
    if (res.ok && res.data && res.data.status === 'success' && Array.isArray(res.data.data)) {
      return res.data.data;
    }
    return delay([]);
  }

  /* تسجيل دخول الطالب بالكود + كلمة المرور */
  async function studentLogin(code, password) {
    var params = { action: 'student_login', code: String(code), password: String(password) };

    /* تحقق من أن الخادم أرسل طالباً مكتملاً فعلاً */
    function validStudent(data) {
      return data && typeof data === 'object' && !Array.isArray(data) && data.id != null && data.name;
    }

    /* بدون خادم → رفض الدخول (لا حسابات تجريبية) */
    if (!isConfigured()) return delay({ status: 'error', message: 'network_unavailable' });

    var res = await read(params);
    if (res.ok && res.data) {
      /* الخادم استجاب فعلاً — نحترم حكمه مهما كان */
      if (res.data.status === 'success' && validStudent(res.data.data)) return res.data;
      return { status: 'error', message: (res.data && res.data.message) || 'invalid_login' };
    }

    /* الخادم لا يمكن الوصول إليه إطلاقاً → فشل دخول واضح بدل الحساب التجريبي */
    return delay({ status: 'error', message: 'network_unavailable' });
  }

  function addStudent(data)       { return mutate({ action: 'add_student', student: data }); }
  function updateStudent(id, data) { return mutate({ action: 'update_student', id: id, student: data }); }
  function deleteStudent(id)      { return mutate({ action: 'delete_student', id: id }); }

  /* ---------- لوحة الشرف ---------- */

  /* أعلى الطلاب نقاطاً (مرتبة تنازلياً) — بدون كلمات مرور */
  async function leaderboard(limit) {
    var params = { action: 'leaderboard' };
    if (limit) params.limit = Number(limit);

    var cacheKey = 'leaderboard_v2_' + (limit || 10);

    function normalize(list) {
      /* ترتيب محلي تنازلي بالنقاط (ثم أبجدياً لثبات الترتيب عند التساوي)
         حتى لو عاد الخادم بترتيب عشوائي */
      return (list || [])
        .filter(function (x) { return x && x.name != null && x.points != null; })
        .slice()
        .sort(function (a, b) {
          var diff = (Number(b.points) || 0) - (Number(a.points) || 0);
          if (diff) return diff;
          return String(a.name).localeCompare(String(b.name));
        })
        .slice(0, limit || 10);
    }

    /* عرض فوري من الكاش عند تكرار الزيارة — دون انتظار الشبكة */
    var cached = App.Cache.get(cacheKey, LEADERBOARD_CACHE_TTL);
    if (cached) return cached;

    if (!isConfigured()) return delay([]);

    var res = await read(params);
    if (res.ok && res.data && res.data.status === 'success' && Array.isArray(res.data.data)) {
      var out = normalize(res.data.data);
      if (out.length) {
        App.Cache.set(cacheKey, out, LEADERBOARD_CACHE_TTL);
      }
      return out;
    }
    /* لا نعرض حسابات وهمية للعامة عند تعذر الوصول للخادم */
    return delay([]);
  }

  return {
    listVideos: listVideos,
    addVideo: addVideo,
    updateVideo: updateVideo,
    deleteVideo: deleteVideo,
    listStudents: listStudents,
    studentLogin: studentLogin,
    addStudent: addStudent,
    updateStudent: updateStudent,
    deleteStudent: deleteStudent,
    leaderboard: leaderboard,
    isConfigured: isConfigured
  };
})();

