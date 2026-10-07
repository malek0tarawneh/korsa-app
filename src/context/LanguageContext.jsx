import React, { createContext, useContext, useState, useEffect } from 'react';

const translations = {
  en: {
    // Nav & General
    appName: 'Korsa',
    platformTagline: 'DIRECT TEACHER PLATFORM',
    home: 'Home',
    findTeachers: 'Find Teachers',
    myLearning: 'My Learning',
    teacherWorkspace: 'Teacher Workspace',
    adminHub: 'Admin Hub',
    login: 'Log In',
    register: 'Register',
    logout: 'Log Out',
    langToggle: 'العربية',
    roleStudent: 'Student',
    roleTeacher: 'Teacher',
    roleAdmin: 'Admin',
    switchRole: 'Quick Switch',
    
    // Hero & Landing
    heroTitle: 'Learn directly from independent teachers in Jordan.',
    heroSubtitle: 'Download free Tawjihi study guides, watch open lessons, and book 1-on-1 sessions directly via CLIQ or Zain Cash with zero middleman fees.',
    heroBadge1: '100% Free Platform · 0% Fees',
    heroBadge2: 'Local CLIQ & Zain Cash Payments (JOD)',
    browseTeachersBtn: 'Browse Teachers & Guides',
    freeSignupBtn: 'Free Student Sign Up',
    freePdfsGuarantee: 'Free Downloadable PDFs',
    jodGuarantee: '1-on-1 Help in Jordanian Dinars (JOD)',
    directConfirmGuarantee: 'Direct Teacher Confirmation',
    searchPlaceholder: 'Search teacher or topic...',
    searchBtn: 'Search',
    resetFilters: 'Reset Filters',
    allSubjects: 'All Subjects',
    tawjihi: 'Tawjihi (توجيهي)',
    mathematics: 'Mathematics',
    physics: 'Physics',
    english: 'English',
    chemistry: 'Chemistry',
    computerScience: 'Computer Science',
    allLevels: 'All Levels',
    grade12: 'Grade 12 (Tawjihi)',
    grade11: 'Grade 11',
    grade10: 'Grade 10',
    university: 'University',
    subjectLabel: 'Subject:',
    levelLabel: 'Level:',
    showingTeachers: 'Showing',
    viewProfile: 'View Profile',
    freeGuidesIncluded: 'Free Guides Included',
    perMonth: '/ mo',
    jod: 'JOD',
    freeStudyGuidesBadge: 'Free Study Guides',
    
    // Profile & Booking
    aboutTeacher: 'About',
    monthlyClassAccess: 'Monthly Class Access',
    joinFor: 'Join for',
    enrolledActive: 'Enrolled Active',
    cliqPayoutInfo: 'Local CLIQ & Wallet Payouts',
    cliqAlias: 'CLIQ Alias',
    bank: 'Bank',
    walletPhone: 'Zain Cash / Orange',
    copyCliq: 'Copy CLIQ',
    copied: 'Copied',
    zeroFees: '0% Fees',
    freeGuidesSection: 'Free Study Guides & Summaries (دوسيات)',
    freeGuidesSubtitle: '100% Free · Instant Access',
    downloadPdf: 'Download Free PDF',
    oneOnOneSection: '1-on-1 Sessions & Reviews (حصص فردية)',
    oneOnOneSubtitle: 'Pay via CLIQ / Zain Cash',
    bookSession: 'Book Session',
    coursesCurriculum: 'Courses & Sample Lessons',
    freePreview: 'FREE PREVIEW',
    studentFeedback: 'Student Feedback',
    
    // WhatsApp Proof
    sendWhatsAppProof: 'Send Transfer Screenshot on WhatsApp (إرسال الإشعار عبر واتساب)',
    messageStudentWhatsApp: 'Message on WhatsApp',
    
    // Booking Modal & Card
    bookingRequestReceived: 'Booking Request Received!',
    pendingConfirmation: 'Pending Teacher Confirmation',
    confirmed: 'Payment Confirmed',
    confirmPaymentBtn: 'Confirm Payment',
    totalAmount: 'Total Amount',
    studentCliqRef: 'CLIQ Reference Number',
    transferInstructions: 'Send the fee via CLIQ or Zain Cash:',
    enterRefNotice: 'Enter the reference number from your banking or wallet transfer confirmation.',
    studentNameLabel: 'Student Name',
    emailLabel: 'Email',
    phoneLabel: 'Phone / WhatsApp',
    topicLabel: 'Topic or Questions (Optional)',
    submitBooking: 'Submit Booking',
    cancel: 'Cancel',
    done: 'Done',
    
    // Student Dashboard
    myFreeGuidesTab: 'My Free Guides',
    myBookingsTab: 'My Bookings',
    noGuidesYet: 'No study guides downloaded yet',
    noBookingsYet: 'No 1-on-1 sessions booked yet',
    findGuidesBtn: 'Find Teachers & Free Guides',
    browseToBookBtn: 'Browse Teachers to Book',
    downloadReady: 'DOWNLOAD READY',
    bookedOn: 'Booked on',
    
    // Teacher Workspace
    teacherWorkspaceTitle: 'Teacher Workspace & Bookings',
    incomingBookings: '1-on-1 Sessions & Bookings',
    payoutSetupTab: 'CLIQ & Wallet Setup',
    myCoursesTab: 'My Courses',
    newCourseBtn: '+ New Course',
    saveSettingsBtn: 'Save CLIQ & Profile Settings',

    // Prepaid Access Codes & Feed
    accessCodesTab: 'Access Codes (أكواد الاشتراك)',
    creatorFeedTab: 'Teacher Feed & Updates',
    feedTabTitle: 'Feed & Updates',
    redeemCodeBtn: 'Redeem Access Code',
    havePrepaidCode: 'Have a Prepaid Code from a Bookshop?',
    redeemModalTitle: 'Redeem Subscription Access Code',
    redeemModalDesc: 'Enter the prepaid voucher code from your partner bookshop to unlock 30-day access to this teacher.',
    codePlaceholder: 'e.g. REED-2026-X8K2-9M4P',
    activateCodeBtn: 'Activate 30-Day Access',
    activating: 'Activating...',
    codeRedeemSuccess: 'Subscription Activated Successfully!',
    codeRedeemSuccessDesc: 'You now have 30 days of full access to all lessons, curriculum, and subscriber updates.',
    batchName: 'Batch / Library Name',
    batchNamePlaceholder: 'e.g. Dar Al-Hikma Library (مكتبة دار الحكمة)',
    generateCodesBtn: '+ Generate Access Codes',
    generateCodesCount: 'Number of Codes',
    pricePerCodeJod: 'Price per Code (JOD)',
    generating: 'Generating Codes...',
    codeStatusActive: 'Active (Available)',
    codeStatusRedeemed: 'Redeemed',
    copyCode: 'Copy Code',
    copyAllCodes: 'Copy All Codes',
    exportCsv: 'Export CSV for Bookshops',
    printCodesSheet: 'Print Voucher Cards',
    close: 'Close',
    totalGeneratedCodes: 'Total Codes Generated',
    activeCodes: 'Active (Unsold) Codes',
    redeemedCodes: 'Redeemed Codes',
    potentialRevenue: 'Total Value (JOD)',
    subscribersOnlyBadge: 'Subscribers Only',
    publicPostBadge: 'Public Post',
    lockedPostNotice: 'This lesson and update is exclusive to active subscribers and prepaid code holders.',
    unlockWithSubOrCode: 'Unlock with 30-Day Subscription or Prepaid Code',
    createPostBtn: '+ Create New Post',
    postTitleLabel: 'Post Title',
    postTitlePlaceholder: 'e.g. Tawjihi Calculus Exam Review & Shortcuts',
    postContentLabel: 'Post Content',
    postContentPlaceholder: 'Write your lesson notes, advice, or announcement...',
    postVideoUrlLabel: 'Video URL (Optional YouTube / MP4)',
    postAttachmentsLabel: 'PDF Attachments',
    attachmentTitle: 'Attachment Title',
    attachmentUrl: 'File / PDF Link',
    postVisibilityLabel: 'Audience Visibility',
    visibilityPublic: 'Public (Free for everyone)',
    visibilitySubscribers: 'Subscribers Only (Exclusive)',
    publishPostBtn: 'Publish Post',
    publishing: 'Publishing...',
    deletePost: 'Delete Post',
    noPostsYet: 'No feed posts published yet.',
    noCodesYet: 'No prepaid codes generated yet. Create a batch for bookshops and stationery centers.'
  },
  ar: {
    // Nav & General
    appName: 'كورسا',
    platformTagline: 'منصة المعلم المباشرة في الأردن',
    home: 'الرئيسية',
    findTeachers: 'تصفح المعلمين',
    myLearning: 'دوراتي وموادي',
    teacherWorkspace: 'مساحة المعلم',
    adminHub: 'لوحة الإدارة',
    login: 'تسجيل الدخول',
    register: 'إنشاء حساب',
    logout: 'تسجيل الخروج',
    langToggle: 'English',
    roleStudent: 'طالب',
    roleTeacher: 'معلم',
    roleAdmin: 'مشرف',
    switchRole: 'تبديل سريع',
    
    // Hero & Landing
    heroTitle: 'تعلّم مباشرة من نخبة المعلمين المستقلين في الأردن.',
    heroSubtitle: 'حمّل دوسيات وتلخيصات التوجيهي مجاناً، شاهد الحصص المفتوحة، واحجز مراجعات فردية عبر كليك (CLIQ) أو زين كاش وبدون أي عمولات وسيطة.',
    heroBadge1: 'منصة مجانية 100% · 0% عمولة',
    heroBadge2: 'دفع محلي عبر كليك وزين كاش (بالدينار الأردني)',
    browseTeachersBtn: 'تصفح المعلمين والدوسيات',
    freeSignupBtn: 'تسجيل طالب مجاناً',
    freePdfsGuarantee: 'دوسيات وتلخيصات PDF مجانية',
    jodGuarantee: 'حصص فردية بالدينار الأردني (JOD)',
    directConfirmGuarantee: 'تأكيد مباشر من المعلم',
    searchPlaceholder: 'ابحث عن اسم المعلم أو المادة...',
    searchBtn: 'بحث',
    resetFilters: 'إعادة ضبط الفلاتر',
    allSubjects: 'جميع المواد',
    tawjihi: 'توجيهي',
    mathematics: 'رياضيات',
    physics: 'فيزياء',
    english: 'اللغة الإنجليزية',
    chemistry: 'كيمياء',
    computerScience: 'علوم الحاسوب',
    allLevels: 'جميع الصفوف',
    grade12: 'توجيهي (الأول ثانوي/الثاني)',
    grade11: 'الأول ثانوي',
    grade10: 'العاشر',
    university: 'جامعي',
    subjectLabel: 'المادة:',
    levelLabel: 'المستوى:',
    showingTeachers: 'يظهر',
    viewProfile: 'عرض الملف والدوسيات',
    freeGuidesIncluded: 'الدوسيات المجانية متضمنة',
    perMonth: '/ شهرياً',
    jod: 'دينار',
    freeStudyGuidesBadge: 'دوسيات مجانية',
    
    // Profile & Booking
    aboutTeacher: 'نبذة عن المعلم',
    monthlyClassAccess: 'اشتراك المادة الشهري',
    joinFor: 'انضم بقيمة',
    enrolledActive: 'مشترك فعال',
    cliqPayoutInfo: 'بيانات الدفع المباشر عبر كليك والمحافظ',
    cliqAlias: 'اسم المستفيد في كليك (CLIQ Alias)',
    bank: 'البنك',
    walletPhone: 'زين كاش / أورنج موني',
    copyCliq: 'نسخ كليك',
    copied: 'تم النسخ',
    zeroFees: '0% عمولة',
    freeGuidesSection: 'دوسيات وتلخيصات مجانية',
    freeGuidesSubtitle: 'مجانية 100% · تحميل فوري',
    downloadPdf: 'تحميل الدوسية PDF',
    oneOnOneSection: 'حصص فردية ومراجعات خاصة (1-on-1)',
    oneOnOneSubtitle: 'الدفع المباشر عبر كليك وزين كاش',
    bookSession: 'حجز الحصة',
    coursesCurriculum: 'الدورات والحصص المسجلة',
    freePreview: 'حصة مجانية',
    studentFeedback: 'تقييمات وآراء الطلاب',
    
    // WhatsApp Proof
    sendWhatsAppProof: 'إرسال الإشعار عبر واتساب (Send WhatsApp Proof)',
    messageStudentWhatsApp: 'مراسلة عبر واتساب',
    
    // Booking Modal & Card
    bookingRequestReceived: 'تم استلام طلب الحجز بنجاح!',
    pendingConfirmation: 'قيد التأكيد من المعلم',
    confirmed: 'مؤكد ومقبول',
    confirmPaymentBtn: 'تأكيد استلام الدفعة',
    totalAmount: 'المبلغ الإجمالي',
    studentCliqRef: 'الرقم المرجعي لتحويل كليك',
    transferInstructions: 'حوّل المبلغ عبر كليك أو زين كاش:',
    enterRefNotice: 'أدخل الرقم المرجعي الظاهر في إشعار البنك أو المحفظة.',
    studentNameLabel: 'اسم الطالب',
    emailLabel: 'البريد الإلكتروني',
    phoneLabel: 'رقم الهاتف / واتساب',
    topicLabel: 'الموضوع أو الأسئلة المراد مراجعتها (اختياري)',
    submitBooking: 'تأكيد وإرسال الحجز',
    cancel: 'إلغاء',
    done: 'تم',
    
    // Student Dashboard
    myFreeGuidesTab: 'دوسياتي المجانية',
    myBookingsTab: 'حجوزاتي',
    noGuidesYet: 'لم تقم بتحميل أي دوسيات بعد',
    noBookingsYet: 'لا توجد حصص فردية محجوزة حالياً',
    findGuidesBtn: 'تصفح المعلمين والدوسيات المجانية',
    browseToBookBtn: 'تصفح المعلمين لحجز حصة',
    downloadReady: 'جاهز للتحميل',
    bookedOn: 'تاريخ الحجز',
    
    // Teacher Workspace
    teacherWorkspaceTitle: 'مساحة المعلم والحجوزات',
    incomingBookings: 'الحصص الفردية والحجوزات',
    payoutSetupTab: 'إعداد كليك والمحافظ',
    myCoursesTab: 'دوراتي وموادي',
    newCourseBtn: '+ مادة جديدة',
    saveSettingsBtn: 'حفظ بيانات كليك والإعدادات',

    // Prepaid Access Codes & Feed
    accessCodesTab: 'أكواد الاشتراك (مكتبات)',
    creatorFeedTab: 'منشورات وتحديثات المعلم',
    feedTabTitle: 'المنشورات والتحديثات',
    redeemCodeBtn: 'تفعيل كود الاشتراك',
    havePrepaidCode: 'معك كود اشتراك من المكتبة؟',
    redeemModalTitle: 'تفعيل كود الاشتراك المدفوع مسبقاً',
    redeemModalDesc: 'أدخل كود البطاقة أو القسيمة التي اشتريتها من المكتبة للحصول على اشتراك فوري لمدة 30 يوماً مع هذا المعلم.',
    codePlaceholder: 'مثال: REED-2026-X8K2-9M4P',
    activateCodeBtn: 'تفعيل الاشتراك (30 يوماً)',
    activating: 'جاري التفعيل...',
    codeRedeemSuccess: 'تم تفعيل الاشتراك بنجاح!',
    codeRedeemSuccessDesc: 'لديك الآن اشتراك فعال لمدة 30 يوماً يشمل جميع الحصص والشروحات ومنشورات المشتركين.',
    batchName: 'اسم الدفعة / المكتبة',
    batchNamePlaceholder: 'مثال: مكتبة دار الحكمة - عمان',
    generateCodesBtn: '+ إنشاء أكواد اشتراك جديدة',
    generateCodesCount: 'عدد الأكواد المطلوبة',
    pricePerCodeJod: 'سعر الكود (دينار أردني)',
    generating: 'جاري إنشاء الأكواد...',
    codeStatusActive: 'فعال (جاهز للبيع)',
    codeStatusRedeemed: 'تم استخدامه',
    copyCode: 'نسخ الكود',
    copyAllCodes: 'نسخ جميع الأكواد',
    exportCsv: 'تصدير ملف إكسل للمكتبة (CSV)',
    printCodesSheet: 'طباعة بطاقات الأكواد',
    close: 'إغلاق',
    totalGeneratedCodes: 'إجمالي الأكواد المنشأة',
    activeCodes: 'أكواد جاهزة للبيع',
    redeemedCodes: 'أكواد تم تفعيلها من الطلاب',
    potentialRevenue: 'القيمة الإجمالية (بالدينار)',
    subscribersOnlyBadge: 'خاص بالمشتركين',
    publicPostBadge: 'منشور عام',
    lockedPostNotice: 'هذا الشرح أو المنشور مخصص فقط للمشتركين وحاملي أكواد البطاقات المدفوعة مسبقاً.',
    unlockWithSubOrCode: 'اشترك أو فعّل كود المكتبة لفتح المحتوى',
    createPostBtn: '+ نشر درس أو منشور جديد',
    postTitleLabel: 'عنوان المنشور / الدرس',
    postTitlePlaceholder: 'مثال: حل أسئلة التفاضل والتكامل الوزارية لسنوات سابقة',
    postContentLabel: 'تفاصيل الدرس أو الملاحظات',
    postContentPlaceholder: 'اكتب نص الشرح، الملاحظات الوزارية، أو الإعلان للطلاب...',
    postVideoUrlLabel: 'رابط فيديو الشرح (يوتيوب أو رابط مباشر اختياري)',
    postAttachmentsLabel: 'الملفات والدوسيات المرفقة (PDF)',
    attachmentTitle: 'اسم الملف المرفق',
    attachmentUrl: 'رابط ملف الـ PDF',
    postVisibilityLabel: 'فئة المشاهدين',
    visibilityPublic: 'عام (متاح للجميع مجاناً)',
    visibilitySubscribers: 'خاص بالمشتركين فقط (حصري)',
    publishPostBtn: 'نشر المنشور الآن',
    publishing: 'جاري النشر...',
    deletePost: 'حذف المنشور',
    noPostsYet: 'لم يقم المعلم بنشر أي تحديثات أو دروس في الحائط بعد.',
    noCodesYet: 'لم تقم بإنشاء أي أكواد اشتراك بعد. أنشئ دفعة جديدة لتوزيعها على المكتبات والمراكز التعليمية.'
  }
};

