import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { createWhatsAppCliqProofUrl } from '../utils/whatsapp';
import { X, CheckCircle, ShieldCheck, ArrowRight, Zap, Check } from 'lucide-react';

const WhatsAppIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.149.929 3.182 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.771-5.768-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.299.045-.677.063-1.092-.069-.252-.08-.575-.187-.988-.365-1.739-.751-2.874-2.502-2.961-2.617-.087-.116-.708-.94-.708-1.793s.448-1.273.607-1.446c.159-.173.346-.217.462-.217l.332.006c.106.005.249-.04.39.298.144.347.491 1.2.534 1.287.043.087.072.188.014.304-.058.116-.087.188-.173.289l-.26.304c-.087.086-.177.18-.076.354.101.174.449.741.964 1.201.662.591 1.221.774 1.394.86.173.086.274.072.376-.043.101-.116.433-.506.549-.68.116-.173.231-.145.39-.087s1.011.477 1.184.564.289.13.332.203c.043.072.043.419-.101.824z"/>
    <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 1.89.525 3.66 1.438 5.168L2.05 21.65a.75.75 0 0 0 .927.927l4.482-1.388A9.96 9.96 0 0 0 12 22c5.523 0 10-4.477 10-10S17.523 2 12 2zm-8.5 10c0-4.694 3.806-8.5 8.5-8.5s8.5 3.806 8.5 8.5-3.806 8.5-8.5 8.5a8.47 8.47 0 0 1-4.298-1.164.75.75 0 0 0-.49-.082l-3.268 1.012 1.012-3.268a.75.75 0 0 0-.082-.49A8.47 8.47 0 0 1 3.5 12z"/>
  </svg>
);

