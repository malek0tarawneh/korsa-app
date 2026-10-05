import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { X, CheckCircle2, AlertCircle, Sparkles } from 'lucide-react';

export default function AuthModal({ isOpen, onClose, initialMode = 'login' }) {
  const { login, register, quickLogin } = useAuth();
  const [mode, setMode] = useState(initialMode); // 'login' | 'register'
  const [role, setRole] = useState('student'); // 'student' | 'teacher'
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    headline: '',
    bio: '',
    subject: 'Mathematics',
    grade: 'Grade 12',
    monthly_price: '5'
  });

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (mode === 'login') {
        await login(formData.email, formData.password);
      } else {
        const payload = {
          name: formData.name,
          email: formData.email,
          password: formData.password,
          role,
          headline: formData.headline,
          bio: formData.bio,
          subjects: [formData.subject],
          educational_levels: [formData.grade],
          monthly_price_cents: Math.round(parseFloat(formData.monthly_price || '5') * 100)
        };
        await register(payload);
      }
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDemo = async (roleName) => {
    setError('');
    setLoading(true);
    try {
      await quickLogin(roleName);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        
        {/* Header */}
        <div className="modal-header">
          <div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: '700' }}>
              {mode === 'login' ? 'Log in to Korsa' : 'Create an Account'}
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginTop: '2px' }}>
              {mode === 'login' 
                ? 'Access your subscriptions, courses, and dashboard.' 
                : 'Join the direct teacher-to-student educational platform.'}
            </p>
          </div>
          <button onClick={onClose} style={{ color: 'var(--color-text-muted)' }}>
            <X size={20} />
          </button>
        </div>

        {/* Demo Quick Login Banner */}
        <div style={{ backgroundColor: '#f8fafc', padding: '0.9rem 1.5rem', borderBottom: '1px solid var(--color-border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', fontWeight: '700', color: '#475569', marginBottom: '0.5rem' }}>
            <Sparkles size={15} color="#2563eb" /> 1-CLICK INSTANT DEMO LOGIN (NO TYPING NEEDED):
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <button 
              type="button"
              onClick={() => handleDemo('student')}
              className="btn btn-secondary btn-sm"
              style={{ fontSize: '0.8rem' }}
            >
              Demo Student
            </button>
            <button 
              type="button"
              onClick={() => handleDemo('teacher')}
              className="btn btn-secondary btn-sm"
              style={{ fontSize: '0.8rem' }}
            >
              Demo Teacher
            </button>
            <button 
              type="button"
              onClick={() => handleDemo('admin')}
              className="btn btn-secondary btn-sm"
              style={{ fontSize: '0.8rem' }}
            >
              Demo Admin
            </button>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="modal-body">
          {error && (
            <div className="alert alert-error">
              <AlertCircle size={18} />
              <span>{error}</span>
            </div>
          )}

          {/* Mode Switcher Tabs */}
          <div style={{ display: 'flex', backgroundColor: '#f1f5f9', borderRadius: 'var(--radius-md)', padding: '3px', marginBottom: '1.25rem' }}>
            <button
              type="button"
              onClick={() => { setMode('login'); setError(''); }}
              style={{
                flex: 1,
                padding: '0.5rem',
                borderRadius: 'var(--radius-sm)',
                fontWeight: mode === 'login' ? '700' : '500',
                backgroundColor: mode === 'login' ? '#ffffff' : 'transparent',
                boxShadow: mode === 'login' ? 'var(--shadow-sm)' : 'none',
                color: mode === 'login' ? 'var(--color-primary)' : 'var(--color-text-muted)'
              }}
            >
              Log In
            </button>
            <button
              type="button"
              onClick={() => { setMode('register'); setError(''); }}
              style={{
                flex: 1,
                padding: '0.5rem',
                borderRadius: 'var(--radius-sm)',
                fontWeight: mode === 'register' ? '700' : '500',
                backgroundColor: mode === 'register' ? '#ffffff' : 'transparent',
                boxShadow: mode === 'register' ? 'var(--shadow-sm)' : 'none',
                color: mode === 'register' ? 'var(--color-primary)' : 'var(--color-text-muted)'
              }}
            >
              Register
            </button>
          </div>

          {/* Role selector if register */}
          {mode === 'register' && (
            <div style={{ marginBottom: '1.25rem' }}>
              <label className="form-label">I want to join as a:</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div 
                  onClick={() => setRole('student')}
                  style={{
                    padding: '0.75rem',
                    border: `2px solid ${role === 'student' ? 'var(--color-primary)' : 'var(--color-border)'}`,
                    borderRadius: 'var(--radius-md)',
                    cursor: 'pointer',
                    backgroundColor: role === 'student' ? 'var(--color-primary-light)' : '#ffffff'
                  }}
                >
                  <div style={{ fontWeight: '700', fontSize: '0.9rem', color: role === 'student' ? 'var(--color-primary-dark)' : 'inherit' }}>
                    Student
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                    Subscribe & learn from top teachers
                  </div>
                </div>

                <div 
                  onClick={() => setRole('teacher')}
                  style={{
                    padding: '0.75rem',
                    border: `2px solid ${role === 'teacher' ? 'var(--color-primary)' : 'var(--color-border)'}`,
                    borderRadius: 'var(--radius-md)',
                    cursor: 'pointer',
                    backgroundColor: role === 'teacher' ? 'var(--color-primary-light)' : '#ffffff'
                  }}
                >
                  <div style={{ fontWeight: '700', fontSize: '0.9rem', color: role === 'teacher' ? 'var(--color-primary-dark)' : 'inherit' }}>
                    Teacher
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                    Build audience & earn recurring income
                  </div>
                </div>
              </div>
            </div>
          )}

          {mode === 'register' && (
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input
                type="text"
                name="name"
                required
                className="form-input"
                placeholder={role === 'teacher' ? 'Dr. Sarah Connor' : 'Alex Johnson'}
                value={formData.name}
                onChange={handleChange}
              />
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input
              type="email"
              name="email"
              required
              className="form-input"
              placeholder="name@example.com"
              value={formData.email}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              type="password"
              name="password"
              required
              className="form-input"
              placeholder="••••••••"
              value={formData.password}
              onChange={handleChange}
            />
          </div>

          {/* Additional fields for Teacher Registration */}
          {mode === 'register' && role === 'teacher' && (
            <>
              <div className="form-group">
                <label className="form-label">Primary Subject</label>
                <select name="subject" className="form-input" value={formData.subject} onChange={handleChange}>
                  <option value="Mathematics">Mathematics</option>
                  <option value="Physics">Physics</option>
                  <option value="Chemistry">Chemistry</option>
                  <option value="English">English</option>
                  <option value="Computer Science">Computer Science</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Educational Level</label>
                <select name="grade" className="form-input" value={formData.grade} onChange={handleChange}>
                  <option value="Grade 10">Grade 10</option>
                  <option value="Grade 11">Grade 11</option>
                  <option value="Grade 12">Grade 12 (Tawjihi / High School)</option>
                  <option value="University">University</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Monthly Subscription Price ($ USD)</label>
                <input
                  type="number"
                  name="monthly_price"
                  min="1"
                  max="100"
                  required
                  className="form-input"
                  placeholder="5"
                  value={formData.monthly_price}
                  onChange={handleChange}
                />
                <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                  Students subscribe directly to you at this monthly fee.
                </span>
              </div>
            </>
          )}

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', marginTop: '0.5rem' }}
            disabled={loading}
          >
            {loading ? 'Please wait...' : mode === 'login' ? 'Log In' : 'Complete Registration'}
          </button>
        </form>

      </div>
    </div>
  );
}