const LanguageContext = createContext();

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(() => {
    try {
      return localStorage.getItem('korsa_lang') || 'ar';
    } catch {
      return 'ar';
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('korsa_lang', lang);
    } catch {}
    if (typeof document !== 'undefined') {
      document.documentElement.lang = lang;
      document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    }
  }, [lang]);

  const toggleLanguage = () => {
    setLang(prev => (prev === 'ar' ? 'en' : 'ar'));
  };

  const currentTranslations = translations[lang] || translations.en;

  const t = (key, fallback = '') => {
    if (!key) return fallback || '';
    return currentTranslations[key] !== undefined ? currentTranslations[key] : (fallback || key);
  };

  // Attach translation dictionary directly to t function
  Object.assign(t, currentTranslations);
  t.terms = currentTranslations;
  t.translations = currentTranslations;

  return (
    <LanguageContext.Provider value={{ 
      lang, 
      setLang, 
      toggleLanguage, 
      t, 
      isRTL: lang === 'ar',
      translations: currentTranslations 
    }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    const fallbackDict = translations.ar;
    const fallbackT = (key, fallback = '') => fallbackDict[key] || fallback || key;
    Object.assign(fallbackT, fallbackDict);
    fallbackT.terms = fallbackDict;
    fallbackT.translations = fallbackDict;
    return {
      lang: 'ar',
      setLang: () => {},
      toggleLanguage: () => {},
      t: fallbackT,
      isRTL: true,
      translations: fallbackDict
    };
  }
  return context;
}
