import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Share2, 
  Copy, 
  Check, 
  Sparkles, 
  Download, 
  ArrowLeft, 
  Star, 
  Users, 
  BookOpen, 
  Clock, 
  CheckCircle2, 
  ExternalLink, 
  Play, 
  Lock, 
  MessageSquare, 
  Globe, 
  ShieldCheck, 
  Zap,
  Calendar,
  Gift,
  HelpCircle,
  FileText
} from 'lucide-react';

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

const GithubIcon = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/>
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
  const [claimModal, setClaimModal] = useState({ isOpen: false, leadMagnet: null });
  const [claimEmail, setClaimEmail] = useState(user ? user.email : '');
  const [claimName, setClaimName] = useState(user ? user.name : '');
  const [claiming, setClaiming] = useState(false);
  const [claimSuccess, setClaimSuccess] = useState(null);

  // Booking Modal
  const [bookingModal, setBookingModal] = useState({ isOpen: false, service: null });
  const [bookingName, setBookingName] = useState(user ? user.name : '');
  const [bookingEmail, setBookingEmail] = useState(user ? user.email : '');
  const [bookingNotes, setBookingNotes] = useState('');
  const [bookingSubmitting, setBookingSubmitting] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(null);

  // Fetch creator profile by vanity handle
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
        setError(errJson.error || 'Creator profile not found');
      }
    } catch (err) {
      console.error('Failed to load creator:', err);
      setError('Network error while loading creator page');
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

  // Share profile using native Web Share API with clipboard copy fallback
  const handleShareProfile = async () => {
    const url = window.location.href;
    const title = `${creatorData?.creator?.name} on Korsa`;
    const text = `Check out ${creatorData?.creator?.name}'s free study guides and courses on Korsa!`;

    if (navigator.share) {
      try {
        await navigator.share({ title, text, url });
        return;
      } catch (err) {
        // User dismissed share dialog or fallback needed
      }
    }

    try {
      await navigator.clipboard.writeText(url);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 3000);
    } catch (err) {
      console.warn('Clipboard write failed:', err);
    }
  };

  // Claim free lead magnet
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
        // Refresh local download count
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
        alert(resData.error || 'Failed to unlock guide');
      }
    } catch (err) {
      alert('Error unlocking free resource');
    } finally {
      setClaiming(false);
    }
  };

  // Book micro-service
  const handleBookService = async (e) => {
    e.preventDefault();
    if (!bookingModal.service) return;

    setBookingSubmitting(true);
    try {
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`/api/services/${bookingModal.service.id}/book`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          student_name: bookingName,
          student_email: bookingEmail,
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
      alert('Error processing booking request');
    } finally {
      setBookingSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="container" style={{ padding: '6rem 1rem', textAlign: 'center' }}>
        <div style={{ display: 'inline-block', width: '40px', height: '40px', border: '3px solid var(--color-border)', borderTopColor: 'var(--color-primary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        <p style={{ marginTop: '1rem', color: 'var(--color-text-muted)', fontWeight: '600' }}>Loading creator hub...</p>
      </div>
    );
  }

  if (error || !creatorData || !creatorData.creator) {
    return (
      <div className="container" style={{ padding: '5rem 1rem', textAlign: 'center', maxWidth: '520px' }}>
        <div style={{ padding: '2rem', backgroundColor: '#fff', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-sm)' }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: '800', marginBottom: '0.5rem' }}>Creator Profile Not Found</h3>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
            We could not locate a creator with handle <strong>@{handle}</strong>.
          </p>
          <button onClick={onBack} className="btn btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
            <ArrowLeft size={16} /> Back to Browse
          </button>
        </div>
      </div>
    );
  }

  const { creator, stats, lead_magnets, services, courses, reviews, isSubscribed } = creatorData;
  const isExpert = creator.tier === 'expert_creator';

  return (
    <div style={{ backgroundColor: '#f8fafc', minHeight: '100vh', paddingBottom: '5rem' }}>
      
      {/* Top Breadcrumb & Quick Actions */}
      <div style={{ backgroundColor: '#fff', borderBottom: '1px solid var(--color-border)', padding: '0.75rem 0' }}>
        <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <button 
            onClick={onBack} 
            className="btn btn-secondary"
            style={{ padding: '0.4rem 0.85rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
          >
            <ArrowLeft size={16} /> Explore All Teachers
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <button 
              onClick={handleShareProfile}
              className="btn btn-secondary"
              style={{ padding: '0.4rem 0.85rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
            >
              {copiedLink ? <Check size={16} color="var(--color-success)" /> : <Share2 size={16} />}
              {copiedLink ? 'Link Copied!' : 'Share Profile'}
            </button>
          </div>
        </div>
      </div>

      {/* Creator Hero Header Card */}
      <section style={{
        background: isExpert 
          ? 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 60%, #312e81 100%)' 
          : 'linear-gradient(135deg, #0f172a 0%, #064e3b 100%)',
        color: '#fff',
        padding: '3.5rem 0 3rem 0',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Glow ambient circle */}
        <div style={{
          position: 'absolute',
          top: '-10%',
          right: '5%',
          width: '400px',
          height: '400px',
          background: isExpert ? 'radial-gradient(circle, rgba(99, 102, 241, 0.25) 0%, transparent 70%)' : 'radial-gradient(circle, rgba(16, 185, 129, 0.2) 0%, transparent 70%)',
          borderRadius: '50%',
          pointerEvents: 'none'
        }} />

        <div className="container" style={{ maxWidth: '960px', position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '2rem', flexWrap: 'wrap' }}>
            
            {/* Avatar with Glow */}
            <div style={{ position: 'relative' }}>
              <img 
                src={creator.avatar_url || 'https://api.dicebear.com/7.x/initials/svg?seed=' + creator.name} 
                alt={creator.name}
                style={{
                  width: '120px',
                  height: '120px',
                  borderRadius: '50%',
                  objectFit: 'cover',
                  border: isExpert ? '4px solid #818cf8' : '4px solid #34d399',
                  boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)'
                }}
              />
              <div style={{
                position: 'absolute',
                bottom: '4px',
                right: '4px',
                backgroundColor: 'var(--color-primary)',
                color: '#fff',
                borderRadius: '50%',
                width: '28px',
                height: '28px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '2px solid #0f172a'
              }}>
                <ShieldCheck size={16} />
              </div>
            </div>

            {/* Creator Title & Meta */}
            <div style={{ flex: 1, minWidth: '280px' }}>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap', marginBottom: '0.4rem' }}>
                <h1 style={{ fontSize: '1.9rem', fontWeight: '800', letterSpacing: '-0.02em', margin: 0 }}>
                  {creator.name}
                </h1>
                
                {/* Vanity Handle Pill */}
                <span style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.15)',
                  padding: '0.2rem 0.6rem',
                  borderRadius: 'var(--radius-full)',
                  fontSize: '0.8rem',
                  fontWeight: '700',
                  color: '#e2e8f0',
                  letterSpacing: '0.01em'
                }}>
                  @{creator.handle}
                </span>

                {/* Tier Badge */}
                <span style={{
                  backgroundColor: isExpert ? 'rgba(129, 140, 248, 0.25)' : 'rgba(52, 211, 153, 0.25)',
                  color: isExpert ? '#c7d2fe' : '#a7f3d0',
                  border: isExpert ? '1px solid rgba(129, 140, 248, 0.5)' : '1px solid rgba(52, 211, 153, 0.5)',
                  padding: '0.2rem 0.65rem',
                  borderRadius: 'var(--radius-full)',
                  fontSize: '0.75rem',
                  fontWeight: '700',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.3rem'
                }}>
                  {isExpert ? '🌟 Expert Creator' : '🌱 Community Tutor'}
                </span>
              </div>

              <p style={{ fontSize: '1.05rem', color: '#cbd5e1', fontWeight: '500', marginBottom: '0.75rem', lineHeight: 1.4 }}>
                {creator.headline}
              </p>

              {/* Social Links Bar */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
                {creator.external_links?.youtube && (
                  <a 
                    href={creator.external_links.youtube} 
                    target="_blank" 
                    rel="noreferrer" 
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', color: '#f87171', backgroundColor: 'rgba(255,255,255,0.08)', padding: '0.25rem 0.6rem', borderRadius: 'var(--radius-sm)', fontSize: '0.75rem', fontWeight: '600' }}
                  >
                    <YoutubeIcon size={14} /> YouTube
                  </a>
                )}
                {creator.external_links?.linkedin && (
                  <a 
                    href={creator.external_links.linkedin} 
                    target="_blank" 
                    rel="noreferrer" 
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', color: '#60a5fa', backgroundColor: 'rgba(255,255,255,0.08)', padding: '0.25rem 0.6rem', borderRadius: 'var(--radius-sm)', fontSize: '0.75rem', fontWeight: '600' }}
                  >
                    <LinkedinIcon size={14} /> LinkedIn
                  </a>
                )}
                {creator.external_links?.twitter && (
                  <a 
                    href={creator.external_links.twitter} 
                    target="_blank" 
                    rel="noreferrer" 
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', color: '#e2e8f0', backgroundColor: 'rgba(255,255,255,0.08)', padding: '0.25rem 0.6rem', borderRadius: 'var(--radius-sm)', fontSize: '0.75rem', fontWeight: '600' }}
                  >
                    <TwitterIcon size={14} /> X / Twitter
                  </a>
                )}
                {creator.external_links?.github && (
                  <a 
                    href={creator.external_links.github} 
                    target="_blank" 
                    rel="noreferrer" 
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', color: '#e2e8f0', backgroundColor: 'rgba(255,255,255,0.08)', padding: '0.25rem 0.6rem', borderRadius: 'var(--radius-sm)', fontSize: '0.75rem', fontWeight: '600' }}
                  >
                    <GithubIcon size={14} /> GitHub
                  </a>
                )}
              </div>

              {/* Stat Badges */}
              <div style={{ display: 'flex', gap: '1.25rem', flexWrap: 'wrap', fontSize: '0.825rem', color: '#94a3b8' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <Star size={15} color="#fbbf24" fill="#fbbf24" />
                  <strong style={{ color: '#fff' }}>{creator.rating.toFixed(1)}</strong> ({creator.review_count} reviews)
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <Users size={15} color="#94a3b8" />
                  <strong style={{ color: '#fff' }}>{creator.subscriber_count}</strong> Subscribers
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <Download size={15} color="#34d399" />
                  <strong style={{ color: '#fff' }}>{stats.total_downloads}</strong> Free Resource Downloads
                </span>
              </div>

            </div>

            {/* Subscription Action Button */}
            <div style={{
              backgroundColor: 'rgba(255, 255, 255, 0.08)',
              backdropFilter: 'blur(8px)',
              borderRadius: 'var(--radius-md)',
              padding: '1.25rem',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              textAlign: 'center',
              minWidth: '220px'
            }}>
              <div style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: '700', letterSpacing: '0.05em' }}>
                Full Curriculum Access
              </div>
              <div style={{ fontSize: '1.75rem', fontWeight: '800', color: '#fff', margin: '0.25rem 0' }}>
                ${creator.monthly_price}<span style={{ fontSize: '0.85rem', fontWeight: '500', color: '#94a3b8' }}>/mo</span>
              </div>
              <p style={{ fontSize: '0.75rem', color: '#cbd5e1', marginBottom: '0.85rem' }}>
                Unlimited lessons & study materials
              </p>

              {isSubscribed ? (
                <div style={{
                  padding: '0.5rem',
                  backgroundColor: 'rgba(16, 185, 129, 0.2)',
                  color: '#34d399',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.825rem',
                  fontWeight: '700',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.35rem'
                }}>
                  <CheckCircle2 size={16} /> Subscribed Active
                </div>
              ) : (
                <button 
                  onClick={() => onOpenSubscribe(creator)}
                  className="btn btn-primary"
                  style={{ width: '100%', padding: '0.6rem', fontSize: '0.9rem', fontWeight: '700' }}
                >
                  Join for ${creator.monthly_price}/mo
                </button>
              )}
            </div>

          </div>
        </div>
      </section>

      {/* Main Content Grid */}
      <div className="container" style={{ maxWidth: '960px', marginTop: '2rem' }}>
        
        {/* Creator Intro Bio */}
        <div style={{
          backgroundColor: '#fff',
          borderRadius: 'var(--radius-lg)',
          padding: '1.75rem',
          border: '1px solid var(--color-border)',
          boxShadow: 'var(--shadow-sm)',
          marginBottom: '2rem'
        }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: '800', color: 'var(--color-secondary)', marginBottom: '0.6rem' }}>
            About {creator.name}
          </h3>
          <p style={{ color: 'var(--color-text-main)', lineHeight: 1.65, fontSize: '0.95rem' }}>
            {creator.custom_bio || creator.bio}
          </p>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '1rem' }}>
            {creator.subjects?.map((sub, idx) => (
              <span key={idx} className="badge badge-primary" style={{ fontSize: '0.775rem' }}>
                {sub}
              </span>
            ))}
            {creator.educational_levels?.map((lvl, idx) => (
              <span key={idx} className="badge badge-neutral" style={{ fontSize: '0.775rem' }}>
                {lvl}
              </span>
            ))}
          </div>
        </div>

        {/* 1. FREE LEAD MAGNETS SECTION */}
        <div style={{ marginBottom: '2.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', color: 'var(--color-primary)', fontWeight: '700', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                <Gift size={15} /> Free Study Materials
              </div>
              <h2 style={{ fontSize: '1.4rem', fontWeight: '800', color: 'var(--color-secondary)', margin: '0.2rem 0 0 0' }}>
                Free Cheat Sheets & Roadmaps
              </h2>
            </div>
            <span style={{ fontSize: '0.825rem', color: 'var(--color-text-muted)' }}>
              100% Free · Instant Unlock
            </span>
          </div>

          {lead_magnets && lead_magnets.length > 0 ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
              {lead_magnets.map((lm) => (
                <div 
                  key={lm.id}
                  style={{
                    backgroundColor: '#fff',
                    borderRadius: 'var(--radius-lg)',
                    padding: '1.5rem',
                    border: '1px solid var(--color-border)',
                    boxShadow: 'var(--shadow-sm)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    position: 'relative',
                    transition: 'transform 0.15s ease, box-shadow 0.15s ease'
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                      <span style={{
                        backgroundColor: '#dcfce7',
                        color: '#15803d',
                        fontWeight: '700',
                        fontSize: '0.75rem',
                        padding: '0.2rem 0.6rem',
                        borderRadius: 'var(--radius-full)'
                      }}>
                        FREE RESOURCE
                      </span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', fontWeight: '600' }}>
                        🔥 {lm.downloads_count} downloads
                      </span>
                    </div>

                    <h4 style={{ fontSize: '1.05rem', fontWeight: '700', color: 'var(--color-secondary)', marginBottom: '0.5rem', lineHeight: 1.35 }}>
                      {lm.title}
                    </h4>

                    <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', lineHeight: 1.5, marginBottom: '1.25rem' }}>
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
                      gap: '0.45rem',
                      padding: '0.6rem',
                      fontSize: '0.875rem'
                    }}
                  >
                    <Download size={16} /> Download Free PDF
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ backgroundColor: '#fff', padding: '2rem', textAlign: 'center', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', color: 'var(--color-text-muted)' }}>
              No downloadable resources published yet.
            </div>
          )}
        </div>

        {/* 2. DIRECT MICRO-SERVICES SECTION */}
        <div style={{ marginBottom: '2.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', color: '#d97706', fontWeight: '700', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                <Zap size={15} /> On-Demand 1-on-1 Help
              </div>
              <h2 style={{ fontSize: '1.4rem', fontWeight: '800', color: 'var(--color-secondary)', margin: '0.2rem 0 0 0' }}>
                Micro-Tutoring & Quick Reviews
              </h2>
            </div>
            <span style={{ fontSize: '0.825rem', color: 'var(--color-text-muted)' }}>
              No Monthly Commitment Needed
            </span>
          </div>

          {services && services.length > 0 ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
              {services.map((srv) => (
                <div 
                  key={srv.id}
                  style={{
                    backgroundColor: '#fff',
                    borderRadius: 'var(--radius-lg)',
                    padding: '1.5rem',
                    border: '1px solid var(--color-border)',
                    boxShadow: 'var(--shadow-sm)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between'
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                      <span style={{
                        backgroundColor: srv.service_type === 'mentorship' ? '#ede9fe' : srv.service_type === 'qa_session' ? '#e0f2fe' : '#fef3c7',
                        color: srv.service_type === 'mentorship' ? '#6d28d9' : srv.service_type === 'qa_session' ? '#0369a1' : '#b45309',
                        fontWeight: '700',
                        fontSize: '0.75rem',
                        padding: '0.2rem 0.6rem',
                        borderRadius: 'var(--radius-full)'
                      }}>
                        {srv.service_type === 'mentorship' ? 'Mentorship' : srv.service_type === 'qa_session' ? 'Live Q&A' : 'Quick Review'}
                      </span>

                      <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <Clock size={13} /> {srv.duration_minutes} mins
                      </span>
                    </div>

                    <h4 style={{ fontSize: '1.05rem', fontWeight: '700', color: 'var(--color-secondary)', marginBottom: '0.5rem', lineHeight: 1.35 }}>
                      {srv.title}
                    </h4>

                    <div style={{ fontSize: '1.35rem', fontWeight: '800', color: 'var(--color-primary)', marginBottom: '1.25rem' }}>
                      ${srv.price_dollars}
                    </div>
                  </div>

                  <button 
                    onClick={() => {
                      setBookingModal({ isOpen: true, service: srv });
                      setBookingSuccess(null);
                    }}
                    className="btn btn-secondary"
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.45rem',
                      padding: '0.6rem',
                      fontSize: '0.875rem',
                      fontWeight: '700'
                    }}
                  >
                    <Calendar size={16} /> Book 1-on-1 (${srv.price_dollars})
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ backgroundColor: '#fff', padding: '2rem', textAlign: 'center', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', color: 'var(--color-text-muted)' }}>
              No micro-services available at this time.
            </div>
          )}
        </div>

        {/* 3. COURSES & FREE PREVIEW LESSONS */}
        <div style={{ marginBottom: '2.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', color: 'var(--color-primary)', fontWeight: '700', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                <BookOpen size={15} /> Structured Curricula
              </div>
              <h2 style={{ fontSize: '1.4rem', fontWeight: '800', color: 'var(--color-secondary)', margin: '0.2rem 0 0 0' }}>
                Courses & Free Previews
              </h2>
            </div>
            <span style={{ fontSize: '0.825rem', color: 'var(--color-text-muted)' }}>
              {stats.course_count} Courses · {stats.free_preview_count} Free Lessons
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {courses.map((course) => (
              <div 
                key={course.id}
                style={{
                  backgroundColor: '#fff',
                  borderRadius: 'var(--radius-lg)',
                  border: '1px solid var(--color-border)',
                  overflow: 'hidden',
                  boxShadow: 'var(--shadow-sm)'
                }}
              >
                {/* Course Header */}
                <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--color-border)', backgroundColor: '#fcfcfd' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <div>
                      <span className="badge badge-primary" style={{ marginBottom: '0.4rem', display: 'inline-block' }}>
                        {course.subject_name || 'General'} · {course.educational_level}
                      </span>
                      <h3 style={{ fontSize: '1.2rem', fontWeight: '800', color: 'var(--color-secondary)', margin: 0 }}>
                        {course.title}
                      </h3>
                      <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginTop: '0.35rem', lineHeight: 1.5 }}>
                        {course.description}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Lessons in this course */}
                <div style={{ padding: '1rem 1.5rem' }}>
                  {course.sections?.map((section) => (
                    <div key={section.id} style={{ marginBottom: '1rem' }}>
                      <h5 style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.6rem' }}>
                        {section.title}
                      </h5>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
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
                                padding: '0.75rem 1rem',
                                borderRadius: 'var(--radius-md)',
                                backgroundColor: isUnlocked ? '#f0fdf4' : '#fff',
                                border: isUnlocked ? '1px solid #bbf7d0' : '1px solid var(--color-border)',
                                cursor: 'pointer',
                                transition: 'all 0.15s ease'
                              }}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <div style={{
                                  width: '32px',
                                  height: '32px',
                                  borderRadius: '50%',
                                  backgroundColor: isUnlocked ? 'var(--color-primary)' : '#e2e8f0',
                                  color: isUnlocked ? '#fff' : '#64748b',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center'
                                }}>
                                  {isUnlocked ? <Play size={14} fill="#fff" /> : <Lock size={14} />}
                                </div>

                                <div>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <span style={{ fontSize: '0.9rem', fontWeight: '600', color: isUnlocked ? 'var(--color-secondary)' : 'var(--color-text-main)' }}>
                                      {lesson.title}
                                    </span>
                                    {lesson.is_free_preview && (
                                      <span style={{
                                        backgroundColor: '#dcfce7',
                                        color: '#16a34a',
                                        fontSize: '0.675rem',
                                        fontWeight: '800',
                                        padding: '0.1rem 0.45rem',
                                        borderRadius: 'var(--radius-full)'
                                      }}>
                                        FREE SAMPLE
                                      </span>
                                    )}
                                  </div>
                                  <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                                    {lesson.duration_minutes} mins · {lesson.resources?.length || 0} attachments
                                  </span>
                                </div>
                              </div>

                              <div>
                                {isUnlocked ? (
                                  <span style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--color-primary)' }}>
                                    Watch Now →
                                  </span>
                                ) : (
                                  <span style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--color-text-muted)' }}>
                                    Subscriber Only
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
        </div>

        {/* 4. STUDENT REVIEWS */}
        {reviews && reviews.length > 0 && (
          <div style={{ marginBottom: '2.5rem' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: '800', color: 'var(--color-secondary)', marginBottom: '1rem' }}>
              Student Reviews & Endorsements
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
              {reviews.map((rev) => (
                <div 
                  key={rev.id}
                  style={{
                    backgroundColor: '#fff',
                    borderRadius: 'var(--radius-md)',
                    padding: '1.25rem',
                    border: '1px solid var(--color-border)',
                    boxShadow: 'var(--shadow-sm)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.6rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <img 
                        src={rev.student_avatar || 'https://api.dicebear.com/7.x/initials/svg?seed=' + rev.student_name}
                        alt={rev.student_name}
                        style={{ width: '28px', height: '28px', borderRadius: '50%' }}
                      />
                      <span style={{ fontSize: '0.85rem', fontWeight: '700' }}>{rev.student_name}</span>
                    </div>
                    <div style={{ display: 'flex' }}>
                      {[...Array(5)].map((_, i) => (
                        <Star 
                          key={i} 
                          size={13} 
                          color="#fbbf24" 
                          fill={i < rev.rating ? '#fbbf24' : 'transparent'} 
                        />
                      ))}
                    </div>
                  </div>
                  <p style={{ fontSize: '0.85rem', color: 'var(--color-text-main)', lineHeight: 1.5, fontStyle: 'italic', margin: 0 }}>
                    "{rev.comment}"
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>

      {/* LEAD MAGNET CLAIM MODAL */}
      {claimModal.isOpen && claimModal.leadMagnet && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.65)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '1rem'
        }}>
          <div style={{
            backgroundColor: '#fff',
            borderRadius: 'var(--radius-lg)',
            maxWidth: '460px',
            width: '100%',
            padding: '2rem',
            position: 'relative',
            boxShadow: 'var(--shadow-lg)'
          }}>
            
            {claimSuccess ? (
              <div style={{ textAlign: 'center', padding: '1rem 0' }}>
                <div style={{ width: '56px', height: '56px', borderRadius: '50%', backgroundColor: '#dcfce7', color: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem auto' }}>
                  <CheckCircle2 size={32} />
                </div>
                <h3 style={{ fontSize: '1.35rem', fontWeight: '800', marginBottom: '0.5rem' }}>
                  Download Ready!
                </h3>
                <p style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)', marginBottom: '1.5rem' }}>
                  {claimSuccess.message}
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <a 
                    href={claimSuccess.file_url} 
                    target="_blank" 
                    rel="noreferrer"
                    className="btn btn-primary"
                    style={{ padding: '0.75rem', fontWeight: '700', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                  >
                    <Download size={18} /> Open & Download PDF
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
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-primary)', fontWeight: '700', fontSize: '0.8rem', marginBottom: '0.25rem' }}>
                  <Gift size={16} /> FREE CHEAT SHEET UNLOCK
                </div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: '800', color: 'var(--color-secondary)', marginBottom: '0.5rem' }}>
                  {claimModal.leadMagnet.title}
                </h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: '1.25rem', lineHeight: 1.5 }}>
                  Enter your email below for immediate free access. You will also follow {creator.name} for free lesson updates.
                </p>

                <form onSubmit={handleClaimLeadMagnet} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: '600', marginBottom: '0.35rem' }}>
                      Your Name
                    </label>
                    <input 
                      type="text"
                      className="form-input"
                      placeholder="e.g. Alex Smith"
                      value={claimName}
                      onChange={(e) => setClaimName(e.target.value)}
                      required
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: '600', marginBottom: '0.35rem' }}>
                      Email Address
                    </label>
                    <input 
                      type="email"
                      className="form-input"
                      placeholder="you@school.edu"
                      value={claimEmail}
                      onChange={(e) => setClaimEmail(e.target.value)}
                      required
                    />
                  </div>

                  <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
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
                      style={{ flex: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}
                    >
                      {claiming ? 'Unlocking...' : <><Download size={16} /> Get Free Guide</>}
                    </button>
                  </div>
                </form>
              </div>
            )}

          </div>
        </div>
      )}

      {/* BOOKING MODAL */}
      {bookingModal.isOpen && bookingModal.service && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.65)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '1rem'
        }}>
          <div style={{
            backgroundColor: '#fff',
            borderRadius: 'var(--radius-lg)',
            maxWidth: '480px',
            width: '100%',
            padding: '2rem',
            position: 'relative',
            boxShadow: 'var(--shadow-lg)'
          }}>
            
            {bookingSuccess ? (
              <div style={{ textAlign: 'center', padding: '1rem 0' }}>
                <div style={{ width: '56px', height: '56px', borderRadius: '50%', backgroundColor: '#dcfce7', color: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem auto' }}>
                  <CheckCircle2 size={32} />
                </div>
                <h3 style={{ fontSize: '1.35rem', fontWeight: '800', marginBottom: '0.5rem' }}>
                  Session Reserved!
                </h3>
                <p style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)', marginBottom: '1.5rem', lineHeight: 1.5 }}>
                  {bookingSuccess.message}
                </p>
                <button 
                  onClick={() => setBookingModal({ isOpen: false, service: null })}
                  className="btn btn-primary"
                  style={{ width: '100%', padding: '0.65rem' }}
                >
                  Done
                </button>
              </div>
            ) : (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                  <span style={{ color: 'var(--color-primary)', fontWeight: '700', fontSize: '0.8rem', textTransform: 'uppercase' }}>
                    Direct 1-on-1 Booking
                  </span>
                  <span style={{ fontWeight: '800', fontSize: '1.1rem', color: 'var(--color-secondary)' }}>
                    ${bookingModal.service.price_dollars}
                  </span>
                </div>

                <h3 style={{ fontSize: '1.25rem', fontWeight: '800', color: 'var(--color-secondary)', marginBottom: '0.25rem' }}>
                  {bookingModal.service.title}
                </h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: '1.25rem' }}>
                  {bookingModal.service.duration_minutes} minutes live session with {creator.name}.
                </p>

                <form onSubmit={handleBookService} style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: '600', marginBottom: '0.35rem' }}>
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

                  <div>
                    <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: '600', marginBottom: '0.35rem' }}>
                      Email Address (Where meeting link will be sent)
                    </label>
                    <input 
                      type="email"
                      className="form-input"
                      placeholder="you@school.edu"
                      value={bookingEmail}
                      onChange={(e) => setBookingEmail(e.target.value)}
                      required
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: '600', marginBottom: '0.35rem' }}>
                      Topic or Questions for {creator.name}
                    </label>
                    <textarea 
                      className="form-input"
                      rows={3}
                      placeholder="Describe the homework problems, test questions, or topics you'd like to review..."
                      value={bookingNotes}
                      onChange={(e) => setBookingNotes(e.target.value)}
                    />
                  </div>

                  <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
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
                      style={{ flex: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}
                    >
                      {bookingSubmitting ? 'Confirming...' : `Confirm Booking ($${bookingModal.service.price_dollars})`}
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
