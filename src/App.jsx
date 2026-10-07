import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LanguageProvider } from './context/LanguageContext';
import Navbar from './components/Navbar';
import AuthModal from './components/AuthModal';
import SubscribeModal from './components/SubscribeModal';
import LessonModal from './components/LessonModal';
import LandingPage from './pages/LandingPage';
import TeacherProfilePage from './pages/TeacherProfilePage';
import CreatorProfilePage from './pages/CreatorProfilePage';
import StudentDashboard from './pages/StudentDashboard';
import TeacherDashboard from './pages/TeacherDashboard';
import AdminDashboard from './pages/AdminDashboard';
import { GraduationCap } from 'lucide-react';

function AppContent() {
  const { user } = useAuth();
  
  // Navigation states
  const [currentView, setCurrentView] = useState('landing');
  const [selectedTeacherId, setSelectedTeacherId] = useState(null);
  const [creatorHandle, setCreatorHandle] = useState(null);

  // Modals state
  const [authModal, setAuthModal] = useState({ isOpen: false, mode: 'login' });
  const [subscribeModal, setSubscribeModal] = useState({ isOpen: false, teacher: null });
  const [lessonModal, setLessonModal] = useState({ isOpen: false, lesson: null, teacher: null });

  // Listen to browser path for /@handle
  useEffect(() => {
    const handleUrlRoute = () => {
      const path = window.location.pathname;
      if (path.startsWith('/@') && path.length > 2) {
        const h = decodeURIComponent(path.slice(2)).trim();
        if (h) {
          setCreatorHandle(h);
          setCurrentView('creator-profile');
          return;
        }
      }

      // Check ?ref= in search params
      const searchParams = new URLSearchParams(window.location.search);
      const refCode = searchParams.get('ref');
      if (refCode) {
        localStorage.setItem('korsa_pending_ref', refCode);
      }
    };

    handleUrlRoute();
    window.addEventListener('popstate', handleUrlRoute);
    return () => window.removeEventListener('popstate', handleUrlRoute);
  }, []);

  // Open teacher profile (legacy/course drilldown)
  const handleSelectTeacher = (id) => {
    if (!id) {
      setCurrentView('landing');
      window.history.pushState(null, '', '/');
      return;
    }
    setSelectedTeacherId(id);
    setCurrentView('teacher-profile');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Open creator vanity profile /@handle
  const handleSelectCreator = (handleOrTeacher) => {
    const h = typeof handleOrTeacher === 'string' ? handleOrTeacher : handleOrTeacher.handle || handleOrTeacher.id;
    setCreatorHandle(h);
    setCurrentView('creator-profile');
    window.history.pushState(null, '', `/@${h}`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Open subscribe modal
  const handleOpenSubscribe = (teacher) => {
    setSubscribeModal({ isOpen: true, teacher });
  };

  // Open lesson modal
  const handleOpenLesson = (lesson, teacher) => {
    setLessonModal({ isOpen: true, lesson, teacher });
  };

  // Open auth modal
  const handleOpenAuth = (mode = 'login') => {
    setAuthModal({ isOpen: true, mode });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      
      {/* Top Navbar */}
      <Navbar 
        currentView={currentView}
        setCurrentView={(view) => {
          setCurrentView(view);
          if (view === 'landing' || view === 'explore') {
            window.history.pushState(null, '', '/');
          }
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        openAuthModal={handleOpenAuth}
      />

      {/* Main Content Area */}
      <main style={{ flex: 1 }}>
        {(currentView === 'landing' || currentView === 'explore') && (
          <LandingPage 
            onSelectTeacher={handleSelectTeacher}
            onSelectCreator={handleSelectCreator}
            onOpenAuth={handleOpenAuth}
          />
        )}

        {currentView === 'creator-profile' && creatorHandle && (
          <CreatorProfilePage 
            handle={creatorHandle}
            onBack={() => {
              setCurrentView('landing');
              window.history.pushState(null, '', '/');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onOpenSubscribe={handleOpenSubscribe}
            onOpenLesson={handleOpenLesson}
            onOpenAuth={handleOpenAuth}
          />
        )}

        {currentView === 'teacher-profile' && selectedTeacherId && (
          <TeacherProfilePage 
            teacherId={selectedTeacherId}
            onBack={() => {
              setCurrentView('landing');
              window.history.pushState(null, '', '/');
            }}
            onOpenSubscribe={handleOpenSubscribe}
            onOpenLesson={handleOpenLesson}
            onOpenAuth={handleOpenAuth}
          />
        )}

        {currentView === 'student-dashboard' && (
          <StudentDashboard 
            onSelectTeacher={handleSelectTeacher}
            onSelectCreator={handleSelectCreator}
            onOpenLesson={handleOpenLesson}
          />
        )}

        {currentView === 'teacher-dashboard' && (
          <TeacherDashboard 
            onSelectTeacher={handleSelectTeacher}
            onSelectCreator={handleSelectCreator}
          />
        )}

        {currentView === 'admin-dashboard' && (
          <AdminDashboard />
        )}
      </main>

      {/* Footer */}
      <footer style={{
        backgroundColor: '#0f172a',
        color: '#94a3b8',
        padding: '3rem 0 2rem 0',
        borderTop: '1px solid #1e293b'
      }}>
        <div className="container">
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            flexWrap: 'wrap',
            gap: '2rem',
            marginBottom: '2.5rem'
          }}>
            <div style={{ maxWidth: '360px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: '#ffffff', marginBottom: '0.75rem' }}>
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: 'var(--color-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff'
                }}>
                  <GraduationCap size={18} />
                </div>
                <span style={{ fontSize: '1.2rem', fontWeight: '800', letterSpacing: '-0.02em' }}>Korsa</span>
              </div>
              <p style={{ fontSize: '0.85rem', lineHeight: 1.6 }}>
                Direct teacher-to-student subscription platform. Teachers publish focused curricula, students subscribe directly, and learning happens without distraction.
              </p>
            </div>

            <div style={{ display: 'flex', gap: '3rem', flexWrap: 'wrap', fontSize: '0.85rem' }}>
              <div>
                <h4 style={{ color: '#ffffff', fontWeight: '700', marginBottom: '0.75rem' }}>Navigation</h4>
                <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <li><button onClick={() => setCurrentView('landing')} style={{ color: '#94a3b8' }}>Home</button></li>
                  <li><button onClick={() => setCurrentView('explore')} style={{ color: '#94a3b8' }}>Find Teachers</button></li>
                </ul>
              </div>

              <div>
                <h4 style={{ color: '#ffffff', fontWeight: '700', marginBottom: '0.75rem' }}>MVP Testing Roles</h4>
                <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <li><button onClick={() => handleOpenAuth('login')} style={{ color: '#94a3b8' }}>Student Access</button></li>
                  <li><button onClick={() => handleOpenAuth('login')} style={{ color: '#94a3b8' }}>Teacher Workspace</button></li>
                  <li><button onClick={() => handleOpenAuth('login')} style={{ color: '#94a3b8' }}>Admin Hub</button></li>
                </ul>
              </div>

              <div>
                <h4 style={{ color: '#ffffff', fontWeight: '700', marginBottom: '0.75rem' }}>Architecture</h4>
                <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <li>100% Free Stack</li>
                  <li>PostgreSQL & SQLite Dual Engine</li>
                  <li>JWT + Role-Based Access</li>
                  <li>Direct CLIQ & Wallet Payouts</li>
                </ul>
              </div>
            </div>
          </div>

          <div style={{
            borderTop: '1px solid #1e293b',
            paddingTop: '1.5rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '1rem',
            fontSize: '0.775rem'
          }}>
            <div>
              © 2026 Korsa Inc. All rights reserved. Built with Antigravity IDE.
            </div>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <span>Phase 1 MVP</span>
              <span>·</span>
              <span>100% Free Open-Source Stack</span>
            </div>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <AuthModal 
        isOpen={authModal.isOpen} 
        initialMode={authModal.mode}
        onClose={() => setAuthModal({ isOpen: false, mode: 'login' })}
      />

      <SubscribeModal 
        isOpen={subscribeModal.isOpen}
        teacher={subscribeModal.teacher}
        onClose={() => setSubscribeModal({ isOpen: false, teacher: null })}
        onSuccess={() => {
          // If on teacher profile, reload
          if (currentView === 'teacher-profile') {
            setSelectedTeacherId((prev) => prev);
          }
        }}
      />

      <LessonModal 
        isOpen={lessonModal.isOpen}
        lesson={lessonModal.lesson}
        teacher={lessonModal.teacher}
        onClose={() => setLessonModal({ isOpen: false, lesson: null, teacher: null })}
        onSubscribeClick={(t) => handleOpenSubscribe(t)}
        onProgressUpdate={() => {}}
      />

    </div>
  );
}

export default function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </LanguageProvider>
  );
}
