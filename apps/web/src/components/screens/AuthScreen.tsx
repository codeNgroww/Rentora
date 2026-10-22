'use client';

import React, { useState } from 'react';
import {
  Lock,
  Mail,
  Eye,
  EyeOff,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Shield,
} from 'lucide-react';
import { RentoraLogo } from '../RentoraLogo';
import { useAuth } from '../../lib/AuthContext';

export function AuthScreen() {
  const { signIn, isLoading } = useAuth();

  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [rememberMe, setRememberMe] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [showForgotModal, setShowForgotModal] = useState<boolean>(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!email.trim()) {
      setErrorMsg('Please enter your corporate email address');
      return;
    }

    if (!password) {
      setErrorMsg('Please enter your password');
      return;
    }

    setIsSubmitting(true);
    try {
      await signIn({
        email: email.trim(),
        password,
      });
    } catch (err: any) {
      setErrorMsg(err.message || 'Authentication failed. Please verify your credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="havenix-auth-page">
      <div className="havenix-auth-shell">
        {/* Left Column: Form & Brand */}
        <div className="havenix-form-col">
          {/* Logo Header */}
          <div className="havenix-brand-row">
            <RentoraLogo size={36} showText={true} textSize={22} variant="dark" />
          </div>

          {/* Heading */}
          <div className="havenix-heading-block">
            <h1 className="havenix-title">Welcome Back</h1>
            <p className="havenix-subtitle">Let's login to manage your UAE property portfolio</p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="havenix-login-form">
            {errorMsg && (
              <div className="havenix-error-alert">
                <AlertCircle size={16} />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Email Box */}
            <div className="havenix-input-box">
              <label htmlFor="havenix-email" className="havenix-box-label">
                Email
              </label>
              <input
                id="havenix-email"
                type="email"
                className="havenix-box-input"
                placeholder="name@company.ae"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
              />
            </div>

            {/* Password Box */}
            <div className="havenix-input-box">
              <label htmlFor="havenix-password" className="havenix-box-label">
                Password
              </label>
              <div className="havenix-pwd-input-wrap">
                <input
                  id="havenix-password"
                  type={showPassword ? 'text' : 'password'}
                  className="havenix-box-input"
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  className="havenix-pwd-toggle-btn"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Utilities Row: Remember me & Forgot Password */}
            <div className="havenix-options-row">
              <label className="havenix-remember-label">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
                <span>Remember me</span>
              </label>
              <button
                type="button"
                className="havenix-forgot-btn"
                onClick={() => setShowForgotModal(true)}
              >
                Forgot Password?
              </button>
            </div>

            {/* Primary Submit Button */}
            <button
              id="havenix-submit-btn"
              type="submit"
              className="havenix-submit-btn"
              disabled={isSubmitting || isLoading}
            >
              {isSubmitting || isLoading ? 'Authenticating...' : 'Login'}
            </button>

            {/* Sign Up / Registration Notice */}
            <div className="havenix-footer-signup">
              <span>Don't have an account? </span>
              <button
                type="button"
                className="havenix-signup-link"
                onClick={() => setShowForgotModal(true)}
              >
                Sign Up
              </button>
            </div>
          </form>
        </div>

        {/* Right Column: Architectural Organic Showcase Card */}
        <div className="havenix-showcase-col">
          <div className="havenix-showcase-card">
            {/* Scrim overlay for text readability */}
            <div className="havenix-showcase-scrim" />

            {/* Floating headline on image top right */}
            <div className="havenix-showcase-headline-wrap">
              <h2 className="havenix-showcase-headline">
                Browse thousands of properties to buy, sell, or rent with trusted agents.
              </h2>
            </div>

            {/* Floating UAE compliance pill badge at bottom */}
            <div className="havenix-showcase-bottom-badge">
              <span className="havenix-flag">🇦🇪</span>
              <span>UAE Smart Property & Expense Cloud • RERA & FTA Certified</span>
            </div>
          </div>
        </div>
      </div>

      {/* Forgot Password / Account Notice Modal */}
      {showForgotModal && (
        <div className="modal-overlay" onClick={() => setShowForgotModal(false)}>
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '420px', borderRadius: '16px' }}
          >
            <div className="modal-header">
              <h3 className="modal-title">Account Access & Support</h3>
              <button className="modal-close" onClick={() => setShowForgotModal(false)}>
                &times;
              </button>
            </div>
            <div className="modal-body" style={{ padding: '20px 24px' }}>
              <p style={{ fontSize: '14px', color: '#334155', lineHeight: 1.6 }}>
                Under UAE multi-tenant platform security policy:
              </p>
              <ul
                style={{
                  fontSize: '13px',
                  color: '#64748b',
                  marginTop: '10px',
                  paddingLeft: '18px',
                  lineHeight: 1.7,
                }}
              >
                <li>
                  <strong>Company Accounts:</strong> Client companies are onboarded directly by the Platform Super Admin.
                </li>
                <li>
                  <strong>Password Reset:</strong> Contact your company POC administrator or the Super Admin console to trigger a secure credential reset.
                </li>
              </ul>
            </div>
            <div className="modal-footer">
              <button className="btn btn-primary" onClick={() => setShowForgotModal(false)}>
                Understood
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
