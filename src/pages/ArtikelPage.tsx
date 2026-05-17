import { useState, useEffect } from 'react'
import Navbar from '../components/layout/Navbar'
import Footer from '../components/layout/Footer'
import { LayoutGrid } from 'lucide-react'
import artikel1 from '../assets/artikel_1_nelayan.png'
import artikel2 from '../assets/artikel_2_penangkapan.png'
import artikel3 from '../assets/artikel_3_demo.png'
import './ArtikelPage.css'

const articles = [
  {
    id: 1,
    image: artikel1,
    tags: ['Edukasi', 'Spesies Laut'],
    title: 'Dinyatakan Punah 66 Juta Tahun Silam, Ikan Purba ini Ada di Laut Indonesia - Mongabay',
    date: '02 Mei 2026',
    url: 'https://news.google.com/rss/articles/CBMirAFBVV95cUxPM3NsM09rVjlZSUJQa3RnVTNwTGhOMG5OcGdLVGQwSVRra0s4WkptMGJ0QXpzM1lRUnFva09xZF85S1V1WDdQWFJ2UUFQek5pZGViVWsyTVZETEtBU3NtY05WUGxQRGZXY3Z2WHlyS2FIZ3pkdzAzS1FBRE4xTFJaOGUzWWtqMzc4LXhNZTZPUDA2Y1UyQlgyUjRVaUxjWG1EX0VPMnhFR1F4ZV9I?oc=5'
  },
  {
    id: 2,
    image: artikel2,
    tags: ['Konservasi', 'Lingkungan'],
    title: 'Aturan Konservasi Kuat, Kunci Ketahanan Pangan Laut - Betahita',
    date: '24 Mar 2026',
    url: 'https://news.google.com/rss/articles/CBMiqgFBVV95cUxOY3Qtdk9rcUZHZmZsSUtRNF95UHZPZ3hha3lrdFJBNVhnOXdDTEtRczFwMHpsd1I1MkdaMkN1M2MwR1NYd2g4aWFITEhydm1Hcms5emRUR0RmTV9aRUhJZm1Rc0RZVUJfUnhzdGVERGg4Y0FxXzZUZDhtcThWd0hhb0tNRXFqMWkyVWs1VGxBVEpUcHp3dFU3N1NBcGZWeUx1b2RsSFdISkxydw?oc=5'
  },
  {
    id: 3,
    image: artikel3,
    tags: ['Kebijakan', 'Pemerintah'],
    title: 'KKP Berhasil Tambah 1,09 Juta Ha Lahan Konservasi Laut di 2025 - Kementerian KP',
    date: '31 Des 2025',
    url: 'https://news.google.com/rss/articles/CBMiqgFBVV95cUxNcU1CaE5kUThDWHd4ZUwwVjJVXzJ1aWktZmpOdW8tOWt6V00waGxxVi12eHA3cTVaZE9pLXNYUEZ1Tjh5cHhsTXV4UHgwcFNMTDZubXBzVEFrY1JWc01sQi16bEt0bmdJVEV0UmNVOVBWQzZzMmVRcDROeUJ5V1g2VElPaDRwY0Eyd1RYU1VaRzQ3WTc3RWFVQ0tESENnSS1jcUkyMUF0MlItQQ?oc=5'
  },
  {
    id: 4,
    image: artikel2,
    tags: ['Peluang Usaha', 'Ekonomi'],
    title: 'Penghasil Ikan Terbesar di Indonesia yang Jarang Diketahui - RRI',
    date: '05 Apr 2026',
    url: 'https://news.google.com/rss/articles/CBMiYkFVX3lxTFB1T0p2N0N6ZzNCcFFybnlneTRUem5kWkxyM1QwS3QyMFVCWXFScG9MNFU2TGpOeWh2WW90OGhCd3ZlTzhyY1lXMTV1VmdNNFh0UEl4NEZGeHNyMWZHNWwwSDJ3?oc=5'
  },
  {
    id: 5,
    image: artikel3,
    tags: ['Tren & analisis pasar', 'Industri'],
    title: 'Menelusuri Potensi dan Tantangan Perikanan Laut Indonesia - Kumparan',
    date: '03 Feb 2026',
    url: 'https://news.google.com/rss/articles/CBMirAFBVV95cUxOem9Mb0JoRUttaXZ6NnRTd0x3RFFKVXhINzVzMmdvTldSS3RQX3I5SW11ZWxULWdsQVZYbF90ZnAtdnh2bFNTdUo3UWZKQWp6bGFrcU1YSlJyWl9KR2Fpd1BEb0RORnpnX0lWYXo3bW9WTXNZSzhWM1dTX1JMQUMzazJMUFZfOGRJbUhaVUhfY1dhWndrMnJfblNobGpocmVpcVRHZlBmZ0RtWWNi0gG0AUFVX3lxTFByVUk1VENlZVJ5MGdadnd4NGRPTXRZbWY4Z19uR1F3OV9uR0JmaUpOV0Y1X0EtMkhDaWZ2eU01S1A5VEoyRWNkVllGVnB1b1pPRzJOV2tuc0pReVJYNTZjZG4yclo2TUxPWHRlTzZiUzl0MTVnOWRsZlYwX2ZjSW95d28xVXNmb0UyeWhJSzAzTk9hcEZ4eFo3dHhBZjJQTXNENnY2M2doUnpEZHFEVGJOaVVKdw?oc=5'
  },
  {
    id: 6,
    image: artikel1,
    tags: ['Teknologi', 'Hilirisasi'],
    title: 'PT BIBU Beli Tiga Pesawat N-219 dari PT DI untuk Hilirisasi Perikanan Indonesia Timur',
    date: '10 Des 2025',
    url: 'https://news.google.com/rss/articles/CBMi3gFBVV95cUxNMkFFSks1QXpsVWdrYWhBUVVkUGJWR1h5aDNjYmlkSXNnd0hkcjUyclEwTXVBdVczZkV6aVFrSnROYjE2WVhlTG1zNmJyQ29nT1MyeXlsdXVtblRHUUU0eFpUY2pLcll4VTk0REt1clBnMzJISnM3ZjZDU0R0RlB4MnFRX3VZT3BYeGtvUkZnNk12dWs1VHlsbWJXU3l6cHFMVHVXaTJzUW9iWDJ6VllEbU1FeDhWbHJOcTk2WDhXaGlVRG5paFJXRmxENWtOYU9ubm1hZlBlODVHMmdCdlHSAd4BQVVfeXFMTTJBRUpLNUF6bFVna2FoQVFVZFBiVkdYeWgzY2JpZElzZ3dIZHI1MnJRME11QXVXM2ZFemlRa0p0TmIxNllYZUxtczZickNvZ09TMnl5bHV1bW5UR1FFNHhaVGNqS3JZeFU5NERLdXJQZzMySEpzN2Y2Q1NEdEZQeDJxUV91WU9wWHhrb1JGZzZNdnVrNVR5bG1iV1N5enBxTFR1V2kyc1FvYlgyelZZRG1NRXg4VmxyTnE5Nlg4V2hpVURuaWhSV0ZsRDVrTmFPbm5tYWZQZTg1RzJnQnZR?oc=5'
  },
  {
    id: 7,
    image: artikel2,
    tags: ['Hukum', 'Illegal Fishing'],
    title: 'Wajah Kelam Perikanan: Laut Indonesia Rutin Dirampok, ABK Diperbudak Kapal Asing',
    date: '17 Okt 2025',
    url: 'https://news.google.com/rss/articles/CBMikAFBVV95cUxPeUgxc0wyMnlKYkhnT3FfNExmXzdBVUd4ekl4aDRhdTIwcnVxVE9xaW15ZXZBb2ZQQVBmVWxDM3AxV2MyR09rTGh3QTRTMVNKa0JXY1pfQ3d1VzExeGNhWUtfMjJSdXl1TDVEWXJvM0FISjlxelFKNWRWZ0U4RV9lYklJdzdNbXBYMjRCbl9uc1U?oc=5'
  },
  {
    id: 8,
    image: artikel3,
    tags: ['Infrastruktur', 'Lingkungan'],
    title: 'Lalu Lintas Kapal Perikanan Berisiko Rusak Kabel Bawah Laut - Mongabay',
    date: '28 Nov 2025',
    url: 'https://news.google.com/rss/articles/CBMikgFBVV95cUxObmNXeUJHc2pKbzkxczNsck5sUmlQX1lRLVhCZVA5OXpGWTVkMXlDRmtUNGczUW1heUtMcWJrYTNHVzZwNlZ5SWpWTFFhYkItdXJWdldiVFZQd0VfRmJ3bFJEOTZTQy1USDF6VUVnZ0JYZ2l6bjd5UWpGYTVyald3V2h5RnAycWFwMThvb1BFX05Mdw?oc=5'
  },
  {
    id: 9,
    image: artikel1,
    tags: ['Peluang Usaha', 'Potensi Alam'],
    title: 'Indonesia Kaya Potensi Kelautan dan Perikanan - Indonesia Baik',
    date: '14 Okt 2025',
    url: 'https://news.google.com/rss/articles/CBMiiAFBVV95cUxPa0JrN0p1NTRkbzVueXRDRVlDUGx6VUxUYXJwZDJRMkFPcDd6ak1pTXFaS2Y0YjJ3OWlHem12WU1ybnVaTUY2c2VpSklZNklmelVreGxhSmhZcW9JQ0hRM3VPRFRCcTlRVWtac1kxbEVpNUxBR2tweDJKc1lXamRmMUdNR3FlZ2Z4?oc=5'
  }
]

