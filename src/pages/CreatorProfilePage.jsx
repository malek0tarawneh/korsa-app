import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { createWhatsAppCliqProofUrl } from '../utils/whatsapp';
import { 
  Share2, 
  Copy, 
  Check, 
  Download, 
  ArrowLeft, 
  Star, 
  Users, 
  BookOpen, 
  Clock, 
  CheckCircle2, 
  Play, 
  Lock, 
  ShieldCheck, 
  Zap, 
  Calendar, 
  Gift, 
  Phone, 
  FileText 
} from 'lucide-react';

const WhatsAppIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.149.929 3.182 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.771-5.768-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.299.045-.677.063-1.092-.069-.252-.08-.575-.187-.988-.365-1.739-.751-2.874-2.502-2.961-2.617-.087-.116-.708-.94-.708-1.793s.448-1.273.607-1.446c.159-.173.346-.217.462-.217l.332.006c.106.005.249-.04.39.298.144.347.491 1.2.534 1.287.043.087.072.188.014.304-.058.116-.087.188-.173.289l-.26.304c-.087.086-.177.18-.076.354.101.174.449.741.964 1.201.662.591 1.221.774 1.394.86.173.086.274.072.376-.043.101-.116.433-.506.549-.68.116-.173.231-.145.39-.087s1.011.477 1.184.564.289.13.332.203c.043.072.043.419-.101.824z"/>
    <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 1.89.525 3.66 1.438 5.168L2.05 21.65a.75.75 0 0 0 .927.927l4.482-1.388A9.96 9.96 0 0 0 12 22c5.523 0 10-4.477 10-10S17.523 2 12 2zm-8.5 10c0-4.694 3.806-8.5 8.5-8.5s8.5 3.806 8.5 8.5-3.806 8.5-8.5 8.5a8.47 8.47 0 0 1-4.298-1.164.75.75 0 0 0-.49-.082l-3.268 1.012 1.012-3.268a.75.75 0 0 0-.082-.49A8.47 8.47 0 0 1 3.5 12z"/>
  </svg>
);

const YoutubeIcon = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
  </svg>
);

const LinkedinIcon = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 8.76a1.64 1.64 0 1 0 0-3.28 1.64 1.64 0 0 0 0 3.28m1.4 9.74V10.13H5.06v8.37h2.8z"/>
  </svg>
);

const TwitterIcon = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
  </svg>
);

