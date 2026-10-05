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
  ExternalLink
} from 'lucide-react';

export default function StudentDashboard({ onSelectTeacher, onOpenLesson }) {
  const { user, token, refreshUser } = useAuth();
  const [activeTab, setActiveTab] = useState('progress'); // 'progress' | 'subscriptions' | 'ledger'
  const [subscriptions, setSubscriptions] = useState([]);
  const [progressCourses, setProgressCourses] = useState([]);
  const [ledgerPayments, setLedgerPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionMessage, setActionMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      // 1. Fetch subscriptions
      const subRes = await fetch('/api/subscriptions/my', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (subRes.ok) {
        const subs = await subRes.json();
        setSubscriptions(subs);
      }

      // 2. Fetch learning progress
      const progRes = await fetch('/api/progress/my', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (progRes.ok) {
        const prog = await progRes.json();
        setProgressCourses(prog);
      }

      // 3. Fetch simulated invoices ledger
      const ledgerRes = await fetch('/api/subscriptions/my/ledger', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (ledgerRes.ok) {
        const ledger = await ledgerRes.json();
        setLedgerPayments(ledger);
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

  const handleToggleLessonFromDashboard = async (courseId, lessonId, currentStatus) => {
    try {
      const nextStatus = !currentStatus;
      const res = await fetch('/api/progress/toggle', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          course_id: courseId,
          lesson_id: lessonId,
          completed: nextStatus
        })
      });
      if (res.ok) {
        loadData();
      }
    } catch (err) {
      console.error('Error toggling progress:', err);
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

  return (
    <div style={{ padding: '2.5rem 0 5rem 0' }}>
      <div className="container">
        
        {/* Welcome Banner */}
        <div style={{ marginBottom: '2.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
            <span className="badge badge-role student">STUDENT CLASSROOM</span>
            <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>{user?.email}</span>
          </div>
          <h1 style={{ fontSize: '1.85rem', fontWeight: '800', color: 'var(--color-secondary)' }}>
            Welcome back, {user?.name}
          </h1>
          <p style={{ fontSize: '0.95rem', color: 'var(--color-text-muted)', marginTop: '4px' }}>
            Track your progress across courses, resume unfinished lessons, and manage your teacher subscriptions.
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

        {/* Navigation Tabs */}
        <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid var(--color-border)', marginBottom: '2rem' }}>
          <button
            onClick={() => setActiveTab('progress')}
            style={{
              padding: '0.75rem 1.25rem',
              fontWeight: activeTab === 'progress' ? '700' : '500',
              color: activeTab === 'progress' ? 'var(--color-primary)' : 'var(--color-text-muted)',
              borderBottom: activeTab === 'progress' ? '2px solid var(--color-primary)' : '2px solid transparent',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem'
            }}
          >
            <BookOpen size={16} /> My Learning Progress ({progressCourses.length})
          </button>
          <button
            onClick={() => setActiveTab('subscriptions')}
            style={{
              padding: '0.75rem 1.25rem',
              fontWeight: activeTab === 'subscriptions' ? '700' : '500',
              color: activeTab === 'subscriptions' ? 'var(--color-primary)' : 'var(--color-text-muted)',
              borderBottom: activeTab === 'subscriptions' ? '2px solid var(--color-primary)' : '2px solid transparent',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem'
            }}
          >
            <CreditCard size={16} /> Active Subscriptions ({activeSubs.length})
          </button>
          <button
            onClick={() => setActiveTab('ledger')}
            style={{
              padding: '0.75rem 1.25rem',
              fontWeight: activeTab === 'ledger' ? '700' : '500',
              color: activeTab === 'ledger' ? 'var(--color-primary)' : 'var(--color-text-muted)',
              borderBottom: activeTab === 'ledger' ? '2px solid var(--color-primary)' : '2px solid transparent',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem'
            }}
          >
            <Receipt size={16} /> Billing Ledger ({ledgerPayments.length})
          </button>
        </div>

        {/* TAB 1: LEARNING PROGRESS & RESUME WATCHING */}
        {activeTab === 'progress' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h2 style={{ fontSize: '1.35rem', fontWeight: '800', color: 'var(--color-secondary)' }}>
                Course Progress
              </h2>
              <button onClick={() => onSelectTeacher(null)} className="btn btn-secondary btn-sm">
                + Browse More Courses
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

        {/* TAB 2: ACTIVE & PAST SUBSCRIPTIONS */}
        {activeTab === 'subscriptions' && (
          <div>
            {/* Active Subscriptions */}
            <div style={{ marginBottom: '2.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
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

        {/* TAB 3: BILLING LEDGER & SIMULATED INVOICES */}
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
