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
