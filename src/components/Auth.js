import React, { useState, useEffect } from 'react';
import SignIn from './SignIn';
import SignUp from './SignUp';
import { authService } from '../services/authService';
import './Auth.css';

function Auth({ onAuthSuccess }) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  // Check for existing user session on component mount
  useEffect(() => {
    const existingUser = authService.getCurrentUser();
    if (existingUser) {
      setCurrentUser(existingUser);
      if (onAuthSuccess) {
        onAuthSuccess(existingUser);
      }
    }
  }, [onAuthSuccess]);

  const handleSignInSuccess = (user) => {
    setCurrentUser(user);
    if (onAuthSuccess) {
      onAuthSuccess(user);
    }
  };

  const handleSignOut = () => {
    authService.signOut();
    setCurrentUser(null);
  };

  // If user is signed in, show welcome message
  if (currentUser) {
    return (
      <div className="auth-container">
        <div className="welcome-container">
          <h2>Welcome, {currentUser.username}!</h2>
          <p>You are successfully signed in.</p>
          <button 
            onClick={handleSignOut}
            className="auth-button danger"
          >
            Sign Out
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-container">
      {/* Toggle buttons */}
      <div className="auth-toggle-buttons">
        <button
          onClick={() => setIsSignUp(false)}
          className={`auth-toggle-button ${!isSignUp ? 'active' : 'inactive'}`}
        >
          Sign In
        </button>
        <button
          onClick={() => setIsSignUp(true)}
          className={`auth-toggle-button ${isSignUp ? 'active' : 'inactive'}`}
        >
          Sign Up
        </button>
      </div>

      {/* Render appropriate component */}
      {isSignUp ? (
        <SignUp onSignUpSuccess={() => setIsSignUp(false)} />
      ) : (
        <SignIn onSignInSuccess={handleSignInSuccess} />
      )}

      {/* Switch link */}
      <div className="auth-switch">
        <p>
          {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
          <button
            onClick={() => setIsSignUp(!isSignUp)}
            className="auth-switch-link"
          >
            {isSignUp ? 'Sign In' : 'Sign Up'}
          </button>
        </p>
      </div>
    </div>
  );
}

export default Auth;
