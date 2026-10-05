import React, { useState, useEffect } from 'react';
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
  SlidersHorizontal 
} from 'lucide-react';

export default function LandingPage({ onSelectTeacher, onOpenAuth }) {
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSubject, setSelectedSubject] = useState('all');
  const [selectedGrade, setSelectedGrade] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Live debounced search & filter
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchTeachers();
    }, 200);
    return () => clearTimeout(timer);
  }, [searchQuery, selectedSubject, selectedGrade]);

  const fetchTeachers = async () => {
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
  };

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
            marginBottom: '1.25rem',
            boxShadow: 'var(--shadow-sm)'
          }}>
            <Sparkles size={14} color="var(--color-primary)" />
            Direct Teacher-to-Student Education Platform
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
            Subscribe directly to passionate educators for focused, curriculum-aligned lessons. Try free sample lessons first, then unlock complete courses with affordable monthly subscriptions.
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
              Start Learning <ArrowRight size={18} />
            </button>
            <button 
              onClick={() => onOpenAuth('register')}
              className="btn btn-secondary btn-lg"
            >
              Become a Teacher
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
                  cursor: 'pointer'
                }}
                onClick={() => onSelectTeacher(t.id)}
              >
                <div>
                  {/* Top Header: Avatar, Name, Rating */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                    <img 
                      src={t.avatar_url} 
                      alt={t.name}
                      style={{ width: '60px', height: '60px', borderRadius: 'var(--radius-full)', objectFit: 'cover' }}
                    />
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: 'var(--color-secondary)' }}>
                          {t.name}
                        </h3>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.2rem', fontSize: '0.85rem', fontWeight: '700', color: '#d97706' }}>
                          <Star size={14} fill="#d97706" /> {t.rating.toFixed(1)}
                        </div>
                      </div>
                      <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: '2px', fontWeight: '500' }}>
                        {t.headline}
                      </p>
                    </div>
                  </div>

                  {/* Subjects & Grade Badges */}
                  <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
                    {t.subjects.map((sub, i) => (
                      <span key={i} className="badge" style={{ backgroundColor: '#eff6ff', color: '#1e40af', border: '1px solid #bfdbfe' }}>
                        {sub}
                      </span>
                    ))}
                    {t.educational_levels.map((lvl, i) => (
                      <span key={i} className="badge" style={{ backgroundColor: '#f1f5f9', color: '#475569' }}>
                        {lvl}
                      </span>
                    ))}
                  </div>

                  {/* Bio excerpt */}
                  <p style={{
                    fontSize: '0.875rem',
                    color: 'var(--color-text-muted)',
                    lineHeight: 1.5,
                    marginBottom: '1.25rem',
                    display: '-webkit-box',
                    WebkitLineClamp: 3,
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
                  paddingTop: '1rem',
                  borderTop: '1px solid var(--color-border)'
                }}>
                  <div>
                    <span style={{ fontSize: '1.25rem', fontWeight: '800', color: 'var(--color-secondary)' }}>
                      ${t.monthly_price}
                    </span>
                    <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}> / month</span>
                    <div style={{ fontSize: '0.725rem', color: 'var(--color-accent)', fontWeight: '600', marginTop: '2px' }}>
                      Free sample lesson included
                    </div>
                  </div>

                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectTeacher(t.id);
                    }}
                    className="btn btn-primary btn-sm"
                  >
                    View Teacher <ArrowRight size={14} />
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
