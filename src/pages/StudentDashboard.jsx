import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { createWhatsAppCliqProofUrl } from '../utils/whatsapp';
import { 
  Download, 
  Clock, 
  CheckCircle2, 
  Calendar, 
  FileText, 
  ArrowRight,
  BookOpen,
  User,
  Zap,
  Check
} from 'lucide-react';

const WhatsAppIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.149.929 3.182 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.771-5.768-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.299.045-.677.063-1.092-.069-.252-.08-.575-.187-.988-.365-1.739-.751-2.874-2.502-2.961-2.617-.087-.116-.708-.94-.708-1.793s.448-1.273.607-1.446c.159-.173.346-.217.462-.217l.332.006c.106.005.249-.04.39.298.144.347.491 1.2.534 1.287.043.087.072.188.014.304-.058.116-.087.188-.173.289l-.26.304c-.087.086-.177.18-.076.354.101.174.449.741.964 1.201.662.591 1.221.774 1.394.86.173.086.274.072.376-.043.101-.116.433-.506.549-.68.116-.173.231-.145.39-.087s1.011.477 1.184.564.289.13.332.203c.043.072.043.419-.101.824z"/>
    <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 1.89.525 3.66 1.438 5.168L2.05 21.65a.75.75 0 0 0 .927.927l4.482-1.388A9.96 9.96 0 0 0 12 22c5.523 0 10-4.477 10-10S17.523 2 12 2zm-8.5 10c0-4.694 3.806-8.5 8.5-8.5s8.5 3.806 8.5 8.5-3.806 8.5-8.5 8.5a8.47 8.47 0 0 1-4.298-1.164.75.75 0 0 0-.49-.082l-3.268 1.012 1.012-3.268a.75.75 0 0 0-.082-.49A8.47 8.47 0 0 1 3.5 12z"/>
  </svg>
);

