import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const ALL_GENRES = [
  'Action', 'Adventure', 'Animation', 'Comedy', 'Crime', 'Documentary', 
  'Drama', 'Family', 'Fantasy', 'History', 'Horror', 'Music', 
  'Mystery', 'Romance', 'Sci-Fi', 'Thriller', 'War', 'Western'
];

const ALL_LANGUAGES = [
  'Hindi', 'English', 'Tamil', 'Telugu', 'Malayalam', 
  'French', 'Spanish', 'Korean', 'Japanese', 'Other'
];

export default function MoviesPage() {
  const { user, logout } = useAuth();
  const [movies, setMovies] = useState([]);
  const [selectedGenres, setSelectedGenres] = useState([]);
  const [selectedLanguage, setSelectedLanguage] = useState('');
  const [genreCounts, setGenreCounts] = useState([]);
  const [langCounts, setLangCounts] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  const [hoveredGenre, setHoveredGenre] = useState(null);
  const [hoveredLang, setHoveredLang] = useState(null);
  const [isClearHovered, setIsClearHovered] = useState(false);
  const [hoveredCardId, setHoveredCardId] = useState(null);
  const [hoveredBtnId, setHoveredBtnId] = useState(null);

  const navigate = useNavigate();

  const fetchMovies = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      selectedGenres.forEach(genre => params.append('genre', genre));
      if (selectedLanguage) {
        params.append('language', selectedLanguage);
      }
      params.append('page', page.toString());
      params.append('limit', '20');

      const response = await axios.get(`/api/movies?${params.toString()}`);
      setMovies(response.data.movies || []);
      setTotal(response.data.total || 0);
      setTotalPages(response.data.totalPages || 1);
      setGenreCounts(response.data.genreCounts || []);
      setLangCounts(response.data.langCounts || []);
    } catch (err) {
      console.error('Error fetching movies:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedGenres, selectedLanguage, page]);

  // Debounced API fetch: triggers 300ms after last dependency change
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchMovies();
    }, 300);

    return () => clearTimeout(timer);
  }, [selectedGenres, selectedLanguage, page, fetchMovies]);

  const toggleGenre = (genre) => {
    setSelectedGenres(prev => {
      const next = prev.includes(genre)
        ? prev.filter(g => g !== genre)
        : [...prev, genre];
      return next;
    });
    setPage(1); // Reset page to 1 on filter change
  };

  const handleLanguageChange = (lang) => {
    setSelectedLanguage(lang);
    setPage(1); // Reset page to 1 on filter change
  };

  const handleClearFilters = () => {
    setSelectedGenres([]);
    setSelectedLanguage('');
    setPage(1);
  };

  // Extract count for a genre
  const getGenreCount = (genre) => {
    const matched = genreCounts.find(c => c._id === genre);
    return matched ? matched.count : 0;
  };

  // Extract count for a language
  const getLanguageCount = (lang) => {
    const matched = langCounts.find(c => c._id === lang);
    return matched ? matched.count : 0;
  };

  const styles = {
    container: {
      display: 'flex',
      minHeight: '100vh',
      background: 'radial-gradient(circle at top left, #1e1b4b, #0f172a 75%)',
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      color: '#f8fafc',
    },
    sidebar: {
      width: '220px',
      background: 'rgba(15, 23, 42, 0.45)',
      backdropFilter: 'blur(24px)',
      WebkitBackdropFilter: 'blur(24px)',
      borderRight: '1px solid rgba(255, 255, 255, 0.08)',
      padding: '30px 20px',
      display: 'flex',
      flexDirection: 'column',
      gap: '28px',
      boxSizing: 'border-box',
      position: 'sticky',
      top: 0,
      height: '100vh',
      overflowY: 'auto',
    },
    sidebarSection: {
      display: 'flex',
      flexDirection: 'column',
      gap: '12px',
    },
    heading: {
      fontSize: '0.85rem',
      fontWeight: '700',
      textTransform: 'uppercase',
      letterSpacing: '0.1em',
      color: '#38bdf8',
      margin: '0 0 4px 0',
      borderBottom: '1px solid rgba(56, 189, 248, 0.2)',
      paddingBottom: '8px',
    },
    filterList: {
      display: 'flex',
      flexDirection: 'column',
      gap: '8px',
      maxHeight: '200px',
      overflowY: 'auto',
      paddingRight: '6px',
    },
    filterLabel: (isHovered) => ({
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      fontSize: '0.85rem',
      color: isHovered ? '#60a5fa' : '#cbd5e1',
      cursor: 'pointer',
      userSelect: 'none',
      transition: 'color 0.2s ease',
    }),
    checkbox: {
      cursor: 'pointer',
      accentColor: '#38bdf8',
    },
    radio: {
      cursor: 'pointer',
      accentColor: '#38bdf8',
    },
    clearBtn: {
      background: isClearHovered ? 'rgba(239, 68, 68, 0.25)' : 'rgba(239, 68, 68, 0.12)',
      border: '1px solid rgba(239, 68, 68, 0.35)',
      color: '#fca5a5',
      borderRadius: '10px',
      padding: '12px',
      fontSize: '0.85rem',
      fontWeight: '600',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      marginTop: 'auto',
      textAlign: 'center',
      boxShadow: isClearHovered ? '0 0 12px rgba(239, 68, 68, 0.2)' : 'none',
    },
    mainContent: {
      flex: 1,
      padding: '40px',
      display: 'flex',
      flexDirection: 'column',
      gap: '24px',
      boxSizing: 'border-box',
      height: '100vh',
      overflowY: 'auto',
    },
    headerRow: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
      paddingBottom: '16px',
    },
    mainTitle: {
      fontSize: '1.8rem',
      fontWeight: '800',
      margin: 0,
      background: 'linear-gradient(to right, #ffffff, #94a3b8)',
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
    },
    totalCount: {
      fontSize: '0.95rem',
      fontWeight: '500',
      color: '#94a3b8',
    },
    loaderText: {
      fontSize: '1.2rem',
      color: '#38bdf8',
      textAlign: 'center',
      margin: '60px 0',
      fontWeight: '600',
      animation: 'pulse 1.5s infinite',
    },
    grid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(3, 1fr)',
      gap: '30px',
    },
    card: (isHovered) => ({
      background: 'rgba(30, 41, 59, 0.45)',
      backdropFilter: 'blur(10px)',
      WebkitBackdropFilter: 'blur(10px)',
      border: isHovered ? '1px solid rgba(56, 189, 248, 0.3)' : '1px solid rgba(255, 255, 255, 0.06)',
      borderRadius: '16px',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      transform: isHovered ? 'translateY(-6px)' : 'translateY(0)',
      boxShadow: isHovered 
        ? '0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 0 15px rgba(56, 189, 248, 0.15)' 
        : '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
    }),
    posterImage: {
      width: '100%',
      height: '200px',
      objectFit: 'cover',
    },
    placeholderPoster: {
      width: '100%',
      height: '200px',
      background: 'linear-gradient(135deg, #1e293b, #0f172a)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      padding: '20px',
      boxSizing: 'border-box',
      textAlign: 'center',
      fontSize: '1rem',
      fontWeight: '700',
      color: '#64748b',
      borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
    },
    cardBody: {
      padding: '16px',
      display: 'flex',
      flexDirection: 'column',
      flex: 1,
      gap: '12px',
    },
    movieTitle: {
      fontSize: '14px',
      fontWeight: 'bold',
      color: '#ffffff',
      margin: 0,
      lineHeight: '1.4',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      display: '-webkit-box',
      WebkitLineClamp: 2,
      WebkitBoxOrient: 'vertical',
      minHeight: '40px',
    },
    metaRow: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      fontSize: '0.85rem',
      color: '#94a3b8',
    },
    rating: {
      background: 'rgba(234, 179, 8, 0.15)',
      color: '#facc15',
      padding: '2px 8px',
      borderRadius: '6px',
      fontWeight: '700',
    },
    badgeContainer: {
      display: 'flex',
      flexWrap: 'wrap',
      gap: '6px',
    },
    genreBadge: {
      fontSize: '0.7rem',
      fontWeight: '600',
      padding: '3px 8px',
      borderRadius: '20px',
      background: 'rgba(99, 102, 241, 0.12)',
      color: '#c7d2fe',
      border: '1px solid rgba(99, 102, 241, 0.2)',
    },
    viewBtn: (isBtnHovered) => ({
      background: isBtnHovered
        ? 'linear-gradient(to right, #4f46e5, #0284c7)'
        : 'linear-gradient(to right, #6366f1, #0ea5e9)',
      border: 'none',
      borderRadius: '10px',
      padding: '10px 14px',
      color: '#ffffff',
      fontWeight: '600',
      fontSize: '0.85rem',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      textAlign: 'center',
      textDecoration: 'none',
      marginTop: 'auto',
      boxShadow: isBtnHovered ? '0 4px 12px rgba(99, 102, 241, 0.3)' : 'none',
    }),
    pagination: {
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      gap: '24px',
      marginTop: '40px',
      paddingBottom: '20px',
    },
    pageBtn: (disabled) => ({
      background: disabled ? 'rgba(30, 41, 59, 0.3)' : 'rgba(30, 41, 59, 0.8)',
      border: '1px solid rgba(255, 255, 255, 0.08)',
      borderRadius: '10px',
      padding: '10px 20px',
      color: disabled ? '#64748b' : '#ffffff',
      fontWeight: '600',
      fontSize: '0.9rem',
      cursor: disabled ? 'not-allowed' : 'pointer',
      transition: 'all 0.2s ease',
    }),
    pageInfo: {
      fontSize: '0.9rem',
      fontWeight: '500',
      color: '#94a3b8',
    }
  };

  return (
    <div style={styles.container}>
      {/* Sidebar Filters */}
      <aside style={styles.sidebar}>
        {/* User Account Section */}
        <div style={styles.sidebarSection}>
          <h3 style={styles.heading}>Account</h3>
          {user ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <span style={{ fontSize: '0.9rem', color: '#ffffff', fontWeight: '600' }}>
                👤 {user.name}
              </span>
              {user.role === 'admin' && (
                <button
                  onClick={() => navigate('/admin')}
                  style={{
                    background: 'linear-gradient(to right, #ef4444, #b91c1c)',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '8px 12px',
                    color: '#ffffff',
                    fontWeight: '600',
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                >
                  Admin Panel
                </button>
              )}
              <button
                onClick={() => {
                  logout();
                  window.location.reload();
                }}
                style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '8px',
                  padding: '8px 12px',
                  color: '#cbd5e1',
                  fontWeight: '600',
                  fontSize: '0.8rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
              >
                Logout
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <button
                onClick={() => navigate('/login')}
                style={{
                  background: 'linear-gradient(to right, #6366f1, #0ea5e9)',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '8px 12px',
                  color: '#ffffff',
                  fontWeight: '600',
                  fontSize: '0.8rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
              >
                Login
              </button>
              <button
                onClick={() => navigate('/register')}
                style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '8px',
                  padding: '8px 12px',
                  color: '#cbd5e1',
                  fontWeight: '600',
                  fontSize: '0.8rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
              >
                Register
              </button>
            </div>
          )}
        </div>

        <div style={styles.sidebarSection}>
          <h3 style={styles.heading}>Genres</h3>
          <div style={styles.filterList}>
            {ALL_GENRES.map(genre => {
              const count = getGenreCount(genre);
              const isChecked = selectedGenres.includes(genre);
              const isHovered = hoveredGenre === genre;
              return (
                <label
                  key={genre}
                  style={styles.filterLabel(isHovered)}
                  onMouseEnter={() => setHoveredGenre(genre)}
                  onMouseLeave={() => setHoveredGenre(null)}
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => toggleGenre(genre)}
                    style={styles.checkbox}
                  />
                  <span>
                    {genre} ({count})
                  </span>
                </label>
              );
            })}
          </div>
        </div>

        <div style={styles.sidebarSection}>
          <h3 style={styles.heading}>Language</h3>
          <div style={styles.filterList}>
            {ALL_LANGUAGES.map(lang => {
              const count = getLanguageCount(lang);
              const isChecked = selectedLanguage === lang;
              const isHovered = hoveredLang === lang;
              return (
                <label
                  key={lang}
                  style={styles.filterLabel(isHovered)}
                  onMouseEnter={() => setHoveredLang(lang)}
                  onMouseLeave={() => setHoveredLang(null)}
                >
                  <input
                    type="radio"
                    name="language"
                    checked={isChecked}
                    onChange={() => handleLanguageChange(lang)}
                    style={styles.radio}
                  />
                  <span>
                    {lang} ({count})
                  </span>
                </label>
              );
            })}
          </div>
        </div>

        <button
          onClick={handleClearFilters}
          style={styles.clearBtn}
          onMouseEnter={() => setIsClearHovered(true)}
          onMouseLeave={() => setIsClearHovered(false)}
        >
          Clear Filters
        </button>
      </aside>

      {/* Main Content Area */}
      <main style={styles.mainContent}>
        <div style={styles.headerRow}>
          <h1 style={styles.mainTitle}>Explore Movies</h1>
          <span style={styles.totalCount}>Total: {total} movies</span>
        </div>

        {loading ? (
          <div style={styles.loaderText}>Loading movies...</div>
        ) : (
          <>
            <div style={styles.grid}>
              {movies.map(movie => {
                const isCardHovered = hoveredCardId === movie._id;
                const isBtnHovered = hoveredBtnId === movie._id;
                return (
                  <div
                    key={movie._id}
                    style={styles.card(isCardHovered)}
                    onMouseEnter={() => setHoveredCardId(movie._id)}
                    onMouseLeave={() => setHoveredCardId(null)}
                  >
                    {movie.poster ? (
                      <img
                        src={movie.poster}
                        alt={movie.title}
                        style={styles.posterImage}
                      />
                    ) : (
                      <div style={styles.placeholderPoster}>
                        {movie.title}
                      </div>
                    )}

                    <div style={styles.cardBody}>
                      <h4 style={styles.movieTitle}>{movie.title}</h4>
                      
                      <div style={styles.metaRow}>
                        <span>{movie.language}</span>
                        <span style={styles.rating}>★ {movie.rating?.toFixed(1) || '0.0'}</span>
                      </div>

                      <div style={styles.badgeContainer}>
                        {movie.genre?.slice(0, 3).map(g => (
                          <span key={g} style={styles.genreBadge}>{g}</span>
                        ))}
                      </div>

                      <button
                        onClick={() => navigate(`/movies/${movie._id}`)}
                        style={styles.viewBtn(isBtnHovered)}
                        onMouseEnter={() => setHoveredBtnId(movie._id)}
                        onMouseLeave={() => setHoveredBtnId(null)}
                      >
                        View Details
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div style={styles.pagination}>
                <button
                  disabled={page === 1}
                  onClick={() => setPage(p => Math.max(p - 1, 1))}
                  style={styles.pageBtn(page === 1)}
                >
                  Prev
                </button>
                <span style={styles.pageInfo}>
                  Page {page} of {totalPages}
                </span>
                <button
                  disabled={page === totalPages}
                  onClick={() => setPage(p => Math.min(p + 1, totalPages))}
                  style={styles.pageBtn(page === totalPages)}
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
