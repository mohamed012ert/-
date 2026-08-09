/**
 * ============================================================
 *  لوحة تحكم إدارة الفيديوهات — الواجهة الخلفية
 *  Google Apps Script Web App + Google Sheets
 *
 *  خطوات النشر:
 *  1) اربط هذا السكربت بجدول Google Sheets (امتداد > Apps Script).
 *  2) ستُنشأ ورقة "Videos" وورقة "Students" تلقائياً عند أول طلب.
 *  3) انشر > نشر كتطبيق ويب:
 *       - التنفيذ بـ: أنا
 *       - من يمكنه الوصول: أي شخص (Anyone)
 *  4) انسخ رابط .../exec وضعه في js/config.js ضمن API_URL.
 *
 *  ملاحظة تقنية: عمليات الكتابة (POST) تُرسل بصيغة text/plain
 *  لأن Apps Script لا يستجيب لطلبات preflight (OPTIONS).
 *
 *  هام: لا تغيّر أسماء/ترتيب الأعمدة — متوافق مع البيانات الحية.
 * ============================================================
 */

var CONFIG = {
  /* اتركه فارغاً لاستخدام الجدول المرفق بالسكربت،
     أو ضع معرّف الجدول (SPREADSHEET ID) */
  SPREADSHEET_ID: '',
  SHEET_NAME: 'Videos',
  /* مفتاح سري اختياري يمنع عمليات الكتابة العشوائية.
     اتركه فارغاً لإيقاف التحقق أثناء التجربة. */
  SECRET: ''
};

/* أعمدة جدول البيانات */
var COLUMNS = ['id', 'grade', 'unit', 'title', 'description', 'youtubeUrl', 'pdfUrl', 'status', 'createdAt', 'updatedAt'];

/* أعمدة جدول الطلاب */
var STUDENT_COLUMNS = ['id', 'name', 'password', 'grade', 'points', 'absences', 'homework', 'status', 'createdAt', 'updatedAt'];

var STATUS_ACTIVE = 'active';

/* ------------------------------------------------------------------ */
/*  نقطة الدخول للقراءة (GET)                                          */
/*  ?action=list[&grade=s1][&status=all]                               */
/*  ?action=get&id=1                                                   */
/*  ?action=student_login&code=1&password=1234                         */
/*  ?action=list_students&secret=...  (خاصة بلوحة التحكم)              */
/*  ?action=leaderboard[&limit=10]                                    */
/*  يدعم JSONP عند تمرير ?callback=... لتجاوز قيود CORS في المتصفح      */
/* ------------------------------------------------------------------ */
function doGet(e) {
  var params = (e && e.parameter) ? e.parameter : {};
  var action = params.action || 'list';
  var callback = params.callback || '';

  try {
    var result;
    switch (action) {
      case 'get':
        result = { status: 'success', data: getVideo(params.id) };
        break;
      case 'student_login':
        result = { status: 'success', data: studentLogin(params.code, params.password) };
        break;
      case 'list_students':
        requireSecret(params.secret);
        result = { status: 'success', data: listStudents(params.status) };
        break;
      case 'leaderboard':
        result = { status: 'success', data: getLeaderboard(params.limit) };
        break;
      default:
        result = { status: 'success', data: listVideos(params.grade, params.status) };
    }
    return respond(result, callback);
  } catch (err) {
    return respond({ status: 'error', message: err.message }, callback);
  }
}

/* ------------------------------------------------------------------ */
/*  نقطة الدخول للكتابة (POST)                                         */
/*  الجسم (body) نص JSON، مثال:                                        */
/*  {"action":"add","secret":"...","video":{...}}                      */
/*  {"action":"update","id":3,"video":{...}}                           */
/*  {"action":"delete","id":3}                                         */
/* ------------------------------------------------------------------ */
function doPost(e) {
  var payload;
  try {
    if (e && e.postData && e.postData.contents) {
      payload = JSON.parse(e.postData.contents);
    } else if (e && e.parameter && e.parameter.action) {
      /* بديل: طلب form-urlencoded كامل المعاملات في الـ URL */
      payload = e.parameter;
    } else {
      throw new Error('no_data');
    }
  } catch (err) {
    return respond({ status: 'error', message: 'Invalid payload: ' + err.message });
  }

  try {
    if (CONFIG.SECRET && payload.secret !== CONFIG.SECRET) {
      throw new Error('unauthorized');
    }

    var action = payload.action || 'add';
    var result;
    switch (action) {
      case 'add':    result = withLock_(function () { return addVideo(payload.video); }); break;
      case 'update': result = withLock_(function () { return updateVideo(payload.id, payload.video); }); break;
      case 'delete': result = withLock_(function () { return deleteVideo(payload.id); }); break;
      case 'add_student':    result = withLock_(function () { return addStudent(payload.student); }); break;
      case 'update_student': result = withLock_(function () { return updateStudent(payload.id, payload.student); }); break;
      case 'delete_student': result = withLock_(function () { return deleteStudent(payload.id); }); break;
      default: throw new Error('unknown_action');
    }
    return respond(result);
  } catch (err) {
    return respond({ status: 'error', message: err.message });
  }
}

