import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { createWhatsAppTeacherToStudentUrl } from '../utils/whatsapp';
import { 
  Users, 
  BookOpen, 
  PlusCircle, 
  CheckCircle2, 
  AlertCircle,
  Video,
  Edit,
  Trash2,
  Calendar,
  Download,
  Copy,
  Check,
  ExternalLink,
  Clock,
  Phone,
  Eye,
  Settings,
  ShieldCheck,
  Zap,
  ArrowLeft,
  ChevronRight,
  FileText,
  Key,
  Printer,
  Sparkles,
  Lock,
  Globe,
  X
} from 'lucide-react';

const WhatsAppIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.149.929 3.182 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.771-5.768-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.299.045-.677.063-1.092-.069-.252-.08-.575-.187-.988-.365-1.739-.751-2.874-2.502-2.961-2.617-.087-.116-.708-.94-.708-1.793s.448-1.273.607-1.446c.159-.173.346-.217.462-.217l.332.006c.106.005.249-.04.39.298.144.347.491 1.2.534 1.287.043.087.072.188.014.304-.058.116-.087.188-.173.289l-.26.304c-.087.086-.177.18-.076.354.101.174.449.741.964 1.201.662.591 1.221.774 1.394.86.173.086.274.072.376-.043.101-.116.433-.506.549-.68.116-.173.231-.145.39-.087s1.011.477 1.184.564.289.13.332.203c.043.072.043.419-.101.824z"/>
    <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 1.89.525 3.66 1.438 5.168L2.05 21.65a.75.75 0 0 0 .927.927l4.482-1.388A9.96 9.96 0 0 0 12 22c5.523 0 10-4.477 10-10S17.523 2 12 2zm-8.5 10c0-4.694 3.806-8.5 8.5-8.5s8.5 3.806 8.5 8.5-3.806 8.5-8.5 8.5a8.47 8.47 0 0 1-4.298-1.164.75.75 0 0 0-.49-.082l-3.268 1.012 1.012-3.268a.75.75 0 0 0-.082-.49A8.47 8.47 0 0 1 3.5 12z"/>
  </svg>
);

