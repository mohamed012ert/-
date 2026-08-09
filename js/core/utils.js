/* ============================================================
 * النواة — أدوات مساعدة عامة (App.Utils)
 * دوال نقية (Pure) قابلة لإعادة الاستخدام، بلا أي اعتماد على DOM
 * ============================================================ */
window.App = window.App || {};

App.Utils = (function () {

  /* هروب النصوص لمنع حقن HTML (XSS) */
  function esc(str) {
    if (str == null) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  /* تحويل نص JSON إلى كائن بأمان (بدون إلقاء استثناء) */
  function safeParse(json, fallback) {
    try {
      var v = JSON.parse(json);
      return v == null ? fallback : v;
    } catch (e) {
      return fallback;
    }
  }

  /* تقييد القيمة بين حدّين */
  function clamp(num, min, max) {
    num = Number(num) || 0;
    return Math.min(max, Math.max(min, num));
  }

  /* معرّف فريد قصير (للأسماء المؤقتة والمفاتيح) */
  function uid(prefix) {
    return (prefix || 'id') + '_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 7);
  }

  /* تأخير تنفيذ متكرر حتى يتوقف النداء (للبحث/التحميل الخلفي) */
  function debounce(fn, wait) {
    var timer = null;
    return function () {
      var ctx = this, args = arguments;
      clearTimeout(timer);
      timer = setTimeout(function () { fn.apply(ctx, args); }, wait || 250);
    };
  }

  /* تأخير وهمي للبيانات الاحتياطية (يحاكي زمن الشبكة) */
  function delay(data, ms) {
    return new Promise(function (resolve) {
      setTimeout(function () { resolve(data); }, ms || 350);
    });
  }

  return {
    esc: esc,
    safeParse: safeParse,
    clamp: clamp,
    uid: uid,
    debounce: debounce,
    delay: delay
  };
})();
