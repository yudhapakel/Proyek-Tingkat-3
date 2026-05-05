import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Eye, EyeOff } from 'lucide-react'
import fishEyeLogo from '../assets/fish-eye-logo.png'
import AuthBackground from '../components/AuthBackground'
import './AuthPages.css'

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [remember, setRemember] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // TODO: integrate with auth service
    console.log('Login:', { username, password, remember })
  }

  return (
    <div className="auth-page">
      <AuthBackground />

      {/* Auth Card */}
      <div className="auth-card">
        {/* Fish Eye Logo */}
        <div className="auth-card__logo">
          <div className="auth-card__logo-circle">
            <img src={fishEyeLogo} alt="AIFish Logo" className="auth-card__logo-img" />
          </div>
        </div>

        <h1 className="auth-card__title">Sign In</h1>

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="auth-form__group">
            <label className="auth-form__label" htmlFor="login-username">Username</label>
            <input
              id="login-username"
              type="text"
              className="auth-form__input"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
            />
          </div>

          <div className="auth-form__group">
            <div className="auth-form__label-row">
              <label className="auth-form__label" htmlFor="login-password">Password</label>
              <Link to="/forgot-password" className="auth-form__forgot">Forgot password?</Link>
            </div>
            <div className="auth-form__input-wrapper">
              <input
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                className="auth-form__input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
              />
              <button
                type="button"
                className="auth-form__toggle-pw"
                onClick={() => setShowPassword(!showPassword)}
                aria-label="Toggle password visibility"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <label className="auth-form__remember">
            <input
              type="checkbox"
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
            />
            <span>Remember me</span>
          </label>

          <button type="submit" className="auth-form__submit" id="login-submit">
            Sign In
          </button>
        </form>

        <div className="auth-card__divider">
          <span>or sign up with</span>
        </div>

        <div className="auth-card__social">
          <button className="auth-social-btn" id="login-google">
            <svg width="18" height="18" viewBox="0 0 18 18"><path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615Z" fill="#4285F4"/><path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z" fill="#34A853"/><path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.997 8.997 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332Z" fill="#FBBC05"/><path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58Z" fill="#EA4335"/></svg>
            <span>Google</span>
          </button>
          <button className="auth-social-btn" id="login-apple">
            <svg width="18" height="18" viewBox="0 0 18 18"><path d="M14.94 15.29c-.68.99-1.42 1.97-2.53 1.99-1.1.02-1.46-.65-2.72-.65-1.27 0-1.66.63-2.7.67-1.09.04-1.92-1.07-2.6-2.06C3.01 13.24 1.98 9.89 3.4 7.6c.7-1.14 1.95-1.86 3.31-1.88 1.06-.02 2.07.72 2.72.72.65 0 1.87-.89 3.15-.76.54.02 2.04.22 3 1.64-.08.05-1.79 1.04-1.77 3.12.02 2.48 2.18 3.31 2.2 3.32-.02.06-.34 1.18-1.13 2.33h.06ZM11.35 3.71c.58-.7.97-1.68.86-2.65-.83.03-1.84.55-2.44 1.25-.53.62-1 1.62-.87 2.57.93.07 1.87-.47 2.45-1.17Z" fill="currentColor"/></svg>
            <span>Apple</span>
          </button>
        </div>

        <p className="auth-card__switch">
          Don't have an Account? <Link to="/register" className="auth-card__switch-link">Sign Up</Link>
        </p>
      </div>
    </div>
  )
}
