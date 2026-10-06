import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  DollarSign, 
  Users, 
  BookOpen, 
  PlusCircle, 
  CheckCircle2, 
  AlertCircle,
  Video,
  Edit,
  Trash2,
  ArrowUp,
  ArrowDown,
  Layers,
  Settings,
  Receipt,
  Eye,
  ChevronRight,
  ArrowLeft,
  Download,
  Copy,
  Check,
  ExternalLink,
  Briefcase,
  Gift
} from 'lucide-react';

export default function TeacherDashboard({ onSelectTeacher }) {
  const { user, token } = useAuth();
  const [data, setData] = useState(null);
  const [audienceData, setAudienceData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('studio'); // 'studio' | 'lead_magnets' | 'services' | 'revenue' | 'audience' | 'settings'
  const [message, setMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedRefCode, setCopiedRefCode] = useState(false);

  // Course Builder Drilldown
  const [selectedCourseId, setSelectedCourseId] = useState(null);
  const [courseDetails, setCourseDetails] = useState(null);
  const [loadingCourse, setLoadingCourse] = useState(false);

  // Modals state
  const [courseModal, setCourseModal] = useState({ isOpen: false, isEdit: false, data: null });
  const [sectionModal, setSectionModal] = useState({ isOpen: false, isEdit: false, data: null, courseId: null });
  const [lessonModal, setLessonModal] = useState({ isOpen: false, isEdit: false, data: null, sectionId: null, courseId: null });
  const [leadMagnetModal, setLeadMagnetModal] = useState({ isOpen: false, isEdit: false, data: null });
  const [serviceModal, setServiceModal] = useState({ isOpen: false, isEdit: false, data: null });

  // Settings form state
  const [settingsForm, setSettingsForm] = useState({
    headline: '',
    bio: '',
    custom_bio: '',
    monthly_price: '5',
    handle: '',
    tier: 'community_tutor',
    referral_code: '',
    external_links: {
      linkedin: '',
      youtube: '',
      twitter: '',
      github: ''
    }
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
            custom_bio: json.profile.custom_bio || '',
            monthly_price: (json.profile.monthly_price_cents / 100).toFixed(2),
            handle: json.profile.handle || '',
            tier: json.profile.tier || 'community_tutor',
            referral_code: json.profile.referral_code || '',
            external_links: {
              linkedin: json.profile.external_links?.linkedin || '',
              youtube: json.profile.external_links?.youtube || '',
              twitter: json.profile.external_links?.twitter || '',
              github: json.profile.external_links?.github || ''
            }
          });
        }
      }
    } catch (err) {
      console.error('Failed to load teacher stats:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadAudience = async () => {
    try {
      const res = await fetch('/api/teacher-dashboard/audience', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const json = await res.json();
        setAudienceData(json);
      }
    } catch (err) {
      console.error('Failed to load audience:', err);
    }
  };

  useEffect(() => {
    if (token) {
      loadOverview();
      loadAudience();
    }
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

  // --- LEAD MAGNET CRUD HANDLERS ---
  const handleSaveLeadMagnet = async (e) => {
    e.preventDefault();
    const { isEdit, data: form } = leadMagnetModal;
    setMessage('');
    setErrorMessage('');
    try {
      const url = isEdit
        ? `/api/teacher-dashboard/lead-magnets/${form.id}`
        : '/api/teacher-dashboard/lead-magnets';
      const method = isEdit ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(form)
      });

      if (res.ok) {
        setMessage(isEdit ? 'Lead magnet updated!' : 'Free lead magnet published!');
        setLeadMagnetModal({ isOpen: false, isEdit: false, data: null });
        loadOverview();
        loadAudience();
      } else {
        const err = await res.json();
        setErrorMessage(err.error || 'Failed to save lead magnet');
      }
    } catch (err) {
      setErrorMessage('Network error saving lead magnet');
    }
  };

  const handleDeleteLeadMagnet = async (id) => {
    if (!window.confirm('Delete this free lead magnet? Existing downloads will remain with students.')) return;
    try {
      const res = await fetch(`/api/teacher-dashboard/lead-magnets/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setMessage('Lead magnet deleted.');
        loadOverview();
        loadAudience();
      }
    } catch (err) {
      console.error('Delete lead magnet error:', err);
    }
  };

  // --- MICRO-SERVICES CRUD HANDLERS ---
  const handleSaveService = async (e) => {
    e.preventDefault();
    const { isEdit, data: form } = serviceModal;
    setMessage('');
    setErrorMessage('');
    try {
      const url = isEdit
        ? `/api/teacher-dashboard/services/${form.id}`
        : '/api/teacher-dashboard/services';
      const method = isEdit ? 'PUT' : 'POST';

      const payload = {
        title: form.title,
        service_type: form.service_type || 'quick_review',
        price_cents: Math.round(parseFloat(form.price_dollars || '10') * 100),
        duration_minutes: parseInt(form.duration_minutes || 20),
        is_active: form.is_active !== undefined ? form.is_active : true
      };

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setMessage(isEdit ? 'Service updated!' : 'Micro-service created successfully!');
        setServiceModal({ isOpen: false, isEdit: false, data: null });
        loadOverview();
      } else {
        const err = await res.json();
        setErrorMessage(err.error || 'Failed to save service');
      }
    } catch (err) {
      setErrorMessage('Network error saving service');
    }
  };

  const handleToggleService = async (service) => {
    try {
      const res = await fetch(`/api/teacher-dashboard/services/${service.id}/toggle`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        loadOverview();
      }
    } catch (err) {
      console.error('Toggle service error:', err);
    }
  };

  const handleDeleteService = async (id) => {
    if (!window.confirm('Are you sure you want to delete this service? Past bookings will remain recorded.')) return;
    try {
      const res = await fetch(`/api/teacher-dashboard/services/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setMessage('Service deleted.');
        loadOverview();
      }
    } catch (err) {
      console.error('Delete service error:', err);
    }
  };

  const handleUpdateBookingStatus = async (bookingId, newStatus) => {
    try {
      const res = await fetch(`/api/teacher-dashboard/service-bookings/${bookingId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        setMessage(`Booking status updated to ${newStatus}`);
        loadOverview();
        loadAudience();
      }
    } catch (err) {
      console.error('Update booking status error:', err);
    }
  };

  // --- CSV AUDIENCE EXPORT ---
  const handleExportCsv = async () => {
    try {
      const res = await fetch('/api/teacher/audience/export-csv', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to export CSV');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `korsa_audience_${user?.id || 'export'}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      setMessage('Audience CSV exported successfully! Includes all leads, subscribers, and clients.');
    } catch (err) {
      setErrorMessage('Failed to download audience CSV');
    }
  };

  // --- Copy Referral / Profile Links ---
  const handleCopyLink = () => {
    const handle = data?.profile?.handle || user?.name?.toLowerCase().replace(/\s+/g, '');
    const refCode = data?.profile?.referral_code || '';
    const link = `${window.location.origin}/@${handle}?ref=${refCode}`;
    navigator.clipboard.writeText(link);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleCopyRefCode = () => {
    const refCode = data?.profile?.referral_code || '';
    if (refCode) {
      navigator.clipboard.writeText(refCode);
      setCopiedRefCode(true);
      setTimeout(() => setCopiedRefCode(false), 2500);
    }
  };

  // --- Update Settings & Price ---
  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setSavingSettings(true);
    setErrorMessage('');
    setMessage('');
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
          custom_bio: settingsForm.custom_bio,
          monthly_price_cents: priceCents,
          handle: settingsForm.handle,
          tier: settingsForm.tier,
          referral_code: settingsForm.referral_code,
          external_links: settingsForm.external_links
        })
      });

      if (res.ok) {
        setMessage('Creator profile, vanity URL handle, tier, and subscription pricing saved successfully!');
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
        Loading Creator Studio & Analytics...
      </div>
    );
  }

  const stats = data?.stats || {};
  const courses = data?.courses || [];
  const subscribers = data?.subscribers || [];
  const payments = data?.payments || [];
  const leadMagnets = data?.lead_magnets || [];
  const services = data?.services || [];
  const serviceBookings = data?.service_bookings || [];
  const profile = data?.profile || {};
  const creatorHandle = profile.handle || '';

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
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem', flexWrap: 'wrap' }}>
              <span className="badge badge-role teacher">CREATOR STUDIO</span>
              <span className={`badge ${profile.tier === 'expert_creator' ? 'badge-primary' : 'badge-role'}`}>
                {profile.tier === 'expert_creator' ? 'EXPERT CREATOR' : 'COMMUNITY TUTOR'}
              </span>
              {creatorHandle && (
                <span style={{ fontSize: '0.85rem', color: 'var(--color-primary)', fontWeight: '600' }}>
                  /@{creatorHandle}
                </span>
              )}
              <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>{user?.name}</span>
            </div>
            <h1 style={{ fontSize: '1.85rem', fontWeight: '800', color: 'var(--color-secondary)' }}>
              Creator Flywheel Studio & Audience Monetization
            </h1>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            {creatorHandle && (
              <a
                href={`/@${creatorHandle}`}
                target="_blank"
                rel="noreferrer"
                className="btn btn-secondary btn-sm"
                style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', textDecoration: 'none' }}
              >
                <Eye size={16} /> Link-in-Bio Landing Page <ExternalLink size={13} />
              </a>
            )}
            <button 
              onClick={() => onSelectTeacher(user?.id)}
              className="btn btn-secondary btn-sm"
              style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
            >
              Classroom View
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

        {/* Top Analytics Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
          
          <div className="card" style={{ padding: '1.25rem' }}>
            <span style={{ fontSize: '0.825rem', color: 'var(--color-text-muted)', fontWeight: '600' }}>Active Subscribers</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.4rem' }}>
              <Users size={22} color="var(--color-primary)" />
              <span style={{ fontSize: '1.75rem', fontWeight: '800' }}>{stats.active_subscribers}</span>
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '4px', display: 'block' }}>
              @ ${stats.subscription_price} / mo per student
            </span>
          </div>

          <div className="card" style={{ padding: '1.25rem' }}>
            <span style={{ fontSize: '0.825rem', color: 'var(--color-text-muted)', fontWeight: '600' }}>Lead Magnets & Downloads</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.4rem' }}>
              <Download size={22} color="#0284c7" />
              <span style={{ fontSize: '1.75rem', fontWeight: '800' }}>{stats.total_downloads}</span>
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '4px', display: 'block' }}>
              Across {stats.total_lead_magnets} free resources
            </span>
          </div>

          <div className="card" style={{ padding: '1.25rem' }}>
            <span style={{ fontSize: '0.825rem', color: 'var(--color-text-muted)', fontWeight: '600' }}>Micro-Services Booked</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.4rem' }}>
              <Briefcase size={22} color="#8b5cf6" />
              <span style={{ fontSize: '1.75rem', fontWeight: '800' }}>{stats.total_bookings}</span>
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '4px', display: 'block' }}>
              {stats.total_services} active offerings ($5–$250)
            </span>
          </div>

          <div className="card" style={{ padding: '1.25rem', borderLeft: '4px solid var(--color-accent)' }}>
            <span style={{ fontSize: '0.825rem', color: 'var(--color-text-muted)', fontWeight: '600' }}>Gross Monthly Revenue</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.4rem' }}>
              <DollarSign size={22} color="var(--color-accent)" />
              <span style={{ fontSize: '1.75rem', fontWeight: '800', color: 'var(--color-accent)' }}>${stats.gross_monthly_revenue}</span>
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--color-accent)', fontWeight: '600', marginTop: '4px', display: 'block' }}>
              Keep 90% (97% on self-referred)
            </span>
          </div>

        </div>

        {/* Creator Referral Flywheel Bar */}
        <div style={{
          backgroundColor: '#eff6ff',
          border: '1px solid #bfdbfe',
          borderRadius: 'var(--radius-md)',
          padding: '1rem 1.25rem',
          marginBottom: '2rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Gift size={22} color="var(--color-primary)" />
            <div>
              <div style={{ fontWeight: '700', fontSize: '0.925rem', color: '#1e3a8a' }}>
                Creator Self-Referral Flywheel (Keep 97% Take-Rate)
              </div>
              <div style={{ fontSize: '0.8rem', color: '#3b82f6' }}>
                Students who sign up using your link only incur 3% platform commission instead of 10%.
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <button
              onClick={handleCopyRefCode}
              className="btn btn-secondary btn-sm"
              style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontFamily: 'monospace' }}
              title="Copy referral code"
            >
              {copiedRefCode ? <Check size={14} /> : <Copy size={14} />}
              Code: <strong>{profile.referral_code || 'CODE'}</strong>
            </button>
            <button
              onClick={handleCopyLink}
              className="btn btn-primary btn-sm"
              style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}
            >
              {copiedLink ? <Check size={14} /> : <Copy size={14} />}
              {copiedLink ? 'Link Copied!' : 'Copy Creator Share Link'}
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div style={{
          display: 'flex',
          gap: '0.5rem',
          borderBottom: '1px solid var(--color-border)',
          marginBottom: '2rem',
          overflowX: 'auto',
          whiteSpace: 'nowrap'
        }}>
          <button
            onClick={() => { setActiveTab('studio'); setSelectedCourseId(null); }}
            style={{
              padding: '0.75rem 1.1rem',
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
            onClick={() => setActiveTab('lead_magnets')}
            style={{
              padding: '0.75rem 1.1rem',
              fontWeight: activeTab === 'lead_magnets' ? '700' : '500',
              color: activeTab === 'lead_magnets' ? 'var(--color-primary)' : 'var(--color-text-muted)',
              borderBottom: activeTab === 'lead_magnets' ? '2px solid var(--color-primary)' : '2px solid transparent',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem'
            }}
          >
            <Download size={16} /> Lead Magnets ({leadMagnets.length})
          </button>
          <button
            onClick={() => setActiveTab('services')}
            style={{
              padding: '0.75rem 1.1rem',
              fontWeight: activeTab === 'services' ? '700' : '500',
              color: activeTab === 'services' ? 'var(--color-primary)' : 'var(--color-text-muted)',
              borderBottom: activeTab === 'services' ? '2px solid var(--color-primary)' : '2px solid transparent',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem'
            }}
          >
            <Briefcase size={16} /> Micro-Services ({services.length})
          </button>
          <button
            onClick={() => setActiveTab('revenue')}
            style={{
              padding: '0.75rem 1.1rem',
              fontWeight: activeTab === 'revenue' ? '700' : '500',
              color: activeTab === 'revenue' ? 'var(--color-primary)' : 'var(--color-text-muted)',
              borderBottom: activeTab === 'revenue' ? '2px solid var(--color-primary)' : '2px solid transparent',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem'
            }}
          >
            <Receipt size={16} /> Revenue & Economics ({payments.length})
          </button>
          <button
            onClick={() => setActiveTab('audience')}
            style={{
              padding: '0.75rem 1.1rem',
              fontWeight: activeTab === 'audience' ? '700' : '500',
              color: activeTab === 'audience' ? 'var(--color-primary)' : 'var(--color-text-muted)',
              borderBottom: activeTab === 'audience' ? '2px solid var(--color-primary)' : '2px solid transparent',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem'
            }}
          >
            <Users size={16} /> Audience CRM ({subscribers.length + stats.total_leads})
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            style={{
              padding: '0.75rem 1.1rem',
              fontWeight: activeTab === 'settings' ? '700' : '500',
              color: activeTab === 'settings' ? 'var(--color-primary)' : 'var(--color-text-muted)',
              borderBottom: activeTab === 'settings' ? '2px solid var(--color-primary)' : '2px solid transparent',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem'
            }}
          >
            <Settings size={16} /> Profile & Vanity URL
          </button>
        </div>

        {/* TAB 1: CONTENT STUDIO (COURSES, SECTIONS, LESSONS) */}
        {activeTab === 'studio' && (
          <div>
            {!selectedCourseId ? (
              /* All Courses Grid */
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.5rem' }}>
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

        {/* TAB 2: LEAD MAGNETS MANAGER */}
        {activeTab === 'lead_magnets' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.5rem' }}>
              <div>
                <h2 style={{ fontSize: '1.35rem', fontWeight: '800', color: 'var(--color-secondary)' }}>
                  Free Lead Magnets & Study Guides ({leadMagnets.length})
                </h2>
                <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', margin: 0 }}>
                  High-value cheat sheets and roadmaps that capture emails, auto-follow your channel, and feed your student funnel.
                </p>
              </div>

              <button
                onClick={() => setLeadMagnetModal({
                  isOpen: true,
                  isEdit: false,
                  data: { title: '', description: '', file_url: '' }
                })}
                className="btn btn-primary btn-sm"
                style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
              >
                <PlusCircle size={15} /> + Add Free Lead Magnet
              </button>
            </div>

            {leadMagnets.length === 0 ? (
              <div className="card" style={{ padding: '3rem', textAlign: 'center' }}>
                <Download size={40} color="var(--color-text-muted)" style={{ margin: '0 auto 1rem auto' }} />
                <h3 style={{ fontSize: '1.15rem', fontWeight: '700', marginBottom: '0.5rem' }}>No Lead Magnets Uploaded</h3>
                <p style={{ color: 'var(--color-text-muted)', marginBottom: '1.25rem', maxWidth: '480px', margin: '0 auto 1.25rem auto' }}>
                  Creators who offer 1–2 free high-yield PDFs get 5x more free student signups and convert 24% to paid subscriptions.
                </p>
                <button
                  onClick={() => setLeadMagnetModal({
                    isOpen: true,
                    isEdit: false,
                    data: { title: '', description: '', file_url: '' }
                  })}
                  className="btn btn-primary btn-sm"
                >
                  Create Your First Lead Magnet
                </button>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.25rem' }}>
                {leadMagnets.map((lm) => (
                  <div key={lm.id} className="card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                        <span className="badge badge-free">FREE LEAD MAGNET</span>
                        <span style={{ fontSize: '0.85rem', fontWeight: '800', color: '#0284c7', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                          <Download size={14} /> {lm.downloads_count || 0} downloads
                        </span>
                      </div>

                      <h3 style={{ fontSize: '1.15rem', fontWeight: '700', marginBottom: '0.4rem' }}>
                        {lm.title}
                      </h3>
                      <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', lineHeight: 1.5, marginBottom: '0.75rem' }}>
                        {lm.description || 'Downloadable study resource.'}
                      </p>

                      <div style={{ fontSize: '0.75rem', color: 'var(--color-primary)', wordBreak: 'break-all', backgroundColor: '#f8fafc', padding: '0.4rem 0.6rem', borderRadius: 'var(--radius-sm)', marginBottom: '1rem' }}>
                        Asset URL: {lm.file_url}
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '0.5rem', borderTop: '1px solid var(--color-border)', paddingTop: '0.85rem' }}>
                      <a
                        href={lm.file_url}
                        target="_blank"
                        rel="noreferrer"
                        className="btn btn-secondary btn-sm"
                        style={{ flex: 1, textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem' }}
                      >
                        <ExternalLink size={14} /> Test Link
                      </a>
                      <button
                        onClick={() => setLeadMagnetModal({ isOpen: true, isEdit: true, data: lm })}
                        className="btn btn-secondary btn-sm"
                      >
                        <Edit size={14} />
                      </button>
                      <button
                        onClick={() => handleDeleteLeadMagnet(lm.id)}
                        className="btn btn-danger btn-sm"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: MICRO-SERVICES CONFIGURATOR */}
        {activeTab === 'services' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.5rem' }}>
              <div>
                <h2 style={{ fontSize: '1.35rem', fontWeight: '800', color: 'var(--color-secondary)' }}>
                  Micro-Services & Direct 1-on-1 Offerings ({services.length})
                </h2>
                <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', margin: 0 }}>
                  Offer $5–$25 quick reviews, homework audits, or 30m Q&A sessions. Perfect for fast daily income.
                </p>
              </div>

              <button
                onClick={() => setServiceModal({
                  isOpen: true,
                  isEdit: false,
                  data: { title: '', service_type: 'quick_review', price_dollars: '15', duration_minutes: 20, is_active: true }
                })}
                className="btn btn-primary btn-sm"
                style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
              >
                <PlusCircle size={15} /> + Add Micro-Service
              </button>
            </div>

            {/* Configured Services Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem', marginBottom: '2.5rem' }}>
              {services.length === 0 ? (
                <div className="card" style={{ padding: '2.5rem', textAlign: 'center', gridColumn: '1 / -1' }}>
                  <p style={{ color: 'var(--color-text-muted)', marginBottom: '1rem' }}>No micro-services configured yet.</p>
                  <button
                    onClick={() => setServiceModal({
                      isOpen: true,
                      isEdit: false,
                      data: { title: '15-Min Code Review & Feedback', service_type: 'quick_review', price_dollars: '15', duration_minutes: 15, is_active: true }
                    })}
                    className="btn btn-primary btn-sm"
                  >
                    Add Sample Micro-Service ($15)
                  </button>
                </div>
              ) : (
                services.map((s) => (
                  <div key={s.id} className="card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                        <span className="badge" style={{ backgroundColor: '#f3e8ff', color: '#7e22ce' }}>
                          {s.service_type?.replace('_', ' ')}
                        </span>
                        <button
                          onClick={() => handleToggleService(s)}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                          title="Toggle Active/Inactive"
                        >
                          {s.is_active ? (
                            <span className="badge badge-free" style={{ cursor: 'pointer' }}>ACTIVE</span>
                          ) : (
                            <span className="badge badge-role" style={{ cursor: 'pointer' }}>PAUSED</span>
                          )}
                        </button>
                      </div>

                      <h3 style={{ fontSize: '1.15rem', fontWeight: '700', marginBottom: '0.3rem' }}>
                        {s.title}
                      </h3>

                      <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.4rem', marginTop: '0.5rem' }}>
                        <span style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--color-secondary)' }}>
                          ${s.price_dollars}
                        </span>
                        <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                          / {s.duration_minutes} minutes
                        </span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '0.5rem', borderTop: '1px solid var(--color-border)', paddingTop: '0.85rem', marginTop: '1rem' }}>
                      <button
                        onClick={() => setServiceModal({
                          isOpen: true,
                          isEdit: true,
                          data: { ...s, price_dollars: s.price_dollars }
                        })}
                        className="btn btn-secondary btn-sm"
                        style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem' }}
                      >
                        <Edit size={14} /> Edit Service
                      </button>
                      <button
                        onClick={() => handleDeleteService(s.id)}
                        className="btn btn-danger btn-sm"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Booked Client Orders Table */}
            <div style={{ marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: '800', color: 'var(--color-secondary)', marginBottom: '0.5rem' }}>
                Incoming Micro-Service Orders & Bookings ({serviceBookings.length})
              </h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                Sessions booked directly by students through your link-in-bio page.
              </p>
            </div>

            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
              {serviceBookings.length === 0 ? (
                <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                  No service bookings yet. Share your profile link to receive requests!
                </div>
              ) : (
                <div className="table-responsive">
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
                    <thead>
                      <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid var(--color-border)' }}>
                        <th style={{ padding: '0.85rem 1rem', color: 'var(--color-text-muted)' }}>Booking</th>
                        <th style={{ padding: '0.85rem 1rem', color: 'var(--color-text-muted)' }}>Student</th>
                        <th style={{ padding: '0.85rem 1rem', color: 'var(--color-text-muted)' }}>Service</th>
                        <th style={{ padding: '0.85rem 1rem', color: 'var(--color-text-muted)' }}>Price</th>
                        <th style={{ padding: '0.85rem 1rem', color: 'var(--color-text-muted)' }}>Status</th>
                        <th style={{ padding: '0.85rem 1rem', color: 'var(--color-text-muted)' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {serviceBookings.map((b) => (
                        <tr key={b.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                          <td style={{ padding: '0.85rem 1rem', fontFamily: 'monospace', fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                            #{b.id}
                          </td>
                          <td style={{ padding: '0.85rem 1rem' }}>
                            <span style={{ fontWeight: '600' }}>{b.student_name}</span>
                            <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{b.student_email}</span>
                            {b.student_notes && (
                              <span style={{ display: 'block', fontSize: '0.75rem', color: '#64748b', fontStyle: 'italic', marginTop: '2px' }}>
                                "{b.student_notes}"
                              </span>
                            )}
                          </td>
                          <td style={{ padding: '0.85rem 1rem', fontWeight: '600' }}>
                            {b.service_title}
                            <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--color-text-muted)', fontWeight: '400' }}>
                              {b.duration_minutes}m duration
                            </span>
                          </td>
                          <td style={{ padding: '0.85rem 1rem', fontWeight: '700', color: 'var(--color-accent)' }}>
                            ${b.price_dollars}
                          </td>
                          <td style={{ padding: '0.85rem 1rem' }}>
                            <span className={`badge ${b.status === 'completed' ? 'badge-free' : b.status === 'confirmed' ? 'badge-primary' : 'badge-role'}`} style={{ textTransform: 'uppercase' }}>
                              {b.status || 'PENDING'}
                            </span>
                          </td>
                          <td style={{ padding: '0.85rem 1rem' }}>
                            <div style={{ display: 'flex', gap: '0.35rem' }}>
                              {b.status !== 'completed' && (
                                <button
                                  onClick={() => handleUpdateBookingStatus(b.id, 'completed')}
                                  className="btn btn-secondary btn-sm"
                                  style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}
                                >
                                  Complete
                                </button>
                              )}
                              {b.status === 'pending' && (
                                <button
                                  onClick={() => handleUpdateBookingStatus(b.id, 'confirmed')}
                                  className="btn btn-primary btn-sm"
                                  style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}
                                >
                                  Confirm
                                </button>
                              )}
                            </div>
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

        {/* TAB 4: REVENUE & CREATOR ECONOMICS */}
        {activeTab === 'revenue' && (
          <div>
            <div style={{ marginBottom: '1.75rem' }}>
              <h2 style={{ fontSize: '1.35rem', fontWeight: '800', color: 'var(--color-secondary)', marginBottom: '0.35rem' }}>
                Creator Economics & Revenue Breakdown
              </h2>
              <p style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>
                Transparent pricing model designed to reward creators who bring their own audience.
              </p>
            </div>

            {/* Split Comparison Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
              <div className="card" style={{ padding: '1.5rem', borderTop: '4px solid #3b82f6' }}>
                <span className="badge" style={{ backgroundColor: '#eff6ff', color: '#1d4ed8', marginBottom: '0.5rem' }}>
                  STANDARD PLATFORM AUDIENCE
                </span>
                <h3 style={{ fontSize: '1.25rem', fontWeight: '800', margin: '0.25rem 0' }}>90% Creator / 10% Korsa</h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', lineHeight: 1.5, marginTop: '0.4rem' }}>
                  Students discovered via organic search on the Korsa marketplace pay the standard 10% platform service fee to support video hosting and streaming bandwidth.
                </p>
              </div>

              <div className="card" style={{ padding: '1.5rem', borderTop: '4px solid #10b981', backgroundColor: '#f0fdf4' }}>
                <span className="badge" style={{ backgroundColor: '#dcfce7', color: '#15803d', marginBottom: '0.5rem' }}>
                  SELF-REFERRED VIRAL FLYWHEEL
                </span>
                <h3 style={{ fontSize: '1.25rem', fontWeight: '800', color: '#15803d', margin: '0.25rem 0' }}>97% Creator / 3% Korsa</h3>
                <p style={{ fontSize: '0.85rem', color: '#166534', lineHeight: 1.5, marginTop: '0.4rem' }}>
                  When students subscribe or book micro-services using your personal vanity link or code, our cut drops to just 3% (to cover card processing). You keep 97%!
                </p>
              </div>
            </div>

            {/* Ledger */}
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
                        <th style={{ padding: '0.85rem 1rem', color: 'var(--color-text-muted)' }}>Platform Fee</th>
                        <th style={{ padding: '0.85rem 1rem', color: 'var(--color-text-muted)' }}>Your Net Earnings</th>
                        <th style={{ padding: '0.85rem 1rem', color: 'var(--color-text-muted)' }}>Status</th>
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
                            <span className="badge badge-free" style={{ fontSize: '0.7rem' }}>SETTLED</span>
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

        {/* TAB 5: AUDIENCE CRM & RFC-4180 CSV EXPORT */}
        {activeTab === 'audience' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <h2 style={{ fontSize: '1.35rem', fontWeight: '800', color: 'var(--color-secondary)' }}>
                  Audience & Subscriber Ownership CRM
                </h2>
                <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', margin: 0 }}>
                  You own your student relationships. Export your complete email list anytime as standard RFC-4180 CSV.
                </p>
              </div>

              <button
                onClick={handleExportCsv}
                className="btn btn-primary"
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', boxShadow: '0 4px 12px rgba(99, 102, 241, 0.25)' }}
              >
                <Download size={16} /> Export Audience CSV
              </button>
            </div>

            {/* Audience metrics */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
              <div className="card" style={{ padding: '1rem 1.25rem' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Subscribers</span>
                <div style={{ fontSize: '1.5rem', fontWeight: '800', marginTop: '0.2rem' }}>
                  {audienceData?.totals?.total_subscribers || subscribers.length}
                </div>
              </div>
              <div className="card" style={{ padding: '1rem 1.25rem' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Free Leads (Downloads)</span>
                <div style={{ fontSize: '1.5rem', fontWeight: '800', marginTop: '0.2rem' }}>
                  {audienceData?.totals?.total_leads || stats.total_leads || 0}
                </div>
              </div>
              <div className="card" style={{ padding: '1rem 1.25rem' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Service Clients</span>
                <div style={{ fontSize: '1.5rem', fontWeight: '800', marginTop: '0.2rem' }}>
                  {audienceData?.totals?.total_clients || serviceBookings.length}
                </div>
              </div>
              <div className="card" style={{ padding: '1rem 1.25rem' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--color-accent)', textTransform: 'uppercase' }}>Total Unique Reach</span>
                <div style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--color-accent)', marginTop: '0.2rem' }}>
                  {audienceData?.totals?.total_unique || subscribers.length + (stats.total_leads || 0)}
                </div>
              </div>
            </div>

            {/* Unified audience table */}
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
              <div className="table-responsive">
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid var(--color-border)' }}>
                      <th style={{ padding: '0.85rem 1.25rem', color: 'var(--color-text-muted)' }}>Student Name</th>
                      <th style={{ padding: '0.85rem 1.25rem', color: 'var(--color-text-muted)' }}>Email Address</th>
                      <th style={{ padding: '0.85rem 1.25rem', color: 'var(--color-text-muted)' }}>Relationship</th>
                      <th style={{ padding: '0.85rem 1.25rem', color: 'var(--color-text-muted)' }}>Acquired Date</th>
                      <th style={{ padding: '0.85rem 1.25rem', color: 'var(--color-text-muted)' }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {/* Render subscribers */}
                    {subscribers.map((s) => (
                      <tr key={`sub-${s.subscription_id}`} style={{ borderBottom: '1px solid var(--color-border)' }}>
                        <td style={{ padding: '0.85rem 1.25rem', display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                          <img 
                            src={s.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${s.student_name}`} 
                            alt={s.student_name}
                            style={{ width: '32px', height: '32px', borderRadius: 'var(--radius-full)', objectFit: 'cover' }}
                          />
                          <span style={{ fontWeight: '600' }}>{s.student_name}</span>
                        </td>
                        <td style={{ padding: '0.85rem 1.25rem', color: 'var(--color-text-muted)' }}>{s.email}</td>
                        <td style={{ padding: '0.85rem 1.25rem' }}>
                          <span className="badge badge-free">SUBSCRIBER</span>
                        </td>
                        <td style={{ padding: '0.85rem 1.25rem', color: 'var(--color-text-muted)' }}>{s.started_at?.split(' ')[0]}</td>
                        <td style={{ padding: '0.85rem 1.25rem' }}>
                          <span className="badge badge-free">ACTIVE</span>
                        </td>
                      </tr>
                    ))}

                    {/* Render service bookings */}
                    {serviceBookings.map((b) => (
                      <tr key={`svc-${b.id}`} style={{ borderBottom: '1px solid var(--color-border)' }}>
                        <td style={{ padding: '0.85rem 1.25rem', fontWeight: '600' }}>{b.student_name}</td>
                        <td style={{ padding: '0.85rem 1.25rem', color: 'var(--color-text-muted)' }}>{b.student_email}</td>
                        <td style={{ padding: '0.85rem 1.25rem' }}>
                          <span className="badge" style={{ backgroundColor: '#f3e8ff', color: '#7e22ce' }}>MICRO-SERVICE</span>
                        </td>
                        <td style={{ padding: '0.85rem 1.25rem', color: 'var(--color-text-muted)' }}>{b.created_at?.split(' ')[0]}</td>
                        <td style={{ padding: '0.85rem 1.25rem' }}>
                          <span className="badge badge-role">{b.status}</span>
                        </td>
                      </tr>
                    ))}

                    {subscribers.length === 0 && serviceBookings.length === 0 && (
                      <tr>
                        <td colSpan={5} style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                          No students in audience yet. Share your free lead magnets and link-in-bio URL!
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 6: PROFILE, VANITY URL & PRICING SETTINGS */}
        {activeTab === 'settings' && (
          <div className="card" style={{ maxWidth: '720px', padding: '2rem' }}>
            <h2 style={{ fontSize: '1.35rem', fontWeight: '800', marginBottom: '0.5rem' }}>
              Creator Profile, Vanity URL & Monetization
            </h2>
            <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', marginBottom: '1.5rem' }}>
              Configure your clean vanity handle (e.g. /@username), creator tier, monthly price, and social links.
            </p>

            <form onSubmit={handleSaveSettings}>
              {/* Vanity Handle */}
              <div className="form-group">
                <label className="form-label">Custom Vanity Handle (Clean URL)</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <span style={{ fontWeight: '700', fontSize: '1.1rem', color: 'var(--color-primary)' }}>@</span>
                  <input
                    type="text"
                    required
                    pattern="[a-zA-Z0-9_\-]+"
                    className="form-input"
                    placeholder="e.g. jordan, sarah_dev"
                    value={settingsForm.handle}
                    onChange={(e) => setSettingsForm({ ...settingsForm, handle: e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, '') })}
                  />
                </div>
                <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '4px', display: 'block' }}>
                  Your public Link-in-Bio URL: <strong>{window.location.origin}/@{settingsForm.handle || 'username'}</strong>
                </span>
              </div>

              {/* Creator Tier */}
              <div className="form-group">
                <label className="form-label">Creator Tier</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div
                    onClick={() => setSettingsForm({ ...settingsForm, tier: 'community_tutor' })}
                    style={{
                      padding: '0.85rem',
                      borderRadius: 'var(--radius-md)',
                      border: `2px solid ${settingsForm.tier === 'community_tutor' ? 'var(--color-primary)' : 'var(--color-border)'}`,
                      backgroundColor: settingsForm.tier === 'community_tutor' ? '#eff6ff' : '#ffffff',
                      cursor: 'pointer'
                    }}
                  >
                    <div style={{ fontWeight: '700', fontSize: '0.9rem' }}>Community Tutor</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                      Entry-level tutoring, micro-reviews, homework checks
                    </div>
                  </div>

                  <div
                    onClick={() => setSettingsForm({ ...settingsForm, tier: 'expert_creator' })}
                    style={{
                      padding: '0.85rem',
                      borderRadius: 'var(--radius-md)',
                      border: `2px solid ${settingsForm.tier === 'expert_creator' ? 'var(--color-primary)' : 'var(--color-border)'}`,
                      backgroundColor: settingsForm.tier === 'expert_creator' ? '#eff6ff' : '#ffffff',
                      cursor: 'pointer'
                    }}
                  >
                    <div style={{ fontWeight: '700', fontSize: '0.9rem' }}>Expert Creator</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                      Senior coach, masterclass curriculum & high-earning independent creator
                    </div>
                  </div>
                </div>
              </div>

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
                <label className="form-label">Short Bio (Overview)</label>
                <textarea
                  rows={3}
                  required
                  className="form-input"
                  placeholder="Describe your background and what students will master..."
                  value={settingsForm.bio}
                  onChange={(e) => setSettingsForm({ ...settingsForm, bio: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Extended Custom Bio (Landing Page Story)</label>
                <textarea
                  rows={4}
                  className="form-input"
                  placeholder="Deep dive into your achievements, testimonials, and coaching credentials..."
                  value={settingsForm.custom_bio}
                  onChange={(e) => setSettingsForm({ ...settingsForm, custom_bio: e.target.value })}
                />
              </div>

              {/* External Links */}
              <div className="form-group">
                <label className="form-label">Social & Portfolio Links (JSON format)</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div>
                    <label style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>LinkedIn</label>
                    <input
                      type="url"
                      className="form-input"
                      placeholder="https://linkedin.com/in/..."
                      value={settingsForm.external_links?.linkedin || ''}
                      onChange={(e) => setSettingsForm({
                        ...settingsForm,
                        external_links: { ...settingsForm.external_links, linkedin: e.target.value }
                      })}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>YouTube</label>
                    <input
                      type="url"
                      className="form-input"
                      placeholder="https://youtube.com/@..."
                      value={settingsForm.external_links?.youtube || ''}
                      onChange={(e) => setSettingsForm({
                        ...settingsForm,
                        external_links: { ...settingsForm.external_links, youtube: e.target.value }
                      })}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>X (Twitter)</label>
                    <input
                      type="url"
                      className="form-input"
                      placeholder="https://x.com/..."
                      value={settingsForm.external_links?.twitter || ''}
                      onChange={(e) => setSettingsForm({
                        ...settingsForm,
                        external_links: { ...settingsForm.external_links, twitter: e.target.value }
                      })}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>GitHub</label>
                    <input
                      type="url"
                      className="form-input"
                      placeholder="https://github.com/..."
                      value={settingsForm.external_links?.github || ''}
                      onChange={(e) => setSettingsForm({
                        ...settingsForm,
                        external_links: { ...settingsForm.external_links, github: e.target.value }
                      })}
                    />
                  </div>
                </div>
              </div>

              {/* Referral code & Price */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Referral Code (3% fee on self-referred)</label>
                  <input
                    type="text"
                    className="form-input"
                    value={settingsForm.referral_code}
                    onChange={(e) => setSettingsForm({ ...settingsForm, referral_code: e.target.value.toUpperCase().replace(/[^A-Z0-9_-]/g, '') })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Monthly Subscription ($ USD)</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <span style={{ fontWeight: '700', fontSize: '1.1rem' }}>$</span>
                    <input
                      type="number"
                      min="1"
                      max="200"
                      step="0.5"
                      required
                      className="form-input"
                      value={settingsForm.monthly_price}
                      onChange={(e) => setSettingsForm({ ...settingsForm, monthly_price: e.target.value })}
                    />
                    <span style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>/mo</span>
                  </div>
                </div>
              </div>

              <button type="submit" disabled={savingSettings} className="btn btn-primary" style={{ marginTop: '0.5rem', width: '100%' }}>
                {savingSettings ? 'Saving Profile...' : 'Save Creator Settings'}
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

        {/* MODAL: Lead Magnet Create / Edit */}
        {leadMagnetModal.isOpen && (
          <div className="modal-overlay" onClick={() => setLeadMagnetModal({ isOpen: false, isEdit: false, data: null })}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3 style={{ fontSize: '1.2rem', fontWeight: '700' }}>
                  {leadMagnetModal.isEdit ? 'Edit Lead Magnet' : 'Create Free Lead Magnet'}
                </h3>
                <button onClick={() => setLeadMagnetModal({ isOpen: false, isEdit: false, data: null })}>✕</button>
              </div>
              <form onSubmit={handleSaveLeadMagnet} className="modal-body">
                <div className="form-group">
                  <label className="form-label">Title (e.g. Cheat Sheet, Exam Formula Guide)</label>
                  <input
                    type="text"
                    required
                    className="form-input"
                    placeholder="e.g. Complete Calculus Formula Sheet & Exam Checklist"
                    value={leadMagnetModal.data?.title || ''}
                    onChange={(e) => setLeadMagnetModal({
                      ...leadMagnetModal,
                      data: { ...leadMagnetModal.data, title: e.target.value }
                    })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Description (What will students gain?)</label>
                  <textarea
                    rows={3}
                    className="form-input"
                    placeholder="Instant 5-page PDF summary with high-yield exam tips and practice problems..."
                    value={leadMagnetModal.data?.description || ''}
                    onChange={(e) => setLeadMagnetModal({
                      ...leadMagnetModal,
                      data: { ...leadMagnetModal.data, description: e.target.value }
                    })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Downloadable Asset URL (PDF, Notion, Drive, GitHub)</label>
                  <input
                    type="url"
                    required
                    className="form-input"
                    placeholder="https://drive.google.com/... or https://example.com/guide.pdf"
                    value={leadMagnetModal.data?.file_url || ''}
                    onChange={(e) => setLeadMagnetModal({
                      ...leadMagnetModal,
                      data: { ...leadMagnetModal.data, file_url: e.target.value }
                    })}
                  />
                </div>

                <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '0.5rem' }}>
                  {leadMagnetModal.isEdit ? 'Save Changes' : 'Publish Lead Magnet'}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* MODAL: Micro-Service Create / Edit */}
        {serviceModal.isOpen && (
          <div className="modal-overlay" onClick={() => setServiceModal({ isOpen: false, isEdit: false, data: null })}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3 style={{ fontSize: '1.2rem', fontWeight: '700' }}>
                  {serviceModal.isEdit ? 'Edit Micro-Service' : 'Add Micro-Service / 1-on-1'}
                </h3>
                <button onClick={() => setServiceModal({ isOpen: false, isEdit: false, data: null })}>✕</button>
              </div>
              <form onSubmit={handleSaveService} className="modal-body">
                <div className="form-group">
                  <label className="form-label">Offering Title</label>
                  <input
                    type="text"
                    required
                    className="form-input"
                    placeholder="e.g. 15-Min Homework Audit & Error Correction"
                    value={serviceModal.data?.title || ''}
                    onChange={(e) => setServiceModal({
                      ...serviceModal,
                      data: { ...serviceModal.data, title: e.target.value }
                    })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Service Type</label>
                  <select
                    className="form-input"
                    value={serviceModal.data?.service_type || 'quick_review'}
                    onChange={(e) => setServiceModal({
                      ...serviceModal,
                      data: { ...serviceModal.data, service_type: e.target.value }
                    })}
                  >
                    <option value="quick_review">Quick Review (Asynchronous feedback / code check)</option>
                    <option value="qa_session">Live Q&A Session (15–30 min video/chat call)</option>
                    <option value="mentorship">Mentorship & Study Plan Coaching</option>
                  </select>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label className="form-label">Price ($ USD)</label>
                    <input
                      type="number"
                      min="5"
                      max="500"
                      step="1"
                      required
                      className="form-input"
                      value={serviceModal.data?.price_dollars || '15'}
                      onChange={(e) => setServiceModal({
                        ...serviceModal,
                        data: { ...serviceModal.data, price_dollars: e.target.value }
                      })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Duration (minutes)</label>
                    <input
                      type="number"
                      min="10"
                      max="120"
                      step="5"
                      required
                      className="form-input"
                      value={serviceModal.data?.duration_minutes || 20}
                      onChange={(e) => setServiceModal({
                        ...serviceModal,
                        data: { ...serviceModal.data, duration_minutes: e.target.value }
                      })}
                    />
                  </div>
                </div>

                <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '0.5rem' }}>
                  {serviceModal.isEdit ? 'Save Service' : 'Publish Micro-Service'}
                </button>
              </form>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
