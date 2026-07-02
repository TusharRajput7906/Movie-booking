import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Navbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)

  const handleLogout = () => {
    logout()
    navigate('/login')
    setMenuOpen(false)
  }

  return (
    <nav style={{
      background: '#0f172a',
      borderBottom: '1px solid #1e293b',
      padding: '0 16px',
      position: 'sticky',
      top: 0,
      zIndex: 1000
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: '56px'
      }}>
        <Link to="/" style={{
          color: '#e50914',
          fontWeight: '800',
          fontSize: '18px',
          textDecoration: 'none'
        }}>
          🎬 MovieBooking
        </Link>

        {/* Desktop menu */}
        <div style={{
          display: 'flex',
          gap: '16px',
          alignItems: 'center'
        }} className="desktop-menu">
          <Link to="/" style={{ color: '#94a3b8', textDecoration: 'none', fontSize: '14px' }}>
            Movies
          </Link>
          {user?.role === 'admin' && (
            <Link to="/admin" style={{ color: '#94a3b8', textDecoration: 'none', fontSize: '14px' }}>
              Admin
            </Link>
          )}
          {user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ color: '#64748b', fontSize: '13px' }}>
                Hi, {user.name}
              </span>
              <button onClick={handleLogout} style={{
                background: '#e50914',
                color: '#fff',
                border: 'none',
                padding: '6px 14px',
                borderRadius: '6px',
                fontSize: '13px',
                cursor: 'pointer'
              }}>
                Logout
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: '8px' }}>
              <Link to="/login" style={{
                color: '#94a3b8',
                textDecoration: 'none',
                fontSize: '14px',
                padding: '6px 12px'
              }}>
                Login
              </Link>
              <Link to="/register" style={{
                background: '#6366f1',
                color: '#fff',
                textDecoration: 'none',
                fontSize: '14px',
                padding: '6px 14px',
                borderRadius: '6px'
              }}>
                Register
              </Link>
            </div>
          )}
        </div>

        {/* Mobile hamburger button */}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          style={{
            background: 'none',
            border: 'none',
            color: '#ffffff',
            fontSize: '24px',
            cursor: 'pointer',
            display: 'none',
            padding: '4px'
          }}
          className="hamburger"
        >
          {menuOpen ? '✕' : '☰'}
        </button>
      </div>

      {/* Mobile dropdown menu */}
      {menuOpen && (
        <div style={{
          background: '#1e293b',
          padding: '12px 16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          borderTop: '1px solid #334155'
        }}>
          <Link to="/" onClick={() => setMenuOpen(false)}
            style={{ color: '#94a3b8', textDecoration: 'none', fontSize: '14px' }}>
            🎬 Movies
          </Link>
          {user?.role === 'admin' && (
            <Link to="/admin" onClick={() => setMenuOpen(false)}
              style={{ color: '#94a3b8', textDecoration: 'none', fontSize: '14px' }}>
              ⚙️ Admin Dashboard
            </Link>
          )}
          {user ? (
            <>
              <span style={{ color: '#64748b', fontSize: '13px' }}>
                Logged in as {user.name}
              </span>
              <button onClick={handleLogout} style={{
                background: '#e50914', color: '#fff', border: 'none',
                padding: '10px', borderRadius: '8px', fontSize: '14px', cursor: 'pointer'
              }}>
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" onClick={() => setMenuOpen(false)}
                style={{ color: '#94a3b8', textDecoration: 'none', fontSize: '14px' }}>
                Login
              </Link>
              <Link to="/register" onClick={() => setMenuOpen(false)}
                style={{ color: '#ffffff', textDecoration: 'none', fontSize: '14px',
                  background: '#6366f1', padding: '10px', borderRadius: '8px',
                  textAlign: 'center' }}>
                Register
              </Link>
            </>
          )}
        </div>
      )}
    </nav>
  )
}
