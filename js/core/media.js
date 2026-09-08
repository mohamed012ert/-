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
