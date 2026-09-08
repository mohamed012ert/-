/* ============================================================
 * ملف مجمّع مُولَّد تلقائياً — لا تعدّله يدوياً.
 * عدّل المصادر في js/ ثم أعد إنشاءه: node tools/build.mjs
 * ============================================================ */
/* ==== js/config.js ==== */
/* ============================================================
 * الإعدادات العامة للتطبيق
 * عدّل القيم التالية حسب مشروعك قبل النشر النهائي
 * ============================================================ */
window.APP_CONFIG = {

  /* رابط Web App بعد نشر Google Apps Script كتطبيق ويب (وصول: أي شخص) */
  /* مثال: https://script.google.com/macros/s/AKfycb.../exec */
  API_URL: 'https://script.google.com/macros/s/AKfycbzjhslipZL3duA4wznE_leVY21jWBe8jTuu9Z9TiTdJ9XSwS-luBUQXDQcoEuFoxdM60w/exec',

  /* كلمة مرور الدخول إلى لوحة التحكم (غيّرها فوراً) */
  ADMIN_PASSWORD: '123456',

  /* مفتاح سري يُرسل مع كل عملية كتابة للخادم (يجب تطابقه مع Code.gs)
   * اتركه فارغاً لإيقاف التحقق أثناء التجربة */
  ADMIN_SECRET: '',

  SITE_NAME: 'المهندس محمد مصطفى',
  TAGLINE: 'منصة المهندس محمد مصطفى للعلوم المتكاملة والفيزياء',

  WHATSAPP_NUMBER: '201221122383',

  /* تفعيل/تعطيل لوحة الشرف (FAQ: اجعلها false لتعطيل القسم كلياً
   * دون أي اتصال بالخادم — الكود يبقى محفوظاً ويمكن إعادة تفعيله لاحقاً) */
  ENABLE_LEADERBOARD: false,

  /* المراحل الدراسية المعروضة في الموقع */
  GRADES: [
    {
      id: 's1',
      title: 'العلوم المتكاملة',
      subtitle: 'الصف الأول الثانوي',
      icon: 'fa-rocket',
      image: './imgs/pr2/1.jpg',
      placeholder: 'تأسيس قوي في الفيزياء والعلوم المتكاملة، شرح تفصيلي وتجارب عملية.'
    },
    {
      id: 's2',
      title: 'الفيزياء',
      subtitle: 'الصف الثاني الثانوي',
      icon: 'fa-microscope',
      image: './imgs/pr2/2.png',
      placeholder: 'محتوى متعمق، مسائل مستويات عليا (H.O.T.S)، وتجهيز للثانوية العامة.'
    }
  ],

  /* بيانات احتياطية تعمل بدون خادم، حتى يتم ضبط رابط Apps Script
   * وتضاف الدروس الفعلية من لوحة التحكم إلى Google Sheets */
  FALLBACK_VIDEOS: [
    {
      id: 1,
      grade: 's1',
      unit: 'الوحدة الأولى: الغلاف المائي',
      title: 'تأثير الضغط المائي على الكائنات الحية',
      description: 'شرح تفصيلي لتأثير الضغط المائي على الكائنات الحية مع أمثلة عملية وتجارب محاكاة.',
      youtubeUrl: 'https://www.youtube.com/embed/uqCxXJrE7rw?si=s3SWYTLO2yzpgmZF',
      pdfUrl: 'https://drive.google.com/file/d/1jNLjxptzAKkz-b0H2FBGGxEOshoU_M4w/view?usp=drivesdk',
      status: 'active',
      createdAt: '2025-01-01'
    },
    {
      id: 2,
      grade: 's1',
      unit: 'الوحدة الثانية: الغلاف الجوي',
      title: 'مكونات وطبقات الغلاف الجوي',
      description: 'شرح مكونات وطبقات الغلاف الجوي مع توضيح خصائص كل طبقة وأهميتها.',
      youtubeUrl: 'https://www.youtube.com/embed/6pu8_A0ks2Q?rel=0&modestbranding=1&playsinline=1',
      pdfUrl: 'https://drive.google.com/file/d/1jNLjxptzAKkz-b0H2FBGGxEOshoU_M4w/view?usp=drivesdk',
      status: 'active',
      createdAt: '2025-01-01'
    }
  ],

/* إعدادات الملف انتهت — لا توجد بيانات طلاب افتراضية.
 * الطلاب الحقيقيون يُدارون بالكامل من لوحة التحكم عبر Google Sheets. */
};