export default function CreatorProfilePage({ 
  handle, 
  onBack, 
  onOpenSubscribe, 
  onOpenLesson,
  onOpenAuth 
}) {
  const { user, token } = useAuth();
  const [creatorData, setCreatorData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Modals & feedback
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCliq, setCopiedCliq] = useState(false);
  const [claimModal, setClaimModal] = useState({ isOpen: false, leadMagnet: null });
  const [claimEmail, setClaimEmail] = useState(user ? user.email : '');
  const [claimName, setClaimName] = useState(user ? user.name : '');
  const [claiming, setClaiming] = useState(false);
  const [claimSuccess, setClaimSuccess] = useState(null);

  // Booking Modal
  const [bookingModal, setBookingModal] = useState({ isOpen: false, service: null });
  const [bookingName, setBookingName] = useState(user ? user.name : '');
  const [bookingEmail, setBookingEmail] = useState(user ? user.email : '');
  const [bookingPhone, setBookingPhone] = useState('');
  const [bookingCliqRef, setBookingCliqRef] = useState('');
  const [bookingNotes, setBookingNotes] = useState('');
  const [bookingSubmitting, setBookingSubmitting] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(null);

  // Fetch creator profile by handle
  const loadCreator = async () => {
    setLoading(true);
    setError('');
    try {
      const headers = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const cleanHandle = (handle || '').replace(/^@/, '');
      const res = await fetch(`/api/creators/${encodeURIComponent(cleanHandle)}`, { headers });
      
      if (res.ok) {
        const json = await res.json();
        setCreatorData(json);
      } else {
        const errJson = await res.json();
        setError(errJson.error || 'Teacher profile not found');
      }
    } catch (err) {
      console.error('Failed to load teacher:', err);
      setError('Network error while loading teacher page');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (handle) {
      loadCreator();
    }
  }, [handle, token]);

  useEffect(() => {
    if (user) {
      if (!claimEmail) setClaimEmail(user.email);
      if (!claimName) setClaimName(user.name);
      if (!bookingEmail) setBookingEmail(user.email);
      if (!bookingName) setBookingName(user.name);
    }
  }, [user]);

  // Share profile
  const handleShareProfile = async () => {
    const url = window.location.href;
    const title = `${creatorData?.creator?.name} on Korsa`;
    const text = `Check out ${creatorData?.creator?.name}'s study guides and sessions on Korsa!`;

    if (navigator.share) {
      try {
        await navigator.share({ title, text, url });
        return;
      } catch (err) {
        // Fallback to clipboard
      }
    }

    try {
      await navigator.clipboard.writeText(url);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    } catch (err) {
      console.warn('Clipboard write failed:', err);
    }
  };

  const handleCopyCliqAlias = (alias) => {
    if (!alias) return;
    navigator.clipboard.writeText(alias);
    setCopiedCliq(true);
    setTimeout(() => setCopiedCliq(false), 2500);
  };

  // Claim free study guide
  const handleClaimLeadMagnet = async (e) => {
    e.preventDefault();
    if (!claimModal.leadMagnet) return;

    setClaiming(true);
    try {
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`/api/lead-magnets/${claimModal.leadMagnet.id}/claim`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          email: claimEmail,
          name: claimName
        })
      });

      const resData = await res.json();
      if (res.ok) {
        setClaimSuccess(resData);
        setCreatorData(prev => {
          if (!prev) return prev;
          return {
            ...prev,
            lead_magnets: prev.lead_magnets.map(lm => 
              lm.id === claimModal.leadMagnet.id ? { ...lm, downloads_count: Number(lm.downloads_count || 0) + 1 } : lm
            )
          };
        });
      } else {
        alert(resData.error || 'Failed to download guide');
      }
    } catch (err) {
      alert('Error downloading free study guide');
    } finally {
      setClaiming(false);
    }
  };

  // Book 1-on-1 Session with CLIQ
  const handleBookService = async (e) => {
    e.preventDefault();
    if (!bookingModal.service) return;

    if (!token) {
      onOpenAuth('login');
      return;
    }

    setBookingSubmitting(true);
    try {
      const headers = { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}` 
      };

      const res = await fetch(`/api/services/${bookingModal.service.id}/book`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          student_name: bookingName,
          student_email: bookingEmail,
          student_phone: bookingPhone,
          cliq_reference: bookingCliqRef,
          payment_method: 'CLIQ',
          booking_notes: bookingNotes
        })
      });

      const resData = await res.json();
      if (res.ok) {
        setBookingSuccess(resData);
      } else {
        alert(resData.error || 'Failed to book session');
      }
    } catch (err) {
      alert('Error submitting session booking');
    } finally {
      setBookingSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="container" style={{ padding: '5rem 1rem', textAlign: 'center' }}>
        <p style={{ color: 'var(--color-text-muted)', fontWeight: '600' }}>Loading teacher profile...</p>
      </div>
    );
  }

  if (error || !creatorData || !creatorData.creator) {
    return (
      <div className="container" style={{ padding: '4rem 1rem', textAlign: 'center', maxWidth: '480px' }}>
        <div style={{ padding: '2rem', backgroundColor: '#fff', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)' }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: '800', marginBottom: '0.5rem' }}>Teacher Not Found</h3>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
            We could not locate a teacher with handle <strong>@{handle}</strong>.
          </p>
          <button onClick={onBack} className="btn btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
            <ArrowLeft size={16} /> Back to Search
          </button>
        </div>
      </div>
    );
  }

  const { creator, stats, lead_magnets, services, courses, reviews, isSubscribed } = creatorData;
  const priceJod = creator.monthly_price_jod || Math.round(parseFloat(creator.monthly_price || '10'));
  const cliqAlias = creator.cliq_alias || 'REEDMATH';
  const bankName = creator.bank_name || 'Arab Bank (البنك العربي)';
  const walletPhone = creator.wallet_phone || '0795551234';

  return (
    <div style={{ backgroundColor: '#ffffff', minHeight: '100vh', paddingBottom: '5rem' }}>
      
      {/* Top Breadcrumb */}
      <div style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid var(--color-border)', padding: '0.75rem 0' }}>
        <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <button 
            onClick={onBack} 
            className="btn btn-secondary btn-sm"
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: '600' }}
          >
            <ArrowLeft size={15} /> All Teachers
          </button>

          <button 
            onClick={handleShareProfile}
            className="btn btn-secondary btn-sm"
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: '600' }}
          >
            {copiedLink ? <Check size={15} color="green" /> : <Share2 size={15} />}
            {copiedLink ? 'Link Copied!' : 'Share Profile'}
          </button>
        </div>
      </div>

      {/* Teacher Profile Header - Substack Style */}
      <header style={{
        borderBottom: '1px solid #e2e8f0',
        padding: '2.5rem 0 2rem 0',
        backgroundColor: '#ffffff'
      }}>
        <div className="container" style={{ maxWidth: '840px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1.5rem', flexWrap: 'wrap' }}>
            
            {/* Avatar */}
            <img 
              src={creator.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${creator.name}`} 
              alt={creator.name}
              style={{
                width: '90px',
                height: '90px',
                borderRadius: '9999px',
                objectFit: 'cover',
                border: '3px solid #e2e8f0'
              }}
            />

            {/* Teacher Details */}
            <div style={{ flex: 1, minWidth: '260px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                <h1 style={{ fontSize: '1.75rem', fontWeight: '800', color: '#0f172a', margin: 0 }}>
                  {creator.name}
                </h1>
                <span style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--color-primary)' }}>
                  @{creator.handle}
                </span>
                <span style={{
                  fontSize: '0.75rem',
                  fontWeight: '700',
                  padding: '0.15rem 0.5rem',
                  borderRadius: '9999px',
                  backgroundColor: '#eff6ff',
                  color: '#1d4ed8'
                }}>
                  Jordan
                </span>
              </div>

              <p style={{ fontSize: '1rem', color: '#475569', fontWeight: '500', marginTop: '0.35rem', marginBottom: '0.75rem', lineHeight: 1.4 }}>
                {creator.headline}
              </p>

              {/* Social Links */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
                {creator.external_links?.youtube && (
                  <a href={creator.external_links.youtube} target="_blank" rel="noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', color: '#dc2626', fontSize: '0.75rem', fontWeight: '600', backgroundColor: '#fef2f2', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>
                    <YoutubeIcon size={13} /> YouTube
                  </a>
                )}
                {creator.external_links?.linkedin && (
                  <a href={creator.external_links.linkedin} target="_blank" rel="noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', color: '#0284c7', fontSize: '0.75rem', fontWeight: '600', backgroundColor: '#f0f9ff', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>
                    <LinkedinIcon size={13} /> LinkedIn
                  </a>
                )}
                {creator.external_links?.twitter && (
                  <a href={creator.external_links.twitter} target="_blank" rel="noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', color: '#334155', fontSize: '0.75rem', fontWeight: '600', backgroundColor: '#f1f5f9', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>
                    <TwitterIcon size={13} /> X / Twitter
                  </a>
                )}
              </div>

              {/* Stats Bar */}
              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', fontSize: '0.825rem', color: '#64748b' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  <Star size={14} color="#d97706" fill="#d97706" />
                  <strong style={{ color: '#0f172a' }}>{creator.rating?.toFixed(1) || '5.0'}</strong> ({creator.review_count} reviews)
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  <Users size={14} />
                  <strong style={{ color: '#0f172a' }}>{creator.subscriber_count}</strong> Students
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  <Download size={14} color="#059669" />
                  <strong style={{ color: '#0f172a' }}>{stats?.total_downloads || 0}</strong> Free Guide Downloads
                </span>
              </div>

            </div>

            {/* Monthly Subscription Action Box */}
            <div style={{
              backgroundColor: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: 'var(--radius-lg)',
              padding: '1.25rem',
              textAlign: 'center',
              minWidth: '200px'
            }}>
              <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: '700', textTransform: 'uppercase' }}>
                Monthly Class Access
              </div>
              <div style={{ fontSize: '1.6rem', fontWeight: '800', color: '#0f172a', margin: '0.2rem 0' }}>
                {priceJod} JOD<span style={{ fontSize: '0.8rem', fontWeight: '500', color: '#64748b' }}>/mo</span>
              </div>
              <p style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '0.75rem' }}>
                All lessons & study materials
              </p>

              {isSubscribed ? (
                <div style={{
                  padding: '0.45rem',
                  backgroundColor: '#dcfce7',
                  color: '#15803d',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.8rem',
                  fontWeight: '700',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.3rem'
                }}>
                  <CheckCircle2 size={15} /> Enrolled Active
                </div>
              ) : (
                <button 
                  onClick={() => onOpenSubscribe(creator)}
                  className="btn btn-primary"
                  style={{ width: '100%', padding: '0.5rem', fontSize: '0.85rem', fontWeight: '700' }}
                >
                  Join for {priceJod} JOD/mo
                </button>
              )}
            </div>

          </div>

          {/* Local CLIQ & Wallet Payment Banner */}
          <div style={{
            marginTop: '1.5rem',
            backgroundColor: '#eff6ff',
            border: '1px solid #bfdbfe',
            borderRadius: 'var(--radius-md)',
            padding: '0.9rem 1.25rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '0.75rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <Zap size={20} color="var(--color-primary)" />
              <div style={{ fontSize: '0.85rem' }}>
                <span style={{ fontWeight: '700', color: '#1e3a8a' }}>Local CLIQ & Wallet Payouts: </span>
                <span style={{ color: '#1e40af' }}>
                  CLIQ Alias: <strong>{cliqAlias}</strong> · Bank: <strong>{bankName}</strong> · Zain Cash: <strong>{walletPhone}</strong>
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <button
                type="button"
                onClick={() => handleCopyCliqAlias(cliqAlias)}
                style={{
                  fontSize: '0.75rem',
                  fontWeight: '700',
                  padding: '0.25rem 0.6rem',
                  backgroundColor: '#ffffff',
                  border: '1px solid #93c5fd',
                  borderRadius: 'var(--radius-sm)',
                  color: 'var(--color-primary)',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.3rem'
                }}
              >
                {copiedCliq ? <Check size={12} color="green" /> : <Copy size={12} />}
                {copiedCliq ? 'Copied' : `Copy CLIQ: ${cliqAlias}`}
              </button>
              <span style={{
                fontSize: '0.7rem',
                fontWeight: '700',
                backgroundColor: '#dcfce7',
                color: '#15803d',
                padding: '0.2rem 0.5rem',
                borderRadius: '9999px'
              }}>
                0% Fees
              </span>
            </div>
          </div>

        </div>
      </header>

      {/* Main Content Sections */}
      <main className="container" style={{ maxWidth: '840px', marginTop: '2rem' }}>
        
        {/* Bio Card */}
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: 'var(--radius-md)',
          padding: '1.5rem',
          border: '1px solid #e2e8f0',
          marginBottom: '2rem'
        }}>
          <h3 style={{ fontSize: '1.05rem', fontWeight: '800', color: '#0f172a', marginBottom: '0.5rem' }}>
            About {creator.name}
          </h3>
          <p style={{ color: '#334155', lineHeight: 1.6, fontSize: '0.925rem', margin: 0 }}>
            {creator.custom_bio || creator.bio}
          </p>
          <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginTop: '1rem' }}>
            {creator.subjects?.map((sub, idx) => (
              <span key={idx} style={{ fontSize: '0.75rem', padding: '0.15rem 0.5rem', backgroundColor: '#eff6ff', color: '#1e40af', borderRadius: '4px', fontWeight: '500' }}>
                {sub}
              </span>
            ))}
            {creator.educational_levels?.map((lvl, idx) => (
              <span key={idx} style={{ fontSize: '0.75rem', padding: '0.15rem 0.5rem', backgroundColor: '#f1f5f9', color: '#475569', borderRadius: '4px', fontWeight: '500' }}>
                {lvl}
              </span>
            ))}
          </div>
        </div>

        {/* 1. FREE STUDY GUIDES SECTION (دوسيات وتلخيصات مجانية) */}
        <section style={{ marginBottom: '2.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', color: '#059669', fontWeight: '700', fontSize: '0.8rem', textTransform: 'uppercase' }}>
                <Gift size={14} /> Free Downloads
              </div>
              <h2 style={{ fontSize: '1.35rem', fontWeight: '800', color: '#0f172a', margin: '0.15rem 0 0 0' }}>
                Free Study Guides & Summaries (دوسيات)
              </h2>
            </div>
            <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
              100% Free · Instant Access
            </span>
          </div>

          {lead_magnets && lead_magnets.length > 0 ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem' }}>
              {lead_magnets.map((lm) => (
                <div 
                  key={lm.id}
                  style={{
                    backgroundColor: '#ffffff',
                    borderRadius: 'var(--radius-md)',
                    padding: '1.25rem',
                    border: '1px solid #e2e8f0',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.03)'
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                      <span style={{
                        backgroundColor: '#dcfce7',
                        color: '#15803d',
                        fontWeight: '700',
                        fontSize: '0.7rem',
                        padding: '0.15rem 0.45rem',
                        borderRadius: '9999px'
                      }}>
                        FREE GUIDE
                      </span>
                      <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                        {lm.downloads_count} downloads
                      </span>
                    </div>

                    <h4 style={{ fontSize: '1rem', fontWeight: '700', color: '#0f172a', marginBottom: '0.35rem', lineHeight: 1.35 }}>
                      {lm.title}
                    </h4>

                    <p style={{ fontSize: '0.825rem', color: '#64748b', lineHeight: 1.5, marginBottom: '1rem' }}>
                      {lm.description}
                    </p>
                  </div>

                  <button 
                    onClick={() => {
                      setClaimModal({ isOpen: true, leadMagnet: lm });
                      setClaimSuccess(null);
                    }}
                    className="btn btn-primary"
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.4rem',
                      padding: '0.5rem',
                      fontSize: '0.825rem',
                      fontWeight: '700'
                    }}
                  >
                    <Download size={15} /> Download Free PDF
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ backgroundColor: '#f8fafc', padding: '1.5rem', textAlign: 'center', borderRadius: 'var(--radius-md)', border: '1px solid #e2e8f0', color: '#64748b', fontSize: '0.9rem' }}>
              No study guides published yet.
            </div>
          )}
        </section>

        {/* 2. 1-ON-1 SESSIONS & REVIEWS (حصص فردية ومراجعات) */}
        <section style={{ marginBottom: '2.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', color: '#d97706', fontWeight: '700', fontSize: '0.8rem', textTransform: 'uppercase' }}>
                <Calendar size={14} /> Individual Tutoring
              </div>
              <h2 style={{ fontSize: '1.35rem', fontWeight: '800', color: '#0f172a', margin: '0.15rem 0 0 0' }}>
                1-on-1 Sessions & Reviews (حصص فردية)
              </h2>
            </div>
            <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
              Pay via CLIQ / Zain Cash
            </span>
          </div>

          {services && services.length > 0 ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem' }}>
              {services.map((srv) => {
                const srvPriceJod = srv.price_jod || Math.round(srv.price_cents / 100);

                return (
                  <div 
                    key={srv.id}
                    style={{
                      backgroundColor: '#ffffff',
                      borderRadius: 'var(--radius-md)',
                      padding: '1.25rem',
                      border: '1px solid #e2e8f0',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      boxShadow: '0 1px 2px rgba(0,0,0,0.03)'
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                        <span style={{
                          backgroundColor: '#fef3c7',
                          color: '#b45309',
                          fontWeight: '700',
                          fontSize: '0.7rem',
                          padding: '0.15rem 0.45rem',
                          borderRadius: '9999px'
                        }}>
                          {srv.service_type === 'mentorship' ? '1-on-1 Mentorship' : srv.service_type === 'qa_session' ? 'Live Q&A' : 'Review Session'}
                        </span>

                        <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                          <Clock size={12} /> {srv.duration_minutes} mins
                        </span>
                      </div>

                      <h4 style={{ fontSize: '1rem', fontWeight: '700', color: '#0f172a', marginBottom: '0.35rem', lineHeight: 1.35 }}>
                        {srv.title}
                      </h4>

                      <div style={{ fontSize: '1.3rem', fontWeight: '800', color: '#0f172a', marginBottom: '1rem' }}>
                        {srvPriceJod} JOD
                      </div>
                    </div>

                    <button 
                      onClick={() => {
                        setBookingModal({ isOpen: true, service: srv });
                        setBookingSuccess(null);
                        setBookingCliqRef('');
                        setBookingNotes('');
                      }}
                      className="btn btn-secondary"
                      style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.4rem',
                        padding: '0.55rem',
                        fontSize: '0.85rem',
                        fontWeight: '700'
                      }}
                    >
                      <Calendar size={15} /> Book Session ({srvPriceJod} JOD)
                    </button>
                  </div>
                );
              })}
            </div>
          ) : (
            <div style={{ backgroundColor: '#f8fafc', padding: '1.5rem', textAlign: 'center', borderRadius: 'var(--radius-md)', border: '1px solid #e2e8f0', color: '#64748b', fontSize: '0.9rem' }}>
              No 1-on-1 sessions currently offered.
            </div>
          )}
        </section>

        {/* 3. COURSES & LESSONS */}
        <section style={{ marginBottom: '2.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', color: 'var(--color-primary)', fontWeight: '700', fontSize: '0.8rem', textTransform: 'uppercase' }}>
                <BookOpen size={14} /> Curriculum
              </div>
              <h2 style={{ fontSize: '1.35rem', fontWeight: '800', color: '#0f172a', margin: '0.15rem 0 0 0' }}>
                Courses & Sample Lessons
              </h2>
            </div>
            <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
              {stats?.course_count || courses.length} Courses
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {courses.map((course) => (
              <div 
                key={course.id}
                style={{
                  backgroundColor: '#ffffff',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid #e2e8f0',
                  overflow: 'hidden'
                }}
              >
                <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid #f1f5f9', backgroundColor: '#fcfcfd' }}>
                  <span style={{ fontSize: '0.725rem', fontWeight: '700', color: 'var(--color-primary)', textTransform: 'uppercase' }}>
                    {course.subject_name || 'General'} · {course.educational_level}
                  </span>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: '800', color: '#0f172a', margin: '2px 0 0 0' }}>
                    {course.title}
                  </h3>
                  <p style={{ fontSize: '0.825rem', color: '#64748b', marginTop: '3px', margin: '3px 0 0 0' }}>
                    {course.description}
                  </p>
                </div>

                <div style={{ padding: '0.75rem 1.25rem' }}>
                  {course.sections?.map((section) => (
                    <div key={section.id} style={{ marginBottom: '0.75rem' }}>
                      <h5 style={{ fontSize: '0.75rem', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', marginBottom: '0.4rem' }}>
                        {section.title}
                      </h5>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                        {section.lessons?.map((lesson) => {
                          const isUnlocked = !lesson.is_locked;

                          return (
                            <div 
                              key={lesson.id}
                              onClick={() => {
                                if (isUnlocked) {
                                  onOpenLesson(lesson, creator);
                                } else {
                                  onOpenSubscribe(creator);
                                }
                              }}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                padding: '0.6rem 0.85rem',
                                borderRadius: 'var(--radius-sm)',
                                backgroundColor: isUnlocked ? '#f0fdf4' : '#ffffff',
                                border: isUnlocked ? '1px solid #bbf7d0' : '1px solid #f1f5f9',
                                cursor: 'pointer'
                              }}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                                <div style={{
                                  width: '26px',
                                  height: '26px',
                                  borderRadius: '9999px',
                                  backgroundColor: isUnlocked ? 'var(--color-primary)' : '#e2e8f0',
                                  color: isUnlocked ? '#fff' : '#64748b',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center'
                                }}>
                                  {isUnlocked ? <Play size={12} fill="#fff" /> : <Lock size={12} />}
                                </div>

                                <div>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                    <span style={{ fontSize: '0.85rem', fontWeight: '600', color: isUnlocked ? '#0f172a' : '#475569' }}>
                                      {lesson.title}
                                    </span>
                                    {lesson.is_free_preview && (
                                      <span style={{
                                        backgroundColor: '#dcfce7',
                                        color: '#16a34a',
                                        fontSize: '0.65rem',
                                        fontWeight: '800',
                                        padding: '0.05rem 0.35rem',
                                        borderRadius: '9999px'
                                      }}>
                                        FREE SAMPLE
                                      </span>
                                    )}
                                  </div>
                                  <span style={{ fontSize: '0.725rem', color: '#64748b' }}>
                                    {lesson.duration_minutes} mins
                                  </span>
                                </div>
                              </div>

                              <div>
                                {isUnlocked ? (
                                  <span style={{ fontSize: '0.775rem', fontWeight: '700', color: 'var(--color-primary)' }}>
                                    Watch →
                                  </span>
                                ) : (
                                  <span style={{ fontSize: '0.725rem', fontWeight: '600', color: '#94a3b8' }}>
                                    Locked
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 4. REVIEWS */}
        {reviews && reviews.length > 0 && (
          <section style={{ marginBottom: '2.5rem' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: '800', color: '#0f172a', marginBottom: '0.75rem' }}>
              Student Feedback
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '0.75rem' }}>
              {reviews.map((rev) => (
                <div 
                  key={rev.id}
                  style={{
                    backgroundColor: '#ffffff',
                    borderRadius: 'var(--radius-md)',
                    padding: '1rem',
                    border: '1px solid #e2e8f0'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                    <span style={{ fontSize: '0.825rem', fontWeight: '700', color: '#0f172a' }}>{rev.student_name}</span>
                    <div style={{ display: 'flex' }}>
                      {[...Array(5)].map((_, i) => (
                        <Star 
                          key={i} 
                          size={12} 
                          color="#d97706" 
                          fill={i < rev.rating ? '#d97706' : 'transparent'} 
                        />
                      ))}
                    </div>
                  </div>
                  <p style={{ fontSize: '0.825rem', color: '#475569', lineHeight: 1.5, margin: 0 }}>
                    "{rev.comment}"
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}

      </main>

      {/* FREE STUDY GUIDE CLAIM MODAL */}
      {claimModal.isOpen && claimModal.leadMagnet && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '1rem'
        }}>
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: 'var(--radius-lg)',
            maxWidth: '440px',
            width: '100%',
            padding: '1.75rem',
            position: 'relative'
          }}>
            
            {claimSuccess ? (
              <div style={{ textAlign: 'center', padding: '0.5rem 0' }}>
                <div style={{ width: '50px', height: '50px', borderRadius: '50%', backgroundColor: '#dcfce7', color: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem auto' }}>
                  <CheckCircle2 size={28} />
                </div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: '800', marginBottom: '0.4rem' }}>
                  Download Ready!
                </h3>
                <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '1.25rem' }}>
                  {claimSuccess.message}
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <a 
                    href={claimSuccess.file_url} 
                    target="_blank" 
                    rel="noreferrer"
                    className="btn btn-primary"
                    style={{ padding: '0.65rem', fontWeight: '700', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}
                  >
                    <Download size={16} /> Open & Download PDF
                  </a>
                  <button 
                    onClick={() => setClaimModal({ isOpen: false, leadMagnet: null })}
                    className="btn btn-secondary"
                  >
                    Close
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--color-primary)', fontWeight: '700', fontSize: '0.75rem', marginBottom: '0.25rem' }}>
                  <Gift size={14} /> FREE STUDY GUIDE
                </div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: '800', color: '#0f172a', marginBottom: '0.4rem' }}>
                  {claimModal.leadMagnet.title}
                </h3>
                <p style={{ fontSize: '0.825rem', color: '#64748b', marginBottom: '1rem', lineHeight: 1.5 }}>
                  Enter your email to receive immediate access to this free study guide from {creator.name}.
                </p>

                <form onSubmit={handleClaimLeadMagnet} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', marginBottom: '0.25rem' }}>
                      Your Name
                    </label>
                    <input 
                      type="text"
                      className="form-input"
                      placeholder="e.g. Ahmad Tariq"
                      value={claimName}
                      onChange={(e) => setClaimName(e.target.value)}
                      required
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', marginBottom: '0.25rem' }}>
                      Email Address
                    </label>
                    <input 
                      type="email"
                      className="form-input"
                      placeholder="you@email.com"
                      value={claimEmail}
                      onChange={(e) => setClaimEmail(e.target.value)}
                      required
                    />
                  </div>

                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                    <button 
                      type="button" 
                      onClick={() => setClaimModal({ isOpen: false, leadMagnet: null })} 
                      className="btn btn-secondary" 
                      style={{ flex: 1 }}
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit" 
                      className="btn btn-primary" 
                      disabled={claiming}
                      style={{ flex: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem' }}
                    >
                      {claiming ? 'Downloading...' : <><Download size={15} /> Get Free PDF</>}
                    </button>
                  </div>
                </form>
              </div>
            )}

          </div>
        </div>
      )}

      {/* 1-ON-1 BOOKING MODAL WITH CLIQ & CONFIRMATION CARD */}
      {bookingModal.isOpen && bookingModal.service && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '1rem'
        }}>
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: 'var(--radius-lg)',
            maxWidth: '480px',
            width: '100%',
            padding: '1.75rem',
            position: 'relative'
          }}>
            
            {bookingSuccess ? (
              /* CLEAN CONFIRMATION CARD (Pending Confirmation) */
              <div style={{ textAlign: 'center', padding: '0.5rem 0' }}>
                <div style={{ width: '56px', height: '56px', borderRadius: '50%', backgroundColor: '#ecfdf5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem auto' }}>
                  <CheckCircle2 size={32} />
                </div>
                
                <h3 style={{ fontSize: '1.25rem', fontWeight: '800', color: '#0f172a', marginBottom: '0.25rem' }}>
                  Booking Request Received!
                </h3>
                
                {/* Pending Confirmation Badge */}
                <div style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  backgroundColor: '#fef3c7',
                  color: '#92400e',
                  fontWeight: '700',
                  fontSize: '0.8rem',
                  padding: '0.25rem 0.75rem',
                  borderRadius: '9999px',
                  marginBottom: '1.25rem'
                }}>
                  <Clock size={14} /> Pending Teacher Confirmation
                </div>

                {/* Transfer Summary Card */}
                <div style={{
                  backgroundColor: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: 'var(--radius-md)',
                  padding: '1rem',
                  textAlign: 'left',
                  fontSize: '0.85rem',
                  marginBottom: '1.25rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.4rem'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#64748b' }}>Teacher:</span>
                    <strong style={{ color: '#0f172a' }}>{creator.name}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#64748b' }}>Teacher CLIQ Alias:</span>
                    <strong style={{ color: 'var(--color-primary)' }}>{cliqAlias}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#64748b' }}>Total Amount:</span>
                    <strong style={{ color: '#0f172a', fontSize: '0.95rem' }}>
                      {bookingSuccess.booking?.price_jod || Math.round(bookingModal.service.price_cents / 100)} JOD
                    </strong>
                  </div>
                  {bookingCliqRef && (
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#64748b' }}>Your CLIQ Ref:</span>
                      <strong style={{ fontFamily: 'monospace' }}>{bookingCliqRef}</strong>
                    </div>
                  )}
                </div>

                <p style={{ fontSize: '0.825rem', color: '#64748b', lineHeight: 1.5, marginBottom: '1.25rem' }}>
                  {creator.name} will verify the CLIQ transfer in their banking app and confirm your session. You can track this under <strong>My Bookings</strong>.
                </p>

                {/* WhatsApp Proof Button */}
                <div style={{ marginBottom: '1rem' }}>
                  <a
                    href={createWhatsAppCliqProofUrl({
                      teacherPhone: walletPhone,
                      studentName: bookingName || user?.name,
                      title: bookingModal.service?.title || 'الحصة الفردية',
                      priceJod: bookingSuccess.booking?.price_jod || Math.round(bookingModal.service.price_cents / 100),
                      cliqRef: bookingCliqRef
                    })}
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
                    <span>Send Transfer Screenshot on WhatsApp (إرسال الإشعار عبر واتساب)</span>
                  </a>
                </div>

                <button 
                  onClick={() => setBookingModal({ isOpen: false, service: null })}
                  className="btn btn-primary"
                  style={{ width: '100%', padding: '0.65rem', fontWeight: '700' }}
                >
                  Done
                </button>
              </div>
            ) : (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                  <span style={{ color: 'var(--color-primary)', fontWeight: '700', fontSize: '0.75rem', textTransform: 'uppercase' }}>
                    1-on-1 Session Booking
                  </span>
                  <span style={{ fontWeight: '800', fontSize: '1.1rem', color: '#0f172a' }}>
                    {bookingModal.service.price_jod || Math.round(bookingModal.service.price_cents / 100)} JOD
                  </span>
                </div>

                <h3 style={{ fontSize: '1.15rem', fontWeight: '800', color: '#0f172a', marginBottom: '0.2rem' }}>
                  {bookingModal.service.title}
                </h3>
                <p style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '1rem' }}>
                  {bookingModal.service.duration_minutes} minutes direct session with {creator.name}.
                </p>

                {/* CLIQ Payout Instructions Card */}
                <div style={{
                  backgroundColor: '#eff6ff',
                  border: '1px solid #bfdbfe',
                  borderRadius: 'var(--radius-md)',
                  padding: '0.85rem',
                  fontSize: '0.825rem',
                  marginBottom: '1rem'
                }}>
                  <div style={{ fontWeight: '700', color: '#1e3a8a', marginBottom: '0.35rem' }}>
                    1. Send {bookingModal.service.price_jod || Math.round(bookingModal.service.price_cents / 100)} JOD via CLIQ or Zain Cash:
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.2rem' }}>
                    <span style={{ color: '#475569' }}>Teacher CLIQ Alias:</span>
                    <strong style={{ color: 'var(--color-primary)' }}>{cliqAlias}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.2rem' }}>
                    <span style={{ color: '#475569' }}>Bank Name:</span>
                    <strong>{bankName}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#475569' }}>Zain Cash / Orange:</span>
                    <strong>{walletPhone}</strong>
                  </div>
                </div>

                <form onSubmit={handleBookService} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', marginBottom: '0.2rem' }}>
                      Student Name
                    </label>
                    <input 
                      type="text"
                      className="form-input"
                      placeholder="e.g. Maya Lin"
                      value={bookingName}
                      onChange={(e) => setBookingName(e.target.value)}
                      required
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', marginBottom: '0.2rem' }}>
                        Email
                      </label>
                      <input 
                        type="email"
                        className="form-input"
                        placeholder="you@email.com"
                        value={bookingEmail}
                        onChange={(e) => setBookingEmail(e.target.value)}
                        required
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', marginBottom: '0.2rem' }}>
                        Phone / WhatsApp
                      </label>
                      <input 
                        type="tel"
                        className="form-input"
                        placeholder="079XXXXXXX"
                        value={bookingPhone}
                        onChange={(e) => setBookingPhone(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', marginBottom: '0.2rem' }}>
                      CLIQ Transfer Reference Number
                    </label>
                    <input 
                      type="text"
                      className="form-input"
                      placeholder="e.g. CLIQ-12345678 or Bank Receipt #"
                      value={bookingCliqRef}
                      onChange={(e) => setBookingCliqRef(e.target.value)}
                      required
                    />
                    <span style={{ fontSize: '0.7rem', color: '#64748b', display: 'block', marginTop: '2px' }}>
                      Enter the reference number from your banking or wallet transfer confirmation.
                    </span>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', marginBottom: '0.2rem' }}>
                      Topic or Questions (Optional)
                    </label>
                    <textarea 
                      className="form-input"
                      rows={2}
                      placeholder="What exam topics or homework questions do you want to cover?"
                      value={bookingNotes}
                      onChange={(e) => setBookingNotes(e.target.value)}
                    />
                  </div>

                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.4rem' }}>
                    <button 
                      type="button" 
                      onClick={() => setBookingModal({ isOpen: false, service: null })} 
                      className="btn btn-secondary" 
                      style={{ flex: 1 }}
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit" 
                      className="btn btn-primary" 
                      disabled={bookingSubmitting}
                      style={{ flex: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', fontWeight: '700' }}
                    >
                      {bookingSubmitting ? 'Submitting...' : `Submit Booking (${bookingModal.service.price_jod || Math.round(bookingModal.service.price_cents / 100)} JOD)`}
                    </button>
                  </div>
                </form>
              </div>
            )}

          </div>
        </div>
      )}

    </div>
  );
}
