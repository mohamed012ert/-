/* ============================================================
 * أدوات بناء الموقع — دمج ملفات JS في حزم قليلة لتسريع التحميل.
 *
 * الاستخدام (بعد تعديل أي مصدر في js/):
 *   node tools/build.mjs
 *
 * تُولَّد الملفات في js/dist/ — لا تعدّل هذه الملفات يدوياً.
 * ============================================================ */
import { readFileSync, writeFileSync, mkdirSync } from 'fs';

function bundle(output, files) {
  const body = files.map(function (f) {
    return '/* ==== ' + f + ' ==== */\n' + readFileSync(f, 'utf8');
  }).join('\n\n');

  const banner = '/* ============================================================\n' +
    ' * ملف مجمّع مُولَّد تلقائياً — لا تعدّله يدوياً.\n' +
    ' * عدّل المصادر في js/ ثم أعد إنشاءه: node tools/build.mjs\n' +
    ' * ============================================================ */\n';

  mkdirSync('js/dist', { recursive: true });
  writeFileSync(output, banner + body + '\n');
  console.log('OK  ' + output);
}

bundle('js/dist/core.js', [
  'js/config.js',
  'js/core/utils.js',
  'js/core/storage.js',
  'js/core/media.js',
  'js/core/dom.js',
  'js/core/ui.js',
  'js/core/router.js',
  'js/core/splash.js'
]);

bundle('js/dist/services.js', [
  'js/services/http.js',
  'js/services/cache.js',
  'js/services/session.js',
  'js/services/api.js'
]);

bundle('js/dist/site.js', [
  'js/views/home.js',
  'js/views/grade.js',
  'js/views/lesson.js',
  'js/views/student.js',
  'js/app.js'
]);

bundle('js/dist/admin.js', [
  'js/views/admin.js',
  'js/admin-app.js'
]);