export default function TeacherDashboard({ onSelectTeacher, onSelectCreator }) {
  const { user, token } = useAuth();
  const { t, isRTL } = useLanguage();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('bookings'); // 'bookings' | 'guides' | 'payouts' | 'courses'
  const [message, setMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);

  // Course Builder Drilldown
  const [selectedCourseId, setSelectedCourseId] = useState(null);
  const [courseDetails, setCourseDetails] = useState(null);
  const [loadingCourse, setLoadingCourse] = useState(false);

  // Modals state
  const [courseModal, setCourseModal] = useState({ isOpen: false, isEdit: false, data: null });
  const [sectionModal, setSectionModal] = useState({ isOpen: false, isEdit: false, data: null, courseId: null });
  const [lessonModal, setLessonModal] = useState({ isOpen: false, isEdit: false, data: null, sectionId: null, courseId: null });
  const [guideModal, setGuideModal] = useState({ isOpen: false, isEdit: false, data: null });
  const [serviceModal, setServiceModal] = useState({ isOpen: false, isEdit: false, data: null });

  // Settings & CLIQ Form state
  const [settingsForm, setSettingsForm] = useState({
    headline: '',
    bio: '',
    custom_bio: '',
    monthly_price: '10',
    handle: '',
    cliq_alias: '',
    bank_name: '',
    wallet_phone: '',
    external_links: {
      linkedin: '',
      youtube: '',
      twitter: ''
    }
  });
  const [savingSettings, setSavingSettings] = useState(false);

  // Access Codes State
  const [codesData, setCodesData] = useState({ codes: [], batches: [], stats: {} });
  const [loadingCodes, setLoadingCodes] = useState(false);
  const [generateCodeModal, setGenerateCodeModal] = useState({ isOpen: false, count: 10, price_jod: 10, batch_name: '' });
  const [generatingCodes, setGeneratingCodes] = useState(false);
  const [filterBatch, setFilterBatch] = useState('all');
  const [copiedCode, setCopiedCode] = useState(null);
  const [allCopied, setAllCopied] = useState(false);

  // Feed & Posts State
  const [postsData, setPostsData] = useState([]);
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [postModal, setPostModal] = useState({
    isOpen: false,
    isEdit: false,
    data: { title: '', content: '', media_url: '', attachments: [], visibility: 'public' }
  });
  const [savingPost, setSavingPost] = useState(false);

  // Load teacher overview data
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
            monthly_price: (json.profile.monthly_price_cents / 100).toFixed(0),
            handle: json.profile.handle || '',
            cliq_alias: json.profile.cliq_alias || '',
            bank_name: json.profile.bank_name || '',
            wallet_phone: json.profile.wallet_phone || '',
            external_links: {
              linkedin: json.profile.external_links?.linkedin || '',
              youtube: json.profile.external_links?.youtube || '',
              twitter: json.profile.external_links?.twitter || ''
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

  const loadCodes = async () => {
    setLoadingCodes(true);
    try {
      const res = await fetch('/api/codes/teacher', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const json = await res.json();
        setCodesData(json);
      }
    } catch (err) {
      console.error('Failed to load access codes:', err);
    } finally {
      setLoadingCodes(false);
    }
  };

  const loadTeacherPosts = async (teacherId) => {
    const targetId = teacherId || user?.id;
    if (!targetId) return;
    setLoadingPosts(true);
    try {
      const res = await fetch(`/api/posts/teacher/${targetId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const json = await res.json();
        setPostsData(json.posts || []);
      }
    } catch (err) {
      console.error('Failed to load posts:', err);
    } finally {
      setLoadingPosts(false);
    }
  };

  useEffect(() => {
    if (token) {
      loadOverview();
      loadCodes();
      if (user?.id) {
        loadTeacherPosts(user.id);
      }
    }
  }, [token, user?.id]);

  const handleGenerateCodes = async (e) => {
    e.preventDefault();
    setGeneratingCodes(true);
    try {
      const res = await fetch('/api/codes/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          count: parseInt(generateCodeModal.count, 10) || 1,
          price_jod: parseFloat(generateCodeModal.price_jod) || 10,
          batch_name: generateCodeModal.batch_name || 'Bookshop Batch'
        })
      });
      if (res.ok) {
        const json = await res.json();
        setMessage(`Successfully generated ${json.count} prepaid codes for ${json.batch_name}!`);
        setGenerateCodeModal({ isOpen: false, count: 10, price_jod: 10, batch_name: '' });
        loadCodes();
      } else {
        const err = await res.json();
        setErrorMessage(err.error || 'Failed to generate codes');
      }
    } catch (err) {
      setErrorMessage('Network error generating codes');
    } finally {
      setGeneratingCodes(false);
    }
  };

  const handleCopyCode = (code) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2500);
  };

  const handleCopyAllCodes = () => {
    const filtered = filterBatch === 'all' 
      ? (codesData?.codes || [])
      : (codesData?.codes || []).filter(c => c.batch_name === filterBatch);
    const textList = filtered.map(c => `${c.code} (${c.price_jod} JOD - ${c.status})`).join('\n');
    navigator.clipboard.writeText(textList);
    setAllCopied(true);
    setTimeout(() => setAllCopied(false), 2500);
  };

  const handleExportCsv = async () => {
    try {
      const res = await fetch('/api/codes/teacher/export-csv', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `korsa-access-codes-${new Date().toISOString().slice(0, 10)}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }
    } catch (err) {
      console.error('CSV export failed:', err);
    }
  };

  const handlePrintCodes = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    const filtered = filterBatch === 'all' 
      ? (codesData?.codes || [])
      : (codesData?.codes || []).filter(c => c.batch_name === filterBatch);

    printWindow.document.write(`
      <!DOCTYPE html>
      <html dir="${isRTL ? 'rtl' : 'ltr'}">
      <head>
        <title>Korsa Prepaid Voucher Cards</title>
        <style>
          body { font-family: sans-serif; margin: 20px; color: #1e293b; }
          .grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; }
          .card { border: 2px dashed #0284c7; border-radius: 8px; padding: 16px; background: #f0f9ff; text-align: center; }
          .header { font-weight: 800; font-size: 16px; color: #0369a1; margin-bottom: 4px; }
          .sub { font-size: 12px; color: #64748b; margin-bottom: 12px; }
          .code { font-family: monospace; font-size: 18px; font-weight: 800; letter-spacing: 2px; background: #fff; padding: 8px 12px; border: 1px solid #cbd5e1; border-radius: 4px; display: inline-block; margin: 8px 0; color: #0f172a; }
          .footer { font-size: 11px; color: #64748b; margin-top: 8px; }
          @media print { button { display: none; } }
        </style>
      </head>
      <body>
        <div style="text-align: center; margin-bottom: 20px;">
          <h2>Korsa Prepaid Access Cards (بطاقات اشتراك منصة كورسا)</h2>
          <p>Teacher: ${data?.profile?.name || user?.name || ''} · 30-Day Full Access</p>
          <button onclick="window.print()" style="padding: 8px 16px; background: #0284c7; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: bold;">Print Now (طباعة)</button>
        </div>
        <div class="grid">
          ${filtered.map(c => `
            <div class="card">
              <div class="header">KORSA (كورسا) - 30-Day Subscription</div>
              <div class="sub">${c.batch_name || 'Bookshop Voucher'} · Value: ${c.price_jod} JOD</div>
              <div class="code">${c.code}</div>
              <div class="footer">Redeem at korsa.app/@${data?.profile?.handle || ''} · Single use voucher</div>
            </div>
          `).join('')}
        </div>
      </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handleSavePost = async (e) => {
    e.preventDefault();
    setSavingPost(true);
    try {
      const postData = postModal.data;
      const isEdit = postModal.isEdit;
      const url = isEdit ? `/api/posts/${postData.id}` : '/api/posts';
      const method = isEdit ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(postData)
      });

      if (res.ok) {
        setMessage(isEdit ? 'Post updated!' : 'Post published to your feed!');
        setPostModal({ isOpen: false, isEdit: false, data: null });
        loadTeacherPosts(user?.id);
      } else {
        const err = await res.json();
        setErrorMessage(err.error || 'Failed to publish post');
      }
    } catch (err) {
      setErrorMessage('Network error publishing post');
    } finally {
      setSavingPost(false);
    }
  };

  const handleDeletePost = async (postId) => {
    if (!window.confirm('Are you sure you want to delete this post?')) return;
    try {
      const res = await fetch(`/api/posts/${postId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setMessage('Post deleted.');
        loadTeacherPosts(user?.id);
      } else {
        const err = await res.json();
        setErrorMessage(err.error || 'Failed to delete post');
      }
    } catch (err) {
      setErrorMessage('Network error deleting post');
    }
  };

  // Load course details
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
      console.error('Failed to load course details:', err);
    } finally {
      setLoadingCourse(false);
    }
  };

  const handleOpenCourseBuilder = (courseId) => {
    setSelectedCourseId(courseId);
    loadCourseFull(courseId);
  };

  // --- Confirm Student CLIQ Payment ---
  const handleConfirmPayment = async (bookingId) => {
    setMessage('');
    setErrorMessage('');
    try {
      const res = await fetch(`/api/teacher-dashboard/service-bookings/${bookingId}/confirm-payment`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        setMessage('Payment confirmed! The session is now officially confirmed.');
        loadOverview();
      } else {
        const err = await res.json();
        setErrorMessage(err.error || 'Failed to confirm payment');
      }
    } catch (err) {
      setErrorMessage('Network error confirming payment');
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
      }
    } catch (err) {
      console.error('Update booking status error:', err);
    }
  };

  // --- Study Guide CRUD Handlers ---
  const handleSaveGuide = async (e) => {
    e.preventDefault();
    const { isEdit, data: guideData } = guideModal;
    try {
      const url = isEdit
        ? `/api/teacher-dashboard/lead-magnets/${guideData.id}`
        : '/api/teacher-dashboard/lead-magnets';
      const method = isEdit ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(guideData)
      });

      if (res.ok) {
        setMessage(isEdit ? 'Study guide updated!' : 'Free study guide published!');
        setGuideModal({ isOpen: false, isEdit: false, data: null });
        loadOverview();
      } else {
        const err = await res.json();
        setErrorMessage(err.error || 'Failed to save study guide');
      }
    } catch (err) {
      setErrorMessage('Network error saving study guide');
    }
  };

  const handleDeleteGuide = async (id) => {
    if (!window.confirm('Delete this study guide?')) return;
    try {
      const res = await fetch(`/api/teacher-dashboard/lead-magnets/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setMessage('Study guide deleted.');
        loadOverview();
      }
    } catch (err) {
      console.error('Delete guide error:', err);
    }
  };

  // --- 1-on-1 Service CRUD Handlers ---
  const handleSaveService = async (e) => {
    e.preventDefault();
    const { isEdit, data: srvData } = serviceModal;
    try {
      const url = isEdit
        ? `/api/teacher-dashboard/services/${srvData.id}`
        : '/api/teacher-dashboard/services';
      const method = isEdit ? 'PUT' : 'POST';

      const priceCents = Math.round(parseFloat(srvData.price_jod || srvData.price || '10') * 100);
      const payload = {
        ...srvData,
        price_cents: priceCents
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
        setMessage(isEdit ? 'Session updated!' : '1-on-1 session offering created!');
        setServiceModal({ isOpen: false, isEdit: false, data: null });
        loadOverview();
      } else {
        const err = await res.json();
        setErrorMessage(err.error || 'Failed to save offering');
      }
    } catch (err) {
      setErrorMessage('Network error saving offering');
    }
  };

  const handleDeleteService = async (id) => {
    if (!window.confirm('Delete this offering?')) return;
    try {
      const res = await fetch(`/api/teacher-dashboard/services/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setMessage('Offering removed.');
        loadOverview();
      }
    } catch (err) {
      console.error('Delete service error:', err);
    }
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
        setMessage(courseModal.isEdit ? 'Course updated!' : 'Course created!');
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
    if (!window.confirm('Delete this course and its lessons?')) return;
    try {
      const res = await fetch(`/api/teacher-dashboard/courses/${courseId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setMessage('Course deleted.');
        setSelectedCourseId(null);
        setCourseDetails(null);
        loadOverview();
      }
    } catch (err) {
      console.error('Delete course error:', err);
    }
  };

  // --- Section & Lesson CRUD Handlers ---
  const handleSaveSection = async (e) => {
    e.preventDefault();
    const { isEdit, data: sData, courseId } = sectionModal;
    try {
      const url = isEdit
        ? `/api/teacher-dashboard/sections/${sData.id}`
        : `/api/teacher-dashboard/courses/${courseId}/sections`;
      const method = isEdit ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ title: sData.title })
      });

      if (res.ok) {
        setMessage('Section saved!');
        setSectionModal({ isOpen: false, isEdit: false, data: null, courseId: null });
        loadCourseFull(selectedCourseId);
      }
    } catch (err) {
      console.error('Save section error:', err);
    }
  };

  const handleDeleteSection = async (sectionId) => {
    if (!window.confirm('Delete this section?')) return;
    try {
      await fetch(`/api/teacher-dashboard/sections/${sectionId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      loadCourseFull(selectedCourseId);
    } catch (err) {
      console.error('Delete section error:', err);
    }
  };

  const handleSaveLesson = async (e) => {
    e.preventDefault();
    const { isEdit, data: lData, sectionId, courseId } = lessonModal;
    try {
      const url = isEdit
        ? `/api/teacher-dashboard/lessons/${lData.id}`
        : '/api/teacher-dashboard/lessons';
      const method = isEdit ? 'PUT' : 'POST';

      const payload = isEdit ? lData : { ...lData, section_id: sectionId, course_id: courseId };

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setMessage('Lesson saved!');
        setLessonModal({ isOpen: false, isEdit: false, data: null, sectionId: null, courseId: null });
        loadCourseFull(selectedCourseId);
        loadOverview();
      }
    } catch (err) {
      console.error('Save lesson error:', err);
    }
  };

  const handleDeleteLesson = async (lessonId) => {
    if (!window.confirm('Delete this lesson?')) return;
    try {
      await fetch(`/api/teacher-dashboard/lessons/${lessonId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      loadCourseFull(selectedCourseId);
      loadOverview();
    } catch (err) {
      console.error('Delete lesson error:', err);
    }
  };

  // --- Save Payout & Profile Settings ---
  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setSavingSettings(true);
    setErrorMessage('');
    setMessage('');
    try {
      const priceCents = Math.round(parseFloat(settingsForm.monthly_price || '10') * 100);
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
          cliq_alias: settingsForm.cliq_alias,
          bank_name: settingsForm.bank_name,
          wallet_phone: settingsForm.wallet_phone,
          currency: 'JOD',
          external_links: settingsForm.external_links
        })
      });

      if (res.ok) {
        setMessage('CLIQ payout details, JOD price, and profile saved successfully!');
        loadOverview();
      } else {
        const err = await res.json();
        setErrorMessage(err.error || 'Failed to save settings');
      }
    } catch (err) {
      setErrorMessage('Error saving profile settings');
    } finally {
      setSavingSettings(false);
    }
  };

  const handleCopyProfileLink = () => {
    const handle = data?.profile?.handle || user?.name?.toLowerCase().replace(/\s+/g, '');
    const link = `${window.location.origin}/@${handle}`;
    navigator.clipboard.writeText(link);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  if (loading) {
    return (
      <div className="container" style={{ padding: '4rem 1rem', textAlign: 'center', color: '#64748b' }}>
        Loading Teacher Workspace...
      </div>
    );
  }

  const stats = data?.stats || {};
  const courses = data?.courses || [];
  const leadMagnets = data?.lead_magnets || [];
  const services = data?.services || [];
  const serviceBookings = data?.service_bookings || [];
  const profile = data?.profile || {};
  const creatorHandle = profile.handle || '';

  return (
    <div style={{ backgroundColor: '#ffffff', minHeight: '100vh', padding: '2.5rem 0 5rem 0' }}>
      <div className="container" style={{ maxWidth: '960px' }}>
        
        {/* Workspace Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
          marginBottom: '1.5rem'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
              <span style={{
                fontSize: '0.75rem',
                fontWeight: '700',
                padding: '0.15rem 0.5rem',
                borderRadius: '9999px',
                backgroundColor: '#eff6ff',
                color: '#1d4ed8'
              }}>
                TEACHER WORKSPACE
              </span>
              {creatorHandle && (
                <span style={{ fontSize: '0.85rem', color: 'var(--color-primary)', fontWeight: '700' }}>
                  /@{creatorHandle}
                </span>
              )}
            </div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: '800', color: '#0f172a', margin: 0 }}>
              Teacher Workspace & Bookings
            </h1>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {creatorHandle && (
              <a
                href={`/@${creatorHandle}`}
                target="_blank"
                rel="noreferrer"
                className="btn btn-secondary btn-sm"
                style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: '600' }}
              >
                <Eye size={15} /> View My Profile (@{creatorHandle})
              </a>
            )}
            <button 
              onClick={handleCopyProfileLink}
              className="btn btn-secondary btn-sm"
              style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: '600' }}
            >
              {copiedLink ? <Check size={14} color="green" /> : <Copy size={14} />}
              {copiedLink ? 'Link Copied!' : 'Copy Link'}
            </button>
            <button 
              onClick={() => setCourseModal({
                isOpen: true,
                isEdit: false,
                data: { title: '', description: '', subject_name: 'Mathematics', educational_level: 'Grade 12', thumbnail_url: '' }
              })}
              className="btn btn-primary btn-sm"
              style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: '700' }}
            >
              <PlusCircle size={15} /> New Course
            </button>
          </div>
        </div>

        {/* 0% Platform Fee Banner */}
        <div style={{
          backgroundColor: '#ecfdf5',
          border: '1px solid #a7f3d0',
          borderRadius: 'var(--radius-md)',
          padding: '0.85rem 1.25rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '0.75rem',
          marginBottom: '1.75rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <ShieldCheck size={20} color="#059669" />
            <div style={{ fontSize: '0.85rem', color: '#065f46' }}>
              <strong>100% Free Platform (0% Fees):</strong> Korsa charges zero platform commission. You receive 100% of student payments directly through CLIQ or Zain Cash.
            </div>
          </div>
          <span style={{ fontSize: '0.75rem', fontWeight: '800', backgroundColor: '#ffffff', color: '#059669', padding: '0.2rem 0.6rem', borderRadius: '9999px', border: '1px solid #6ee7b7' }}>
            CLIQ: {profile.cliq_alias || 'Not Set'}
          </span>
        </div>

        {/* Global Feedback Alerts */}
        {message && (
          <div className="alert alert-success" style={{ marginBottom: '1.25rem' }}>
            <CheckCircle2 size={16} /> {message}
          </div>
        )}
        {errorMessage && (
          <div className="alert alert-error" style={{ marginBottom: '1.25rem' }}>
            <AlertCircle size={16} /> {errorMessage}
          </div>
        )}

        {/* Top Minimalist Stats Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
          
          <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 'var(--radius-md)', padding: '1rem' }}>
            <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: '600' }}>Active Students</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.3rem' }}>
              <Users size={20} color="var(--color-primary)" />
              <span style={{ fontSize: '1.5rem', fontWeight: '800', color: '#0f172a' }}>{stats.active_subscribers || 0}</span>
            </div>
            <span style={{ fontSize: '0.725rem', color: '#64748b', marginTop: '2px', display: 'block' }}>
              {stats.subscription_price_jod || stats.subscription_price || 10} JOD / mo
            </span>
          </div>

          <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 'var(--radius-md)', padding: '1rem' }}>
            <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: '600' }}>1-on-1 Sessions Booked</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.3rem' }}>
              <Calendar size={20} color="#d97706" />
              <span style={{ fontSize: '1.5rem', fontWeight: '800', color: '#0f172a' }}>{serviceBookings.length}</span>
            </div>
            <span style={{ fontSize: '0.725rem', color: '#64748b', marginTop: '2px', display: 'block' }}>
              {services.length} active session types
            </span>
          </div>

          <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 'var(--radius-md)', padding: '1rem' }}>
            <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: '600' }}>Study Guide Downloads</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.3rem' }}>
              <Download size={20} color="#059669" />
              <span style={{ fontSize: '1.5rem', fontWeight: '800', color: '#0f172a' }}>{stats.total_downloads || 0}</span>
            </div>
            <span style={{ fontSize: '0.725rem', color: '#64748b', marginTop: '2px', display: 'block' }}>
              Across {leadMagnets.length} free guides
            </span>
          </div>

          <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 'var(--radius-md)', padding: '1rem' }}>
            <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: '600' }}>Platform Commission</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.3rem' }}>
              <ShieldCheck size={20} color="#059669" />
              <span style={{ fontSize: '1.5rem', fontWeight: '800', color: '#059669' }}>0%</span>
            </div>
            <span style={{ fontSize: '0.725rem', color: '#64748b', marginTop: '2px', display: 'block' }}>
              Zero gateway deduction
            </span>
          </div>

        </div>

        {/* Clean Navigation Tabs */}
        <div style={{
          display: 'flex',
          borderBottom: '2px solid #e2e8f0',
          marginBottom: '2rem',
          gap: '1.5rem',
          overflowX: 'auto',
          whiteSpace: 'nowrap'
        }}>
          <button
            onClick={() => { setActiveTab('bookings'); setSelectedCourseId(null); }}
            style={{
              padding: '0.75rem 0.25rem',
              fontSize: '0.95rem',
              fontWeight: activeTab === 'bookings' ? '800' : '600',
              color: activeTab === 'bookings' ? 'var(--color-primary)' : '#64748b',
              borderBottom: activeTab === 'bookings' ? '2px solid var(--color-primary)' : '2px solid transparent',
              marginBottom: '-2px',
              display: 'flex',
              alignItems: 'center',
              gap: '0.45rem',
              background: 'none',
              border: 'none',
              cursor: 'pointer'
            }}
          >
            <Calendar size={17} />
            1-on-1 Sessions ({serviceBookings.length})
          </button>

          <button
            onClick={() => { setActiveTab('codes'); setSelectedCourseId(null); }}
            style={{
              padding: '0.75rem 0.25rem',
              fontSize: '0.95rem',
              fontWeight: activeTab === 'codes' ? '800' : '600',
              color: activeTab === 'codes' ? 'var(--color-primary)' : '#64748b',
              borderBottom: activeTab === 'codes' ? '2px solid var(--color-primary)' : '2px solid transparent',
              marginBottom: '-2px',
              display: 'flex',
              alignItems: 'center',
              gap: '0.45rem',
              background: 'none',
              border: 'none',
              cursor: 'pointer'
            }}
          >
            <Key size={17} />
            {t('accessCodesTab', 'Access Codes (أكواد الاشتراك)')} ({codesData?.codes?.length || 0})
          </button>

          <button
            onClick={() => { setActiveTab('posts'); setSelectedCourseId(null); }}
            style={{
              padding: '0.75rem 0.25rem',
              fontSize: '0.95rem',
              fontWeight: activeTab === 'posts' ? '800' : '600',
              color: activeTab === 'posts' ? 'var(--color-primary)' : '#64748b',
              borderBottom: activeTab === 'posts' ? '2px solid var(--color-primary)' : '2px solid transparent',
              marginBottom: '-2px',
              display: 'flex',
              alignItems: 'center',
              gap: '0.45rem',
              background: 'none',
              border: 'none',
              cursor: 'pointer'
            }}
          >
            <Sparkles size={17} />
            {t('feedPostsTab', 'Feed & Lessons (المنشورات والدروس)')} ({postsData?.length || 0})
          </button>

          <button
            onClick={() => { setActiveTab('guides'); setSelectedCourseId(null); }}
            style={{
              padding: '0.75rem 0.25rem',
              fontSize: '0.95rem',
              fontWeight: activeTab === 'guides' ? '800' : '600',
              color: activeTab === 'guides' ? 'var(--color-primary)' : '#64748b',
              borderBottom: activeTab === 'guides' ? '2px solid var(--color-primary)' : '2px solid transparent',
              marginBottom: '-2px',
              display: 'flex',
              alignItems: 'center',
              gap: '0.45rem',
              background: 'none',
              border: 'none',
              cursor: 'pointer'
            }}
          >
            <Download size={17} />
            Free Guides ({leadMagnets.length})
          </button>

          <button
            onClick={() => { setActiveTab('courses'); setSelectedCourseId(null); }}
            style={{
              padding: '0.75rem 0.25rem',
              fontSize: '0.95rem',
              fontWeight: activeTab === 'courses' ? '800' : '600',
              color: activeTab === 'courses' ? 'var(--color-primary)' : '#64748b',
              borderBottom: activeTab === 'courses' ? '2px solid var(--color-primary)' : '2px solid transparent',
              marginBottom: '-2px',
              display: 'flex',
              alignItems: 'center',
              gap: '0.45rem',
              background: 'none',
              border: 'none',
              cursor: 'pointer'
            }}
          >
            <BookOpen size={17} />
            Courses ({courses.length})
          </button>

          <button
            onClick={() => { setActiveTab('payouts'); setSelectedCourseId(null); }}
            style={{
              padding: '0.75rem 0.25rem',
              fontSize: '0.95rem',
              fontWeight: activeTab === 'payouts' ? '800' : '600',
              color: activeTab === 'payouts' ? 'var(--color-primary)' : '#64748b',
              borderBottom: activeTab === 'payouts' ? '2px solid var(--color-primary)' : '2px solid transparent',
              marginBottom: '-2px',
              display: 'flex',
              alignItems: 'center',
              gap: '0.45rem',
              background: 'none',
              border: 'none',
              cursor: 'pointer'
            }}
          >
            <Zap size={17} />
            CLIQ & Profile
          </button>
        </div>

        {/* TAB 1: 1-ON-1 SESSIONS & BOOKINGS (WITH CONFIRM PAYMENT BUTTON) */}
        {activeTab === 'bookings' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.5rem' }}>
              <div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: '800', color: '#0f172a', margin: 0 }}>
                  Incoming Student Bookings
                </h3>
                <p style={{ fontSize: '0.85rem', color: '#64748b', margin: '2px 0 0 0' }}>
                  Verify the student's CLIQ Transfer Reference Number and click "Confirm Payment".
                </p>
              </div>

              <button
                onClick={() => setServiceModal({
                  isOpen: true,
                  isEdit: false,
                  data: { title: '45-Min Exam Prep & Problem Solving', description: 'Review homework and past Tawjihi exams 1-on-1.', price_jod: '15', duration_minutes: 45, service_type: 'mentorship' }
                })}
                className="btn btn-secondary btn-sm"
                style={{ fontWeight: '700', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
              >
                <PlusCircle size={15} /> + Add 1-on-1 Offering
              </button>
            </div>

            {serviceBookings.length === 0 ? (
              <div style={{
                textAlign: 'center',
                padding: '3rem 1rem',
                backgroundColor: '#f8fafc',
                borderRadius: 'var(--radius-md)',
                border: '1px solid #e2e8f0',
                marginBottom: '2.5rem'
              }}>
                <Calendar size={28} color="#94a3b8" style={{ marginBottom: '0.5rem' }} />
                <h4 style={{ fontSize: '1.05rem', fontWeight: '700', color: '#0f172a', marginBottom: '0.25rem' }}>
                  No bookings yet
                </h4>
                <p style={{ fontSize: '0.85rem', color: '#64748b', margin: 0 }}>
                  When students book 1-on-1 sessions on your profile, their requests and CLIQ references will appear here.
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2.5rem' }}>
                {(serviceBookings || []).map((b) => {
                  const isConfirmed = b.payment_status === 'confirmed' || b.status === 'confirmed';
                  const priceJod = (b.price_cents / 100).toFixed(0);

                  return (
                    <div
                      key={b.id}
                      style={{
                        backgroundColor: '#ffffff',
                        border: isConfirmed ? '1px solid #e2e8f0' : '1px solid #fef08a',
                        borderRadius: 'var(--radius-md)',
                        padding: '1.25rem',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '0.75rem' }}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <h4 style={{ fontSize: '1.05rem', fontWeight: '800', color: '#0f172a', margin: 0 }}>
                              {b.service_title}
                            </h4>
                            <span style={{ fontSize: '0.75rem', color: '#64748b' }}>({b.duration_minutes} mins)</span>
                          </div>

                          <div style={{ fontSize: '0.875rem', color: '#334155', marginTop: '0.25rem' }}>
                            {isRTL ? 'الطالب:' : 'Student:'} <strong>{b.student_name}</strong> · <a href={`mailto:${b.student_email}`} style={{ color: 'var(--color-primary)' }}>{b.student_email}</a>
                            {b.student_phone && (
                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', marginLeft: '0.5rem', flexWrap: 'wrap' }}>
                                · {isRTL ? 'الهاتف / واتساب:' : 'Phone / WhatsApp:'} <strong>{b.student_phone}</strong>
                                <a
                                  href={createWhatsAppTeacherToStudentUrl({
                                    studentPhone: b.student_phone,
                                    studentName: b.student_name,
                                    title: b.service_title
                                  })}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '0.3rem',
                                    backgroundColor: '#25D366',
                                    color: '#ffffff',
                                    padding: '0.2rem 0.55rem',
                                    borderRadius: '9999px',
                                    fontSize: '0.75rem',
                                    fontWeight: '700',
                                    textDecoration: 'none',
                                    boxShadow: '0 1px 2px rgba(37, 211, 102, 0.3)'
                                  }}
                                  title="Message student on WhatsApp (مراسلة الطالب عبر واتساب)"
                                >
                                  <WhatsAppIcon size={13} />
                                  <span>{t('messageStudentWhatsApp', 'WhatsApp')}</span>
                                </a>
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Status Badge & Action */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                          {isConfirmed ? (
                            <span style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.3rem',
                              padding: '0.25rem 0.65rem',
                              borderRadius: '9999px',
                              backgroundColor: '#dcfce7',
                              color: '#15803d',
                              fontSize: '0.8rem',
                              fontWeight: '700'
                            }}>
                              <CheckCircle2 size={14} /> {isRTL ? 'مؤكد ومقبول' : 'Confirmed (مؤكد)'}
                            </span>
                          ) : (
                            <button
                              onClick={() => handleConfirmPayment(b.id)}
                              className="btn btn-primary btn-sm"
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.35rem',
                                backgroundColor: '#15803d',
                                borderColor: '#15803d',
                                fontWeight: '700',
                                padding: '0.4rem 0.85rem'
                              }}
                            >
                              <CheckCircle2 size={15} /> {t('confirmPaymentBtn', 'Confirm Payment')}
                            </button>
                          )}

                          <select
                            value={b.status}
                            onChange={(e) => handleUpdateBookingStatus(b.id, e.target.value)}
                            style={{
                              fontSize: '0.8rem',
                              padding: '0.3rem 0.5rem',
                              borderRadius: 'var(--radius-sm)',
                              border: '1px solid #cbd5e1'
                            }}
                          >
                            <option value="pending">Pending</option>
                            <option value="confirmed">Confirmed</option>
                            <option value="completed">Completed</option>
                            <option value="cancelled">Cancelled</option>
                          </select>
                        </div>
                      </div>

                      {/* Payment Verification Box */}
                      <div style={{
                        backgroundColor: '#f8fafc',
                        border: '1px solid #e2e8f0',
                        borderRadius: 'var(--radius-sm)',
                        padding: '0.75rem 1rem',
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                        gap: '0.75rem',
                        fontSize: '0.825rem'
                      }}>
                        <div>
                          <span style={{ color: '#64748b', display: 'block' }}>Amount</span>
                          <strong style={{ fontSize: '0.95rem', color: '#0f172a' }}>{priceJod} JOD</strong>
                        </div>
                        <div>
                          <span style={{ color: '#64748b', display: 'block' }}>CLIQ Reference Number</span>
                          <strong style={{ fontFamily: 'monospace', color: 'var(--color-primary)', fontSize: '0.9rem' }}>
                            {b.cliq_reference || 'Not Provided'}
                          </strong>
                        </div>
                        <div>
                          <span style={{ color: '#64748b', display: 'block' }}>Booking Date</span>
                          <span>{new Date(b.created_at).toLocaleString()}</span>
                        </div>
                      </div>

                      {b.booking_notes && (
                        <p style={{ fontSize: '0.825rem', color: '#64748b', margin: '0.5rem 0 0 0', fontStyle: 'italic' }}>
                          Student Notes: "{b.booking_notes}"
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Active 1-on-1 Offerings List */}
            <div style={{ marginTop: '2rem' }}>
              <h4 style={{ fontSize: '1.05rem', fontWeight: '800', color: '#0f172a', marginBottom: '0.75rem' }}>
                Your Active 1-on-1 Offerings ({services.length})
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem' }}>
                {(services || []).map((srv) => {
                  const sPriceJod = (srv.price_cents / 100).toFixed(0);

                  return (
                    <div 
                      key={srv.id}
                      style={{
                        backgroundColor: '#ffffff',
                        border: '1px solid #e2e8f0',
                        borderRadius: 'var(--radius-md)',
                        padding: '1rem',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between'
                      }}
                    >
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                          <span style={{ fontSize: '0.725rem', fontWeight: '700', color: '#b45309', backgroundColor: '#fef3c7', padding: '0.1rem 0.45rem', borderRadius: '9999px' }}>
                            {srv.duration_minutes} mins
                          </span>
                          <strong style={{ fontSize: '1.1rem', color: '#0f172a' }}>{sPriceJod} JOD</strong>
                        </div>
                        <h5 style={{ fontSize: '0.95rem', fontWeight: '700', color: '#0f172a', margin: '0 0 0.35rem 0' }}>
                          {srv.title}
                        </h5>
                        <p style={{ fontSize: '0.8rem', color: '#64748b', margin: 0 }}>
                          {srv.description}
                        </p>
                      </div>

                      <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
                        <button
                          onClick={() => setServiceModal({
                            isOpen: true,
                            isEdit: true,
                            data: { ...srv, price_jod: sPriceJod }
                          })}
                          className="btn btn-secondary btn-sm"
                          style={{ flex: 1, fontSize: '0.75rem' }}
                        >
                          <Edit size={13} /> Edit
                        </button>
                        <button
                          onClick={() => handleDeleteService(srv.id)}
                          className="btn btn-secondary btn-sm"
                          style={{ color: '#dc2626', borderColor: '#fca5a5' }}
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>
        )}

        {/* TAB: PREPAID ACCESS CODES */}
        {activeTab === 'codes' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: '800', color: '#0f172a', margin: 0 }}>
                  {t('accessCodesTitle', 'Prepaid Access Codes (أكواد اشتراك المكتبات)')}
                </h3>
                <p style={{ fontSize: '0.85rem', color: '#64748b', margin: '3px 0 0 0' }}>
                  {t('accessCodesSubtitle', 'Generate prepaid vouchers for bookshops, libraries, and cash-paying students. Each code grants 30 days of full access.')}
                </p>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={() => setGenerateCodeModal({
                    isOpen: true,
                    count: 10,
                    price_jod: data?.profile?.monthly_price_cents ? (data.profile.monthly_price_cents / 100) : 10,
                    batch_name: ''
                  })}
                  className="btn btn-primary btn-sm"
                  style={{ fontWeight: '700', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                >
                  <Key size={15} /> {t('generateCodesBtn', '+ Generate Access Codes')}
                </button>

                <button
                  type="button"
                  onClick={handleExportCsv}
                  disabled={!codesData?.codes?.length}
                  className="btn btn-secondary btn-sm"
                  style={{ fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                  title={t('exportCsv', 'Export CSV for Bookshops')}
                >
                  <Download size={14} /> {t('exportCsv', 'Export CSV')}
                </button>

                <button
                  type="button"
                  onClick={handlePrintCodes}
                  disabled={!codesData?.codes?.length}
                  className="btn btn-secondary btn-sm"
                  style={{ fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                  title={t('printCodesSheet', 'Print Voucher Cards')}
                >
                  <Printer size={14} /> {t('printCodesSheet', 'Print Cards')}
                </button>
              </div>
            </div>

            {/* Access Code Analytics Metrics */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem', marginBottom: '1.5rem' }}>
              <div style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 'var(--radius-md)', padding: '0.85rem 1rem' }}>
                <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: '600' }}>{t('totalGeneratedCodes', 'Total Codes Generated')}</span>
                <div style={{ fontSize: '1.35rem', fontWeight: '800', color: '#0f172a', marginTop: '0.2rem' }}>
                  {codesData?.stats?.total_count || 0}
                </div>
              </div>

              <div style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 'var(--radius-md)', padding: '0.85rem 1rem' }}>
                <span style={{ fontSize: '0.75rem', color: '#166534', fontWeight: '600' }}>{t('activeCodes', 'Active (Available) Codes')}</span>
                <div style={{ fontSize: '1.35rem', fontWeight: '800', color: '#15803d', marginTop: '0.2rem' }}>
                  {codesData?.stats?.active_count || 0}
                </div>
              </div>

              <div style={{ backgroundColor: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 'var(--radius-md)', padding: '0.85rem 1rem' }}>
                <span style={{ fontSize: '0.75rem', color: '#1e40af', fontWeight: '600' }}>{t('redeemedCodes', 'Redeemed Codes')}</span>
                <div style={{ fontSize: '1.35rem', fontWeight: '800', color: '#1d4ed8', marginTop: '0.2rem' }}>
                  {codesData?.stats?.redeemed_count || 0}
                </div>
              </div>

              <div style={{ backgroundColor: '#fdf4ff', border: '1px solid #f0abfc', borderRadius: 'var(--radius-md)', padding: '0.85rem 1rem' }}>
                <span style={{ fontSize: '0.75rem', color: '#86198f', fontWeight: '600' }}>{t('potentialRevenue', 'Total Value (JOD)')}</span>
                <div style={{ fontSize: '1.35rem', fontWeight: '800', color: '#a21caf', marginTop: '0.2rem' }}>
                  {codesData?.stats?.total_value_jod || 0} {t('jod', 'JOD')}
                </div>
              </div>
            </div>

            {/* Batch Filter & Copy All Bar */}
            <div style={{
              backgroundColor: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: 'var(--radius-md)',
              padding: '0.75rem 1rem',
              marginBottom: '1rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '0.75rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: '700', color: '#475569' }}>
                  {t('batchFilter', 'Filter Batch (المجموعة / المكتبة):')}
                </span>
                <select
                  value={filterBatch}
                  onChange={(e) => setFilterBatch(e.target.value)}
                  className="form-input"
                  style={{ fontSize: '0.8rem', padding: '0.35rem 0.65rem', width: 'auto', minWidth: '180px' }}
                >
                  <option value="all">{t('allBatches', 'All Batches (جميع الدفعات والمكتبات)')}</option>
                  {(codesData?.batches || []).map((b, idx) => (
                    <option key={idx} value={b.batch_name}>
                      {b.batch_name} ({b.count} codes · {b.price_jod} JOD)
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <button
                  type="button"
                  onClick={handleCopyAllCodes}
                  disabled={!codesData?.codes?.length}
                  className="btn btn-secondary btn-sm"
                  style={{ fontWeight: '700', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                >
                  {allCopied ? <Check size={13} color="green" /> : <Copy size={13} />}
                  {allCopied ? t('copied', 'Copied All!') : t('copyAllCodes', 'Copy All Codes')}
                </button>
              </div>
            </div>

            {/* Codes Table List */}
            {loadingCodes ? (
              <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#64748b' }}>
                Loading prepaid codes...
              </div>
            ) : (!codesData?.codes || codesData.codes.length === 0) ? (
              <div style={{
                textAlign: 'center',
                padding: '3rem 1rem',
                backgroundColor: '#f8fafc',
                borderRadius: 'var(--radius-md)',
                border: '1px solid #e2e8f0'
              }}>
                <Key size={32} color="#94a3b8" style={{ marginBottom: '0.5rem' }} />
                <h4 style={{ fontSize: '1.1rem', fontWeight: '800', color: '#0f172a', marginBottom: '0.25rem' }}>
                  {t('noCodesYet', 'No prepaid access codes generated yet')}
                </h4>
                <p style={{ fontSize: '0.85rem', color: '#64748b', margin: '0 0 1.25rem 0' }}>
                  Generate a batch of voucher cards to sell in partner bookshops across Amman, Irbid, Zarqa, and other governorates.
                </p>
                <button
                  onClick={() => setGenerateCodeModal({
                    isOpen: true,
                    count: 10,
                    price_jod: data?.profile?.monthly_price_cents ? (data.profile.monthly_price_cents / 100) : 10,
                    batch_name: ''
                  })}
                  className="btn btn-primary btn-sm"
                  style={{ fontWeight: '700' }}
                >
                  {t('generateCodesBtn', '+ Generate Your First Batch')}
                </button>
              </div>
            ) : (
              <div style={{
                backgroundColor: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: 'var(--radius-md)',
                overflow: 'hidden'
              }}>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: isRTL ? 'right' : 'left', fontSize: '0.85rem' }}>
                    <thead>
                      <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569', fontWeight: '700' }}>
                        <th style={{ padding: '0.75rem 1rem' }}>Code (كود الاشتراك)</th>
                        <th style={{ padding: '0.75rem 1rem' }}>Batch / Library</th>
                        <th style={{ padding: '0.75rem 1rem' }}>Price</th>
                        <th style={{ padding: '0.75rem 1rem' }}>Status</th>
                        <th style={{ padding: '0.75rem 1rem' }}>Redeemed By</th>
                        <th style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(codesData.codes || [])
                        .filter(c => filterBatch === 'all' || c.batch_name === filterBatch)
                        .map((codeItem) => {
                          const isRedeemed = codeItem.status === 'redeemed';
                          return (
                            <tr key={codeItem.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                              <td style={{ padding: '0.75rem 1rem', fontFamily: 'monospace', fontWeight: '800', fontSize: '0.9rem', color: '#0f172a' }}>
                                {codeItem.code}
                              </td>
                              <td style={{ padding: '0.75rem 1rem', color: '#334155' }}>
                                {codeItem.batch_name || '—'}
                              </td>
                              <td style={{ padding: '0.75rem 1rem', fontWeight: '700', color: '#0f172a' }}>
                                {codeItem.price_jod} JOD
                              </td>
                              <td style={{ padding: '0.75rem 1rem' }}>
                                {isRedeemed ? (
                                  <span style={{
                                    fontSize: '0.725rem',
                                    fontWeight: '700',
                                    padding: '0.15rem 0.5rem',
                                    borderRadius: '9999px',
                                    backgroundColor: '#f1f5f9',
                                    color: '#64748b',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '0.25rem'
                                  }}>
                                    <CheckCircle2 size={12} /> {t('codeStatusRedeemed', 'Redeemed')}
                                  </span>
                                ) : (
                                  <span style={{
                                    fontSize: '0.725rem',
                                    fontWeight: '700',
                                    padding: '0.15rem 0.5rem',
                                    borderRadius: '9999px',
                                    backgroundColor: '#dcfce7',
                                    color: '#15803d',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '0.25rem'
                                  }}>
                                    <Key size={11} /> {t('codeStatusActive', 'Active (Available)')}
                                  </span>
                                )}
                              </td>
                              <td style={{ padding: '0.75rem 1rem', color: '#64748b', fontSize: '0.8rem' }}>
                                {isRedeemed ? (
                                  <div>
                                    <div style={{ fontWeight: '600', color: '#0f172a' }}>{codeItem.redeemed_by_name || 'Student'}</div>
                                    <div style={{ fontSize: '0.725rem' }}>{codeItem.redeemed_at ? new Date(codeItem.redeemed_at).toLocaleDateString() : ''}</div>
                                  </div>
                                ) : (
                                  <span style={{ color: '#94a3b8' }}>—</span>
                                )}
                              </td>
                              <td style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>
                                <button
                                  type="button"
                                  onClick={() => handleCopyCode(codeItem.code)}
                                  className="btn btn-secondary btn-sm"
                                  style={{
                                    fontSize: '0.725rem',
                                    padding: '0.25rem 0.5rem',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '0.3rem'
                                  }}
                                >
                                  {copiedCode === codeItem.code ? <Check size={12} color="green" /> : <Copy size={12} />}
                                  {copiedCode === codeItem.code ? t('copied', 'Copied') : t('copyCode', 'Copy')}
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB: CREATOR FEED & POSTS */}
        {activeTab === 'posts' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: '800', color: '#0f172a', margin: 0 }}>
                  {t('feedPostsTab', 'Creator Feed & Lessons (حائط الدروس والمنشورات)')}
                </h3>
                <p style={{ fontSize: '0.85rem', color: '#64748b', margin: '3px 0 0 0' }}>
                  {t('feedPostsSubtitle', 'Publish video explanations, exam reviews, and PDF summaries directly to your followers and active subscribers.')}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setPostModal({
                  isOpen: true,
                  isEdit: false,
                  data: { title: '', content: '', media_url: '', attachments: [{ title: '', url: '' }], visibility: 'public' }
                })}
                className="btn btn-primary btn-sm"
                style={{ fontWeight: '700', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
              >
                <PlusCircle size={15} /> {t('createPostBtn', '+ Create New Post')}
              </button>
            </div>

            {loadingPosts ? (
              <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#64748b' }}>
                Loading feed posts...
              </div>
            ) : (!postsData || postsData.length === 0) ? (
              <div style={{
                textAlign: 'center',
                padding: '3rem 1rem',
                backgroundColor: '#f8fafc',
                borderRadius: 'var(--radius-md)',
                border: '1px solid #e2e8f0'
              }}>
                <Sparkles size={32} color="#94a3b8" style={{ marginBottom: '0.5rem' }} />
                <h4 style={{ fontSize: '1.1rem', fontWeight: '800', color: '#0f172a', marginBottom: '0.25rem' }}>
                  {t('noPostsYet', 'No feed posts published yet')}
                </h4>
                <p style={{ fontSize: '0.85rem', color: '#64748b', margin: '0 0 1.25rem 0' }}>
                  Keep your students engaged with announcements, exam strategies, and subscriber-exclusive video lessons.
                </p>
                <button
                  onClick={() => setPostModal({
                    isOpen: true,
                    isEdit: false,
                    data: { title: '', content: '', media_url: '', attachments: [{ title: '', url: '' }], visibility: 'public' }
                  })}
                  className="btn btn-primary btn-sm"
                  style={{ fontWeight: '700' }}
                >
                  {t('createPostBtn', '+ Create Your First Post')}
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {postsData.map((post) => (
                  <div
                    key={post.id}
                    style={{
                      backgroundColor: '#ffffff',
                      border: '1px solid #e2e8f0',
                      borderRadius: 'var(--radius-md)',
                      padding: '1.25rem',
                      boxShadow: '0 1px 2px rgba(0,0,0,0.03)'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                          {post.visibility === 'subscribers' ? (
                            <span style={{
                              backgroundColor: '#eff6ff',
                              color: '#1d4ed8',
                              border: '1px solid #bfdbfe',
                              padding: '0.15rem 0.5rem',
                              borderRadius: '9999px',
                              fontSize: '0.7rem',
                              fontWeight: '800',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.25rem'
                            }}>
                              <Lock size={11} /> {t('subscribersOnlyBadge', 'Subscribers Only')}
                            </span>
                          ) : (
                            <span style={{
                              backgroundColor: '#f1f5f9',
                              color: '#475569',
                              border: '1px solid #e2e8f0',
                              padding: '0.15rem 0.5rem',
                              borderRadius: '9999px',
                              fontSize: '0.7rem',
                              fontWeight: '700',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.25rem'
                            }}>
                              <Globe size={11} /> {t('publicPostBadge', 'Public Post')}
                            </span>
                          )}
                          <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                            {new Date(post.created_at).toLocaleString()}
                          </span>
                        </div>

                        <h4 style={{ fontSize: '1.15rem', fontWeight: '800', color: '#0f172a', margin: '0 0 0.35rem 0' }}>
                          {post.title}
                        </h4>
                      </div>

                      <div style={{ display: 'flex', gap: '0.35rem' }}>
                        <button
                          type="button"
                          onClick={() => setPostModal({
                            isOpen: true,
                            isEdit: true,
                            data: {
                              id: post.id,
                              title: post.title,
                              content: post.content,
                              media_url: post.media_url || '',
                              attachments: post.attachments || [],
                              visibility: post.visibility
                            }
                          })}
                          className="btn btn-secondary btn-sm"
                          style={{ fontSize: '0.75rem', padding: '0.3rem 0.6rem' }}
                        >
                          <Edit size={13} /> Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeletePost(post.id)}
                          className="btn btn-secondary btn-sm"
                          style={{ color: '#dc2626', borderColor: '#fca5a5', padding: '0.3rem 0.6rem' }}
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>

                    <p style={{ fontSize: '0.875rem', color: '#334155', lineHeight: 1.6, whiteSpace: 'pre-line', margin: '0 0 0.75rem 0' }}>
                      {post.content}
                    </p>

                    {post.media_url && (
                      <div style={{ fontSize: '0.75rem', color: 'var(--color-primary)', fontWeight: '600', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <Video size={14} /> Video attached: <a href={post.media_url} target="_blank" rel="noreferrer" style={{ textDecoration: 'underline' }}>{post.media_url}</a>
                      </div>
                    )}

                    {post.attachments && post.attachments.length > 0 && (
                      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.5rem' }}>
                        {post.attachments.map((att, aIdx) => (
                          <span key={aIdx} style={{ fontSize: '0.75rem', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', padding: '0.2rem 0.5rem', borderRadius: '4px', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                            <FileText size={12} color="#ef4444" /> {att.title || 'Attachment'}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: FREE STUDY GUIDES */}
        {activeTab === 'guides' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.5rem' }}>
              <div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: '800', color: '#0f172a', margin: 0 }}>
                  Free Study Guides & Summaries (دوسيات)
                </h3>
                <p style={{ fontSize: '0.85rem', color: '#64748b', margin: '2px 0 0 0' }}>
                  Upload free PDFs and Tawjihi cheat sheets to help students study.
                </p>
              </div>

              <button
                onClick={() => setGuideModal({
                  isOpen: true,
                  isEdit: false,
                  data: { title: '', description: '', file_url: 'https://example.com/guide.pdf' }
                })}
                className="btn btn-primary btn-sm"
                style={{ fontWeight: '700', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
              >
                <PlusCircle size={15} /> + Add Free Study Guide
              </button>
            </div>

            {leadMagnets.length === 0 ? (
              <div style={{
                textAlign: 'center',
                padding: '3rem 1rem',
                backgroundColor: '#f8fafc',
                borderRadius: 'var(--radius-md)',
                border: '1px solid #e2e8f0'
              }}>
                <Download size={28} color="#94a3b8" style={{ marginBottom: '0.5rem' }} />
                <h4 style={{ fontSize: '1.05rem', fontWeight: '700', color: '#0f172a', marginBottom: '0.25rem' }}>
                  No study guides uploaded yet
                </h4>
                <p style={{ fontSize: '0.85rem', color: '#64748b', margin: '0 0 1rem 0' }}>
                  Publishing free study materials attracts students to your profile and 1-on-1 sessions.
                </p>
                <button
                  onClick={() => setGuideModal({
                    isOpen: true,
                    isEdit: false,
                    data: { title: '', description: '', file_url: 'https://example.com/guide.pdf' }
                  })}
                  className="btn btn-primary btn-sm"
                  style={{ fontWeight: '700' }}
                >
                  Create Your First Free Guide
                </button>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem' }}>
                {(leadMagnets || []).map((lm) => (
                  <div
                    key={lm.id}
                    style={{
                      backgroundColor: '#ffffff',
                      border: '1px solid #e2e8f0',
                      borderRadius: 'var(--radius-md)',
                      padding: '1.25rem',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between'
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                        <span style={{ fontSize: '0.7rem', fontWeight: '700', color: '#15803d', backgroundColor: '#dcfce7', padding: '0.1rem 0.45rem', borderRadius: '9999px' }}>
                          FREE PDF
                        </span>
                        <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                          🔥 {lm.downloads_count} downloads
                        </span>
                      </div>

                      <h4 style={{ fontSize: '1rem', fontWeight: '700', color: '#0f172a', marginBottom: '0.35rem' }}>
                        {lm.title}
                      </h4>
                      <p style={{ fontSize: '0.825rem', color: '#64748b', lineHeight: 1.45, margin: 0 }}>
                        {lm.description}
                      </p>
                    </div>

                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                      <a
                        href={lm.file_url}
                        target="_blank"
                        rel="noreferrer"
                        className="btn btn-secondary btn-sm"
                        style={{ flex: 1, fontSize: '0.75rem', textDecoration: 'none', textAlign: 'center' }}
                      >
                        Preview PDF
                      </a>
                      <button
                        onClick={() => setGuideModal({ isOpen: true, isEdit: true, data: lm })}
                        className="btn btn-secondary btn-sm"
                        style={{ fontSize: '0.75rem' }}
                      >
                        <Edit size={13} />
                      </button>
                      <button
                        onClick={() => handleDeleteGuide(lm.id)}
                        className="btn btn-secondary btn-sm"
                        style={{ color: '#dc2626', borderColor: '#fca5a5' }}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: CLIQ & WALLET SETUP */}
        {activeTab === 'payouts' && (
          <div style={{ maxWidth: '640px' }}>
            <div style={{ marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: '800', color: '#0f172a', margin: 0 }}>
                Local CLIQ & Direct Wallet Setup
              </h3>
              <p style={{ fontSize: '0.85rem', color: '#64748b', margin: '2px 0 0 0' }}>
                Enter your Jordanian payment details so students can transfer fees directly to you with 0% platform deductions.
              </p>
            </div>

            <form onSubmit={handleSaveSettings} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              
              {/* Payout Details Card */}
              <div style={{
                backgroundColor: '#eff6ff',
                border: '1px solid #bfdbfe',
                borderRadius: 'var(--radius-md)',
                padding: '1.25rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.9rem'
              }}>
                <h4 style={{ fontSize: '0.95rem', fontWeight: '800', color: '#1e3a8a', margin: 0 }}>
                  Jordanian Payment Credentials
                </h4>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', color: '#1e40af', marginBottom: '0.25rem' }}>
                    CLIQ Alias (اسم المستفيد في كليك)
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. REEDMATH or TARIQPHYS"
                    value={settingsForm.cliq_alias}
                    onChange={(e) => setSettingsForm({ ...settingsForm, cliq_alias: e.target.value })}
                  />
                  <span style={{ fontSize: '0.7rem', color: '#3b82f6', marginTop: '2px', display: 'block' }}>
                    Students transfer directly to this alias from their banking app.
                  </span>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', color: '#1e40af', marginBottom: '0.25rem' }}>
                    Bank Name (اسم البنك)
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Arab Bank (البنك العربي) or Bank al Etihad"
                    value={settingsForm.bank_name}
                    onChange={(e) => setSettingsForm({ ...settingsForm, bank_name: e.target.value })}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', color: '#1e40af', marginBottom: '0.25rem' }}>
                    Zain Cash / Orange Money Phone (رقم المحفظة)
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. 0795551234"
                    value={settingsForm.wallet_phone}
                    onChange={(e) => setSettingsForm({ ...settingsForm, wallet_phone: e.target.value })}
                  />
                </div>
              </div>

              {/* Monthly Subscription & Handle */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', marginBottom: '0.25rem' }}>
                    Monthly Class Price (JOD)
                  </label>
                  <input
                    type="number"
                    min="1"
                    className="form-input"
                    placeholder="10"
                    value={settingsForm.monthly_price}
                    onChange={(e) => setSettingsForm({ ...settingsForm, monthly_price: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', marginBottom: '0.25rem' }}>
                    Vanity Profile Handle
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="username"
                    value={settingsForm.handle}
                    onChange={(e) => setSettingsForm({ ...settingsForm, handle: e.target.value })}
                  />
                  <span style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '2px', display: 'block' }}>
                    korsa.app/@{settingsForm.handle || 'handle'}
                  </span>
                </div>
              </div>

              {/* Headline & Bio */}
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', marginBottom: '0.25rem' }}>
                  Headline
                </label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Tawjihi Mathematics Specialist & Exam Coach"
                  value={settingsForm.headline}
                  onChange={(e) => setSettingsForm({ ...settingsForm, headline: e.target.value })}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', marginBottom: '0.25rem' }}>
                  Biography
                </label>
                <textarea
                  rows={3}
                  className="form-input"
                  placeholder="Explain your teaching background and qualifications..."
                  value={settingsForm.bio}
                  onChange={(e) => setSettingsForm({ ...settingsForm, bio: e.target.value })}
                />
              </div>

              <button
                type="submit"
                disabled={savingSettings}
                className="btn btn-primary"
                style={{ padding: '0.75rem', fontWeight: '700', marginTop: '0.5rem' }}
              >
                {savingSettings ? 'Saving Settings...' : 'Save CLIQ & Profile Settings'}
              </button>
            </form>
          </div>
        )}

        {/* TAB 4: MY COURSES */}
        {activeTab === 'courses' && (
          <div>
            {!selectedCourseId ? (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                  <div>
                    <h3 style={{ fontSize: '1.2rem', fontWeight: '800', color: '#0f172a', margin: 0 }}>
                      My Courses & Curricula ({courses.length})
                    </h3>
                    <p style={{ fontSize: '0.85rem', color: '#64748b', margin: '2px 0 0 0' }}>
                      Publish structured lessons and practice sets for students.
                    </p>
                  </div>

                  <button
                    onClick={() => setCourseModal({
                      isOpen: true,
                      isEdit: false,
                      data: { title: '', description: '', subject_name: 'Mathematics', educational_level: 'Grade 12', thumbnail_url: '' }
                    })}
                    className="btn btn-primary btn-sm"
                    style={{ fontWeight: '700', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                  >
                    <PlusCircle size={15} /> + New Course
                  </button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
                  {(courses || []).map((c) => (
                    <div
                      key={c.id}
                      style={{
                        backgroundColor: '#ffffff',
                        border: '1px solid #e2e8f0',
                        borderRadius: 'var(--radius-md)',
                        padding: '1.25rem',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between'
                      }}
                    >
                      <div>
                        <span style={{ fontSize: '0.7rem', fontWeight: '700', color: 'var(--color-primary)', textTransform: 'uppercase' }}>
                          {c.subject_name || 'General'} · {c.educational_level}
                        </span>
                        <h4 style={{ fontSize: '1.05rem', fontWeight: '800', color: '#0f172a', margin: '0.2rem 0 0.35rem 0' }}>
                          {c.title}
                        </h4>
                        <p style={{ fontSize: '0.825rem', color: '#64748b', lineHeight: 1.45, margin: 0 }}>
                          {c.description}
                        </p>
                        <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.5rem' }}>
                          {c.total_lessons} lessons · {c.active_learners} learners
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                        <button
                          onClick={() => handleOpenCourseBuilder(c.id)}
                          className="btn btn-primary btn-sm"
                          style={{ flex: 1, fontSize: '0.8rem', fontWeight: '700' }}
                        >
                          Manage Lessons
                        </button>
                        <button
                          onClick={() => setCourseModal({ isOpen: true, isEdit: true, data: c })}
                          className="btn btn-secondary btn-sm"
                          style={{ fontSize: '0.8rem' }}
                        >
                          <Edit size={13} />
                        </button>
                        <button
                          onClick={() => handleDeleteCourse(c.id)}
                          className="btn btn-secondary btn-sm"
                          style={{ color: '#dc2626', borderColor: '#fca5a5' }}
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              /* Course Lessons Drilldown */
              <div>
                <button
                  onClick={() => setSelectedCourseId(null)}
                  className="btn btn-secondary btn-sm"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', marginBottom: '1rem', fontWeight: '600' }}
                >
                  <ArrowLeft size={15} /> Back to Courses
                </button>

                {loadingCourse || !courseDetails ? (
                  <p style={{ color: '#64748b' }}>Loading course curriculum...</p>
                ) : (
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                      <div>
                        <h3 style={{ fontSize: '1.3rem', fontWeight: '800', color: '#0f172a', margin: 0 }}>
                          {courseDetails.course?.title}
                        </h3>
                        <p style={{ fontSize: '0.85rem', color: '#64748b', margin: '2px 0 0 0' }}>
                          {courseDetails.course?.description}
                        </p>
                      </div>

                      <button
                        onClick={() => setSectionModal({ isOpen: true, isEdit: false, data: { title: '' }, courseId: selectedCourseId })}
                        className="btn btn-primary btn-sm"
                        style={{ fontWeight: '700', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                      >
                        <PlusCircle size={15} /> + Add Section
                      </button>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                      {(courseDetails.sections || []).map((sec) => (
                        <div
                          key={sec.id}
                          style={{
                            backgroundColor: '#ffffff',
                            border: '1px solid #e2e8f0',
                            borderRadius: 'var(--radius-md)',
                            padding: '1.25rem'
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                            <h4 style={{ fontSize: '1rem', fontWeight: '800', color: '#0f172a', margin: 0 }}>
                              {sec.title}
                            </h4>

                            <div style={{ display: 'flex', gap: '0.4rem' }}>
                              <button
                                onClick={() => setLessonModal({
                                  isOpen: true,
                                  isEdit: false,
                                  data: { title: '', video_url: '', duration_minutes: 15, is_free_preview: false, access_level: 'SUBSCRIBER_ONLY' },
                                  sectionId: sec.id,
                                  courseId: selectedCourseId
                                })}
                                className="btn btn-secondary btn-sm"
                                style={{ fontSize: '0.75rem', fontWeight: '700' }}
                              >
                                <PlusCircle size={13} /> + Lesson
                              </button>
                              <button
                                onClick={() => handleDeleteSection(sec.id)}
                                className="btn btn-secondary btn-sm"
                                style={{ color: '#dc2626', borderColor: '#fca5a5' }}
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </div>

                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            {(sec.lessons || []).map((les) => (
                              <div
                                key={les.id}
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'space-between',
                                  padding: '0.55rem 0.75rem',
                                  backgroundColor: '#f8fafc',
                                  borderRadius: 'var(--radius-sm)',
                                  border: '1px solid #e2e8f0'
                                }}
                              >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                  <Video size={15} color="var(--color-primary)" />
                                  <span style={{ fontSize: '0.85rem', fontWeight: '600', color: '#0f172a' }}>
                                    {les.title}
                                  </span>
                                  {les.is_free_preview && (
                                    <span style={{ fontSize: '0.65rem', fontWeight: '700', backgroundColor: '#dcfce7', color: '#15803d', padding: '0.05rem 0.35rem', borderRadius: '9999px' }}>
                                      FREE PREVIEW
                                    </span>
                                  )}
                                  <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                                    ({les.duration_minutes} mins)
                                  </span>
                                </div>

                                <div style={{ display: 'flex', gap: '0.35rem' }}>
                                  <button
                                    onClick={() => setLessonModal({ isOpen: true, isEdit: true, data: les, sectionId: sec.id, courseId: selectedCourseId })}
                                    className="btn btn-secondary btn-sm"
                                    style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                                  >
                                    <Edit size={12} />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteLesson(les.id)}
                                    className="btn btn-secondary btn-sm"
                                    style={{ padding: '0.25rem 0.5rem', color: '#dc2626', borderColor: '#fca5a5' }}
                                  >
                                    <Trash2 size={12} />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

      </div>

      {/* MODAL: Course Create / Edit */}
      {courseModal.isOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div style={{ backgroundColor: '#fff', borderRadius: 'var(--radius-lg)', maxWidth: '440px', width: '100%', padding: '1.75rem' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: '800', marginBottom: '1rem' }}>
              {courseModal.isEdit ? 'Edit Course' : 'Create Course'}
            </h3>
            <form onSubmit={handleSaveCourse} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', marginBottom: '0.2rem' }}>Title</label>
                <input
                  type="text"
                  className="form-input"
                  value={courseModal.data?.title || ''}
                  onChange={(e) => setCourseModal({ ...courseModal, data: { ...courseModal.data, title: e.target.value } })}
                  required
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', marginBottom: '0.2rem' }}>Description</label>
                <textarea
                  className="form-input"
                  rows={2}
                  value={courseModal.data?.description || ''}
                  onChange={(e) => setCourseModal({ ...courseModal, data: { ...courseModal.data, description: e.target.value } })}
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', marginBottom: '0.2rem' }}>Subject</label>
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
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', marginBottom: '0.2rem' }}>Grade</label>
                  <select
                    className="form-input"
                    value={courseModal.data?.educational_level || 'Grade 12'}
                    onChange={(e) => setCourseModal({ ...courseModal, data: { ...courseModal.data, educational_level: e.target.value } })}
                  >
                    <option value="Grade 12">Grade 12 (Tawjihi)</option>
                    <option value="Grade 11">Grade 11</option>
                    <option value="Grade 10">Grade 10</option>
                    <option value="University">University</option>
                  </select>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                <button type="button" onClick={() => setCourseModal({ isOpen: false, isEdit: false, data: null })} className="btn btn-secondary" style={{ flex: 1 }}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" style={{ flex: 2, fontWeight: '700' }}>
                  Save Course
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Section Create / Edit */}
      {sectionModal.isOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div style={{ backgroundColor: '#fff', borderRadius: 'var(--radius-lg)', maxWidth: '400px', width: '100%', padding: '1.5rem' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: '800', marginBottom: '1rem' }}>
              {sectionModal.isEdit ? 'Edit Section' : 'Add Section'}
            </h3>
            <form onSubmit={handleSaveSection} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', marginBottom: '0.2rem' }}>Section Title</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Unit 1: Calculus Fundamentals"
                  value={sectionModal.data?.title || ''}
                  onChange={(e) => setSectionModal({ ...sectionModal, data: { ...sectionModal.data, title: e.target.value } })}
                  required
                />
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                <button type="button" onClick={() => setSectionModal({ isOpen: false, isEdit: false, data: null, courseId: null })} className="btn btn-secondary" style={{ flex: 1 }}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" style={{ flex: 2, fontWeight: '700' }}>
                  Save Section
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Lesson Create / Edit */}
      {lessonModal.isOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div style={{ backgroundColor: '#fff', borderRadius: 'var(--radius-lg)', maxWidth: '440px', width: '100%', padding: '1.75rem' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: '800', marginBottom: '1rem' }}>
              {lessonModal.isEdit ? 'Edit Lesson' : 'Add Lesson'}
            </h3>
            <form onSubmit={handleSaveLesson} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', marginBottom: '0.2rem' }}>Lesson Title</label>
                <input
                  type="text"
                  className="form-input"
                  value={lessonModal.data?.title || ''}
                  onChange={(e) => setLessonModal({ ...lessonModal, data: { ...lessonModal.data, title: e.target.value } })}
                  required
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', marginBottom: '0.2rem' }}>Video URL (YouTube or Direct MP4)</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="https://www.youtube.com/watch?v=..."
                  value={lessonModal.data?.video_url || ''}
                  onChange={(e) => setLessonModal({ ...lessonModal, data: { ...lessonModal.data, video_url: e.target.value } })}
                  required
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', marginBottom: '0.2rem' }}>Duration (minutes)</label>
                <input
                  type="number"
                  className="form-input"
                  value={lessonModal.data?.duration_minutes || 15}
                  onChange={(e) => setLessonModal({ ...lessonModal, data: { ...lessonModal.data, duration_minutes: parseInt(e.target.value) } })}
                  required
                />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <input
                  type="checkbox"
                  id="chk_free_prev"
                  checked={Boolean(lessonModal.data?.is_free_preview)}
                  onChange={(e) => setLessonModal({ ...lessonModal, data: { ...lessonModal.data, is_free_preview: e.target.checked } })}
                />
                <label htmlFor="chk_free_prev" style={{ fontSize: '0.85rem', fontWeight: '600' }}>
                  Make this a Free Sample Lesson (Playable by anyone)
                </label>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                <button type="button" onClick={() => setLessonModal({ isOpen: false, isEdit: false, data: null, sectionId: null, courseId: null })} className="btn btn-secondary" style={{ flex: 1 }}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" style={{ flex: 2, fontWeight: '700' }}>
                  Save Lesson
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Free Study Guide Create / Edit */}
      {guideModal.isOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div style={{ backgroundColor: '#fff', borderRadius: 'var(--radius-lg)', maxWidth: '440px', width: '100%', padding: '1.75rem' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: '800', marginBottom: '1rem' }}>
              {guideModal.isEdit ? 'Edit Free Study Guide' : 'Publish Free Study Guide'}
            </h3>
            <form onSubmit={handleSaveGuide} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', marginBottom: '0.2rem' }}>Title</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Tawjihi Physics Formula Sheet 2026"
                  value={guideModal.data?.title || ''}
                  onChange={(e) => setGuideModal({ ...guideModal, data: { ...guideModal.data, title: e.target.value } })}
                  required
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', marginBottom: '0.2rem' }}>Description</label>
                <textarea
                  className="form-input"
                  rows={2}
                  placeholder="Summary of what this guide covers..."
                  value={guideModal.data?.description || ''}
                  onChange={(e) => setGuideModal({ ...guideModal, data: { ...guideModal.data, description: e.target.value } })}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', marginBottom: '0.2rem' }}>PDF Download Link</label>
                <input
                  type="url"
                  className="form-input"
                  placeholder="https://example.com/sheet.pdf"
                  value={guideModal.data?.file_url || ''}
                  onChange={(e) => setGuideModal({ ...guideModal, data: { ...guideModal.data, file_url: e.target.value } })}
                  required
                />
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                <button type="button" onClick={() => setGuideModal({ isOpen: false, isEdit: false, data: null })} className="btn btn-secondary" style={{ flex: 1 }}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" style={{ flex: 2, fontWeight: '700' }}>
                  Publish Guide
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: 1-on-1 Offering Create / Edit */}
      {serviceModal.isOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div style={{ backgroundColor: '#fff', borderRadius: 'var(--radius-lg)', maxWidth: '440px', width: '100%', padding: '1.75rem' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: '800', marginBottom: '1rem' }}>
              {serviceModal.isEdit ? 'Edit 1-on-1 Offering' : 'Add 1-on-1 Offering'}
            </h3>
            <form onSubmit={handleSaveService} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', marginBottom: '0.2rem' }}>Session Title</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. 45-Min Calculus Problem Solving"
                  value={serviceModal.data?.title || ''}
                  onChange={(e) => setServiceModal({ ...serviceModal, data: { ...serviceModal.data, title: e.target.value } })}
                  required
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', marginBottom: '0.2rem' }}>Description</label>
                <textarea
                  className="form-input"
                  rows={2}
                  value={serviceModal.data?.description || ''}
                  onChange={(e) => setServiceModal({ ...serviceModal, data: { ...serviceModal.data, description: e.target.value } })}
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', marginBottom: '0.2rem' }}>Price (JOD)</label>
                  <input
                    type="number"
                    min="1"
                    className="form-input"
                    value={serviceModal.data?.price_jod || '15'}
                    onChange={(e) => setServiceModal({ ...serviceModal, data: { ...serviceModal.data, price_jod: e.target.value } })}
                    required
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', marginBottom: '0.2rem' }}>Duration (mins)</label>
                  <input
                    type="number"
                    className="form-input"
                    value={serviceModal.data?.duration_minutes || 45}
                    onChange={(e) => setServiceModal({ ...serviceModal, data: { ...serviceModal.data, duration_minutes: parseInt(e.target.value) } })}
                    required
                  />
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                <button type="button" onClick={() => setServiceModal({ isOpen: false, isEdit: false, data: null })} className="btn btn-secondary" style={{ flex: 1 }}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" style={{ flex: 2, fontWeight: '700' }}>
                  Save Offering
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Generate Prepaid Access Codes */}
      {generateCodeModal.isOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div style={{ backgroundColor: '#fff', borderRadius: 'var(--radius-lg)', maxWidth: '460px', width: '100%', padding: '1.75rem', position: 'relative' }}>
            <button
              type="button"
              onClick={() => setGenerateCodeModal({ ...generateCodeModal, isOpen: false })}
              style={{ position: 'absolute', top: '1.25rem', right: '1.25rem', background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
            >
              <X size={20} />
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: '#eff6ff', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Key size={18} />
              </div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: '800', color: '#0f172a', margin: 0 }}>
                {t('generateCodesBtn', 'Generate Prepaid Access Codes')}
              </h3>
            </div>

            <p style={{ fontSize: '0.825rem', color: '#64748b', marginBottom: '1.25rem' }}>
              {t('batchNamePlaceholder', 'Specify the partner bookshop name, code quantity, and standard 30-day price in JOD.')}
            </p>

            <form onSubmit={handleGenerateCodes} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', marginBottom: '0.25rem' }}>
                  {t('batchName', 'Batch / Bookshop Name (اسم المكتبة أو المركز)')}
                </label>
                <input
                  type="text"
                  className="form-input"
                  placeholder={t('batchNamePlaceholder', 'e.g. Dar Al-Hikma Bookshop (مكتبة دار الحكمة)')}
                  value={generateCodeModal.batch_name}
                  onChange={(e) => setGenerateCodeModal({ ...generateCodeModal, batch_name: e.target.value })}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', marginBottom: '0.25rem' }}>
                    {t('generateCodesCount', 'Number of Codes')}
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="500"
                    className="form-input"
                    value={generateCodeModal.count}
                    onChange={(e) => setGenerateCodeModal({ ...generateCodeModal, count: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', marginBottom: '0.25rem' }}>
                    {t('pricePerCodeJod', 'Price (JOD)')}
                  </label>
                  <input
                    type="number"
                    min="1"
                    className="form-input"
                    value={generateCodeModal.price_jod}
                    onChange={(e) => setGenerateCodeModal({ ...generateCodeModal, price_jod: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div style={{
                backgroundColor: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: 'var(--radius-sm)',
                padding: '0.75rem',
                fontSize: '0.8rem',
                color: '#475569'
              }}>
                <div>Estimated Total Value: <strong style={{ color: '#0f172a' }}>{(parseInt(generateCodeModal.count, 10) || 0) * (parseFloat(generateCodeModal.price_jod) || 0)} JOD</strong></div>
                <div style={{ fontSize: '0.725rem', color: '#64748b', marginTop: '2px' }}>Platform commission: 0% (You retain 100% of bookshop cash collections)</div>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.4rem' }}>
                <button
                  type="button"
                  onClick={() => setGenerateCodeModal({ ...generateCodeModal, isOpen: false })}
                  className="btn btn-secondary"
                  style={{ flex: 1 }}
                >
                  {t('close', 'Cancel')}
                </button>
                <button
                  type="submit"
                  disabled={generatingCodes}
                  className="btn btn-primary"
                  style={{ flex: 2, fontWeight: '700' }}
                >
                  {generatingCodes ? t('generating', 'Generating Codes...') : t('generateCodesBtn', 'Generate Codes')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Create / Edit Creator Feed Post */}
      {postModal.isOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div style={{ backgroundColor: '#fff', borderRadius: 'var(--radius-lg)', maxWidth: '520px', width: '100%', padding: '1.75rem', maxHeight: '90vh', overflowY: 'auto', position: 'relative' }}>
            <button
              type="button"
              onClick={() => setPostModal({ isOpen: false, isEdit: false, data: null })}
              style={{ position: 'absolute', top: '1.25rem', right: '1.25rem', background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
            >
              <X size={20} />
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: '#eff6ff', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Sparkles size={18} />
              </div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: '800', color: '#0f172a', margin: 0 }}>
                {postModal.isEdit ? 'Edit Feed Post' : t('createPostBtn', '+ Create New Post')}
              </h3>
            </div>

            <p style={{ fontSize: '0.825rem', color: '#64748b', marginBottom: '1.25rem' }}>
              {t('feedPostsSubtitle', 'Publish lessons, announcements, and video explanations for public students or active subscribers.')}
            </p>

            <form onSubmit={handleSavePost} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', marginBottom: '0.25rem' }}>
                  {t('postTitleLabel', 'Post Title')}
                </label>
                <input
                  type="text"
                  className="form-input"
                  placeholder={t('postTitlePlaceholder', 'e.g. Tawjihi Calculus Exam Review & Shortcuts')}
                  value={postModal.data?.title || ''}
                  onChange={(e) => setPostModal({ ...postModal, data: { ...postModal.data, title: e.target.value } })}
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', marginBottom: '0.25rem' }}>
                  {t('postVisibilityLabel', 'Audience Visibility (فئة المشاهدين)')}
                </label>
                <select
                  className="form-input"
                  value={postModal.data?.visibility || 'public'}
                  onChange={(e) => setPostModal({ ...postModal, data: { ...postModal.data, visibility: e.target.value } })}
                  style={{ fontWeight: '600' }}
                >
                  <option value="public">🌐 {t('visibilityPublic', 'Public (Free for everyone)')}</option>
                  <option value="subscribers">🔒 {t('visibilitySubscribers', 'Subscribers Only (Exclusive to subscribers & code holders)')}</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', marginBottom: '0.25rem' }}>
                  {t('postContentLabel', 'Post Content & Notes')}
                </label>
                <textarea
                  className="form-input"
                  rows={4}
                  placeholder={t('postContentPlaceholder', 'Write your lesson explanation, tips, or study advice...')}
                  value={postModal.data?.content || ''}
                  onChange={(e) => setPostModal({ ...postModal, data: { ...postModal.data, content: e.target.value } })}
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', marginBottom: '0.25rem' }}>
                  {t('postVideoUrlLabel', 'Video URL (Optional YouTube or MP4)')}
                </label>
                <input
                  type="url"
                  className="form-input"
                  placeholder="https://www.youtube.com/watch?v=..."
                  value={postModal.data?.media_url || ''}
                  onChange={(e) => setPostModal({ ...postModal, data: { ...postModal.data, media_url: e.target.value } })}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', marginBottom: '0.25rem' }}>
                  {t('postAttachmentsLabel', 'PDF Attachment Link (Optional)')}
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                  <input
                    type="text"
                    className="form-input"
                    placeholder={t('attachmentTitle', 'Attachment Title')}
                    value={postModal.data?.attachments?.[0]?.title || ''}
                    onChange={(e) => {
                      const prevAtt = postModal.data?.attachments?.[0] || { title: '', url: '' };
                      setPostModal({
                        ...postModal,
                        data: {
                          ...postModal.data,
                          attachments: [{ ...prevAtt, title: e.target.value }]
                        }
                      });
                    }}
                  />
                  <input
                    type="url"
                    className="form-input"
                    placeholder={t('attachmentUrl', 'File / PDF Link')}
                    value={postModal.data?.attachments?.[0]?.url || ''}
                    onChange={(e) => {
                      const prevAtt = postModal.data?.attachments?.[0] || { title: 'PDF Worksheet', url: '' };
                      setPostModal({
                        ...postModal,
                        data: {
                          ...postModal.data,
                          attachments: [{ ...prevAtt, url: e.target.value }]
                        }
                      });
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setPostModal({ isOpen: false, isEdit: false, data: null })}
                  className="btn btn-secondary"
                  style={{ flex: 1 }}
                >
                  {t('close', 'Cancel')}
                </button>
                <button
                  type="submit"
                  disabled={savingPost}
                  className="btn btn-primary"
                  style={{ flex: 2, fontWeight: '700' }}
                >
                  {savingPost ? t('publishing', 'Publishing...') : t('publishPostBtn', 'Publish Post')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
