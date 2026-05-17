import { useState, useRef, useEffect, type DragEvent } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Upload, ScanLine, X, Loader2, Fish, Download, Share2, CheckCircle2, AlertTriangle, XCircle, ShieldCheck } from 'lucide-react'

import Navbar from '../components/layout/Navbar'
import Footer from '../components/layout/Footer'
import './ScanPage.css'

const MAX_FILES = 4

interface UploadedFile {
  id: string
  file: File
  preview: string
}

interface DetailScore {
  label: string
  score: number
  status: 'Baik' | 'Sedang' | 'Buruk'
  desc: string
}

interface ScanResult {
  fishName: string
  overallScore: number
  quality: string
  summary: string
  image: string
  details: DetailScore[]
}

// Mock result generator - varies per image index
function generateMockResult(preview: string, index: number): ScanResult {
  const names = ['Ikan Tuna', 'Ikan Kakap Merah', 'Ikan Kembung', 'Ikan Tongkol']
  const variants = [
    { score: 89, quality: 'Kualitas Baik', details: [
      { label: 'Kesegaran Umum', score: 89, status: 'Baik' as const, desc: 'Ikan menunjukan tanda-tanda yang baik dan kesegaran yang baik secara keseluruhan' },
      { label: 'Kondisi Mata', score: 90, status: 'Baik' as const, desc: 'Mata jernih, cerah, dan menonjol. Tidak ada kekeruhan' },
      { label: 'Kondisi Sisik', score: 68, status: 'Sedang' as const, desc: 'Sisik berwarna agak pudar, terdapat sel kulit mati ikan yang belum terlepas' },
      { label: 'Kondisi Insang', score: 93, status: 'Baik' as const, desc: 'Insang memiliki kondisi yang sangat baik, tidak ada parasit' },
    ]},
    { score: 72, quality: 'Kualitas Baik', details: [
      { label: 'Kesegaran Umum', score: 70, status: 'Baik' as const, desc: 'Ikan dalam kondisi cukup segar dengan aroma normal' },
      { label: 'Kondisi Mata', score: 75, status: 'Baik' as const, desc: 'Mata cukup jernih meski sedikit kekuningan' },
      { label: 'Kondisi Sisik', score: 65, status: 'Sedang' as const, desc: 'Beberapa sisik mulai terlepas di bagian perut' },
      { label: 'Kondisi Insang', score: 78, status: 'Baik' as const, desc: 'Insang berwarna merah kecoklatan, masih dalam batas normal' },
    ]},
    { score: 45, quality: 'Kualitas Sedang', details: [
      { label: 'Kesegaran Umum', score: 42, status: 'Sedang' as const, desc: 'Ikan menunjukan tanda awal penurunan kesegaran' },
      { label: 'Kondisi Mata', score: 38, status: 'Buruk' as const, desc: 'Mata mulai keruh dan sedikit cekung' },
      { label: 'Kondisi Sisik', score: 55, status: 'Sedang' as const, desc: 'Sisik kusam dan beberapa area mulai mengelupas' },
      { label: 'Kondisi Insang', score: 48, status: 'Sedang' as const, desc: 'Insang berwarna agak pucat, perlu diperhatikan' },
    ]},
    { score: 30, quality: 'Kualitas Buruk', details: [
      { label: 'Kesegaran Umum', score: 28, status: 'Buruk' as const, desc: 'Ikan sudah tidak segar, terdapat bau tidak sedap' },
      { label: 'Kondisi Mata', score: 20, status: 'Buruk' as const, desc: 'Mata sangat keruh dan cekung dalam' },
      { label: 'Kondisi Sisik', score: 35, status: 'Buruk' as const, desc: 'Sisik banyak terlepas dan warna sangat pudar' },
      { label: 'Kondisi Insang', score: 32, status: 'Buruk' as const, desc: 'Insang berwarna coklat kehitaman, tidak layak konsumsi' },
    ]},
  ]
  const v = variants[index % variants.length]
  const name = names[index % names.length]
  return {
    fishName: name,
    overallScore: v.score,
    quality: v.quality,
    summary: `${name} memiliki ${v.quality.toLowerCase()} secara keseluruhan`,
    image: preview,
    details: v.details,
  }
}

