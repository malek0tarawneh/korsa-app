import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Star, 
  Users, 
  BookOpen, 
  Lock, 
  Play, 
  CheckCircle2, 
  FileText, 
  Sparkles, 
  ArrowLeft,
  MessageSquare
} from 'lucide-react';

export default function TeacherProfilePage({ 
  teacherId, 
  onBack, 
  onOpenSubscribe, 
  onOpenLesson,
  onOpenAuth 
}) {
  const { user, token, isSubscribedTo } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [newReview, setNewReview] = useState({ rating: 5, comment: '' });
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewError, setReviewError] = useState('');

  const [eligibility, setEligibility] = useState({ can_review: false, is_subscribed: false, existing_review: null });

  const loadTeacherData = async () => {
    try {
      const headers = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`/api/teachers/${teacherId}`, { headers });
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }

      if (token) {
        const eligRes = await fetch(`/api/reviews/eligibility/${teacherId}`, { headers });
        if (eligRes.ok) {
          const eligData = await eligRes.json();
          setEligibility(eligData);
          if (eligData.existing_review) {
            setNewReview({
              rating: eligData.existing_review.rating,
              comment: eligData.existing_review.comment || ''
            });
          }
        }
      }
    } catch (err) {
      console.error('Failed to load teacher:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTeacherData();
  }, [teacherId, token]);

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      onOpenAuth('login');
      return;
    }

    setSubmittingReview(true);
    setReviewError('');
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          teacher_id: teacherId,
          rating: newReview.rating,
          comment: newReview.comment
        })
      });

      if (res.ok) {
        loadTeacherData();
      } else {
        const errJson = await res.json();
        setReviewError(errJson.error || 'Failed to submit review');
      }
    } catch (err) {
      setReviewError('Error submitting review');
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading) {
    return (
      <div className="container" style={{ padding: '4rem 1rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
        Loading teacher profile...
      </div>
    );
  }

  if (!data || !data.teacher) {
    return (
      <div className="container" style={{ padding: '4rem 1rem', textAlign: 'center' }}>
        <h3>Teacher profile not found</h3>
        <button onClick={onBack} className="btn btn-secondary" style={{ marginTop: '1rem' }}>
          Back to Teachers
        </button>
      </div>
    );
  }

  const { teacher, isSubscribed, courses, reviews } = data;

  return (
    <div style={{ padding: '2.5rem 0 5rem 0' }}>
      <div className="container">
        
        {/* Back Link */}
        <button 
          onClick={onBack} 
          className="btn btn-secondary btn-sm"
          style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
        >
          <ArrowLeft size={16} /> Back to Teachers
        </button>

        {/* Teacher Hero Card */}
        <div className="card" style={{ marginBottom: '2.5rem', padding: '2rem' }}>
          <div style={{
            display: 'flex',
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            gap: '2rem',
            flexWrap: 'wrap'
          }}>
            
            {/* Left: Avatar, Name, Bio */}
            <div style={{ display: 'flex', gap: '1.5rem', flex: 1, minWidth: '300px' }}>
              <img 
                src={teacher.avatar_url} 
                alt={teacher.name}
                style={{ width: '90px', height: '90px', borderRadius: 'var(--radius-full)', objectFit: 'cover', flexShrink: 0 }}
              />
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                  <h1 style={{ fontSize: '1.75rem', fontWeight: '800', color: 'var(--color-secondary)' }}>
                    {teacher.name}
                  </h1>
                  {isSubscribed && (
                    <span className="badge badge-free" style={{ fontSize: '0.8rem', padding: '0.25rem 0.6rem' }}>
                      <CheckCircle2 size={13} /> ACTIVE SUBSCRIBER
                    </span>
                  )}
                </div>

                <p style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--color-primary)', marginTop: '4px' }}>
                  {teacher.headline}
                </p>

                {/* Badges */}
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.75rem' }}>
                  {teacher.subjects.map((s, i) => (
                    <span key={i} className="badge" style={{ backgroundColor: '#eff6ff', color: '#1e40af' }}>{s}</span>
                  ))}
                  {teacher.educational_levels.map((lvl, i) => (
                    <span key={i} className="badge" style={{ backgroundColor: '#f1f5f9', color: '#475569' }}>{lvl}</span>
                  ))}
                </div>

                <p style={{ fontSize: '0.95rem', color: 'var(--color-text-muted)', lineHeight: 1.6, marginTop: '1rem', maxWidth: '680px' }}>
                  {teacher.bio}
                </p>

                {/* Rating & Stats */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginTop: '1.25rem', fontSize: '0.9rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: '700', color: '#d97706' }}>
                    <Star size={16} fill="#d97706" /> {teacher.rating.toFixed(1)} 
                    <span style={{ color: 'var(--color-text-light)', fontWeight: '400' }}>({teacher.review_count} reviews)</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--color-text-muted)' }}>
                    <Users size={16} /> {teacher.subscriber_count} active students
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Subscription Box */}
            <div style={{
              backgroundColor: '#f8fafc',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-md)',
              padding: '1.5rem',
              minWidth: '270px',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', fontWeight: '600' }}>
                MONTHLY ENROLLMENT
              </div>
              <div style={{ margin: '0.5rem 0' }}>
                <span style={{ fontSize: '2rem', fontWeight: '800', color: 'var(--color-secondary)' }}>
                  {teacher.monthly_price_jod || Math.round(parseFloat(teacher.monthly_price || '10'))} JOD
                </span>
                <span style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)' }}> / month</span>
              </div>
              {teacher.cliq_alias && (
                <div style={{ fontSize: '0.775rem', color: 'var(--color-primary)', fontWeight: '700', marginBottom: '0.5rem', backgroundColor: '#eff6ff', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>
                  CLIQ: {teacher.cliq_alias} (0% Fee)
                </div>
              )}
              <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: '1.25rem' }}>
                Access all current & future courses, worksheets, and updates from {teacher.name}.
              </p>

              {isSubscribed ? (
                <div className="alert alert-success" style={{ margin: 0, justifyContent: 'center', fontSize: '0.875rem' }}>
                  <CheckCircle2 size={16} /> Enrolled & Unlocked
                </div>
              ) : (
                <button
                  onClick={() => {
                    if (!user) {
                      onOpenAuth('login');
                    } else {
                      onOpenSubscribe(teacher);
                    }
                  }}
                  className="btn btn-primary"
                  style={{ width: '100%', fontWeight: '700' }}
                >
                  Join Class ({teacher.monthly_price_jod || Math.round(parseFloat(teacher.monthly_price || '10'))} JOD/mo)
                </button>
              )}
            </div>

          </div>
        </div>

        {/* Curriculum & Courses */}
        <div style={{ marginBottom: '3.5rem' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--color-secondary)', marginBottom: '1.25rem' }}>
            Course Curriculum & Lessons
          </h2>

          {courses.length === 0 ? (
            <div className="card" style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
              This teacher is preparing their first curriculum.
            </div>
          ) : (
            courses.map((course) => (
              <div key={course.id} className="card" style={{ marginBottom: '2rem', padding: '1.75rem' }}>
                
                {/* Course Header */}
                <div style={{ marginBottom: '1.5rem', borderBottom: '1px solid var(--color-border)', paddingBottom: '1.25rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
                    <span className="badge" style={{ backgroundColor: '#eff6ff', color: 'var(--color-primary)' }}>
                      {course.subject_name || 'Subject'}
                    </span>
                    <span className="badge" style={{ backgroundColor: '#f1f5f9', color: '#475569' }}>
                      {course.educational_level}
                    </span>
                  </div>
                  <h3 style={{ fontSize: '1.35rem', fontWeight: '800', color: 'var(--color-secondary)' }}>
                    {course.title}
                  </h3>
                  <p style={{ fontSize: '0.925rem', color: 'var(--color-text-muted)', marginTop: '4px' }}>
                    {course.description}
                  </p>
                </div>

                {/* Course Sections & Lessons */}
                <div>
                  {course.sections && course.sections.map((section, sIndex) => (
                    <div key={section.id || sIndex} style={{ marginBottom: '1.5rem' }}>
                      <h4 style={{ fontSize: '1rem', fontWeight: '700', color: '#334155', marginBottom: '0.75rem' }}>
                        {section.title}
                      </h4>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                        {section.lessons && section.lessons.map((lesson) => (
                          <div
                            key={lesson.id}
                            onClick={() => onOpenLesson(lesson, teacher)}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              padding: '0.85rem 1.15rem',
                              borderRadius: 'var(--radius-md)',
                              border: '1px solid var(--color-border)',
                              backgroundColor: lesson.is_locked ? '#fcfbf8' : '#ffffff',
                              cursor: 'pointer',
                              transition: 'all 0.15s ease',
                              flexWrap: 'wrap',
                              gap: '0.75rem'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--color-primary)'}
                            onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--color-border)'}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                              <div style={{
                                width: '32px',
                                height: '32px',
                                borderRadius: 'var(--radius-full)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                backgroundColor: lesson.is_locked ? '#fef3c7' : '#eff6ff',
                                color: lesson.is_locked ? '#b45309' : 'var(--color-primary)'
                              }}>
                                {lesson.is_locked ? <Lock size={16} /> : <Play size={16} fill="currentColor" />}
                              </div>

                              <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                  <span style={{ fontSize: '0.95rem', fontWeight: '600', color: 'var(--color-secondary)' }}>
                                    {lesson.title}
                                  </span>
                                  {lesson.is_completed && (
                                    <span style={{ color: 'var(--color-accent)', display: 'flex', alignItems: 'center' }} title="Completed">
                                      <CheckCircle2 size={16} />
                                    </span>
                                  )}
                                </div>
                                <span style={{ fontSize: '0.775rem', color: 'var(--color-text-muted)' }}>
                                  {lesson.duration_minutes} mins
                                </span>
                              </div>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                              <span className={`badge ${lesson.access_level === 'FREE' ? 'badge-free' : 'badge-subscriber'}`}>
                                {lesson.access_level === 'FREE' ? 'FREE SAMPLE' : 'SUBSCRIBER ONLY'}
                              </span>

                              <span style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--color-primary)' }}>
                                {lesson.is_locked ? 'Unlock →' : 'Watch →'}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

              </div>
            ))
          )}
        </div>

        {/* Student Reviews & Ratings Section */}
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--color-secondary)', marginBottom: '1.25rem' }}>
            Student Reviews ({reviews.length})
          </h2>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
            {reviews.map((rev) => (
              <div key={rev.id} className="card" style={{ padding: '1.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                  <img 
                    src={rev.student_avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${rev.student_name}`} 
                    alt={rev.student_name}
                    style={{ width: '38px', height: '38px', borderRadius: 'var(--radius-full)', objectFit: 'cover' }}
                  />
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                      <span style={{ fontWeight: '700', fontSize: '0.9rem' }}>{rev.student_name}</span>
                      <span className="badge badge-free" style={{ fontSize: '0.675rem', padding: '0.15rem 0.45rem' }}>
                        ✓ Verified Subscriber
                      </span>
                    </div>
                    <div style={{ display: 'flex', gap: '0.1rem', color: '#d97706', marginTop: '2px' }}>
                      {[...Array(rev.rating)].map((_, i) => (
                        <Star key={i} size={13} fill="#d97706" />
                      ))}
                    </div>
                  </div>
                </div>
                <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', lineHeight: 1.5 }}>
                  "{rev.comment}"
                </p>
              </div>
            ))}
          </div>

          {/* Conditional Review Form */}
          {user && eligibility.can_review ? (
            <div className="card" style={{ padding: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                <h4 style={{ fontSize: '1rem', fontWeight: '700' }}>
                  {eligibility.existing_review ? 'Update Your Review' : `Leave a Review for ${teacher.name}`}
                </h4>
                <span className="badge badge-free" style={{ fontSize: '0.725rem' }}>✓ Verified Subscriber</span>
              </div>
              {reviewError && <div className="alert alert-error">{reviewError}</div>}
              <form onSubmit={handleReviewSubmit}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                  <label className="form-label" style={{ margin: 0 }}>Rating:</label>
                  <select 
                    className="form-input" 
                    style={{ width: 'auto' }}
                    value={newReview.rating} 
                    onChange={(e) => setNewReview({ ...newReview, rating: parseInt(e.target.value) })}
                  >
                    <option value={5}>⭐⭐⭐⭐⭐ (5 Stars - Exceptional)</option>
                    <option value={4}>⭐⭐⭐⭐ (4 Stars - Very Good)</option>
                    <option value={3}>⭐⭐⭐ (3 Stars - Average)</option>
                    <option value={2}>⭐⭐ (2 Stars - Needs Improvement)</option>
                    <option value={1}>⭐ (1 Star - Poor)</option>
                  </select>
                </div>
                <div className="form-group">
                  <textarea
                    className="form-input"
                    rows={3}
                    placeholder="Share how this teacher's explanations helped your understanding..."
                    value={newReview.comment}
                    onChange={(e) => setNewReview({ ...newReview, comment: e.target.value })}
                    required
                  />
                </div>
                <button type="submit" disabled={submittingReview} className="btn btn-primary btn-sm">
                  {submittingReview ? 'Saving...' : eligibility.existing_review ? 'Update My Review' : 'Post Review'}
                </button>
              </form>
            </div>
          ) : user && !eligibility.can_review ? (
            <div className="card" style={{ padding: '1.75rem', backgroundColor: '#f8fafc', textAlign: 'center' }}>
              <h4 style={{ fontSize: '1.05rem', fontWeight: '700', marginBottom: '0.4rem' }}>
                Verified Subscriber Reviews
              </h4>
              <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', marginBottom: '1.25rem', maxWidth: '480px', margin: '0 auto 1.25rem auto' }}>
                To maintain authentic educational ratings, only active subscribers of <strong>{teacher.name}</strong> can write reviews.
              </p>
              <button 
                onClick={() => onOpenSubscribe(teacher)} 
                className="btn btn-primary btn-sm"
              >
                Subscribe to Unlock & Review (${teacher.monthly_price}/mo)
              </button>
            </div>
          ) : (
            <div className="card" style={{ padding: '1.5rem', backgroundColor: '#f8fafc', textAlign: 'center' }}>
              <p style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)', marginBottom: '0.75rem' }}>
                Log in with your student account to submit verified reviews.
              </p>
              <button onClick={() => onOpenAuth('login')} className="btn btn-secondary btn-sm">
                Log In to Review
              </button>
            </div>
          )}

        </div>

      </div>
    </div>
  );
}
