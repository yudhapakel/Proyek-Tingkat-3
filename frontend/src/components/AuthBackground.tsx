import type { CSSProperties } from 'react'
import './AuthBackground.css'

const bubbles = [
  { size: 5, left: 12, duration: 10 },
  { size: 8, left: 22, duration: 13 },
  { size: 4, left: 34, duration: 9 },
  { size: 10, left: 46, duration: 14 },
  { size: 6, left: 58, duration: 11 },
  { size: 7, left: 70, duration: 12 },
  { size: 3, left: 82, duration: 8 },
  { size: 9, left: 88, duration: 15 },
  { size: 5, left: 18, duration: 12 },
  { size: 6, left: 76, duration: 10 },
]

export default function AuthBackground() {
  return (
    <div className="auth-bg">
      <div className="auth-bg__gradient" />
      <div className="auth-bg__sea-floor" />

      {/* SVG Seaweed Groups */}
      <svg className="auth-bg__seaweed-svg auth-bg__seaweed-svg--left" viewBox="0 0 120 500" preserveAspectRatio="none">
        <path className="seaweed-strand seaweed-strand--1" d="M50 500 Q42 420 62 360 Q82 300 55 240 Q28 180 55 120 Q75 60 48 10" />
        <path className="seaweed-leaf seaweed-leaf--r" d="M62 360 Q100 335 115 305 Q95 330 62 348" />
        <path className="seaweed-leaf seaweed-leaf--l" d="M55 240 Q15 215 5 180 Q20 210 55 230" />
        <path className="seaweed-leaf seaweed-leaf--r" d="M55 155 Q90 130 105 100 Q85 125 55 145" />
      </svg>

      <svg className="auth-bg__seaweed-svg auth-bg__seaweed-svg--left-2" viewBox="0 0 120 400" preserveAspectRatio="none">
        <path className="seaweed-strand seaweed-strand--2" d="M55 400 Q48 340 68 280 Q88 220 60 165 Q35 115 58 50" />
        <path className="seaweed-leaf seaweed-leaf--r" d="M68 280 Q108 255 118 225 Q102 250 68 270" />
        <path className="seaweed-leaf seaweed-leaf--l" d="M60 165 Q22 140 10 108 Q25 135 60 155" />
      </svg>

      <svg className="auth-bg__seaweed-svg auth-bg__seaweed-svg--left-3" viewBox="0 0 120 350" preserveAspectRatio="none">
        <path className="seaweed-strand seaweed-strand--3" d="M60 350 Q52 285 70 225 Q88 165 62 115 Q40 70 60 15" />
        <path className="seaweed-leaf seaweed-leaf--r" d="M70 225 Q108 200 118 170 Q102 195 70 215" />
        <path className="seaweed-leaf seaweed-leaf--l" d="M62 130 Q25 108 15 78 Q28 102 62 120" />
      </svg>

      <svg className="auth-bg__seaweed-svg auth-bg__seaweed-svg--right" viewBox="0 0 120 500" preserveAspectRatio="none">
        <path className="seaweed-strand seaweed-strand--4" d="M70 500 Q78 420 58 350 Q38 280 65 220 Q92 160 68 90 Q50 35 72 5" />
        <path className="seaweed-leaf seaweed-leaf--l" d="M58 350 Q18 325 5 290 Q22 318 58 338" />
        <path className="seaweed-leaf seaweed-leaf--r" d="M65 220 Q105 195 115 160 Q100 190 65 210" />
        <path className="seaweed-leaf seaweed-leaf--l" d="M68 120 Q30 95 18 62 Q32 90 68 110" />
      </svg>

      <svg className="auth-bg__seaweed-svg auth-bg__seaweed-svg--right-2" viewBox="0 0 120 420" preserveAspectRatio="none">
        <path className="seaweed-strand seaweed-strand--5" d="M60 420 Q52 360 72 295 Q92 235 62 175 Q35 125 60 50" />
        <path className="seaweed-leaf seaweed-leaf--r" d="M72 295 Q112 268 118 235 Q106 262 72 285" />
        <path className="seaweed-leaf seaweed-leaf--l" d="M62 175 Q22 150 12 115 Q25 145 62 165" />
      </svg>

      <svg className="auth-bg__seaweed-svg auth-bg__seaweed-svg--right-3" viewBox="0 0 120 380" preserveAspectRatio="none">
        <path className="seaweed-strand seaweed-strand--6" d="M65 380 Q58 310 75 248 Q92 188 65 135 Q42 88 65 22" />
        <path className="seaweed-leaf seaweed-leaf--r" d="M75 248 Q112 222 118 190 Q106 218 75 238" />
        <path className="seaweed-leaf seaweed-leaf--l" d="M65 145 Q28 120 18 88 Q30 115 65 135" />
      </svg>

      {/* Small accent strands */}
      <svg className="auth-bg__seaweed-svg auth-bg__seaweed-svg--accent-1" viewBox="0 0 80 220" preserveAspectRatio="none">
        <path className="seaweed-strand seaweed-strand--sm" d="M40 220 Q32 165 48 115 Q62 65 38 10" />
        <path className="seaweed-leaf seaweed-leaf--r" d="M48 115 Q72 98 78 75 Q68 92 48 108" />
      </svg>
      <svg className="auth-bg__seaweed-svg auth-bg__seaweed-svg--accent-2" viewBox="0 0 80 200" preserveAspectRatio="none">
        <path className="seaweed-strand seaweed-strand--sm" d="M40 200 Q48 145 32 95 Q18 52 40 8" />
        <path className="seaweed-leaf seaweed-leaf--l" d="M32 95 Q8 78 2 52 Q12 72 32 88" />
      </svg>

      {/* Bubbles */}
      {bubbles.map((bubble, i) => (
        <div key={`${bubble.left}-${i}`} className="auth-bg__bubble" style={{
          '--delay': `${i * 1.1}s`,
          '--size': `${bubble.size}px`,
          '--left': `${bubble.left}%`,
          '--duration': `${bubble.duration}s`,
        } as CSSProperties} />
      ))}
    </div>
  )
}
