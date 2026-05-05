import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Mail, CheckCircle } from 'lucide-react'
import fishEyeLogo from '../assets/fish-eye-logo.png'
import AuthBackground from '../components/AuthBackground'
import './AuthPages.css'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // TODO: integrate with auth service
    console.log('Reset password for:', email)
    setSubmitted(true)
  }

  return (
    <div className="auth-page">
      <AuthBackground />

      <div className="auth-card">
        <div className="auth-card__logo">
          <div className="auth-card__logo-circle">
            <img src={fishEyeLogo} alt="AIFish Logo" className="auth-card__logo-img" />
          </div>
        </div>

        {!submitted ? (
          <>
            <h1 className="auth-card__title">Forgot Password</h1>
            <p className="auth-card__desc">
              Enter your email address and we'll send you a link to reset your password.
            </p>

            <form className="auth-form" onSubmit={handleSubmit}>
              <div className="auth-form__group">
                <label className="auth-form__label" htmlFor="forgot-email">Email Address</label>
                <div className="auth-form__input-wrapper">
                  <input
                    id="forgot-email"
                    type="email"
                    className="auth-form__input auth-form__input--icon"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    autoComplete="email"
                    required
                  />
                  <Mail size={16} className="auth-form__input-icon" />
                </div>
              </div>

              <button type="submit" className="auth-form__submit" id="forgot-submit">
                Send Reset Link
              </button>
            </form>
          </>
        ) : (
          <div className="auth-card__success">
            <div className="auth-card__success-icon">
              <CheckCircle size={48} />
            </div>
            <h1 className="auth-card__title">Check Your Email</h1>
            <p className="auth-card__desc">
              We've sent a password reset link to <strong>{email}</strong>. Please check your inbox and follow the instructions.
            </p>
            <button
              className="auth-form__submit"
              onClick={() => setSubmitted(false)}
              style={{ marginTop: '0.5rem' }}
            >
              Resend Email
            </button>
          </div>
        )}

        <Link to="/login" className="auth-card__back" id="forgot-back">
          <ArrowLeft size={16} />
          <span>Back to Sign In</span>
        </Link>
      </div>
    </div>
  )
}