/* ==== js/core/utils.js ==== */
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

  /* تأخير وهمي قصير للبيانات الاحتياطية (يمنع وميض التبديل الفوري) */
  function delay(data, ms) {
    return new Promise(function (resolve) {
      setTimeout(function () { resolve(data); }, ms || 60);
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


/* ==== js/core/storage.js ==== */
/* ============================================================
 * النواة — طبقة تخزين آمنة (App.Storage)
 * تغليف sessionStorage / localStorage مع معالجة كاملة للأخطاء
 * (بعض المتصفحات/وضع التصفح الخاص يرفضان الكتابة أو القراءة)
 * ============================================================ */
window.App = window.App || {};

App.Storage = (function () {

  /* كيان التخزين الافتراضي: الجلسة (يُمسح بإغلاق التبويب) */
  var DEFAULT = 'session';

  function pick(kind) {
    try {
      return kind === 'local' ? window.localStorage : window.sessionStorage;
    } catch (e) {
      return null;
    }
  }

  /* قراءة قيمة (تُفك ترميز JSON) */
  function get(key, kind) {
    var store = pick(kind || DEFAULT);
    if (!store) return null;
    try {
      var raw = store.getItem(key);
      return raw == null ? null : App.Utils.safeParse(raw, null);
    } catch (e) {
      return null;
    }
  }

  /* كتابة قيمة (تُرمَّز JSON) — تعيد النجاح/الفشل */
  function set(key, value, kind) {
    var store = pick(kind || DEFAULT);
    if (!store) return false;
    try {
      store.setItem(key, JSON.stringify(value));
      return true;
    } catch (e) {
      return false;
    }
  }

  /* حذف مفتاح */
  function remove(key, kind) {
    var store = pick(kind || DEFAULT);
    if (!store) return;
    try { store.removeItem(key); } catch (e) { /* تجاهل */ }
  }

  /* قراءة قيمة نصية خام (بدون ترميز JSON) — لبعض المفاتيح القديمة */
  function getRaw(key, kind) {
    var store = pick(kind || DEFAULT);
    if (!store) return null;
    try { return store.getItem(key); } catch (e) { return null; }
  }

  return {
    get: get,
    set: set,
    remove: remove,
    getRaw: getRaw
  };
})();


/* ==== js/core/media.js ==== */
/* ============================================================
 * النواة — مساعدات الوسائط (App.Media)
 * معالجة روابط يوتيوب بكل صيغها + الصور المصغرة
 * تُستخرج المعرّف حتى من كود iframe كامل (خطأ YouTube 153)
 * ============================================================ */
window.App = window.App || {};

App.Media = (function () {

  /* استخراج معرّف فيديو من: iframe كامل / watch / youtu.be / embed / معرّف مجرد */
  function extractYouTubeId(input) {
    if (!input) return '';
    var s = String(input).trim();

    /* إذا كان كود iframe كاملاً → نستخرج قيمة src أولاً */
    var srcMatch = s.match(/<iframe[^>]+src=["']([^"']+)["']/i);
    if (srcMatch) s = srcMatch[1];

    /* الصيغ الشائعة لروابط يوتيوب */
    var regExp = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
    var match = s.match(regExp);
    if (match) return match[1];

    /* معرّف مجرد من 11 خانة */
    if (/^[\w-]{11}$/.test(s)) return s;

    return '';
  }

  /* استخراج معرّف ملف جوجل درايف من: iframe / file/d/ / open / uc /
     drive.usercontent / رابط تحميل / معرّف مجرد */
  function extractDriveId(input) {
    if (!input) return '';
    var s = String(input).trim();

    /* إذا كان كود iframe كاملاً → نستخرج قيمة src أولاً */
    var srcMatch = s.match(/<iframe[^>]+src=["']([^"']+)["']/i);
    if (srcMatch) s = srcMatch[1];

    /* الصيغ الشائعة لروابط جوجل درايف */
    var m = s.match(/(?:file\/d\/|[\?&]id=)([\w-]{25,52})/);
    if (m) return m[1];

    /* معرّف مجرد */
    if (/^[\w-]{25,52}$/.test(s)) return s;

    return '';
  }

  /* تصنيف الرابط: 'youtube' | 'drive' | '' */
  function detect(input) {
    if (extractYouTubeId(input)) return 'youtube';
    if (extractDriveId(input)) return 'drive';
    return '';
  }

  /* تحويل أي صيغة إلى رابط Embed آمن (youtube-nocookie) مع معاملات تشغيل آمنة */
  function formatYouTubeEmbedURL(url) {
    var videoId = extractYouTubeId(url);
    if (!videoId) return '';
    return 'https://www.youtube-nocookie.com/embed/' + videoId + '?rel=0&modestbranding=1';
  }

  /* رابط مشغّل جوجل درايف (preview) الذي يدعم تشغيل الفيديو داخل iframe */
  function formatDriveEmbedURL(url) {
    var fileId = extractDriveId(url);
    if (!fileId) return '';
    return 'https://drive.google.com/file/d/' + fileId + '/preview';
  }

  /* رابط تشغيل آمن تلقائياً حسب نوع المصدر (يوتيوب أو درايف) */
  function formatEmbedURL(url) {
    if (extractYouTubeId(url)) return formatYouTubeEmbedURL(url);
    return formatDriveEmbedURL(url);
  }

  /* رابط الصورة المصغرة الرسمية (مع صورة بديلة) */
  function thumbnail(url, fallbackImage) {
    var yId = extractYouTubeId(url);
    if (yId) return 'https://img.youtube.com/vi/' + yId + '/hqdefault.jpg';
    var dId = extractDriveId(url);
    if (dId) return 'https://drive.google.com/thumbnail?id=' + dId + '&sz=w400';
    return fallbackImage || './imgs/pr2/1.jpg';
  }

  return {
    extractYouTubeId: extractYouTubeId,
    extractDriveId: extractDriveId,
    detect: detect,
    formatYouTubeEmbedURL: formatYouTubeEmbedURL,
    formatDriveEmbedURL: formatDriveEmbedURL,
    formatEmbedURL: formatEmbedURL,
    thumbnail: thumbnail
  };
})();


/* ==== js/core/dom.js ==== */
/* ============================================================
 * النواة — أدوات DOM (App.Dom)
 * بناء عناصر + تفويض الأحداث (Event Delegation)
 *
 * التفويض على مستوى المستند يمنع تسريب الذاكرة: عند استبدال
 * innerHTML لا يبقى أي مستمع معلّق، لأن المستمعين مركزية على
 * document وترتبط بمنتقيات (data-action).
 * ============================================================ */
window.App = window.App || {};

App.Dom = (function () {

  /* إنشاء عنصر مع خصائصه ومحتواه الداخلي (اختياري) */
  function create(tag, attrs, html) {
    var el = document.createElement(tag);
    if (attrs) {
      Object.keys(attrs).forEach(function (key) {
        var val = attrs[key];
        if (key === 'class') el.className = val;
        else if (key === 'text') el.textContent = val;
        else el.setAttribute(key, val);
      });
    }
    if (html) el.innerHTML = html;
    return el;
  }

  /* حاوية الأحداث المركزية: action -> { selector: handler[] } */
  var actions = {};

  /* تسجيل معالج موحّد:
   *   UI.Delegate.on('click', '[data-action="delete"]', fn)
   * يُسجَّل مرة واحدة عند الإقلاع — كل الأزرار تُعلن عبر data-action */
  function on(event, selector, handler) {
    var key = event + '|' + selector;
    if (!actions[key]) {
      actions[key] = { selector: selector, handler: handler };
      document.addEventListener(event, function (e) {
        var el = e.target && e.target.closest ? e.target.closest(selector) : null;
        if (!el) return;
        var ctx = e.target;
        actions[key].handler.call(el, e, ctx);
      });
    } else {
      /* دمج معالجات متعددة على نفس المفتاح غير مدعوم — نستبدل بالآخر */
      actions[key].handler = handler;
    }
  }

  /* إزالة مستمع مركزية واحدة (تُستخدم في willUnmount للراوتر) */
  function off(event, selector) {
    delete actions[event + '|' + selector];
  }

  return {
    create: create,
    on: on,
    off: off
  };
})();


/* ==== js/core/ui.js ==== */
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
  var loadStudent = false;

  function loading(show, opts) {
    loadCount = Math.max(0, loadCount + (show ? 1 : -1));
    var el = document.getElementById('app-loader');
    if (!el) return;
    if (opts && typeof opts.student === 'boolean') loadStudent = opts.student;
    var on = loadCount > 0;
    el.style.display = on ? 'flex' : 'none';
    el.setAttribute('aria-hidden', on ? 'false' : 'true');
    el.setAttribute('data-student', on && loadStudent ? '1' : '0');
  }

  /* إعادة ضبط قسرية للمؤشر (حالة طوارئ) */
  function loadingReset() {
    loadCount = 0;
    loadStudent = false;
    var el = document.getElementById('app-loader');
    if (el) { el.style.display = 'none'; el.setAttribute('aria-hidden', 'true'); el.setAttribute('data-student', '0'); }
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
  function formatEmbedURL(url)     { return App.Media.formatEmbedURL(url); }
  function toEmbedUrl(url)         { return App.Media.formatEmbedURL(url); }
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
    formatEmbedURL: formatEmbedURL,
    toEmbedUrl: toEmbedUrl,
    thumbnail: thumbnail
  };
})();


/* ==== js/core/router.js ==== */
/* ============================================================
 * النواة — الموجّه (window.Router)
 * SPA Router يعمل بنظام Hash (#/) ليعمل على أي استضافة ثابتة
 *
 * دورة حياة الصفحة:
 *   view.render(params) -> string | Promise<string>   (رسم)
 *   view.mount(el, params)                            (ربط الأحداث)
 *   view.willUnmount()                                 (تنظيف اختياري)
 *
 * مزايا:
 *   - حدود أخطاء (Error Boundary) لا تُسقط التطبيق
 *   - تنظيف الصفحة السابقة قبل رسم الجديدة (يمنع تسريب الذاكرة)
 * ============================================================ */
window.Router = {
  routes: [],
  notFound: null,
  _activeView: null,

  register: function (pattern, view) {
    this.routes.push({ pattern: pattern, view: view });
  },

  setNotFound: function (view) {
    this.notFound = view;
  },

  /* تحليل الهاش الحالي إلى مسار + معاملات استعلام */
  parse: function () {
    var raw = (location.hash || '').replace(/^#\/?/, '/');
    var parts = raw.split('?');
    var path = parts[0] || '/';
    var query = {};
    if (parts[1]) {
      parts[1].split('&').forEach(function (pair) {
        if (!pair) return;
        var kv = pair.split('=');
        query[decodeURIComponent(kv[0])] = decodeURIComponent(kv[1] || '');
      });
    }
    return { path: path, query: query };
  },

  /* مطابقة نمط مثل '/lesson/:id' */
  match: function (pattern, path) {
    var keys = [];
    var regexStr = '^' + pattern.replace(/:([\w]+)/g, function (_, k) {
      keys.push(k);
      return '([^/]+)';
    }) + '$';
    var m = new RegExp(regexStr).exec(path);
    if (!m) return null;
    var params = {};
    keys.forEach(function (k, i) { params[k] = decodeURIComponent(m[i + 1]); });
    return params;
  },

  resolve: async function () {
    var parsed = this.parse();
    var matched = null, params = null;

    for (var i = 0; i < this.routes.length; i++) {
      params = this.match(this.routes[i].pattern, parsed.path);
      if (params) { matched = this.routes[i]; break; }
    }
    if (!matched && this.notFound) matched = { view: this.notFound };
    if (!matched) return;

    var merged = Object.assign({}, params, parsed.query);
    await this.render(matched.view, merged);
  },

  render: async function (view, params) {
    var app = document.getElementById('app');
    if (!app) return;

    /* تنظيف الصفحة السابقة قبل رسم الجديدة (يمنع تسريب المستمعين) */
    if (this._activeView && typeof this._activeView.willUnmount === 'function') {
      try { this._activeView.willUnmount(); } catch (e) { console.warn('willUnmount error', e); }
    }

    /* اللودر العام يظهر فقط للصفحات غير المتزامنة (تحتاج شبكة) —
       الصفحات المتزامنة (الرئيسية/الأداء) تُرسم فوراً دون أي وميض */
    var result = view.render(params);
    var isAsync = !!(result && typeof result.then === 'function');
    if (isAsync) UI.loading(true);

    try {
      var html = isAsync ? await result : result;
      app.innerHTML = html;

      var title = APP_CONFIG.SITE_NAME;
      if (view.title) {
        title = (typeof view.title === 'function' ? view.title(params) : view.title) + ' | ' + APP_CONFIG.SITE_NAME;
      }
      document.title = title;

      this.highlight();
      window.scrollTo(0, 0);

      this._activeView = view;
      if (typeof view.mount === 'function') await view.mount(app, params);
      UI.observeReveals(app);
    } catch (err) {
      console.error(err);
      app.innerHTML = UI.errorPage('حدث خطأ غير متوقع', 'تأكد من اتصالك بالإنترنت ثم حاول مرة أخرى.');
    } finally {
      UI.loading(false);
    }
  },

  /* إبراز الرابط النشط في شريط التنقل */
  highlight: function () {
    var current = (location.hash || '').replace(/^#/, '') || '/';
    var links = document.querySelectorAll('[data-nav]');
    if (!links || !links.forEach) return;
    links.forEach(function (link) {
      var target = link.getAttribute('data-nav');
      var active = current === target || (target !== '/' && current.indexOf(target) === 0);
      link.classList.toggle('active', active);
    });
  },

  start: function () {
    window.addEventListener('hashchange', () => this.resolve());
    this.resolve();
  },

  go: function (path) {
    location.hash = '#/' + String(path).replace(/^\/+/, '');
  }
};


/* ==== js/core/splash.js ==== */
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
    /* تُخفى بعد ~1.6 ثانية من اكتمال التحميل — مدة متوازنة تتيح مشاهدة
       أنيميشن الترحيب دون إبطاء دخول الطالب للمحتوى */
    var wait = Math.max(0, 1600 - (Date.now() - start));
    setTimeout(hide, wait);
  }

  if (document.readyState === 'complete') {
    schedule();
  } else {
    window.addEventListener('load', schedule);
  }

  /* مهلة قصوى احتياطية (لا تُبقى الشاشة حاجبة الصفحة أبداً) */
  setTimeout(hide, 3000);
})();

