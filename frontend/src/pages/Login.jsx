import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from '../contexts/AuthContext';
import './Login.css';

const Login = () => {
  const { handleLogin, isAuthenticated, loading } = useAuth();
  const [animationLoaded, setAnimationLoaded] = useState(false);

  // Add animation effect on component mount
  useEffect(() => {
    setTimeout(() => {
      setAnimationLoaded(true);
    }, 100);
  }, []);

  // Redirect if already authenticated
  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '100vh' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/" />;
  }

  return (
    <div className="login-page d-flex align-items-center justify-content-center">
      <div className={`container ${animationLoaded ? 'fade-in' : ''}`}>
        <div className="row justify-content-center align-items-center">
          {/* Left Column - App Info */}
          <div className="col-lg-5 d-none d-lg-block">
            <div className="text-center text-lg-start mb-5 mb-lg-0 pe-lg-4">
              <div className="app-logo mb-4 d-inline-block">
                <svg xmlns="http://www.w3.org/2000/svg" width="72" height="72" fill="currentColor" className="bi bi-cash-coin text-primary" viewBox="0 0 16 16">
                  <path fillRule="evenodd" d="M11 15a4 4 0 1 0 0-8 4 4 0 0 0 0 8zm5-4a5 5 0 1 1-10 0 5 5 0 0 1 10 0z"/>
                  <path d="M9.438 11.944c.047.596.518 1.06 1.363 1.116v.44h.375v-.443c.875-.061 1.386-.529 1.386-1.207 0-.618-.39-.936-1.09-1.1l-.296-.07v-1.2c.376.043.614.248.671.532h.658c-.047-.575-.54-1.024-1.329-1.073V8.5h-.375v.45c-.747.073-1.255.522-1.255 1.158 0 .562.378.92 1.007 1.066l.248.061v1.272c-.384-.058-.639-.27-.696-.563h-.668zm1.36-1.354c-.369-.085-.569-.26-.569-.522 0-.294.216-.514.572-.578v1.1h-.003zm.432.746c.449.104.655.272.655.569 0 .339-.257.571-.709.614v-1.195l.054.012z"/>
                  <path d="M1 0a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h4.083c.058-.344.145-.678.258-1H3a2 2 0 0 0-2-2V3a2 2 0 0 0 2-2h10a2 2 0 0 0 2 2v3.528c.38.34.717.728 1 1.154V1a1 1 0 0 0-1-1H1z"/>
                  <path d="M9.998 5.083 10 5a2 2 0 1 0-3.132 1.65 5.982 5.982 0 0 1 3.13-1.567z"/>
                </svg>
              </div>
              <h1 className="display-4 fw-bold mb-3 text-primary">Bill Splitter</h1>
              <p className="lead mb-4">The easiest way to split expenses with friends and family</p>
              
              <div className="features mb-5">
                <div className="feature d-flex align-items-center mb-3">
                  <div className="feature-icon me-3 bg-primary bg-opacity-10 rounded-circle p-2">
                    <i className="bi bi-people-fill text-primary fs-4"></i>
                  </div>
                  <div className="feature-text">
                    <h5 className="mb-0">Create Groups</h5>
                    <p className="text-muted mb-0">Organize expenses by trips, events or household</p>
                  </div>
                </div>
                
                <div className="feature d-flex align-items-center mb-3">
                  <div className="feature-icon me-3 bg-success bg-opacity-10 rounded-circle p-2">
                    <i className="bi bi-receipt text-success fs-4"></i>
                  </div>
                  <div className="feature-text">
                    <h5 className="mb-0">Track Expenses</h5>
                    <p className="text-muted mb-0">Record expenses and split them easily</p>
                  </div>
                </div>
                
                <div className="feature d-flex align-items-center">
                  <div className="feature-icon me-3 bg-info bg-opacity-10 rounded-circle p-2">
                    <i className="bi bi-cash-stack text-info fs-4"></i>
                  </div>
                  <div className="feature-text">
                    <h5 className="mb-0">Settle Debts</h5>
                    <p className="text-muted mb-0">See who owes what and settle up easily</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Right Column - Login Form */}
          <div className="col-lg-5 col-md-7">
            <div className="card border-0 shadow-lg rounded-4">
              <div className="card-body p-5">
                <div className="d-block d-lg-none text-center mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" fill="currentColor" className="bi bi-cash-coin text-primary" viewBox="0 0 16 16">
                    <path fillRule="evenodd" d="M11 15a4 4 0 1 0 0-8 4 4 0 0 0 0 8zm5-4a5 5 0 1 1-10 0 5 5 0 0 1 10 0z"/>
                    <path d="M9.438 11.944c.047.596.518 1.06 1.363 1.116v.44h.375v-.443c.875-.061 1.386-.529 1.386-1.207 0-.618-.39-.936-1.09-1.1l-.296-.07v-1.2c.376.043.614.248.671.532h.658c-.047-.575-.54-1.024-1.329-1.073V8.5h-.375v.45c-.747.073-1.255.522-1.255 1.158 0 .562.378.92 1.007 1.066l.248.061v1.272c-.384-.058-.639-.27-.696-.563h-.668zm1.36-1.354c-.369-.085-.569-.26-.569-.522 0-.294.216-.514.572-.578v1.1h-.003zm.432.746c.449.104.655.272.655.569 0 .339-.257.571-.709.614v-1.195l.054.012z"/>
                    <path d="M1 0a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h4.083c.058-.344.145-.678.258-1H3a2 2 0 0 0-2-2V3a2 2 0 0 0 2-2h10a2 2 0 0 0 2 2v3.528c.38.34.717.728 1 1.154V1a1 1 0 0 0-1-1H1z"/>
                    <path d="M9.998 5.083 10 5a2 2 0 1 0-3.132 1.65 5.982 5.982 0 0 1 3.13-1.567z"/>
                  </svg>
                  <h2 className="fw-bold mt-2">Bill Splitter</h2>
                </div>
                
                <h3 className="card-title text-center fw-bold mb-4">Welcome Back!</h3>
                
                <div className="welcome-message mb-4 text-center">
                  <p className="text-muted">Sign in with your Google account to start managing your expenses</p>
                </div>
                
                <div className="login-btn-container d-flex justify-content-center mb-4">
                  <GoogleLogin
                    onSuccess={handleLogin}
                    onError={() => {}}
                    useOneTap
                    auto_select
                  />
                </div>
                
                <div className="privacy-notice text-center">
                  <small className="text-muted">
                    By signing in, you agree to our <a href="#">Terms of Service</a> and <a href="#">Privacy Policy</a>
                  </small>
                </div>
              </div>
            </div>
            
            <div className="d-block d-lg-none text-center mt-4">
              <div className="d-flex justify-content-center flex-wrap">
                <span className="badge bg-primary m-1 py-2 px-3">Create Groups</span>
                <span className="badge bg-success m-1 py-2 px-3">Track Expenses</span>
                <span className="badge bg-info m-1 py-2 px-3">Settle Debts</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login; 