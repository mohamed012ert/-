/* ============================================================
 * ملف مجمّع مُولَّد تلقائياً — لا تعدّله يدوياً.
 * عدّل المصادر في js/ ثم أعد إنشاءه: node tools/build.mjs
 * ============================================================ */
/* ==== js/views/home.js ==== */
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
      '    <p class="teacher-bio">خبرة في تبسيط أعقد المسائل وربطها بالواقع العملي.<br>' +
      '    <strong>شعارنا:</strong> الفهم أولاً.. والدرجة النهائية نتيجة حتمي.</p>' +
      '    <a class="btn btn-whatsapp btn-lg" href="https://wa.me/' + esc(APP_CONFIG.WHATSAPP_NUMBER) + '" target="_blank" rel="noopener">' +
      '      تواصل معنا الآن <i class="fab fa-whatsapp"></i>' +
      '    </a>' +
      '  </div>' +
      '</div>';

    /* ---------- 3) لوحة الشرف (قابلة للتفعيل عبر ENABLE_LEADERBOARD —
       الكود محفوظ لكنه لا يُرسم ولا يتصل بالخادم عند التعطيل) ---------- */
    var leaderboard = APP_CONFIG.ENABLE_LEADERBOARD ? (
      '<div class="container">' +
      UI.sectionHead('لوحة الشرف', 'fa-trophy') +
      '  <p class="center muted small" style="margin-bottom:20px;">أعلى الطلاب تميزاً حسب إجمالي النقاط</p>' +
      '  <div class="leaderboard" id="lb-list"></div>' +
      '</div>'
    ) : '';

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

    /* لوحة الشرف — لا تُحمَّل من الخادم إطلاقاً عند التعطيل */
    if (!APP_CONFIG.ENABLE_LEADERBOARD) return;

    try {
      var students = await Api.leaderboard(10);
      var box = el.querySelector('#lb-list');
      if (box) {
        if (students && students.length) {
          box.innerHTML = HomeView._leaderboardRows(students);
        } else {
          box.innerHTML = '<p class="center muted small" style="padding:24px;">لا توجد بيانات معروضة بعد — ستظهر الأسماء عند إضافة طلاب حقيقيين من لوحة التحكم.</p>';
        }
      }
    } catch (e) { /* تجاهل */ }
  }
};


/* ==== js/views/grade.js ==== */
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


/* ==== js/views/lesson.js ==== */
/* ============================================================
 * صفحة الدرس (LessonView)
 * مشغل فيديو آمن (youtube-nocookie) + إجراءات الدرس
 *
 * التحكم بالوصول:
 *   - بلا جلسة: طلب تسجيل دخول
 *   - طالب صف آخر: منع + ربط بصفه
 *   - جلسة أدمن: معاينة كل الدروس
 * ============================================================ */
