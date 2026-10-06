import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  BookOpen, 
  CreditCard, 
  CheckCircle2, 
  ArrowRight, 
  AlertTriangle,
  Play,
  RotateCcw,
  Receipt,
  Sparkles,
  Calendar,
  CheckCircle,
  ExternalLink,
  Download,
  Share2,
  Copy,
  Gift,
  Clock,
  MessageSquare,
  FileText,
  UserCheck,
  Check
} from 'lucide-react';

export default function StudentDashboard({ onSelectTeacher, onOpenLesson }) {
  const { user, token, refreshUser } = useAuth();
  const [activeTab, setActiveTab] = useState('progress'); // 'progress' | 'downloads' | 'services' | 'referrals' | 'subscriptions' | 'ledger'
  const [subscriptions, setSubscriptions] = useState([]);
  const [progressCourses, setProgressCourses] = useState([]);
  const [ledgerPayments, setLedgerPayments] = useState([]);
  const [claimedDownloads, setClaimedDownloads] = useState([]);
  const [serviceBookings, setServiceBookings] = useState([]);
  const [referralStats, setReferralStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionMessage, setActionMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const headers = { 'Authorization': `Bearer ${token}` };

      // 1. Fetch subscriptions
      const subRes = await fetch('/api/subscriptions/my', { headers });
      if (subRes.ok) {
        const subs = await subRes.json();
        setSubscriptions(subs);
      }

      // 2. Fetch learning progress
      const progRes = await fetch('/api/progress/my', { headers });
      if (progRes.ok) {
        const prog = await progRes.json();
        setProgressCourses(prog);
      }

      // 3. Fetch simulated invoices ledger
      const ledgerRes = await fetch('/api/subscriptions/my/ledger', { headers });
      if (ledgerRes.ok) {
        const ledger = await ledgerRes.json();
        setLedgerPayments(ledger);
      }

      // 4. Fetch claimed lead magnets
      const leadRes = await fetch('/api/lead-magnets/my-claimed', { headers });
      if (leadRes.ok) {
        const leads = await leadRes.json();
        setClaimedDownloads(leads);
      }

      // 5. Fetch booked micro-services
      const srvRes = await fetch('/api/services/my-bookings', { headers });
      if (srvRes.ok) {
        const srv = await srvRes.json();
        setServiceBookings(srv);
      }

      // 6. Fetch referral statistics
      const refRes = await fetch('/api/referrals/stats', { headers });
      if (refRes.ok) {
        const refs = await refRes.json();
        setReferralStats(refs);
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

  const handleCopyLink = () => {
    const link = referralStats?.referral_link || `${window.location.origin}/?ref=${referralStats?.referral_code || ''}`;
    navigator.clipboard.writeText(link);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleCopyCode = () => {
    if (referralStats?.referral_code) {
      navigator.clipboard.writeText(referralStats.referral_code);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2500);
    }
  };

  const handleShareNative = async () => {
    const link = referralStats?.referral_link || `${window.location.origin}/?ref=${referralStats?.referral_code || ''}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Join me on Korsa - Free Creator Learning',
          text: `Join Korsa using my invite code ${referralStats?.referral_code} and get instant free access to cheat sheets, courses, and creator workshops!`,
          url: link
        });
      } catch {
        handleCopyLink();
      }
    } else {
      handleCopyLink();
    }
  };

  const handleCancelSub = async (subId) => {
    if (!window.confirm('Cancel this subscription? You will retain access until the renewal date.')) return;
    setActionMessage('');
    setErrorMessage('');
    try {
      const res = await fetch(`/api/subscriptions/cancel/${subId}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (res.ok) {
        setActionMessage('Subscription successfully cancelled.');
        await refreshUser();
        loadData();
      } else {
        const err = await res.json();
        setErrorMessage(err.error || 'Failed to cancel subscription');
      }
    } catch (err) {
      setErrorMessage('Network error cancelling subscription');
    }
  };

  const handleReactivateSub = async (subId) => {
    setActionMessage('');
    setErrorMessage('');
    try {
      const res = await fetch(`/api/subscriptions/reactivate/${subId}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (res.ok) {
        setActionMessage('Subscription reactivated! Simulated renewal recorded.');
        await refreshUser();
        loadData();
      } else {
        const err = await res.json();
        setErrorMessage(err.error || 'Failed to reactivate subscription');
      }
    } catch (err) {
      setErrorMessage('Network error reactivating subscription');
    }
  };

  if (loading) {
    return (
      <div className="container" style={{ padding: '4rem 1rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
        Loading your learning dashboard...
      </div>
    );
  }

  const activeSubs = subscriptions.filter(s => s.status === 'active');
  const pastSubs = subscriptions.filter(s => s.status !== 'active');
  const friendsCount = referralStats?.referred_count || 0;
  const referralTarget = 3;
  const progressPercent = Math.min(100, Math.round((friendsCount / referralTarget) * 100));

  return (
    <div style={{ padding: '2.5rem 0 5rem 0' }}>
      <div className="container">
        
        {/* Welcome Banner */}
        <div style={{ marginBottom: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem', flexWrap: 'wrap' }}>
            <span className="badge badge-role student">STUDENT CLASSROOM</span>
            <span className="badge" style={{ backgroundColor: '#ecfdf5', color: '#047857', border: '1px solid #a7f3d0' }}>
              FREE EXPLORER MODE
            </span>
            <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>{user?.email}</span>
            {user?.referred_by && (
              <span className="badge" style={{ backgroundColor: '#f3e8ff', color: '#7e22ce' }}>
                Referred by {user.referred_by}
              </span>
            )}
          </div>
          <h1 style={{ fontSize: '1.85rem', fontWeight: '800', color: 'var(--color-secondary)' }}>
            Welcome back, {user?.name}
          </h1>
          <p style={{ fontSize: '0.95rem', color: 'var(--color-text-muted)', marginTop: '4px' }}>
            Track your progress across courses, access free lead magnets, attend booked sessions, and earn rewards.
          </p>
        </div>

        {/* Global Notifications */}
        {actionMessage && (
          <div className="alert alert-success" style={{ marginBottom: '1.5rem' }}>
            <CheckCircle2 size={18} /> {actionMessage}
          </div>
        )}
        {errorMessage && (
          <div className="alert alert-error" style={{ marginBottom: '1.5rem' }}>
            <AlertTriangle size={18} /> {errorMessage}
          </div>
        )}

        {/* VIRAL FLYWHEEL REFERRAL WIDGET BANNER */}
        <div style={{
          background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 60%, #4338ca 100%)',
          color: '#ffffff',
          borderRadius: 'var(--radius-lg)',
          padding: '1.5rem 1.75rem',
          marginBottom: '2rem',
          boxShadow: '0 10px 25px -5px rgba(49, 46, 129, 0.25)',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
            <div style={{ maxWidth: '650px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                <span className="badge" style={{ backgroundColor: 'rgba(255,255,255,0.2)', color: '#ffffff', border: 'none' }}>
                  <Gift size={13} style={{ marginRight: '4px' }} /> VIRAL REFERRAL FLYWHEEL
                </span>
                <span style={{ fontSize: '0.8rem', color: '#cbd5e1' }}>
                  Balance: <strong>{referralStats?.referral_credits || user?.referral_credits || 0} credits</strong>
                </span>
              </div>
              <h2 style={{ fontSize: '1.35rem', fontWeight: '800', color: '#ffffff', margin: 0 }}>
                Invite 3 Friends, Unlock Full Free Masterclass Access!
              </h2>
              <p style={{ fontSize: '0.875rem', color: '#cbd5e1', marginTop: '4px', lineHeight: 1.5 }}>
                Share your personal code with classmates. Every student who registers gets 10 credits, and you earn 10 credits plus instant tier upgrades.
              </p>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
              <button
                onClick={handleCopyCode}
                className="btn btn-secondary btn-sm"
                style={{
                  backgroundColor: 'rgba(255,255,255,0.15)',
                  color: '#ffffff',
                  border: '1px solid rgba(255,255,255,0.25)',
                  backdropFilter: 'blur(4px)'
                }}
              >
                {copiedCode ? <Check size={14} color="#86efac" /> : <Copy size={14} />}
                Code: <strong style={{ letterSpacing: '0.5px' }}>{referralStats?.referral_code || 'CODE'}</strong>
              </button>

              <button
                onClick={handleCopyLink}
                className="btn btn-primary btn-sm"
                style={{
                  backgroundColor: '#ffffff',
                  color: '#312e81',
                  border: 'none',
                  fontWeight: '700'
                }}
              >
                {copiedLink ? <Check size={14} color="#059669" /> : <Share2 size={14} />}
                {copiedLink ? 'Link Copied!' : 'Copy Invite Link'}
              </button>

              <button
                onClick={handleShareNative}
                className="btn btn-sm"
                style={{
                  backgroundColor: '#4f46e5',
                  color: '#ffffff',
                  border: '1px solid rgba(255,255,255,0.3)'
                }}
                title="Share directly"
              >
                Share
              </button>
            </div>
          </div>

          {/* Progress toward 3 friends */}
          <div style={{
            backgroundColor: 'rgba(0,0,0,0.2)',
            borderRadius: 'var(--radius-md)',
            padding: '0.85rem 1rem'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem', fontSize: '0.825rem' }}>
              <span style={{ color: '#e2e8f0', fontWeight: '600' }}>
                Milestone Progress: {friendsCount} of {referralTarget} classmates joined
              </span>
              <span style={{ color: friendsCount >= referralTarget ? '#86efac' : '#cbd5e1', fontWeight: '700' }}>
                {friendsCount >= referralTarget ? '🎉 Reward Unlocked!' : `${referralTarget - friendsCount} more needed`}
              </span>
            </div>
            <div style={{ height: '8px', backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: '999px', overflow: 'hidden' }}>
              <div 
                style={{ 
                  height: '100%', 
                  width: `${progressPercent}%`, 
                  background: 'linear-gradient(90deg, #10b981 0%, #34d399 100%)',
                  borderRadius: '999px',
                  transition: 'width 0.4s ease'
                }} 
              />
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div style={{
          display: 'flex',
          gap: '0.5rem',
          borderBottom: '1px solid var(--color-border)',
          marginBottom: '2rem',
          overflowX: 'auto',
          whiteSpace: 'nowrap'
        }}>
          <button
            onClick={() => setActiveTab('progress')}
            style={{
              padding: '0.75rem 1.1rem',
              fontWeight: activeTab === 'progress' ? '700' : '500',
              color: activeTab === 'progress' ? 'var(--color-primary)' : 'var(--color-text-muted)',
              borderBottom: activeTab === 'progress' ? '2px solid var(--color-primary)' : '2px solid transparent',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem'
            }}
          >
            <BookOpen size={16} /> My Courses ({progressCourses.length})
          </button>
          <button
            onClick={() => setActiveTab('downloads')}
            style={{
              padding: '0.75rem 1.1rem',
              fontWeight: activeTab === 'downloads' ? '700' : '500',
              color: activeTab === 'downloads' ? 'var(--color-primary)' : 'var(--color-text-muted)',
              borderBottom: activeTab === 'downloads' ? '2px solid var(--color-primary)' : '2px solid transparent',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem'
            }}
          >
            <Download size={16} /> Free Cheat Sheets & Guides ({claimedDownloads.length})
          </button>
          <button
            onClick={() => setActiveTab('services')}
            style={{
              padding: '0.75rem 1.1rem',
              fontWeight: activeTab === 'services' ? '700' : '500',
              color: activeTab === 'services' ? 'var(--color-primary)' : 'var(--color-text-muted)',
              borderBottom: activeTab === 'services' ? '2px solid var(--color-primary)' : '2px solid transparent',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem'
            }}
          >
            <Clock size={16} /> Booked Micro-Services ({serviceBookings.length})
          </button>
          <button
            onClick={() => setActiveTab('referrals')}
            style={{
              padding: '0.75rem 1.1rem',
              fontWeight: activeTab === 'referrals' ? '700' : '500',
              color: activeTab === 'referrals' ? 'var(--color-primary)' : 'var(--color-text-muted)',
              borderBottom: activeTab === 'referrals' ? '2px solid var(--color-primary)' : '2px solid transparent',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem'
            }}
          >
            <Gift size={16} /> Referral Hub ({friendsCount})
          </button>
          <button
            onClick={() => setActiveTab('subscriptions')}
            style={{
              padding: '0.75rem 1.1rem',
              fontWeight: activeTab === 'subscriptions' ? '700' : '500',
              color: activeTab === 'subscriptions' ? 'var(--color-primary)' : 'var(--color-text-muted)',
              borderBottom: activeTab === 'subscriptions' ? '2px solid var(--color-primary)' : '2px solid transparent',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem'
            }}
          >
            <CreditCard size={16} /> Subscriptions ({activeSubs.length})
          </button>
          <button
            onClick={() => setActiveTab('ledger')}
            style={{
              padding: '0.75rem 1.1rem',
              fontWeight: activeTab === 'ledger' ? '700' : '500',
              color: activeTab === 'ledger' ? 'var(--color-primary)' : 'var(--color-text-muted)',
              borderBottom: activeTab === 'ledger' ? '2px solid var(--color-primary)' : '2px solid transparent',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem'
            }}
          >
            <Receipt size={16} /> Invoices ({ledgerPayments.length})
          </button>
        </div>

        {/* TAB 1: LEARNING PROGRESS & RESUME WATCHING */}
        {activeTab === 'progress' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.5rem' }}>
              <div>
                <h2 style={{ fontSize: '1.35rem', fontWeight: '800', color: 'var(--color-secondary)' }}>
                  Course Progress
                </h2>
                <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', margin: 0 }}>
                  Includes free sample lessons and full subscribed curriculum.
                </p>
              </div>
              <button onClick={() => onSelectTeacher(null)} className="btn btn-secondary btn-sm">
                + Browse Teachers & Free Samples
              </button>
            </div>

            {progressCourses.length === 0 ? (
              <div className="card" style={{ padding: '3rem', textAlign: 'center' }}>
                <p style={{ color: 'var(--color-text-muted)', marginBottom: '1rem' }}>You haven't started any lessons yet.</p>
                <button onClick={() => onSelectTeacher(null)} className="btn btn-primary btn-sm">
                  Explore Teachers & Free Samples
                </button>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.5rem' }}>
                {progressCourses.map((c) => (
                  <div key={c.course_id} className="card" style={{ padding: '1.75rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                        <span className="badge" style={{ backgroundColor: '#eff6ff', color: 'var(--color-primary)' }}>
                          {c.educational_level}
                        </span>
                        <span style={{ fontSize: '0.875rem', fontWeight: '800', color: c.percentage === 100 ? 'var(--color-accent)' : 'var(--color-primary)' }}>
                          {c.percentage}% completed
                        </span>
                      </div>

                      <h3 style={{ fontSize: '1.2rem', fontWeight: '700', marginBottom: '0.4rem' }}>
                        {c.course_title}
                      </h3>

                      <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: '1rem' }}>
                        Teacher: <strong>{c.teacher_name}</strong>
                      </p>

                      {/* Progress Bar */}
                      <div className="progress-bar-container" style={{ marginBottom: '1.25rem' }}>
                        <div 
                          className="progress-bar-fill" 
                          style={{ 
                            width: `${c.percentage}%`,
                            backgroundColor: c.percentage === 100 ? 'var(--color-accent)' : 'var(--color-primary)'
                          }} 
                        />
                      </div>

                      {/* Last Watched Lesson */}
                      {c.last_lesson_title && (
                        <div style={{
                          backgroundColor: '#f8fafc',
                          padding: '0.75rem 1rem',
                          borderRadius: 'var(--radius-md)',
                          border: '1px solid var(--color-border)',
                          marginBottom: '1.25rem'
                        }}>
                          <span style={{ fontSize: '0.725rem', color: 'var(--color-text-muted)', fontWeight: '700', textTransform: 'uppercase' }}>
                            Last Watched
                          </span>
                          <div style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--color-secondary)', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            <Play size={13} fill="currentColor" color="var(--color-primary)" />
                            {c.last_lesson_title}
                          </div>
                        </div>
                      )}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid var(--color-border)', paddingTop: '1rem' }}>
                      <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                        {c.completed_lessons} of {c.total_lessons} lessons finished
                      </span>

                      <button 
                        onClick={() => onSelectTeacher(c.teacher_id)}
                        className="btn btn-primary btn-sm"
                        style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                      >
                        Resume Learning <ArrowRight size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: CLAIMED FREE DOWNLOADS & CHEAT SHEETS */}
        {activeTab === 'downloads' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.5rem' }}>
              <div>
                <h2 style={{ fontSize: '1.35rem', fontWeight: '800', color: 'var(--color-secondary)' }}>
                  My Free Study Resources & Lead Magnets ({claimedDownloads.length})
                </h2>
                <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', margin: 0 }}>
                  High-yield cheat sheets, exam roadmaps, and summary PDF templates you unlocked from top creators.
                </p>
              </div>
            </div>

            {claimedDownloads.length === 0 ? (
              <div className="card" style={{ padding: '3rem', textAlign: 'center' }}>
                <FileText size={40} color="var(--color-text-muted)" style={{ margin: '0 auto 1rem auto' }} />
                <h3 style={{ fontSize: '1.15rem', fontWeight: '700', marginBottom: '0.5rem' }}>No downloads claimed yet</h3>
                <p style={{ color: 'var(--color-text-muted)', marginBottom: '1.25rem', maxWidth: '450px', margin: '0 auto 1.25rem auto' }}>
                  Explore teacher profiles to claim free formula sheets, revision checklists, and coding guides without paying a cent.
                </p>
                <button onClick={() => onSelectTeacher(null)} className="btn btn-primary btn-sm">
                  Browse Free Creator Resources
                </button>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
                {claimedDownloads.map((lead) => (
                  <div key={lead.claim_id || lead.id} className="card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                        <img
                          src={lead.teacher_avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${lead.teacher_name}`}
                          alt={lead.teacher_name}
                          style={{ width: '36px', height: '36px', borderRadius: 'var(--radius-full)', objectFit: 'cover' }}
                        />
                        <div>
                          <div style={{ fontSize: '0.85rem', fontWeight: '700' }}>{lead.teacher_name}</div>
                          {lead.teacher_handle && (
                            <a
                              href={`/@${lead.teacher_handle}`}
                              style={{ fontSize: '0.75rem', color: 'var(--color-primary)', textDecoration: 'none' }}
                            >
                              @{lead.teacher_handle}
                            </a>
                          )}
                        </div>
                        <span className="badge badge-free" style={{ marginLeft: 'auto', fontSize: '0.7rem' }}>CLAIMED</span>
                      </div>

                      <h3 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '0.4rem', color: 'var(--color-secondary)' }}>
                        {lead.title}
                      </h3>
                      <p style={{ fontSize: '0.825rem', color: 'var(--color-text-muted)', lineHeight: 1.5, marginBottom: '1rem' }}>
                        {lead.description || 'Exclusive study guide curated by the creator.'}
                      </p>
                    </div>

                    <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '0.85rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                        Claimed {lead.claimed_at ? new Date(lead.claimed_at).toLocaleDateString() : 'Recently'}
                      </span>

                      <a
                        href={lead.file_url || '#'}
                        target="_blank"
                        rel="noreferrer"
                        className="btn btn-primary btn-sm"
                        style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', textDecoration: 'none' }}
                      >
                        <Download size={14} /> Download File
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: BOOKED MICRO-SERVICES */}
        {activeTab === 'services' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.5rem' }}>
              <div>
                <h2 style={{ fontSize: '1.35rem', fontWeight: '800', color: 'var(--color-secondary)' }}>
                  Booked Micro-Services & 1-on-1 Sessions ({serviceBookings.length})
                </h2>
                <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', margin: 0 }}>
                  Quick portfolio checkups, code reviews, and live Q&A sessions booked with tutors.
                </p>
              </div>
              <button onClick={() => onSelectTeacher(null)} className="btn btn-secondary btn-sm">
                + Book Another Service
              </button>
            </div>

            {serviceBookings.length === 0 ? (
              <div className="card" style={{ padding: '3rem', textAlign: 'center' }}>
                <Clock size={40} color="var(--color-text-muted)" style={{ margin: '0 auto 1rem auto' }} />
                <h3 style={{ fontSize: '1.15rem', fontWeight: '700', marginBottom: '0.5rem' }}>No sessions booked yet</h3>
                <p style={{ color: 'var(--color-text-muted)', marginBottom: '1.25rem', maxWidth: '450px', margin: '0 auto 1.25rem auto' }}>
                  Need fast feedback on an assignment or personal coaching? Creators offer $5 to $25 micro-sessions with quick turnaround.
                </p>
                <button onClick={() => onSelectTeacher(null)} className="btn btn-primary btn-sm">
                  Find Micro-Tutoring Sessions
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {serviceBookings.map((b) => (
                  <div
                    key={b.id}
                    className="card"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '1.5rem',
                      flexWrap: 'wrap',
                      gap: '1rem'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                      <img
                        src={b.teacher_avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${b.teacher_name}`}
                        alt={b.teacher_name}
                        style={{ width: '52px', height: '52px', borderRadius: 'var(--radius-full)', objectFit: 'cover' }}
                      />
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
                          <h3 style={{ fontSize: '1.1rem', fontWeight: '700', margin: 0 }}>{b.title}</h3>
                          <span className="badge badge-free" style={{ textTransform: 'uppercase' }}>
                            {b.status || 'CONFIRMED'}
                          </span>
                          <span className="badge" style={{ backgroundColor: '#f1f5f9', color: '#475569', fontSize: '0.725rem' }}>
                            {b.service_type?.replace('_', ' ')}
                          </span>
                        </div>
                        <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginTop: '4px' }}>
                          Teacher: <strong>{b.teacher_name}</strong> {b.teacher_handle && `(@${b.teacher_handle})`} • Duration: {b.duration_minutes || 20} mins
                        </p>
                        {b.student_notes && (
                          <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '4px', fontStyle: 'italic' }}>
                            Notes: "{b.student_notes}"
                          </div>
                        )}
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '1.25rem', fontWeight: '800', color: 'var(--color-secondary)' }}>
                          ${(b.price_cents / 100).toFixed(2)}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                          Booked on {b.created_at ? new Date(b.created_at).toLocaleDateString() : 'Recently'}
                        </div>
                      </div>

                      {b.teacher_handle && (
                        <a
                          href={`/@${b.teacher_handle}`}
                          className="btn btn-secondary btn-sm"
                          style={{ textDecoration: 'none' }}
                        >
                          View Creator Profile
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 4: REFERRAL HUB & VIRAL PERKS */}
        {activeTab === 'referrals' && (
          <div>
            <div style={{ marginBottom: '1.75rem' }}>
              <h2 style={{ fontSize: '1.35rem', fontWeight: '800', color: 'var(--color-secondary)' }}>
                Invite Friends & Earn Free Masterclasses
              </h2>
              <p style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>
                Share Korsa with friends, study groups, and classmates. Both of you get rewarded instantly!
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
              
              {/* Share link card */}
              <div className="card" style={{ padding: '1.75rem' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--color-primary)', textTransform: 'uppercase' }}>
                  Your Personal Invite Link
                </span>
                <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', margin: '0.5rem 0 1rem 0' }}>
                  Send this link to anyone. When they sign up, your account gets credited automatically.
                </p>

                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  backgroundColor: '#f8fafc',
                  padding: '0.6rem 0.85rem',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--color-border)',
                  marginBottom: '1rem'
                }}>
                  <input
                    type="text"
                    readOnly
                    value={referralStats?.referral_link || `${window.location.origin}/?ref=${referralStats?.referral_code || ''}`}
                    style={{
                      border: 'none',
                      backgroundColor: 'transparent',
                      width: '100%',
                      fontSize: '0.85rem',
                      color: 'var(--color-secondary)',
                      outline: 'none',
                      fontFamily: 'monospace'
                    }}
                  />
                  <button
                    onClick={handleCopyLink}
                    className="btn btn-primary btn-sm"
                    style={{ padding: '0.35rem 0.65rem', flexShrink: 0 }}
                  >
                    {copiedLink ? <Check size={14} /> : <Copy size={14} />}
                  </button>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button onClick={handleShareNative} className="btn btn-primary btn-sm" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}>
                    <Share2 size={14} /> Native Share
                  </button>
                  <button onClick={handleCopyCode} className="btn btn-secondary btn-sm" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    {copiedCode ? <Check size={14} /> : <Copy size={14} />} Copy Code
                  </button>
                </div>
              </div>

              {/* Milestones Card */}
              <div className="card" style={{ padding: '1.75rem' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--color-accent)', textTransform: 'uppercase' }}>
                  Reward Milestones
                </span>
                <h3 style={{ fontSize: '1.15rem', fontWeight: '800', marginTop: '0.3rem', marginBottom: '0.75rem' }}>
                  Community Flywheel Tiers
                </h3>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.65rem' }}>
                    <div style={{
                      width: '24px',
                      height: '24px',
                      borderRadius: '50%',
                      backgroundColor: friendsCount >= 1 ? '#10b981' : '#e2e8f0',
                      color: friendsCount >= 1 ? '#ffffff' : '#64748b',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.75rem',
                      fontWeight: '800',
                      flexShrink: 0
                    }}>
                      1
                    </div>
                    <div>
                      <div style={{ fontWeight: '700', fontSize: '0.875rem' }}>1 Friend Joined</div>
                      <div style={{ fontSize: '0.775rem', color: 'var(--color-text-muted)' }}>+10 free credits + unlock bonus starter cheat sheet</div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.65rem' }}>
                    <div style={{
                      width: '24px',
                      height: '24px',
                      borderRadius: '50%',
                      backgroundColor: friendsCount >= 3 ? '#10b981' : '#e2e8f0',
                      color: friendsCount >= 3 ? '#ffffff' : '#64748b',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.75rem',
                      fontWeight: '800',
                      flexShrink: 0
                    }}>
                      3
                    </div>
                    <div>
                      <div style={{ fontWeight: '700', fontSize: '0.875rem' }}>3 Friends Joined (Unlocked!)</div>
                      <div style={{ fontSize: '0.775rem', color: 'var(--color-text-muted)' }}>Full access to premium community courses and live QA</div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.65rem' }}>
                    <div style={{
                      width: '24px',
                      height: '24px',
                      borderRadius: '50%',
                      backgroundColor: friendsCount >= 5 ? '#10b981' : '#e2e8f0',
                      color: friendsCount >= 5 ? '#ffffff' : '#64748b',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.75rem',
                      fontWeight: '800',
                      flexShrink: 0
                    }}>
                      5
                    </div>
                    <div>
                      <div style={{ fontWeight: '700', fontSize: '0.875rem' }}>5 Friends Joined</div>
                      <div style={{ fontSize: '0.775rem', color: 'var(--color-text-muted)' }}>1 Free 1-on-1 micro-tutoring session coupon ($25 value)</div>
                    </div>
                  </div>
                </div>
              </div>

            </div>

            {/* Friends list */}
            {referralStats?.friends && referralStats.friends.length > 0 && (
              <div className="card" style={{ padding: '1.5rem' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '1rem' }}>
                  Invited Friends ({referralStats.friends.length})
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {referralStats.friends.map((f, idx) => (
                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.6rem 0', borderBottom: '1px solid var(--color-border)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                        <UserCheck size={16} color="var(--color-accent)" />
                        <span style={{ fontWeight: '600', fontSize: '0.875rem' }}>{f.name}</span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>({f.email})</span>
                      </div>
                      <span className="badge badge-free" style={{ fontSize: '0.7rem' }}>+10 CREDITS</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 5: ACTIVE & PAST SUBSCRIPTIONS */}
        {activeTab === 'subscriptions' && (
          <div>
            {/* Active Subscriptions */}
            <div style={{ marginBottom: '2.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                <h2 style={{ fontSize: '1.35rem', fontWeight: '800', color: 'var(--color-secondary)' }}>
                  Active Teacher Subscriptions ({activeSubs.length})
                </h2>
                <button onClick={() => onSelectTeacher(null)} className="btn btn-secondary btn-sm">
                  + Find More Teachers
                </button>
              </div>

              {activeSubs.length === 0 ? (
                <div className="card" style={{ padding: '2.5rem', textAlign: 'center' }}>
                  <p style={{ color: 'var(--color-text-muted)', marginBottom: '1rem' }}>You have no active teacher subscriptions.</p>
                  <button onClick={() => onSelectTeacher(null)} className="btn btn-primary btn-sm">
                    Browse Teachers
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {activeSubs.map((sub) => (
                    <div 
                      key={sub.id} 
                      className="card"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '1.5rem',
                        flexWrap: 'wrap',
                        gap: '1rem'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                        <img 
                          src={sub.teacher_avatar} 
                          alt={sub.teacher_name}
                          style={{ width: '56px', height: '56px', borderRadius: 'var(--radius-full)', objectFit: 'cover' }}
                        />
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                            <h3 style={{ fontSize: '1.15rem', fontWeight: '700' }}>{sub.teacher_name}</h3>
                            <span className="badge badge-free">ACTIVE</span>
                          </div>
                          <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                            {sub.teacher_headline}
                          </p>
                          <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.4rem' }}>
                            {sub.teacher_subjects.map((s, i) => (
                              <span key={i} className="badge" style={{ backgroundColor: '#eff6ff', color: '#1e40af', fontSize: '0.725rem' }}>
                                {s}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: '1.25rem', fontWeight: '800', color: 'var(--color-secondary)' }}>
                            ${sub.price} / mo
                          </div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '0.3rem', justifyContent: 'flex-end' }}>
                            <Calendar size={13} />
                            Renews: {sub.renewal_at?.split(' ')[0] || 'Next Month'}
                          </div>
                        </div>

                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button 
                            onClick={() => onSelectTeacher(sub.teacher_id)}
                            className="btn btn-primary btn-sm"
                          >
                            Open Classroom
                          </button>
                          <button 
                            onClick={() => handleCancelSub(sub.id)}
                            className="btn btn-danger btn-sm"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Past / Cancelled Subscriptions */}
            {pastSubs.length > 0 && (
              <div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: '700', color: 'var(--color-text-muted)', marginBottom: '1rem' }}>
                  Cancelled Subscriptions ({pastSubs.length})
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {pastSubs.map((sub) => (
                    <div 
                      key={sub.id} 
                      className="card"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '1rem 1.25rem',
                        backgroundColor: '#f8fafc',
                        flexWrap: 'wrap',
                        gap: '0.75rem'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <img 
                          src={sub.teacher_avatar} 
                          alt={sub.teacher_name}
                          style={{ width: '40px', height: '40px', borderRadius: 'var(--radius-full)', opacity: 0.8 }}
                        />
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span style={{ fontWeight: '700', fontSize: '0.95rem' }}>{sub.teacher_name}</span>
                            <span className="badge badge-role">CANCELLED</span>
                          </div>
                          <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                            Cancelled on {sub.cancelled_at?.split(' ')[0] || 'Recently'}
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={() => handleReactivateSub(sub.id)}
                        className="btn btn-secondary btn-sm"
                        style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                      >
                        <RotateCcw size={14} /> Reactivate (${sub.price}/mo)
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 6: BILLING LEDGER & SIMULATED INVOICES */}
        {activeTab === 'ledger' && (
          <div>
            <div style={{ marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.35rem', fontWeight: '800', color: 'var(--color-secondary)' }}>
                Simulated Invoices & Payment Ledger
              </h2>
              <p style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>
                Korsa operates on a $0-first simulated checkout model for testing. No real credit card is billed.
              </p>
            </div>

            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
              {ledgerPayments.length === 0 ? (
                <div style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                  No simulated transactions recorded.
                </div>
              ) : (
                <div className="table-responsive">
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
                    <thead>
                      <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid var(--color-border)' }}>
                        <th style={{ padding: '0.85rem 1rem', color: 'var(--color-text-muted)' }}>Invoice ID</th>
                        <th style={{ padding: '0.85rem 1rem', color: 'var(--color-text-muted)' }}>Date</th>
                        <th style={{ padding: '0.85rem 1rem', color: 'var(--color-text-muted)' }}>Teacher</th>
                        <th style={{ padding: '0.85rem 1rem', color: 'var(--color-text-muted)' }}>Amount</th>
                        <th style={{ padding: '0.85rem 1rem', color: 'var(--color-text-muted)' }}>Billing Mode</th>
                        <th style={{ padding: '0.85rem 1rem', color: 'var(--color-text-muted)' }}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ledgerPayments.map((p) => (
                        <tr key={p.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                          <td style={{ padding: '0.85rem 1rem', fontFamily: 'monospace', fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                            INV-00{p.id}
                          </td>
                          <td style={{ padding: '0.85rem 1rem', color: 'var(--color-text-muted)' }}>
                            {p.created_at?.split(' ')[0]}
                          </td>
                          <td style={{ padding: '0.85rem 1rem', fontWeight: '600' }}>
                            {p.teacher_name}
                          </td>
                          <td style={{ padding: '0.85rem 1rem', fontWeight: '700' }}>
                            ${p.amount}
                          </td>
                          <td style={{ padding: '0.85rem 1rem' }}>
                            <span className="badge badge-role" style={{ fontSize: '0.725rem' }}>SIMULATED ($0)</span>
                          </td>
                          <td style={{ padding: '0.85rem 1rem' }}>
                            <span className="badge badge-free">PAID</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
