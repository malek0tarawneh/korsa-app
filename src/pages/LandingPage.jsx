import React, { useState, useEffect, useCallback } from 'react';
import { 
  Search, 
  Sparkles, 
  GraduationCap, 
  BookOpen, 
  ShieldCheck, 
  Star, 
  Users, 
  ArrowRight, 
  CheckCircle2, 
  SlidersHorizontal,
  Gift,
  Zap,
  Play,
  FileText
} from 'lucide-react';

export default function LandingPage({ onSelectTeacher, onSelectCreator, onOpenAuth }) {
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSubject, setSelectedSubject] = useState('all');
  const [selectedGrade, setSelectedGrade] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchTeachers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedSubject !== 'all') params.append('subject', selectedSubject);
      if (selectedGrade !== 'all') params.append('grade', selectedGrade);
      if (searchQuery.trim()) params.append('search', searchQuery.trim());

      const res = await fetch(`/api/teachers?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setTeachers(data);
      }
    } catch (err) {
      console.error('Failed to load teachers:', err);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, selectedSubject, selectedGrade]);

  // Live debounced search & filter
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchTeachers();
    }, 200);
    return () => clearTimeout(timer);
  }, [fetchTeachers]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchTeachers();
  };

  const subjectsList = [
    { label: 'All Subjects', value: 'all' },
    { label: 'Mathematics', value: 'Mathematics' },
    { label: 'Physics', value: 'Physics' },
    { label: 'Chemistry', value: 'Chemistry' },
    { label: 'English', value: 'English' },
    { label: 'Computer Science', value: 'Computer Science' }
  ];

  const gradesList = [
    { label: 'All Levels', value: 'all' },
    { label: 'Grade 10', value: 'Grade 10' },
    { label: 'Grade 11', value: 'Grade 11' },
    { label: 'Grade 12 (Tawjihi)', value: 'Grade 12' },
    { label: 'University', value: 'University' }
  ];

  return (
    <div>
      {/* Hero Section */}
      <section style={{
        background: 'linear-gradient(180deg, #eff6ff 0%, #ffffff 100%)',
        padding: '4.5rem 0 3.5rem 0',
        borderBottom: '1px solid var(--color-border)'
      }}>
        <div className="container" style={{ textAlign: 'center', maxWidth: '860px' }}>
          
          <div style={{ display: 'flex', justifyContent: 'center', gap: '0.6rem', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0.35rem 0.85rem',
              backgroundColor: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-full)',
              fontSize: '0.825rem',
              fontWeight: '600',
              color: 'var(--color-primary-dark)',
              boxShadow: 'var(--shadow-sm)'
            }}>
              <Sparkles size={14} color="var(--color-primary)" />
              Direct Teacher-to-Student Creator Flywheel
            </div>

            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0.35rem 0.85rem',
              backgroundColor: '#ecfdf5',
              border: '1px solid #a7f3d0',
              borderRadius: 'var(--radius-full)',
              fontSize: '0.825rem',
              fontWeight: '700',
              color: '#065f46',
              boxShadow: 'var(--shadow-sm)'
            }}>
              <Gift size={14} color="#059669" />
              Permanent Free Explorer Mode · Free Cheat Sheets & Previews
            </div>
          </div>

          <h1 style={{
            fontSize: 'clamp(2.2rem, 5vw, 3.4rem)',
            fontWeight: '800',
            lineHeight: 1.15,
            letterSpacing: '-0.03em',
            color: 'var(--color-secondary)',
            marginBottom: '1.25rem'
          }}>
            Learn from teachers <span style={{ color: 'var(--color-primary)' }}>you choose.</span>
          </h1>

          <p style={{
            fontSize: '1.15rem',
            color: 'var(--color-text-muted)',
            lineHeight: 1.6,
            marginBottom: '2rem',
            maxWidth: '680px',
            margin: '0 auto 2rem auto'
          }}>
            Explore independent creators and passionate tutors. Download free exam roadmaps, watch previewable lessons with zero paywall, or book 1-on-1 micro-tutoring.
          </p>

          {/* Action CTAs */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <button 
              onClick={() => {
                const el = document.getElementById('browse-teachers');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
              className="btn btn-primary btn-lg"
            >
              Explore Free Resources <ArrowRight size={18} />
            </button>
            <button 
              onClick={() => onOpenAuth('register')}
              className="btn btn-secondary btn-lg"
            >
              Free 1-Click Student Signup
            </button>
          </div>

          {/* Key Value Badges */}
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '2rem',
            marginTop: '3rem',
            flexWrap: 'wrap',
            fontSize: '0.875rem',
            color: 'var(--color-text-muted)',
            fontWeight: '500'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <CheckCircle2 size={16} color="var(--color-accent)" /> 100% Free Sample Lessons
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <CheckCircle2 size={16} color="var(--color-accent)" /> Direct Teacher Subscriptions
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <CheckCircle2 size={16} color="var(--color-accent)" /> Cancel Anytime ($0 Simulated)
            </div>
          </div>

        </div>
      </section>

      {/* Discovery & Teacher Catalog */}
      <section id="browse-teachers" className="container" style={{ padding: '3.5rem 1.25rem' }}>
        
        {/* Section Heading & Search */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-end',
          flexWrap: 'wrap',
          gap: '1.5rem',
          marginBottom: '2rem'
        }}>
          <div>
            <h2 style={{ fontSize: '1.75rem', fontWeight: '800', letterSpacing: '-0.02em', color: 'var(--color-secondary)' }}>
              Explore Specialized Teachers
            </h2>
            <p style={{ fontSize: '0.95rem', color: 'var(--color-text-muted)', marginTop: '4px' }}>
              Find the right educator for your subjects, grade level, and learning pace.
            </p>
          </div>

          {/* Search Bar */}
          <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '0.5rem', flex: '1 1 280px', maxWidth: '420px', width: '100%' }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-light)' }} />
              <input 
                type="text"
                placeholder="Search teacher name or topic (live)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="form-input"
                style={{ paddingLeft: '2.4rem', paddingRight: searchQuery ? '2.2rem' : '0.9rem' }}
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  style={{
                    position: 'absolute',
                    right: '10px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--color-text-muted)',
                    padding: '2px 6px',
                    borderRadius: 'var(--radius-full)',
                    fontSize: '0.85rem'
                  }}
                  title="Clear search"
                >
                  ✕
                </button>
              )}
            </div>
            <button type="submit" className="btn btn-secondary">
              Search
            </button>
          </form>
        </div>

        {/* Filter Pills (Subject & Grade) */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem',
          backgroundColor: 'var(--color-surface)',
          padding: '1.25rem',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--color-border)',
          marginBottom: '1.75rem'
        }}>
          {/* Subjects */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.825rem', fontWeight: '700', color: 'var(--color-text-muted)', minWidth: '70px' }}>
              Subject:
            </span>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {subjectsList.map((s) => (
                <button
                  key={s.value}
                  onClick={() => setSelectedSubject(s.value)}
                  className={`btn btn-sm ${selectedSubject === s.value ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ borderRadius: 'var(--radius-full)' }}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Grades */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.825rem', fontWeight: '700', color: 'var(--color-text-muted)', minWidth: '70px' }}>
              Level:
            </span>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {gradesList.map((g) => (
                <button
                  key={g.value}
                  onClick={() => setSelectedGrade(g.value)}
                  className={`btn btn-sm ${selectedGrade === g.value ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ borderRadius: 'var(--radius-full)' }}
                >
                  {g.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Dynamic Filter Results Summary */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1.5rem',
          fontSize: '0.9rem',
          color: 'var(--color-text-muted)',
          flexWrap: 'wrap',
          gap: '0.5rem'
        }}>
          <div>
            Showing <strong>{teachers.length}</strong> {teachers.length === 1 ? 'educator' : 'educators'}
            {selectedSubject !== 'all' && <span> in <strong>{selectedSubject}</strong></span>}
            {selectedGrade !== 'all' && <span> for <strong>{selectedGrade}</strong></span>}
            {searchQuery.trim() && <span> matching "<strong>{searchQuery.trim()}</strong>"</span>}
          </div>

          {(selectedSubject !== 'all' || selectedGrade !== 'all' || searchQuery.trim()) && (
            <button
              onClick={() => { setSelectedSubject('all'); setSelectedGrade('all'); setSearchQuery(''); }}
              style={{ color: 'var(--color-primary)', fontWeight: '600', fontSize: '0.85rem' }}
            >
              Reset All Filters ✕
            </button>
          )}
        </div>

        {/* Teacher Cards Grid */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-text-muted)' }}>
            Loading teachers...
          </div>
        ) : teachers.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '3.5rem 1rem',
            backgroundColor: 'var(--color-surface)',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--color-border)'
          }}>
            <p style={{ fontSize: '1.1rem', fontWeight: '600' }}>No teachers match your search filters.</p>
            <p style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)', marginTop: '4px' }}>
              Try clearing your search query or selecting "All Subjects".
            </p>
            <button 
              onClick={() => { setSelectedSubject('all'); setSelectedGrade('all'); setSearchQuery(''); }}
              className="btn btn-secondary btn-sm"
              style={{ marginTop: '1rem' }}
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid-teachers">
            {teachers.map((t) => (
              <div 
                key={t.id} 
                className="card"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  cursor: 'pointer',
                  transition: 'transform 0.15s ease, box-shadow 0.15s ease'
                }}
                onClick={() => {
                  if (onSelectCreator && t.handle) {
                    onSelectCreator(t.handle);
                  } else {
                    onSelectTeacher(t.id);
                  }
                }}
              >
                <div>
                  {/* Top Header: Avatar, Name, Rating & Vanity Handle */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', marginBottom: '0.85rem' }}>
                    <img 
                      src={t.avatar_url} 
                      alt={t.name}
                      style={{ 
                        width: '56px', 
                        height: '56px', 
                        borderRadius: 'var(--radius-full)', 
                        objectFit: 'cover',
                        border: t.tier === 'expert_creator' ? '2px solid #6366f1' : '2px solid #10b981'
                      }}
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <h3 style={{ fontSize: '1.05rem', fontWeight: '800', color: 'var(--color-secondary)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {t.name}
                        </h3>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.2rem', fontSize: '0.85rem', fontWeight: '700', color: '#d97706' }}>
                          <Star size={14} fill="#d97706" /> {t.rating.toFixed(1)}
                        </div>
                      </div>

                      {/* Vanity Handle & Tier Pill */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '2px', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--color-primary)' }}>
                          @{t.handle || `teacher${t.id}`}
                        </span>
                        <span style={{
                          fontSize: '0.675rem',
                          fontWeight: '700',
                          padding: '0.1rem 0.45rem',
                          borderRadius: 'var(--radius-full)',
                          backgroundColor: t.tier === 'expert_creator' ? '#e0e7ff' : '#ecfdf5',
                          color: t.tier === 'expert_creator' ? '#4338ca' : '#047857'
                        }}>
                          {t.tier === 'expert_creator' ? '🌟 Expert Creator' : '🌱 Community Tutor'}
                        </span>
                      </div>

                      <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: '2px', fontWeight: '500', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {t.headline}
                      </p>
                    </div>
                  </div>

                  {/* Creator Flywheel Badges (Free Samples, Lead Magnets, Services) */}
                  <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap', marginBottom: '0.85rem' }}>
                    {t.lead_magnet_count > 0 && (
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.25rem',
                        fontSize: '0.725rem',
                        fontWeight: '700',
                        backgroundColor: '#dcfce7',
                        color: '#15803d',
                        padding: '0.15rem 0.5rem',
                        borderRadius: 'var(--radius-full)'
                      }}>
                        <Gift size={12} /> {t.lead_magnet_count} Free Study Guide{t.lead_magnet_count > 1 ? 's' : ''}
                      </span>
                    )}

                    {t.free_sample_count > 0 && (
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.25rem',
                        fontSize: '0.725rem',
                        fontWeight: '700',
                        backgroundColor: '#e0f2fe',
                        color: '#0369a1',
                        padding: '0.15rem 0.5rem',
                        borderRadius: 'var(--radius-full)'
                      }}>
                        <Play size={12} /> {t.free_sample_count} Free Sample Lesson{t.free_sample_count > 1 ? 's' : ''}
                      </span>
                    )}

                    {t.service_count > 0 && (
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.25rem',
                        fontSize: '0.725rem',
                        fontWeight: '700',
                        backgroundColor: '#fef3c7',
                        color: '#b45309',
                        padding: '0.15rem 0.5rem',
                        borderRadius: 'var(--radius-full)'
                      }}>
                        <Zap size={12} /> Micro-Tutoring
                      </span>
                    )}
                  </div>

                  {/* Subjects & Grade Badges */}
                  <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap', marginBottom: '0.85rem' }}>
                    {t.subjects.map((sub, i) => (
                      <span key={i} className="badge" style={{ backgroundColor: '#eff6ff', color: '#1e40af', border: '1px solid #bfdbfe', fontSize: '0.725rem' }}>
                        {sub}
                      </span>
                    ))}
                    {t.educational_levels.map((lvl, i) => (
                      <span key={i} className="badge" style={{ backgroundColor: '#f1f5f9', color: '#475569', fontSize: '0.725rem' }}>
                        {lvl}
                      </span>
                    ))}
                  </div>

                  {/* Bio excerpt */}
                  <p style={{
                    fontSize: '0.85rem',
                    color: 'var(--color-text-muted)',
                    lineHeight: 1.5,
                    marginBottom: '1rem',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden'
                  }}>
                    {t.bio}
                  </p>
                </div>

                {/* Footer: Price & CTA */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingTop: '0.85rem',
                  borderTop: '1px solid var(--color-border)'
                }}>
                  <div>
                    <span style={{ fontSize: '1.2rem', fontWeight: '800', color: 'var(--color-secondary)' }}>
                      ${t.monthly_price}
                    </span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}> / mo</span>
                    <div style={{ fontSize: '0.7rem', color: '#16a34a', fontWeight: '700', marginTop: '1px' }}>
                      Free Preview Included
                    </div>
                  </div>

                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      if (onSelectCreator && t.handle) {
                        onSelectCreator(t.handle);
                      } else {
                        onSelectTeacher(t.id);
                      }
                    }}
                    className="btn btn-primary btn-sm"
                    style={{ fontSize: '0.8rem', padding: '0.4rem 0.75rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                  >
                    View Hub <ArrowRight size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

      </section>

      {/* Two Sides Value Proposition: Students vs Teachers */}
      <section style={{ backgroundColor: '#ffffff', padding: '4rem 0', borderTop: '1px solid var(--color-border)' }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <h2 style={{ fontSize: '1.85rem', fontWeight: '800', letterSpacing: '-0.02em', color: 'var(--color-secondary)' }}>
              Built Exclusively for Education
            </h2>
            <p style={{ fontSize: '1rem', color: 'var(--color-text-muted)', marginTop: '4px' }}>
              Removing distraction and middlemen. Connecting students directly to great teachers.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem' }}>
            {/* For Students */}
            <div style={{
              padding: '2rem',
              borderRadius: 'var(--radius-lg)',
              backgroundColor: '#f8fafc',
              border: '1px solid var(--color-border)'
            }}>
              <div style={{
                width: '44px',
                height: '44px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: '#eff6ff',
                color: 'var(--color-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '1.25rem'
              }}>
                <GraduationCap size={24} />
              </div>
              <h3 style={{ fontSize: '1.3rem', fontWeight: '700', marginBottom: '0.75rem' }}>For Students</h3>
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.925rem', color: 'var(--color-text-muted)' }}>
                <li style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
                  <CheckCircle2 size={18} color="var(--color-accent)" style={{ flexShrink: 0, marginTop: '2px' }} />
                  <span><strong>Choose your teacher:</strong> Compare teaching styles and sample lessons freely.</span>
                </li>
                <li style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
                  <CheckCircle2 size={18} color="var(--color-accent)" style={{ flexShrink: 0, marginTop: '2px' }} />
                  <span><strong>Affordable micro-subscriptions:</strong> Pay small monthly fees only to the teachers you need.</span>
                </li>
                <li style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
                  <CheckCircle2 size={18} color="var(--color-accent)" style={{ flexShrink: 0, marginTop: '2px' }} />
                  <span><strong>Learn at your pace:</strong> Replay lessons, download notes, and track your progress.</span>
                </li>
              </ul>
            </div>

            {/* For Teachers */}
            <div style={{
              padding: '2rem',
              borderRadius: 'var(--radius-lg)',
              backgroundColor: '#f8fafc',
              border: '1px solid var(--color-border)'
            }}>
              <div style={{
                width: '44px',
                height: '44px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: '#fef3c7',
                color: '#b45309',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '1.25rem'
              }}>
                <BookOpen size={24} />
              </div>
              <h3 style={{ fontSize: '1.3rem', fontWeight: '700', marginBottom: '0.75rem' }}>For Teachers</h3>
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.925rem', color: 'var(--color-text-muted)' }}>
                <li style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
                  <CheckCircle2 size={18} color="var(--color-accent)" style={{ flexShrink: 0, marginTop: '2px' }} />
                  <span><strong>Focus on teaching:</strong> Korsa manages access control, student accounts, and subscriptions.</span>
                </li>
                <li style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
                  <CheckCircle2 size={18} color="var(--color-accent)" style={{ flexShrink: 0, marginTop: '2px' }} />
                  <span><strong>Predictable recurring revenue:</strong> Direct monthly subscriptions from students who value your expertise.</span>
                </li>
                <li style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
                  <CheckCircle2 size={18} color="var(--color-accent)" style={{ flexShrink: 0, marginTop: '2px' }} />
                  <span><strong>Professional platform:</strong> Clean, dignified educational environment without noisy social media distractions.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}
