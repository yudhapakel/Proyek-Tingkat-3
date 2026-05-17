import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Clock } from 'lucide-react'
import Navbar from '../components/layout/Navbar'
import Footer from '../components/layout/Footer'
import type { Analysis, AuthResponse } from '../lib/api'
import { API_BASE_URL, getErrorMessage, getHistory } from '../lib/api'
import './RiwayatPage.css'

type Status = 'Baik' | 'Sedang' | 'Buruk'
type Filter = 'Semua' | Status

interface DetailScore {
  label: string
  score: number
  status: Status
  desc: string
}

interface HistoryItem {
  id: string
  name: string
  image: string
  date: string
  status: Status
  score: number
  quality: string
  summary: string
  details: DetailScore[]
  createdAt?: string
}

type RiwayatPageProps = {
  auth: AuthResponse
}

function scoreStatus(score: number): Status {
  if (score >= 70) return 'Baik'
  if (score >= 40) return 'Sedang'
  return 'Buruk'
}

function imageUrl(path: string | null) {
  if (!path) return ''
  if (path.startsWith('http')) return path
  return `${API_BASE_URL}${path}`
}

function qualityLabel(status: string, score: number) {
  const normalized = status || scoreStatus(score)
  return normalized.toLowerCase().includes('baik') ? 'Kualitas Baik'
    : normalized.toLowerCase().includes('buruk') ? 'Kualitas Buruk'
      : 'Kualitas Sedang'
}

function formatDate(value: string | null | undefined) {
  if (!value) return '-'
  return new Date(value).toLocaleString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function mapAnalysis(item: Analysis): HistoryItem {
  const score = Math.round(Number(item.overall_score || 0))
  const status = scoreStatus(score)
  return {
    id: String(item.id),
    name: item.fish_type || item.filename || `Analisis #${item.id}`,
    image: imageUrl(item.image_url),
    date: formatDate(item.created_at),
    status,
    score,
    quality: qualityLabel(item.status, score),
    summary: item.recommendation || `Hasil analisis menunjukkan kualitas ${item.status || status} dengan skor ${score}/100.`,
    createdAt: item.created_at,
    details: [
      { label: 'Kesegaran Umum', score: Math.round(Number(item.freshness_score || 0)), status: scoreStatus(item.freshness_score), desc: 'Skor kesegaran dari backend AI Fisight.' },
      { label: 'Kondisi Mata', score: Math.round(Number(item.eye_score || 0)), status: scoreStatus(item.eye_score), desc: 'Estimasi kondisi mata berdasarkan analisis visual.' },
      { label: 'Kondisi Sisik', score: Math.round(Number(item.scale_score || 0)), status: scoreStatus(item.scale_score), desc: 'Estimasi kondisi sisik/permukaan ikan.' },
      { label: 'Kondisi Insang', score: Math.round(Number(item.gill_score || 0)), status: scoreStatus(item.gill_score), desc: 'Estimasi kondisi insang dari backend AI.' },
    ],
  }
}

export default function RiwayatPage({ auth }: RiwayatPageProps) {
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<Filter>('Semua')
  const [history, setHistory] = useState<HistoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    let cancelled = false
    async function loadHistory() {
      setLoading(true)
      setError('')
      try {
        const data = await getHistory(auth.access_token)
        if (!cancelled) setHistory(data.map(mapAnalysis))
      } catch (err) {
        if (!cancelled) setError(getErrorMessage(err))
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void loadHistory()
    return () => { cancelled = true }
  }, [auth.access_token])

  const filtered = useMemo(() => history.filter(item => {
    const matchSearch = item.name.toLowerCase().includes(search.toLowerCase())
    const matchFilter = filter === 'Semua' || item.status === filter
    return matchSearch && matchFilter
  }), [filter, history, search])

  const handleCardClick = (item: HistoryItem) => {
    navigate('/scan', {
      state: {
        result: {
          id: Number(item.id),
          fishName: item.name,
          overallScore: item.score,
          quality: item.quality,
          summary: item.summary,
          image: item.image,
          details: item.details,
          createdAt: item.createdAt,
        }
      }
    })
  }

  const filters: Filter[] = ['Semua', 'Baik', 'Sedang', 'Buruk']

  return (
    <div className="riwayat-page">
      <Navbar />

      <div className="riwayat-dark" data-nav-theme="dark">
        <div className="riwayat-header">
          <span className="riwayat-badge">
            <Clock size={14} />
            RIWAYAT SCAN
          </span>
          <h1 className="riwayat-title">Riwayat Identifikasi</h1>
          <p className="riwayat-subtitle">
            Lihat semua hasil scan ikan yang pernah Anda lakukan
          </p>
        </div>
      </div>

      <div className="riwayat-body" data-nav-theme="light">
        <div className="riwayat-content">
          <div className="riwayat-toolbar">
            <div className="riwayat-search">
              <Search size={18} className="riwayat-search__icon" />
              <input
                type="text"
                placeholder="Cari nama ikan..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="riwayat-search__input"
              />
            </div>
            <div className="riwayat-filters">
              {filters.map((f) => (
                <button
                  key={f}
                  className={`riwayat-filter ${filter === f ? 'riwayat-filter--active' : ''}`}
                  onClick={() => setFilter(f)}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          <p className="riwayat-count">
            {loading ? 'Memuat riwayat dari backend...' : `Menampilkan ${filtered.length} dari ${history.length} hasil`}
          </p>

          {error && (
            <div className="riwayat-empty">
              <p>{error}</p>
            </div>
          )}

          <div className="riwayat-grid">
            {filtered.map((item) => (
              <div key={item.id} className="riwayat-card" onClick={() => handleCardClick(item)}>
                <div className="riwayat-card__image">
                  {item.image ? <img src={item.image} alt={item.name} /> : <div className="riwayat-empty"><p>Tanpa gambar</p></div>}
                </div>
                <div className="riwayat-card__body">
                  <h3 className="riwayat-card__name">{item.name}</h3>
                  <div className="riwayat-card__meta">
                    <span className="riwayat-card__date">{item.date}</span>
                    <span className={`riwayat-card__status riwayat-card__status--${item.status.toLowerCase()}`}>
                      {item.status} ›
                    </span>
                  </div>
                  <div className="riwayat-card__bar">
                    <div
                      className={`riwayat-card__bar-fill riwayat-card__bar-fill--${item.status.toLowerCase()}`}
                      style={{ width: `${item.score}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {!loading && !error && filtered.length === 0 && (
            <div className="riwayat-empty">
              <p>Belum ada riwayat yang cocok. Coba scan ikan dulu dari halaman Scan.</p>
            </div>
          )}
        </div>
      </div>

      <Footer />
    </div>
  )
}