/* ------------------------------------------------------------------ */
/*  عمليات الفيديوهات                                                  */
/* ------------------------------------------------------------------ */
function listVideos(grade, status) {
  var rows = getRows();
  var out = [];
  for (var i = 0; i < rows.length; i++) {
    if (grade && String(rows[i].grade) !== String(grade)) continue;
    if (status !== 'all' && String(rows[i].status || STATUS_ACTIVE) !== STATUS_ACTIVE) continue;
    out.push(rows[i]);
  }
  return out;
}

function getVideo(id) {
  var rows = getRows();
  for (var i = 0; i < rows.length; i++) {
    if (String(rows[i].id) === String(id)) return rows[i];
  }
  throw new Error('video_not_found');
}

function addVideo(video) {
  validateVideo(video);
  var sheet = getSheet();
  var now = new Date();
  var id = nextId();
  sheet.appendRow([
    id,
    (video && video.grade) || '',
    (video && video.unit) || '',
    (video && video.title) || '',
    (video && video.description) || '',
    (video && video.youtubeUrl) || '',
    (video && video.pdfUrl) || '',
    normalizeStatus(video && video.status),
    now,
    now
  ]);
  return { status: 'success', data: { id: id } };
}

function updateVideo(id, video) {
  validateVideo(video);
  var sheet = getSheet();
  var rowIndex = findRow(sheet, id);
  if (rowIndex < 0) throw new Error('video_not_found');

  var values = [
    Number(id),
    (video && video.grade) || '',
    (video && video.unit) || '',
    (video && video.title) || '',
    (video && video.description) || '',
    (video && video.youtubeUrl) || '',
    (video && video.pdfUrl) || '',
    normalizeStatus(video && video.status),
    sheet.getRange(rowIndex, 9).getValue(), /* الاحتفاظ بتاريخ الإنشاء */
    new Date()
  ];
  sheet.getRange(rowIndex, 1, 1, values.length).setValues([values]);
  return { status: 'success' };
}

function deleteVideo(id) {
  var sheet = getSheet();
  var rowIndex = findRow(sheet, id);
  if (rowIndex < 0) throw new Error('video_not_found');
  sheet.deleteRow(rowIndex);
  return { status: 'success' };
}

/* ------------------------------------------------------------------ */
/*  أدوات مساعدة                                                       */
/* ------------------------------------------------------------------ */
function getSheet_() {
  var ss = CONFIG.SPREADSHEET_ID
    ? SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID)
    : SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(CONFIG.SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(CONFIG.SHEET_NAME);
    sheet.appendRow(COLUMNS);
    sheet.getRange(1, 1, 1, COLUMNS.length)
      .setFontWeight('bold')
      .setBackground('#e8f0fe');
  }
  return sheet;
}

/* اسم مختصر للاستخدام في الدوال العلوية */
var getSheet = getSheet_;

function getRows() {
  var sheet = getSheet_();
  var lastRow = sheet.getLastRow();
  if (lastRow <= 1) return [];
  var data = sheet.getRange(2, 1, lastRow - 1, COLUMNS.length).getValues();
  var out = [];
  for (var i = 0; i < data.length; i++) {
    if (!isFilledRow_(data[i])) continue; /* تخطي الصفوف الفارغة المتبقية */
    var row = {};
    for (var c = 0; c < COLUMNS.length; c++) {
      row[COLUMNS[c]] = data[i][c];
    }
    row.id = Number(row.id);
    row.createdAt = toIso_(row.createdAt);
    row.updatedAt = toIso_(row.updatedAt);
    out.push(row);
  }
  return out;
}

