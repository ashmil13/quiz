import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, LogIn, BookOpen } from 'lucide-react';
import UserService from '../../services/user-services/User-Service';
import useAuth from '../../hooks/useAuth';
import '../../css/userstyle/login.css';

function Login() {
  const { postLogin } = UserService();
  const { setAuth } = useAuth();
  const navigate = useNavigate();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

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
        
        if (data.role === "SuperAdmin" && data.email === "sumi@gmail.com") {
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
  };

  return (
    <div className="login-page-wrapper">
      <div className="login-container">
        <div className="login-header-logo">
          <div className="login-logo-icon">
            <BookOpen size={28} />
          </div>
          <h1 className="login-brand-name">Yaseen Quiz</h1>
          <p className="login-subtitle">Sign in to test your knowledge</p>
        </div>

        {error && <p className="login-error">{error}</p>}
        
        <form onSubmit={handleSubmit}>
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
          
          <div className="login-form-group">
            <label className="login-label">Password</label>
            <div className="login-input-wrapper">
              <Lock className="login-input-icon" size={18} />
              <input 
                type="password" 
                required 
                value={password}
                onChange={(e) => setPassword(e.target.value)} 
                className="login-input"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="login-btn"
          >
            {loading ? 'Authenticating...' : (
              <>
                <LogIn size={18} />
                Sign In
              </>
            )}
          </button>
        </form>

        <p className="login-redirect-text">
          Don't have an account?{' '}
          <Link to="/signup" className="login-link">
            Sign Up
          </Link>
        </p>
      </div>
    </div>
  );
}

export default Login;
