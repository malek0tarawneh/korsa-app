import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { X, CheckCircle, ShieldCheck, ArrowRight, Zap, Check } from 'lucide-react';

export default function SubscribeModal({ isOpen, onClose, teacher, onSuccess }) {
  const { token, refreshUser } = useAuth();
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
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '480px' }}>
        
        {/* Header */}
        <div className="modal-header">
          <div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: '700' }}>
              {confirmed ? 'Subscription Enrolled!' : `Join ${teacher.name}'s Class`}
            </h3>
            <p style={{ fontSize: '0.825rem', color: 'var(--color-text-muted)' }}>
              Direct teacher payment via CLIQ / Zain Cash · 0% Platform Fee
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
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '1.25rem', fontWeight: '800', color: 'var(--color-secondary)' }}>
                    {priceJod} JOD
                  </div>
                  <div style={{ fontSize: '0.725rem', color: 'var(--color-text-muted)' }}>per month</div>
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
                    Teacher Payout Information
                  </span>
                  <span style={{ fontSize: '0.75rem', fontWeight: '700', color: '#15803d', backgroundColor: '#dcfce7', padding: '0.1rem 0.5rem', borderRadius: 'var(--radius-full)' }}>
                    0% Platform Fee
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.85rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: '#475569' }}>CLIQ Alias:</span>
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
                      {cliqAlias} {copiedAlias ? '(Copied)' : '(Copy)'}
                    </button>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#475569' }}>Bank:</span>
                    <strong style={{ color: '#1e293b' }}>{bankName}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#475569' }}>Zain Cash / Orange:</span>
                    <strong style={{ color: '#1e293b' }}>{walletPhone}</strong>
                  </div>
                </div>
              </div>

              {/* Input for CLIQ Reference Number */}
              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: '600', marginBottom: '0.35rem' }}>
                  CLIQ Transfer Reference Number (Optional or after transfer)
                </label>
                <input 
                  type="text"
                  className="form-input"
                  placeholder="e.g. CLIQ-9843210 or Bank Transfer Ref"
                  value={cliqRef}
                  onChange={(e) => setCliqRef(e.target.value)}
                />
                <span style={{ fontSize: '0.725rem', color: 'var(--color-text-muted)', display: 'block', marginTop: '4px' }}>
                  Send {priceJod} JOD to the CLIQ alias above from your banking app. 100% of the payment goes straight to the teacher.
                </span>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary"
                style={{ width: '100%', padding: '0.75rem', fontWeight: '700' }}
              >
                {loading ? 'Activating Access...' : `Confirm Enrollment (${priceJod} JOD / mo)`}
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
                Class Access Unlocked!
              </h4>
              <p style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)', marginBottom: '1.5rem', maxWidth: '380px', margin: '0 auto 1.5rem auto', lineHeight: 1.5 }}>
                You now have full access to <strong>{teacher.name}</strong>'s curriculum, study guides, and video lessons.
              </p>
              <button 
                onClick={handleFinish} 
                className="btn btn-primary" 
                style={{ width: '100%' }}
              >
                Start Learning Now <ArrowRight size={16} />
              </button>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
