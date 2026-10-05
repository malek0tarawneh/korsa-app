import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { X, CheckCircle, ShieldAlert, Sparkles, ArrowRight } from 'lucide-react';

export default function SubscribeModal({ isOpen, onClose, teacher, onSuccess }) {
  const { token, refreshUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [confirmed, setConfirmed] = useState(false);

  if (!isOpen || !teacher) return null;

  const price = parseFloat(teacher.monthly_price || '5.00');
  const commissionRate = 0.20; // 20%
  const platformFee = (price * commissionRate).toFixed(2);
  const teacherShare = (price - parseFloat(platformFee)).toFixed(2);

  const handleConfirmSimulation = async () => {
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/subscriptions/simulate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ teacher_id: teacher.id })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to simulate subscription');
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
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        
        {/* Header */}
        <div className="modal-header">
          <div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: '700' }}>
              {confirmed ? 'Subscription Active!' : `Subscribe to ${teacher.name}`}
            </h3>
            <p style={{ fontSize: '0.825rem', color: 'var(--color-text-muted)' }}>
              Direct teacher-to-student educational subscription
            </p>
          </div>
          <button onClick={onClose} style={{ color: 'var(--color-text-muted)' }}>
            <X size={20} />
          </button>
        </div>

        <div className="modal-body">
          {error && (
            <div className="alert alert-error">
              <span>{error}</span>
            </div>
          )}

          {!confirmed ? (
            <>
              {/* Teacher Summary Card */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '1rem',
                padding: '1rem',
                backgroundColor: '#f8fafc',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--color-border)',
                marginBottom: '1.25rem'
              }}>
                <img 
                  src={teacher.avatar_url} 
                  alt={teacher.name}
                  style={{ width: '56px', height: '56px', borderRadius: 'var(--radius-full)', objectFit: 'cover' }}
                />
                <div>
                  <h4 style={{ fontSize: '1.05rem', fontWeight: '700' }}>{teacher.name}</h4>
                  <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>{teacher.headline}</p>
                </div>
              </div>

              {/* Financial Simulation Breakdown */}
              <div style={{
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-md)',
                padding: '1rem',
                marginBottom: '1.25rem'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
                  <span style={{ color: 'var(--color-text-muted)' }}>Monthly Subscription Fee</span>
                  <span style={{ fontWeight: '700' }}>${price.toFixed(2)} / month</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.825rem', color: 'var(--color-text-muted)' }}>
                  <span>Teacher Direct Share (80%)</span>
                  <span style={{ color: 'var(--color-accent)', fontWeight: '600' }}>+${teacherShare}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.825rem', color: 'var(--color-text-muted)' }}>
                  <span>Korsa Platform Infrastructure (20%)</span>
                  <span>${platformFee}</span>
                </div>
              </div>

              {/* Zero Dollar Guarantee Banner */}
              <div className="alert alert-info" style={{ fontSize: '0.825rem' }}>
                <Sparkles size={18} style={{ flexShrink: 0 }} />
                <div>
                  <strong>Simulated Payment ($0 First MVP):</strong> No real money will be charged. This creates an active subscription in the local database and immediately unlocks subscriber-only lessons.
                </div>
              </div>

              <button
                onClick={handleConfirmSimulation}
                disabled={loading}
                className="btn btn-primary"
                style={{ width: '100%', marginTop: '0.5rem' }}
              >
                {loading ? 'Activating Subscription...' : `Confirm Simulated Subscription — $${price.toFixed(2)}/mo`}
              </button>
            </>
          ) : (
            <div style={{ textAlign: 'center', padding: '1rem 0' }}>
              <div style={{
                width: '60px',
                height: '60px',
                backgroundColor: 'var(--color-free-bg)',
                borderRadius: 'var(--radius-full)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1rem auto',
                color: 'var(--color-accent)'
              }}>
                <CheckCircle size={36} />
              </div>
              <h4 style={{ fontSize: '1.2rem', fontWeight: '700', marginBottom: '0.5rem' }}>
                Access Unlocked!
              </h4>
              <p style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)', marginBottom: '1.5rem', maxWidth: '380px', margin: '0 auto 1.5rem auto' }}>
                You are now subscribed to <strong>{teacher.name}</strong>. All subscriber-only deep dive lessons, practice worksheets, and resources are unlocked.
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
