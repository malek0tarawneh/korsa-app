import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  GraduationCap, 
  BookOpen, 
  LayoutDashboard, 
  ShieldCheck, 
  LogOut, 
  User, 
  Zap,
  Menu,
  X
} from 'lucide-react';

export default function Navbar({ currentView, setCurrentView, openAuthModal }) {
  const { user, logout, quickLogin } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [demoDropdownOpen, setDemoDropdownOpen] = useState(false);

  const handleNav = (view) => {
    setCurrentView(view);
    setMobileMenuOpen(false);
  };

  const handleQuickSwitch = async (role) => {
    await quickLogin(role);
    setDemoDropdownOpen(false);
    if (role === 'student') setCurrentView('explore');
    if (role === 'teacher') setCurrentView('teacher-dashboard');
    if (role === 'admin') setCurrentView('admin-dashboard');
  };

  return (
    <header style={{
      backgroundColor: 'var(--color-surface)',
      borderBottom: '1px solid var(--color-border)',
      position: 'sticky',
      top: 0,
      zIndex: 100
    }}>
      <div className="container" style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: '70px'
      }}>
        {/* Logo */}
        <div 
          onClick={() => handleNav('landing')} 
          style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', cursor: 'pointer' }}
        >
          <div style={{
            width: '38px',
            height: '38px',
            borderRadius: 'var(--radius-md)',
            backgroundColor: 'var(--color-primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff'
          }}>
            <GraduationCap size={22} />
          </div>
          <div>
            <span style={{ fontSize: '1.25rem', fontWeight: '800', letterSpacing: '-0.02em', color: 'var(--color-secondary)' }}>
              Korsa
            </span>
            <span style={{ fontSize: '0.65rem', display: 'block', color: 'var(--color-text-muted)', marginTop: '-4px', fontWeight: '600' }}>
              DIRECT TEACHER PLATFORM
            </span>
          </div>
        </div>

        {/* Desktop Nav Links */}
        <nav style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }} className="desktop-nav">
          <button 
            onClick={() => handleNav('landing')}
            style={{
              fontWeight: currentView === 'landing' ? '700' : '500',
              color: currentView === 'landing' ? 'var(--color-primary)' : 'var(--color-text-main)',
              fontSize: '0.925rem'
            }}
          >
            Home
          </button>
          
          <button 
            onClick={() => handleNav('explore')}
            style={{
              fontWeight: currentView === 'explore' ? '700' : '500',
              color: currentView === 'explore' ? 'var(--color-primary)' : 'var(--color-text-main)',
              fontSize: '0.925rem'
            }}
          >
            Find Teachers
          </button>

          {user && user.role === 'student' && (
            <button 
              onClick={() => handleNav('student-dashboard')}
              style={{
                fontWeight: currentView === 'student-dashboard' ? '700' : '500',
                color: currentView === 'student-dashboard' ? 'var(--color-primary)' : 'var(--color-text-main)',
                fontSize: '0.925rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem'
              }}
            >
              <BookOpen size={16} /> My Learning
            </button>
          )}

          {user && user.role === 'teacher' && (
            <button 
              onClick={() => handleNav('teacher-dashboard')}
              style={{
                fontWeight: currentView === 'teacher-dashboard' ? '700' : '500',
                color: currentView === 'teacher-dashboard' ? 'var(--color-primary)' : 'var(--color-text-main)',
                fontSize: '0.925rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem'
              }}
            >
              <LayoutDashboard size={16} /> Teacher Workspace
            </button>
          )}

          {user && user.role === 'admin' && (
            <button 
              onClick={() => handleNav('admin-dashboard')}
              style={{
                fontWeight: currentView === 'admin-dashboard' ? '700' : '500',
                color: currentView === 'admin-dashboard' ? 'var(--color-primary)' : 'var(--color-text-main)',
                fontSize: '0.925rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem'
              }}
            >
              <ShieldCheck size={16} /> Admin Hub
            </button>
          )}
        </nav>

        {/* Right Action: Quick Demo Switcher + Auth Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          
          {/* Quick Demo Switcher Pill */}
          <div style={{ position: 'relative' }}>
            <button 
              onClick={() => setDemoDropdownOpen(!demoDropdownOpen)}
              className="btn btn-secondary btn-sm"
              title="Switch demo role instantly"
              style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', borderColor: '#cbd5e1' }}
            >
              <Zap size={14} color="#f59e0b" fill="#f59e0b" />
              <span style={{ fontSize: '0.8rem', fontWeight: '600' }}>
                {user ? `Role: ${user.role.toUpperCase()}` : 'Quick Switch'}
              </span>
            </button>

            {demoDropdownOpen && (
              <div style={{
                position: 'absolute',
                right: 0,
                top: '110%',
                backgroundColor: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-md)',
                boxShadow: 'var(--shadow-lg)',
                padding: '0.5rem',
                width: '210px',
                zIndex: 200
              }}>
                <div style={{ fontSize: '0.725rem', color: 'var(--color-text-muted)', padding: '0.25rem 0.5rem', fontWeight: '700' }}>
                  INSTANT ROLE TESTING
                </div>
                <button
                  onClick={() => handleQuickSwitch('student')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    width: '100%',
                    padding: '0.5rem',
                    borderRadius: 'var(--radius-sm)',
                    textAlign: 'left',
                    fontSize: '0.85rem'
                  }}
                  onMouseEnter={(e) => e.target.style.backgroundColor = 'var(--color-surface-hover)'}
                  onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                >
                  <span className="badge badge-role student">Student</span> Adam Miller
                </button>
                <button
                  onClick={() => handleQuickSwitch('teacher')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    width: '100%',
                    padding: '0.5rem',
                    borderRadius: 'var(--radius-sm)',
                    textAlign: 'left',
                    fontSize: '0.85rem'
                  }}
                  onMouseEnter={(e) => e.target.style.backgroundColor = 'var(--color-surface-hover)'}
                  onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                >
                  <span className="badge badge-role teacher">Teacher</span> Dr. Jordan Reed
                </button>
                <button
                  onClick={() => handleQuickSwitch('admin')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    width: '100%',
                    padding: '0.5rem',
                    borderRadius: 'var(--radius-sm)',
                    textAlign: 'left',
                    fontSize: '0.85rem'
                  }}
                  onMouseEnter={(e) => e.target.style.backgroundColor = 'var(--color-surface-hover)'}
                  onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                >
                  <span className="badge badge-role admin">Admin</span> Administrator
                </button>
              </div>
            )}
          </div>

          {/* User Profile or Login */}
          {user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <img 
                  src={user.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${user.name}`} 
                  alt={user.name} 
                  style={{ width: '32px', height: '32px', borderRadius: 'var(--radius-full)', objectFit: 'cover' }}
                />
                <div style={{ display: 'none', flexDirection: 'column' }} className="user-name-box">
                  <span style={{ fontSize: '0.85rem', fontWeight: '600' }}>{user.name}</span>
                </div>
              </div>
              <button 
                onClick={logout} 
                className="btn btn-secondary btn-sm"
                title="Log out"
                style={{ padding: '0.4rem 0.6rem' }}
              >
                <LogOut size={16} />
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <button 
                onClick={() => openAuthModal('login')} 
                className="btn btn-secondary btn-sm"
              >
                Log In
              </button>
              <button 
                onClick={() => openAuthModal('register')} 
                className="btn btn-primary btn-sm"
              >
                Register
              </button>
            </div>
          )}

          {/* Mobile hamburger */}
          <button 
            className="mobile-toggle"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div style={{
          backgroundColor: 'var(--color-surface)',
          borderBottom: '1px solid var(--color-border)',
          padding: '1rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.75rem'
        }}>
          <button onClick={() => handleNav('landing')} style={{ textAlign: 'left', padding: '0.5rem', fontWeight: '600' }}>
            Home
          </button>
          <button onClick={() => handleNav('explore')} style={{ textAlign: 'left', padding: '0.5rem', fontWeight: '600' }}>
            Find Teachers
          </button>
          {user?.role === 'student' && (
            <button onClick={() => handleNav('student-dashboard')} style={{ textAlign: 'left', padding: '0.5rem', fontWeight: '600' }}>
              My Learning
            </button>
          )}
          {user?.role === 'teacher' && (
            <button onClick={() => handleNav('teacher-dashboard')} style={{ textAlign: 'left', padding: '0.5rem', fontWeight: '600' }}>
              Teacher Workspace
            </button>
          )}
          {user?.role === 'admin' && (
            <button onClick={() => handleNav('admin-dashboard')} style={{ textAlign: 'left', padding: '0.5rem', fontWeight: '600' }}>
              Admin Hub
            </button>
          )}
        </div>
      )}
    </header>
  );
}