window.LessonView = {
  title: function () { return 'درس الفيديو'; },

  render: async function (params) {
    var isAdmin = App.Session.isAdmin();
    var session = App.Session.getStudent();

    /* جلب النطاق المناسب فقط:
       - الأدمن: كل الدروس (بما فيها المخفية) للمعاينة
       - الطالب: دروس صفه من الكاش (عرض أسرع بكثير)
       - الزائر: الدروس المنشورة عامة */
    var videos = await Api.listVideos(isAdmin
      ? { includeHidden: true }
      : (session ? { grade: session.grade } : {}));

    var video = videos.find(function (v) { return String(v.id) === String(params.id); });

    /* الكاش قد يكون قديماً ولا يضم درساً جديداً → طلب طازج مرة واحدة */
    if (!video && session && !isAdmin) {
      videos = await Api.listVideos({ grade: session.grade, fresh: true });
      video = videos.find(function (v) { return String(v.id) === String(params.id); });
    }

    if (!video) {
      return '' +
        '<div class="state-page">' +
        '  <i class="fas fa-question-circle state-icon"></i>' +
        '  <h2>الدرس غير متاح</h2>' +
        '  <p class="muted">هذا الدرس غير موجود أو أُزيل، أو ليس ضمن دروس صفك.</p>' +
        '  <a class="btn btn-primary mt-4" href="#/">العودة للرئيسية</a>' +
        '</div>';
    }

    if (!isAdmin) {
      if (!session) {
        return '' +
          '<div class="state-page">' +
          '  <i class="fas fa-lock state-icon" style="color:var(--amber)"></i>' +
          '  <h2>هذا الدرس يتطلب تسجيل دخول</h2>' +
          '  <p class="muted">سجّل دخولك لمشاهدة دروس صفك أولاً.</p>' +
          '  <a class="btn btn-primary mt-4" href="#/grade/' + UI.esc(video.grade || 's1') + '">تسجيل الدخول <i class="fas fa-sign-in-alt"></i></a>' +
          '</div>';
      }
      if (String(session.grade) !== String(video.grade)) {
        var myGrade = (APP_CONFIG.GRADES || []).find(function (g) { return g.id === String(session.grade); });
        return '' +
          '<div class="state-page">' +
          '  <i class="fas fa-exclamation-triangle state-icon" style="color:var(--red)"></i>' +
          '  <h2>هذا الدرس ليس من صفك</h2>' +
          '  <p class="muted">المحتوى موزّع حسب الصف الدراسي.</p>' +
          '  <a class="btn btn-primary mt-4" href="#/grade/' + UI.esc(session.grade) + '">' + UI.esc(myGrade ? myGrade.subtitle : 'صفّي') + ' <i class="fas fa-arrow-left"></i></a>' +
          '</div>';
      }
    }

    var embed = UI.formatEmbedURL(video.youtubeUrl);

    var pdfBtn = video.pdfUrl ? '' +
      '<a class="btn btn-pdf btn-block" href="' + UI.esc(video.pdfUrl) + '" target="_blank" rel="noopener">' +
      '  <i class="fas fa-file-pdf"></i> تحميل المذكرة (PDF)' +
      '</a>' : '';

    return '' +
      '<div class="lesson-page">' +
      '  <header class="lesson-head">' +
      '    <div class="lesson-title-row">' +
      '      <i class="fas fa-bolt lesson-title-icon"></i>' +
      '      <h1>' + UI.esc(video.title) + '</h1>' +
      '    </div>' +
      (video.unit ? '    <span class="chip chip-unit">' + UI.esc(video.unit) + '</span>' : '') +
      '  </header>' +

      '  <div class="lesson-layout">' +
      '    <main class="lesson-main">' +
      '      <div class="video-container">' +
      '        <iframe src="' + embed + '" title="' + UI.esc(video.title) + '" frameborder="0"' +
      '                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"' +
      '                allowfullscreen loading="lazy"></iframe>' +
      '      </div>' +
      (video.description ? '      <div class="lesson-desc"><p>' + UI.esc(video.description) + '</p></div>' : '') +
      '    </main>' +

      '    <aside class="lesson-aside">' +
      '      <div class="panel">' +
      '        <h3 class="panel-title"><i class="fas fa-tasks"></i> إجراءات الدرس</h3>' +
      pdfBtn +
      '        <a class="btn btn-whatsapp btn-block" href="https://wa.me/' + UI.esc(APP_CONFIG.WHATSAPP_NUMBER) + '" target="_blank" rel="noopener">' +
      '          <i class="fab fa-whatsapp"></i> طرح سؤال على المهندس' +
      '        </a>' +
      '        <a class="btn btn-ghost btn-block" href="#/grade/' + UI.esc(video.grade || 's1') + '">' +
      '          <i class="fas fa-arrow-right"></i> العودة للدروس' +
      '        </a>' +
      '      </div>' +
      '    </aside>' +
      '  </div>' +
      '</div>';
  }
};


/* ==== js/views/student.js ==== */
/* ============================================================
 * صفحة الطالب (StudentView)
 * تسجيل دخول بالكود وكلمة المرور + عرض الأداء في صفحة واحدة:
 *   الإحصائيات (نقاط/غياب/واجب) وفوق أسفلها دروس الصف مباشرة
 *
 * العرض الفوري: من بيانات الجلسة والكاش المحلي، ثم تحديث خلفي
 * من الخادم دون إعادة تحميل الصفحة.
 * ============================================================ */
