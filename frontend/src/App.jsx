import { useEffect, useMemo, useState } from 'react'
import './App.css'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000'

function getErrorMessage(error) {
  if (error instanceof Error) return error.message
  return 'Terjadi kesalahan. Coba lagi ya bro.'
}

async function apiRequest(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, options)
  if (response.status === 204) return null

  const contentType = response.headers.get('content-type') || ''
  const payload = contentType.includes('application/json') ? await response.json() : await response.text()

  if (!response.ok) {
    const detail = typeof payload === 'object' && payload !== null ? payload.detail : payload
    throw new Error(detail || `Request gagal (${response.status})`)
  }

  return payload
}

function AuthPanel({ onAuthenticated }) {
  const [mode, setMode] = useState('login')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const isRegister = mode === 'register'

  async function handleSubmit(event) {
    event.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      const payload = isRegister ? { name, email, password } : { email, password }
      const auth = await apiRequest(isRegister ? '/auth/register' : '/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      onAuthenticated(auth)
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <main className="auth-shell">
      <section className="hero-card">
        <p className="eyebrow">Fisight MVP</p>
        <h1>Identifikasi kualitas ikan dari satu foto.</h1>
        <p>
          Frontend ini sudah nyambung ke backend FastAPI: auth, upload scan, skor kualitas,
          dan riwayat analisis.
        </p>
      </section>

      <section className="panel auth-card">
        <div className="auth-tabs" aria-label="Pilih mode auth">
          <button className={!isRegister ? 'active' : ''} type="button" onClick={() => setMode('login')}>
            Login
          </button>
          <button className={isRegister ? 'active' : ''} type="button" onClick={() => setMode('register')}>
            Register
          </button>
        </div>

        <form onSubmit={handleSubmit} className="form-stack">
          {isRegister && (
            <label>
              Nama
              <input value={name} onChange={(event) => setName(event.target.value)} required placeholder="Nama lu" />
            </label>
          )}
          <label>
            Email
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              placeholder="email@contoh.com"
            />
          </label>
          <label>
            Password
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              minLength={6}
              placeholder="Minimal 6 karakter"
            />
          </label>

          {error && <p className="alert error">{error}</p>}
          <button className="primary" disabled={isLoading} type="submit">
            {isLoading ? 'Memproses...' : isRegister ? 'Buat akun' : 'Masuk'}
          </button>
        </form>
      </section>
    </main>
  )
}

function ScorePill({ label, value }) {
  return (
    <div className="score-pill">
      <span>{label}</span>
      <strong>{Number(value || 0).toFixed(1)}</strong>
    </div>
  )
}

function AnalysisResult({ analysis }) {
  if (!analysis) {
    return <p className="muted">Upload foto ikan dulu, nanti hasil skor kualitasnya muncul di sini.</p>
  }

  return (
    <article className="result-card">
      <div>
        <p className="eyebrow">Hasil analisis</p>
        <h2>{analysis.status}</h2>
        <p>{analysis.recommendation || 'Belum ada rekomendasi.'}</p>
      </div>
      <div className="big-score">
        <span>{Number(analysis.overall_score || 0).toFixed(1)}</span>
        <small>overall</small>
      </div>
      <div className="score-grid">
        <ScorePill label="Freshness" value={analysis.freshness_score} />
        <ScorePill label="Eye" value={analysis.eye_score} />
        <ScorePill label="Gill" value={analysis.gill_score} />
        <ScorePill label="Scale" value={analysis.scale_score} />
        <ScorePill label="Confidence" value={analysis.confidence_score} />
      </div>
    </article>
  )
}

function Dashboard({ auth, onLogout }) {
  const token = auth.access_token
  const [file, setFile] = useState(null)
  const [latestAnalysis, setLatestAnalysis] = useState(null)
  const [history, setHistory] = useState([])
  const [selectedAnalysis, setSelectedAnalysis] = useState(null)
  const [isScanning, setIsScanning] = useState(false)
  const [isHistoryLoading, setIsHistoryLoading] = useState(false)
  const [message, setMessage] = useState('')

  const authHeaders = useMemo(() => ({ Authorization: `Bearer ${token}` }), [token])

  async function loadHistory() {
    setIsHistoryLoading(true)
    try {
      const data = await apiRequest('/analysis/history', { headers: authHeaders })
      setHistory(data)
    } catch (err) {
      setMessage(getErrorMessage(err))
    } finally {
      setIsHistoryLoading(false)
    }
  }

  useEffect(() => {
    // Initial data fetch is intentionally triggered once when the dashboard opens.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadHistory()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function handleScan(event) {
    event.preventDefault()
    if (!file) {
      setMessage('Pilih gambar ikan dulu bro.')
      return
    }

    setIsScanning(true)
    setMessage('')
    try {
      const formData = new FormData()
      formData.append('file', file)
      const analysis = await apiRequest('/scan', {
        method: 'POST',
        headers: authHeaders,
        body: formData,
      })
      setLatestAnalysis(analysis)
      setFile(null)
      await loadHistory()
    } catch (err) {
      setMessage(getErrorMessage(err))
    } finally {
      setIsScanning(false)
    }
  }

  async function openDetail(id) {
    try {
      const detail = await apiRequest(`/analysis/${id}`, { headers: authHeaders })
      setSelectedAnalysis(detail)
    } catch (err) {
      setMessage(getErrorMessage(err))
    }
  }

  async function deleteAnalysis(id) {
    try {
      await apiRequest(`/analysis/${id}`, { method: 'DELETE', headers: authHeaders })
      if (latestAnalysis?.id === id) setLatestAnalysis(null)
      if (selectedAnalysis?.id === id) setSelectedAnalysis(null)
      await loadHistory()
    } catch (err) {
      setMessage(getErrorMessage(err))
    }
  }

  return (
    <main className="dashboard-shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">Dashboard Fisight</p>
          <h1>Halo, {auth.user.name}</h1>
        </div>
        <button className="ghost" type="button" onClick={onLogout}>Logout</button>
      </header>

      {message && <p className="alert">{message}</p>}

      <section className="dashboard-grid">
        <div className="panel upload-panel">
          <h2>Scan ikan</h2>
          <p className="muted">Upload JPG/PNG/WebP, backend bakal simpan hasilnya ke history user.</p>
          <form onSubmit={handleScan} className="form-stack">
            <label className="dropzone">
              <span>{file ? file.name : 'Klik buat pilih gambar ikan'}</span>
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={(event) => setFile(event.target.files?.[0] || null)}
              />
            </label>
            <button className="primary" disabled={isScanning} type="submit">
              {isScanning ? 'Scanning...' : 'Upload & scan'}
            </button>
          </form>
        </div>

        <div className="panel">
          <AnalysisResult analysis={latestAnalysis} />
        </div>
      </section>

      <section className="panel history-panel">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Riwayat</p>
            <h2>Analisis terakhir</h2>
          </div>
          <button className="ghost" type="button" onClick={loadHistory} disabled={isHistoryLoading}>
            {isHistoryLoading ? 'Loading...' : 'Refresh'}
          </button>
        </div>

        {history.length === 0 ? (
          <p className="muted">Belum ada history buat akun ini.</p>
        ) : (
          <div className="history-list">
            {history.map((item) => (
              <article key={item.id} className="history-item">
                <div>
                  <strong>{item.status}</strong>
                  <p>{item.filename || `Analisis #${item.id}`}</p>
                  <small>{new Date(item.created_at).toLocaleString('id-ID')}</small>
                </div>
                <span className="mini-score">{Number(item.overall_score || 0).toFixed(1)}</span>
                <div className="history-actions">
                  <button type="button" onClick={() => openDetail(item.id)}>Detail</button>
                  <button className="danger" type="button" onClick={() => deleteAnalysis(item.id)}>Delete</button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {selectedAnalysis && (
        <div className="modal-backdrop" role="presentation" onClick={() => setSelectedAnalysis(null)}>
          <section className="modal panel" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
            <button className="close" type="button" onClick={() => setSelectedAnalysis(null)}>×</button>
            <AnalysisResult analysis={selectedAnalysis} />
          </section>
        </div>
      )}
    </main>
  )
}

function App() {
  const [auth, setAuth] = useState(() => {
    const saved = localStorage.getItem('fisight-auth')
    return saved ? JSON.parse(saved) : null
  })

  function handleAuthenticated(nextAuth) {
    localStorage.setItem('fisight-auth', JSON.stringify(nextAuth))
    setAuth(nextAuth)
  }

  function handleLogout() {
    localStorage.removeItem('fisight-auth')
    setAuth(null)
  }

  return auth ? <Dashboard auth={auth} onLogout={handleLogout} /> : <AuthPanel onAuthenticated={handleAuthenticated} />
}

export default App
