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
