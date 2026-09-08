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
