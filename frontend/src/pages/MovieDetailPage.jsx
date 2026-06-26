import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../api'
import TrailerPlayer from '../components/TrailerPlayer';
import { useAuth } from '../context/AuthContext';

export default function MovieDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [movie, setMovie] = useState(null);
  const [shows, setShows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [isBackHovered, setIsBackHovered] = useState(false);
  const [hoveredShowId, setHoveredShowId] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const [movieRes, showsRes] = await Promise.all([
          api.get(`/api/movies/${id}`),
          api.get(`/api/shows?movieId=${id}`)
        ]);

        setMovie(movieRes.data);
        setShows(showsRes.data || []);
      } catch (err) {
        console.error('Error fetching movie details:', err);
        setError(err.response?.data?.error || 'Failed to load movie details. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  const formatShowTime = (timeString) => {
    try {
      const dateObj = new Date(timeString);
      const dateStr = dateObj.toLocaleDateString(undefined, {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
      const timeStr = dateObj.toLocaleTimeString(undefined, {
        hour: '2-digit',
        minute: '2-digit',
      });
      return `${dateStr} at ${timeStr}`;
    } catch {
      return timeString;
    }
  };

  const styles = {
    container: {
      minHeight: '100vh',
      background: 'radial-gradient(circle at top left, #1e1b4b, #0f172a 75%)',
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      color: '#f8fafc',
      padding: '40px 20px',
      boxSizing: 'border-box',
    },
    wrapper: {
      maxWidth: '960px',
      margin: '0 auto',
      display: 'flex',
      flexDirection: 'column',
      gap: '32px',
    },
    backLink: {
      display: 'inline-flex',
      alignItems: 'center',
      color: isBackHovered ? '#60a5fa' : '#38bdf8',
      textDecoration: 'none',
      fontSize: '0.95rem',
      fontWeight: '600',
      alignSelf: 'flex-start',
      transition: 'color 0.2s ease, transform 0.2s ease',
      transform: isBackHovered ? 'translateX(-4px)' : 'translateX(0)',
    },
    detailsSection: {
      display: 'flex',
      flexDirection: 'row',
      gap: '32px',
      background: 'rgba(30, 41, 59, 0.45)',
      backdropFilter: 'blur(24px)',
      WebkitBackdropFilter: 'blur(24px)',
      border: '1px solid rgba(255, 255, 255, 0.06)',
      borderRadius: '24px',
      padding: '32px',
      boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.4)',
    },
    leftColumn: {
      flex: 1,
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'flex-start',
    },
    posterImage: {
      width: '100%',
      maxWidth: '280px',
      height: 'auto',
      borderRadius: '16px',
      border: '1px solid rgba(255, 255, 255, 0.08)',
      boxShadow: '0 10px 25px rgba(0, 0, 0, 0.5)',
    },
    placeholderPoster: {
      width: '100%',
      maxWidth: '280px',
      height: '380px',
      background: 'linear-gradient(135deg, #1e293b, #0f172a)',
      borderRadius: '16px',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      border: '1px solid rgba(255, 255, 255, 0.08)',
      textAlign: 'center',
      padding: '20px',
      boxSizing: 'border-box',
      fontSize: '1.2rem',
      fontWeight: 'bold',
      color: '#64748b',
    },
    rightColumn: {
      flex: 2,
      display: 'flex',
      flexDirection: 'column',
      gap: '20px',
    },
    title: {
      fontSize: '28px',
      fontWeight: '800',
      margin: 0,
      background: 'linear-gradient(to right, #ffffff, #cbd5e1)',
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
    },
    badgeRow: {
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      flexWrap: 'wrap',
    },
    badge: {
      fontSize: '0.85rem',
      fontWeight: '700',
      padding: '4px 12px',
      borderRadius: '8px',
      background: 'rgba(255, 255, 255, 0.08)',
      color: '#cbd5e1',
      border: '1px solid rgba(255, 255, 255, 0.1)',
    },
    ratingBadge: {
      fontSize: '0.85rem',
      fontWeight: '700',
      padding: '4px 12px',
      borderRadius: '8px',
      background: 'rgba(234, 179, 8, 0.12)',
      color: '#facc15',
      border: '1px solid rgba(234, 179, 8, 0.25)',
      display: 'flex',
      alignItems: 'center',
      gap: '4px',
    },
    genreBadge: {
      fontSize: '0.75rem',
      fontWeight: '600',
      padding: '4px 10px',
      borderRadius: '20px',
      background: 'rgba(99, 102, 241, 0.12)',
      color: '#c7d2fe',
      border: '1px solid rgba(99, 102, 241, 0.2)',
    },
    description: {
      fontSize: '1rem',
      lineHeight: '1.6',
      color: '#cbd5e1',
      margin: 0,
    },
    showsSection: {
      display: 'flex',
      flexDirection: 'column',
      gap: '20px',
    },
    showsHeading: {
      fontSize: '1.5rem',
      fontWeight: '800',
      margin: 0,
      color: '#ffffff',
      borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
      paddingBottom: '12px',
    },
    noShows: {
      fontSize: '1.05rem',
      color: '#94a3b8',
      background: 'rgba(30, 41, 59, 0.25)',
      border: '1px solid rgba(255, 255, 255, 0.04)',
      padding: '24px',
      borderRadius: '16px',
      textAlign: 'center',
    },
    showsGrid: {
      display: 'flex',
      flexDirection: 'column',
      gap: '16px',
    },
    showCard: {
      background: 'rgba(30, 41, 59, 0.35)',
      border: '1px solid rgba(255, 255, 255, 0.05)',
      borderRadius: '16px',
      padding: '20px 24px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      boxSizing: 'border-box',
      transition: 'border-color 0.2s, background-color 0.2s',
    },
    showDetails: {
      display: 'flex',
      flexDirection: 'column',
      gap: '6px',
    },
    showTimeText: {
      fontSize: '1.1rem',
      fontWeight: '600',
      color: '#ffffff',
    },
    theaterName: {
      fontSize: '0.875rem',
      color: '#94a3b8',
    },
    showPrice: {
      fontSize: '1.15rem',
      fontWeight: '700',
      color: '#38bdf8',
    },
    bookBtn: (disabled, isHovered) => ({
      background: disabled
        ? 'rgba(255, 255, 255, 0.04)'
        : isHovered
        ? 'linear-gradient(to right, #4f46e5, #0284c7)'
        : 'linear-gradient(to right, #6366f1, #0ea5e9)',
      border: disabled ? '1px solid rgba(255, 255, 255, 0.08)' : 'none',
      borderRadius: '10px',
      padding: '12px 24px',
      color: disabled ? '#64748b' : '#ffffff',
      fontWeight: '600',
      fontSize: '0.9rem',
      cursor: disabled ? 'not-allowed' : 'pointer',
      transition: 'all 0.2s ease',
      boxShadow: (!disabled && isHovered) ? '0 4px 12px rgba(99, 102, 241, 0.3)' : 'none',
      textAlign: 'center',
    }),
    centerWrapper: {
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100vh',
      background: 'radial-gradient(circle at top left, #1e1b4b, #0f172a 75%)',
      fontFamily: "'Inter', sans-serif",
      color: '#f8fafc',
    },
    errorCard: {
      background: 'rgba(239, 68, 68, 0.1)',
      border: '1px solid rgba(239, 68, 68, 0.25)',
      borderRadius: '16px',
      padding: '24px 32px',
      color: '#fca5a5',
      textAlign: 'center',
      maxWidth: '400px',
    }
  };

  if (loading) {
    return (
      <div style={styles.centerWrapper}>
        <div style={{ fontSize: '1.25rem', color: '#38bdf8', fontWeight: '600' }}>Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.centerWrapper}>
        <div style={styles.errorCard}>
          <h3 style={{ margin: '0 0 10px 0', fontSize: '1.2rem', fontWeight: '700' }}>Error</h3>
          <p style={{ margin: 0, fontSize: '0.95rem' }}>{error}</p>
          <Link to="/" style={{ display: 'inline-block', marginTop: '16px', color: '#38bdf8', fontWeight: '600', textDecoration: 'none' }}>Go Back</Link>
        </div>
      </div>
    );
  }

  if (!movie) {
    return (
      <div style={styles.centerWrapper}>
        <div style={styles.errorCard}>
          <h3 style={{ margin: '0 0 10px 0', fontSize: '1.2rem', fontWeight: '700' }}>Movie Not Found</h3>
          <p style={{ margin: 0, fontSize: '0.95rem' }}>We couldn't find the requested movie.</p>
          <Link to="/" style={{ display: 'inline-block', marginTop: '16px', color: '#38bdf8', fontWeight: '600', textDecoration: 'none' }}>Go Back</Link>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.wrapper}>
        {/* Back Button */}
        <Link
          to="/"
          style={styles.backLink}
          onMouseEnter={() => setIsBackHovered(true)}
          onMouseLeave={() => setIsBackHovered(false)}
        >
          ← Back to Movies
        </Link>

        {/* Movie Detail Card */}
        <div style={styles.detailsSection}>
          <div style={styles.leftColumn}>
            {movie.poster ? (
              <img src={movie.poster} alt={movie.title} style={styles.posterImage} />
            ) : (
              <div style={styles.placeholderPoster}>
                {movie.title}
              </div>
            )}
          </div>

          <div style={styles.rightColumn}>
            <h1 style={styles.title}>{movie.title}</h1>
            
            <div style={styles.badgeRow}>
              <span style={styles.badge}>{movie.language}</span>
              <span style={styles.ratingBadge}>⭐ {movie.rating?.toFixed(1) || '0.0'}/10</span>
              
              <div style={styles.badgeContainer}>
                {movie.genre?.map(g => (
                  <span key={g} style={styles.genreBadge}>{g}</span>
                ))}
              </div>
            </div>

            <p style={styles.description}>{movie.description}</p>
            
            {/* Trailer Component */}
            <div style={{ marginTop: '10px' }}>
              <TrailerPlayer videoId={movie.videoId} />
            </div>
          </div>
        </div>

        {/* Shows Section */}
        <section style={styles.showsSection}>
          <h2 style={styles.showsHeading}>Available Shows</h2>
          
          {shows.length === 0 ? (
            <div style={styles.noShows}>No shows available currently</div>
          ) : (
            <div style={styles.showsGrid}>
              {shows.map(show => {
                const isHovered = hoveredShowId === show._id;
                const isLoggedIn = !!user;
                return (
                  <div
                    key={show._id}
                    style={{
                      ...styles.showCard,
                      backgroundColor: isHovered ? 'rgba(30, 41, 59, 0.55)' : 'rgba(30, 41, 59, 0.35)',
                      borderColor: isHovered ? 'rgba(56, 189, 248, 0.35)' : 'rgba(255, 255, 255, 0.05)',
                    }}
                    onMouseEnter={() => setHoveredShowId(show._id)}
                    onMouseLeave={() => setHoveredShowId(null)}
                  >
                    <div style={styles.showDetails}>
                      <span style={styles.showTimeText}>
                        {formatShowTime(show.showTime)}
                      </span>
                      <span style={styles.theaterName}>
                        {show.theaterId?.name ? `${show.theaterId.name} (${show.theaterId.city || ''})` : 'Unknown Theater'}
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '30px' }}>
                      <span style={styles.showPrice}>
                        Rs. {show.price || 0}
                      </span>
                      <button
                        onClick={() => isLoggedIn ? navigate(`/book/${show._id}`) : navigate('/login')}
                        style={styles.bookBtn(false, isHovered)}
                      >
                        {isLoggedIn ? 'Book Now' : 'Login to Book'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
