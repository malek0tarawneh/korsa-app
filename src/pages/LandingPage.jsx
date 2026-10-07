import React, { useState, useEffect, useCallback } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { 
  Search, 
  BookOpen, 
  Star, 
  ArrowRight, 
  CheckCircle2, 
  Gift, 
  Sparkles,
  Zap,
  Download,
  Calendar,
  ShieldCheck
} from 'lucide-react';

export default function LandingPage({ onSelectTeacher, onSelectCreator, onOpenAuth }) {
  const { t, isRTL } = useLanguage();
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
    { label: t('allSubjects', 'All Subjects'), value: 'all' },
    { label: t('tawjihi', 'Tawjihi (توجيهي)'), value: 'Tawjihi' },
    { label: t('mathematics', 'Mathematics'), value: 'Mathematics' },
    { label: t('physics', 'Physics'), value: 'Physics' },
    { label: t('english', 'English'), value: 'English' },
    { label: t('chemistry', 'Chemistry'), value: 'Chemistry' },
    { label: t('computerScience', 'Computer Science'), value: 'Computer Science' }
  ];

  const gradesList = [
    { label: t('allLevels', 'All Levels'), value: 'all' },
    { label: t('grade12', 'Grade 12 (Tawjihi)'), value: 'Grade 12' },
    { label: t('grade11', 'Grade 11'), value: 'Grade 11' },
    { label: t('grade10', 'Grade 10'), value: 'Grade 10' },
    { label: t('university', 'University'), value: 'University' }
  ];

  return (
    <div style={{ backgroundColor: '#ffffff', minHeight: '100vh' }}>
      
      {/* Hero Section - Early Facebook / Substack Cleanliness */}
      <section style={{
        backgroundColor: '#f8fafc',
        borderBottom: '1px solid #e2e8f0',
        padding: '3.5rem 1rem 3rem 1rem',
        textAlign: 'center'
      }}>
        <div className="container" style={{ maxWidth: '820px', margin: '0 auto' }}>
          
          {/* Subtle Clean Badges */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
              padding: '0.3rem 0.75rem',
              backgroundColor: '#eff6ff',
              border: '1px solid #bfdbfe',
              borderRadius: '9999px',
              fontSize: '0.8rem',
              fontWeight: '700',
              color: '#1d4ed8'
            }}>
              <Sparkles size={14} color="#2563eb" />
              {t('heroBadge1', '100% Free Platform · 0% Fees')}
            </span>

            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
              padding: '0.3rem 0.75rem',
              backgroundColor: '#ecfdf5',
              border: '1px solid #a7f3d0',
              borderRadius: '9999px',
              fontSize: '0.8rem',
              fontWeight: '700',
              color: '#065f46'
            }}>
              <CheckCircle2 size={14} color="#059669" />
              {t('heroBadge2', 'Local CLIQ & Zain Cash Payments (JOD)')}
            </span>
          </div>

          <h1 style={{
            fontSize: 'clamp(2rem, 4.5vw, 3rem)',
            fontWeight: '800',
            lineHeight: 1.2,
            letterSpacing: '-0.025em',
            color: '#0f172a',
            marginBottom: '1rem',
            fontFamily: 'system-ui, -apple-system, sans-serif'
          }}>
            {t('heroTitle', 'Learn directly from independent teachers in Jordan.')}
          </h1>

          <p style={{
            fontSize: '1.1rem',
            color: '#475569',
            lineHeight: 1.6,
            maxWidth: '640px',
            margin: '0 auto 1.75rem auto'
          }}>
            {t('heroSubtitle', 'Download free Tawjihi study guides, watch open lessons, and book 1-on-1 sessions directly via CLIQ or Zain Cash with zero middleman fees.')}
          </p>

          {/* Clean Action Buttons */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '2rem' }}>
            <button 
              onClick={() => {
                const el = document.getElementById('browse-teachers');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
              className="btn btn-primary btn-md"
              style={{ fontWeight: '700', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
            >
              {t('browseTeachersBtn', 'Browse Teachers & Guides')} <ArrowRight size={16} />
            </button>
            <button 
              onClick={() => onOpenAuth('register')}
              className="btn btn-secondary btn-md"
              style={{ fontWeight: '600' }}
            >
              {t('freeSignupBtn', 'Free Student Sign Up')}
            </button>
          </div>

          {/* Trust Guarantees */}
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '1.5rem',
            fontSize: '0.85rem',
            color: '#64748b',
            flexWrap: 'wrap'
          }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <CheckCircle2 size={15} color="#10b981" /> {t('freePdfsGuarantee', 'Free Downloadable PDFs')}
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <CheckCircle2 size={15} color="#10b981" /> {t('jodGuarantee', '1-on-1 Help in Jordanian Dinars (JOD)')}
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <CheckCircle2 size={15} color="#10b981" /> {t('directConfirmGuarantee', 'Direct Teacher Confirmation')}
            </span>
          </div>

        </div>
      </section>

      {/* Discovery & Teachers Directory */}
      <section id="browse-teachers" className="container" style={{ padding: '3rem 1rem' }}>
        
        {/* Search & Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1.25rem',
          marginBottom: '1.5rem'
        }}>
          <div>
            <h2 style={{ fontSize: '1.6rem', fontWeight: '800', color: '#0f172a', letterSpacing: '-0.02em', margin: 0 }}>
              {isRTL ? 'تصفح المعلمين والدوسيات المجانية' : 'Find Teachers & Study Guides'}
            </h2>
            <p style={{ fontSize: '0.9rem', color: '#64748b', margin: '4px 0 0 0' }}>
              {isRTL ? 'ابحث باسم المعلم، المادة، أو الفرع والتوجيهي.' : 'Search by teacher name, subject, or Tawjihi level.'}
            </p>
          </div>

          {/* Minimalist Search Bar */}
          <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '0.5rem', width: '100%', maxWidth: '380px' }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <Search size={17} style={{ position: 'absolute', [isRTL ? 'right' : 'left']: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
              <input 
                type="text"
                placeholder={t('searchPlaceholder', 'Search teacher or topic...')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="form-input"
                style={{
                  paddingLeft: isRTL ? '0.9rem' : '2.4rem',
                  paddingRight: isRTL ? '2.4rem' : (searchQuery ? '2rem' : '0.9rem'),
                  borderRadius: 'var(--radius-md)',
                  borderColor: '#cbd5e1',
                  backgroundColor: '#ffffff'
                }}
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  style={{
                    position: 'absolute',
                    [isRTL ? 'left' : 'right']: '10px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: '#94a3b8',
                    cursor: 'pointer',
                    fontSize: '0.85rem'
                  }}
                >
                  ✕
                </button>
              )}
            </div>
            <button type="submit" className="btn btn-secondary" style={{ fontWeight: '600' }}>
              {t('searchBtn', 'Search')}
            </button>
          </form>
        </div>

        {/* Clean Subject Filters */}
        <div style={{
          backgroundColor: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: 'var(--radius-md)',
          padding: '1rem',
          marginBottom: '1.75rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.75rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: '700', color: '#475569', minWidth: '60px' }}>
              {t('subjectLabel', 'Subject:')}
            </span>
            <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
              {subjectsList.map((s) => (
                <button
                  key={s.value}
                  onClick={() => setSelectedSubject(s.value)}
                  style={{
                    padding: '0.3rem 0.75rem',
                    borderRadius: '9999px',
                    fontSize: '0.825rem',
                    fontWeight: selectedSubject === s.value ? '700' : '500',
                    backgroundColor: selectedSubject === s.value ? 'var(--color-primary)' : '#f1f5f9',
                    color: selectedSubject === s.value ? '#ffffff' : '#334155',
                    border: 'none',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: '700', color: '#475569', minWidth: '60px' }}>
              {t('levelLabel', 'Level:')}
            </span>
            <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
              {gradesList.map((g) => (
                <button
                  key={g.value}
                  onClick={() => setSelectedGrade(g.value)}
                  style={{
                    padding: '0.3rem 0.75rem',
                    borderRadius: '9999px',
                    fontSize: '0.825rem',
                    fontWeight: selectedGrade === g.value ? '700' : '500',
                    backgroundColor: selectedGrade === g.value ? '#0f172a' : '#f1f5f9',
                    color: selectedGrade === g.value ? '#ffffff' : '#334155',
                    border: 'none',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  {g.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Filter Results Summary */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1.25rem',
          fontSize: '0.875rem',
          color: '#64748b'
        }}>
          <div>
            {t('showingTeachers', 'Showing')} <strong>{teachers.length}</strong> {teachers.length === 1 ? (isRTL ? 'معلم' : 'teacher') : (isRTL ? 'معلمين' : 'teachers')}
            {selectedSubject !== 'all' && <span> {isRTL ? 'في' : 'in'} <strong>{selectedSubject}</strong></span>}
            {selectedGrade !== 'all' && <span> {isRTL ? 'لصف' : 'for'} <strong>{selectedGrade}</strong></span>}
            {searchQuery.trim() && <span> {isRTL ? 'مطابق لـ' : 'matching'} "<strong>{searchQuery.trim()}</strong>"</span>}
          </div>

          {(selectedSubject !== 'all' || selectedGrade !== 'all' || searchQuery.trim()) && (
            <button
              onClick={() => { setSelectedSubject('all'); setSelectedGrade('all'); setSearchQuery(''); }}
              style={{ color: 'var(--color-primary)', fontWeight: '600', fontSize: '0.825rem', cursor: 'pointer' }}
            >
              {t('resetFilters', 'Reset Filters')} ✕
            </button>
          )}
        </div>

        {/* Teacher Cards Grid */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '4rem 1rem', color: '#64748b' }}>
            Loading teachers...
          </div>
        ) : teachers.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '3rem 1rem',
            backgroundColor: '#f8fafc',
            borderRadius: 'var(--radius-md)',
            border: '1px solid #e2e8f0'
          }}>
            <p style={{ fontSize: '1.05rem', fontWeight: '700', color: '#0f172a' }}>No teachers match your search filters.</p>
            <p style={{ fontSize: '0.875rem', color: '#64748b', marginTop: '4px' }}>
              Try clearing your search query or choosing another subject filter.
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
          <div className="grid-teachers" style={{ gap: '1.25rem' }}>
            {(teachers || []).map((teacher) => {
              const priceJod = teacher.monthly_price_jod || Math.round(parseFloat(teacher.monthly_price || '10'));
              const guideCount = teacher.lead_magnet_count || 1;

              return (
                <div 
                  key={teacher.id} 
                  className="card"
                  style={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: 'var(--radius-lg)',
                    padding: '1.25rem',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                    transition: 'transform 0.15s ease, box-shadow 0.15s ease'
                  }}
                  onClick={() => {
                    if (onSelectCreator && teacher.handle) {
                      onSelectCreator(teacher.handle);
                    } else {
                      onSelectTeacher(teacher.id);
                    }
                  }}
                >
                  <div>
                    {/* Header: Avatar, Name, Handle, Rating */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                      <img 
                        src={teacher.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${teacher.name}`} 
                        alt={teacher.name}
                        style={{ 
                          width: '52px', 
                          height: '52px', 
                          borderRadius: '9999px', 
                          objectFit: 'cover',
                          border: '2px solid #e2e8f0'
                        }}
                      />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <h3 style={{ fontSize: '1rem', fontWeight: '800', color: '#0f172a', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {teacher.name}
                          </h3>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.2rem', fontSize: '0.825rem', fontWeight: '700', color: '#d97706' }}>
                            <Star size={13} fill="#d97706" /> {teacher.rating?.toFixed(1) || '5.0'}
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '2px' }}>
                          <span style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--color-primary)' }}>
                            @{teacher.handle || `teacher${teacher.id}`}
                          </span>
                          <span style={{
                            fontSize: '0.675rem',
                            fontWeight: '600',
                            padding: '0.1rem 0.45rem',
                            borderRadius: '9999px',
                            backgroundColor: '#eff6ff',
                            color: '#1d4ed8'
                          }}>
                            Jordanian Teacher
                          </span>
                        </div>

                        <p style={{ fontSize: '0.775rem', color: '#64748b', marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {teacher.headline}
                        </p>
                      </div>
                    </div>

                    {/* Clean Badges: Free Guides & CLIQ */}
                    <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.25rem',
                        fontSize: '0.725rem',
                        fontWeight: '700',
                        backgroundColor: '#dcfce7',
                        color: '#15803d',
                        padding: '0.15rem 0.5rem',
                        borderRadius: '9999px'
                      }}>
                        <Gift size={12} /> {guideCount} {isRTL ? 'دوسية مجانية' : (guideCount > 1 ? 'Free Study Guides' : 'Free Study Guide')}
                      </span>

                      {teacher.cliq_alias && (
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.25rem',
                          fontSize: '0.725rem',
                          fontWeight: '700',
                          backgroundColor: '#f1f5f9',
                          color: '#334155',
                          padding: '0.15rem 0.5rem',
                          borderRadius: '9999px'
                        }}>
                          CLIQ: {teacher.cliq_alias}
                        </span>
                      )}
                    </div>

                    {/* Subjects Badges */}
                    <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
                      {(teacher.subjects || []).map((sub, i) => (
                        <span key={i} style={{
                          fontSize: '0.7rem',
                          padding: '0.1rem 0.45rem',
                          backgroundColor: '#eff6ff',
                          color: '#1e40af',
                          borderRadius: '4px',
                          border: '1px solid #dbeafe',
                          fontWeight: '500'
                        }}>
                          {sub}
                        </span>
                      ))}
                      {(teacher.educational_levels || []).slice(0, 1).map((lvl, i) => (
                        <span key={i} style={{
                          fontSize: '0.7rem',
                          padding: '0.1rem 0.45rem',
                          backgroundColor: '#f8fafc',
                          color: '#475569',
                          borderRadius: '4px',
                          border: '1px solid #e2e8f0',
                          fontWeight: '500'
                        }}>
                          {lvl}
                        </span>
                      ))}
                    </div>

                    {/* Bio Snippet */}
                    <p style={{
                      fontSize: '0.825rem',
                      color: '#475569',
                      lineHeight: 1.5,
                      marginBottom: '1rem',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden'
                    }}>
                      {teacher.bio}
                    </p>
                  </div>

                  {/* Card Footer: Price in JOD & Button */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    paddingTop: '0.75rem',
                    borderTop: '1px solid #f1f5f9'
                  }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: '2px' }}>
                        <span style={{ fontSize: '1.15rem', fontWeight: '800', color: '#0f172a' }}>
                          {priceJod} {t('jod', 'JOD')}
                        </span>
                        <span style={{ fontSize: '0.75rem', color: '#64748b' }}>{t('perMonth', '/ mo')}</span>
                      </div>
                      <div style={{ fontSize: '0.7rem', color: '#16a34a', fontWeight: '700' }}>
                        {t('freeGuidesIncluded', 'Free Guides Included')}
                      </div>
                    </div>

                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        if (onSelectCreator && teacher.handle) {
                          onSelectCreator(teacher.handle);
                        } else {
                          onSelectTeacher(teacher.id);
                        }
                      }}
                      className="btn btn-primary btn-sm"
                      style={{ fontSize: '0.8rem', padding: '0.35rem 0.75rem', display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: '700' }}
                    >
                      {t('viewProfile', 'View Profile')} <ArrowRight size={13} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </section>

      {/* How It Works - Substack Style */}
      <section style={{ backgroundColor: '#f8fafc', borderTop: '1px solid #e2e8f0', padding: '3.5rem 1rem' }}>
        <div className="container" style={{ maxWidth: '880px', margin: '0 auto' }}>
          
          <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
            <h2 style={{ fontSize: '1.65rem', fontWeight: '800', color: '#0f172a', letterSpacing: '-0.02em', margin: 0 }}>
              How Korsa Works in Jordan
            </h2>
            <p style={{ fontSize: '0.925rem', color: '#64748b', marginTop: '4px' }}>
              Zero commissions, direct teacher relationships, and local CLIQ payments.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.5rem' }}>
            
            <div style={{
              backgroundColor: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: 'var(--radius-lg)',
              padding: '1.5rem',
              boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
            }}>
              <div style={{
                width: '38px',
                height: '38px',
                borderRadius: '8px',
                backgroundColor: '#eff6ff',
                color: 'var(--color-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '1rem'
              }}>
                <Download size={20} />
              </div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: '700', color: '#0f172a', marginBottom: '0.4rem' }}>
                1. Free Study Guides
              </h3>
              <p style={{ fontSize: '0.85rem', color: '#475569', lineHeight: 1.5, margin: 0 }}>
                Every teacher provides free downloadable exam roadmaps, summaries, and revision sheets with zero sign-up paywall.
              </p>
            </div>

            <div style={{
              backgroundColor: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: 'var(--radius-lg)',
              padding: '1.5rem',
              boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
            }}>
              <div style={{
                width: '38px',
                height: '38px',
                borderRadius: '8px',
                backgroundColor: '#ecfdf5',
                color: '#059669',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '1rem'
              }}>
                <Zap size={20} />
              </div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: '700', color: '#0f172a', marginBottom: '0.4rem' }}>
                2. Direct CLIQ & Wallets
              </h3>
              <p style={{ fontSize: '0.85rem', color: '#475569', lineHeight: 1.5, margin: 0 }}>
                Pay teachers directly using your Jordanian bank's CLIQ or Zain Cash / Orange Money. 0% platform fee ensures 100% goes to the educator.
              </p>
            </div>

            <div style={{
              backgroundColor: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: 'var(--radius-lg)',
              padding: '1.5rem',
              boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
            }}>
              <div style={{
                width: '38px',
                height: '38px',
                borderRadius: '8px',
                backgroundColor: '#fef3c7',
                color: '#d97706',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '1rem'
              }}>
                <Calendar size={20} />
              </div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: '700', color: '#0f172a', marginBottom: '0.4rem' }}>
                3. 1-on-1 Help & Reviews
              </h3>
              <p style={{ fontSize: '0.85rem', color: '#475569', lineHeight: 1.5, margin: 0 }}>
                Book individual problem-solving sessions and exam reviews. Enter your transfer reference number and receive immediate confirmation.
              </p>
            </div>

          </div>

        </div>
      </section>

    </div>
  );
}
