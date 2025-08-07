import React, { useState, useEffect } from 'react';
import { authService } from '../services/authService';
import './Auth.css';

function SignUp({ onSignUpSuccess }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [usernameAvailable, setUsernameAvailable] = useState(null);

  // Check username availability as user types
  useEffect(() => {
    if (username.length >= 3) {
      const timer = setTimeout(() => {
        const available = authService.isUsernameAvailable(username);
        setUsernameAvailable(available);
      }, 300); // Debounce
      return () => clearTimeout(timer);
    } else {
      setUsernameAvailable(null);
    }
  }, [username]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    // Validation
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    try {
      const response = await authService.signUp(username, password);
      setSuccess(response.message);
      // Clear form
      setUsername('');
      setPassword('');
      setConfirmPassword('');
      
      // Call success callback if provided
      if (onSignUpSuccess) {
        setTimeout(() => {
          onSignUpSuccess();
        }, 2000); // Give user time to see success message
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-form-container">
      <form className="auth-form" onSubmit={handleSubmit}>
        <h2>Sign Up</h2>
        
        <div className="form-group">
          <label>Username:</label>
          <input 
            type="text" 
            value={username} 
            onChange={(e) => setUsername(e.target.value)} 
            required 
            minLength={3}
            className={`form-input ${
              usernameAvailable === false ? 'error' : 
              usernameAvailable === true ? 'success' : ''
            }`}
          />
          {username.length >= 3 && (
            <div className={`validation-message ${
              usernameAvailable ? 'success' : 'error'
            }`}>
              {usernameAvailable ? '✓ Username is available' : '✗ Username already exists'}
            </div>
          )}
        </div>

        <div className="form-group">
          <label>Password:</label>
          <input 
            type="password" 
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
            required 
            minLength={6}
            className="form-input"
          />
          <div className="validation-message info">
            Password must be at least 6 characters long
          </div>
        </div>

        <div className="form-group">
          <label>Confirm Password:</label>
          <input 
            type="password" 
            value={confirmPassword} 
            onChange={(e) => setConfirmPassword(e.target.value)} 
            required 
            className={`form-input ${
              confirmPassword && password !== confirmPassword ? 'error' : ''
            }`}
          />
          {confirmPassword && password !== confirmPassword && (
            <div className="validation-message error">
              ✗ Passwords do not match
            </div>
          )}
        </div>

        {error && (
          <div className="alert error">
            {error}
          </div>
        )}

        {success && (
          <div className="alert success">
            {success}
          </div>
        )}

        <button 
          type="submit" 
          disabled={loading || !usernameAvailable || password !== confirmPassword}
          className="auth-button primary"
        >
          {loading ? 'Creating Account...' : 'Sign Up'}
        </button>
      </form>
    </div>
  );
}

export default SignUp;
