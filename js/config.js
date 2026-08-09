/* ============================================================
 * الإعدادات العامة للتطبيق
 * عدّل القيم التالية حسب مشروعك قبل النشر النهائي
 * ============================================================ */
window.APP_CONFIG = {

  /* رابط Web App بعد نشر Google Apps Script كتطبيق ويب (وصول: أي شخص) */
  /* مثال: https://script.google.com/macros/s/AKfycb.../exec */
  API_URL: 'https://script.google.com/macros/s/AKfycbwy8zyMyFNUuLq6s0B4W5iC2aHKjVPGU5MgNZHubiF0_u6SeDZ19IFxodYWIBUwaGvY3A/exec',

  /* كلمة مرور الدخول إلى لوحة التحكم (غيّرها فوراً) */
  ADMIN_PASSWORD: '123456',

  /* مفتاح سري يُرسل مع كل عملية كتابة للخادم (يجب تطابقه مع Code.gs)
   * اتركه فارغاً لإيقاف التحقق أثناء التجربة */
  ADMIN_SECRET: '',

  SITE_NAME: 'المهندس محمد مصطفى',
  TAGLINE: 'منصة المهندس محمد مصطفى للعلوم المتكاملة والفيزياء',

  WHATSAPP_NUMBER: '201221122383',

  /* المراحل الدراسية المعروضة في الموقع */
  GRADES: [
    {
      id: 's1',
      title: 'العلوم المتكاملة',
      subtitle: 'الصف الأول الثانوي',
      icon: 'fa-rocket',
      image: './imgs/pr2/1.jpg',
      placeholder: 'تأسيس قوي في الفيزياء والعلوم المتكاملة، شرح تفصيلي وتجارب عملية.'
    },
    {
      id: 's2',
      title: 'الفيزياء',
      subtitle: 'الصف الثاني الثانوي',
      icon: 'fa-microscope',
      image: './imgs/pr2/2.png',
      placeholder: 'محتوى متعمق، مسائل مستويات عليا (H.O.T.S)، وتجهيز للثانوية العامة.'
    }
  ],

  /* بيانات احتياطية تعمل بدون خادم، حتى يتم ضبط رابط Apps Script
   * وتضاف الدروس الفعلية من لوحة التحكم إلى Google Sheets */
  FALLBACK_VIDEOS: [
    {
      id: 1,
      grade: 's1',
      unit: 'الوحدة الأولى: الغلاف المائي',
      title: 'تأثير الضغط المائي على الكائنات الحية',
      description: 'شرح تفصيلي لتأثير الضغط المائي على الكائنات الحية مع أمثلة عملية وتجارب محاكاة.',
      youtubeUrl: 'https://www.youtube.com/embed/uqCxXJrE7rw?si=s3SWYTLO2yzpgmZF',
      pdfUrl: 'https://drive.google.com/file/d/1jNLjxptzAKkz-b0H2FBGGxEOshoU_M4w/view?usp=drivesdk',
      status: 'active',
      createdAt: '2025-01-01'
    },
    {
      id: 2,
      grade: 's1',
      unit: 'الوحدة الثانية: الغلاف الجوي',
      title: 'مكونات وطبقات الغلاف الجوي',
      description: 'شرح مكونات وطبقات الغلاف الجوي مع توضيح خصائص كل طبقة وأهميتها.',
      youtubeUrl: 'https://www.youtube.com/embed/6pu8_A0ks2Q?rel=0&modestbranding=1&playsinline=1',
      pdfUrl: 'https://drive.google.com/file/d/1jNLjxptzAKkz-b0H2FBGGxEOshoU_M4w/view?usp=drivesdk',
      status: 'active',
      createdAt: '2025-01-01'
    }
  ],

  /* بيانات طلاب احتياطية (تسجيل دخول تجريبي) حتى ضبط الخادم.
   * الدخول التجريبي: الكود 1 / كلمة المرور 1234
   *                     الكود 2 / كلمة المرور 4321 */
  FALLBACK_STUDENTS: [
    {
      id: 1,
      name: 'أحمد محمد',
      password: '1234',
      grade: 's1',
      points: 150,
      absences: 0,
      homework: 1,
      status: 'active',
      createdAt: '2025-01-01'
    },
    {
      id: 2,
      name: 'منة خالد',
      password: '4321',
      grade: 's1',
      points: 90,
      absences: 2,
      homework: 3,
      status: 'active',
      createdAt: '2025-01-01'
    }
  ]
};