export default function ArtikelPage() {
  const [showAll, setShowAll] = useState(false)

  // Scroll to top on load
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  const visibleArticles = showAll ? articles : articles.slice(0, 3)

  return (
    <div className="artikel-page">
      <Navbar />

      <div className="artikel-dark" data-nav-theme="dark">
        <section className="artikel-header">
          <div className="artikel-badge">
            <LayoutGrid size={14} className="artikel-badge-icon" />
            <span>ARTIKEL</span>
          </div>
          <h1 className="artikel-title">Belajar Dari Pengalaman Nyata</h1>
          <p className="artikel-subtitle">
            Temukan solusi praktis yang lahir dari situasi dunia nyata
          </p>
        </section>
      </div>

      <main className="artikel-main" data-nav-theme="light">
        {/* Articles Grid */}
        <section className="artikel-content">
          <div className="artikel-grid">
            {visibleArticles.map((article) => (
              <div 
                key={article.id} 
                className="artikel-card"
                onClick={() => window.open(article.url, '_blank')}
                style={{ cursor: 'pointer' }}
              >
                <div className="artikel-card-image">
                  <img src={article.image} alt={article.title} />
                </div>
                <div className="artikel-card-body">
                  <div className="artikel-tags">
                    <span className="artikel-tag artikel-tag--primary">{article.tags[0]}</span>
                    <span className="artikel-tag artikel-tag--secondary">{article.tags[1]}</span>
                  </div>
                  <h3 className="artikel-card-title">{article.title}</h3>
                  <div className="artikel-card-footer">
                    <span className="artikel-date">{article.date}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {!showAll && (
            <div className="artikel-action">
              <button className="btn-lihat-semua" onClick={() => setShowAll(true)}>
                Lihat Semua
              </button>
            </div>
          )}
        </section>
      </main>

      <Footer />
    </div>
  )
}
