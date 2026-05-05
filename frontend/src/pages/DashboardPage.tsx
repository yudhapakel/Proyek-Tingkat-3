import { useEffect, useMemo, useState } from 'react'
import { Fish, History, LogOut, RefreshCw, Trash2, Upload } from 'lucide-react'
import type { Analysis, AuthResponse } from '../lib/api'
import { deleteAnalysis, getAnalysisDetail, getErrorMessage, getHistory, scanFish } from '../lib/api'
import './DashboardPage.css'

type DashboardPageProps = {
  auth: AuthResponse
  onLogout: () => void
}

function ScorePill({ label, value }: { label: string; value: number }) {
  return (
    <div className="score-pill">
      <span>{label}</span>
      <strong>{Number(value || 0).toFixed(1)}</strong>
    </div>
  )
}

function ResultCard({ analysis }: { analysis: Analysis | null }) {
  if (!analysis) {
    return (
      <div className="empty-result">
        <Fish size={44} />
        <h2>Belum ada hasil scan</h2>
        <p>Upload foto ikan dulu, nanti skor kualitasnya muncul di sini.</p>
      </div>
    )
  }

  return (
    <article className="result-card">
      <div className="result-card__header">
        <div>
          <span className="dashboard-eyebrow">Hasil analisis</span>
          <h2>{analysis.status}</h2>
          <p>{analysis.recommendation || 'Belum ada rekomendasi dari backend.'}</p>
        </div>
        <div className="overall-score">
          <strong>{Number(analysis.overall_score || 0).toFixed(1)}</strong>
          <span>overall</span>
        </div>
      </div>

      <div className="score-grid">
        <ScorePill label="Freshness" value={analysis.freshness_score} />
        <ScorePill label="Eye" value={analysis.eye_score} />
        <ScorePill label="Gill" value={analysis.gill_score} />
        <ScorePill label="Scale" value={analysis.scale_score} />
        <ScorePill label="Confidence" value={analysis.confidence_score * 100} />
      </div>

      <div className="model-badge">
        Model: <strong>{analysis.model_used || 'heuristic_fallback'}</strong>
      </div>
    </article>
  )
}

export default function DashboardPage({ auth, onLogout }: DashboardPageProps) {
  const token = auth.access_token
  const [file, setFile] = useState<File | null>(null)
  const [latestAnalysis, setLatestAnalysis] = useState<Analysis | null>(null)
  const [selectedAnalysis, setSelectedAnalysis] = useState<Analysis | null>(null)
  const [history, setHistory] = useState<Analysis[]>([])
  const [isScanning, setIsScanning] = useState(false)
  const [isHistoryLoading, setIsHistoryLoading] = useState(false)
  const [message, setMessage] = useState('')

  const sortedHistory = useMemo(
    () => [...history].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()),
    [history],
  )

  async function loadHistory() {
    setIsHistoryLoading(true)
    setMessage('')
    try {
      const data = await getHistory(token)
      setHistory(data)
    } catch (error) {
      setMessage(getErrorMessage(error))
    } finally {
      setIsHistoryLoading(false)
    }
  }

  useEffect(() => {
    // Initial load when user enters dashboard.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadHistory()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function handleScan(event: React.FormEvent) {
    event.preventDefault()
    if (!file) {
      setMessage('Pilih gambar ikan dulu bro.')
      return
    }

    setIsScanning(true)
    setMessage('')
    try {
      const analysis = await scanFish(token, file)
      setLatestAnalysis(analysis)
      setFile(null)
      await loadHistory()
    } catch (error) {
      setMessage(getErrorMessage(error))
    } finally {
      setIsScanning(false)
    }
  }

  async function openDetail(id: number) {
    setMessage('')
    try {
      setSelectedAnalysis(await getAnalysisDetail(token, id))
    } catch (error) {
      setMessage(getErrorMessage(error))
    }
  }

  async function removeAnalysis(id: number) {
    setMessage('')
    try {
      await deleteAnalysis(token, id)
      if (latestAnalysis?.id === id) setLatestAnalysis(null)
      if (selectedAnalysis?.id === id) setSelectedAnalysis(null)
      await loadHistory()
    } catch (error) {
      setMessage(getErrorMessage(error))
    }
  }

  return (
    <main className="dashboard-page">
      <section className="dashboard-hero">
        <div>
          <span className="dashboard-eyebrow">Fisight Dashboard</span>
          <h1>Halo, {auth.user.name}</h1>
          <p>Frontend Naufal sekarang sudah nyambung ke backend auth, scan, dan history.</p>
        </div>
        <button className="dashboard-btn dashboard-btn--ghost" type="button" onClick={onLogout}>
          <LogOut size={18} /> Logout
        </button>
      </section>

      {message && <p className="dashboard-alert">{message}</p>}

      <section className="dashboard-grid">
        <article className="dashboard-panel upload-panel">
          <div className="panel-title">
            <Upload size={22} />
            <div>
              <h2>Upload foto ikan</h2>
              <p>Format yang didukung: JPG, PNG, WebP.</p>
            </div>
          </div>

          <form className="scan-form" onSubmit={handleScan}>
            <label className="scan-dropzone">
              <span>{file ? file.name : 'Klik untuk pilih gambar'}</span>
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={(event) => setFile(event.target.files?.[0] || null)}
              />
            </label>
            <button className="dashboard-btn dashboard-btn--primary" type="submit" disabled={isScanning}>
              {isScanning ? 'Scanning...' : 'Upload & scan'}
            </button>
          </form>
        </article>

        <article className="dashboard-panel">
          <ResultCard analysis={latestAnalysis} />
        </article>
      </section>

      <section className="dashboard-panel history-panel">
        <div className="history-heading">
          <div className="panel-title">
            <History size={22} />
            <div>
              <h2>Riwayat analisis</h2>
              <p>Data diambil dari endpoint backend `/analysis/history`.</p>
            </div>
          </div>
          <button className="dashboard-btn dashboard-btn--ghost" type="button" onClick={loadHistory} disabled={isHistoryLoading}>
            <RefreshCw size={16} /> {isHistoryLoading ? 'Loading...' : 'Refresh'}
          </button>
        </div>

        {sortedHistory.length === 0 ? (
          <p className="history-empty">Belum ada history buat akun ini.</p>
        ) : (
          <div className="history-list">
            {sortedHistory.map((item) => (
              <article className="history-item" key={item.id}>
                <div>
                  <strong>{item.status}</strong>
                  <p>{item.filename || `Analisis #${item.id}`}</p>
                  <small>{new Date(item.created_at).toLocaleString('id-ID')}</small>
                </div>
                <span className="history-score">{Number(item.overall_score || 0).toFixed(1)}</span>
                <div className="history-actions">
                  <button type="button" onClick={() => openDetail(item.id)}>Detail</button>
                  <button className="danger" type="button" onClick={() => removeAnalysis(item.id)}>
                    <Trash2 size={15} /> Delete
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {selectedAnalysis && (
        <div className="modal-backdrop" role="presentation" onClick={() => setSelectedAnalysis(null)}>
          <section className="dashboard-panel detail-modal" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
            <button className="modal-close" type="button" onClick={() => setSelectedAnalysis(null)}>×</button>
            <ResultCard analysis={selectedAnalysis} />
          </section>
        </div>
      )}
    </main>
  )
}
