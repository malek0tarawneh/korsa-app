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
    saveSettingsBtn: 'Save CLIQ & Profile Settings'
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
    saveSettingsBtn: 'حفظ بيانات كليك والإعدادات'
  }
};

const LanguageContext = createContext();

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(() => {
    return localStorage.getItem('korsa_lang') || 'ar';
  });

  useEffect(() => {
    localStorage.setItem('korsa_lang', lang);
    if (typeof document !== 'undefined') {
      document.documentElement.lang = lang;
      document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    }
  }, [lang]);

  const toggleLanguage = () => {
    setLang(prev => (prev === 'ar' ? 'en' : 'ar'));
  };

  const t = (key, fallback = '') => {
    const langDict = translations[lang] || translations.en;
    if (langDict && langDict[key] !== undefined) {
      return langDict[key];
    }
    return fallback || key;
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang, toggleLanguage, t, isRTL: lang === 'ar' }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
