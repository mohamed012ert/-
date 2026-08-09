# فيزياء بمفهوم جديد — منصة التعليم التفاعلية

منصة تعليمية عربية للعلوم المتكاملة والفيزياء للمرحلة الثانوية، بصيانة من **م/ محمد مصطفى**.
تتكوّن من موقع رئيسي (SPA) يعرض الدروس لكل صف، وصفحة أداء للطالب، ولوحة تحكم منفصلة لإدارة
الدروس والطلاب — مع خلفية بيانات على **Google Apps Script + Google Sheets**.

---

## البنية (Architecture)

```
final physics wb/
├── index.html          الموقع الرئيسي (SPA عبر Hash Router)
├── admin.html          لوحة التحكم المنفصلة
├── css/
│   └── style.css       نظام تصميم موحّد (Design System) — no framework
├── js/
│   ├── config.js       الإعدادات: رابط الخادم، كلمة سر الأدمن، المراحل، بيانات احتياطية
│   ├── core/           النواة (مستقلة عن بعضها)
│   │   ├── utils.js    App.Utils    هروب النصوص، JSON آمن، debounce، delay
│   │   ├── storage.js  App.Storage  تغليف session/localStorage مع معالجة أخطاء
│   │   ├── media.js    App.Media    استخراج YouTube ID من أي صيغة + صور مصغرة
│   │   ├── dom.js      App.Dom      بناء عناصر + تفويض أحداث مركزي
│   │   ├── ui.js       window.UI    إشعارات، مؤشر تحميل، كروت، حوارات، بطاقات دخول
│   │   └── router.js   window.Router SPA Router (Hash) + دورة حياة view (render/mount/willUnmount)
│   ├── services/       طبقات الاتصال والبيانات
│   │   ├── http.js     App.Http     fetch بمهلة + JSONP بديل CORS + أخطاء مصنّفة
│   │   ├── cache.js    App.Cache    كاش localStorage مع TTL
│   │   ├── session.js  App.Session  جلسة الطالب + جلسة الأدمن (sessionStorage)
│   │   └── api.js      window.Api   كل عمليات القراءة/الكتابة + تحقق + بيانات احتياطية
│   ├── views/          صفحات التطبيق (كائنات views)
│   │   ├── home.js     HomeView     رئيسية: بانر ← مدرس ← لوحة شرف ← مراحل
│   │   ├── grade.js    GradeView    صفحة الصف: تسجيل دخول ← دروس الصف
│   │   ├── lesson.js   LessonView   مشغّل فيديو آمن (youtube-nocookie) + PDF + واتساب
│   │   ├── student.js  StudentView  أداء الطالب (نقاط/غياب/واجب) + دروس الصف
│   │   └── admin.js    AdminView    لوحة التحكم (نظرة عامة/دروس/طلاب)
│   ├── app.js          إقلاع الموقع الرئيسي (تسجيل المسارات + التنقل)
│   └── admin-app.js    إقلاع لوحة التحكم (مسار /admin فقط)
└── gs/
    └── Code.gs         خلفية Google Apps Script (قراءة/كتابة عبر Sheets)
```

### تدفق البيانات

- القراءة (GET): `Api.listVideos / studentLogin / leaderboard` ← `App.Http` ← خادم Apps Script.
- فشل الاتصال كلياً → **بيانات احتياطية** من `config.js` (FALLBACK_VIDEOS / FALLBACK_STUDENTS) حتى لا يتعطل الموقع.
- رفض الخادم الصريح (`status:"error"`) يُحترم ولا يُستبدل ببيانات تجريبية.
- الكتابة (POST text/plain — بدون preflight) تمرّ بمفتاح سري اختياري `ADMIN_SECRET`.

### دورة حياة الصفحة (Router)

```
view.render(params) -> HTML (أو Promise)
view.mount(el, params)        ربط الأحداث بعد إدراج الـ HTML
view.willUnmount()            تنظيف اختياري قبل تبديل الصفحة
```

---

## التشغيل المحلي

لا توجد اعتماديات ولا خطوات بناء — افتح الملفات مباشرة:

```
index.html      # الموقع الرئيسي
admin.html      # لوحة التحكم (كلمة المرور في js/config.js → ADMIN_PASSWORD)
```

أو شغّل خادماً بسيطاً لتفادي قيود المتصفحات على الملفات المحلية:

```bash
python -m http.server 8000
# ثم افتح: http://localhost:8000
```

> وضع التوضيح: ما دام `API_URL = 'YOUR_DEPLOYED_ID'` فالموقع يعمل بالكامل على
> بيانات تجريبية (كود 1 / 1234 وكود 2 / 4321). تعديلات لوحة التحكم في هذا الوضع لا تُحفظ.

---

## النشر (الإنتاج)

### 1) الخادم (Google Apps Script)

1. أنشئ جدول Google Sheets جديداً.
2. من القائمة **امتدادات ← Apps Script**، الصق محتوى `gs/Code.gs`.
3. فعّل النشر: **نشر ← نشر كتطبيق ويب**:
   - التنفيذ بـ: **أنا**
   - من يمكنه الوصول: **أي شخص (Anyone)**
   - انسخ الرابط بصيغة `https://script.google.com/macros/s/.../exec`
4. (اختياري) فعّل التحقق بالكتابة عبر `CONFIG.SECRET` في `Code.gs` وقيمة `ADMIN_SECRET` في `js/config.js`.
5. ستُنشأ ورقتا **Videos** و **Students** تلقائياً عند أول طلب — لا تغيّر أسماء الأعمدة أو ترتيبها.

### 2) الواجهة

- ضع رابط `.../exec` في `js/config.js` ← `API_URL`.
- ارفع مجلد الموقع على أي استضافة ثابتة (GitHub Pages / Netlify / Vercel / cPanel...).
- افتح `admin.html`، سجّل دخولك بكلمة السر، وأضف الدروس والطلاب من لوحة التحكم.

### 3) بيانات الخادم الحية

- الدروس: ورقة `Videos` بالأعمدة `id, grade, unit, title, description, youtubeUrl, pdfUrl, status, createdAt, updatedAt`.
- الطلاب: ورقة `Students` بالأعمدة `id, name, password, grade, points, absences, homework, status, createdAt, updatedAt`.

---

## التحقق (Smoke Test)

اختبار تدفق كامل للواجهة (تسجيل دخول، منع الوصول، لوحة الشرف، YouTube، وضع الخادم) يعمل بـ Node بدون متصفح:

```bash
node "C:\Users\Eng.Mohamed\AppData\Local\Temp\opencode\smoke-grade-login.js"
```

متوقع: `39 passed, 0 failed`.

---

## ملاحظات أمان

- كلمة مرور الأدمن مكتوبة في `js/config.js` (عميل) — غيّرها، ولا تستخدمها كلمة مرور حساسة.
- عمليات الكتابة تُحرس بالمفتاح السري `ADMIN_SECRET`/`CONFIG.SECRET` — فعّله قبل النشر العام.
- كلمات مرور الطلاب لا تُرسل للواجهة أبداً (`stripPassword` في الخادم).
