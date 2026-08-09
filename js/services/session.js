/* ============================================================
 * الخدمات — إدارة الجلسات (App.Session)
 * جلسة الطالب + جلسة الأدمن — تُخزَّن في sessionStorage
 * (تختفي بإغلاق التبويب = سلوك آمن افتراضياً)
 * ============================================================ */
window.App = window.App || {};

App.Session = (function () {

  var STUDENT_KEY = 'physics_student_session';
  var ADMIN_KEY = 'physics_admin';

  /* ---------- جلسة الطالب ---------- */

  /* بنية الجلسة:
   * { code, password, name, grade, grade_id, points, absences, homework } */
  function getStudent() {
    return App.Storage.get(STUDENT_KEY);
  }

  function setStudent(code, password, student) {
    return App.Storage.set(STUDENT_KEY, {
      code: String(code),
      password: password,
      name: student && student.name,
      grade: student && student.grade,
      grade_id: student && student.grade,
      points: Number((student && student.points) || 0),
      absences: Number((student && student.absences) || 0),
      homework: Number((student && student.homework) || 0)
    });
  }

  function clearStudent() {
    App.Storage.remove(STUDENT_KEY);
  }

  /* ---------- جلسة الأدمن ---------- */

  /* يتحقق من الصيغتين: القيمة المخزنة عبر set (JSON "1")
     والقيمة القديمة الخام (1) من الجلسات السابقة */
  function isAdmin() {
    return App.Storage.get(ADMIN_KEY) === '1' || App.Storage.getRaw(ADMIN_KEY) === '1';
  }

  function setAdmin(on) {
    if (on) App.Storage.set(ADMIN_KEY, '1');
    else App.Storage.remove(ADMIN_KEY);
  }

  return {
    getStudent: getStudent,
    setStudent: setStudent,
    clearStudent: clearStudent,
    isAdmin: isAdmin,
    setAdmin: setAdmin
  };
})();
