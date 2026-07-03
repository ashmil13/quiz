import React from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import { LogOut, BookOpen } from 'lucide-react';

function UserLayout() {
  const { auth, setAuth } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("role");
    localStorage.removeItem("userId");
    localStorage.removeItem("name");
    localStorage.removeItem("profileImage");
    setAuth({});
    navigate('/login');
  };

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      minHeight: '100vh', 
      width: '100%', 
      background: 'radial-gradient(circle at 10% 20%, rgba(99, 102, 241, 0.05) 0%, rgba(168, 85, 247, 0.05) 90.2%), #0b0f19',
      color: '#f8fafc',
      boxSizing: 'border-box'
    }}>
      {/* Glassmorphic Navbar */}
      <header style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '0.85rem 2rem',
        background: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
        position: 'sticky',
        top: 0,
        zIndex: 50,
        boxSizing: 'border-box'
      }}>
        {/* Logo Section */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{
            background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.2) 0%, rgba(168, 85, 247, 0.2) 100%)',
            border: '1px solid rgba(168, 85, 247, 0.25)',
            borderRadius: '10px',
            padding: '0.45rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#a855f7'
          }}>
            <BookOpen size={20} />
          </div>
          <span style={{
            fontSize: '1.2rem',
            fontWeight: 800,
            background: 'linear-gradient(to right, #ffffff, #a855f7)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            letterSpacing: '0.03em',
            fontFamily: "'Outfit', sans-serif"
          }}>
            Yaseen Quiz
          </span>
        </div>

        {/* User Card & Logout */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            {auth.image ? (
              <img 
                src={auth.image} 
                alt={auth.name || 'User'} 
                style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover', border: '2px solid rgba(168, 85, 247, 0.5)' }} 
              />
            ) : (
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #6366f1, #a855f7)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                fontSize: '0.85rem',
                color: '#ffffff',
                fontFamily: "'Outfit', sans-serif"
              }}>
                {auth.name ? auth.name.charAt(0).toUpperCase() : 'U'}
              </div>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', fontFamily: "'Outfit', sans-serif" }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#f8fafc' }}>
                {auth.name || 'Quiz Taker'}
              </span>
              <span style={{ fontSize: '0.7rem', color: '#94a3b8', textTransform: 'capitalize' }}>
                {auth.role || 'User'}
              </span>
            </div>
          </div>

          <button 
            onClick={handleLogout}
            style={{
              background: 'rgba(239, 68, 68, 0.08)',
              border: '1px solid rgba(239, 68, 68, 0.2)',
              borderRadius: '8px',
              color: '#f87171',
              padding: '0.4rem 0.85rem',
              fontSize: '0.8rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              transition: 'all 0.2s ease',
              outline: 'none',
              fontFamily: "'Outfit', sans-serif"
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(239, 68, 68, 0.15)';
              e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.35)';
              e.currentTarget.style.color = '#ef4444';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(239, 68, 68, 0.08)';
              e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.2)';
              e.currentTarget.style.color = '#f87171';
            }}
          >
            <LogOut size={13} />
            Logout
          </button>
        </div>
      </header>

      {/* Content Area */}
      <main style={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
        <Outlet />
      </main>
    </div>
  );
}

export default UserLayout;