// Canvas helpers
function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.lineTo(x + w - r, y)
  ctx.quadraticCurveTo(x + w, y, x + w, y + r)
  ctx.lineTo(x + w, y + h - r)
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h)
  ctx.lineTo(x + r, y + h)
  ctx.quadraticCurveTo(x, y + h, x, y + h - r)
  ctx.lineTo(x, y + r)
  ctx.quadraticCurveTo(x, y, x + r, y)
  ctx.closePath()
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxW: number, lineH: number) {
  const words = text.split(' ')
  let line = ''
  let curY = y
  for (const word of words) {
    const test = line + word + ' '
    if (ctx.measureText(test).width > maxW && line) {
      ctx.fillText(line.trim(), x, curY)
      line = word + ' '
      curY += lineH
    } else {
      line = test
    }
  }
  ctx.fillText(line.trim(), x, curY)
}

type ValidationState = 'idle' | 'checking' | 'valid' | 'warning' | 'rejected'

export default function ScanPage() {
  const [dragActive, setDragActive] = useState(false)
  const [files, setFiles] = useState<UploadedFile[]>([])
  const [scanning, setScanning] = useState(false)
  const [results, setResults] = useState<ScanResult[]>([])
  const [activeTab, setActiveTab] = useState(0)
  const [validation, setValidation] = useState<ValidationState>('idle')
  const inputRef = useRef<HTMLInputElement>(null)
  const resultRef = useRef<HTMLDivElement>(null)
  const location = useLocation()
  const navigate = useNavigate()

  // Accept result from riwayat page navigation (single result)
  useEffect(() => {
    const state = location.state as { result?: ScanResult } | null
    if (state?.result) {
      setResults([state.result])
      setActiveTab(0)
      window.history.replaceState({}, '')
    }
  }, [location.state])

  const result = results[activeTab] || null

  const handleDrag = (e: DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true)
    if (e.type === 'dragleave') setDragActive(false)
  }

  const handleDrop = (e: DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    addFiles(Array.from(e.dataTransfer.files))
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      addFiles(Array.from(e.target.files))
      e.target.value = ''
    }
  }

  const addFiles = (newFiles: File[]) => {
    const remaining = MAX_FILES - files.length
    if (remaining <= 0) return
    const valid = newFiles
      .filter(f => ['image/jpeg', 'image/png', 'image/webp'].includes(f.type))
      .slice(0, remaining)
    const uploaded: UploadedFile[] = valid.map(f => ({
      id: crypto.randomUUID(),
      file: f,
      preview: URL.createObjectURL(f),
    }))
    setFiles(prev => [...prev, ...uploaded])
    setValidation('idle') // reset validation when files change
  }

  const removeFile = (id: string) => {
    setFiles(prev => {
      const file = prev.find(f => f.id === id)
      if (file) URL.revokeObjectURL(file.preview)
      return prev.filter(f => f.id !== id)
    })
    setValidation('idle')
  }

  // Validate fish similarity before scanning
  const validateAndScan = () => {
    if (files.length === 0) return
    if (files.length === 1) {
      // Single image - skip validation
      startScan()
      return
    }
    // Multiple images - validate similarity
    setValidation('checking')
    // Mock validation (replace with real AI API call)
    setTimeout(() => {
      // Demo logic: 2 files = warning, 4 files = rejected, others = valid
      if (files.length === 4) {
        setValidation('rejected')
      } else if (files.length === 2) {
        setValidation('warning')
      } else {
        setValidation('valid')
        startScan()
      }
    }, 1500)
  }

  const startScan = () => {
    setValidation('idle')
    setScanning(true)
    setTimeout(() => {
      setScanning(false)
      // All images are of same fish - produce single combined result
      const combined = generateMockResult(files[0].preview, 0)
      combined.summary = `Analisis dari ${files.length} foto: ${combined.fishName} memiliki ${combined.quality.toLowerCase()}`
      setResults([combined])
      setActiveTab(0)
    }, 3000)
  }

  const handleForceSubmit = () => {
    // User chose to continue despite warning
    setValidation('idle')
    startScan()
  }

  const handleReset = () => {
    files.forEach(f => URL.revokeObjectURL(f.preview))
    setFiles([])
    setResults([])
    setActiveTab(0)
    setValidation('idle')
  }

  const handleDownload = async () => {
    if (!result) return

    const W = 800, H = 900
    const canvas = document.createElement('canvas')
    canvas.width = W
    canvas.height = H
    const ctx = canvas.getContext('2d')!

    // Background
    const grad = ctx.createLinearGradient(0, 0, 0, H)
    grad.addColorStop(0, '#0a1e3d')
    grad.addColorStop(0.35, '#0d3050')
    grad.addColorStop(0.35, '#f0f4f8')
    grad.addColorStop(1, '#f0f4f8')
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, W, H)

    // Header text
    ctx.fillStyle = '#22d3ee'
    ctx.font = '600 12px Inter, sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText('FISIGHT AI', W / 2, 40)

    ctx.fillStyle = '#f1f5f9'
    ctx.font = '800 28px Outfit, sans-serif'
    ctx.fillText('Hasil Analisis Kualitas', W / 2, 75)

    ctx.fillStyle = 'rgba(241,245,249,0.6)'
    ctx.font = '400 13px Inter, sans-serif'
    ctx.fillText(`Dianalisis pada ${new Date().toLocaleString('id-ID')}`, W / 2, 100)

    // Main score card
    const cardY = 130, cardH = 160
    ctx.fillStyle = '#fff'
    roundRect(ctx, 60, cardY, W - 120, cardH, 20)
    ctx.fill()
    ctx.shadowColor = 'transparent'

    // Score circle
    const cx = W / 2, cy = cardY + cardH / 2, r = 48
    ctx.beginPath()
    ctx.arc(cx, cy, r, 0, Math.PI * 2)
    ctx.strokeStyle = '#e5e7eb'
    ctx.lineWidth = 8
    ctx.stroke()

    const scoreColor = result.overallScore >= 70 ? '#10b981' : result.overallScore >= 40 ? '#f59e0b' : '#ef4444'
    const endAngle = -Math.PI / 2 + (result.overallScore / 100) * Math.PI * 2
    ctx.beginPath()
    ctx.arc(cx, cy, r, -Math.PI / 2, endAngle)
    ctx.strokeStyle = scoreColor
    ctx.lineWidth = 8
    ctx.lineCap = 'round'
    ctx.stroke()
    ctx.lineCap = 'butt'

    ctx.fillStyle = scoreColor
    ctx.font = '800 32px Outfit, sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText(String(result.overallScore), cx, cy + 8)

    ctx.fillStyle = '#94a3b8'
    ctx.font = '400 10px Inter, sans-serif'
    ctx.fillText('dari 100', cx, cy + 24)

    // Quality badge + Fish name
    ctx.fillStyle = scoreColor
    ctx.font = '700 12px Inter, sans-serif'
    ctx.fillText(`✓ ${result.quality}`, cx, cardY + cardH - 28)

    ctx.fillStyle = '#0c3547'
    ctx.font = '800 16px Outfit, sans-serif'
    ctx.fillText(result.fishName, cx, cardY + cardH - 8)

    // Detail cards - 2x2 grid
    const details = result.details
    const gapX = 16, gapY = 16
    const dW = (W - 120 - gapX) / 2
    const dH = 145
    const startY = cardY + cardH + 30

    details.forEach((d, i) => {
      const col = i % 2
      const row = Math.floor(i / 2)
      const x = 60 + col * (dW + gapX)
      const y = startY + row * (dH + gapY)

      // Card bg
      ctx.fillStyle = '#fff'
      roundRect(ctx, x, y, dW, dH, 14)
      ctx.fill()

      // Title
      ctx.fillStyle = '#0c3547'
      ctx.font = '700 13px Outfit, sans-serif'
      ctx.textAlign = 'left'
      ctx.fillText(d.label, x + 16, y + 28)

      // Badge
      const badgeColor = d.status === 'Baik' ? '#10b981' : d.status === 'Sedang' ? '#f59e0b' : '#ef4444'
      ctx.fillStyle = badgeColor
      ctx.font = '700 10px Inter, sans-serif'
      ctx.fillText(d.status, x + 16, y + 46)

      // Score
      ctx.fillStyle = badgeColor
      ctx.font = '800 36px Outfit, sans-serif'
      ctx.textAlign = 'right'
      ctx.fillText(String(d.score), x + dW - 16, y + 44)

      // Progress bar
      ctx.fillStyle = '#e5e7eb'
      roundRect(ctx, x + 16, y + 58, dW - 32, 5, 3)
      ctx.fill()

      ctx.fillStyle = badgeColor
      roundRect(ctx, x + 16, y + 58, (dW - 32) * d.score / 100, 5, 3)
      ctx.fill()

      // Description - word wrap
      ctx.fillStyle = '#64748b'
      ctx.font = '400 10px Inter, sans-serif'
      ctx.textAlign = 'left'
      wrapText(ctx, d.desc, x + 16, y + 80, dW - 32, 14)
    })

    // Footer
    const footY = startY + 2 * (dH + gapY) + 20
    ctx.fillStyle = '#94a3b8'
    ctx.font = '400 11px Inter, sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText('Dihasilkan oleh Fisight AI  •  fisight.app', W / 2, footY)

    // Download
    const url = canvas.toDataURL('image/png')
    const a = document.createElement('a')
    a.href = url
    a.download = `fisight-hasil-${Date.now()}.png`
    a.click()
  }

  const handleShare = async () => {
    if (!result) return
    const text = `🐟 Hasil Analisis Fisight\n\n${result.fishName}\nSkor: ${result.overallScore}/100 - ${result.quality}\n${result.summary}\n\n${result.details.map(d => `• ${d.label}: ${d.score} (${d.status})`).join('\n')}\n\nDianalisis oleh Fisight AI`

    if (navigator.share) {
      try {
        await navigator.share({ title: 'Hasil Analisis Fisight', text })
      } catch { /* user cancelled */ }
    } else {
      await navigator.clipboard.writeText(text)
      alert('Hasil berhasil disalin ke clipboard!')
    }
  }

  const canUploadMore = files.length < MAX_FILES

  // ─── RESULT VIEW ───
  if (results.length > 0 && result) {
    return (
      <div className="scan-page">
        <Navbar />

        <div className="scan-dark" data-nav-theme="dark">
          <div className="scan-header">
            <h1 className="scan-title">Hasil Analisis Kualitas</h1>
            <p className="scan-subtitle">
              {results.length > 1
                ? `${results.length} gambar dianalisis secara terpisah`
                : 'Berikut adalah hasil analisis kualitas ikan anda'}
            </p>
          </div>
        </div>

        <div className="scan-body" data-nav-theme="light">
          <div className="result-wrapper" ref={resultRef}>

            {/* Tabs for multiple results */}
            {results.length > 1 && (
              <div className="result-tabs">
                {results.map((r, i) => (
                  <button
                    key={i}
                    className={`result-tab ${activeTab === i ? 'result-tab--active' : ''}`}
                    onClick={() => setActiveTab(i)}
                  >
                    <img src={r.image} alt="" className="result-tab__img" />
                    <div className="result-tab__info">
                      <span className="result-tab__label">Gambar {i + 1}</span>
                      <span className={`result-tab__score result-tab__score--${r.overallScore >= 70 ? 'baik' : r.overallScore >= 40 ? 'sedang' : 'buruk'}`}>
                        {r.overallScore}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* Main result card */}
            <div className="result-main">
              <div className="result-main__image">
                <img src={result.image} alt={result.fishName} />
                <div className="result-main__image-label">{result.fishName}</div>
              </div>

              <div className="result-main__info">
                <div className="result-gauge">
                  <svg viewBox="0 0 120 120" className="result-gauge__svg">
                    <circle cx="60" cy="60" r="52" fill="none" stroke="#e5e7eb" strokeWidth="8" />
                    <circle
                      cx="60" cy="60" r="52"
                      fill="none"
                      stroke={result.overallScore >= 70 ? '#10b981' : result.overallScore >= 40 ? '#f59e0b' : '#ef4444'}
                      strokeWidth="8"
                      strokeLinecap="round"
                      strokeDasharray={`${(result.overallScore / 100) * 327} 327`}
                      transform="rotate(-90 60 60)"
                      className="result-gauge__fill"
                    />
                  </svg>
                  <div className="result-gauge__value">
                    <span className="result-gauge__number">{result.overallScore}</span>
                    <span className="result-gauge__label">dari 100</span>
                  </div>
                </div>

                <div className="result-main__quality">
                  <CheckCircle2 size={16} />
                  {result.quality}
                </div>
                <p className="result-main__fish-name">{result.fishName}</p>
                <p className="result-main__summary">{result.summary}</p>

                <div className="result-main__actions">
                  <button className="result-btn result-btn--primary" onClick={handleDownload}>
                    <Download size={16} />
                    Unduh Hasil
                  </button>
                  <button className="result-btn result-btn--secondary" onClick={handleShare}>
                    <Share2 size={16} />
                    Bagikan
                  </button>
                </div>
              </div>
            </div>

            {/* Detail cards */}
            <div className="result-details">
              {result.details.map((d) => (
                <div key={d.label} className="result-detail">
                  <div className="result-detail__header">
                    <div>
                      <h4 className="result-detail__title">{d.label}</h4>
                      <span className={`result-detail__badge result-detail__badge--${d.status.toLowerCase()}`}>
                        {d.status}
                      </span>
                    </div>
                    <span className={`result-detail__score result-detail__score--${d.status.toLowerCase()}`}>
                      {d.score}
                    </span>
                  </div>
                  <div className="result-detail__bar">
                    <div
                      className={`result-detail__bar-fill result-detail__bar-fill--${d.status.toLowerCase()}`}
                      style={{ width: `${d.score}%` }}
                    />
                  </div>
                  <p className="result-detail__desc">{d.desc}</p>
                </div>
              ))}
            </div>

            {/* Scan again */}
            <button className="result-scan-again" onClick={handleReset}>
              <ScanLine size={18} />
              Scan Lagi
            </button>
          </div>
        </div>

        <Footer />
      </div>
    )
  }

  // ─── UPLOAD VIEW ───
  return (
    <div className="scan-page">
      <Navbar />

      <div className="scan-dark" data-nav-theme="dark">
        <div className="scan-header">
          <span className="scan-badge">
            <ScanLine size={14} />
            SCAN IKAN
          </span>
          <h1 className="scan-title">Identifikasi Kualitas Ikan</h1>
          <p className="scan-subtitle">
            Upload foto ikan dari berbagai sudut untuk analisis
            kualitas yang lebih akurat menggunakan AI.
          </p>
        </div>
      </div>

      <div className="scan-body" data-nav-theme="light">
        <div className="scan-card-wrapper">

          {canUploadMore && (
            <div
              className={`scan-card ${dragActive ? 'scan-card--active' : ''}`}
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              onClick={() => inputRef.current?.click()}
            >
              <div className="scan-card__inner">
                <div className="scan-card__icon">
                  <Upload size={24} />
                </div>
                <h3 className="scan-card__title">Drag & drop foto ikan</h3>
                <p className="scan-card__hint">
                  Upload foto ikan yang <strong>sama</strong> dari berbagai sudut
                </p>
                <p className="scan-card__meta">
                  JPG, PNG, WEBP &nbsp;•&nbsp; Max 10MB &nbsp;•&nbsp; Maksimal {MAX_FILES} foto
                </p>
              </div>

              <input
                ref={inputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                multiple
                onChange={handleChange}
                className="scan-card__input"
              />
            </div>
          )}

          {files.length > 0 && (
            <div className="scan-previews">
              <div className="scan-previews__header">
                <h3 className="scan-previews__title">
                  Foto yang dipilih ({files.length}/{MAX_FILES})
                </h3>
                {canUploadMore && (
                  <button
                    className="scan-previews__add"
                    onClick={() => inputRef.current?.click()}
                  >
                    + Tambah foto
                  </button>
                )}
              </div>

              <div className="scan-previews__grid">
                {files.map((f) => (
                  <div key={f.id} className="scan-preview">
                    <img src={f.preview} alt={f.file.name} />
                    <button
                      className="scan-preview__remove"
                      onClick={(e) => { e.stopPropagation(); removeFile(f.id) }}
                      aria-label="Hapus"
                    >
                      <X size={14} />
                    </button>
                    <div className="scan-preview__name">{f.file.name}</div>
                  </div>
                ))}
              </div>

              {/* Validation warning banner */}
              {validation === 'warning' && (
                <div className="scan-validation scan-validation--warning">
                  <div className="scan-validation__icon">
                    <AlertTriangle size={20} />
                  </div>
                  <div className="scan-validation__text">
                    <h4>Foto terdeteksi berbeda</h4>
                    <p>AI mendeteksi foto yang diupload mungkin bukan ikan yang sama. Hasil analisis mungkin kurang akurat.</p>
                  </div>
                  <div className="scan-validation__actions">
                    <button className="scan-validation__btn scan-validation__btn--continue" onClick={handleForceSubmit}>
                      Tetap Scan
                    </button>
                    <button className="scan-validation__btn scan-validation__btn--cancel" onClick={() => setValidation('idle')}>
                      Ganti Foto
                    </button>
                  </div>
                </div>
              )}

              {/* Validation rejected banner */}
              {validation === 'rejected' && (
                <div className="scan-validation scan-validation--rejected">
                  <div className="scan-validation__icon">
                    <XCircle size={20} />
                  </div>
                  <div className="scan-validation__text">
                    <h4>Foto tidak valid</h4>
                    <p>AI mendeteksi foto yang diupload merupakan ikan yang sangat berbeda. Harap upload foto dari ikan yang sama.</p>
                  </div>
                  <div className="scan-validation__actions">
                    <button className="scan-validation__btn scan-validation__btn--cancel" onClick={handleReset}>
                      Hapus Semua
                    </button>
                  </div>
                </div>
              )}

              {/* Scan button */}
              {validation !== 'warning' && validation !== 'rejected' && (
                <button
                  className={`scan-btn ${scanning || validation === 'checking' ? 'scan-btn--loading' : ''}`}
                  onClick={validateAndScan}
                  disabled={scanning || validation === 'checking'}
                >
                  {validation === 'checking' ? (
                    <>
                      <Loader2 size={20} className="scan-btn__spinner" />
                      <ShieldCheck size={18} />
                      Memvalidasi kesamaan ikan...
                    </>
                  ) : scanning ? (
                    <>
                      <Loader2 size={20} className="scan-btn__spinner" />
                      Menganalisis...
                    </>
                  ) : (
                    <>
                      <Fish size={20} />
                      Mulai Scan
                    </>
                  )}
                </button>
              )}
            </div>
          )}

          {scanning && (
            <div className="scan-overlay">
              <div className="scan-overlay__bg" />
              <div className="scan-overlay__content">
                <div className="scan-overlay__ring">
                  <div className="scan-overlay__ring-inner" />
                  <Fish size={32} className="scan-overlay__fish" />
                </div>
                <h2 className="scan-overlay__title">Menganalisis Gambar...</h2>
                <p className="scan-overlay__desc">
                  AI sedang memeriksa kualitas dan kesegaran ikan Anda
                </p>
                <div className="scan-overlay__thumbs">
                  {files.map((f, i) => (
                    <div key={f.id} className="scan-overlay__thumb" style={{ animationDelay: `${i * 0.6}s` }}>
                      <img src={f.preview} alt="" />
                      <div className="scan-overlay__thumb-scan" />
                    </div>
                  ))}
                </div>
                <div className="scan-overlay__steps">
                  <div className="scan-overlay__step scan-overlay__step--active">
                    <div className="scan-overlay__step-dot" />
                    <span>Upload</span>
                  </div>
                  <div className="scan-overlay__step-line" />
                  <div className="scan-overlay__step scan-overlay__step--active" style={{ animationDelay: '1s' }}>
                    <div className="scan-overlay__step-dot" />
                    <span>Analisis</span>
                  </div>
                  <div className="scan-overlay__step-line" />
                  <div className="scan-overlay__step" style={{ animationDelay: '2s' }}>
                    <div className="scan-overlay__step-dot" />
                    <span>Hasil</span>
                  </div>
                </div>
                <div className="scan-overlay__bar">
                  <div className="scan-overlay__bar-fill" />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <Footer />
    </div>
  )
}
