import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  ShieldCheck, 
  Users, 
  DollarSign, 
  Percent, 
  CheckCircle2, 
  AlertCircle, 
  Settings,
  TrendingUp,
  MessageSquare,
  Eye,
  EyeOff,
  Trash2,
  Star,
  Receipt,
  Database,
  Download
} from 'lucide-react';

export default function AdminDashboard() {
  const { user, token } = useAuth();
  const [data, setData] = useState(null);
  const [usersList, setUsersList] = useState([]);
  const [reviewsList, setReviewsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'reviews' | 'ledger' | 'users'
  const [commissionInput, setCommissionInput] = useState('20');
  const [savingCommission, setSavingCommission] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');

  const loadAdminData = async () => {
    try {
      // 1. Overview
      const res = await fetch('/api/admin/overview', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const json = await res.json();
        setData(json);
        if (json.settings && json.settings.platform_commission_percentage) {
          setCommissionInput(json.settings.platform_commission_percentage);
        }
      }

      // 2. Users
      const usersRes = await fetch('/api/admin/users', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (usersRes.ok) {
        const usersJson = await usersRes.json();
        setUsersList(usersJson);
      }

      // 3. Reviews for Moderation
      const revRes = await fetch('/api/reviews/admin', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (revRes.ok) {
        const revJson = await revRes.json();
        setReviewsList(revJson);
      }
    } catch (err) {
      console.error('Failed to load admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) loadAdminData();
  }, [token]);

  const handleUpdateCommission = async (e) => {
    e.preventDefault();
    setSavingCommission(true);
    setStatusMessage('');
    try {
      const res = await fetch('/api/admin/settings/commission', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ commission_percentage: commissionInput })
      });
      if (res.ok) {
        setStatusMessage(`Platform commission successfully updated to ${commissionInput}%`);
        loadAdminData();
      }
    } catch (err) {
      console.error('Failed to update commission:', err);
    } finally {
      setSavingCommission(false);
    }
  };

  const handleToggleReviewModeration = async (reviewId) => {
    try {
      const res = await fetch(`/api/reviews/admin/${reviewId}/toggle-moderation`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const result = await res.json();
        setStatusMessage(result.message);
        loadAdminData();
      }
    } catch (err) {
      console.error('Moderation error:', err);
    }
  };

  const handleDeleteReview = async (reviewId) => {
    if (!window.confirm('Are you sure you want to permanently delete this review?')) return;
    try {
      const res = await fetch(`/api/reviews/admin/${reviewId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setStatusMessage('Review deleted successfully.');
        loadAdminData();
      }
    } catch (err) {
      console.error('Delete review error:', err);
    }
  };

  const handleDownloadBackup = async (type) => {
    try {
      setStatusMessage(`Preparing ${type.toUpperCase()} database backup...`);
      const res = await fetch(`/api/admin/export/${type}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Download failed');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = type === 'json' 
        ? `korsa-snapshot-${new Date().toISOString().slice(0,10)}.json` 
        : `korsa-backup-${new Date().toISOString().slice(0,10)}.db`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      setStatusMessage(`Database ${type.toUpperCase()} backup downloaded successfully!`);
    } catch (err) {
      console.error('Backup download error:', err);
      setStatusMessage('Failed to download backup');
    }
  };

  if (loading) {
    return (
      <div className="container" style={{ padding: '4rem 1rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
        Loading Admin Operations Hub...
      </div>
    );
  }

  const stats = data?.stats || {};
  const recentPayments = data?.recent_payments || [];

  return (
    <div style={{ padding: '2.5rem 0 5rem 0' }}>
      <div className="container">
        
        {/* Header */}
        <div style={{ marginBottom: '2.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
            <span className="badge badge-role admin">PLATFORM GOVERNANCE</span>
          </div>
          <h1 style={{ fontSize: '1.85rem', fontWeight: '800', color: 'var(--color-secondary)' }}>
            Korsa Admin Hub & Platform Operations
          </h1>
          <p style={{ fontSize: '0.95rem', color: 'var(--color-text-muted)', marginTop: '4px' }}>
            Configure platform commissions, moderate student reviews, inspect financial ledger, and manage users.
          </p>
        </div>

        {statusMessage && (
          <div className="alert alert-success" style={{ marginBottom: '1.5rem' }}>
            <CheckCircle2 size={18} /> {statusMessage}
          </div>
        )}

        {/* Platform Metric Highlights */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '1.25rem', marginBottom: '2.5rem' }}>
          
          <div className="card" style={{ padding: '1.25rem' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', fontWeight: '600' }}>Total Users</span>
            <div style={{ fontSize: '1.6rem', fontWeight: '800', marginTop: '0.35rem' }}>{stats.total_users}</div>
            <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
              {stats.total_students} students · {stats.total_teachers} teachers
            </span>
          </div>

          <div className="card" style={{ padding: '1.25rem' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', fontWeight: '600' }}>Active Subscriptions</span>
            <div style={{ fontSize: '1.6rem', fontWeight: '800', marginTop: '0.35rem', color: 'var(--color-primary)' }}>
              {stats.active_subscriptions}
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
              {stats.total_courses} courses published
            </span>
          </div>

          <div className="card" style={{ padding: '1.25rem' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', fontWeight: '600' }}>Total Gross Volume</span>
            <div style={{ fontSize: '1.6rem', fontWeight: '800', marginTop: '0.35rem' }}>${stats.gross_revenue}</div>
            <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Simulated subscriptions</span>
          </div>

          <div className="card" style={{ padding: '1.25rem', borderLeft: '4px solid var(--color-primary)' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', fontWeight: '600' }}>Korsa Commission</span>
            <div style={{ fontSize: '1.6rem', fontWeight: '800', marginTop: '0.35rem', color: 'var(--color-primary)' }}>
              ${stats.platform_commission_revenue}
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
              {commissionInput}% take rate
            </span>
          </div>

          <div className="card" style={{ padding: '1.25rem' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', fontWeight: '600' }}>Teacher Payout Pool</span>
            <div style={{ fontSize: '1.6rem', fontWeight: '800', marginTop: '0.35rem', color: 'var(--color-accent)' }}>
              ${stats.teacher_payout_pool}
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Direct creator revenue</span>
          </div>

        </div>

        {/* Sub-tabs */}
        <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid var(--color-border)', marginBottom: '2rem' }}>
          <button
            onClick={() => setActiveTab('overview')}
            style={{
              padding: '0.75rem 1.25rem',
              fontWeight: activeTab === 'overview' ? '700' : '500',
              color: activeTab === 'overview' ? 'var(--color-primary)' : 'var(--color-text-muted)',
              borderBottom: activeTab === 'overview' ? '2px solid var(--color-primary)' : '2px solid transparent',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem'
            }}
          >
            <Settings size={16} /> Commission Settings
          </button>
          <button
            onClick={() => setActiveTab('reviews')}
            style={{
              padding: '0.75rem 1.25rem',
              fontWeight: activeTab === 'reviews' ? '700' : '500',
              color: activeTab === 'reviews' ? 'var(--color-primary)' : 'var(--color-text-muted)',
              borderBottom: activeTab === 'reviews' ? '2px solid var(--color-primary)' : '2px solid transparent',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem'
            }}
          >
            <MessageSquare size={16} /> Reviews Moderation ({reviewsList.length})
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
            <Receipt size={16} /> Transaction Ledger ({recentPayments.length})
          </button>
          <button
            onClick={() => setActiveTab('users')}
            style={{
              padding: '0.75rem 1.25rem',
              fontWeight: activeTab === 'users' ? '700' : '500',
              color: activeTab === 'users' ? 'var(--color-primary)' : 'var(--color-text-muted)',
              borderBottom: activeTab === 'users' ? '2px solid var(--color-primary)' : '2px solid transparent',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              whiteSpace: 'nowrap'
            }}
          >
            <Users size={16} /> Users Directory ({usersList.length})
          </button>
          <button
            onClick={() => setActiveTab('backup')}
            style={{
              padding: '0.75rem 1.25rem',
              fontWeight: activeTab === 'backup' ? '700' : '500',
              color: activeTab === 'backup' ? 'var(--color-primary)' : 'var(--color-text-muted)',
              borderBottom: activeTab === 'backup' ? '2px solid var(--color-primary)' : '2px solid transparent',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              whiteSpace: 'nowrap'
            }}
          >
            <Database size={16} /> Database Backup & Export
          </button>
        </div>

        {/* TAB 1: COMMISSION CONFIGURATION */}
        {activeTab === 'overview' && (
          <div className="card" style={{ padding: '2rem', maxWidth: '720px' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: '800', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Settings size={20} color="var(--color-primary)" /> Configurable Platform Commission
            </h2>
            <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', marginBottom: '1.5rem', lineHeight: 1.6 }}>
              Adjust the platform take rate dynamically. This setting persists in the <code>platform_settings</code> SQLite table and applies immediately to all simulated student subscriptions.
            </p>

            <form onSubmit={handleUpdateCommission} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div>
                <label className="form-label">Platform Take Rate (%)</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{ position: 'relative', width: '140px' }}>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="1"
                      required
                      className="form-input"
                      value={commissionInput}
                      onChange={(e) => setCommissionInput(e.target.value)}
                      style={{ paddingRight: '2.2rem' }}
                    />
                    <Percent size={15} style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-light)' }} />
                  </div>
                  <span style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
                    Teachers receive <strong>{100 - (parseFloat(commissionInput) || 0)}%</strong> of gross subscriptions
                  </span>
                </div>
              </div>

              <div>
                <button type="submit" disabled={savingCommission} className="btn btn-primary btn-sm">
                  {savingCommission ? 'Saving...' : 'Save Commission Rate'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* TAB 2: REVIEWS MODERATION (Requirement 2) */}
        {activeTab === 'reviews' && (
          <div>
            <div style={{ marginBottom: '1.25rem' }}>
              <h2 style={{ fontSize: '1.35rem', fontWeight: '800', color: 'var(--color-secondary)' }}>
                Student Reviews Moderation ({reviewsList.length})
              </h2>
              <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                Inspect student ratings, hide inappropriate comments, or delete spam reviews.
              </p>
            </div>

            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
              {reviewsList.length === 0 ? (
                <div style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                  No reviews submitted across the platform yet.
                </div>
              ) : (
                <div className="table-responsive">
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid var(--color-border)' }}>
                      <th style={{ padding: '0.85rem 1rem', color: 'var(--color-text-muted)' }}>Student</th>
                      <th style={{ padding: '0.85rem 1rem', color: 'var(--color-text-muted)' }}>Teacher</th>
                      <th style={{ padding: '0.85rem 1rem', color: 'var(--color-text-muted)' }}>Rating</th>
                      <th style={{ padding: '0.85rem 1rem', color: 'var(--color-text-muted)' }}>Comment</th>
                      <th style={{ padding: '0.85rem 1rem', color: 'var(--color-text-muted)' }}>Status</th>
                      <th style={{ padding: '0.85rem 1rem', color: 'var(--color-text-muted)' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reviewsList.map((rev) => (
                      <tr key={rev.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                        <td style={{ padding: '0.85rem 1rem', fontWeight: '600' }}>
                          {rev.student_name}
                          <span style={{ display: 'block', fontSize: '0.725rem', color: 'var(--color-text-muted)', fontWeight: '400' }}>
                            {rev.student_email}
                          </span>
                        </td>
                        <td style={{ padding: '0.85rem 1rem' }}>{rev.teacher_name}</td>
                        <td style={{ padding: '0.85rem 1rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '2px', color: '#d97706' }}>
                            <Star size={14} fill="#d97706" /> {rev.rating} / 5
                          </div>
                        </td>
                        <td style={{ padding: '0.85rem 1rem', maxWidth: '300px' }}>
                          <p style={{ margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={rev.comment}>
                            "{rev.comment}"
                          </p>
                        </td>
                        <td style={{ padding: '0.85rem 1rem' }}>
                          {rev.is_moderated ? (
                            <span className="badge badge-role" style={{ backgroundColor: '#fee2e2', color: '#991b1b' }}>
                              HIDDEN (MODERATED)
                            </span>
                          ) : (
                            <span className="badge badge-free">VISIBLE</span>
                          )}
                        </td>
                        <td style={{ padding: '0.85rem 1rem' }}>
                          <div style={{ display: 'flex', gap: '0.4rem' }}>
                            <button
                              onClick={() => handleToggleReviewModeration(rev.id)}
                              className="btn btn-secondary btn-sm"
                              style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}
                              title={rev.is_moderated ? 'Approve and make visible' : 'Hide from teacher profile'}
                            >
                              {rev.is_moderated ? <Eye size={13} /> : <EyeOff size={13} />}
                              {rev.is_moderated ? 'Unhide' : 'Hide'}
                            </button>
                            <button
                              onClick={() => handleDeleteReview(rev.id)}
                              className="btn btn-danger btn-sm"
                              style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}
                              title="Delete review"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
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

        {/* TAB 3: TRANSACTION LEDGER */}
        {activeTab === 'ledger' && (
          <div>
            <div style={{ marginBottom: '1.25rem' }}>
              <h2 style={{ fontSize: '1.35rem', fontWeight: '800', color: 'var(--color-secondary)' }}>
                Platform Simulated Payment Transactions
              </h2>
            </div>

            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
              {recentPayments.length === 0 ? (
                <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                  No transactions recorded yet.
                </div>
              ) : (
                <div className="table-responsive">
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid var(--color-border)' }}>
                      <th style={{ padding: '0.75rem 1rem', color: 'var(--color-text-muted)' }}>Student</th>
                      <th style={{ padding: '0.75rem 1rem', color: 'var(--color-text-muted)' }}>Teacher</th>
                      <th style={{ padding: '0.75rem 1rem', color: 'var(--color-text-muted)' }}>Gross Amount</th>
                      <th style={{ padding: '0.75rem 1rem', color: 'var(--color-text-muted)' }}>Korsa Cut</th>
                      <th style={{ padding: '0.75rem 1rem', color: 'var(--color-text-muted)' }}>Teacher Cut</th>
                      <th style={{ padding: '0.75rem 1rem', color: 'var(--color-text-muted)' }}>Mode</th>
                      <th style={{ padding: '0.75rem 1rem', color: 'var(--color-text-muted)' }}>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentPayments.map((p) => (
                      <tr key={p.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                        <td style={{ padding: '0.75rem 1rem', fontWeight: '600' }}>{p.student_name}</td>
                        <td style={{ padding: '0.75rem 1rem' }}>{p.teacher_name}</td>
                        <td style={{ padding: '0.75rem 1rem', fontWeight: '700' }}>${p.amount}</td>
                        <td style={{ padding: '0.75rem 1rem', color: 'var(--color-primary)' }}>+${p.platform_cut}</td>
                        <td style={{ padding: '0.75rem 1rem', color: 'var(--color-accent)' }}>+${p.teacher_cut}</td>
                        <td style={{ padding: '0.75rem 1rem' }}>
                          <span className="badge badge-role" style={{ fontSize: '0.7rem' }}>SIMULATED</span>
                        </td>
                        <td style={{ padding: '0.75rem 1rem', color: 'var(--color-text-muted)' }}>{p.created_at?.split(' ')[0]}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            </div>
          </div>
        )}

        {/* TAB 4: USERS DIRECTORY */}
        {activeTab === 'users' && (
          <div>
            <div style={{ marginBottom: '1.25rem' }}>
              <h2 style={{ fontSize: '1.35rem', fontWeight: '800', color: 'var(--color-secondary)' }}>
                Registered Users Directory ({usersList.length})
              </h2>
            </div>

            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
              <div className="table-responsive">
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid var(--color-border)' }}>
                    <th style={{ padding: '0.75rem 1rem', color: 'var(--color-text-muted)' }}>User</th>
                    <th style={{ padding: '0.75rem 1rem', color: 'var(--color-text-muted)' }}>Email</th>
                    <th style={{ padding: '0.75rem 1rem', color: 'var(--color-text-muted)' }}>Role</th>
                    <th style={{ padding: '0.75rem 1rem', color: 'var(--color-text-muted)' }}>Created</th>
                  </tr>
                </thead>
                <tbody>
                  {usersList.map((u) => (
                    <tr key={u.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                      <td style={{ padding: '0.75rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <img 
                          src={u.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${u.name}`} 
                          alt={u.name}
                          style={{ width: '28px', height: '28px', borderRadius: 'var(--radius-full)' }}
                        />
                        <span style={{ fontWeight: '600' }}>{u.name}</span>
                      </td>
                      <td style={{ padding: '0.75rem 1rem', color: 'var(--color-text-muted)' }}>{u.email}</td>
                      <td style={{ padding: '0.75rem 1rem' }}>
                        <span className={`badge badge-role ${u.role}`}>{u.role.toUpperCase()}</span>
                      </td>
                      <td style={{ padding: '0.75rem 1rem', color: 'var(--color-text-muted)' }}>{u.created_at?.split(' ')[0]}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: DATABASE BACKUP & EXPORT (Requirement 1) */}
        {activeTab === 'backup' && (
          <div>
            <div style={{ marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.35rem', fontWeight: '800', color: 'var(--color-secondary)' }}>
                Database Backup & Snapshot Center
              </h2>
              <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                Generate instant 1-click snapshots or export raw SQLite files for backups, offline analytics, and compliance.
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
              {/* Option 1: JSON Snapshot */}
              <div className="card" style={{ padding: '1.75rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                    <div style={{ 
                      width: '42px', 
                      height: '42px', 
                      borderRadius: 'var(--radius-md)', 
                      backgroundColor: 'rgba(37, 99, 235, 0.1)', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      color: 'var(--color-primary)'
                    }}>
                      <Database size={22} />
                    </div>
                    <div>
                      <h3 style={{ fontSize: '1.1rem', fontWeight: '700', margin: 0 }}>JSON Data Snapshot</h3>
                      <span className="badge badge-free" style={{ marginTop: '3px' }}>Structured Export</span>
                    </div>
                  </div>

                  <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', lineHeight: 1.6, marginBottom: '1.25rem' }}>
                    Downloads a complete, human-readable JSON snapshot containing all 13 core database tables:
                    users, student profiles, teacher profiles, subjects, courses, sections, lessons, subscriptions, payments, progress, reviews, and platform settings.
                  </p>

                  <div style={{ 
                    backgroundColor: '#f8fafc', 
                    borderRadius: 'var(--radius-sm)', 
                    padding: '0.85rem 1rem', 
                    border: '1px solid var(--color-border)',
                    fontSize: '0.8rem',
                    color: 'var(--color-text-muted)',
                    marginBottom: '1.5rem'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                      <span>Format:</span>
                      <strong style={{ color: 'var(--color-secondary)' }}>JSON (UTF-8 formatted)</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                      <span>Tables Exported:</span>
                      <strong style={{ color: 'var(--color-secondary)' }}>13 Relational Tables</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>Best for:</span>
                      <strong style={{ color: 'var(--color-secondary)' }}>Migrations, Analytics & Audits</strong>
                    </div>
                  </div>
                </div>

                <button 
                  onClick={() => handleDownloadBackup('json')}
                  className="btn btn-primary"
                  style={{ width: '100%', justifyContent: 'center' }}
                >
                  <Download size={16} /> Download Full JSON Snapshot
                </button>
              </div>

              {/* Option 2: SQLite File (.db) */}
              <div className="card" style={{ padding: '1.75rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                    <div style={{ 
                      width: '42px', 
                      height: '42px', 
                      borderRadius: 'var(--radius-md)', 
                      backgroundColor: 'rgba(16, 185, 129, 0.1)', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      color: 'var(--color-accent)'
                    }}>
                      <Download size={22} />
                    </div>
                    <div>
                      <h3 style={{ fontSize: '1.1rem', fontWeight: '700', margin: 0 }}>Raw SQLite Database (.db)</h3>
                      <span className="badge badge-role teacher" style={{ marginTop: '3px' }}>Binary Database</span>
                    </div>
                  </div>

                  <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', lineHeight: 1.6, marginBottom: '1.25rem' }}>
                    Downloads the live SQLite single-file relational database. Includes foreign keys, indexes, schemas, and WAL transaction state with zero cloud dependencies or vendor lock-in.
                  </p>

                  <div style={{ 
                    backgroundColor: '#f8fafc', 
                    borderRadius: 'var(--radius-sm)', 
                    padding: '0.85rem 1rem', 
                    border: '1px solid var(--color-border)',
                    fontSize: '0.8rem',
                    color: 'var(--color-text-muted)',
                    marginBottom: '1.5rem'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                      <span>File Engine:</span>
                      <strong style={{ color: 'var(--color-secondary)' }}>SQLite 3 (WAL Mode)</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                      <span>Hosting Cost:</span>
                      <strong style={{ color: 'var(--color-accent)' }}>$0 (Single Local File)</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>Compatibility:</span>
                      <strong style={{ color: 'var(--color-secondary)' }}>sqlite3 CLI / DBeaver / Studio</strong>
                    </div>
                  </div>
                </div>

                <button 
                  onClick={() => handleDownloadBackup('sqlite')}
                  className="btn btn-secondary"
                  style={{ width: '100%', justifyContent: 'center', borderColor: 'var(--color-accent)', color: 'var(--color-accent)' }}
                >
                  <Download size={16} /> Download Raw Database (.db)
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
