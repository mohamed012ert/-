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

  /* تحويل أي صيغة إلى رابط Embed آمن (youtube-nocookie) مع معاملات تشغيل آمنة */
  function formatYouTubeEmbedURL(url) {
    var videoId = extractYouTubeId(url);
    if (!videoId) return '';
    return 'https://www.youtube-nocookie.com/embed/' + videoId + '?rel=0&modestbranding=1';
  }

  /* رابط الصورة المصغرة الرسمية (مع صورة بديلة) */
  function thumbnail(url, fallbackImage) {
    var id = extractYouTubeId(url);
    return id ? 'https://img.youtube.com/vi/' + id + '/hqdefault.jpg' : (fallbackImage || './imgs/pr2/1.jpg');
  }

  return {
    extractYouTubeId: extractYouTubeId,
    formatYouTubeEmbedURL: formatYouTubeEmbedURL,
    thumbnail: thumbnail
  };
})();
