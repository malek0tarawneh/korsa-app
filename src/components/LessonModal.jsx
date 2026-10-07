import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  X, 
  Lock, 
  Play, 
  CheckCircle, 
  FileText, 
  Download, 
  Clock, 
  Sparkles,
  ExternalLink
} from 'lucide-react';

export default function LessonModal({ isOpen, onClose, lesson, teacher, onSubscribeClick, onProgressUpdate }) {
  const { user, token } = useAuth();
  const [completed, setCompleted] = useState(lesson?.is_completed || false);
  const [updatingProgress, setUpdatingProgress] = useState(false);

  if (!isOpen || !lesson) return null;

  const handleToggleComplete = async () => {
    if (!user) return;
    setUpdatingProgress(true);

    try {
      const nextState = !completed;
      const res = await fetch('/api/progress/toggle', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          lesson_id: lesson.id,
          course_id: lesson.course_id,
          completed: nextState
        })
      });

      if (res.ok) {
        setCompleted(nextState);
        if (onProgressUpdate) onProgressUpdate();
      }
    } catch (err) {
      console.error('Failed to update lesson progress:', err);
    } finally {
      setUpdatingProgress(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="modal-content" 
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '780px', width: '95%' }}
      >
        {/* Modal Header */}
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <span className={`badge ${lesson.access_level === 'FREE' ? 'badge-free' : 'badge-subscriber'}`}>
              {lesson.access_level === 'FREE' ? 'FREE SAMPLE' : 'SUBSCRIBER ONLY'}
            </span>
            <span style={{ fontSize: '0.825rem', color: 'var(--color-text-muted)' }}>
              {lesson.duration_minutes} mins
            </span>
          </div>
          <button onClick={onClose} style={{ color: 'var(--color-text-muted)' }}>
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="modal-body" style={{ padding: '1.25rem 1.5rem' }}>
          
          {/* Locked State Screen */}
          {lesson.is_locked ? (
            <div style={{
              backgroundColor: '#fffbeb',
              border: '1px solid #fde68a',
              borderRadius: 'var(--radius-lg)',
              padding: '2.5rem 1.5rem',
              textAlign: 'center',
              marginBottom: '1.5rem'
            }}>
              <div style={{
                width: '64px',
                height: '64px',
                backgroundColor: '#fef3c7',
                borderRadius: 'var(--radius-full)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1.25rem auto',
                color: '#b45309'
              }}>
                <Lock size={32} />
              </div>
              <h3 style={{ fontSize: '1.3rem', fontWeight: '800', color: '#92400e', marginBottom: '0.5rem' }}>
                Subscriber-Only Lesson
              </h3>
              <p style={{ fontSize: '0.925rem', color: '#78350f', maxWidth: '440px', margin: '0 auto 1.5rem auto' }}>
                This in-depth lesson and its companion worksheets are exclusive to subscribers of <strong>{teacher?.name}</strong>.
              </p>
              <button
                onClick={() => {
                  onClose();
                  onSubscribeClick(teacher);
                }}
                className="btn btn-primary btn-lg"
              >
                <Sparkles size={18} /> Subscribe to Unlock (${teacher?.monthly_price}/mo)
              </button>
            </div>
          ) : (
            /* Unlocked Video Player */
            <div style={{ marginBottom: '1.5rem' }}>
              <div style={{
                position: 'relative',
                paddingBottom: '56.25%', /* 16:9 Aspect Ratio */
                height: 0,
                overflow: 'hidden',
                borderRadius: 'var(--radius-md)',
                backgroundColor: '#0f172a',
                boxShadow: 'var(--shadow-md)'
              }}>
                {lesson.video_url && lesson.video_url.includes('youtube') ? (
                  <iframe
                    src={lesson.video_url}
                    title={lesson.title}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: '100%',
                      border: 'none'
                    }}
                  />
                ) : (
                  <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#ffffff',
                    padding: '1.5rem',
                    textAlign: 'center'
                  }}>
                    <Play size={48} style={{ marginBottom: '0.75rem', opacity: 0.9 }} />
                    <p style={{ fontSize: '1rem', fontWeight: '600' }}>Educational Video Lesson Player</p>
                    <p style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '4px' }}>
                      URL: {lesson.video_url || 'Demonstration video source ready'}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Lesson Title & Info */}
          <div style={{ marginBottom: '1.5rem' }}>
            <h2 style={{ fontSize: '1.35rem', fontWeight: '800', lineHeight: 1.3, marginBottom: '0.5rem' }}>
              {lesson.title}
            </h2>
            <p style={{ fontSize: '0.925rem', color: 'var(--color-text-muted)', lineHeight: 1.6 }}>
              {lesson.description}
            </p>
          </div>

          {/* Completion Button & Progress */}
          {!lesson.is_locked && user && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '1rem',
              backgroundColor: '#f8fafc',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--color-border)',
              marginBottom: '1.5rem'
            }}>
              <div>
                <span style={{ fontSize: '0.875rem', fontWeight: '700' }}>Learning Progress</span>
                <p style={{ fontSize: '0.775rem', color: 'var(--color-text-muted)' }}>
                  {completed ? 'Marked as completed' : 'Track your progress through this course'}
                </p>
              </div>

              <button
                onClick={handleToggleComplete}
                disabled={updatingProgress}
                className={`btn btn-sm ${completed ? 'btn-accent' : 'btn-secondary'}`}
                style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
              >
                <CheckCircle size={16} />
                {completed ? 'Completed' : 'Mark as Completed'}
              </button>
            </div>
          )}

          {/* Downloadable Permitted Resources */}
          {lesson.resources && lesson.resources.length > 0 && !lesson.is_locked && (
            <div>
              <h4 style={{ fontSize: '0.95rem', fontWeight: '700', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <FileText size={16} color="var(--color-primary)" /> Downloadable Permitted Resources
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {(lesson.resources || []).map((res, i) => (
                  <div 
                    key={res.id || i}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.75rem 1rem',
                      border: '1px solid var(--color-border)',
                      borderRadius: 'var(--radius-md)',
                      backgroundColor: 'var(--color-surface)'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span className="badge badge-role" style={{ fontSize: '0.7rem' }}>{res.file_type || 'PDF'}</span>
                      <span style={{ fontSize: '0.875rem', fontWeight: '600' }}>{res.title}</span>
                    </div>
                    <a
                      href={res.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-secondary btn-sm"
                      style={{ fontSize: '0.8rem', padding: '0.3rem 0.6rem' }}
                    >
                      <Download size={14} /> Download
                    </a>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
