/* ============================================================
 * لوحة التحكم (AdminView)
 * نظرة عامة + إدارة الدروس (إضافة/تعديل/حذف) + إدارة الطلاب
 * + عدّادات سريعة (+/−) للنقاط والغياب والواجبات
 * ============================================================ */
window.AdminView = {
  title: 'لوحة التحكم',

  _videos: [],
  _students: [],
  _editingId: null,
  _editingStudentId: null,
  _tab: 'overview',

  isAuthed: function () {
    return App.Session.isAdmin();
  },

  render: async function () {
    if (!this.isAuthed()) return this._loginHTML();
    return this._dashboardHTML();
  },

  mount: function (el) {
    if (!this.isAuthed()) { this._bindLogin(el); return; }
    this._bindDashboard(el);
  },

  /* ---------- تسجيل الدخول ---------- */
  _loginHTML: function () {
    return UI.loginCard({
      icon: 'fa-lock',
      title: 'لوحة التحكم',
      subtitle: 'أدخل كلمة المرور للمتابعة',
      body: '' +
        '<input type="password" id="admin-password" class="input" placeholder="كلمة المرور" autocomplete="current-password">' +
        '<button id="admin-login-btn" class="btn btn-primary btn-block btn-lg">دخول <i class="fas fa-sign-in-alt"></i></button>'
    });
  },

  _bindLogin: function (el) {
    var input = el.querySelector('#admin-password');
    var btn = el.querySelector('#admin-login-btn');
    if (!input || !btn) return;

    function tryLogin() {
      if (input.value === APP_CONFIG.ADMIN_PASSWORD) {
        App.Session.setAdmin(true);
        UI.toast('مرحباً بك في لوحة التحكم', 'success');
        Router.resolve();
      } else {
        UI.toast('كلمة المرور غير صحيحة', 'error');
        input.value = '';
        input.focus();
      }
    }

    btn.addEventListener('click', tryLogin);
    input.addEventListener('keydown', function (e) { if (e.key === 'Enter') tryLogin(); });
    input.focus();
  },

  /* ---------- هيكل لوحة التحكم ---------- */
  _dashboardHTML: function () {
    return '' +
      '<div class="admin-shell">' +
      '  <aside class="admin-sidebar">' +
      '    <div class="sidebar-brand"><i class="fas fa-atom"></i><span>لوحة التحكم</span></div>' +
      '    <nav class="admin-nav">' +
      '      <button class="admin-nav-item" data-tab="overview"><i class="fas fa-tachometer-alt"></i> نظرة عامة</button>' +
      '      <button class="admin-nav-item" data-tab="videos"><i class="fas fa-video"></i> الفيديوهات</button>' +
      '      <button class="admin-nav-item" data-tab="students"><i class="fas fa-user-graduate"></i> الطلاب</button>' +
      '      <a class="admin-nav-item" href="./index.html" target="_blank"><i class="fas fa-globe"></i> عرض الموقع</a>' +
      '    </nav>' +
      '    <button class="btn btn-danger-outline logout-btn" id="admin-logout"><i class="fas fa-sign-out-alt"></i> تسجيل الخروج</button>' +
      '  </aside>' +
      '  <main class="admin-main" id="admin-main"></main>' +
      '</div>' +

      /* نافذة فيديو */
      '<div id="video-modal" class="modal-overlay hidden">' +
      '  <div class="modal" role="dialog" aria-modal="true">' +
      '    <div class="modal-head">' +
      '      <h3 id="modal-title">إضافة فيديو جديد</h3>' +
      '      <button class="modal-close" data-close-modal aria-label="إغلاق"><i class="fas fa-times"></i></button>' +
      '    </div>' +
      '    <form id="video-form">' +
      '      <input type="hidden" id="f-id">' +
      '      <div class="form-grid">' +
      '        <div class="field span-2"><label>عنوان الدرس *</label>' +
      '          <input id="f-title" class="input" required placeholder="مثال: تأثير الضغط المائي على الكائنات الحية"></div>' +
      '        <div class="field"><label>الصف *</label>' +
      '          <select id="f-grade" class="input" required><option value="">اختر الصف</option><option value="s1">الصف الأول الثانوي</option><option value="s2">الصف الثاني الثانوي</option></select></div>' +
      '        <div class="field"><label>الوحدة</label>' +
      '          <input id="f-unit" class="input" placeholder="مثال: الوحدة الأولى: الغلاف المائي"></div>' +
      '        <div class="field span-2"><label>رابط يوتيوب *</label>' +
      '          <input id="f-youtube" class="input" required placeholder="https://www.youtube.com/watch?v=..."></div>' +
      '        <div class="field span-2"><label>رابط المذكرة (PDF) — اختياري</label>' +
      '          <input id="f-pdf" class="input" placeholder="https://drive.google.com/file/d/.../view"></div>' +
      '        <div class="field span-2"><label>الوصف</label>' +
      '          <textarea id="f-description" class="input" rows="3" placeholder="وصف مختصر للدرس"></textarea></div>' +
      '        <div class="field span-2"><label class="check-label"><input type="checkbox" id="f-status" checked> <span>الفيديو منشور (ظاهر للطلاب)</span></label></div>' +
      '      </div>' +
      '      <div class="modal-foot">' +
      '        <button type="button" class="btn btn-ghost" data-close-modal>إلغاء</button>' +
      '        <button type="submit" class="btn btn-primary"><i class="fas fa-save"></i> حفظ</button>' +
      '      </div>' +
      '    </form>' +
      '  </div>' +
      '</div>' +

      /* نافذة طالب */
      '<div id="student-modal" class="modal-overlay hidden">' +
      '  <div class="modal" role="dialog" aria-modal="true">' +
      '    <div class="modal-head">' +
      '      <h3 id="s-modal-title">إضافة طالب جديد</h3>' +
      '      <button class="modal-close" data-close-student aria-label="إغلاق"><i class="fas fa-times"></i></button>' +
      '    </div>' +
      '    <form id="student-form">' +
      '      <div class="form-grid">' +
      '        <div class="field"><label>كود الطالب</label><input id="f-s-code" class="input" disabled></div>' +
      '        <div class="field"><label>الصف</label>' +
      '          <select id="f-s-grade" class="input"><option value="s1">الصف الأول الثانوي</option><option value="s2">الصف الثاني الثانوي</option></select></div>' +
      '        <div class="field"><label>الاسم *</label><input id="f-s-name" class="input" required placeholder="اسم الطالب"></div>' +
        '        <div class="field"><label>كلمة المرور</label><input id="f-s-password" class="input" placeholder="كلمة مرور دخول الطالب" autocomplete="off"></div>' +
      '        <div class="field"><label>النقاط</label><input id="f-s-points" class="input" type="number" min="0" value="0"></div>' +
      '        <div class="field"><label>مرات الغياب</label><input id="f-s-absences" class="input" type="number" min="0" value="0"></div>' +
      '        <div class="field"><label>مرات عدم تسليم الواجب</label><input id="f-s-homework" class="input" type="number" min="0" value="0"></div>' +
      '        <div class="field span-2"><label class="check-label"><input type="checkbox" id="f-s-status" checked> <span>الطالب نشط (يستطيع تسجيل الدخول)</span></label></div>' +
      '      </div>' +
      '      <div class="modal-foot">' +
      '        <button type="button" class="btn btn-ghost" data-close-student>إلغاء</button>' +
      '        <button type="submit" class="btn btn-primary"><i class="fas fa-save"></i> حفظ</button>' +
      '      </div>' +
      '    </form>' +
      '  </div>' +
      '</div>';
  },

  /* ---------- ربط الأحداث ---------- */
  _bindDashboard: async function (el) {
    var logout = el.querySelector('#admin-logout');
    if (logout) {
      logout.addEventListener('click', function () {
        App.Session.setAdmin(false);
        Router.resolve();
      });
    }

    el.querySelectorAll('.admin-nav-item[data-tab]').forEach(function (btn) {
      btn.addEventListener('click', function () { AdminView.showTab(btn.getAttribute('data-tab')); });
    });

    this._bindVideoModal(el);
    this._bindStudentModal(el);

    await Promise.all([this._loadVideos(), this._loadStudents()]);
    this.showTab(this._tab);
  },

  _bindVideoModal: function (el) {
    var modal = el.querySelector('#video-modal');
    if (!modal) return;
    el.querySelectorAll('[data-close-modal]').forEach(function (b) {
      b.addEventListener('click', function () { AdminView.closeModal(); });
    });
    modal.addEventListener('click', function (e) {
      if (e.target === modal) AdminView.closeModal();
    });
    var form = el.querySelector('#video-form');
    if (form) form.addEventListener('submit', function (e) { AdminView._onSave(e); });
  },

  _bindStudentModal: function (el) {
    var modal = el.querySelector('#student-modal');
    if (!modal) return;
    el.querySelectorAll('[data-close-student]').forEach(function (b) {
      b.addEventListener('click', function () { AdminView._closeStudentModal(); });
    });
    modal.addEventListener('click', function (e) {
      if (e.target === modal) AdminView._closeStudentModal();
    });
    var form = el.querySelector('#student-form');
    if (form) form.addEventListener('submit', function (e) { AdminView._onStudentSave(e); });
  },

  /* ---------- تحميل البيانات ---------- */
  _loadVideos: async function () {
    try {
      this._videos = await Api.listVideos({ includeHidden: true });
      this._videos.sort(function (a, b) { return Number(b.id) - Number(a.id); });
    } catch (err) {
      console.error(err);
      UI.toast('تعذر تحميل الدروس', 'error');
      this._videos = [];
    }
  },

  _loadStudents: async function () {
    try {
      this._students = await Api.listStudents({ includeHidden: true });
      this._students.sort(function (a, b) { return Number(b.id) - Number(a.id); });
    } catch (err) {
      console.error(err);
      this._students = [];
    }
  },

  /* ---------- التبويبات ---------- */
  showTab: function (tab) {
    this._tab = tab;
    var main = document.getElementById('admin-main');
    if (!main) return;

    document.querySelectorAll('.admin-nav-item[data-tab]').forEach(function (b) {
      b.classList.toggle('active', b.getAttribute('data-tab') === tab);
    });

    if (tab === 'overview') {
      main.innerHTML = this._overviewHTML();
    } else if (tab === 'students') {
      main.innerHTML = this._studentsHTML();
      this._bindStudents();
    } else {
      main.innerHTML = this._videosHTML();
      this._bindVideos();
    }
  },

  _overviewHTML: function () {
    var v = this._videos;
    var active = v.filter(function (x) { return String(x.status || 'active') === 'active'; });
    var s1 = v.filter(function (x) { return String(x.grade) === 's1'; }).length;
    var s2 = v.filter(function (x) { return String(x.grade) === 's2'; }).length;

    var banner = Api.isConfigured() ? '' :
      '<div class="api-warning"><i class="fas fa-info-circle"></i> وضع العرض التوضيحي: لم يتم ضبط رابط الخادم بعد، لذلك التعديلات لا تُحفظ بشكل دائم.</div>';

    var recent = v.slice(0, 5).map(function (x) {
      return '' +
        '<li class="recent-item">' +
        '  <img src="' + UI.thumbnail(x.youtubeUrl) + '" alt="" loading="lazy">' +
        '  <div><strong>' + UI.esc(x.title) + '</strong><span class="muted small">' + UI.esc(x.unit || '') + '</span></div>' +
        '  <span class="status-dot ' + (String(x.status || 'active') === 'active' ? 'on' : 'off') + '"></span>' +
        '</li>';
    }).join('') || '<li class="muted">لا توجد دروس بعد.</li>';

    return '' +
      banner +
      UI.sectionHead('نظرة عامة', 'fa-tachometer-alt') +
      '<div class="stats-grid">' +
      '  <div class="stat-card"><i class="fas fa-video"></i><div><strong>' + v.length + '</strong><span>إجمالي الدروس</span></div></div>' +
      '  <div class="stat-card"><i class="fas fa-eye"></i><div><strong>' + active.length + '</strong><span>منشورة</span></div></div>' +
      '  <div class="stat-card"><i class="fas fa-graduation-cap"></i><div><strong>' + s1 + '</strong><span>أولى ثانوي</span></div></div>' +
      '  <div class="stat-card"><i class="fas fa-microscope"></i><div><strong>' + s2 + '</strong><span>ثانية ثانوي</span></div></div>' +
      '  <div class="stat-card"><i class="fas fa-user-graduate"></i><div><strong>' + this._students.length + '</strong><span>الطلاب</span></div></div>' +
      '</div>' +
      '<div class="panel"><h3 class="panel-title">أحدث الدروس</h3><ul class="recent-list">' + recent + '</ul></div>';
  },

  /* ---------- إدارة الدروس ---------- */
  _videosHTML: function () {
    var rows = this._videos.map(function (x) {
      var statusOn = String(x.status || 'active') === 'active';
      return '' +
        '<tr>' +
        '  <td data-label="المعاينة"><img class="thumb" src="' + UI.thumbnail(x.youtubeUrl) + '" alt="" loading="lazy" onerror="this.src=\'./imgs/pr2/1.jpg\'"></td>' +
        '  <td data-label="العنوان"><strong>' + UI.esc(x.title) + '</strong><div class="muted small">' + UI.esc(x.unit || '') + '</div></td>' +
        '  <td data-label="الصف"><span class="chip ' + (String(x.grade) === 's2' ? 'chip-blue' : 'chip-cyan') + '">' + (String(x.grade) === 's2' ? 'ثانية' : 'أولى') + '</span></td>' +
        '  <td data-label="الحالة">' + (statusOn ? '<span class="chip chip-green">منشور</span>' : '<span class="chip chip-gray">مخفي</span>') + '</td>' +
        '  <td data-label="إجراءات" class="row-actions">' +
        '    <button class="icon-btn primary" data-act="view" data-id="' + x.id + '" title="معاينة"><i class="fas fa-eye"></i></button>' +
        '    <button class="icon-btn warning" data-act="edit" data-id="' + x.id + '" title="تعديل"><i class="fas fa-edit"></i></button>' +
        '    <button class="icon-btn danger" data-act="del" data-id="' + x.id + '" title="حذف"><i class="fas fa-trash"></i></button>' +
        '  </td>' +
        '</tr>';
    }).join('');

    var emptyRow = this._videos.length === 0 ?
      '<tr><td colspan="5" class="muted center" style="padding:40px;">لا توجد دروس — أضف أول درس الآن.</td></tr>' : '';

    return '' +
      '<div class="table-head">' +
      '  <h2 class="admin-title">الفيديوهات <span class="count-pill">' + this._videos.length + '</span></h2>' +
      '  <button class="btn btn-primary" id="add-video-btn"><i class="fas fa-plus"></i> إضافة فيديو</button>' +
      '</div>' +
      '<div class="panel table-panel">' +
      '  <table class="data-table"><thead><tr><th>المعاينة</th><th>العنوان</th><th>الصف</th><th>الحالة</th><th>إجراءات</th></tr></thead>' +
      '  <tbody>' + rows + emptyRow + '</tbody></table>' +
      '</div>';
  },

  _bindVideos: function () {
    var main = document.getElementById('admin-main');
    if (!main) return;
    var addBtn = main.querySelector('#add-video-btn');
    if (addBtn) addBtn.addEventListener('click', function () { AdminView.openModal(); });

    main.querySelectorAll('button[data-act]').forEach(function (btn) {
      var id = btn.getAttribute('data-id');
      var act = btn.getAttribute('data-act');
      if (act === 'edit') btn.addEventListener('click', function () { AdminView.openModal(id); });
      else if (act === 'del') btn.addEventListener('click', function () { AdminView._confirmDelete(id); });
      else if (act === 'view') btn.addEventListener('click', function () { window.open('./index.html#/lesson/' + encodeURIComponent(id), '_blank'); });
    });
  },

  openModal: function (id) {
    this._editingId = id || null;
    var modal = document.getElementById('video-modal');
    if (!modal) return;

    var v = id ? this._videos.find(function (x) { return String(x.id) === String(id); }) : null;

    document.getElementById('modal-title').textContent = v ? 'تعديل الفيديو' : 'إضافة فيديو جديد';
    document.getElementById('f-id').value = v ? v.id : '';
    document.getElementById('f-title').value = v ? v.title || '' : '';
    document.getElementById('f-grade').value = v ? v.grade || 's1' : '';
    document.getElementById('f-unit').value = v ? v.unit || '' : '';
    document.getElementById('f-youtube').value = v ? v.youtubeUrl || '' : '';
    document.getElementById('f-pdf').value = v ? v.pdfUrl || '' : '';
    document.getElementById('f-description').value = v ? v.description || '' : '';
    document.getElementById('f-status').checked = !v || String(v.status || 'active') === 'active';

    modal.classList.remove('hidden');
    setTimeout(function () { var t = document.getElementById('f-title'); if (t) t.focus(); }, 50);
  },

  closeModal: function () {
    var modal = document.getElementById('video-modal');
    if (modal) modal.classList.add('hidden');
  },

  _onSave: async function (e) {
    e.preventDefault();

    var data = {
      title: document.getElementById('f-title').value.trim(),
      grade: document.getElementById('f-grade').value,
      unit: document.getElementById('f-unit').value.trim(),
      youtubeUrl: document.getElementById('f-youtube').value.trim(),
      pdfUrl: document.getElementById('f-pdf').value.trim(),
      description: document.getElementById('f-description').value.trim(),
      status: document.getElementById('f-status').checked ? 'active' : 'hidden'
    };

    if (!data.title || !data.grade || !data.youtubeUrl) {
      UI.toast('يرجى تعبئة الحقول المطلوبة (*)', 'error');
      return;
    }

    UI.loading(true);
    try {
      var res;
      if (this._editingId) {
        res = await Api.updateVideo(this._editingId, data);
      } else {
        res = await Api.addVideo(data);
      }
      if (!res || res.status !== 'success') {
        UI.toast('فشلت العملية — حاول مرة أخرى', 'error');
        return;
      }
      UI.toast(this._editingId ? 'تم تحديث الدرس بنجاح' : 'تمت إضافة الدرس بنجاح', 'success');
      this.closeModal();
      this._editingId = null;
      await this._loadVideos();
      this.showTab('videos');
    } catch (err) {
      console.error(err);
      UI.toast('فشلت العملية — تحقق من الاتصال بالخادم', 'error');
    } finally {
      UI.loading(false);
    }
  },

  _confirmDelete: async function (id) {
    var v = this._videos.find(function (x) { return String(x.id) === String(id); });
    var ok = await UI.confirmDialog('هل أنت متأكد من حذف الدرس:\n' + (v ? v.title : ''), 'حذف درس');
    if (!ok) return;

    UI.loading(true);
    try {
      await Api.deleteVideo(id);
      UI.toast('تم حذف الدرس', 'success');
      await this._loadVideos();
      this.showTab('videos');
    } catch (err) {
      console.error(err);
      UI.toast('فشل الحذف', 'error');
    } finally {
      UI.loading(false);
    }
  },

  /* ---------- إدارة الطلاب ---------- */
  _studentsHTML: function () {
    var rows = this._students.map(function (x) {
      var statusOn = String(x.status || 'active') === 'active';
      return '' +
        '<tr>' +
        '  <td data-label="الكود"><strong>' + UI.esc(x.id) + '</strong></td>' +
        '  <td data-label="الاسم"><strong>' + UI.esc(x.name) + '</strong></td>' +
        '  <td data-label="الصف"><span class="chip ' + (String(x.grade) === 's2' ? 'chip-blue' : 'chip-cyan') + '">' + (String(x.grade) === 's2' ? 'ثانية' : 'أولى') + '</span></td>' +
        '  <td data-label="النقاط" class="q-cell">' + AdminView._qGroup(x, 'points') + '</td>' +
        '  <td data-label="الغياب" class="q-cell">' + AdminView._qGroup(x, 'absences') + '</td>' +
        '  <td data-label="الواجب" class="q-cell">' + AdminView._qGroup(x, 'homework') + '</td>' +
        '  <td data-label="الحالة">' + (statusOn ? '<span class="chip chip-green">نشط</span>' : '<span class="chip chip-gray">موقوف</span>') + '</td>' +
        '  <td data-label="إجراءات" class="row-actions">' +
        '    <button type="button" class="icon-btn warning" data-act="edit-s" data-id="' + x.id + '" title="تعديل"><i class="fas fa-edit"></i></button>' +
        '    <button type="button" class="icon-btn danger" data-act="del-s" data-id="' + x.id + '" title="حذف"><i class="fas fa-trash"></i></button>' +
        '  </td>' +
        '</tr>';
    }).join('');

    var emptyRow = this._students.length === 0 ?
      '<tr id="empty-students-row"><td colspan="8" class="muted center" style="padding:40px;">لا يوجد طلاب — أضف أول طالب الآن.</td></tr>' : '';

    return '' +
      '<div class="table-head">' +
      '  <h2 class="admin-title">الطلاب <span class="count-pill" id="student-count">' + this._students.length + '</span></h2>' +
      '  <div class="table-tools">' +
      '    <input id="student-search" class="input" type="search" placeholder="بحث بالاسم أو الكود..." autocomplete="off">' +
      '    <button class="btn btn-primary" id="add-student-btn"><i class="fas fa-user-plus"></i> إضافة طالب</button>' +
      '  </div>' +
      '</div>' +
      '<div class="panel table-panel">' +
      '  <table class="data-table" id="students-table"><thead><tr><th>الكود</th><th>الاسم</th><th>الصف</th><th>النقاط</th><th>الغياب</th><th>واجب</th><th>الحالة</th><th>إجراءات</th></tr></thead>' +
      '  <tbody id="students-tbody">' + rows + emptyRow + '</tbody></table>' +
      '</div>';
  },

  /* مجموعة العدّاد السريع (+ / − / كتابة مباشرة) */
  _qGroup: function (x, field) {
    return '' +
      '<div class="q-group">' +
      '  <button type="button" class="q-btn" data-act="adjust" data-id="' + x.id + '" data-field="' + field + '" data-delta="-1" title="إنقاص" aria-label="إنقاص">−</button>' +
      '  <input class="q-input" type="number" min="0" step="1" inputmode="numeric" autocomplete="off" value="' + Number(x[field] || 0) + '"' +
      '         data-act="set-q" data-id="' + x.id + '" data-field="' + field + '" aria-label="تعديل ' + field + '" title="اكتب القيمة مباشرة">' +
      '  <button type="button" class="q-btn up" data-act="adjust" data-id="' + x.id + '" data-field="' + field + '" data-delta="1" title="زيادة" aria-label="زيادة">+</button>' +
      '</div>';
  },

  _bindStudents: function () {
    var main = document.getElementById('admin-main');
    if (!main) return;
    var addBtn = main.querySelector('#add-student-btn');
    if (addBtn) addBtn.addEventListener('click', function () { AdminView._openStudentModal(); });

    /* بحث سريع في قائمة الطلاب */
    var search = main.querySelector('#student-search');
    if (search) {
      search.addEventListener('input', function () {
        var q = search.value.trim().toLowerCase();
        var any = false;
        main.querySelectorAll('#students-tbody tr').forEach(function (tr) {
          if (tr.id === 'empty-students-row') return;
          var match = tr.textContent.toLowerCase().indexOf(q) !== -1;
          tr.style.display = match ? '' : 'none';
          if (match) any = true;
        });
      });
    }

    main.querySelectorAll('button[data-act]').forEach(function (btn) {
      var id = btn.getAttribute('data-id');
      var act = btn.getAttribute('data-act');
      if (act === 'edit-s') {
        btn.addEventListener('click', function () { AdminView._openStudentModal(id); });
      } else if (act === 'del-s') {
        btn.addEventListener('click', function () { AdminView._confirmDeleteStudent(id); });
      } else if (act === 'adjust') {
        var field = btn.getAttribute('data-field');
        var delta = Number(btn.getAttribute('data-delta'));
        btn.addEventListener('click', function () { AdminView._adjustStudent(id, field, delta); });
      }
    });

    /* كتابة القيمة مباشرة في الخلية (حفظ فوري عند تغيير القيمة) */
    main.querySelectorAll('input[data-act="set-q"]').forEach(function (input) {
      input.addEventListener('change', function () {
        AdminView._setStudentField(input.getAttribute('data-id'), input.getAttribute('data-field'), input.value);
      });
      input.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') input.blur();
      });
    });
  },

  _openStudentModal: function (id) {
    this._editingStudentId = id || null;
    var modal = document.getElementById('student-modal');
    if (!modal) return;

    var s = id ? this._students.find(function (x) { return String(x.id) === String(id); }) : null;

    document.getElementById('s-modal-title').textContent = s ? 'تعديل بيانات الطالب' : 'إضافة طالب جديد';
    document.getElementById('f-s-code').value = s ? s.id : 'يُولَّد تلقائياً';
    document.getElementById('f-s-code').disabled = true;
    document.getElementById('f-s-name').value = s ? s.name || '' : '';
    document.getElementById('f-s-grade').value = s ? s.grade || 's1' : 's1';
    document.getElementById('f-s-password').value = '';
    document.getElementById('f-s-password').placeholder = s ? 'اتركها فارغة للإبقاء على الحالية' : 'كلمة مرور دخول الطالب';
    document.getElementById('f-s-points').value = s ? Number(s.points || 0) : 0;
    document.getElementById('f-s-absences').value = s ? Number(s.absences || 0) : 0;
    document.getElementById('f-s-homework').value = s ? Number(s.homework || 0) : 0;
    document.getElementById('f-s-status').checked = !s || String(s.status || 'active') === 'active';

    modal.classList.remove('hidden');
    setTimeout(function () { var t = document.getElementById('f-s-name'); if (t) t.focus(); }, 50);
  },

  _closeStudentModal: function () {
    var modal = document.getElementById('student-modal');
    if (modal) modal.classList.add('hidden');
  },

  _onStudentSave: async function (e) {
    e.preventDefault();
    var isEdit = !!this._editingStudentId;
    var data = {
      name: document.getElementById('f-s-name').value.trim(),
      grade: document.getElementById('f-s-grade').value,
      password: document.getElementById('f-s-password').value.trim(),
      points: Number(document.getElementById('f-s-points').value) || 0,
      absences: Number(document.getElementById('f-s-absences').value) || 0,
      homework: Number(document.getElementById('f-s-homework').value) || 0,
      status: document.getElementById('f-s-status').checked ? 'active' : 'inactive'
    };

    if (!data.name) {
      UI.toast('الاسم مطلوب', 'error');
      return;
    }
    /* كلمة المرور مطلوبة فقط عند إضافة طالب جديد؛ عند التعديل يُحافظ
       الخادم على كلمة المرور الحالية إن تُركت فارغة */
    if (!isEdit && !data.password) {
      UI.toast('كلمة المرور مطلوبة للطالب الجديد', 'error');
      return;
    }

    UI.loading(true);
    try {
      var res;
      if (isEdit) {
        res = await Api.updateStudent(this._editingStudentId, data);
      } else {
        res = await Api.addStudent(data);
      }
      if (!res || res.status !== 'success') {
        UI.toast('فشلت العملية: ' + ((res && res.message) || 'حاول مرة أخرى'), 'error');
        return;
      }
      UI.toast(isEdit ? 'تم تحديث بيانات الطالب' : 'تم إضافة الطالب بنجاح', 'success');
      this._closeStudentModal();
      this._editingStudentId = null;
      await this._loadStudents();
      this.showTab('students');
    } catch (err) {
      console.error(err);
      UI.toast('فشلت العملية', 'error');
    } finally {
      UI.loading(false);
    }
  },

  /* تعديل سريع للنقاط/الغياب/الواجب مباشرة من الجدول (بلا فتح نافذة التعديل) */
  _adjustStudent: async function (id, field, delta) {
    var s = this._students.find(function (x) { return String(x.id) === String(id); });
    if (!s) return;
    this._setStudentField(id, field, Math.max(0, Number(s[field] || 0) + delta));
  },

  /* حفظ فوري لقيمة الحقل مع تحديث متفائل في مكانه (بدون إعادة تحميل الجدول) */
  _setStudentField: async function (id, field, raw) {
    var s = this._students.find(function (x) { return String(x.id) === String(id); });
    if (!s) return;

    var newVal = Math.max(0, Math.floor(Number(raw) || 0));
    var old = Number(s[field] || 0);

    var main = document.getElementById('admin-main');
    var inputEl = (main && typeof main.querySelector === 'function')
      ? main.querySelector('input[data-act="set-q"][data-id="' + id + '"][data-field="' + field + '"]')
      : null;

    if (newVal === old) {
      if (inputEl) inputEl.value = newVal;
      return;
    }

    /* تحديث متفائل: القيمة تظهر فوراً ثم تُحفظ */
    s[field] = newVal;
    if (inputEl) {
      inputEl.value = newVal;
      inputEl.classList.add('saving');
    }

    var data = {
      name: s.name || '',
      grade: s.grade || 's1',
      password: s.password || '',
      points: field === 'points' ? newVal : Number(s.points || 0),
      absences: field === 'absences' ? newVal : Number(s.absences || 0),
      homework: field === 'homework' ? newVal : Number(s.homework || 0),
      status: String(s.status || 'active')
    };

    try {
      var res = await Api.updateStudent(id, data);
      if (!res || res.status !== 'success') {
        /* الخادم رفض العملية — إرجاع القيمة السابقة وإظهار الخطأ الحقيقي */
        s[field] = old;
        if (inputEl) {
          inputEl.value = old;
          inputEl.classList.remove('saving');
          inputEl.classList.add('saved');
          setTimeout(function () { if (inputEl.classList) inputEl.classList.remove('saved'); }, 1200);
        }
        UI.toast('فشل الحفظ: ' + ((res && res.message) || 'الخادم رفض العملية'), 'error');
        return;
      }
      if (inputEl) {
        inputEl.classList.remove('saving');
        inputEl.classList.add('saved');
        setTimeout(function () { if (inputEl.classList) inputEl.classList.remove('saved'); }, 900);
      }
    } catch (err) {
      console.error(err);
      s[field] = old;
      if (inputEl) {
        inputEl.value = old;
        inputEl.classList.remove('saving');
      }
      UI.toast('فشل الحفظ — حاول مرة أخرى', 'error');
    }
  },

  _confirmDeleteStudent: async function (id) {
    var s = this._students.find(function (x) { return String(x.id) === String(id); });
    var ok = await UI.confirmDialog('هل أنت متأكد من حذف الطالب:\n' + (s ? s.name : ''), 'حذف طالب');
    if (!ok) return;

    UI.loading(true);
    try {
      await Api.deleteStudent(id);
      UI.toast('تم حذف الطالب', 'success');
      await this._loadStudents();
      this.showTab('students');
    } catch (err) {
      console.error(err);
      UI.toast('فشل الحذف', 'error');
    } finally {
      UI.loading(false);
    }
  }
};
