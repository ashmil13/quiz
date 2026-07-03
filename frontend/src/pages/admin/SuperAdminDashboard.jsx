import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  AlertCircle, 
  RefreshCw, 
  Trash2, 
  Edit2, 
  LogOut, 
  LayoutDashboard, 
  FileText, 
  UserCheck, 
  Settings, 
  Plus, 
  Save, 
  X,
  Award,
  AlertTriangle,
  Menu
} from 'lucide-react';
import axios from '../../axios';
import { useNavigate } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';

function SuperAdminDashboard() {
  const { auth, setAuth } = useAuth();
  const navigate = useNavigate();

  // Tab State: 'overview' | 'reports' | 'users' | 'settings'
  const [activeTab, setActiveTab] = useState('overview');
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setShowMobileSidebar(false);
  };

  const [reports, setReports] = useState([]);
  const [users, setUsers] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [config, setConfig] = useState({ isProctorEnabled: true, maxWarnings: 2, examDuration: 30 });
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);
  const [violationsFilter, setViolationsFilter] = useState('completed'); // 'completed' | 'terminated' | 'violations'

  // Question Editor state
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [isEditing, setIsEditing] = useState(false);

  // Responsive View State
  const [isMobileView, setIsMobileView] = useState(window.innerWidth < 1024);
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobileView(window.innerWidth < 1024);
      if (window.innerWidth >= 1024) {
        setShowMobileSidebar(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Security Check: Redirect if not SuperAdmin sumi@gmail.com
  useEffect(() => {
    const role = auth.role || localStorage.getItem("role");
    const email = auth.email || localStorage.getItem("email");
    if (role !== 'SuperAdmin' || email !== 'sumi@gmail.com') {
      navigate('/user/quiz');
    }
  }, [auth, navigate]);

  // Fetch all backend data
  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem("accessToken");
      const authHeader = {
        headers: {
          Authorization: `Bearer ${token}`
        }
      };

      // Fetch reports
      const reportsRes = await axios.get('/api/exam-report/all', authHeader);
      if (reportsRes.data && reportsRes.data.reports) {
        setReports(reportsRes.data.reports);
      }

      // Fetch users
      const usersRes = await axios.get('/api/users', authHeader);
      if (usersRes.data && usersRes.data.users) {
        setUsers(usersRes.data.users);
      }

      // Fetch config
      const configRes = await axios.get('/api/quiz/config');
      if (configRes.data && configRes.data.config) {
        setConfig(configRes.data.config);
      }

      // Fetch questions
      const questionsRes = await axios.get('/api/quiz/questions');
      if (questionsRes.data && questionsRes.data.questions) {
        setQuestions(questionsRes.data.questions);
      }
    } catch (err) {
      console.error(err);
      setError('Failed to fetch dashboard data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [refreshKey]);

  const handleLogout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("role");
    localStorage.removeItem("userId");
    localStorage.removeItem("name");
    localStorage.removeItem("profileImage");
    localStorage.removeItem("email");
    setAuth({});
    navigate('/login');
  };

  // Delete Exam Report
  const handleDeleteReport = async (reportId, studentName) => {
    if (!window.confirm(`Are you sure you want to delete ${studentName}'s exam attempt? This will permanently delete their score.`)) {
      return;
    }

    try {
      const token = localStorage.getItem("accessToken");
      await axios.delete(`/api/exam-report/${reportId}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setRefreshKey(prev => prev + 1);
    } catch (err) {
      console.error(err);
      alert("Failed to delete the exam report.");
    }
  };

  // Give Second Chance (Grant Retake)
  const handleSecondChance = async (userId, studentName) => {
    if (!window.confirm(`Are you sure you want to grant a second chance to ${studentName}?`)) {
      return;
    }

    try {
      const token = localStorage.getItem("accessToken");
      await axios.post(`/api/users/${userId}/second-chance`, {}, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      alert(`Second chance successfully granted to ${studentName}!`);
      setRefreshKey(prev => prev + 1);
    } catch (err) {
      console.error(err);
      alert("Failed to grant second chance.");
    }
  };

  // Save Proctoring & Exam Duration Config
  const handleSaveConfig = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("accessToken");
      await axios.put('/api/quiz/config', config, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      alert("Configuration updated successfully!");
      setRefreshKey(prev => prev + 1);
    } catch (err) {
      console.error(err);
      alert("Failed to update configurations.");
    }
  };

  // Question CRUD Operations
  const handleOpenAddQuestion = () => {
    setEditingQuestion({
      question: '',
      options: [
        { key: 'A', text: '' },
        { key: 'B', text: '' },
        { key: 'C', text: '' },
        { key: 'D', text: '' }
      ],
      answer: 'A'
    });
    setIsEditing(true);
  };

  const handleOpenEditQuestion = (q) => {
    setEditingQuestion({ ...q });
    setIsEditing(true);
  };

  const handleDeleteQuestion = async (id) => {
    if (!window.confirm("Are you sure you want to delete this question?")) {
      return;
    }

    try {
      const token = localStorage.getItem("accessToken");
      await axios.delete(`/api/quiz/questions/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      alert("Question deleted successfully!");
      setRefreshKey(prev => prev + 1);
    } catch (err) {
      console.error(err);
      alert("Failed to delete question.");
    }
  };

  const handleSaveQuestionSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("accessToken");
      const authHeader = {
        headers: {
          Authorization: `Bearer ${token}`
        }
      };

      if (editingQuestion._id) {
        // Edit Mode
        await axios.put(`/api/quiz/questions/${editingQuestion._id}`, editingQuestion, authHeader);
        alert("Question updated successfully!");
      } else {
        // Create Mode
        await axios.post('/api/quiz/questions', editingQuestion, authHeader);
        alert("Question created successfully!");
      }
      setIsEditing(false);
      setEditingQuestion(null);
      setRefreshKey(prev => prev + 1);
    } catch (err) {
      console.error(err);
      alert("Failed to save question.");
    }
  };

  // Calculations for Overview Screen
  const totalAttempts = reports.length;
  const averageScore = totalAttempts > 0 
    ? Math.round((reports.reduce((acc, curr) => acc + (curr.score / curr.totalQuestions), 0) / totalAttempts) * 100) 
    : 0;
  const flaggedReports = reports.filter(r => r.suspicionScore >= 60).length;
  const totalStudents = users.filter(u => u.role === 'User').length;

  return (
    <div style={{
      display: 'flex',
      flexDirection: isMobileView ? 'column' : 'row',
      minHeight: '100vh',
      width: '100%',
      background: '#090d16',
      color: '#f8fafc',
      fontFamily: "'Outfit', sans-serif"
    }}>
      {/* Mobile Drawer Backdrop */}
      {isMobileView && showMobileSidebar && (
        <div 
          onClick={() => setShowMobileSidebar(false)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.6)',
            zIndex: 9998,
            backdropFilter: 'blur(4px)',
            transition: 'opacity 0.3s ease'
          }}
        />
      )}

      {/* Sidebar Panel */}
      <div style={{
        position: isMobileView ? 'fixed' : 'relative',
        top: 0,
        left: isMobileView ? (showMobileSidebar ? 0 : '-280px') : 0,
        height: '100vh',
        width: '280px',
        background: '#0c1322',
        borderRight: '1px solid rgba(255, 255, 255, 0.05)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '2rem 1.5rem',
        boxSizing: 'border-box',
        zIndex: 9999,
        transition: 'left 0.3s ease-in-out'
      }}>
        <div>
          {/* Logo Title */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <Shield size={28} color="#c084fc" style={{ filter: 'drop-shadow(0 0 8px rgba(168, 85, 247, 0.5))' }} />
              <span style={{ fontSize: '1.25rem', fontWeight: 800, letterSpacing: '0.5px' }}>
                PROCTOR<span style={{ color: '#c084fc' }}>ADMIN</span>
              </span>
            </div>
            {isMobileView && (
              <button 
                onClick={() => setShowMobileSidebar(false)}
                style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            )}
          </div>

          {/* Navigation Links */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <button
              onClick={() => handleTabChange('overview')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.8rem 1rem',
                borderRadius: '12px',
                border: 'none',
                background: activeTab === 'overview' ? 'rgba(168, 85, 247, 0.15)' : 'transparent',
                color: activeTab === 'overview' ? '#e9d5ff' : '#94a3b8',
                fontSize: '0.95rem',
                fontWeight: activeTab === 'overview' ? 600 : 500,
                textAlign: 'left',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              <LayoutDashboard size={18} />
              Overview
            </button>

            <button
              onClick={() => handleTabChange('reports')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.8rem 1rem',
                borderRadius: '12px',
                border: 'none',
                background: activeTab === 'reports' ? 'rgba(168, 85, 247, 0.15)' : 'transparent',
                color: activeTab === 'reports' ? '#e9d5ff' : '#94a3b8',
                fontSize: '0.95rem',
                fontWeight: activeTab === 'reports' ? 600 : 500,
                textAlign: 'left',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              <FileText size={18} />
              Exam Reports
            </button>

            <button
              onClick={() => handleTabChange('users')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.8rem 1rem',
                borderRadius: '12px',
                border: 'none',
                background: activeTab === 'users' ? 'rgba(168, 85, 247, 0.15)' : 'transparent',
                color: activeTab === 'users' ? '#e9d5ff' : '#94a3b8',
                fontSize: '0.95rem',
                fontWeight: activeTab === 'users' ? 600 : 500,
                textAlign: 'left',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              <UserCheck size={18} />
              User Retakes
            </button>

            <button
              onClick={() => handleTabChange('violations')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.8rem 1rem',
                borderRadius: '12px',
                border: 'none',
                background: activeTab === 'violations' ? 'rgba(168, 85, 247, 0.15)' : 'transparent',
                color: activeTab === 'violations' ? '#e9d5ff' : '#94a3b8',
                fontSize: '0.95rem',
                fontWeight: activeTab === 'violations' ? 600 : 500,
                textAlign: 'left',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              <AlertTriangle size={18} />
              Violations Log
            </button>

            <button
              onClick={() => handleTabChange('settings')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.8rem 1rem',
                borderRadius: '12px',
                border: 'none',
                background: activeTab === 'settings' ? 'rgba(168, 85, 247, 0.15)' : 'transparent',
                color: activeTab === 'settings' ? '#e9d5ff' : '#94a3b8',
                fontSize: '0.95rem',
                fontWeight: activeTab === 'settings' ? 600 : 500,
                textAlign: 'left',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              <Settings size={18} />
              Quiz Controls
            </button>
          </div>
        </div>

        {/* Logout Section */}
        <div>
          <button
            onClick={handleLogout}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              width: '100%',
              padding: '0.8rem 1rem',
              borderRadius: '12px',
              border: 'none',
              background: 'rgba(239, 68, 68, 0.08)',
              color: '#f87171',
              fontSize: '0.95rem',
              fontWeight: 600,
              textAlign: 'left',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.15)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.08)'}
          >
            <LogOut size={18} />
            Logout
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div style={{
        flex: 1,
        padding: isMobileView ? '1.5rem 1rem' : '2.5rem',
        boxSizing: 'border-box',
        overflowY: 'auto',
        maxHeight: isMobileView ? 'calc(100vh - 60px)' : '100vh'
      }}>
        {/* Mobile Header Bar */}
        {isMobileView && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'rgba(15, 23, 42, 0.6)',
            borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
            padding: '1rem',
            margin: '-1.5rem -1rem 1.5rem -1rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <button 
                onClick={() => setShowMobileSidebar(true)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#f8fafc',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  padding: 0
                }}
              >
                <Menu size={24} />
              </button>
              <span style={{ fontSize: '1rem', fontWeight: 800 }}>
                PROCTOR<span style={{ color: '#c084fc' }}>ADMIN</span>
              </span>
            </div>
            
            <button
              onClick={() => setRefreshKey(prev => prev + 1)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                padding: '0.4rem 0.8rem',
                borderRadius: '8px',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                background: 'rgba(255, 255, 255, 0.02)',
                color: '#f8fafc',
                fontSize: '0.8rem',
                cursor: 'pointer',
                outline: 'none'
              }}
            >
              <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
              Sync
            </button>
          </div>
        )}

        {/* Top bar */}
        <div style={{
          display: 'flex',
          flexDirection: isMobileView ? 'column' : 'row',
          justifyContent: 'space-between',
          alignItems: isMobileView ? 'flex-start' : 'center',
          gap: '1rem',
          marginBottom: '2rem',
          borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
          paddingBottom: '1.5rem'
        }}>
          <div>
            <h2 style={{ fontSize: isMobileView ? '1.4rem' : '1.75rem', fontWeight: 800, margin: '0 0 0.25rem 0' }}>
              {activeTab === 'overview' && 'Dashboard Overview'}
              {activeTab === 'reports' && 'Exam Reports'}
              {activeTab === 'users' && 'Candidate Retake Permissions'}
              {activeTab === 'violations' && 'Proctor Violations Log'}
              {activeTab === 'settings' && 'Quiz & Proctor Configurations'}
            </h2>
            <p style={{ color: '#64748b', fontSize: '0.85rem', margin: 0, lineHeight: 1.4 }}>
              {activeTab === 'overview' && 'Proctoring metrics and exam summary statistics.'}
              {activeTab === 'reports' && 'Detailed log of student violations and report cards.'}
              {activeTab === 'users' && 'Manage student exam attempts and issue second-chance retakes.'}
              {activeTab === 'violations' && 'Detailed audit of why exams were terminated and specific violation reasons.'}
              {activeTab === 'settings' && 'Fully customize Malayalam quiz questions and anti-cheat constraints.'}
            </p>
          </div>

          {!isMobileView && (
            <button
              onClick={() => setRefreshKey(prev => prev + 1)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.6rem 1.2rem',
                borderRadius: '10px',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                background: 'rgba(255, 255, 255, 0.02)',
                color: '#f8fafc',
                fontSize: '0.85rem',
                cursor: 'pointer',
                transition: 'all 0.2s',
                outline: 'none'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.02)'}
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
              Sync Data
            </button>
          )}
        </div>

        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '6rem 0', gap: '1rem' }}>
            <RefreshCw className="animate-spin" size={32} color="#c084fc" />
            <span style={{ color: '#94a3b8' }}>Syncing data feeds...</span>
          </div>
        ) : error ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '1.5rem', background: 'rgba(239, 68, 68, 0.05)', border: '1px solid rgba(239, 68, 68, 0.1)', borderRadius: '16px', color: '#f87171' }}>
            <AlertCircle size={24} />
            <span>{error}</span>
          </div>
        ) : (
          <>
            {/* OVERVIEW TAB */}
            {activeTab === 'overview' && (
              <div>
                {/* Metric Cards Grid */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                  gap: '1.5rem',
                  marginBottom: '2.5rem'
                }}>
                  <div style={{
                    background: 'rgba(30, 41, 59, 0.25)',
                    border: '1px solid rgba(255, 255, 255, 0.05)',
                    borderRadius: '20px',
                    padding: '1.5rem',
                    boxSizing: 'border-box'
                  }}>
                    <span style={{ color: '#64748b', fontSize: '0.85rem', fontWeight: 600, textTransform: 'uppercase' }}>Total Attempts</span>
                    <h3 style={{ fontSize: '2.25rem', fontWeight: 800, margin: '0.5rem 0 0 0', color: '#c084fc' }}>{totalAttempts}</h3>
                  </div>

                  <div style={{
                    background: 'rgba(30, 41, 59, 0.25)',
                    border: '1px solid rgba(255, 255, 255, 0.05)',
                    borderRadius: '20px',
                    padding: '1.5rem',
                    boxSizing: 'border-box'
                  }}>
                    <span style={{ color: '#64748b', fontSize: '0.85rem', fontWeight: 600, textTransform: 'uppercase' }}>Avg Quiz Grade</span>
                    <h3 style={{ fontSize: '2.25rem', fontWeight: 800, margin: '0.5rem 0 0 0', color: '#10b981' }}>{averageScore}%</h3>
                  </div>

                  <div style={{
                    background: 'rgba(30, 41, 59, 0.25)',
                    border: '1px solid rgba(255, 255, 255, 0.05)',
                    borderRadius: '20px',
                    padding: '1.5rem',
                    boxSizing: 'border-box'
                  }}>
                    <span style={{ color: '#64748b', fontSize: '0.85rem', fontWeight: 600, textTransform: 'uppercase' }}>Flagged Cheaters</span>
                    <h3 style={{ fontSize: '2.25rem', fontWeight: 800, margin: '0.5rem 0 0 0', color: '#ef4444' }}>{flaggedReports}</h3>
                  </div>

                  <div style={{
                    background: 'rgba(30, 41, 59, 0.25)',
                    border: '1px solid rgba(255, 255, 255, 0.05)',
                    borderRadius: '20px',
                    padding: '1.5rem',
                    boxSizing: 'border-box'
                  }}>
                    <span style={{ color: '#64748b', fontSize: '0.85rem', fontWeight: 600, textTransform: 'uppercase' }}>Total Candidates</span>
                    <h3 style={{ fontSize: '2.25rem', fontWeight: 800, margin: '0.5rem 0 0 0', color: '#38bdf8' }}>{totalStudents}</h3>
                  </div>
                </div>

                {/* Quick Info Box */}
                <div style={{
                  background: 'rgba(168, 85, 247, 0.03)',
                  border: '1px solid rgba(168, 85, 247, 0.1)',
                  borderRadius: '20px',
                  padding: '1.5rem',
                  display: 'flex',
                  flexDirection: isMobileView ? 'column' : 'row',
                  alignItems: isMobileView ? 'flex-start' : 'center',
                  gap: '1.25rem'
                }}>
                  <Award size={isMobileView ? 36 : 48} color="#c084fc" />
                  <div>
                    <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '1.15rem', fontWeight: 700 }}>Proctoring Engine Status</h4>
                    <p style={{ margin: 0, color: '#94a3b8', fontSize: '0.9rem', lineHeight: 1.6 }}>
                      Standardized anti-cheat mechanisms are currently {config.isProctorEnabled ? 'active' : 'disabled'}. 
                      The system allows up to <strong>{config.maxWarnings} warnings</strong> before automatic submission is triggered. 
                      Candidates are given exactly <strong>{config.examDuration} seconds</strong> per question.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* EXAM REPORTS TAB */}
            {activeTab === 'reports' && (
              <div>
                {reports.length === 0 ? (
                  <div style={{
                    background: 'rgba(30, 41, 59, 0.15)',
                    border: '1px solid rgba(255, 255, 255, 0.04)',
                    borderRadius: '24px',
                    padding: '4rem 2rem',
                    textAlign: 'center'
                  }}>
                    <FileText size={48} style={{ opacity: 0.3, marginBottom: '1rem' }} />
                    <p style={{ color: '#64748b', margin: 0 }}>No exam report logs found.</p>
                  </div>
                ) : (
                  <div style={{
                    background: 'rgba(30, 41, 59, 0.15)',
                    border: '1px solid rgba(255, 255, 255, 0.04)',
                    borderRadius: '24px',
                    padding: '1.5rem',
                    boxSizing: 'border-box',
                    overflowX: 'auto'
                  }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.08)', color: '#94a3b8', fontSize: '0.85rem', textTransform: 'uppercase' }}>
                          <th style={{ padding: '1rem' }}>Candidate</th>
                          <th style={{ padding: '1rem' }}>Exam Title</th>
                          <th style={{ padding: '1rem' }}>Status</th>
                          <th style={{ padding: '1rem' }}>Score</th>
                          <th style={{ padding: '1rem' }}>Suspicion Score</th>
                          <th style={{ padding: '1rem' }}>System Log Timeline</th>
                          <th style={{ padding: '1rem', textAlign: 'center' }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {reports.map((report) => {
                          const isSuspicious = report.suspicionScore >= 60;
                          return (
                            <tr key={report._id} style={{ 
                              borderBottom: '1px solid rgba(255, 255, 255, 0.04)', 
                              fontSize: '0.9rem'
                            }}>
                              <td style={{ padding: '1rem', fontWeight: 600 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                                  {isSuspicious && <span title="Suspicious activity flagged" style={{ color: '#ef4444' }}>🚩</span>}
                                  <span style={{
                                    color: (!report.events || report.events.length === 0) && (report.suspicionScore === 0) ? '#10b981' : '#f8fafc'
                                  }}>
                                    {report.studentName}
                                  </span>
                                  {(!report.events || report.events.length === 0) && (report.suspicionScore === 0) && (
                                    <span style={{
                                      background: 'rgba(16, 185, 129, 0.12)',
                                      border: '1px solid rgba(16, 185, 129, 0.3)',
                                      color: '#10b981',
                                      padding: '0.15rem 0.4rem',
                                      borderRadius: '12px',
                                      fontSize: '0.7rem',
                                      fontWeight: 600
                                    }}>
                                      Trusted Person
                                    </span>
                                  )}
                                </div>
                              </td>
                            <td style={{ padding: '1rem', color: '#94a3b8' }}>{report.examName}</td>
                            <td style={{ padding: '1rem' }}>
                              {report.status === 'Terminated' ? (
                                <span style={{ background: 'rgba(239, 68, 68, 0.12)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#f87171', padding: '0.2rem 0.6rem', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 600 }}>
                                  TERMINATED
                                </span>
                              ) : (
                                <span style={{ background: 'rgba(16, 185, 129, 0.12)', border: '1px solid rgba(16, 185, 129, 0.3)', color: '#10b981', padding: '0.2rem 0.6rem', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 600 }}>
                                  COMPLETED
                                </span>
                              )}
                            </td>
                            <td style={{ padding: '1rem', color: '#ffffff', fontWeight: 600 }}>
                              {report.score} / {report.totalQuestions} ({Math.round((report.score / report.totalQuestions) * 100)}%)
                            </td>
                            <td style={{ padding: '1rem' }}>
                              <span style={{
                                color: (report.suspicionScore || 0) > 0 ? '#f97316' : '#10b981',
                                fontWeight: 700
                              }}>
                                {report.suspicionScore !== undefined && report.suspicionScore !== null ? report.suspicionScore : 0}%
                              </span>
                            </td>
                            <td style={{ padding: '1rem', maxWidth: '350px' }}>
                              {report.events && report.events.length > 0 ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', maxHeight: '120px', overflowY: 'auto' }}>
                                  {report.events.map((evt, idx) => (
                                    <span key={idx} style={{ fontSize: '0.75rem', color: '#64748b' }}>
                                      <strong style={{ color: '#cbd5e1' }}>[{evt.time}]</strong> {evt.type}: {evt.message}
                                    </span>
                                  ))}
                                </div>
                              ) : (
                                <span style={{ color: '#10b981', fontSize: '0.75rem' }}>No anomalies flagged (Passed proctoring)</span>
                              )}
                            </td>
                            <td style={{ padding: '1rem', textAlign: 'center' }}>
                              <button
                                onClick={() => handleDeleteReport(report._id, report.studentName)}
                                style={{
                                  background: 'rgba(239, 68, 68, 0.08)',
                                  border: '1px solid rgba(239, 68, 68, 0.2)',
                                  borderRadius: '8px',
                                  color: '#f87171',
                                  padding: '0.4rem 0.8rem',
                                  cursor: 'pointer',
                                  fontSize: '0.8rem',
                                  transition: 'all 0.2s',
                                  outline: 'none'
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)';
                                  e.currentTarget.style.color = '#ef4444';
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.background = 'rgba(239, 68, 68, 0.08)';
                                  e.currentTarget.style.color = '#f87171';
                                }}
                              >
                                <Trash2 size={12} style={{ marginRight: '0.25rem' }} />
                                Delete
                              </button>
                            </td>
                          </tr>
                        )})}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* PROCTOR VIOLATIONS TAB */}
            {activeTab === 'violations' && (
              <div>
                {/* Category filtering switcher */}
                <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
                  <button
                    onClick={() => setViolationsFilter('completed')}
                    style={{
                      padding: '0.6rem 1.2rem',
                      borderRadius: '10px',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      background: violationsFilter === 'completed' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255, 255, 255, 0.02)',
                      color: violationsFilter === 'completed' ? '#10b981' : '#94a3b8',
                      cursor: 'pointer',
                      fontSize: '0.85rem',
                      fontWeight: 600,
                      transition: 'all 0.2s',
                      outline: 'none'
                    }}
                  >
                    Completed Users ({reports.filter(r => r.status === 'Completed').length})
                  </button>
                  <button
                    onClick={() => setViolationsFilter('terminated')}
                    style={{
                      padding: '0.6rem 1.2rem',
                      borderRadius: '10px',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      background: violationsFilter === 'terminated' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(255, 255, 255, 0.02)',
                      color: violationsFilter === 'terminated' ? '#f87171' : '#94a3b8',
                      cursor: 'pointer',
                      fontSize: '0.85rem',
                      fontWeight: 600,
                      transition: 'all 0.2s',
                      outline: 'none'
                    }}
                  >
                    Terminated Users ({reports.filter(r => r.status === 'Terminated').length})
                  </button>
                  <button
                    onClick={() => setViolationsFilter('violations')}
                    style={{
                      padding: '0.6rem 1.2rem',
                      borderRadius: '10px',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      background: violationsFilter === 'violations' ? 'rgba(251, 191, 36, 0.15)' : 'rgba(255, 255, 255, 0.02)',
                      color: violationsFilter === 'violations' ? '#fbbf24' : '#94a3b8',
                      cursor: 'pointer',
                      fontSize: '0.85rem',
                      fontWeight: 600,
                      transition: 'all 0.2s',
                      outline: 'none'
                    }}
                  >
                    Violations ({reports.filter(r => r.status === 'Completed' && r.events && r.events.some(e => e.type !== 'Auto Submit' && e.type !== 'Terminated' && e.type !== 'Exam Terminated')).length})
                  </button>
                </div>

                {reports.filter(r => {
                  if (violationsFilter === 'completed') return r.status === 'Completed';
                  if (violationsFilter === 'terminated') return r.status === 'Terminated';
                  if (violationsFilter === 'violations') return r.status === 'Completed' && r.events && r.events.some(e => e.type !== 'Auto Submit' && e.type !== 'Terminated' && e.type !== 'Exam Terminated');
                  return true;
                }).length === 0 ? (
                  <div style={{
                    background: 'rgba(30, 41, 59, 0.15)',
                    border: '1px solid rgba(255, 255, 255, 0.04)',
                    borderRadius: '24px',
                    padding: '4rem 2rem',
                    textAlign: 'center'
                  }}>
                    <AlertTriangle size={48} color="#fbbf24" style={{ opacity: 0.5, marginBottom: '1rem' }} />
                    <p style={{ color: '#64748b', margin: 0 }}>No proctoring records match this category.</p>
                  </div>
                ) : (
                  <div style={{
                    background: 'rgba(30, 41, 59, 0.15)',
                    border: '1px solid rgba(255, 255, 255, 0.04)',
                    borderRadius: '24px',
                    padding: '1.5rem',
                    boxSizing: 'border-box',
                    overflowX: 'auto'
                  }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.08)', color: '#94a3b8', fontSize: '0.85rem', textTransform: 'uppercase' }}>
                          <th style={{ padding: '1rem' }}>Candidate</th>
                          <th style={{ padding: '1rem' }}>Exam Title</th>
                          <th style={{ padding: '1rem' }}>Termination Status</th>
                          <th style={{ padding: '1rem' }}>Why Terminated?</th>
                          <th style={{ padding: '1rem' }}>Violation Reasons</th>
                          <th style={{ padding: '1rem', textAlign: 'center' }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {reports
                          .filter(r => {
                            if (violationsFilter === 'completed') return r.status === 'Completed';
                            if (violationsFilter === 'terminated') return r.status === 'Terminated';
                            if (violationsFilter === 'violations') return r.status === 'Completed' && r.events && r.events.some(e => e.type !== 'Auto Submit' && e.type !== 'Terminated' && e.type !== 'Exam Terminated');
                            return true;
                          })
                          .map((report) => {
                            const autoSubmitEvent = report.events?.find(e => e.type === 'Auto Submit' || e.type === 'Terminated' || e.type === 'Exam Terminated');
                            const terminationReason = autoSubmitEvent ? autoSubmitEvent.message : (report.status === 'Terminated' ? 'Exceeded warnings limit or left exam bounds.' : 'N/A - Completed');
                            const otherViolations = report.events?.filter(e => e.type !== 'Auto Submit' && e.type !== 'Terminated' && e.type !== 'Exam Terminated') || [];

                            return (
                              <tr key={report._id} style={{ 
                                borderBottom: '1px solid rgba(255, 255, 255, 0.04)', 
                                fontSize: '0.9rem'
                              }}>
                                <td style={{ padding: '1rem', fontWeight: 600, color: '#f8fafc' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                    {report.suspicionScore >= 60 && <span title="Suspicious activity flagged" style={{ color: '#ef4444' }}>🚩</span>}
                                    <span>{report.studentName}</span>
                                  </div>
                                </td>
                                <td style={{ padding: '1rem', color: '#94a3b8' }}>{report.examName}</td>
                                <td style={{ padding: '1rem' }}>
                                  {report.status === 'Terminated' ? (
                                    <span style={{ background: 'rgba(239, 68, 68, 0.12)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#f87171', padding: '0.2rem 0.6rem', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 600 }}>
                                      TERMINATED
                                    </span>
                                  ) : (
                                    <span style={{ background: 'rgba(16, 185, 129, 0.12)', border: '1px solid rgba(16, 185, 129, 0.3)', color: '#10b981', padding: '0.2rem 0.6rem', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 600 }}>
                                      COMPLETED
                                    </span>
                                  )}
                                </td>
                                <td style={{ padding: '1rem', color: report.status === 'Terminated' ? '#f87171' : '#cbd5e1', fontWeight: report.status === 'Terminated' ? 600 : 500 }}>
                                  {terminationReason}
                                </td>
                                <td style={{ padding: '1rem', maxWidth: '300px' }}>
                                  {otherViolations.length > 0 ? (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', maxHeight: '120px', overflowY: 'auto' }}>
                                      {otherViolations.map((evt, idx) => (
                                        <span key={idx} style={{ fontSize: '0.75rem', color: '#cbd5e1' }}>
                                          <strong style={{ color: '#fbbf24' }}>[{evt.time}]</strong> {evt.type}: {evt.message}
                                        </span>
                                      ))}
                                    </div>
                                  ) : (
                                    <span style={{ 
                                      color: report.status === 'Terminated' ? '#f87171' : '#10b981', 
                                      fontSize: '0.75rem',
                                      fontWeight: 600
                                    }}>
                                      {report.status === 'Terminated' 
                                        ? 'Terminated on first infraction (No warnings given)' 
                                        : 'Clean Record (No Warnings)'}
                                    </span>
                                  )}
                                </td>
                                <td style={{ padding: '1rem', textAlign: 'center' }}>
                                  <button
                                    onClick={() => handleDeleteReport(report._id, report.studentName)}
                                    style={{
                                      background: 'rgba(239, 68, 68, 0.08)',
                                      border: '1px solid rgba(239, 68, 68, 0.2)',
                                      borderRadius: '8px',
                                      color: '#f87171',
                                      padding: '0.4rem 0.8rem',
                                      cursor: 'pointer',
                                      fontSize: '0.8rem',
                                      transition: 'all 0.2s',
                                      outline: 'none'
                                    }}
                                    onMouseEnter={(e) => {
                                      e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)';
                                      e.currentTarget.style.color = '#ef4444';
                                    }}
                                    onMouseLeave={(e) => {
                                      e.currentTarget.style.background = 'rgba(239, 68, 68, 0.08)';
                                      e.currentTarget.style.color = '#f87171';
                                    }}
                                  >
                                    <Trash2 size={12} style={{ marginRight: '0.25rem' }} />
                                    Delete
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* USER RETAKES TAB */}
            {activeTab === 'users' && (
              <div>
                {users.filter(u => u.role === 'User' && (u.retakeAllowed || reports.some(r => r.user === u._id || r.studentName === u.name))).length === 0 ? (
                  <div style={{
                    background: 'rgba(30, 41, 59, 0.15)',
                    border: '1px solid rgba(255, 255, 255, 0.04)',
                    borderRadius: '24px',
                    padding: '4rem 2rem',
                    textAlign: 'center'
                  }}>
                    <UserCheck size={48} style={{ opacity: 0.3, marginBottom: '1rem', color: '#64748b' }} />
                    <p style={{ color: '#64748b', margin: 0 }}>No active candidates found for retake management.</p>
                  </div>
                ) : (
                  <div style={{
                    background: 'rgba(30, 41, 59, 0.15)',
                    border: '1px solid rgba(255, 255, 255, 0.04)',
                    borderRadius: '24px',
                    padding: '1.5rem',
                    boxSizing: 'border-box',
                    overflowX: 'auto'
                  }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.08)', color: '#94a3b8', fontSize: '0.85rem', textTransform: 'uppercase' }}>
                          <th style={{ padding: '1rem' }}>Student Name</th>
                          <th style={{ padding: '1rem' }}>Email Address</th>
                          <th style={{ padding: '1rem' }}>Status</th>
                          <th style={{ padding: '1rem' }}>History</th>
                          <th style={{ padding: '1rem', textAlign: 'center' }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {users.filter(u => u.role === 'User' && (u.retakeAllowed || reports.some(r => r.user === u._id || r.studentName === u.name))).map((user) => {
                          const userReport = reports.find(r => r.user === user._id || r.studentName === user.name);
                          const isUserSuspicious = userReport && userReport.suspicionScore >= 60;
                          return (
                            <tr key={user._id} style={{ 
                              borderBottom: '1px solid rgba(255, 255, 255, 0.04)', 
                              fontSize: '0.9rem'
                            }}>
                              <td style={{ padding: '1rem', fontWeight: 600 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                                  {isUserSuspicious && <span title="Suspicious activity flagged" style={{ color: '#ef4444' }}>🚩</span>}
                                  <span style={{
                                    color: userReport && (!userReport.events || userReport.events.length === 0) && (userReport.suspicionScore === 0) ? '#10b981' : '#f8fafc'
                                  }}>
                                    {user.name}
                                  </span>
                                  {userReport && (!userReport.events || userReport.events.length === 0) && (userReport.suspicionScore === 0) && (
                                    <span style={{
                                      background: 'rgba(16, 185, 129, 0.12)',
                                      border: '1px solid rgba(16, 185, 129, 0.3)',
                                      color: '#10b981',
                                      padding: '0.15rem 0.4rem',
                                      borderRadius: '12px',
                                      fontSize: '0.7rem',
                                      fontWeight: 600
                                    }}>
                                      Trusted Person
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td style={{ padding: '1rem', color: '#94a3b8' }}>{user.email}</td>
                              <td style={{ padding: '1rem' }}>
                                {user.retakeAllowed ? (
                                  <span style={{ background: 'rgba(168, 85, 247, 0.12)', border: '1px solid rgba(168, 85, 247, 0.3)', color: '#c084fc', padding: '0.2rem 0.6rem', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 600 }}>
                                    Second Chance Active
                                  </span>
                                ) : userReport ? (
                                  userReport.status === 'Terminated' ? (
                                    <span style={{ background: 'rgba(239, 68, 68, 0.12)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#f87171', padding: '0.2rem 0.6rem', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 600 }}>
                                      TERMINATED
                                    </span>
                                  ) : (
                                    <span style={{ background: 'rgba(16, 185, 129, 0.12)', border: '1px solid rgba(16, 185, 129, 0.3)', color: '#10b981', padding: '0.2rem 0.6rem', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 600 }}>
                                      COMPLETED
                                    </span>
                                  )
                                ) : (
                                  <span style={{ background: 'rgba(100, 116, 139, 0.12)', border: '1px solid rgba(100, 116, 139, 0.3)', color: '#94a3b8', padding: '0.2rem 0.6rem', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 600 }}>
                                    Pending
                                  </span>
                                )}
                              </td>
                              <td style={{ padding: '1rem', color: '#cbd5e1' }}>
                                {userReport ? (
                                  <span>Score: {userReport.score}/{userReport.totalQuestions} ({Math.round((userReport.score / userReport.totalQuestions) * 100)}%)</span>
                                ) : (
                                  <span style={{ color: '#64748b' }}>N/A</span>
                                )}
                              </td>
                              <td style={{ padding: '1rem', textAlign: 'center' }}>
                                {userReport && !user.retakeAllowed ? (
                                  <button
                                    onClick={() => handleSecondChance(user._id, user.name)}
                                    style={{
                                      background: 'rgba(168, 85, 247, 0.1)',
                                      border: '1px solid rgba(168, 85, 247, 0.2)',
                                      borderRadius: '8px',
                                      color: '#c084fc',
                                      padding: '0.4rem 0.8rem',
                                      cursor: 'pointer',
                                      fontSize: '0.8rem',
                                      transition: 'all 0.2s',
                                      outline: 'none'
                                    }}
                                    onMouseEnter={(e) => {
                                      e.currentTarget.style.background = 'rgba(168, 85, 247, 0.2)';
                                      e.currentTarget.style.color = '#e9d5ff';
                                    }}
                                    onMouseLeave={(e) => {
                                      e.currentTarget.style.background = 'rgba(168, 85, 247, 0.1)';
                                      e.currentTarget.style.color = '#c084fc';
                                    }}
                                  >
                                    <UserCheck size={12} style={{ marginRight: '0.25rem' }} />
                                    Give Second Chance
                                  </button>
                                ) : (
                                  <span style={{ color: '#475569', fontSize: '0.8rem' }}>No action required</span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* QUIZ & PROCTOR CONTROLS TAB */}
            {activeTab === 'settings' && (
              <div>
                {/* 1. Global Configurations Form */}
                <form onSubmit={handleSaveConfig} style={{
                  background: 'rgba(30, 41, 59, 0.15)',
                  border: '1px solid rgba(255, 255, 255, 0.04)',
                  borderRadius: '24px',
                  padding: '2rem',
                  marginBottom: '2.5rem',
                  boxSizing: 'border-box'
                }}>
                  <h3 style={{ margin: '0 0 1.5rem 0', fontSize: '1.25rem', fontWeight: 700, borderBottom: '1px solid rgba(255, 255, 255, 0.05)', paddingBottom: '0.75rem' }}>
                    Anti-Cheat Settings
                  </h3>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem' }}>
                    {/* Proctor Toggle */}
                    <div>
                      <label style={{ display: 'block', fontSize: '0.85rem', color: '#94a3b8', marginBottom: '0.5rem', fontWeight: 600 }}>
                        AI Proctoring Mode
                      </label>
                      <select 
                        value={config.isProctorEnabled ? 'true' : 'false'}
                        onChange={(e) => setConfig({ ...config, isProctorEnabled: e.target.value === 'true' })}
                        style={{
                          width: '100%',
                          background: '#0d1322',
                          border: '1px solid rgba(255, 255, 255, 0.08)',
                          borderRadius: '10px',
                          color: '#ffffff',
                          padding: '0.75rem',
                          outline: 'none'
                        }}
                      >
                        <option value="true">Active (Strict Anti-Cheat)</option>
                        <option value="false">Inactive (Free Play)</option>
                      </select>
                    </div>

                    {/* Warnings threshold */}
                    <div>
                      <label style={{ display: 'block', fontSize: '0.85rem', color: '#94a3b8', marginBottom: '0.5rem', fontWeight: 600 }}>
                        Allowed Violation Warnings
                      </label>
                      <input 
                        type="number"
                        min="1"
                        max="10"
                        value={config.maxWarnings}
                        onChange={(e) => setConfig({ ...config, maxWarnings: parseInt(e.target.value) || 2 })}
                        style={{
                          width: '100%',
                          background: '#0d1322',
                          border: '1px solid rgba(255, 255, 255, 0.08)',
                          borderRadius: '10px',
                          color: '#ffffff',
                          padding: '0.75rem',
                          outline: 'none',
                          boxSizing: 'border-box'
                        }}
                      />
                    </div>

                    {/* Timer */}
                    <div>
                      <label style={{ display: 'block', fontSize: '0.85rem', color: '#94a3b8', marginBottom: '0.5rem', fontWeight: 600 }}>
                        Exam Timer (Seconds per Question)
                      </label>
                      <input 
                        type="number"
                        min="10"
                        max="300"
                        value={config.examDuration}
                        onChange={(e) => setConfig({ ...config, examDuration: parseInt(e.target.value) || 30 })}
                        style={{
                          width: '100%',
                          background: '#0d1322',
                          border: '1px solid rgba(255, 255, 255, 0.08)',
                          borderRadius: '10px',
                          color: '#ffffff',
                          padding: '0.75rem',
                          outline: 'none',
                          boxSizing: 'border-box'
                        }}
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    style={{
                      background: '#a855f7',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '12px',
                      padding: '0.75rem 1.5rem',
                      fontSize: '0.9rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      transition: 'background 0.2s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = '#c084fc'}
                    onMouseLeave={(e) => e.currentTarget.style.background = '#a855f7'}
                  >
                    <Save size={16} />
                    Save Configurations
                  </button>
                </form>

                {/* 2. Questions CRUD Manager */}
                <div style={{
                  background: 'rgba(30, 41, 59, 0.15)',
                  border: '1px solid rgba(255, 255, 255, 0.04)',
                  borderRadius: '24px',
                  padding: '2rem',
                  boxSizing: 'border-box'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid rgba(255, 255, 255, 0.05)', paddingBottom: '1rem' }}>
                    <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700 }}>
                      Manage Quiz Questions
                    </h3>
                    <button
                      onClick={handleOpenAddQuestion}
                      style={{
                        background: 'rgba(168, 85, 247, 0.15)',
                        border: '1px solid rgba(168, 85, 247, 0.3)',
                        borderRadius: '10px',
                        color: '#c084fc',
                        padding: '0.5rem 1rem',
                        fontWeight: 600,
                        fontSize: '0.85rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.4rem',
                        transition: 'all 0.2s'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(168, 85, 247, 0.25)'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(168, 85, 247, 0.15)'}
                    >
                      <Plus size={16} />
                      Add Question
                    </button>
                  </div>

                  {questions.length === 0 ? (
                    <p style={{ color: '#64748b', textAlign: 'center', padding: '2rem' }}>No custom questions found. Run database seed to retrieve standard questions.</p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      {questions.map((q, idx) => (
                        <div key={q._id} style={{
                          background: 'rgba(15, 23, 42, 0.3)',
                          border: '1px solid rgba(255, 255, 255, 0.05)',
                          borderRadius: '16px',
                          padding: '1.25rem',
                          position: 'relative'
                        }}>
                          {/* Actions */}
                          <div style={{ position: 'absolute', top: '1.25rem', right: '1.25rem', display: 'flex', gap: '0.5rem' }}>
                            <button 
                              onClick={() => handleOpenEditQuestion(q)}
                              style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', transition: 'color 0.2s' }}
                              onMouseEnter={(e) => e.currentTarget.style.color = '#c084fc'}
                              onMouseLeave={(e) => e.currentTarget.style.color = '#94a3b8'}
                            >
                              <Edit2 size={16} />
                            </button>
                            <button 
                              onClick={() => handleDeleteQuestion(q._id)}
                              style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', transition: 'color 0.2s' }}
                              onMouseEnter={(e) => e.currentTarget.style.color = '#f87171'}
                              onMouseLeave={(e) => e.currentTarget.style.color = '#94a3b8'}
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>

                          <h4 style={{ margin: '0 0 0.75rem 0', paddingRight: '3rem', fontSize: '1rem', color: '#f8fafc', fontWeight: 700 }}>
                            {idx + 1}. {q.question}
                          </h4>

                          <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                            gap: '0.5rem',
                            fontSize: '0.85rem',
                            color: '#94a3b8'
                          }}>
                            {q.options.map((opt) => (
                              <div key={opt.key} style={{
                                padding: '0.5rem 0.75rem',
                                background: opt.key === q.answer ? 'rgba(16, 185, 129, 0.08)' : 'rgba(255, 255, 255, 0.02)',
                                border: opt.key === q.answer ? '1px solid rgba(16, 185, 129, 0.2)' : '1px solid rgba(255, 255, 255, 0.03)',
                                borderRadius: '8px',
                                color: opt.key === q.answer ? '#10b981' : '#94a3b8',
                                fontWeight: opt.key === q.answer ? 700 : 400
                              }}>
                                <strong>{opt.key}:</strong> {opt.text}
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Dynamic Question Editor Modal */}
      {isEditing && editingQuestion && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: 'rgba(15, 23, 42, 0.8)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000,
          padding: '1rem',
          boxSizing: 'border-box'
        }}>
          <form onSubmit={handleSaveQuestionSubmit} style={{
            background: '#0d1322',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '24px',
            width: '100%',
            maxWidth: '600px',
            padding: '2rem',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.4)',
            boxSizing: 'border-box',
            maxHeight: '90vh',
            overflowY: 'auto'
          }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700 }}>
                {editingQuestion._id ? 'Edit Quiz Question' : 'Add New Question'}
              </h3>
              <button 
                type="button"
                onClick={() => { setIsEditing(false); setEditingQuestion(null); }}
                style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', outline: 'none' }}
              >
                <X size={24} />
              </button>
            </div>

            {/* Question Text */}
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', color: '#94a3b8', marginBottom: '0.5rem', fontWeight: 600 }}>
                Question (Malayalam)
              </label>
              <textarea 
                required
                rows="3"
                value={editingQuestion.question}
                onChange={(e) => setEditingQuestion({ ...editingQuestion, question: e.target.value })}
                style={{
                  width: '100%',
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '10px',
                  color: '#ffffff',
                  padding: '0.75rem',
                  outline: 'none',
                  boxSizing: 'border-box',
                  fontFamily: 'inherit'
                }}
              />
            </div>

            {/* Options */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1rem' }}>
              {editingQuestion.options.map((opt, idx) => (
                <div key={opt.key}>
                  <label style={{ display: 'block', fontSize: '0.85rem', color: '#94a3b8', marginBottom: '0.25rem', fontWeight: 600 }}>
                    Option {opt.key}
                  </label>
                  <input 
                    type="text"
                    required
                    value={opt.text}
                    onChange={(e) => {
                      const updatedOptions = [...editingQuestion.options];
                      updatedOptions[idx].text = e.target.value;
                      setEditingQuestion({ ...editingQuestion, options: updatedOptions });
                    }}
                    style={{
                      width: '100%',
                      background: 'rgba(255,255,255,0.02)',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      borderRadius: '10px',
                      color: '#ffffff',
                      padding: '0.75rem',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
              ))}
            </div>

            {/* Answer select */}
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', color: '#94a3b8', marginBottom: '0.5rem', fontWeight: 600 }}>
                Correct Answer Option
              </label>
              <select 
                value={editingQuestion.answer}
                onChange={(e) => setEditingQuestion({ ...editingQuestion, answer: e.target.value })}
                style={{
                  width: '100%',
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '10px',
                  color: '#ffffff',
                  padding: '0.75rem',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              >
                <option value="A">Option A</option>
                <option value="B">Option B</option>
                <option value="C">Option C</option>
                <option value="D">Option D</option>
              </select>
            </div>

            {/* Buttons */}
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
              <button 
                type="button" 
                onClick={() => { setIsEditing(false); setEditingQuestion(null); }}
                style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  color: '#ffffff',
                  padding: '0.6rem 1.2rem',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: '0.9rem'
                }}
              >
                Cancel
              </button>
              <button 
                type="submit" 
                style={{
                  background: '#a855f7',
                  border: 'none',
                  color: '#ffffff',
                  padding: '0.6rem 1.2rem',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: '0.9rem'
                }}
              >
                Save Question
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

export default SuperAdminDashboard;
