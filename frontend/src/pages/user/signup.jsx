import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, Lock, User, UserPlus, BookOpen } from 'lucide-react';
import UserService from '../../services/user-services/User-Service';
import '../../css/userstyle/sighup.css';

function Signup() {
  const { postRegister } = UserService();
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);

    try {
      const response = await postRegister({ name, email, password, role: 'User' });
      const data = response.data;
      
      if (data && data.success) {
        setSuccess("Registration successful! You can now log in.");
        setName('');
        setEmail('');
        setPassword('');
        setConfirmPassword('');
      } else {
        throw new Error(data.error || "Registration failed.");
      }
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="signup-page-wrapper">
      <div className="signup-container">
        <div className="signup-header-logo">
          <div className="signup-logo-icon">
            <BookOpen size={28} />
          </div>
          <h1 className="signup-brand-name">Yaseen Quiz</h1>
          <p className="signup-subtitle">Create your account to start playing</p>
        </div>

        {error && <p className="signup-error">{error}</p>}
        {success && <p className="signup-success">{success}</p>}
        
        <form onSubmit={handleSubmit}>
          <div className="signup-form-group">
            <label className="signup-label">Full Name</label>
            <div className="signup-input-wrapper">
              <User className="signup-input-icon" size={18} />
              <input 
                type="text" 
                required 
                value={name}
                onChange={(e) => setName(e.target.value)} 
                className="signup-input"
                placeholder="John Doe"
              />
            </div>
          </div>

          <div className="signup-form-group">
            <label className="signup-label">Email Address</label>
            <div className="signup-input-wrapper">
              <Mail className="signup-input-icon" size={18} />
              <input 
                type="email" 
                required 
                value={email}
                onChange={(e) => setEmail(e.target.value)} 
                className="signup-input"
                placeholder="name@example.com"
              />
            </div>
          </div>


          
          <div className="signup-form-group">
            <label className="signup-label">Password</label>
            <div className="signup-input-wrapper">
              <Lock className="signup-input-icon" size={18} />
              <input 
                type="password" 
                required 
                value={password}
                onChange={(e) => setPassword(e.target.value)} 
                className="signup-input"
                placeholder="••••••••"
              />
            </div>
          </div>

          <div className="signup-form-group">
            <label className="signup-label">Confirm Password</label>
            <div className="signup-input-wrapper">
              <Lock className="signup-input-icon" size={18} />
              <input 
                type="password" 
                required 
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)} 
                className="signup-input"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="signup-btn"
          >
            {loading ? 'Registering...' : (
              <>
                <UserPlus size={18} />
                Register
              </>
            )}
          </button>
        </form>

        <p className="signup-redirect-text">
          Already have an account?{' '}
          <Link to="/login" className="signup-link">
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}

export default Signup;
