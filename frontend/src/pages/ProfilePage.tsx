import { useEffect, useMemo, useState, type ChangeEvent } from 'react'
import { LogOut } from 'lucide-react'
import Navbar from '../components/layout/Navbar'
import Footer from '../components/layout/Footer'
import type { AuthResponse } from '../lib/api'
import './ProfilePage.css'

interface ProfilePageProps {
  auth: AuthResponse
  onLogout: () => void
}

export default function ProfilePage({ auth, onLogout }: ProfilePageProps) {
  const [formData, setFormData] = useState({
    nama: auth.user.name || '',
    email: auth.user.email || '',
    noTelfon: '',
  })
  const [message, setMessage] = useState('')

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  useEffect(() => {
    setFormData((prev) => ({
      ...prev,
      nama: auth.user.name || '',
      email: auth.user.email || '',
    }))
  }, [auth.user.email, auth.user.name])

  const initials = useMemo(() => {
    const source = formData.nama || formData.email || 'U'
    return source
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join('') || 'U'
  }, [formData.email, formData.nama])

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
    setMessage('')
  }

  const handleSave = () => {
    // Backend endpoint for updating profile is not available yet, so keep this as
    // a frontend-only confirmation for now.
    setMessage('Perubahan profil tersimpan sementara di halaman ini. Endpoint update profil belum tersedia.')
  }

  return (
    <div className="profile-page" data-nav-theme="light">
      <Navbar />

      <main className="profile-main">
        <div className="profile-container">
          <h1 className="profile-page-title">Profil Saya</h1>

          <div className="profile-card">
            <h2 className="profile-card-title">Informasi Profil</h2>

            <div className="profile-header">
              <div className="profile-avatar" aria-hidden="true">
                <span>{initials}</span>
              </div>
              <div className="profile-info">
                <h3 className="profile-name">{formData.nama || 'Pengguna Fisight'}</h3>
                <a href={`mailto:${formData.email}`} className="profile-email-link">{formData.email}</a>
              </div>
            </div>

            <hr className="profile-divider" />

            <div className="profile-form">
              <div className="form-group">
                <label htmlFor="nama">Nama Lengkap</label>
                <input
                  type="text"
                  id="nama"
                  name="nama"
                  value={formData.nama}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group">
                <label htmlFor="email">Alamat Email</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group">
                <label htmlFor="noTelfon">Nomor Telepon</label>
                <input
                  type="tel"
                  id="noTelfon"
                  name="noTelfon"
                  value={formData.noTelfon}
                  onChange={handleChange}
                  placeholder="Belum diisi"
                />
              </div>

              {message && <p className="profile-message">{message}</p>}

              <button type="button" className="btn-simpan" onClick={handleSave}>Simpan</button>
            </div>

            <hr className="profile-divider" />

            <div className="profile-actions">
              <button type="button" className="btn-logout" onClick={onLogout}>
                <LogOut size={18} />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