function findRow(sheet, id) {
  var lastRow = sheet.getLastRow();
  if (lastRow <= 1) return -1;
  var ids = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
  for (var i = 0; i < ids.length; i++) {
    if (Number(ids[i][0]) === Number(id)) return i + 2; /* +1 للرأس +1 للفهرس */
  }
  return -1;
}

function nextId() {
  var sheet = getSheet_();
  var lastRow = sheet.getLastRow();
  if (lastRow <= 1) return 1;
  var ids = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
  var max = 0;
  for (var i = 0; i < ids.length; i++) {
    var n = Number(ids[i][0]) || 0;
    if (n > max) max = n;
  }
  return max + 1;
}

/* لوحة الشرف: أعلى الطلاب نقاطاً (مرتبة تنازلياً) — بدون كلمات مرور */
function getLeaderboard(limit) {
  var rows = getStudentRows();
  var out = [];
  for (var i = 0; i < rows.length; i++) {
    if (String(rows[i].status || STATUS_ACTIVE) !== STATUS_ACTIVE) continue;
    out.push({
      id: rows[i].id,
      name: rows[i].name,
      grade: rows[i].grade,
      points: Number(rows[i].points) || 0
    });
  }
  out.sort(function (a, b) { return b.points - a.points; });
  var n = Number(limit) || 10;
  return out.slice(0, n);
}

/* ------------------------------------------------------------------ */
/*  عمليات الطلاب                                                      */
/* ------------------------------------------------------------------ */
function listStudents(status) {
  var rows = getStudentRows();
  var out = [];
  for (var i = 0; i < rows.length; i++) {
    if (status !== 'all' && String(rows[i].status || STATUS_ACTIVE) !== STATUS_ACTIVE) continue;
    out.push(stripPassword(rows[i]));
  }
  return out;
}

function studentLogin(code, password) {
  var rows = getStudentRows();
  for (var i = 0; i < rows.length; i++) {
    if (String(rows[i].id) === String(code) && String(rows[i].password) === String(password)) {
      if (String(rows[i].status || STATUS_ACTIVE) !== STATUS_ACTIVE) throw new Error('student_disabled');
      return stripPassword(rows[i]);
    }
  }
  throw new Error('invalid_login');
}

function addStudent(data) {
  validateStudent(data);
  var sheet = getStudentSheet();
  var now = new Date();
  var id = nextStudentId();
  sheet.appendRow([
    id,
    (data && data.name) || '',
    (data && data.password) || '',
    (data && data.grade) || 's1',
    Number((data && data.points) || 0),
    Number((data && data.absences) || 0),
    Number((data && data.homework) || 0),
    normalizeStatus(data && data.status),
    now,
    now
  ]);
  return { status: 'success', data: { id: id } };
}

function updateStudent(id, data) {
  validateStudent(data);
  var sheet = getStudentSheet();
  var rowIndex = findStudentRow(sheet, id);
  if (rowIndex < 0) throw new Error('student_not_found');

  var values = [
    Number(id),
    (data && data.name) || '',
    (data && data.password) || '',
    (data && data.grade) || 's1',
    Number((data && data.points) || 0),
    Number((data && data.absences) || 0),
    Number((data && data.homework) || 0),
    normalizeStatus(data && data.status),
    sheet.getRange(rowIndex, 9).getValue(), /* الاحتفاظ بتاريخ الإنشاء */
    new Date()
  ];
  sheet.getRange(rowIndex, 1, 1, values.length).setValues([values]);
  return { status: 'success' };
}

function deleteStudent(id) {
  var sheet = getStudentSheet();
  var rowIndex = findStudentRow(sheet, id);
  if (rowIndex < 0) throw new Error('student_not_found');
  sheet.deleteRow(rowIndex);
  return { status: 'success' };
}

/* إزالة كلمة المرور من البيانات المُرسلة للعميل */
function stripPassword(s) {
  var out = {};
  for (var c = 0; c < STUDENT_COLUMNS.length; c++) {
    if (STUDENT_COLUMNS[c] === 'password') continue;
    out[STUDENT_COLUMNS[c]] = s[STUDENT_COLUMNS[c]];
  }
  return out;
}

