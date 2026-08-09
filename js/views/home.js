/* ============================================================
 * الصفحة الرئيسية (HomeView)
 *
 * التصميم: عرض فوري (متزامن) للهيكل والترحيب، ثم تُحمَّل لوحة
 * الشرف في الخلفية دون حجب. الترتيب: البانر ← المدرس ← لوحة
 * الشرف ← المراحل الدراسية
 * ============================================================ */
window.HomeView = {
  title: 'الرئيسية',

  render: function () {
    var esc = UI.esc;

    /* ---------- 1) البانر الترحيبي ---------- */
    var banner =
      '<section class="hero-section">' +
      '  <div class="hero-blob hero-blob-1"></div>' +
      '  <div class="hero-blob hero-blob-2"></div>' +
      '  <div class="container">' +
      '    <div class="hero-content">' +
      '      <h1>أهلاً بك في منصة <span class="hero-accent">المهندس محمد مصطفى</span></h1>' +
      '      <p class="hero-tagline">' + esc(APP_CONFIG.TAGLINE) + '</p>' +
      '      <p class="hero-quote">"الفهم أولاً.. والدرجة النهائية نتيجة حتمية"</p>' +
      '  <div class="hero-cta">' +
      '    <a class="btn btn-primary btn-lg" href="#/?goto=teacher">تعرف على المدرس <i class="fas fa-user-tie"></i></a>' +
      '    <a class="btn btn-outline btn-lg" href="#/student">تسجيل الدخول <i class="fas fa-sign-in-alt"></i></a>' +
      '  </div>' +
      '    </div>' +
      '  </div>' +
      '</section>' +

      '<div class="container">' +
      UI.sectionHead('نظام العمل', 'fa-cogs') +
      '  <div class="features-grid">' +
      '    <div class="feature-item" data-reveal><div class="feature-icon"><i class="fas fa-video"></i></div><div><h4>شرح بجودة 4K</h4><p class="muted small">صوت وصورة وتجارب محاكاة.</p></div></div>' +
      '    <div class="feature-item" data-reveal><div class="feature-icon"><i class="fas fa-file-alt"></i></div><div><h4>بنك أسئلة ضخم</h4><p class="muted small">تدريبات من كافة المصادر الموثوقة.</p></div></div>' +
      '    <div class="feature-item" data-reveal><div class="feature-icon"><i class="fas fa-stopwatch"></i></div><div><h4>امتحانات أسبوعية</h4><p class="muted small">نظام تصحيح إلكتروني فوري.</p></div></div>' +
      '    <div class="feature-item" data-reveal><div class="feature-icon"><i class="fas fa-comments"></i></div><div><h4>متابعة دورية</h4><p class="muted small">تواصل مباشر مع الطالب وولي الأمر.</p></div></div>' +
      '  </div>' +
      '</div>';

    /* ---------- 2) التعريف بالمدرس ---------- */
    var teacher =
      '<div class="container" id="teacher-section">' +
      UI.sectionHead('عن المدرس', 'fa-user-graduate') +
      '  <div class="teacher-floating-card" data-reveal="scale">' +
      '    <div class="teacher-img-wrapper">' +
      '      <img src="./imgs/1.jpg" alt="Eng. Mohamed" class="teacher-img" loading="lazy" decoding="async" onerror="this.src=\'https://cdn-icons-png.flaticon.com/512/3135/3135715.png\'">' +
      '    </div>' +
      '    <h2 class="teacher-name">م/ محمد مصطفى</h2>' +
      '    <span class="badge-title">Electrical Power Engineer ⚡</span>' +
      '    <p class="teacher-bio">خبرة في تبسيط أعقد المسائل الفيزيائية وربطها بالواقع العملي.<br>' +
      '    <strong>شعارنا:</strong> الفيزياء مش حفظ، الفيزياء حياة.</p>' +
      '    <a class="btn btn-whatsapp btn-lg" href="https://wa.me/' + esc(APP_CONFIG.WHATSAPP_NUMBER) + '" target="_blank" rel="noopener">' +
      '      تواصل معنا الآن <i class="fab fa-whatsapp"></i>' +
      '    </a>' +
      '  </div>' +
      '</div>';

    /* ---------- 3) لوحة الشرف (تُملأ في الخلفية) ---------- */
    var leaderboard =
      '<div class="container">' +
      UI.sectionHead('لوحة الشرف', 'fa-trophy') +
      '  <p class="center muted small" style="margin-bottom:20px;">أعلى الطلاب تميزاً حسب إجمالي النقاط</p>' +
      '  <div class="leaderboard" id="lb-list"></div>' +
      '</div>';

    /* ---------- 4) المراحل الدراسية ---------- */
    var grades = (APP_CONFIG.GRADES || []).map(function (g) {
      return '' +
        '<article class="info-card" data-reveal>' +
        '  <span class="card-icon"><i class="fas ' + esc(g.icon) + '"></i></span>' +
        '  <h3>' + esc(g.subtitle) + '</h3>' +
        '  <p>' + esc(g.placeholder) + '</p>' +
        '  <a class="btn btn-primary" href="#/grade/' + esc(g.id) + '">' +
        '    دخول ومشاهدة الدروس <i class="fas fa-arrow-left"></i>' +
        '  </a>' +
        '</article>';
    }).join('');

    var gradesSection =
      '<div class="container">' +
      UI.sectionHead('المراحل الدراسية', 'fa-graduation-cap') +
      '  <div class="grid-cards">' + grades + '</div>' +
      '</div>';

    return banner + teacher + leaderboard + gradesSection;
  },

  /* صفوف لوحة الشرف مع الميداليات */
  _leaderboardRows: function (students) {
    var medals = ['fa-crown', 'fa-medal', 'fa-award'];
    return (students || []).map(function (s, i) {
      var rank = i + 1;
      var gradeLabel = 'أولى ثانوي';
      var g = (APP_CONFIG.GRADES || []).find(function (x) { return x.id === String(s.grade); });
      if (g) gradeLabel = g.subtitle;

      return '' +
        '<div class="lb-row ' + (i < 3 ? 'top' : '') + '" data-reveal>' +
        '  <span class="lb-rank">' + (i < 3 ? '<i class="fas ' + medals[i] + '"></i>' : rank) + '</span>' +
        '  <span class="lb-avatar">' + UI.esc(String(s.name || '؟').trim().charAt(0) || '؟') + '</span>' +
        '  <span class="lb-name">' + UI.esc(s.name || 'طالب') + '<em class="muted small">' + UI.esc(gradeLabel) + '</em></span>' +
        '  <span class="lb-points"><i class="fas fa-star"></i> ' + Number(s.points || 0) + '</span>' +
        '</div>';
    }).join('');
  },

  /* تحميل لوحة الشرف في الخلفية دون حجب عرض الصفحة */
  mount: async function (el, params) {
    if (params && params.goto === 'teacher') {
      setTimeout(function () {
        var s = document.getElementById('teacher-section');
        if (s) s.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }

    /* لوحة الشرف */
    try {
      var students = await Api.leaderboard(10);
      var box = el.querySelector('#lb-list');
      if (box && students && students.length) {
        box.innerHTML = HomeView._leaderboardRows(students);
      }
    } catch (e) { /* تجاهل */ }
  }
};
