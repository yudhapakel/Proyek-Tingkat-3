import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Eye, Zap, ShieldCheck, TrendingUp, Award, Clock } from 'lucide-react'
import Navbar from '../components/layout/Navbar'
import Footer from '../components/layout/Footer'
import heroBg from '../assets/underwater-hero-bg.png'
import freshFishImg from '../assets/fresh-fish.png'
import './DashboardPage.css'

const features = [
  {
    icon: Eye,
    title: 'Scan Cepat',
    desc: 'Dapatkan hasil analisis kesegaran ikan hanya dalam hitungan detik menggunakan AI',
  },
  {
    icon: Zap,
    title: 'Akurasi Tinggi',
    desc: 'Tingkat akurasi hingga 98% dalam mendeteksi kesegaran dan kualitas ikan',
  },
  {
    icon: ShieldCheck,
    title: 'Data Aman',
    desc: 'Keamanan data Anda terjamin dengan enkripsi tingkat tinggi dan privasi terlindungi',
  },
]

export default function DashboardPage() {
  const heroContentRef = useRef<HTMLDivElement>(null)
  const featuresRef = useRef<HTMLElement>(null)

  // Parallax-lite: content moves slightly on scroll
  useEffect(() => {
    const onScroll = () => {
      if (!heroContentRef.current) return
      const y = window.scrollY
      heroContentRef.current.style.transform = `translateY(${y * 0.15}px)`
      heroContentRef.current.style.opacity = `${1 - y / 800}`
    }
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Scroll reveal for elements
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('revealed')
            observer.unobserve(entry.target)
          }
        })
      },
      { threshold: 0.15 }
    )
    document.querySelectorAll('.scroll-reveal').forEach((el) => observer.observe(el))
    return () => observer.disconnect()
  }, [])

  return (
    <div className="dashboard">
      <Navbar />

      {/* Hero Section */}
      <section className="hero">
        <div className="hero__bg">
          <img src={heroBg} alt="" className="hero__bg-img" />
          <div className="hero__bg-overlay" />
        </div>

        {/* Floating bubbles */}
        <div className="hero__bubbles">
          {[...Array(15)].map((_, i) => (
            <div
              key={i}
              className="hero__bubble"
              style={{
                '--left': `${5 + Math.random() * 90}%`,
                '--size': `${6 + Math.random() * 18}px`,
                '--delay': `${i * 0.7}s`,
                '--duration': `${6 + Math.random() * 8}s`,
                '--drift': `${-20 + Math.random() * 40}px`,
              } as React.CSSProperties}
            />
          ))}
        </div>

        <div className="hero__content" ref={heroContentRef}>
          <h1 className="hero__title anim-fade-up" style={{ animationDelay: '0.2s' }}>
            Pastikan <span className="hero__title-accent">Kualitas Ikan</span>
            <br />Dengan Teknologi AI
          </h1>

          <p className="hero__subtitle anim-fade-up" style={{ animationDelay: '0.5s' }}>
            Solusi pintar untuk menganalisis kesegaran ikan dengan
            akurasi tinggi menggunakan teknologi AI terkini
          </p>

          <div className="hero__row anim-fade-up" style={{ animationDelay: '0.8s' }}>
            <div className="hero__stat">
              <span className="hero__stat-value">10K</span>
              <span className="hero__stat-label">ikan di analisis</span>
            </div>

            <Link to="/scan" className="hero__cta">
              Mulai Sekarang
              <ArrowRight size={20} />
            </Link>

            <div className="hero__stat">
              <span className="hero__stat-value">98%</span>
              <span className="hero__stat-label">Akurasi AI</span>
            </div>
          </div>

          {/* Scroll indicator */}
          <div className="hero__scroll-indicator anim-fade-up" style={{ animationDelay: '1.2s' }}>
            <div className="hero__scroll-dot" />
          </div>
        </div>
      </section>

      {/* Wave divider - top */}
      <div className="wave-divider wave-divider--top">
        <svg viewBox="0 0 1440 120" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M0,120 L0,60 C240,120 480,0 720,40 C960,80 1200,10 1440,60 L1440,120 Z" fill="#c5e8f0" />
          <path d="M0,120 L0,80 C320,110 560,30 800,65 C1040,100 1280,40 1440,75 L1440,120 Z" fill="#c5e8f0" opacity="0.5" />
        </svg>
      </div>

      {/* Features Section */}
      <section className="features" ref={featuresRef}>
        {/* Decorative fish */}
        <div className="features__deco features__deco--fish-1">🐟</div>
        <div className="features__deco features__deco--fish-2">🐠</div>
        <div className="features__deco features__deco--fish-3">🐟</div>
        <div className="features__deco features__deco--bubble-1" />
        <div className="features__deco features__deco--bubble-2" />
        <div className="features__deco features__deco--bubble-3" />

        <h2 className="features__title scroll-reveal">Kenapa Memilih Fisight AI?</h2>

        <div className="features__grid">
          {features.map((f, i) => (
            <div
              key={f.title}
              className="features__card scroll-reveal"
              style={{ transitionDelay: `${i * 0.15}s` }}
            >
              <div className="features__card-icon">
                <f.icon size={22} />
              </div>
              <h3 className="features__card-title">{f.title}</h3>
              <p className="features__card-desc">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Wave divider - features to analysis */}
      <div className="wave-divider wave-divider--mid">
        <svg viewBox="0 0 1440 80" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M0,0 C360,80 1080,0 1440,60 L1440,80 L0,80 Z" fill="#085A8C" />
          <path d="M0,30 C480,70 960,10 1440,50 L1440,80 L0,80 Z" fill="#085A8C" opacity="0.7" />
        </svg>
      </div>

      {/* Analysis Section */}
      <section className="analysis">
        <div className="analysis__deco analysis__deco--fish-1">🐟</div>
        <div className="analysis__deco analysis__deco--fish-2">🐠</div>
        <div className="analysis__deco analysis__deco--bubble-1" />
        <div className="analysis__deco analysis__deco--bubble-2" />

        <div className="analysis__inner">
          <div className="analysis__text scroll-reveal">
            <span className="analysis__badge">TEKNOLOGI</span>
            <h2 className="analysis__title">
              Analisis Mendalam Dengan Kecerdasan Buatan
            </h2>
            <p className="analysis__desc">
              Sistem AI kami menggunakan deep learning untuk menganalisis berbagai aspek
              kesegaran ikan, mulai dari warna, tekstur, hingga kondisi mata dan insang.
            </p>

            <div className="analysis__list">
              <div className="analysis__item scroll-reveal" style={{ transitionDelay: '0.1s' }}>
                <div className="analysis__item-icon"><TrendingUp size={18} /></div>
                <span>Akurasi tinggi</span>
              </div>
              <div className="analysis__item scroll-reveal" style={{ transitionDelay: '0.2s' }}>
                <div className="analysis__item-icon"><Award size={18} /></div>
                <span>Sertifikat kualitas</span>
              </div>
              <div className="analysis__item scroll-reveal" style={{ transitionDelay: '0.3s' }}>
                <div className="analysis__item-icon"><Clock size={18} /></div>
                <span>Analisis instan</span>
              </div>
            </div>
          </div>

          <div className="analysis__image scroll-reveal" style={{ transitionDelay: '0.15s' }}>
            <img src={freshFishImg} alt="Fresh fish analysis" />
          </div>
        </div>
      </section>

      {/* Wave divider - bottom */}
      <div className="wave-divider wave-divider--bottom">
        <svg viewBox="0 0 1440 120" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M0,0 L0,60 C240,0 480,120 720,80 C960,40 1200,110 1440,60 L1440,0 Z" fill="#c5e8f0" />
          <path d="M0,0 L0,40 C320,10 560,90 800,55 C1040,20 1280,80 1440,45 L1440,0 Z" fill="#c5e8f0" opacity="0.5" />
        </svg>
      </div>

      <Footer />
    </div>
  )
}
