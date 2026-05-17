import React, { useEffect, useState } from 'react'
import { LogOut } from 'lucide-react'
import Navbar from '../components/layout/Navbar'
import Footer from '../components/layout/Footer'
import './ProfilePage.css'

export default function ProfilePage() {
  const [formData, setFormData] = useState({
    nama: 'Arip Seluncur',
    email: 'aripseluncur@example.com',
    noTelfon: ''
  })

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleSave = () => {
    // Implement save logic here
    console.log('Saved data:', formData)
    alert('Profil berhasil disimpan!')
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
              <div className="profile-avatar">
                {/* Fallback dummy image since we don't have the exact asset */}
                <img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?fit=crop&w=150&h=150" alt="Profile" />
              </div>
              <div className="profile-info">
                <h3 className="profile-name">Arip Seluncur</h3>
                <a href="mailto:aripseluncur@example.com" className="profile-email-link">aripseluncur@example.com</a>
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
                <label htmlFor="noTelfon">Nomer Telfon</label>
                <input 
                  type="tel" 
                  id="noTelfon" 
                  name="noTelfon" 
                  value={formData.noTelfon}
                  onChange={handleChange}
                />
              </div>

              <button className="btn-simpan" onClick={handleSave}>Simpan</button>
            </div>

            <hr className="profile-divider" />

            <div className="profile-actions">
              <button className="btn-logout">
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
