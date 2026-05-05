import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import fishEyeLogo from '../../assets/fish-eye-logo.png'
import './Navbar.css'

const navLinks = [
  { path: '/dashboard', label: 'Beranda' },
  { path: '/scan', label: 'Scan' },
  { path: '/riwayat', label: 'Riwayat' },
  { path: '/artikel', label: 'Artikel' },
  { path: '/profil', label: 'Profil' },
]

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const location = useLocation()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 30)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => setMobileOpen(false), [location.pathname])

  return (
    <nav className={`nav ${scrolled ? 'nav--scrolled' : ''}`}>
      <div className="nav__inner">
        <Link to="/dashboard" className="nav__logo">
          <div className="nav__logo-icon">
            <img src={fishEyeLogo} alt="Fisight" />
          </div>
          <span className="nav__logo-text">Fisight</span>
        </Link>

        <div className={`nav__links ${mobileOpen ? 'nav__links--open' : ''}`}>
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className={`nav__link ${location.pathname === link.path ? 'nav__link--active' : ''}`}
            >
              {link.label}
            </Link>
          ))}
        </div>

        <Link to="#" className="nav__cta">Contact Us</Link>

        <button
          className="nav__hamburger"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Menu"
        >
          <span /><span /><span />
        </button>
      </div>
    </nav>
  )
}
