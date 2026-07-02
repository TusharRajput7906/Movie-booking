import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api'
import { useAuth } from '../context/AuthContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { user, token, logout } = useAuth();

  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalBookings: 0,
    failedPayments: 0,
    seatsBooked: 0
  });
  const [revenue, setRevenue] = useState([]);
  const [topMovies, setTopMovies] = useState([]);
  const [period, setPeriod] = useState('daily');
  const [loading, setLoading] = useState(true);

  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isMobile = windowWidth < 768;

  const [movies, setMovies] = useState([])
  const [theaters, setTheaters] = useState([])
  const [shows, setShows] = useState([])
  const [activeTab, setActiveTab] = useState('dashboard')
  const [showForm, setShowForm] = useState({
    movieId: '',
    theaterId: '',
    showTime: '',
    price: ''
  })
  const [theaterForm, setTheaterForm] = useState({
    name: '',
    address: '',
    city: '',
    totalSeats: ''
  })
  const [formMessage, setFormMessage] = useState('')
  const [formError, setFormError] = useState('')

  // Security check: must be admin
  useEffect(() => {
    if (!user || user.role !== 'admin') {
      navigate('/login');
    }
  }, [user, navigate]);

  const authHeader = () => {
    return {
      headers: {
        Authorization: `Bearer ${token}`
      }
    };
  };

  const fetchData = async () => {
    if (!user || user.role !== 'admin') return;
    try {
      setLoading(true);
      const config = authHeader();
      const [statsRes, revenueRes, topMoviesRes] = await Promise.all([
        api.get('/api/admin/stats', config),
        api.get(`/api/admin/revenue?period=${period}`, config),
        api.get('/api/admin/top-movies', config)
      ]);

      setStats(statsRes.data || {
        totalRevenue: 0,
        totalBookings: 0,
        failedPayments: 0,
        seatsBooked: 0
      });
      setRevenue(revenueRes.data || []);
      setTopMovies(topMoviesRes.data || []);
    } catch (err) {
      console.error('Error fetching admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMovies = async () => {
    const { data } = await api.get('/api/movies?limit=100')
    setMovies(data.movies || [])
  }

  const fetchTheaters = async () => {
    const { data } = await api.get('/api/theaters')
    setTheaters(data || [])
  }

  const fetchShows = async () => {
    const { data } = await api.get('/api/shows', authHeader())
    setShows(data || [])
  }

  useEffect(() => {
    if (activeTab === 'shows') {
      fetchMovies()
      fetchTheaters()
      fetchShows()
    } else if (activeTab === 'theaters') {
      fetchTheaters()
    }
  }, [activeTab])

  useEffect(() => {
    fetchData();
  }, [period]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleCreateShow = async (e) => {
    e.preventDefault()
    setFormMessage('')
    setFormError('')
    try {
      await api.post('/api/shows', showForm, authHeader())
      setFormMessage('Show created successfully!')
      setShowForm({ movieId: '', theaterId: '', showTime: '', price: '' })
      fetchShows()
    } catch (err) {
      setFormError(err.response?.data?.error || 'Failed to create show')
    }
  }

  const handleCreateTheater = async (e) => {
    e.preventDefault()
    setFormMessage('')
    setFormError('')
    try {
      await api.post('/api/theaters', theaterForm, authHeader())
      setFormMessage('Theater created successfully!')
      setTheaterForm({ name: '', address: '', city: '', totalSeats: '' })
      fetchTheaters()
    } catch (err) {
      setFormError(err.response?.data?.error || 'Failed to create theater')
    }
  }

  const handleDeleteShow = async (showId) => {
    if (!window.confirm('Delete this show?')) return
    try {
      await api.delete(`/api/shows/${showId}`, authHeader())
      setFormMessage('Show deleted!')
      fetchShows()
    } catch (err) {
      setFormError(err.response?.data?.error || 'Failed to delete show')
    }
  }

  const styles = {
    container: {
      display: 'flex',
      flexDirection: isMobile ? 'column' : 'row',
      minHeight: '100vh',
      backgroundColor: '#0f172a',
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
      color: '#f8fafc',
    },
    sidebar: {
      width: isMobile ? '100%' : '200px',
      backgroundColor: '#1a1a1a',
      color: '#ffffff',
      display: 'flex',
      flexDirection: isMobile ? 'row' : 'column',
      padding: isMobile ? '12px' : '24px 16px',
      boxSizing: 'border-box',
      gap: isMobile ? '6px' : '30px',
      flexWrap: isMobile ? 'wrap' : 'nowrap',
      flexShrink: 0,
      position: isMobile ? 'static' : 'sticky',
      top: 0,
      height: isMobile ? 'auto' : '100vh',
    },
    appName: {
      fontSize: '1.2rem',
      fontWeight: '800',
      color: '#ffffff',
      borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
      paddingBottom: '16px',
      margin: 0,
      letterSpacing: '0.02em',
    },
    navLinks: {
      display: 'flex',
      flexDirection: 'column',
      gap: '12px',
      flex: 1,
    },
    navLinkActive: {
      background: 'linear-gradient(to right, #ef4444, #b91c1c)',
      borderRadius: '8px',
      padding: '10px 16px',
      fontWeight: '600',
      color: '#ffffff',
      border: 'none',
      textAlign: 'left',
      cursor: 'pointer',
      fontSize: '0.9rem',
    },
    logoutBtn: {
      background: 'transparent',
      border: '1px solid rgba(255, 255, 255, 0.2)',
      borderRadius: '8px',
      padding: isMobile ? '6px 10px' : '10px 16px',
      fontWeight: '600',
      color: '#cbd5e1',
      cursor: 'pointer',
      textAlign: 'left',
      fontSize: isMobile ? '12px' : '0.9rem',
      transition: 'all 0.2s ease',
      marginTop: isMobile ? '0' : 'auto',
    },
    mainContent: {
      flex: 1,
      padding: '24px',
      boxSizing: 'border-box',
      overflowY: 'auto',
    },
    pageHeading: {
      fontSize: '1.8rem',
      fontWeight: '800',
      margin: '0 0 24px 0',
      background: 'linear-gradient(to right, #ffffff, #94a3b8)',
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
    },
    grid: {
      display: 'grid',
      gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4, 1fr)',
      gap: isMobile ? '10px' : '16px',
      marginBottom: '24px',
    },
    card: {
      background: 'rgba(30, 41, 59, 0.45)',
      backdropFilter: 'blur(10px)',
      border: '1px solid rgba(255, 255, 255, 0.06)',
      borderRadius: '16px',
      padding: isMobile ? '12px' : '20px',
      display: 'flex',
      flexDirection: 'column',
      gap: '6px',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
    },
    cardLabel: {
      fontSize: '0.75rem',
      color: '#94a3b8',
      fontWeight: '700',
      textTransform: 'uppercase',
      letterSpacing: '0.05em',
    },
    cardValue: {
      fontSize: isMobile ? '20px' : '28px',
      fontWeight: '800',
      color: '#ffffff',
      margin: 0,
    },
    cardValueRevenue: {
      fontSize: isMobile ? '20px' : '28px',
      fontWeight: '800',
      background: 'linear-gradient(to right, #34d399, #059669)',
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
      margin: 0,
    },
    section: {
      background: 'rgba(30, 41, 59, 0.3)',
      border: '1px solid rgba(255, 255, 255, 0.04)',
      borderRadius: '20px',
      padding: '24px',
      marginBottom: '32px',
    },
    sectionHeading: {
      fontSize: '1.3rem',
      fontWeight: '700',
      margin: '0 0 16px 0',
      color: '#ffffff',
    },
    btnGroup: {
      display: 'flex',
      gap: '10px',
      marginBottom: '20px',
    },
    chartBtnActive: {
      background: '#e50914',
      border: 'none',
      borderRadius: '8px',
      padding: '8px 16px',
      color: '#ffffff',
      fontWeight: '600',
      cursor: 'pointer',
      fontSize: '0.85rem',
      boxShadow: '0 4px 10px rgba(229, 9, 20, 0.25)',
    },
    chartBtnInactive: {
      background: 'rgba(255, 255, 255, 0.05)',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      borderRadius: '8px',
      padding: '8px 16px',
      color: '#cbd5e1',
      fontWeight: '600',
      cursor: 'pointer',
      fontSize: '0.85rem',
      transition: 'all 0.2s ease',
    },
    emptyMessage: {
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '150px',
      fontSize: '1rem',
      color: '#64748b',
      fontWeight: '500',
    },
    tableContainer: {
      background: 'rgba(15, 23, 42, 0.25)',
      border: '1px solid rgba(255, 255, 255, 0.04)',
      borderRadius: '12px',
      overflow: 'hidden',
    },
    table: {
      width: '100%',
      borderCollapse: 'collapse',
    },
    th: {
      padding: '12px 16px',
      textAlign: 'left',
      borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
      color: '#94a3b8',
      fontSize: '0.8rem',
      fontWeight: '700',
      textTransform: 'uppercase',
      letterSpacing: '0.05em',
    },
    td: {
      padding: '16px',
      borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
      color: '#cbd5e1',
      fontSize: '0.9rem',
    },
    tdBold: {
      padding: '16px',
      borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
      color: '#ffffff',
      fontSize: '0.9rem',
      fontWeight: '600',
    },
    loaderContainer: {
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100vh',
      backgroundColor: '#0f172a',
      color: '#38bdf8',
      fontSize: '1.2rem',
      fontWeight: '600',
    }
  };

  if (loading && !stats.totalBookings && !revenue.length) {
    return (
      <div style={styles.loaderContainer}>
        Loading admin dashboard...
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Sidebar */}
      <aside style={styles.sidebar}>
        <h2 style={styles.appName}>MovieBooking Admin</h2>
        <div style={{ display: 'flex', flexDirection: isMobile ? 'row' : 'column', gap: isMobile ? '6px' : '4px', flexWrap: isMobile ? 'wrap' : 'nowrap', marginTop: isMobile ? '0' : '24px' }}>
          {[
            { key: 'dashboard', label: 'Dashboard' },
            { key: 'shows', label: 'Manage Shows' },
            { key: 'theaters', label: 'Add Theater' }
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => {
                setActiveTab(tab.key);
                setFormMessage('');
                setFormError('');
              }}
              style={{
                background: activeTab === tab.key ? '#e50914' : 'transparent',
                border: 'none',
                color: '#ffffff',
                padding: isMobile ? '6px 10px' : '10px 16px',
                borderRadius: '8px',
                cursor: 'pointer',
                textAlign: 'left',
                fontSize: isMobile ? '12px' : '14px',
                fontWeight: activeTab === tab.key ? '600' : '400'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <button 
          onClick={handleLogout} 
          style={styles.logoutBtn}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = 'rgba(255,255,255,0.4)';
            e.currentTarget.style.color = '#ffffff';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)';
            e.currentTarget.style.color = '#cbd5e1';
          }}
        >
          Logout
        </button>
      </aside>

      {/* Main Content */}
      <main style={styles.mainContent}>
        <h1 style={styles.pageHeading}>Admin Dashboard</h1>

        {activeTab === 'dashboard' && (
          <>
            {/* Stats Grid */}
            <div style={styles.grid}>
              <div style={styles.card}>
                <span style={styles.cardLabel}>Total Revenue</span>
                <h3 style={styles.cardValueRevenue}>Rs. {stats.totalRevenue}</h3>
              </div>
              <div style={styles.card}>
                <span style={styles.cardLabel}>Total Bookings</span>
                <h3 style={styles.cardValue}>{stats.totalBookings}</h3>
              </div>
              <div style={styles.card}>
                <span style={styles.cardLabel}>Failed Payments</span>
                <h3 style={styles.cardValue}>{stats.failedPayments}</h3>
              </div>
              <div style={styles.card}>
                <span style={styles.cardLabel}>Seats Booked</span>
                <h3 style={styles.cardValue}>{stats.seatsBooked}</h3>
              </div>
            </div>

            {/* Revenue Chart Section */}
            <div style={styles.section}>
              <h2 style={styles.sectionHeading}>Revenue Overview</h2>
              <div style={styles.btnGroup}>
                {['daily', 'weekly', 'monthly'].map((p) => (
                  <button
                    key={p}
                    onClick={() => setPeriod(p)}
                    style={period === p ? styles.chartBtnActive : styles.chartBtnInactive}
                  >
                    {p.charAt(0).toUpperCase() + p.slice(1)}
                  </button>
                ))}
              </div>

              {revenue.length === 0 ? (
                <div style={styles.emptyMessage}>No revenue data yet</div>
              ) : (
                <div style={{ width: '100%', height: isMobile ? 200 : 300 }}>
                  <ResponsiveContainer width="100%" height={isMobile ? 200 : 300}>
                    <BarChart data={revenue} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.05)" />
                      <XAxis dataKey="_id" stroke="#94a3b8" fontSize={11} tickLine={false} />
                      <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#1e293b', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '8px' }}
                        labelStyle={{ color: '#ffffff', fontWeight: 'bold' }}
                        itemStyle={{ color: '#34d399' }}
                      />
                      <Bar dataKey="totalRevenue" fill="#e50914" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            {/* Top Movies Section */}
            <div style={styles.section}>
              <h2 style={styles.sectionHeading}>Top Movies by Bookings</h2>
              {topMovies.length === 0 ? (
                <div style={styles.emptyMessage}>No booking data yet</div>
              ) : (
                <div style={styles.tableContainer}>
                  <div style={{ overflowX: 'auto' }}>
                    <table style={styles.table}>
                      <thead>
                        <tr>
                          <th style={styles.th}>Rank</th>
                          <th style={styles.th}>Movie Title</th>
                          <th style={styles.th}>Bookings</th>
                        </tr>
                      </thead>
                      <tbody>
                        {topMovies.map((movie, index) => (
                          <tr key={movie._id || index}>
                            <td style={styles.tdBold}>#{index + 1}</td>
                            <td style={styles.td}>{movie.movieTitle}</td>
                            <td style={styles.td}>{movie.bookings}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </>
        )}

        {activeTab === 'shows' && (
          <div>
            <h2 style={{ color: '#ffffff', marginBottom: '20px' }}>Manage Shows</h2>

            {formMessage && (
              <div style={{ background: '#166534', color: '#86efac', padding: '10px 16px',
                borderRadius: '8px', marginBottom: '16px' }}>
                {formMessage}
              </div>
            )}
            {formError && (
              <div style={{ background: '#7f1d1d', color: '#fca5a5', padding: '10px 16px',
                borderRadius: '8px', marginBottom: '16px' }}>
                {formError}
              </div>
            )}

            {/* Create Show Form */}
            <div style={{ background: '#1e293b', borderRadius: '12px',
              padding: '24px', marginBottom: '24px' }}>
              <h3 style={{ color: '#ffffff', marginTop: 0, marginBottom: '16px' }}>
                Create New Show
              </h3>
              <form onSubmit={handleCreateShow}>
                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
                  gap: '12px', marginBottom: '12px' }}>
                  
                  <div>
                    <label style={{ color: '#94a3b8', fontSize: '13px',
                      display: 'block', marginBottom: '6px' }}>
                      Select Movie
                    </label>
                    <select
                      value={showForm.movieId}
                      onChange={e => setShowForm({ ...showForm, movieId: e.target.value })}
                      required
                      style={{ width: '100%', padding: '10px', borderRadius: '8px',
                        background: '#0f172a', color: '#ffffff',
                        border: '1px solid #334155', fontSize: '14px' }}
                    >
                      <option value=''>-- Choose Movie --</option>
                      {movies.map(m => (
                        <option key={m._id} value={m._id}>{m.title}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label style={{ color: '#94a3b8', fontSize: '13px',
                      display: 'block', marginBottom: '6px' }}>
                      Select Theater
                    </label>
                    <select
                      value={showForm.theaterId}
                      onChange={e => setShowForm({ ...showForm, theaterId: e.target.value })}
                      required
                      style={{ width: '100%', padding: '10px', borderRadius: '8px',
                        background: '#0f172a', color: '#ffffff',
                        border: '1px solid #334155', fontSize: '14px' }}
                    >
                      <option value=''>-- Choose Theater --</option>
                      {theaters.map(t => (
                        <option key={t._id} value={t._id}>
                          {t.name} - {t.city} ({t.totalSeats} seats)
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label style={{ color: '#94a3b8', fontSize: '13px',
                      display: 'block', marginBottom: '6px' }}>
                      Show Date and Time
                    </label>
                    <input
                      type='datetime-local'
                      value={showForm.showTime}
                      onChange={e => setShowForm({ ...showForm, showTime: e.target.value })}
                      required
                      style={{ width: '100%', padding: '10px', borderRadius: '8px',
                        background: '#0f172a', color: '#ffffff',
                        border: '1px solid #334155', fontSize: '14px',
                        boxSizing: 'border-box' }}
                    />
                  </div>

                  <div>
                    <label style={{ color: '#94a3b8', fontSize: '13px',
                      display: 'block', marginBottom: '6px' }}>
                      Ticket Price (Rs.)
                    </label>
                    <input
                      type='number'
                      value={showForm.price}
                      onChange={e => setShowForm({ ...showForm, price: e.target.value })}
                      placeholder='250'
                      required
                      min='1'
                      style={{ width: '100%', padding: '10px', borderRadius: '8px',
                        background: '#0f172a', color: '#ffffff',
                        border: '1px solid #334155', fontSize: '14px',
                        boxSizing: 'border-box' }}
                    />
                  </div>
                </div>

                <button
                  type='submit'
                  style={{ background: '#e50914', color: '#ffffff', border: 'none',
                    padding: '10px 24px', borderRadius: '8px', cursor: 'pointer',
                    fontWeight: '600', fontSize: '14px' }}
                >
                  Create Show
                </button>
              </form>
            </div>

            {/* Existing Shows List */}
            <div style={{ background: '#1e293b', borderRadius: '12px', padding: '24px' }}>
              <h3 style={{ color: '#ffffff', marginTop: 0, marginBottom: '16px' }}>
                All Shows ({shows.length})
              </h3>
              {shows.length === 0 ? (
                <p style={{ color: '#64748b' }}>No shows created yet.</p>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse',
                    fontSize: '13px', color: '#cbd5e1' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid #334155' }}>
                        <th style={{ textAlign: 'left', padding: '8px', color: '#94a3b8' }}>Movie</th>
                        <th style={{ textAlign: 'left', padding: '8px', color: '#94a3b8' }}>Theater</th>
                        <th style={{ textAlign: 'left', padding: '8px', color: '#94a3b8' }}>Date & Time</th>
                        <th style={{ textAlign: 'left', padding: '8px', color: '#94a3b8' }}>Price</th>
                        <th style={{ textAlign: 'left', padding: '8px', color: '#94a3b8' }}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {shows.map(s => (
                        <tr key={s._id} style={{ borderBottom: '1px solid #1e293b' }}>
                          <td style={{ padding: '10px 8px' }}>
                            {s.movieId?.title || 'Unknown'}
                          </td>
                          <td style={{ padding: '10px 8px' }}>
                            {s.theaterId?.name || 'Unknown'} - {s.theaterId?.city || ''}
                          </td>
                          <td style={{ padding: '10px 8px' }}>
                            {new Date(s.showTime).toLocaleString()}
                          </td>
                          <td style={{ padding: '10px 8px' }}>Rs. {s.price}</td>
                          <td style={{ padding: '10px 8px' }}>
                            <button
                              onClick={() => handleDeleteShow(s._id)}
                              style={{ background: '#7f1d1d', color: '#fca5a5',
                                border: 'none', padding: '4px 12px', borderRadius: '6px',
                                cursor: 'pointer', fontSize: '12px' }}
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'theaters' && (
          <div>
            <h2 style={{ color: '#ffffff', marginBottom: '20px' }}>Add New Theater</h2>

            {formMessage && (
              <div style={{ background: '#166534', color: '#86efac', padding: '10px 16px',
                borderRadius: '8px', marginBottom: '16px' }}>
                {formMessage}
              </div>
            )}
            {formError && (
              <div style={{ background: '#7f1d1d', color: '#fca5a5', padding: '10px 16px',
                borderRadius: '8px', marginBottom: '16px' }}>
                {formError}
              </div>
            )}

            <div style={{ background: '#1e293b', borderRadius: '12px', padding: '24px',
              marginBottom: '24px' }}>
              <h3 style={{ color: '#ffffff', marginTop: 0, marginBottom: '16px' }}>
                Theater Details
              </h3>
              <form onSubmit={handleCreateTheater}>
                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
                  gap: '12px', marginBottom: '16px' }}>

                  <div>
                    <label style={{ color: '#94a3b8', fontSize: '13px',
                      display: 'block', marginBottom: '6px' }}>Theater Name</label>
                    <input
                      type='text'
                      value={theaterForm.name}
                      onChange={e => setTheaterForm({ ...theaterForm, name: e.target.value })}
                      placeholder='PVR Cinemas'
                      required
                      style={{ width: '100%', padding: '10px', borderRadius: '8px',
                        background: '#0f172a', color: '#ffffff',
                        border: '1px solid #334155', fontSize: '14px',
                        boxSizing: 'border-box' }}
                    />
                  </div>

                  <div>
                    <label style={{ color: '#94a3b8', fontSize: '13px',
                      display: 'block', marginBottom: '6px' }}>City</label>
                    <input
                      type='text'
                      value={theaterForm.city}
                      onChange={e => setTheaterForm({ ...theaterForm, city: e.target.value })}
                      placeholder='Delhi'
                      required
                      style={{ width: '100%', padding: '10px', borderRadius: '8px',
                        background: '#0f172a', color: '#ffffff',
                        border: '1px solid #334155', fontSize: '14px',
                        boxSizing: 'border-box' }}
                    />
                  </div>

                  <div>
                    <label style={{ color: '#94a3b8', fontSize: '13px',
                      display: 'block', marginBottom: '6px' }}>Address</label>
                    <input
                      type='text'
                      value={theaterForm.address}
                      onChange={e => setTheaterForm({ ...theaterForm, address: e.target.value })}
                      placeholder='123 Main Street'
                      required
                      style={{ width: '100%', padding: '10px', borderRadius: '8px',
                        background: '#0f172a', color: '#ffffff',
                        border: '1px solid #334155', fontSize: '14px',
                        boxSizing: 'border-box' }}
                    />
                  </div>

                  <div>
                    <label style={{ color: '#94a3b8', fontSize: '13px',
                      display: 'block', marginBottom: '6px' }}>Total Seats</label>
                    <input
                      type='number'
                      value={theaterForm.totalSeats}
                      onChange={e => setTheaterForm({ ...theaterForm, totalSeats: e.target.value })}
                      placeholder='50'
                      required
                      min='1'
                      max='500'
                      style={{ width: '100%', padding: '10px', borderRadius: '8px',
                        background: '#0f172a', color: '#ffffff',
                        border: '1px solid #334155', fontSize: '14px',
                        boxSizing: 'border-box' }}
                    />
                  </div>
                </div>

                <button
                  type='submit'
                  style={{ background: '#e50914', color: '#ffffff', border: 'none',
                    padding: '10px 24px', borderRadius: '8px', cursor: 'pointer',
                    fontWeight: '600', fontSize: '14px' }}
                >
                  Add Theater
                </button>
              </form>
            </div>

            {/* Theaters list */}
            <div style={{ background: '#1e293b', borderRadius: '12px', padding: '24px' }}>
              <h3 style={{ color: '#ffffff', marginTop: 0, marginBottom: '16px' }}>
                All Theaters ({theaters.length})
              </h3>
              {theaters.length === 0 ? (
                <p style={{ color: '#64748b' }}>No theaters added yet.</p>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse',
                    fontSize: '13px', color: '#cbd5e1' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid #334155' }}>
                        <th style={{ textAlign: 'left', padding: '8px', color: '#94a3b8' }}>Name</th>
                        <th style={{ textAlign: 'left', padding: '8px', color: '#94a3b8' }}>City</th>
                        <th style={{ textAlign: 'left', padding: '8px', color: '#94a3b8' }}>Address</th>
                        <th style={{ textAlign: 'left', padding: '8px', color: '#94a3b8' }}>Seats</th>
                      </tr>
                    </thead>
                    <tbody>
                      {theaters.map(t => (
                        <tr key={t._id} style={{ borderBottom: '1px solid #1e293b' }}>
                          <td style={{ padding: '10px 8px' }}>{t.name}</td>
                          <td style={{ padding: '10px 8px' }}>{t.city}</td>
                          <td style={{ padding: '10px 8px' }}>{t.address}</td>
                          <td style={{ padding: '10px 8px' }}>{t.totalSeats}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
