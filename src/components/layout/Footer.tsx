import { Link } from 'react-router-dom'
import fishEyeLogo from '../../assets/fish-eye-logo.png'
import './Footer.css'

const productLinks = [
  { label: 'Features', path: '#' },
  { label: 'Pricing', path: '#' },
  { label: 'API', path: '#' },
  { label: 'Documentation', path: '#' },
]

const companyLinks = [
  { label: 'About Us', path: '#' },
  { label: 'Contact', path: '#' },
  { label: 'Privacy', path: '#' },
  { label: 'Terms', path: '#' },
]

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer__inner">
        <div className="footer__brand">
          <Link to="/dashboard" className="footer__logo">
            <div className="footer__logo-icon">
              <img src={fishEyeLogo} alt="Fisight" />
            </div>
            <span className="footer__logo-text">Fisight</span>
          </Link>
          <p className="footer__desc">
            Solusi AI terpercaya untuk menganalisis kualitas dan kesegaran ikan dengan teknologi terkini.
          </p>
        </div>

        <div className="footer__col">
          <h4 className="footer__col-title">Produk</h4>
          <ul className="footer__col-list">
            {productLinks.map((link) => (
              <li key={link.label}>
                <Link to={link.path}>{link.label}</Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="footer__col">
          <h4 className="footer__col-title">Perusahaan</h4>
          <ul className="footer__col-list">
            {companyLinks.map((link) => (
              <li key={link.label}>
                <Link to={link.path}>{link.label}</Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </footer>
  )
}
