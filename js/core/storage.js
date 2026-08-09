/* ============================================================
 * النواة — طبقة تخزين آمنة (App.Storage)
 * تغليف sessionStorage / localStorage مع معالجة كاملة للأخطاء
 * (بعض المتصفحات/وضع التصفح الخاص يرفضان الكتابة أو القراءة)
 * ============================================================ */
window.App = window.App || {};

App.Storage = (function () {

  /* كيان التخزين الافتراضي: الجلسة (يُمسح بإغلاق التبويب) */
  var DEFAULT = 'session';

  function pick(kind) {
    try {
      return kind === 'local' ? window.localStorage : window.sessionStorage;
    } catch (e) {
      return null;
    }
  }

  /* قراءة قيمة (تُفك ترميز JSON) */
  function get(key, kind) {
    var store = pick(kind || DEFAULT);
    if (!store) return null;
    try {
      var raw = store.getItem(key);
      return raw == null ? null : App.Utils.safeParse(raw, null);
    } catch (e) {
      return null;
    }
  }

  /* كتابة قيمة (تُرمَّز JSON) — تعيد النجاح/الفشل */
  function set(key, value, kind) {
    var store = pick(kind || DEFAULT);
    if (!store) return false;
    try {
      store.setItem(key, JSON.stringify(value));
      return true;
    } catch (e) {
      return false;
    }
  }

  /* حذف مفتاح */
  function remove(key, kind) {
    var store = pick(kind || DEFAULT);
    if (!store) return;
    try { store.removeItem(key); } catch (e) { /* تجاهل */ }
  }

  /* قراءة قيمة نصية خام (بدون ترميز JSON) — لبعض المفاتيح القديمة */
  function getRaw(key, kind) {
    var store = pick(kind || DEFAULT);
    if (!store) return null;
    try { return store.getItem(key); } catch (e) { return null; }
  }

  return {
    get: get,
    set: set,
    remove: remove,
    getRaw: getRaw
  };
})();
