/* ============================================================
 * النواة — طبقة واجهة المستخدم (window.UI)
 * نظام مكونات موحّد: إشعارات، مؤشر تحميل، كروت، حوارات تأكيد
 * كل المخرجات HTML آمنة (esc) وبتصميم موحّد عبر CSS Variables
 * ============================================================ */
window.UI = (function () {

  var esc = App.Utils.esc;

  /* ---------------------------------------------------------
   * الإشعارات (Toast)
   * --------------------------------------------------------- */
  var TOAST_CLS = {
    success: { icon: 'fa-check-circle', cls: 'toast-success' },
    error:   { icon: 'fa-exclamation-circle', cls: 'toast-error' },
    info:    { icon: 'fa-info-circle', cls: 'toast-info' }
  };

  function toast(message, type) {
    var t = TOAST_CLS[type] || TOAST_CLS.info;
    var container = document.getElementById('toast-container');
    if (!container) return;

    var el = document.createElement('div');
    el.className = 'toast ' + t.cls;
    el.setAttribute('role', 'status');
    el.innerHTML = '<i class="fas ' + t.icon + '"></i><span>' + esc(message) + '</span>';
    container.appendChild(el);

    /* إجبار إعادة التدفق ثم إظهار الحركة */
    void el.offsetWidth;
    el.classList.add('toast-show');

    setTimeout(function () {
      el.classList.remove('toast-show');
      setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); }, 300);
    }, 3200);
  }

  /* ---------------------------------------------------------
   * مؤشر التحميل العام (مع عدّاد لتوازن النداءات المتداخلة)
   * --------------------------------------------------------- */
  var loadCount = 0;

  function loading(show) {
    loadCount = Math.max(0, loadCount + (show ? 1 : -1));
    var el = document.getElementById('app-loader');
    if (!el) return;
    var on = loadCount > 0;
    el.style.display = on ? 'flex' : 'none';
    el.setAttribute('aria-hidden', on ? 'false' : 'true');
  }

  /* إعادة ضبط قسرية للمؤشر (حالة طوارئ) */
  function loadingReset() {
    loadCount = 0;
    var el = document.getElementById('app-loader');
    if (el) { el.style.display = 'none'; el.setAttribute('aria-hidden', 'true'); }
  }

  /* ---------------------------------------------------------
   * حوار التأكيد المخصص (بديل window.confirm)
   * يعيد Promise<boolean> — لا يقطع سلسلة الوعود
   * --------------------------------------------------------- */
  function confirmDialog(message, title) {
    return new Promise(function (resolve) {
      var overlay = document.createElement('div');
      overlay.className = 'modal-overlay';
      overlay.innerHTML =
        '<div class="modal modal-sm" role="dialog" aria-modal="true">' +
        '  <div class="modal-head"><h3>' + esc(title || 'تأكيد العملية') + '</h3></div>' +
        '  <div class="modal-body"><p>' + esc(message) + '</p></div>' +
        '  <div class="modal-foot">' +
        '    <button type="button" class="btn btn-ghost" data-c="no">إلغاء</button>' +
        '    <button type="button" class="btn btn-danger" data-c="yes">نعم، تأكيد</button>' +
        '  </div>' +
        '</div>';
      document.body.appendChild(overlay);

      function finish(result) {
        if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
        resolve(result);
      }
      overlay.addEventListener('click', function (e) {
        if (e.target === overlay) return finish(false);
        var c = e.target.closest('[data-c]');
        if (c) finish(c.getAttribute('data-c') === 'yes');
      });
      document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') finish(false);
      }, { once: true });
    });
  }

  /* ---------------------------------------------------------
   * حركات الظهور عند التمرير (IntersectionObserver)
   * يفحص العناصر [data-reveal] داخل جذر معيّن ويضيف "revealed"
   * عند دخولها للشاشة، ثم يحرر الطبقة (will-change) لتقليل الذاكرة
   * --------------------------------------------------------- */
  var revealObserver = null;

  function observeReveals(root) {
    if (!root || !root.querySelectorAll) root = document;
    var els = root.querySelectorAll('[data-reveal]');
    if (!els.length) return;

    /* خلفية أمان: بدون IntersectionObserver نُظهر العناصر فوراً */
    if (typeof IntersectionObserver === 'undefined') {
      Array.prototype.forEach.call(els, function (el) { el.classList.add('revealed'); });
      return;
    }

    if (!revealObserver) {
      revealObserver = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          var el = entry.target;
          el.classList.add('revealed');
          el.style.willChange = 'auto';
          revealObserver.unobserve(el);
        });
      }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    }

    Array.prototype.forEach.call(els, function (el) {
      if (!el.classList.contains('revealed')) revealObserver.observe(el);
    });
  }

  /* ---------------------------------------------------------
   * بطاقة درس قابلة لإعادة الاستخدام (صفحة الصف + صفحة الطالب)
   * --------------------------------------------------------- */
  function courseCard(v, fallbackImage) {
    var img = App.Media.thumbnail(v.youtubeUrl, fallbackImage);
    return '' +
      '<article class="course-card" data-reveal>' +
      '  <div class="course-thumb">' +
      '    <img src="' + esc(img) + '" alt="' + esc(v.title || '') + '" loading="lazy" decoding="async"' +
      '         onerror="this.onerror=null;this.src=\'' + esc(fallbackImage || './imgs/pr2/1.jpg') + '\'">' +
      (v.unit ? '    <span class="chip chip-unit">' + esc(v.unit) + '</span>' : '') +
      '    <span class="play-btn" aria-hidden="true"><i class="fas fa-play"></i></span>' +
      '  </div>' +
      '  <div class="course-body">' +
      '    <h3 class="course-title">' + esc(v.title || '') + '</h3>' +
      '    <a class="btn btn-primary btn-block" href="#/lesson/' + encodeURIComponent(v.id) + '">' +
      '      ابدأ المذاكرة <i class="fas fa-arrow-left"></i>' +
      '    </a>' +
      '  </div>' +
      '</article>';
  }

  /* شبكة كروت الدروس (تغليف grid موحّد) */
  function courseGrid(videos, fallbackImage) {
    if (!videos || videos.length === 0) return '';
    return '<div class="grid grid-3">' +
      videos.map(function (v) { return courseCard(v, fallbackImage); }).join('') +
      '</div>';
  }

  /* حالة فارغة موحّدة */
  function emptyState(icon, title, subtitle) {
    return '' +
      '<div class="empty-state">' +
      '  <i class="fas ' + esc(icon || 'fa-inbox') + '"></i>' +
      '  <h3>' + esc(title || 'لا توجد بيانات') + '</h3>' +
      (subtitle ? '  <p>' + esc(subtitle) + '</p>' : '') +
      '</div>';
  }

  /* عنوان قسم موحّد */
  function sectionHead(title, icon) {
    return '' +
      '<div class="section-head">' +
      '  <h2>' + (icon ? '<i class="fas ' + esc(icon) + '"></i> ' : '') + esc(title) + '</h2>' +
      '</div>';
  }

  /* بطاقة تسجيل دخول موحّدة (طالب/أدمن) */
  function loginCard(opts) {
    opts = opts || {};
    return '' +
      '<div class="auth-wrap">' +
      '  <div class="auth-card">' +
      '    <div class="auth-icon"><i class="fas ' + esc(opts.icon || 'fa-user-graduate') + '"></i></div>' +
      '    <h2>' + esc(opts.title || 'تسجيل الدخول') + '</h2>' +
      '    <p class="muted">' + esc(opts.subtitle || '') + '</p>' +
      opts.body +
      '  </div>' +
      '</div>';
  }

  /* صفحة خطأ موحّدة (يستخدمها الراوتر) */
  function errorPage(title, detail) {
    return '' +
      '<div class="state-page">' +
      '  <i class="fas fa-exclamation-triangle state-icon"></i>' +
      '  <h2>' + esc(title || 'حدث خطأ غير متوقع') + '</h2>' +
      (detail ? '  <p class="muted">' + esc(detail) + '</p>' : '') +
      '  <a class="btn btn-primary mt-4" href="#/">العودة للرئيسية</a>' +
      '</div>';
  }

  /* ---------------------------------------------------------
   * التوافق مع الدوال القديمة (تحافظ على الواجهة العامة)
   * --------------------------------------------------------- */
  function extractYouTubeId(input) { return App.Media.extractYouTubeId(input); }
  function youtubeIdFromUrl(url)   { return App.Media.extractYouTubeId(url); }
  function formatYouTubeEmbedURL(url) { return App.Media.formatYouTubeEmbedURL(url); }
  function toEmbedUrl(url)         { return App.Media.formatYouTubeEmbedURL(url); }
  function thumbnail(url, fallback) { return App.Media.thumbnail(url, fallback); }

  return {
    esc: esc,
    toast: toast,
    loading: loading,
    loadingReset: loadingReset,
    confirmDialog: confirmDialog,
    courseCard: courseCard,
    courseGrid: courseGrid,
    emptyState: emptyState,
    sectionHead: sectionHead,
    loginCard: loginCard,
    errorPage: errorPage,
    observeReveals: observeReveals,

    /* واجهة قديمة متوافقة */
    extractYouTubeId: extractYouTubeId,
    youtubeIdFromUrl: youtubeIdFromUrl,
    formatYouTubeEmbedURL: formatYouTubeEmbedURL,
    toEmbedUrl: toEmbedUrl,
    thumbnail: thumbnail
  };
})();
