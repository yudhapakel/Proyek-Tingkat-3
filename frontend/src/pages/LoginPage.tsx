import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff } from 'lucide-react'
import fishEyeLogo from '../assets/fish-eye-logo.png'
import AuthBackground from '../components/AuthBackground'
import { getErrorMessage, login } from '../lib/api'
import { saveAuth } from '../lib/auth'
import './AuthPages.css'

export default function LoginPage() {
  const navigate = useNavigate()
  const [showPassword, setShowPassword] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [remember, setRemember] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      const auth = await login(email, password)
      if (remember) saveAuth(auth)
      navigate('/dashboard', { replace: true })
      window.dispatchEvent(new CustomEvent('fisight-authenticated', { detail: auth }))
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setIsLoading(false)
    }
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

        <h1 className="auth-card__title">Sign In</h1>

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="auth-form__group">
            <label className="auth-form__label" htmlFor="login-email">Email</label>
            <input
              id="login-email"
              type="email"
              className="auth-form__input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
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
                required
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

          {error && <p className="auth-form__error">{error}</p>}

          <button type="submit" className="auth-form__submit" id="login-submit" disabled={isLoading}>
            {isLoading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="auth-card__divider">
          <span>or sign up with</span>
        </div>

        <div className="auth-card__social">
          <button type="button" className="auth-social-btn" id="login-google" disabled>
            <span>Google</span>
          </button>
          <button type="button" className="auth-social-btn" id="login-apple" disabled>
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
