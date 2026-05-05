import { useEffect, useState } from 'react'
import { Navigate, Route, Routes, useNavigate } from 'react-router-dom'
import type { AuthResponse } from './lib/api'
import { clearAuth, getSavedAuth } from './lib/auth'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import ForgotPasswordPage from './pages/ForgotPasswordPage'
import DashboardPage from './pages/DashboardPage'

function App() {
  const navigate = useNavigate()
  const [auth, setAuth] = useState<AuthResponse | null>(() => getSavedAuth())

  useEffect(() => {
    function handleAuthenticated(event: Event) {
      const customEvent = event as CustomEvent<AuthResponse>
      setAuth(customEvent.detail)
    }

    window.addEventListener('fisight-authenticated', handleAuthenticated)
    return () => window.removeEventListener('fisight-authenticated', handleAuthenticated)
  }, [])

  function handleLogout() {
    clearAuth()
    setAuth(null)
    navigate('/login', { replace: true })
  }

  return (
    <Routes>
      <Route path="/login" element={auth ? <Navigate to="/dashboard" replace /> : <LoginPage />} />
      <Route path="/register" element={auth ? <Navigate to="/dashboard" replace /> : <RegisterPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route
        path="/dashboard"
        element={auth ? <DashboardPage auth={auth} onLogout={handleLogout} /> : <Navigate to="/login" replace />}
      />
      <Route path="*" element={<Navigate to={auth ? '/dashboard' : '/login'} replace />} />
    </Routes>
  )
}

export default App
