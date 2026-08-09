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
