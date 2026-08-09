/* ============================================================
 * صفحة الصف الدراسي (GradeView)
 * التدفق: الرئيسية ← اختيار الصف ← تسجيل دخول الطالب ← دروس صفه
 *
 * - بدون جلسة: بطاقة تسجيل دخول
 * - بجلسة: تحديث بيانات الطالب من الخادم ثم عرض دروس صفه فقط
 * - الطالب الذي يفتح صفاً آخر يُعاد توجيهه تلقائياً لصفّه
 * ============================================================ */
window.GradeView = {
  title: function (params) {
    var g = (APP_CONFIG.GRADES || []).find(function (x) { return x.id === params.grade; });
    return g ? g.title : 'الصف الدراسي';
  },

  render: async function (params) {
    var grades = APP_CONFIG.GRADES || [];
    var grade = grades.find(function (g) { return g.id === params.grade; }) || grades[0];

    /* غير مسجّل دخول → بطاقة تسجيل الدخول */
    var session = App.Session.getStudent();
    if (!session) {
      return StudentView.loginHTML(grade ? grade.subtitle : '');
    }

    /* تحديث بيانات الطالب من الخادم (قد يكون الطالب موقوفاً) */
    var result = await Api.studentLogin(session.code, session.password);
    if (!result || result.status !== 'success' || !result.data) {
      App.Session.clearStudent();
      return StudentView.loginHTML(grade ? grade.subtitle : '');
    }
    var student = result.data;

    /* الطالب يرى دروس صفه فقط */
    if (grade && String(student.grade) !== String(grade.id)) {
      Router.go('/grade/' + encodeURIComponent(student.grade));
      return '<div class="state-page"><div class="spinner"></div><p class="muted">جارِ التحويل إلى صفك...</p></div>';
    }

    var videos = await Api.listVideos({ grade: grade.id });
    var cards = UI.courseGrid(videos, grade.image);

    var empty = videos.length === 0 ? UI.emptyState('fa-inbox', 'لا توجد دروس منشورة بعد في هذا الصف.', 'ترقّب قريباً...') : '';

    return '' +
      '<section class="page-hero">' +
      '  <div class="container">' +
      '    <h1>' + UI.esc(grade.title) + ' <span class="accent">' + UI.esc(grade.subtitle) + '</span></h1>' +
      '    <p>أهلاً ' + UI.esc(student.name) + ' — رحلتك نحو التفوق تبدأ من هنا</p>' +
      '  </div>' +
      '</section>' +

      '<div class="container section-block">' +
      UI.sectionHead('دروس ' + grade.subtitle, 'fa-book-open') +
      empty +
      cards +
      '  <div class="row-actions">' +
      '    <a class="btn btn-primary" href="#/student"><i class="fas fa-chart-line"></i> عرض أدائي</a>' +
      '    <button class="btn btn-ghost" id="grade-logout-btn"><i class="fas fa-sign-out-alt"></i> تسجيل الخروج</button>' +
      '  </div>' +
      '</div>';
  },

  mount: function (el) {
    /* بدون جلسة → نموذج الدخول (يجب ربطه هنا) */
    if (!App.Session.getStudent()) {
      StudentView.bindLogin(el);
      return;
    }
    var btn = el.querySelector('#grade-logout-btn');
    if (btn) {
      btn.addEventListener('click', function () {
        App.Session.clearStudent();
        Router.go('/');
      });
    }
  }
};