window.StudentView = {
  title: 'صفحة الطالب',

  /* ---------- الجلسة ---------- */
  _getSession: function () { return App.Session.getStudent(); },
  _setSession: function (code, password, student) { return App.Session.setStudent(code, password, student); },
  _clearSession: function () { App.Session.clearStudent(); },

  /* ---------- الكاش المحلي (مشارك مع قوائم Api) ---------- */
  _cacheKey: function (grade) { return 'videos_' + grade; },
  _loadCache: function (grade) { return App.Cache.get(this._cacheKey(grade)); },
  _saveCache: function (grade, videos) { App.Cache.set(this._cacheKey(grade), videos); },

  render: function () {
    var s = this._getSession();
    if (!s) return this.loginHTML();

    var videos = this._loadCache(s.grade);
    var hasCache = !!videos;
    return this._profileHTML(s, videos || [], !hasCache);
  },

  mount: function (el) {
    if (this._getSession()) {
      this._bindProfile(el);
      return this._refresh(el);
    }
    this.bindLogin(el);
  },

  /* ---------- بطاقة تسجيل الدخول (قابلة لإعادة الاستخدام من صفحة الصف) ---------- */
  loginHTML: function (gradeLabel) {
    return UI.loginCard({
      icon: 'fa-user-graduate',
      title: gradeLabel || 'صفحة الطالب',
      subtitle: 'سجّل دخولك لمشاهدة الدروس',
      body: '' +
        '<input type="text" id="s-code" class="input" placeholder="كود الطالب" autocomplete="username">' +
        '<input type="password" id="s-password" class="input" placeholder="كلمة المرور" autocomplete="current-password">' +
        '<button id="s-login-btn" class="btn btn-primary btn-block btn-lg">دخول <i class="fas fa-sign-in-alt"></i></button>'
    });
  },

  /* نموذج الدخول — بعد النجاح ينتقل فوراً لصفحة عرض الأداء */
  bindLogin: function (el, onSuccess) {
    var code = el.querySelector('#s-code');
    var pass = el.querySelector('#s-password');
    var btn = el.querySelector('#s-login-btn');
    if (!code || !pass || !btn) return;

    function doLogin() {
      if (!code.value.trim() || !pass.value.trim()) {
        UI.toast('أدخل الكود وكلمة المرور', 'error');
        return;
      }
      UI.loading(true);
      return Api.studentLogin(code.value.trim(), pass.value.trim()).then(function (result) {
        if (result && result.status === 'success' && result.data) {
          StudentView._setSession(code.value.trim(), pass.value.trim(), result.data);
          UI.toast('مرحباً ' + result.data.name, 'success');
          if (typeof onSuccess === 'function') onSuccess(result.data);
          else Router.go('/student');
        } else {
          UI.toast('الكود أو كلمة المرور غير صحيحة', 'error');
        }
      }).catch(function () {
        UI.toast('تعذر الاتصال بالخادم', 'error');
      }).finally(function () {
        UI.loading(false);
      });
    }

    btn.addEventListener('click', doLogin);
    pass.addEventListener('keydown', function (e) { if (e.key === 'Enter') doLogin(); });
    code.focus();
  },

  /* ---------- صفحة عرض الأداء (إحصائيات + دروس في صفحة واحدة) ---------- */
  _profileHTML: function (st, videos, showLoading) {
    var gradeLabel = 'أولى ثانوي';
    var gradeImage = './imgs/pr2/1.jpg';
    var g = (APP_CONFIG.GRADES || []).find(function (x) { return x.id === String(st.grade); });
    if (g) { gradeLabel = g.subtitle; gradeImage = g.image; }

    var lessons;
    if (showLoading) {
      lessons = '<div class="skeleton-list">' + UI.skeletonCards(3) + '</div>';
    } else if (!videos || videos.length === 0) {
      lessons = UI.emptyState('fa-inbox', 'لا توجد دروس منشورة في صفك بعد.');
    } else {
      lessons = UI.courseGrid(videos, gradeImage);
    }

    return '' +
      '<section class="student-hero">' +
      '  <div class="container">' +
      '    <div class="student-avatar" id="s-avatar">' + UI.esc(String(st.name || '؟').trim().charAt(0) || '؟') + '</div>' +
      '    <h1 id="s-name">' + UI.esc(st.name || 'طالب') + '</h1>' +
      '    <div class="student-chips">' +
      '      <span class="chip chip-light">' + UI.esc(gradeLabel) + '</span>' +
      '      <span class="chip chip-light" id="s-code-chip">الكود: ' + UI.esc(st.id != null ? st.id : st.code) + '</span>' +
      '    </div>' +
      '  </div>' +
      '</section>' +

      '<div class="container section-block">' +
      '  <div class="student-stats">' +
      '    <div class="stat-tile tile-points" data-reveal><i class="fas fa-star"></i><strong id="stat-points">' + Number(st.points || 0) + '</strong><span>النقاط</span></div>' +
      '    <div class="stat-tile tile-abs" data-reveal><i class="fas fa-calendar-times"></i><strong id="stat-abs">' + Number(st.absences || 0) + '</strong><span>مرات الغياب</span></div>' +
      '    <div class="stat-tile tile-hw" data-reveal><i class="fas fa-book"></i><strong id="stat-hw">' + Number(st.homework || 0) + '</strong><span>واجب لم يُسلَّم</span></div>' +
      '  </div>' +
      '  <div class="student-note"><i class="fas fa-info-circle"></i> هذه البيانات تُحدَّث من قِبل معلمك مباشرة.</div>' +

      '  <div class="student-lessons-label"><i class="fas fa-book-open"></i> دروس الصف</div>' +
      '  <div id="lesson-list">' + lessons + '</div>' +

      '  <div class="row-actions">' +
      '    <button class="btn btn-ghost" id="s-logout-btn"><i class="fas fa-sign-out-alt"></i> تسجيل الخروج</button>' +
      '  </div>' +
      '</div>';
  },

  _bindProfile: function (el) {
    var btn = el.querySelector('#s-logout-btn');
    if (btn) {
      btn.addEventListener('click', function () {
        StudentView._clearSession();
        Router.resolve();
      });
    }
  },

  /* تحديث خلفي: إحصائيات + دروس في مكانها دون إعادة تحميل */
  _refresh: function (el) {
    var s = this._getSession();
    if (!s) return Promise.resolve();

    return Api.studentLogin(s.code, s.password).then(function (result) {
      if (!result || result.status !== 'success' || !result.data) {
        StudentView._clearSession();
        Router.resolve();
        return;
      }
      var st = result.data;

      /* تحديث الجلسة والواجهة بأحدث البيانات */
      StudentView._setSession(s.code, s.password, st);

      var pts = el.querySelector('#stat-points');
      var abs = el.querySelector('#stat-abs');
      var hw = el.querySelector('#stat-hw');
      var nameEl = el.querySelector('#s-name');
      var avatar = el.querySelector('#s-avatar');
      var codeChip = el.querySelector('#s-code-chip');
      if (pts) pts.textContent = Number(st.points || 0);
      if (abs) abs.textContent = Number(st.absences || 0);
      if (hw) hw.textContent = Number(st.homework || 0);
      if (nameEl) nameEl.textContent = st.name || 'طالب';
      if (avatar) avatar.textContent = String(st.name || '؟').trim().charAt(0) || '؟';
      if (codeChip) codeChip.textContent = 'الكود: ' + (st.id != null ? st.id : s.code);

      /* جلب الدروس الطازجة وتخزينها في الكاش */
      return Api.listVideos({ grade: st.grade, fresh: true });
    }).then(function (videos) {
      if (!videos) return;
      var st2 = StudentView._getSession();
      if (!st2) return;
      StudentView._saveCache(st2.grade, videos);

      var list = el.querySelector('#lesson-list');
      if (!list) return;
      var gradeImage = './imgs/pr2/1.jpg';
      var g = (APP_CONFIG.GRADES || []).find(function (x) { return x.id === String(st2.grade); });
      if (g) gradeImage = g.image;

      if (!videos.length) {
        list.innerHTML = UI.emptyState('fa-inbox', 'لا توجد دروس منشورة في صفك بعد.');
      } else {
        list.innerHTML = UI.courseGrid(videos, gradeImage);
      }
    }).catch(function (e) {
      /* نُبقي البيانات الحالية المعروضة — لا نُسقط الصفحة */
      console.warn('refresh failed', e);
    });
  }
};

/* ---------- مساعدات عرض (إضافية داخل UI عبر الصقل) ---------- */
(function () {
  /* هيكل عظمي (Skeleton) للكروت أثناء التحميل الخلفي */
  UI.skeletonCards = function (n) {
    var cards = '';
    for (var i = 0; i < (n || 3); i++) {
      cards += '' +
        '<div class="course-card skeleton-card">' +
        '  <div class="skeleton skeleton-img"></div>' +
        '  <div class="course-body"><div class="skeleton skeleton-line"></div><div class="skeleton skeleton-btn"></div></div>' +
        '</div>';
    }
    return '<div class="grid grid-3">' + cards + '</div>';
  };
})();


/* ==== js/app.js ==== */
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

