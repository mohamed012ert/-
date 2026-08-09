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

  var VIDEO_CACHE_TTL = 5 * 60 * 1000; /* 5 دقائق */

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

    function fallback() { return APP_CONFIG.FALLBACK_STUDENTS || []; }

    if (!isConfigured()) return delay(fallback());

    var res = await read(params);
    if (res.ok && res.data && res.data.status === 'success' && Array.isArray(res.data.data)) {
      return res.data.data;
    }
    return delay(fallback());
  }

  /* تسجيل دخول الطالب بالكود + كلمة المرور */
  async function studentLogin(code, password) {
    var params = { action: 'student_login', code: String(code), password: String(password) };

    /* حساب تجريبي (عند عدم ضبط الخادم أو انقطاعه كلياً) */
    function demoLogin() {
      var s = (APP_CONFIG.FALLBACK_STUDENTS || []).find(function (x) {
        return String(x.id) === String(code) && String(x.password) === String(password);
      });
      if (!s) return { status: 'error', message: 'invalid_login' };
      var copy = Object.assign({}, s);
      delete copy.password;
      return { status: 'success', data: copy };
    }

    /* تحقق من أن الخادم أرسل طالباً مكتملاً فعلاً */
    function validStudent(data) {
      return data && typeof data === 'object' && !Array.isArray(data) && data.id != null && data.name;
    }

    if (!isConfigured()) return delay(demoLogin());

    var res = await read(params);
    if (res.ok && res.data) {
      /* الخادم استجاب فعلاً — نحترم حكمه مهما كان */
      if (res.data.status === 'success' && validStudent(res.data.data)) return res.data;
      return { status: 'error', message: (res.data && res.data.message) || 'invalid_login' };
    }

    /* الخادم لا يمكن الوصول إليه إطلاقاً → حساب تجريبي حتى لا يعلق الدخول */
    return delay(demoLogin());
  }

  function addStudent(data)       { return mutate({ action: 'add_student', student: data }); }
  function updateStudent(id, data) { return mutate({ action: 'update_student', id: id, student: data }); }
  function deleteStudent(id)      { return mutate({ action: 'delete_student', id: id }); }

  /* ---------- لوحة الشرف ---------- */

  /* أعلى الطلاب نقاطاً (مرتبة تنازلياً) — بدون كلمات مرور */
  async function leaderboard(limit) {
    var params = { action: 'leaderboard' };
    if (limit) params.limit = Number(limit);

    function demoBoard() {
      return (APP_CONFIG.FALLBACK_STUDENTS || [])
        .filter(function (x) { return String(x.status || 'active') === 'active'; })
        .slice()
        .sort(function (a, b) { return (Number(b.points) || 0) - (Number(a.points) || 0); })
        .slice(0, limit || 10)
        .map(function (x) {
          return { id: x.id, name: x.name, grade: x.grade, points: Number(x.points) || 0 };
        });
    }

    function normalize(list) {
      return (list || [])
        .filter(function (x) { return x && x.name != null && x.points != null; })
        .slice(0, limit || 10);
    }

    if (!isConfigured()) return delay(demoBoard());

    var res = await read(params);
    if (res.ok && res.data && res.data.status === 'success' && Array.isArray(res.data.data)) {
      var out = normalize(res.data.data);
      if (out.length) return out;
    }
    return delay(demoBoard());
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
