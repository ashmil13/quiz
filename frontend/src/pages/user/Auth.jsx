import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Mail, Lock, User, UserPlus, LogIn, BookOpen, Eye, EyeOff, CheckCircle2 } from 'lucide-react';
import UserService from '../../services/user-services/User-Service';
import useAuth from '../../hooks/useAuth';
import '../../css/userstyle/login.css';

function Auth({ initialMode }) {
  const { postLogin, postRegister } = UserService();
  const { setAuth } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Mode: 'login' | 'signup'
  const [mode, setMode] = useState(initialMode || (location.pathname === '/signup' ? 'signup' : 'login'));

  // Form Fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // Password Visibility
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Statuses
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Switch mode handler
  const handleSwitchMode = (targetMode) => {
    setMode(targetMode);
    setError('');
    setSuccess('');
  };

  // Submit Handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (mode === 'signup') {
      if (password !== confirmPassword) {
        setError("Passwords do not match");
        return;
      }

      setLoading(true);
      try {
        const response = await postRegister({ name, email, password, role: 'User' });
        const data = response.data;
        if (data && data.success) {
          setSuccess("Registration successful! Please sign in with your credentials.");
          setName('');
          setPassword('');
          setConfirmPassword('');
          setMode('login'); // Automatically switch to Sign In mode
        } else {
          throw new Error(data.error || "Registration failed.");
        }
      } catch (err) {
        setError(err.response?.data?.error || err.message || 'Registration failed');
      } finally {
        setLoading(false);
      }
    } else {
      // Sign In Mode
      setLoading(true);
      try {
        const response = await postLogin({ email, password });
        const data = response.data;

        if (data && data.success) {
          localStorage.setItem("accessToken", data.accessToken);
          localStorage.setItem("role", data.role || "User");
          localStorage.setItem("email", data.email || "");
          localStorage.setItem("userId", data.userId || "");
          localStorage.setItem("name", data.name || "");
          localStorage.setItem("profileImage", data.profileImage || "");
          
          setAuth({
            accessToken: data.accessToken,
            role: data.role || "User",
            email: data.email || "",
            id: data.userId,
            name: data.name,
            image: data.profileImage
          });
          
          if (data.role === "SuperAdmin") {
            navigate('/admin/dashboard');
          } else {
            navigate('/user/quiz');
          }
        } else {
          throw new Error(data.error || "Invalid credentials.");
        }
      } catch (err) {
        setError(err.response?.data?.error || err.message || 'Login failed');
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="login-page-wrapper">
      <div className="login-container">
        {/* Brand Header */}
        <div className="login-header-logo">
          <div className="login-logo-icon">
            <BookOpen size={28} />
          </div>
          <h1 className="login-brand-name">Yaseen Quiz</h1>
          <p className="login-subtitle">
            {mode === 'login' ? 'Sign in to test your knowledge' : 'Register to start playing'}
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="auth-tab-wrapper" style={{
          display: 'flex',
          background: 'rgba(15, 23, 42, 0.6)',
          borderRadius: '12px',
          padding: '4px',
          marginBottom: '1.75rem',
          border: '1px solid rgba(255, 255, 255, 0.08)'
        }}>
          <button
            type="button"
            onClick={() => handleSwitchMode('login')}
            style={{
              flex: 1,
              padding: '0.65rem 0',
              borderRadius: '9px',
              border: 'none',
              fontWeight: 700,
              fontSize: '0.875rem',
              cursor: 'pointer',
              background: mode === 'login' ? 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)' : 'transparent',
              color: mode === 'login' ? '#ffffff' : '#94a3b8',
              boxShadow: mode === 'login' ? '0 4px 12px rgba(99, 102, 241, 0.3)' : 'none',
              transition: 'all 0.25s ease'
            }}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => handleSwitchMode('signup')}
            style={{
              flex: 1,
              padding: '0.65rem 0',
              borderRadius: '9px',
              border: 'none',
              fontWeight: 700,
              fontSize: '0.875rem',
              cursor: 'pointer',
              background: mode === 'signup' ? 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)' : 'transparent',
              color: mode === 'signup' ? '#ffffff' : '#94a3b8',
              boxShadow: mode === 'signup' ? '0 4px 12px rgba(99, 102, 241, 0.3)' : 'none',
              transition: 'all 0.25s ease'
            }}
          >
            Register
          </button>
        </div>

        {/* Feedback Messages */}
        {error && <p className="login-error">{error}</p>}
        {success && (
          <div style={{
            color: '#34d399',
            backgroundColor: 'rgba(16, 185, 129, 0.1)',
            padding: '0.75rem 1rem',
            borderRadius: '12px',
            border: '1px solid rgba(16, 185, 129, 0.25)',
            fontSize: '0.875rem',
            marginBottom: '1.5rem',
            textAlign: 'left',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <CheckCircle2 size={18} color="#34d399" />
            <span>{success}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Sign Up: Full Name */}
          {mode === 'signup' && (
            <div className="login-form-group">
              <label className="login-label">Full Name</label>
              <div className="login-input-wrapper">
                <User className="login-input-icon" size={18} />
                <input 
                  type="text" 
                  required 
                  value={name}
                  onChange={(e) => setName(e.target.value)} 
                  className="login-input"
                  placeholder="John Doe"
                />
              </div>
            </div>
          )}

          {/* Email Address */}
          <div className="login-form-group">
            <label className="login-label">Email Address</label>
            <div className="login-input-wrapper">
              <Mail className="login-input-icon" size={18} />
              <input 
                type="email" 
                required 
                value={email}
                onChange={(e) => setEmail(e.target.value)} 
                className="login-input"
                placeholder="name@example.com"
              />
            </div>
          </div>
          
          {/* Password */}
          <div className="login-form-group">
            <label className="login-label">Password</label>
            <div className="login-input-wrapper">
              <Lock className="login-input-icon" size={18} />
              <input 
                type={showPassword ? 'text' : 'password'} 
                required 
                value={password}
                onChange={(e) => setPassword(e.target.value)} 
                className="login-input"
                style={{ paddingRight: '2.75rem' }}
                placeholder="••••••••"
              />
              <button
                type="button"
                className="signup-password-toggle"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                style={{
                  position: 'absolute',
                  right: '14px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'transparent',
                  border: 'none',
                  color: '#64748b',
                  cursor: 'pointer',
                  padding: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  zIndex: 5
                }}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Sign Up: Confirm Password */}
          {mode === 'signup' && (
            <div className="login-form-group">
              <label className="login-label">Confirm Password</label>
              <div className="login-input-wrapper">
                <Lock className="login-input-icon" size={18} />
                <input 
                  type={showConfirmPassword ? 'text' : 'password'} 
                  required 
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)} 
                  className="login-input"
                  style={{ paddingRight: '2.75rem' }}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  className="signup-password-toggle"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
                  style={{
                    position: 'absolute',
                    right: '14px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'transparent',
                    border: 'none',
                    color: '#64748b',
                    cursor: 'pointer',
                    padding: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 5
                  }}
                >
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <button 
            type="submit" 
            disabled={loading}
            className="login-btn"
          >
            {loading ? (mode === 'login' ? 'Authenticating...' : 'Registering...') : (
              <>
                {mode === 'login' ? <LogIn size={18} /> : <UserPlus size={18} />}
                {mode === 'login' ? 'Sign In' : 'Register'}
              </>
            )}
          </button>
        </form>

        {/* Footer Redirect Toggle */}
        <p className="login-redirect-text">
          {mode === 'login' ? (
            <>
              Don't have an account?{' '}
              <button 
                type="button" 
                onClick={() => handleSwitchMode('signup')}
                className="login-link"
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
              >
                Register
              </button>
            </>
          ) : (
            <>
              Already have an account?{' '}
              <button 
                type="button" 
                onClick={() => handleSwitchMode('login')}
                className="login-link"
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
              >
                Sign In
              </button>
            </>
          )}
        </p>
      </div>
    </div>
  );
}

export default Auth;
