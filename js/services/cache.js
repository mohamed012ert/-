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