export default function StudentDashboard({ onSelectTeacher, onSelectCreator, onOpenLesson }) {
  const { user, token } = useAuth();
  const { t, isRTL } = useLanguage();
  const [activeTab, setActiveTab] = useState('guides'); // 'guides' | 'bookings'
  const [claimedDownloads, setClaimedDownloads] = useState([]);
  const [serviceBookings, setServiceBookings] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const headers = { 'Authorization': `Bearer ${token}` };

      // 1. Fetch free claimed study guides
      const leadRes = await fetch('/api/lead-magnets/my-claimed', { headers });
      if (leadRes.ok) {
        const leads = await leadRes.json();
        setClaimedDownloads(leads);
      }

      // 2. Fetch booked 1-on-1 sessions
      const srvRes = await fetch('/api/services/my-bookings', { headers });
      if (srvRes.ok) {
        const srv = await srvRes.json();
        setServiceBookings(srv);
      }

      // 3. Fetch active subscriptions (for curriculum access)
      const subRes = await fetch('/api/subscriptions/my', { headers });
      if (subRes.ok) {
        const subs = await subRes.json();
        setSubscriptions(subs);
      }
    } catch (err) {
      console.error('Failed to load student dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) loadData();
  }, [token]);

  return (
    <div style={{ backgroundColor: '#ffffff', minHeight: '100vh', padding: '2.5rem 0 5rem 0' }}>
      <div className="container" style={{ maxWidth: '840px' }}>
        
        {/* Simple Page Header */}
        <div style={{ marginBottom: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.25rem' }}>
            <span style={{
              fontSize: '0.75rem',
              fontWeight: '700',
              padding: '0.15rem 0.5rem',
              borderRadius: '9999px',
              backgroundColor: '#eff6ff',
              color: '#1d4ed8'
            }}>
              {t('roleStudent', 'STUDENT')} DASHBOARD
            </span>
            <span style={{ fontSize: '0.85rem', color: '#64748b' }}>{user?.email}</span>
          </div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: '800', color: '#0f172a', margin: 0 }}>
            {isRTL ? `أهلاً بك، ${user?.name || ''}` : `Welcome back, ${user?.name || ''}`}
          </h1>
          <p style={{ fontSize: '0.9rem', color: '#64748b', marginTop: '4px' }}>
            {isRTL 
              ? 'إدارة الدوسيات والملخصات المجانية التي قمت بتحميلها وحجوزاتك للحصص الفردية.'
              : 'Manage your free downloadable study guides and your 1-on-1 session bookings.'}
          </p>
        </div>

        {/* ULTRA-SIMPLE TWO TABS */}
        <div style={{
          display: 'flex',
          borderBottom: '2px solid #e2e8f0',
          marginBottom: '2rem',
          gap: '1.5rem'
        }}>
          <button
            onClick={() => setActiveTab('guides')}
            style={{
              padding: '0.75rem 0.25rem',
              fontSize: '1rem',
              fontWeight: activeTab === 'guides' ? '800' : '600',
              color: activeTab === 'guides' ? 'var(--color-primary)' : '#64748b',
              borderBottom: activeTab === 'guides' ? '2px solid var(--color-primary)' : '2px solid transparent',
              marginBottom: '-2px',
              display: 'flex',
              alignItems: 'center',
              gap: '0.45rem',
              background: 'none',
              border: 'none',
              cursor: 'pointer'
            }}
          >
            <Download size={18} />
            {t('myFreeGuidesTab', 'My Free Guides')} ({claimedDownloads.length})
          </button>

          <button
            onClick={() => setActiveTab('bookings')}
            style={{
              padding: '0.75rem 0.25rem',
              fontSize: '1rem',
              fontWeight: activeTab === 'bookings' ? '800' : '600',
              color: activeTab === 'bookings' ? 'var(--color-primary)' : '#64748b',
              borderBottom: activeTab === 'bookings' ? '2px solid var(--color-primary)' : '2px solid transparent',
              marginBottom: '-2px',
              display: 'flex',
              alignItems: 'center',
              gap: '0.45rem',
              background: 'none',
              border: 'none',
              cursor: 'pointer'
            }}
          >
            <Calendar size={18} />
            {t('myBookingsTab', 'My Bookings')} ({serviceBookings.length})
          </button>
        </div>

        {/* Loading State */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '4rem 1rem', color: '#64748b' }}>
            Loading dashboard...
          </div>
        ) : (
          <div>
            
            {/* TAB 1: MY FREE GUIDES */}
            {activeTab === 'guides' && (
              <div>
                {claimedDownloads.length === 0 ? (
                  <div style={{
                    textAlign: 'center',
                    padding: '3.5rem 1rem',
                    backgroundColor: '#f8fafc',
                    borderRadius: 'var(--radius-lg)',
                    border: '1px solid #e2e8f0'
                  }}>
                    <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: '#eff6ff', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem auto' }}>
                      <Download size={24} />
                    </div>
                    <h3 style={{ fontSize: '1.15rem', fontWeight: '800', color: '#0f172a', marginBottom: '0.4rem' }}>
                      No study guides downloaded yet
                    </h3>
                    <p style={{ fontSize: '0.875rem', color: '#64748b', maxWidth: '420px', margin: '0 auto 1.5rem auto', lineHeight: 1.5 }}>
                      Browse Jordanian teachers to download free Tawjihi summaries, exam roadmaps, and cheat sheets.
                    </p>
                    <button 
                      onClick={() => onSelectTeacher(null)} 
                      className="btn btn-primary btn-md"
                      style={{ fontWeight: '700' }}
                    >
                      Find Teachers & Free Guides
                    </button>
                  </div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.25rem' }}>
                    {(claimedDownloads || []).map((guide) => (
                      <div 
                        key={guide.claim_id || guide.id}
                        style={{
                          backgroundColor: '#ffffff',
                          border: '1px solid #e2e8f0',
                          borderRadius: 'var(--radius-md)',
                          padding: '1.25rem',
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'space-between',
                          boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
                        }}
                      >
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                            <span style={{
                              fontSize: '0.7rem',
                              fontWeight: '700',
                              padding: '0.1rem 0.45rem',
                              borderRadius: '9999px',
                              backgroundColor: '#dcfce7',
                              color: '#15803d'
                            }}>
                              DOWNLOAD READY
                            </span>
                            <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                              {guide.claimed_at ? new Date(guide.claimed_at).toLocaleDateString() : 'Available'}
                            </span>
                          </div>

                          <h4 style={{ fontSize: '1rem', fontWeight: '800', color: '#0f172a', marginBottom: '0.35rem', lineHeight: 1.35 }}>
                            {guide.title}
                          </h4>

                          <p style={{ fontSize: '0.8rem', color: '#64748b', lineHeight: 1.45, marginBottom: '0.75rem' }}>
                            {guide.description}
                          </p>

                          {guide.teacher_name && (
                            <div style={{ fontSize: '0.8rem', color: '#475569', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                              <User size={13} /> By <strong>{guide.teacher_name}</strong>
                            </div>
                          )}
                        </div>

                        <a 
                          href={guide.file_url} 
                          target="_blank" 
                          rel="noreferrer"
                          className="btn btn-primary"
                          style={{
                            width: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.4rem',
                            padding: '0.55rem',
                            fontSize: '0.85rem',
                            fontWeight: '700',
                            textDecoration: 'none'
                          }}
                        >
                          <Download size={15} /> Download PDF
                        </a>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: MY BOOKINGS */}
            {activeTab === 'bookings' && (
              <div>
                {serviceBookings.length === 0 ? (
                  <div style={{
                    textAlign: 'center',
                    padding: '3.5rem 1rem',
                    backgroundColor: '#f8fafc',
                    borderRadius: 'var(--radius-lg)',
                    border: '1px solid #e2e8f0'
                  }}>
                    <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: '#fef3c7', color: '#d97706', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem auto' }}>
                      <Calendar size={24} />
                    </div>
                    <h3 style={{ fontSize: '1.15rem', fontWeight: '800', color: '#0f172a', marginBottom: '0.4rem' }}>
                      {t('noBookingsYet', 'No 1-on-1 sessions booked yet')}
                    </h3>
                    <p style={{ fontSize: '0.875rem', color: '#64748b', maxWidth: '420px', margin: '0 auto 1.5rem auto', lineHeight: 1.5 }}>
                      {isRTL
                        ? 'احجز حصص تقوية ومراجعات فردية مباشرة مع أفضل المعلمين في الأردن بالدفع عبر كليك أو زين كاش وبدون عمولات.'
                        : 'Schedule individual tutoring or homework review sessions directly with teachers in Jordan via CLIQ.'}
                    </p>
                    <button 
                      onClick={() => onSelectTeacher(null)} 
                      className="btn btn-primary btn-md"
                      style={{ fontWeight: '700' }}
                    >
                      {t('browseToBookBtn', 'Browse Teachers to Book')}
                    </button>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {(serviceBookings || []).map((b) => {
                      const isConfirmed = b.payment_status === 'confirmed' || b.status === 'confirmed';
                      const priceJod = b.price_jod || Math.round(b.price_cents / 100);
                      const whatsAppUrl = createWhatsAppCliqProofUrl({
                        teacherPhone: b.wallet_phone || '0795551234',
                        studentName: user?.name,
                        title: b.service_title,
                        priceJod,
                        cliqRef: b.cliq_reference
                      });

                      return (
                        <div 
                          key={b.id}
                          style={{
                            backgroundColor: '#ffffff',
                            border: '1px solid #e2e8f0',
                            borderRadius: 'var(--radius-md)',
                            padding: '1.25rem',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '0.75rem' }}>
                            <div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                                <h3 style={{ fontSize: '1.1rem', fontWeight: '800', color: '#0f172a', margin: 0 }}>
                                  {b.service_title}
                                </h3>
                                <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                                  ({b.duration_minutes} {isRTL ? 'دقيقة' : 'mins'})
                                </span>
                              </div>
                              <div style={{ fontSize: '0.85rem', color: '#475569' }}>
                                {isRTL ? 'المعلم:' : 'Teacher:'} <strong>{b.teacher_name}</strong> (@{b.teacher_handle})
                              </div>
                            </div>

                            {/* Status Badge */}
                            <div>
                              {isConfirmed ? (
                                <span style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '0.3rem',
                                  padding: '0.25rem 0.65rem',
                                  borderRadius: '9999px',
                                  backgroundColor: '#dcfce7',
                                  color: '#15803d',
                                  fontSize: '0.8rem',
                                  fontWeight: '700'
                                }}>
                                  <CheckCircle2 size={14} /> {isRTL ? 'مؤكد ومقبول' : 'Confirmed (مؤكد)'}
                                </span>
                              ) : (
                                <span style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '0.3rem',
                                  padding: '0.25rem 0.65rem',
                                  borderRadius: '9999px',
                                  backgroundColor: '#fef3c7',
                                  color: '#b45309',
                                  fontSize: '0.8rem',
                                  fontWeight: '700'
                                }}>
                                  <Clock size={14} /> {isRTL ? 'قيد تأكيد المعلم' : 'Pending Confirmation (قيد التأكيد)'}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* CLIQ Payment Details Card */}
                          <div style={{
                            backgroundColor: '#f8fafc',
                            border: '1px solid #e2e8f0',
                            borderRadius: 'var(--radius-sm)',
                            padding: '0.85rem 1rem',
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                            gap: '0.75rem',
                            fontSize: '0.825rem',
                            marginBottom: '0.75rem'
                          }}>
                            <div>
                              <span style={{ color: '#64748b', display: 'block' }}>{t('totalAmount', 'Total Amount')}</span>
                              <strong style={{ fontSize: '0.95rem', color: '#0f172a' }}>{priceJod} {t('jod', 'JOD')}</strong>
                            </div>
                            <div>
                              <span style={{ color: '#64748b', display: 'block' }}>{t('cliqAlias', 'Teacher CLIQ Alias')}</span>
                              <strong style={{ color: 'var(--color-primary)' }}>{b.cliq_alias || 'REEDMATH'}</strong>
                            </div>
                            <div>
                              <span style={{ color: '#64748b', display: 'block' }}>{t('walletPhone', 'Zain Cash / Orange')}</span>
                              <strong>{b.wallet_phone || '0795551234'}</strong>
                            </div>
                            <div>
                              <span style={{ color: '#64748b', display: 'block' }}>{t('studentCliqRef', 'Your CLIQ Reference')}</span>
                              <strong style={{ fontFamily: 'monospace' }}>{b.cliq_reference || 'N/A'}</strong>
                            </div>
                          </div>

                          {/* WhatsApp Screenshot Proof Link Button */}
                          <div style={{ marginBottom: '0.75rem' }}>
                            <a
                              href={whatsAppUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.45rem',
                                backgroundColor: '#25D366',
                                color: '#ffffff',
                                fontWeight: '700',
                                padding: '0.55rem 1rem',
                                borderRadius: 'var(--radius-md)',
                                textDecoration: 'none',
                                fontSize: '0.825rem',
                                boxShadow: '0 2px 4px rgba(37, 211, 102, 0.25)',
                                transition: 'all 0.15s ease'
                              }}
                            >
                              <WhatsAppIcon size={16} />
                              <span>{t('sendWhatsAppProof', 'Send Transfer Screenshot on WhatsApp (إرسال الإشعار عبر واتساب)')}</span>
                            </a>
                          </div>

                          {b.booking_notes && (
                            <p style={{ fontSize: '0.8rem', color: '#64748b', margin: '0 0 0.5rem 0', fontStyle: 'italic' }}>
                              {isRTL ? 'ملاحظات:' : 'Notes:'} "{b.booking_notes}"
                            </p>
                          )}

                          <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                            {t('bookedOn', 'Booked on')} {new Date(b.created_at).toLocaleString()}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Active Subscribed Classes Banner (if student is enrolled with any teacher) */}
            {subscriptions && subscriptions.length > 0 && (
              <div style={{
                marginTop: '3rem',
                borderTop: '1px solid #e2e8f0',
                paddingTop: '1.5rem'
              }}>
                <h3 style={{ fontSize: '1rem', fontWeight: '700', color: '#0f172a', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <BookOpen size={16} /> Enrolled Classes ({subscriptions.length})
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '0.75rem' }}>
                  {(subscriptions || []).map((sub) => (
                    <div 
                      key={sub.subscription_id || sub.id}
                      onClick={() => onSelectTeacher(sub.teacher_id)}
                      style={{
                        padding: '0.75rem 1rem',
                        backgroundColor: '#f8fafc',
                        border: '1px solid #e2e8f0',
                        borderRadius: 'var(--radius-sm)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: '700', fontSize: '0.875rem', color: '#0f172a' }}>{sub.teacher_name}</div>
                        <div style={{ fontSize: '0.75rem', color: '#16a34a', fontWeight: '600' }}>Active Enrollment</div>
                      </div>
                      <ArrowRight size={14} color="#64748b" />
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        )}

      </div>
    </div>
  );
}
