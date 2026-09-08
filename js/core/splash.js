/* ============================================================
 * شاشة الترحيب (Splash)
 *
 * - تغطي الصفحة لحظة التحميل وتعرض اللوجو + اسم المنصة + مؤشر تحميل
 * - تُخفى فور اكتمال window.load (أو بعد مهلة قصوى) بحركة
 *   opacity + transform فقط (أداء عالٍ، بدون إعادة تخطيط)
 * - تُحذف من DOM نهائياً بعد انتهاء حركة الخروج
 * ============================================================ */
(function () {
  function hide() {
    var el = document.getElementById('splash-screen');
    if (!el || el.dataset.done) return;
    el.dataset.done = '1';
    el.classList.add('splash-leave');
    setTimeout(function () {
      if (el.parentNode) el.parentNode.removeChild(el);
    }, 500);
  }

  var start = Date.now();
  function schedule() {
    /* تُخفى بعد أقل من ثانية من اكتمال التحميل — ترحيب سريع
       دون إبقاء المستخدم منتظراً خلف شاشة حاجبة */
    var wait = Math.max(0, 600 - (Date.now() - start));
    setTimeout(hide, wait);
  }

  if (document.readyState === 'complete') {
    schedule();
  } else {
    window.addEventListener('load', schedule);
  }

  /* مهلة قصوى احتياطية (لا تُبقى الشاشة حاجبة الصفحة أبداً) */
  setTimeout(hide, 1600);
})();
