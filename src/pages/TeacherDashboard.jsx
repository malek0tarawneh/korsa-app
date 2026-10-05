import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  DollarSign, 
  Users, 
  BookOpen, 
  PlusCircle, 
  Sparkles, 
  TrendingUp, 
  CheckCircle2, 
  AlertCircle,
  Video,
  Edit,
  Trash2,
  ArrowUp,
  ArrowDown,
  Layers,
  FileText,
  Lock,
  Play,
  Settings,
  Receipt,
  Eye,
  ChevronRight,
  ArrowLeft
} from 'lucide-react';

export default function TeacherDashboard({ onSelectTeacher }) {
  const { user, token } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('studio'); // 'studio' | 'revenue' | 'subscribers' | 'settings'
  const [message, setMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Course Builder Drilldown
  const [selectedCourseId, setSelectedCourseId] = useState(null);
  const [courseDetails, setCourseDetails] = useState(null);
  const [loadingCourse, setLoadingCourse] = useState(false);

  // Modals state
  const [courseModal, setCourseModal] = useState({ isOpen: false, isEdit: false, data: null });
  const [sectionModal, setSectionModal] = useState({ isOpen: false, isEdit: false, data: null, courseId: null });
  const [lessonModal, setLessonModal] = useState({ isOpen: false, isEdit: false, data: null, sectionId: null, courseId: null });

  // Settings form state
  const [settingsForm, setSettingsForm] = useState({
    headline: '',
    bio: '',
    monthly_price: '5'
  });
  const [savingSettings, setSavingSettings] = useState(false);

  // Load overview data
  const loadOverview = async () => {
    try {
      const res = await fetch('/api/teacher-dashboard/overview', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const json = await res.json();
        setData(json);
        if (json.profile) {
          setSettingsForm({
            headline: json.profile.headline || '',
            bio: json.profile.bio || '',
            monthly_price: (json.profile.monthly_price_cents / 100).toFixed(2)
          });
        }
      }
    } catch (err) {
      console.error('Failed to load teacher stats:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) loadOverview();
  }, [token]);

  // Load detailed course structure for content studio editing
  const loadCourseFull = async (courseId) => {
    setLoadingCourse(true);
    try {
      const res = await fetch(`/api/teacher-dashboard/courses/${courseId}/full`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const json = await res.json();
        setCourseDetails(json);
      }
    } catch (err) {
      console.error('Failed to load course full details:', err);
    } finally {
      setLoadingCourse(false);
    }
  };

  const handleOpenCourseBuilder = (courseId) => {
    setSelectedCourseId(courseId);
    loadCourseFull(courseId);
  };

  // --- Course CRUD Handlers ---
  const handleSaveCourse = async (e) => {
    e.preventDefault();
    const formData = courseModal.data;
    try {
      const url = courseModal.isEdit 
        ? `/api/teacher-dashboard/courses/${formData.id}`
        : '/api/teacher-dashboard/courses';
      const method = courseModal.isEdit ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      if (res.ok) {
        setMessage(courseModal.isEdit ? 'Course updated successfully!' : 'Course created successfully!');
        setCourseModal({ isOpen: false, isEdit: false, data: null });
        loadOverview();
        if (selectedCourseId) loadCourseFull(selectedCourseId);
      } else {
        const err = await res.json();
        setErrorMessage(err.error || 'Failed to save course');
      }
    } catch (err) {
      setErrorMessage('Network error saving course');
    }
  };

  const handleDeleteCourse = async (courseId) => {
    if (!window.confirm('Are you sure you want to delete this course and all its lessons?')) return;
    try {
      const res = await fetch(`/api/teacher-dashboard/courses/${courseId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setMessage('Course deleted successfully.');
        setSelectedCourseId(null);
        setCourseDetails(null);
        loadOverview();
      }
    } catch (err) {
      console.error('Delete course error:', err);
    }
  };

  // --- Section CRUD Handlers ---
  const handleSaveSection = async (e) => {
    e.preventDefault();
    const { isEdit, data, courseId } = sectionModal;
    try {
      const url = isEdit
        ? `/api/teacher-dashboard/sections/${data.id}`
        : `/api/teacher-dashboard/courses/${courseId}/sections`;
      const method = isEdit ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ title: data.title })
      });

      if (res.ok) {
        setMessage(isEdit ? 'Section updated successfully!' : 'Section added successfully!');
        setSectionModal({ isOpen: false, isEdit: false, data: null, courseId: null });
        loadCourseFull(selectedCourseId);
      }
    } catch (err) {
      console.error('Save section error:', err);
    }
  };

  const handleDeleteSection = async (sectionId) => {
    if (!window.confirm('Delete this section and all lessons within it?')) return;
    try {
      const res = await fetch(`/api/teacher-dashboard/sections/${sectionId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setMessage('Section deleted.');
        loadCourseFull(selectedCourseId);
      }
    } catch (err) {
      console.error('Delete section error:', err);
    }
  };

  // --- Lesson CRUD Handlers ---
  const handleSaveLesson = async (e) => {
    e.preventDefault();
    const { isEdit, data, sectionId, courseId } = lessonModal;
    try {
      const url = isEdit
        ? `/api/teacher-dashboard/lessons/${data.id}`
        : '/api/teacher-dashboard/lessons';
      const method = isEdit ? 'PUT' : 'POST';

      const payload = isEdit ? data : { ...data, section_id: sectionId, course_id: courseId };

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setMessage(isEdit ? 'Lesson updated!' : 'Lesson created!');
        setLessonModal({ isOpen: false, isEdit: false, data: null, sectionId: null, courseId: null });
        loadCourseFull(selectedCourseId);
        loadOverview();
      }
    } catch (err) {
      console.error('Save lesson error:', err);
    }
  };

  const handleDeleteLesson = async (lessonId) => {
    if (!window.confirm('Are you sure you want to delete this lesson?')) return;
    try {
      const res = await fetch(`/api/teacher-dashboard/lessons/${lessonId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setMessage('Lesson deleted.');
        loadCourseFull(selectedCourseId);
        loadOverview();
      }
    } catch (err) {
      console.error('Delete lesson error:', err);
    }
  };

  const handleToggleLessonAccess = async (lesson) => {
    const nextAccess = lesson.access_level === 'FREE' ? 'SUBSCRIBER_ONLY' : 'FREE';
    try {
      const res = await fetch(`/api/teacher-dashboard/lessons/${lesson.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ access_level: nextAccess })
      });
      if (res.ok) {
        setMessage(`Lesson updated to ${nextAccess === 'FREE' ? 'Free Sample' : 'Subscriber Only'}`);
        loadCourseFull(selectedCourseId);
      }
    } catch (err) {
      console.error('Toggle access error:', err);
    }
  };

  // --- Reordering Lessons ---
  const handleMoveLesson = async (section, lessonIndex, direction) => {
    const lessons = [...section.lessons];
    const targetIndex = direction === 'up' ? lessonIndex - 1 : lessonIndex + 1;
    if (targetIndex < 0 || targetIndex >= lessons.length) return;

    // Swap
    const temp = lessons[lessonIndex];
    lessons[lessonIndex] = lessons[targetIndex];
    lessons[targetIndex] = temp;

    const items = lessons.map((l, idx) => ({ id: l.id, order_index: idx + 1 }));

    try {
      const res = await fetch('/api/teacher-dashboard/reorder', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ type: 'lessons', items })
      });
      if (res.ok) {
        loadCourseFull(selectedCourseId);
      }
    } catch (err) {
      console.error('Reorder error:', err);
    }
  };

  // --- Update Settings & Price ---
  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setSavingSettings(true);
    setErrorMessage('');
    try {
      const priceCents = Math.round(parseFloat(settingsForm.monthly_price || '5') * 100);
      const res = await fetch('/api/teacher-dashboard/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          headline: settingsForm.headline,
          bio: settingsForm.bio,
          monthly_price_cents: priceCents
        })
      });

      if (res.ok) {
        setMessage('Profile and subscription pricing updated successfully!');
        loadOverview();
      } else {
        const err = await res.json();
        setErrorMessage(err.error || 'Failed to update settings');
      }
    } catch (err) {
      setErrorMessage('Error saving profile settings');
    } finally {
      setSavingSettings(false);
    }
  };

  if (loading) {
    return (
      <div className="container" style={{ padding: '4rem 1rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
        Loading Teacher Studio & Analytics...
      </div>
    );
  }

  const stats = data?.stats || {};
  const courses = data?.courses || [];
  const subscribers = data?.subscribers || [];
  const payments = data?.payments || [];

  return (
    <div style={{ padding: '2.5rem 0 5rem 0' }}>
      <div className="container">
        
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
          marginBottom: '2rem'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
              <span className="badge badge-role teacher">TEACHER STUDIO</span>
              <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>{user?.name}</span>
            </div>
            <h1 style={{ fontSize: '1.85rem', fontWeight: '800', color: 'var(--color-secondary)' }}>
              Teacher Content Studio & Revenue Analytics
            </h1>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button 
              onClick={() => onSelectTeacher(user?.id)}
              className="btn btn-secondary btn-sm"
              style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
            >
              <Eye size={16} /> View Public Profile
            </button>
            <button 
              onClick={() => setCourseModal({
                isOpen: true,
                isEdit: false,
                data: { title: '', description: '', subject_name: 'Mathematics', educational_level: 'Grade 12', thumbnail_url: '' }
              })}
              className="btn btn-primary btn-sm"
              style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
            >
              <PlusCircle size={16} /> New Course
            </button>
          </div>
        </div>

        {/* Global Alerts */}
        {message && (
          <div className="alert alert-success" style={{ marginBottom: '1.5rem' }}>
            <CheckCircle2 size={18} /> {message}
          </div>
        )}
        {errorMessage && (
          <div className="alert alert-error" style={{ marginBottom: '1.5rem' }}>
            <AlertCircle size={18} /> {errorMessage}
          </div>
        )}

        {/* Top Analytics Cards (Requirement 3: Teacher Revenue Analytics) */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem', marginBottom: '2.5rem' }}>
          
          <div className="card" style={{ padding: '1.25rem' }}>
            <span style={{ fontSize: '0.825rem', color: 'var(--color-text-muted)', fontWeight: '600' }}>Active Subscribers</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.4rem' }}>
              <Users size={22} color="var(--color-primary)" />
              <span style={{ fontSize: '1.75rem', fontWeight: '800' }}>{stats.active_subscribers}</span>
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '4px', display: 'block' }}>
              @ ${stats.subscription_price} / month per student
            </span>
          </div>

          <div className="card" style={{ padding: '1.25rem' }}>
            <span style={{ fontSize: '0.825rem', color: 'var(--color-text-muted)', fontWeight: '600' }}>Gross Monthly Revenue</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.4rem' }}>
              <DollarSign size={22} color="var(--color-secondary)" />
              <span style={{ fontSize: '1.75rem', fontWeight: '800' }}>${stats.gross_monthly_revenue}</span>
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '4px', display: 'block' }}>
              Total monthly billing volume
            </span>
          </div>

          <div className="card" style={{ padding: '1.25rem' }}>
            <span style={{ fontSize: '0.825rem', color: 'var(--color-text-muted)', fontWeight: '600' }}>Platform Deduction ({stats.platform_commission_percent}%)</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.4rem' }}>
              <span style={{ fontSize: '1.75rem', fontWeight: '800', color: 'var(--color-text-muted)' }}>
                -${stats.platform_commission_amount}
              </span>
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '4px', display: 'block' }}>
              Configurable platform cut
            </span>
          </div>

          <div className="card" style={{ padding: '1.25rem', borderLeft: '4px solid var(--color-accent)' }}>
            <span style={{ fontSize: '0.825rem', color: 'var(--color-text-muted)', fontWeight: '600' }}>Estimated Net Payout (80%)</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.4rem' }}>
              <span style={{ fontSize: '1.75rem', fontWeight: '800', color: 'var(--color-accent)' }}>
                ${stats.estimated_teacher_earnings}
              </span>
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--color-accent)', fontWeight: '600', marginTop: '4px', display: 'block' }}>
              Direct recurring earnings
            </span>
          </div>

        </div>

        {/* Navigation Tabs */}
        <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid var(--color-border)', marginBottom: '2rem' }}>
          <button
            onClick={() => { setActiveTab('studio'); setSelectedCourseId(null); }}
            style={{
              padding: '0.75rem 1.25rem',
              fontWeight: activeTab === 'studio' ? '700' : '500',
              color: activeTab === 'studio' ? 'var(--color-primary)' : 'var(--color-text-muted)',
              borderBottom: activeTab === 'studio' ? '2px solid var(--color-primary)' : '2px solid transparent',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem'
            }}
          >
            <BookOpen size={16} /> Content Studio ({courses.length})
          </button>
          <button
            onClick={() => setActiveTab('revenue')}
            style={{
              padding: '0.75rem 1.25rem',
              fontWeight: activeTab === 'revenue' ? '700' : '500',
              color: activeTab === 'revenue' ? 'var(--color-primary)' : 'var(--color-text-muted)',
              borderBottom: activeTab === 'revenue' ? '2px solid var(--color-primary)' : '2px solid transparent',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem'
            }}
          >
            <Receipt size={16} /> Revenue & Payments ({payments.length})
          </button>
          <button
            onClick={() => setActiveTab('subscribers')}
            style={{
              padding: '0.75rem 1.25rem',
              fontWeight: activeTab === 'subscribers' ? '700' : '500',
              color: activeTab === 'subscribers' ? 'var(--color-primary)' : 'var(--color-text-muted)',
              borderBottom: activeTab === 'subscribers' ? '2px solid var(--color-primary)' : '2px solid transparent',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem'
            }}
          >
            <Users size={16} /> Subscribers ({subscribers.length})
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            style={{
              padding: '0.75rem 1.25rem',
              fontWeight: activeTab === 'settings' ? '700' : '500',
              color: activeTab === 'settings' ? 'var(--color-primary)' : 'var(--color-text-muted)',
              borderBottom: activeTab === 'settings' ? '2px solid var(--color-primary)' : '2px solid transparent',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem'
            }}
          >
            <Settings size={16} /> Profile & Pricing
          </button>
        </div>

        {/* TAB 1: CONTENT STUDIO */}
        {activeTab === 'studio' && (
          <div>
            {!selectedCourseId ? (
              /* All Courses Grid */
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                  <h2 style={{ fontSize: '1.35rem', fontWeight: '800', color: 'var(--color-secondary)' }}>
                    My Courses & Learning Paths
                  </h2>
                  <button 
                    onClick={() => setCourseModal({
                      isOpen: true,
                      isEdit: false,
                      data: { title: '', description: '', subject_name: 'Mathematics', educational_level: 'Grade 12', thumbnail_url: '' }
                    })}
                    className="btn btn-secondary btn-sm"
                  >
                    + Add New Course
                  </button>
                </div>

                {courses.length === 0 ? (
                  <div className="card" style={{ padding: '3rem', textAlign: 'center' }}>
                    <p style={{ color: 'var(--color-text-muted)', marginBottom: '1rem' }}>You have not created any courses yet.</p>
                    <button 
                      onClick={() => setCourseModal({
                        isOpen: true,
                        isEdit: false,
                        data: { title: '', description: '', subject_name: 'Mathematics', educational_level: 'Grade 12', thumbnail_url: '' }
                      })}
                      className="btn btn-primary btn-sm"
                    >
                      Create First Course
                    </button>
                  </div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.5rem' }}>
                    {courses.map((c) => (
                      <div key={c.id} className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                            <span className="badge" style={{ backgroundColor: '#eff6ff', color: 'var(--color-primary)' }}>
                              {c.educational_level}
                            </span>
                            <span className={`badge ${c.is_published ? 'badge-free' : 'badge-role'}`}>
                              {c.is_published ? 'PUBLISHED' : 'DRAFT'}
                            </span>
                          </div>

                          <h3 style={{ fontSize: '1.2rem', fontWeight: '700', marginBottom: '0.4rem' }}>
                            {c.title}
                          </h3>
                          <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', lineHeight: 1.5, marginBottom: '1rem' }}>
                            {c.description || 'No description provided.'}
                          </p>
                        </div>

                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: '1rem' }}>
                            <span>Lessons: <strong>{c.total_lessons}</strong></span>
                            <span>Active Students: <strong>{c.active_learners || 0}</strong></span>
                          </div>

                          <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button
                              onClick={() => handleOpenCourseBuilder(c.id)}
                              className="btn btn-primary btn-sm"
                              style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}
                            >
                              <Layers size={15} /> Manage Curriculum <ChevronRight size={14} />
                            </button>
                            <button
                              onClick={() => setCourseModal({ isOpen: true, isEdit: true, data: c })}
                              className="btn btn-secondary btn-sm"
                              title="Edit Course info"
                            >
                              <Edit size={14} />
                            </button>
                            <button
                              onClick={() => handleDeleteCourse(c.id)}
                              className="btn btn-danger btn-sm"
                              title="Delete Course"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              /* Course Builder Detail View */
              <div>
                <button
                  onClick={() => { setSelectedCourseId(null); setCourseDetails(null); }}
                  className="btn btn-secondary btn-sm"
                  style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                >
                  <ArrowLeft size={16} /> Back to Courses List
                </button>

                {loadingCourse ? (
                  <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-text-muted)' }}>
                    Loading curriculum structure...
                  </div>
                ) : courseDetails ? (
                  <div>
                    {/* Course Banner */}
                    <div className="card" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                        <div>
                          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.35rem' }}>
                            <span className="badge" style={{ backgroundColor: '#eff6ff', color: 'var(--color-primary)' }}>
                              {courseDetails.course.educational_level}
                            </span>
                            <span className="badge" style={{ backgroundColor: '#f1f5f9', color: '#475569' }}>
                              {courseDetails.course.subject_name || 'Subject'}
                            </span>
                          </div>
                          <h2 style={{ fontSize: '1.5rem', fontWeight: '800' }}>{courseDetails.course.title}</h2>
                          <p style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)', marginTop: '4px' }}>
                            {courseDetails.course.description}
                          </p>
                        </div>

                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button
                            onClick={() => setSectionModal({
                              isOpen: true,
                              isEdit: false,
                              data: { title: '' },
                              courseId: courseDetails.course.id
                            })}
                            className="btn btn-primary btn-sm"
                          >
                            <PlusCircle size={15} /> Add Section
                          </button>
                          <button
                            onClick={() => setCourseModal({ isOpen: true, isEdit: true, data: courseDetails.course })}
                            className="btn btn-secondary btn-sm"
                          >
                            <Edit size={14} /> Edit Course
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Sections & Lessons Structure */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                      {courseDetails.sections.length === 0 ? (
                        <div className="card" style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                          No sections created yet. Click "Add Section" above to organize lessons.
                        </div>
                      ) : (
                        courseDetails.sections.map((sec, secIdx) => (
                          <div key={sec.id} className="card" style={{ padding: '1.5rem' }}>
                            
                            {/* Section Header */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--color-border)', paddingBottom: '0.85rem', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <span style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--color-text-muted)' }}>
                                  SECTION {secIdx + 1}:
                                </span>
                                <h3 style={{ fontSize: '1.15rem', fontWeight: '700' }}>{sec.title}</h3>
                              </div>

                              <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                                <button
                                  onClick={() => setLessonModal({
                                    isOpen: true,
                                    isEdit: false,
                                    data: { title: '', description: '', video_url: '', duration_minutes: 20, access_level: 'SUBSCRIBER_ONLY' },
                                    sectionId: sec.id,
                                    courseId: courseDetails.course.id
                                  })}
                                  className="btn btn-secondary btn-sm"
                                  style={{ fontSize: '0.8rem', padding: '0.3rem 0.6rem' }}
                                >
                                  <Video size={14} /> + Add Lesson
                                </button>
                                <button
                                  onClick={() => setSectionModal({ isOpen: true, isEdit: true, data: sec, courseId: courseDetails.course.id })}
                                  className="btn btn-secondary btn-sm"
                                  style={{ padding: '0.3rem 0.5rem' }}
                                  title="Rename Section"
                                >
                                  <Edit size={14} />
                                </button>
                                <button
                                  onClick={() => handleDeleteSection(sec.id)}
                                  className="btn btn-danger btn-sm"
                                  style={{ padding: '0.3rem 0.5rem' }}
                                  title="Delete Section"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </div>

                            {/* Lessons List within Section */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                              {sec.lessons.length === 0 ? (
                                <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', fontStyle: 'italic', padding: '0.5rem 0' }}>
                                  No lessons in this section yet. Click "+ Add Lesson".
                                </p>
                              ) : (
                                sec.lessons.map((lesson, lIdx) => (
                                  <div
                                    key={lesson.id}
                                    style={{
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'space-between',
                                      padding: '0.75rem 1rem',
                                      borderRadius: 'var(--radius-md)',
                                      border: '1px solid var(--color-border)',
                                      backgroundColor: '#ffffff',
                                      flexWrap: 'wrap',
                                      gap: '0.75rem'
                                    }}
                                  >
                                    {/* Left: Reorder arrows & Title */}
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                        <button
                                          onClick={() => handleMoveLesson(sec, lIdx, 'up')}
                                          disabled={lIdx === 0}
                                          style={{ padding: '2px', opacity: lIdx === 0 ? 0.3 : 1 }}
                                          title="Move Up"
                                        >
                                          <ArrowUp size={12} />
                                        </button>
                                        <button
                                          onClick={() => handleMoveLesson(sec, lIdx, 'down')}
                                          disabled={lIdx === sec.lessons.length - 1}
                                          style={{ padding: '2px', opacity: lIdx === sec.lessons.length - 1 ? 0.3 : 1 }}
                                          title="Move Down"
                                        >
                                          <ArrowDown size={12} />
                                        </button>
                                      </div>

                                      <div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                          <span style={{ fontWeight: '600', fontSize: '0.925rem' }}>{lesson.title}</span>
                                          <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>({lesson.duration_minutes}m)</span>
                                        </div>
                                        {lesson.video_url && (
                                          <span style={{ fontSize: '0.75rem', color: 'var(--color-primary)', display: 'block', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', maxWidth: '350px' }}>
                                            URL: {lesson.video_url}
                                          </span>
                                        )}
                                      </div>
                                    </div>

                                    {/* Right: Access level switch & Actions */}
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                                      <button
                                        onClick={() => handleToggleLessonAccess(lesson)}
                                        className={`badge ${lesson.access_level === 'FREE' ? 'badge-free' : 'badge-subscriber'}`}
                                        style={{ cursor: 'pointer' }}
                                        title="Click to toggle access level"
                                      >
                                        {lesson.access_level === 'FREE' ? 'FREE SAMPLE' : 'SUBSCRIBER ONLY'}
                                      </button>

                                      <button
                                        onClick={() => setLessonModal({
                                          isOpen: true,
                                          isEdit: true,
                                          data: lesson,
                                          sectionId: sec.id,
                                          courseId: courseDetails.course.id
                                        })}
                                        className="btn btn-secondary btn-sm"
                                        style={{ padding: '0.3rem 0.5rem' }}
                                        title="Edit Lesson details"
                                      >
                                        <Edit size={14} />
                                      </button>

                                      <button
                                        onClick={() => handleDeleteLesson(lesson.id)}
                                        className="btn btn-danger btn-sm"
                                        style={{ padding: '0.3rem 0.5rem' }}
                                        title="Delete Lesson"
                                      >
                                        <Trash2 size={14} />
                                      </button>
                                    </div>
                                  </div>
                                ))
                              )}
                            </div>

                          </div>
                        ))
                      )}
                    </div>
                  </div>
                ) : null}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: REVENUE & SIMULATED PAYMENTS */}
        {activeTab === 'revenue' && (
          <div>
            <div style={{ marginBottom: '2rem' }}>
              <h2 style={{ fontSize: '1.35rem', fontWeight: '800', color: 'var(--color-secondary)', marginBottom: '0.5rem' }}>
                Simulated Revenue Ledger
              </h2>
              <p style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>
                Itemized simulated monthly subscriptions and platform infrastructure deductions.
              </p>
            </div>

            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
              {payments.length === 0 ? (
                <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                  No payment transactions recorded yet.
                </div>
              ) : (
                <div className="table-responsive">
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
                    <thead>
                      <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid var(--color-border)' }}>
                        <th style={{ padding: '0.85rem 1rem', color: 'var(--color-text-muted)' }}>Date</th>
                        <th style={{ padding: '0.85rem 1rem', color: 'var(--color-text-muted)' }}>Student</th>
                        <th style={{ padding: '0.85rem 1rem', color: 'var(--color-text-muted)' }}>Gross Subscription</th>
                        <th style={{ padding: '0.85rem 1rem', color: 'var(--color-text-muted)' }}>Korsa Cut ({stats.platform_commission_percent}%)</th>
                        <th style={{ padding: '0.85rem 1rem', color: 'var(--color-text-muted)' }}>Your Net Earnings</th>
                        <th style={{ padding: '0.85rem 1rem', color: 'var(--color-text-muted)' }}>Mode</th>
                      </tr>
                    </thead>
                    <tbody>
                      {payments.map((p) => (
                        <tr key={p.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                          <td style={{ padding: '0.85rem 1rem', color: 'var(--color-text-muted)' }}>{p.created_at?.split(' ')[0]}</td>
                          <td style={{ padding: '0.85rem 1rem', fontWeight: '600' }}>
                            {p.student_name}
                            <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--color-text-muted)', fontWeight: '400' }}>{p.student_email}</span>
                          </td>
                          <td style={{ padding: '0.85rem 1rem', fontWeight: '700' }}>${p.amount}</td>
                          <td style={{ padding: '0.85rem 1rem', color: 'var(--color-text-muted)' }}>-${p.platform_commission}</td>
                          <td style={{ padding: '0.85rem 1rem', color: 'var(--color-accent)', fontWeight: '700' }}>+${p.teacher_earnings}</td>
                          <td style={{ padding: '0.85rem 1rem' }}>
                            <span className="badge badge-role" style={{ fontSize: '0.7rem' }}>SIMULATED</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 3: SUBSCRIBERS */}
        {activeTab === 'subscribers' && (
          <div>
            <div style={{ marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.35rem', fontWeight: '800', color: 'var(--color-secondary)' }}>
                Active Student Subscribers ({subscribers.length})
              </h2>
            </div>

            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
              {subscribers.length === 0 ? (
                <div style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                  No active subscribers yet. Offer free sample lessons on your courses to convert learners!
                </div>
              ) : (
                <div className="table-responsive">
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
                    <thead>
                      <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid var(--color-border)' }}>
                        <th style={{ padding: '0.85rem 1.25rem', color: 'var(--color-text-muted)' }}>Student</th>
                        <th style={{ padding: '0.85rem 1.25rem', color: 'var(--color-text-muted)' }}>Email</th>
                        <th style={{ padding: '0.85rem 1.25rem', color: 'var(--color-text-muted)' }}>Subscribed Since</th>
                        <th style={{ padding: '0.85rem 1.25rem', color: 'var(--color-text-muted)' }}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {subscribers.map((s) => (
                        <tr key={s.subscription_id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                          <td style={{ padding: '0.85rem 1.25rem', display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                            <img 
                              src={s.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${s.student_name}`} 
                              alt={s.student_name}
                              style={{ width: '32px', height: '32px', borderRadius: 'var(--radius-full)', objectFit: 'cover' }}
                            />
                            <span style={{ fontWeight: '600' }}>{s.student_name}</span>
                          </td>
                          <td style={{ padding: '0.85rem 1.25rem', color: 'var(--color-text-muted)' }}>{s.email}</td>
                          <td style={{ padding: '0.85rem 1.25rem', color: 'var(--color-text-muted)' }}>{s.started_at?.split(' ')[0]}</td>
                          <td style={{ padding: '0.85rem 1.25rem' }}>
                            <span className="badge badge-free">ACTIVE</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 4: PROFILE & PRICING SETTINGS */}
        {activeTab === 'settings' && (
          <div className="card" style={{ maxWidth: '680px', padding: '2rem' }}>
            <h2 style={{ fontSize: '1.35rem', fontWeight: '800', marginBottom: '0.5rem' }}>
              Teacher Profile & Subscription Pricing
            </h2>
            <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', marginBottom: '1.5rem' }}>
              Set your monthly price. Students will subscribe directly to you at this rate.
            </p>

            <form onSubmit={handleSaveSettings}>
              <div className="form-group">
                <label className="form-label">Professional Headline</label>
                <input
                  type="text"
                  required
                  className="form-input"
                  placeholder="e.g. Senior Mathematics Specialist & Olympiad Coach"
                  value={settingsForm.headline}
                  onChange={(e) => setSettingsForm({ ...settingsForm, headline: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Professional Biography</label>
                <textarea
                  rows={4}
                  required
                  className="form-input"
                  placeholder="Describe your teaching philosophy, background, and what students will master..."
                  value={settingsForm.bio}
                  onChange={(e) => setSettingsForm({ ...settingsForm, bio: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Monthly Subscription Price ($ USD)</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', width: '200px' }}>
                  <span style={{ fontWeight: '700', fontSize: '1.1rem' }}>$</span>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    step="0.5"
                    required
                    className="form-input"
                    value={settingsForm.monthly_price}
                    onChange={(e) => setSettingsForm({ ...settingsForm, monthly_price: e.target.value })}
                  />
                  <span style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>/mo</span>
                </div>
              </div>

              <button type="submit" disabled={savingSettings} className="btn btn-primary" style={{ marginTop: '0.5rem' }}>
                {savingSettings ? 'Saving...' : 'Save Settings'}
              </button>
            </form>
          </div>
        )}

        {/* MODAL: Course Create / Edit */}
        {courseModal.isOpen && (
          <div className="modal-overlay" onClick={() => setCourseModal({ isOpen: false, isEdit: false, data: null })}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3 style={{ fontSize: '1.2rem', fontWeight: '700' }}>
                  {courseModal.isEdit ? 'Edit Course' : 'Create New Course'}
                </h3>
                <button onClick={() => setCourseModal({ isOpen: false, isEdit: false, data: null })}>✕</button>
              </div>
              <form onSubmit={handleSaveCourse} className="modal-body">
                <div className="form-group">
                  <label className="form-label">Course Title</label>
                  <input
                    type="text"
                    required
                    className="form-input"
                    value={courseModal.data?.title || ''}
                    onChange={(e) => setCourseModal({ ...courseModal, data: { ...courseModal.data, title: e.target.value } })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Description</label>
                  <textarea
                    rows={3}
                    className="form-input"
                    value={courseModal.data?.description || ''}
                    onChange={(e) => setCourseModal({ ...courseModal, data: { ...courseModal.data, description: e.target.value } })}
                  />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label className="form-label">Grade / Level</label>
                    <select
                      className="form-input"
                      value={courseModal.data?.educational_level || 'Grade 12'}
                      onChange={(e) => setCourseModal({ ...courseModal, data: { ...courseModal.data, educational_level: e.target.value } })}
                    >
                      <option value="Grade 10">Grade 10</option>
                      <option value="Grade 11">Grade 11</option>
                      <option value="Grade 12">Grade 12 (Tawjihi)</option>
                      <option value="University">University</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Subject</label>
                    <select
                      className="form-input"
                      value={courseModal.data?.subject_name || 'Mathematics'}
                      onChange={(e) => setCourseModal({ ...courseModal, data: { ...courseModal.data, subject_name: e.target.value } })}
                    >
                      <option value="Mathematics">Mathematics</option>
                      <option value="Physics">Physics</option>
                      <option value="Chemistry">Chemistry</option>
                      <option value="English">English</option>
                      <option value="Computer Science">Computer Science</option>
                    </select>
                  </div>
                </div>

                <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '0.5rem' }}>
                  {courseModal.isEdit ? 'Save Changes' : 'Publish Course'}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* MODAL: Section Create / Edit */}
        {sectionModal.isOpen && (
          <div className="modal-overlay" onClick={() => setSectionModal({ isOpen: false, isEdit: false, data: null, courseId: null })}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3 style={{ fontSize: '1.2rem', fontWeight: '700' }}>
                  {sectionModal.isEdit ? 'Edit Section Title' : 'Add Section'}
                </h3>
                <button onClick={() => setSectionModal({ isOpen: false, isEdit: false, data: null, courseId: null })}>✕</button>
              </div>
              <form onSubmit={handleSaveSection} className="modal-body">
                <div className="form-group">
                  <label className="form-label">Section Title</label>
                  <input
                    type="text"
                    required
                    className="form-input"
                    placeholder="e.g. Chapter 2: Limits & Continuity"
                    value={sectionModal.data?.title || ''}
                    onChange={(e) => setSectionModal({ ...sectionModal, data: { ...sectionModal.data, title: e.target.value } })}
                  />
                </div>
                <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
                  {sectionModal.isEdit ? 'Update Section' : 'Add Section'}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* MODAL: Lesson Create / Edit */}
        {lessonModal.isOpen && (
          <div className="modal-overlay" onClick={() => setLessonModal({ isOpen: false, isEdit: false, data: null, sectionId: null, courseId: null })}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3 style={{ fontSize: '1.2rem', fontWeight: '700' }}>
                  {lessonModal.isEdit ? 'Edit Lesson' : 'Add New Lesson'}
                </h3>
                <button onClick={() => setLessonModal({ isOpen: false, isEdit: false, data: null, sectionId: null, courseId: null })}>✕</button>
              </div>
              <form onSubmit={handleSaveLesson} className="modal-body">
                <div className="form-group">
                  <label className="form-label">Lesson Title</label>
                  <input
                    type="text"
                    required
                    className="form-input"
                    placeholder="e.g. Solving Trigonometric Equations"
                    value={lessonModal.data?.title || ''}
                    onChange={(e) => setLessonModal({ ...lessonModal, data: { ...lessonModal.data, title: e.target.value } })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Access Level</label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                    <div
                      onClick={() => setLessonModal({ ...lessonModal, data: { ...lessonModal.data, access_level: 'FREE' } })}
                      style={{
                        padding: '0.75rem',
                        border: `2px solid ${lessonModal.data?.access_level === 'FREE' ? 'var(--color-primary)' : 'var(--color-border)'}`,
                        borderRadius: 'var(--radius-md)',
                        cursor: 'pointer',
                        backgroundColor: lessonModal.data?.access_level === 'FREE' ? 'var(--color-primary-light)' : '#ffffff'
                      }}
                    >
                      <div style={{ fontWeight: '700', fontSize: '0.85rem' }}>FREE SAMPLE</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Anyone can preview</div>
                    </div>

                    <div
                      onClick={() => setLessonModal({ ...lessonModal, data: { ...lessonModal.data, access_level: 'SUBSCRIBER_ONLY' } })}
                      style={{
                        padding: '0.75rem',
                        border: `2px solid ${lessonModal.data?.access_level === 'SUBSCRIBER_ONLY' ? 'var(--color-primary)' : 'var(--color-border)'}`,
                        borderRadius: 'var(--radius-md)',
                        cursor: 'pointer',
                        backgroundColor: lessonModal.data?.access_level === 'SUBSCRIBER_ONLY' ? 'var(--color-primary-light)' : '#ffffff'
                      }}
                    >
                      <div style={{ fontWeight: '700', fontSize: '0.85rem' }}>SUBSCRIBER ONLY</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Subscribed students only</div>
                    </div>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Video Embed URL</label>
                  <input
                    type="url"
                    className="form-input"
                    placeholder="https://www.youtube.com/embed/..."
                    value={lessonModal.data?.video_url || ''}
                    onChange={(e) => setLessonModal({ ...lessonModal, data: { ...lessonModal.data, video_url: e.target.value } })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Duration (minutes)</label>
                  <input
                    type="number"
                    min="1"
                    className="form-input"
                    value={lessonModal.data?.duration_minutes || 15}
                    onChange={(e) => setLessonModal({ ...lessonModal, data: { ...lessonModal.data, duration_minutes: e.target.value } })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Lesson Overview & Description</label>
                  <textarea
                    rows={3}
                    className="form-input"
                    value={lessonModal.data?.description || ''}
                    onChange={(e) => setLessonModal({ ...lessonModal, data: { ...lessonModal.data, description: e.target.value } })}
                  />
                </div>

                <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '0.5rem' }}>
                  {lessonModal.isEdit ? 'Save Lesson' : 'Add Lesson'}
                </button>
              </form>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