export default function SubscribeModal({ isOpen, onClose, teacher, onSuccess }) {
  const { user, token, refreshUser } = useAuth();
  const { t, isRTL } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [confirmed, setConfirmed] = useState(false);
  const [cliqRef, setCliqRef] = useState('');
  const [copiedAlias, setCopiedAlias] = useState(false);

  if (!isOpen || !teacher) return null;

  const priceJod = teacher.monthly_price_jod || Math.round(parseFloat(teacher.monthly_price || '10'));
  const cliqAlias = teacher.cliq_alias || 'REEDMATH';
  const bankName = teacher.bank_name || 'Arab Bank (البنك العربي)';
  const walletPhone = teacher.wallet_phone || '0795551234';

  const whatsAppUrl = createWhatsAppCliqProofUrl({
    teacherPhone: walletPhone,
    studentName: user?.name,
    title: `اشتراك مادة ${teacher.name}`,
    priceJod,
    cliqRef
  });

  const handleCopyAlias = () => {
    navigator.clipboard.writeText(cliqAlias);
    setCopiedAlias(true);
    setTimeout(() => setCopiedAlias(false), 2500);
  };

  const handleConfirmSubscription = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/subscriptions/simulate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          teacher_id: teacher.id,
          cliq_reference: cliqRef.trim()
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to activate subscription');
      }

      await refreshUser();
      setConfirmed(true);
      if (onSuccess) onSuccess();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFinish = () => {
    setConfirmed(false);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '490px' }}>
        
        {/* Header */}
        <div className="modal-header">
          <div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: '700' }}>
              {confirmed 
                ? (isRTL ? `تم تفعيل الاشتراك مع ${teacher.name}!` : `Subscription Enrolled with ${teacher.name}!`)
                : (isRTL ? `الانضمام لمادة ${teacher.name}` : `Join ${teacher.name}'s Class`)}
            </h3>
            <p style={{ fontSize: '0.825rem', color: 'var(--color-text-muted)' }}>
              {isRTL 
                ? 'الدفع المباشر للمعلم عبر كليك / زين كاش · 0% عمولة منصة'
                : 'Direct teacher payment via CLIQ / Zain Cash · 0% Platform Fee'}
            </p>
          </div>
          <button onClick={onClose} style={{ color: 'var(--color-text-muted)' }}>
            <X size={20} />
          </button>
        </div>

        <div className="modal-body">
          {error && (
            <div className="alert alert-error" style={{ marginBottom: '1rem' }}>
              <span>{error}</span>
            </div>
          )}

          {!confirmed ? (
            <form onSubmit={handleConfirmSubscription}>
              {/* Teacher Summary Card */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '1rem',
                padding: '0.9rem',
                backgroundColor: '#f8fafc',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--color-border)',
                marginBottom: '1rem'
              }}>
                <img 
                  src={teacher.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${teacher.name}`} 
                  alt={teacher.name}
                  style={{ width: '52px', height: '52px', borderRadius: 'var(--radius-full)', objectFit: 'cover' }}
                />
                <div style={{ flex: 1 }}>
                  <h4 style={{ fontSize: '1rem', fontWeight: '700', margin: 0 }}>{teacher.name}</h4>
                  <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', margin: '2px 0 0 0' }}>{teacher.headline}</p>
                </div>
                <div style={{ textAlign: isRTL ? 'left' : 'right' }}>
                  <div style={{ fontSize: '1.25rem', fontWeight: '800', color: 'var(--color-secondary)' }}>
                    {priceJod} {t('jod', 'JOD')}
                  </div>
                  <div style={{ fontSize: '0.725rem', color: 'var(--color-text-muted)' }}>{t('perMonth', '/ mo')}</div>
                </div>
              </div>

              {/* Direct CLIQ Instructions Box */}
              <div style={{
                border: '1px solid #bfdbfe',
                backgroundColor: '#eff6ff',
                borderRadius: 'var(--radius-md)',
                padding: '1rem',
                marginBottom: '1rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: '700', color: '#1e40af', textTransform: 'uppercase' }}>
                    {t('cliqPayoutInfo', 'Teacher Payout Information')}
                  </span>
                  <span style={{ fontSize: '0.75rem', fontWeight: '700', color: '#15803d', backgroundColor: '#dcfce7', padding: '0.1rem 0.5rem', borderRadius: 'var(--radius-full)' }}>
                    {t('zeroFees', '0% Fees')}
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.85rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: '#475569' }}>{t('cliqAlias', 'CLIQ Alias')}:</span>
                    <button
                      type="button"
                      onClick={handleCopyAlias}
                      style={{ 
                        fontWeight: '700', 
                        color: 'var(--color-primary)', 
                        background: '#fff', 
                        border: '1px solid #93c5fd', 
                        padding: '0.2rem 0.6rem', 
                        borderRadius: 'var(--radius-sm)',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.3rem',
                        cursor: 'pointer'
                      }}
                    >
                      {copiedAlias ? <Check size={13} color="green" /> : null}
                      {cliqAlias} {copiedAlias ? `(${t('copied', 'Copied')})` : `(${t('copyCliq', 'Copy')})`}
                    </button>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#475569' }}>{t('bank', 'Bank')}:</span>
                    <strong style={{ color: '#1e293b' }}>{bankName}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#475569' }}>{t('walletPhone', 'Zain Cash / Orange')}:</span>
                    <strong style={{ color: '#1e293b' }}>{walletPhone}</strong>
                  </div>
                </div>
              </div>

              {/* Input for CLIQ Reference Number */}
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: '600', marginBottom: '0.35rem' }}>
                  {t('studentCliqRef', 'CLIQ Reference Number')}
                </label>
                <input 
                  type="text"
                  className="form-input"
                  placeholder="e.g. CLIQ-9843210 or Bank Transfer Ref"
                  value={cliqRef}
                  onChange={(e) => setCliqRef(e.target.value)}
                />
                <span style={{ fontSize: '0.725rem', color: 'var(--color-text-muted)', display: 'block', marginTop: '4px' }}>
                  {isRTL
                    ? `حوّل ${priceJod} دينار أردني إلى اسم المستفيد أعلاه من تطبيق بنكك. 100% من المبلغ يذهب للمعلم مباشرة.`
                    : `Send ${priceJod} JOD to the CLIQ alias above from your banking app. 100% goes directly to the teacher.`}
                </span>
              </div>

              {/* WhatsApp Screenshot Proof Link Button */}
              <div style={{ marginBottom: '1.25rem' }}>
                <a
                  href={whatsAppUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.45rem',
                    backgroundColor: '#25D366',
                    color: '#ffffff',
                    fontWeight: '700',
                    padding: '0.65rem 1rem',
                    borderRadius: 'var(--radius-md)',
                    textDecoration: 'none',
                    fontSize: '0.85rem',
                    boxShadow: '0 2px 4px rgba(37, 211, 102, 0.25)',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <WhatsAppIcon size={18} />
                  <span>{t('sendWhatsAppProof', 'Send Transfer Screenshot on WhatsApp (إرسال الإشعار عبر واتساب)')}</span>
                </a>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary"
                style={{ width: '100%', padding: '0.75rem', fontWeight: '700' }}
              >
                {loading ? 'Activating Access...' : (isRTL ? `تأكيد الاشتراك (${priceJod} دينار/شهرياً)` : `Confirm Enrollment (${priceJod} JOD / mo)`)}
              </button>
            </form>
          ) : (
            <div style={{ textAlign: 'center', padding: '1rem 0' }}>
              <div style={{
                width: '60px',
                height: '60px',
                backgroundColor: '#dcfce7',
                borderRadius: 'var(--radius-full)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1rem auto',
                color: '#16a34a'
              }}>
                <CheckCircle size={36} />
              </div>
              <h4 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '0.5rem' }}>
                {isRTL ? 'تم فتح المادة بنجاح!' : 'Class Access Unlocked!'}
              </h4>
              <p style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)', marginBottom: '1.25rem', maxWidth: '380px', margin: '0 auto 1.25rem auto', lineHeight: 1.5 }}>
                {isRTL 
                  ? `أصبح بإمكانك الآن حضور جميع دروس مادة ${teacher.name} وتحميل الدوسيات.`
                  : `You now have full access to ${teacher.name}'s curriculum, study guides, and video lessons.`}
              </p>

              {/* WhatsApp button also on confirmed screen */}
              <div style={{ marginBottom: '1rem' }}>
                <a
                  href={whatsAppUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.45rem',
                    backgroundColor: '#25D366',
                    color: '#ffffff',
                    fontWeight: '700',
                    padding: '0.65rem 1rem',
                    borderRadius: 'var(--radius-md)',
                    textDecoration: 'none',
                    fontSize: '0.85rem',
                    boxShadow: '0 2px 4px rgba(37, 211, 102, 0.25)'
                  }}
                >
                  <WhatsAppIcon size={18} />
                  <span>{t('sendWhatsAppProof', 'Send Transfer Screenshot on WhatsApp (إرسال الإشعار عبر واتساب)')}</span>
                </a>
              </div>

              <button 
                onClick={handleFinish} 
                className="btn btn-primary" 
                style={{ width: '100%' }}
              >
                {isRTL ? 'ابدأ الدراسة الآن' : 'Start Learning Now'} <ArrowRight size={16} />
              </button>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
