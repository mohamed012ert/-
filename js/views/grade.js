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

    /* الطالب المسجّل: لا توجد صفحة منفصلة له — صفحته الموحّدة
       (الإحصائيات + المحتوى) هي وجهته الوحيدة دائماً */
    Router.go('/student');
    return '<div class="state-page"><div class="spinner"></div><p class="muted">جارِ تحميل صفحتك...</p></div>';
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
