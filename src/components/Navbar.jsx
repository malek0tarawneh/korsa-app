import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { 
  GraduationCap, 
  BookOpen, 
  LayoutDashboard, 
  ShieldCheck, 
  LogOut, 
  User, 
  Zap,
  Menu,
  X,
  Globe
} from 'lucide-react';

export default function Navbar({ currentView, setCurrentView, openAuthModal }) {
  const { user, logout, quickLogin } = useAuth();
  const { lang, toggleLanguage, t, isRTL } = useLanguage();
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
              {t('appName', 'Korsa')}
            </span>
            <span style={{ fontSize: '0.65rem', display: 'block', color: 'var(--color-text-muted)', marginTop: '-4px', fontWeight: '600' }}>
              {t('platformTagline', 'DIRECT TEACHER PLATFORM')}
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
            {t('home', 'Home')}
          </button>
          
          <button 
            onClick={() => handleNav('explore')}
            style={{
              fontWeight: currentView === 'explore' ? '700' : '500',
              color: currentView === 'explore' ? 'var(--color-primary)' : 'var(--color-text-main)',
              fontSize: '0.925rem'
            }}
          >
            {t('findTeachers', 'Find Teachers')}
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
              <BookOpen size={16} /> {t('myLearning', 'My Learning')}
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
              <LayoutDashboard size={16} /> {t('teacherWorkspace', 'Teacher Workspace')}
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
              <ShieldCheck size={16} /> {t('adminHub', 'Admin Hub')}
            </button>
          )}
        </nav>

        {/* Right Action: Language Switch + Quick Demo Switcher + Auth Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          
          {/* Language Switch Button (EN | العربية) */}
          <button
            onClick={toggleLanguage}
            className="btn btn-secondary btn-sm"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              fontWeight: '700',
              padding: '0.35rem 0.65rem',
              borderColor: '#cbd5e1'
            }}
            title="Switch Language / تبديل اللغة"
          >
            <Globe size={14} color="var(--color-primary)" />
            <span style={{ fontSize: '0.8rem' }}>
              {lang === 'ar' ? 'English' : 'العربية'}
            </span>
          </button>

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
                {user ? `${t('switchRole', 'Role')}: ${user.role.toUpperCase()}` : t('switchRole', 'Quick Switch')}
              </span>
            </button>

            {demoDropdownOpen && (
              <div style={{
                position: 'absolute',
                [isRTL ? 'left' : 'right']: 0,
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
                    textAlign: isRTL ? 'right' : 'left',
                    fontSize: '0.85rem'
                  }}
                  onMouseEnter={(e) => e.target.style.backgroundColor = 'var(--color-surface-hover)'}
                  onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                >
                  <span className="badge badge-role student">{t('roleStudent', 'Student')}</span> Adam Miller
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
                    textAlign: isRTL ? 'right' : 'left',
                    fontSize: '0.85rem'
                  }}
                  onMouseEnter={(e) => e.target.style.backgroundColor = 'var(--color-surface-hover)'}
                  onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                >
                  <span className="badge badge-role teacher">{t('roleTeacher', 'Teacher')}</span> Dr. Reed
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
                    textAlign: isRTL ? 'right' : 'left',
                    fontSize: '0.85rem'
                  }}
                  onMouseEnter={(e) => e.target.style.backgroundColor = 'var(--color-surface-hover)'}
                  onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                >
                  <span className="badge badge-role admin">{t('roleAdmin', 'Admin')}</span> Sarah Jenkins
                </button>
              </div>
            )}
          </div>

          {/* User Profile / Auth State */}
          {user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div 
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}
                onClick={() => {
                  if (user.role === 'student') setCurrentView('student-dashboard');
                  if (user.role === 'teacher') setCurrentView('teacher-dashboard');
                  if (user.role === 'admin') setCurrentView('admin-dashboard');
                }}
              >
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
                title={t('logout', 'Log Out')}
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
                {t('login', 'Log In')}
              </button>
              <button 
                onClick={() => openAuthModal('register')} 
                className="btn btn-primary btn-sm"
              >
                {t('register', 'Register')}
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
          {/* Mobile Language switch */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '0.5rem', borderBottom: '1px solid var(--color-border)' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--color-text-muted)' }}>اللغة / Language:</span>
            <button
              onClick={toggleLanguage}
              className="btn btn-secondary btn-sm"
              style={{ fontWeight: '700' }}
            >
              <Globe size={14} /> {lang === 'ar' ? 'English' : 'العربية'}
            </button>
          </div>

          <button onClick={() => handleNav('landing')} style={{ textAlign: isRTL ? 'right' : 'left', padding: '0.5rem', fontWeight: '600' }}>
            {t('home', 'Home')}
          </button>
          <button onClick={() => handleNav('explore')} style={{ textAlign: isRTL ? 'right' : 'left', padding: '0.5rem', fontWeight: '600' }}>
            {t('findTeachers', 'Find Teachers')}
          </button>
          {user?.role === 'student' && (
            <button onClick={() => handleNav('student-dashboard')} style={{ textAlign: isRTL ? 'right' : 'left', padding: '0.5rem', fontWeight: '600' }}>
              {t('myLearning', 'My Learning')}
            </button>
          )}
          {user?.role === 'teacher' && (
            <button onClick={() => handleNav('teacher-dashboard')} style={{ textAlign: isRTL ? 'right' : 'left', padding: '0.5rem', fontWeight: '600' }}>
              {t('teacherWorkspace', 'Teacher Workspace')}
            </button>
          )}
          {user?.role === 'admin' && (
            <button onClick={() => handleNav('admin-dashboard')} style={{ textAlign: isRTL ? 'right' : 'left', padding: '0.5rem', fontWeight: '600' }}>
              {t('adminHub', 'Admin Hub')}
            </button>
          )}
        </div>
      )}
    </header>
  );
}
