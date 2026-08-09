/* ============================================================
 * نقطة إقلاع الموقع الرئيسي
 * تسجيل المسارات + شريط التنقل + بدء الموجّه
 * ============================================================ */
(function () {
  /* مسارات التطبيق */
  Router.register('/', HomeView);
  Router.register('/grade/:grade', GradeView);
  Router.register('/lesson/:id', LessonView);
  Router.register('/student', StudentView);
  Router.setNotFound(HomeView);

  /* زر القائمة في شاشات الموبايل (عنصر دائم — يُربط مرة واحدة) */
  var toggle = document.getElementById('nav-toggle');
  var links = document.getElementById('nav-links');
  if (toggle && links) {
    toggle.addEventListener('click', function () {
      links.classList.toggle('open');
    });
    document.addEventListener('click', function (e) {
      if (links.classList.contains('open') &&
          !links.contains(e.target) &&
          e.target !== toggle &&
          !toggle.contains(e.target)) {
        links.classList.remove('open');
      }
    });
  }

  /* بدء التنقّل */
  Router.start();
})();
