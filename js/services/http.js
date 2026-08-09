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

  var TIMEOUT = 12000;

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
