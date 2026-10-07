/**
 * WhatsApp Deep Linking Utilities for Jordanian CLIQ & Wallet payments
 */

export function formatJordanianPhoneForWhatsApp(phone) {
  if (!phone) return '';
  // Strip all non-digit characters
  const digits = String(phone).replace(/\D/g, '');
  if (digits.startsWith('962')) return digits;
  if (digits.startsWith('0')) return '962' + digits.slice(1);
  if (digits.length === 9) return '962' + digits;
  return digits;
}

export function createWhatsAppCliqProofUrl({
  teacherPhone,
  studentName,
  title,
  priceJod,
  cliqRef
}) {
  const cleanPhone = formatJordanianPhoneForWhatsApp(teacherPhone || '0795551234');
  const message = `مرحباً، قمت بتحويل ${priceJod || ''} دينار أردني (JOD) عبر كليك (CLIQ) بخصوص "${title || 'الحصة'}".\nالاسم: ${studentName || 'طالب'}\nالرقم المرجعي للتحويل: ${cliqRef || 'قيد الإرسال'}\nمرفق لقطة شاشة إشعار التحويل:`;
  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
}

export function createWhatsAppTeacherToStudentUrl({
  studentPhone,
  studentName,
  title
}) {
  const cleanPhone = formatJordanianPhoneForWhatsApp(studentPhone);
  const message = `مرحباً ${studentName || ''}، بخصوص حجزك لجلسة "${title || 'الحصة'}" على منصة Korsa...`;
  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
}