function getStudentSheet_() {
  var ss = CONFIG.SPREADSHEET_ID
    ? SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID)
    : SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName('Students');
  if (!sheet) {
    sheet = ss.insertSheet('Students');
    sheet.appendRow(STUDENT_COLUMNS);
    sheet.getRange(1, 1, 1, STUDENT_COLUMNS.length)
      .setFontWeight('bold')
      .setBackground('#e8f0fe');
  }
  return sheet;
}
var getStudentSheet = getStudentSheet_;

function getStudentRows() {
  var sheet = getStudentSheet_();
  var lastRow = sheet.getLastRow();
  if (lastRow <= 1) return [];
  var data = sheet.getRange(2, 1, lastRow - 1, STUDENT_COLUMNS.length).getValues();
  var out = [];
  for (var i = 0; i < data.length; i++) {
    if (!isFilledRow_(data[i])) continue; /* تخطي الصفوف الفارغة المتبقية */
    var row = {};
    for (var c = 0; c < STUDENT_COLUMNS.length; c++) {
      row[STUDENT_COLUMNS[c]] = data[i][c];
    }
    row.id = Number(row.id);
    row.points = Number(row.points) || 0;
    row.absences = Number(row.absences) || 0;
    row.homework = Number(row.homework) || 0;
    row.createdAt = toIso_(row.createdAt);
    row.updatedAt = toIso_(row.updatedAt);
    out.push(row);
  }
  return out;
}

function findStudentRow(sheet, id) {
  var lastRow = sheet.getLastRow();
  if (lastRow <= 1) return -1;
  var ids = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
  for (var i = 0; i < ids.length; i++) {
    if (Number(ids[i][0]) === Number(id)) return i + 2;
  }
  return -1;
}

function nextStudentId() {
  var sheet = getStudentSheet_();
  var lastRow = sheet.getLastRow();
  if (lastRow <= 1) return 1;
  var ids = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
  var max = 0;
  for (var i = 0; i < ids.length; i++) {
    var n = Number(ids[i][0]) || 0;
    if (n > max) max = n;
  }
  return max + 1;
}

/* ------------------------------------------------------------------ */
/*  التحقق من البيانات (قبل الكتابة في الجدول)                         */
/* ------------------------------------------------------------------ */
function validateVideo(video) {
  if (!video || typeof video !== 'object') throw new Error('missing_video');
  if (!video.title || !String(video.title).trim()) throw new Error('missing_title');
  if (!video.grade) throw new Error('missing_grade');
  if (!video.youtubeUrl || !String(video.youtubeUrl).trim()) throw new Error('missing_youtube_url');
}

function validateStudent(data) {
  if (!data || typeof data !== 'object') throw new Error('missing_student');
  if (!data.name || !String(data.name).trim()) throw new Error('missing_name');
  if (!data.password || !String(data.password).trim()) throw new Error('missing_password');
}

/* توحيد حالة النشر: القيم غير الصالحة تُحوَّل إلى "active" تلقائياً */
function normalizeStatus(status) {
  var s = String(status || STATUS_ACTIVE);
  return (s === 'active' || s === 'hidden' || s === 'inactive') ? s : STATUS_ACTIVE;
}

/* صف كامل فارغ (كل خلاياه بلا محتوى) */
function isFilledRow_(cells) {
  for (var i = 0; i < cells.length; i++) {
    var v = cells[i];
    if (v !== '' && v !== null && v !== undefined) return true;
  }
  return false;
}

/* تحويل التاريخ إلى نص ISO موحّد (الخلايا النصية تُعطى كما هي) */
function toIso_(val) {
  if (val instanceof Date) return val.toISOString();
  return val || '';
}

/* التحقق من المفتاح السري (عمليات لوحة التحكم الحساسة) */
function requireSecret(secret) {
  if (CONFIG.SECRET && String(secret) !== CONFIG.SECRET) throw new Error('unauthorized');
}

/* قفل عمليات الكتابة المتزامنة (منع تصادم appendRow + nextId) */
function withLock_(fn) {
  var lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    return fn();
  } finally {
    lock.releaseLock();
  }
}

/* إنشاء الاستجابة (مع دعم JSONP) */
function respond(obj, callback) {
  var out = ContentService.createTextOutput(JSON.stringify(obj));
  if (callback) {
    out.setMimeType(ContentService.MimeType.JAVASCRIPT);
    return out.setContent(callback + '(' + JSON.stringify(obj) + ');');
  }
  return out.setMimeType(ContentService.MimeType.JSON);
}
