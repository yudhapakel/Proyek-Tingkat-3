import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Clock } from 'lucide-react'
import Navbar from '../components/layout/Navbar'
import Footer from '../components/layout/Footer'
import './RiwayatPage.css'

import ikanTuna from '../assets/ikan-tuna.png'
import ikanHiu from '../assets/ikan-hiu.png'
import ikanSalmon from '../assets/ikan-salmon.png'

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
  details: DetailScore[]
}

const mockHistory: HistoryItem[] = [
  {
    id: '1', name: 'Ikan Tuna', image: ikanTuna, date: '26 Mar 2026 • 10:30', status: 'Baik', score: 89,
    details: [
      { label: 'Kesegaran Umum', score: 89, status: 'Baik', desc: 'Ikan menunjukan tanda-tanda yang baik dan kesegaran yang baik secara keseluruhan' },
      { label: 'Kondisi Mata', score: 90, status: 'Baik', desc: 'Mata jernih, cerah, dan menonjol. Tidak ada kekeruhan' },
      { label: 'Kondisi Sisik', score: 68, status: 'Sedang', desc: 'Sisik berwarna agak pudar, terdapat sel kulit mati ikan yang belum terlepas' },
      { label: 'Kondisi Insang', score: 93, status: 'Baik', desc: 'Insang memiliki kondisi yang sangat baik, tidak ada parasit ataupun tanda-tanda penyakit' },
    ],
  },
  {
    id: '2', name: 'Ikan Hiu', image: ikanHiu, date: '26 Mar 2026 • 10:30', status: 'Baik', score: 85,
    details: [
      { label: 'Kesegaran Umum', score: 85, status: 'Baik', desc: 'Ikan dalam keadaan segar dengan aroma laut yang alami' },
      { label: 'Kondisi Mata', score: 82, status: 'Baik', desc: 'Mata cukup jernih dan tidak ada tanda-tanda kerusakan' },
      { label: 'Kondisi Sisik', score: 88, status: 'Baik', desc: 'Kulit ikan halus dan tidak ada lecet atau kerusakan' },
      { label: 'Kondisi Insang', score: 84, status: 'Baik', desc: 'Insang berwarna merah segar, menandakan kualitas baik' },
    ],
  },
  {
    id: '3', name: 'Ikan Salmon', image: ikanSalmon, date: '26 Mar 2026 • 10:30', status: 'Buruk', score: 35,
    details: [
      { label: 'Kesegaran Umum', score: 30, status: 'Buruk', desc: 'Ikan menunjukan tanda-tanda pembusukan dan bau tidak sedap' },
      { label: 'Kondisi Mata', score: 25, status: 'Buruk', desc: 'Mata keruh dan cekung, menandakan ikan tidak segar' },
      { label: 'Kondisi Sisik', score: 45, status: 'Sedang', desc: 'Sisik mulai terlepas di beberapa bagian tubuh' },
      { label: 'Kondisi Insang', score: 38, status: 'Buruk', desc: 'Insang berwarna pucat kecoklatan, menandakan kualitas buruk' },
    ],
  },
]

export default function RiwayatPage() {
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<Filter>('Semua')
  const navigate = useNavigate()

  const filtered = mockHistory.filter(item => {
    const matchSearch = item.name.toLowerCase().includes(search.toLowerCase())
    const matchFilter = filter === 'Semua' || item.status === filter
    return matchSearch && matchFilter
  })

  const handleCardClick = (item: HistoryItem) => {
    const quality = item.score >= 70 ? 'Kualitas Baik' : item.score >= 40 ? 'Kualitas Sedang' : 'Kualitas Buruk'
    navigate('/scan', {
      state: {
        result: {
          overallScore: item.score,
          quality,
          summary: `Hasil analisis untuk ${item.name}`,
          image: item.image,
          details: item.details,
        }
      }
    })
  }

  const filters: Filter[] = ['Semua', 'Baik', 'Sedang', 'Buruk']

  return (
    <div className="riwayat-page">
      <Navbar />

      {/* Dark header */}
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

      {/* White body */}
      <div className="riwayat-body" data-nav-theme="light">
        <div className="riwayat-content">

          {/* Search + Filter bar */}
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

          {/* Result count */}
          <p className="riwayat-count">
            Menampilkan {filtered.length} dari {mockHistory.length} hasil
          </p>

          {/* Cards grid */}
          <div className="riwayat-grid">
            {filtered.map((item) => (
              <div key={item.id} className="riwayat-card" onClick={() => handleCardClick(item)}>
                <div className="riwayat-card__image">
                  <img src={item.image} alt={item.name} />
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

          {/* Empty state */}
          {filtered.length === 0 && (
            <div className="riwayat-empty">
              <p>Tidak ada hasil yang cocok</p>
            </div>
          )}
        </div>
      </div>

      <Footer />
    </div>
  )
}
