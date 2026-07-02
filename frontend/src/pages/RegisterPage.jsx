import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api'
import { useAuth } from '../context/AuthContext';

export default function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isBtnHovered, setIsBtnHovered] = useState(false);
  const [isLinkHovered, setIsLinkHovered] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const response = await api.post('/api/auth/register', { name, email, password });
      login(response.data.user, response.data.token);
      navigate('/');
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const styles = {
    container: {
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      background: '#0f172a',
      fontFamily: "'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
      color: '#f8fafc',
    },
    card: {
      width: '100%',
      maxWidth: '400px',
      background: '#1e293b',
      borderRadius: '16px',
      padding: '32px 24px',
      boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
      display: 'flex',
      flexDirection: 'column',
    },
    title: {
      fontSize: '2.25rem',
      fontWeight: '800',
      textAlign: 'center',
      margin: '0 0 8px 0',
      background: 'linear-gradient(to right, #38bdf8, #818cf8)',
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
      letterSpacing: '-0.025em',
    },
    subtitle: {
      textAlign: 'center',
      color: '#94a3b8',
      fontSize: '0.9rem',
      margin: '0 0 32px 0',
    },
    form: {
      display: 'flex',
      flexDirection: 'column',
      gap: '20px',
    },
    inputGroup: {
      display: 'flex',
      flexDirection: 'column',
      gap: '8px',
    },
    label: {
      fontSize: '0.875rem',
      fontWeight: '500',
      color: '#cbd5e1',
      textAlign: 'left',
    },
    input: {
      width: '100%',
      padding: '12px',
      borderRadius: '8px',
      border: '1px solid #334155',
      background: '#0f172a',
      color: '#ffffff',
      fontSize: '14px',
      boxSizing: 'border-box',
      outline: 'none',
      transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
    },
    button: {
      background: isBtnHovered
        ? 'linear-gradient(to right, #4f46e5, #0284c7)'
        : 'linear-gradient(to right, #6366f1, #0ea5e9)',
      border: 'none',
      borderRadius: '12px',
      padding: '12px',
      color: '#ffffff',
      fontSize: '1rem',
      fontWeight: '600',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      boxShadow: '0 10px 15px -3px rgba(99, 102, 241, 0.3)',
      marginTop: '10px',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      width: '100%',
    },
    errorCard: {
      background: 'rgba(239, 68, 68, 0.15)',
      border: '1px solid rgba(239, 68, 68, 0.3)',
      borderRadius: '12px',
      padding: '12px 16px',
      color: '#fca5a5',
      fontSize: '0.875rem',
      marginBottom: '20px',
      textAlign: 'left',
    },
    linkText: {
      textAlign: 'center',
      marginTop: '24px',
      fontSize: '0.875rem',
      color: '#94a3b8',
    },
    link: {
      color: isLinkHovered ? '#60a5fa' : '#38bdf8',
      textDecoration: 'none',
      fontWeight: '600',
      transition: 'color 0.2s ease',
      marginLeft: '5px',
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2 style={styles.title}>Register</h2>
        <p style={styles.subtitle}>Create an account to start booking movies</p>

        {error && <div style={styles.errorCard}>{error}</div>}

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.inputGroup}>
            <label htmlFor="name" style={styles.label}>Full Name</label>
            <input
              id="name"
              type="text"
              placeholder="John Doe"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              style={styles.input}
              onFocus={(e) => {
                e.target.style.borderColor = '#6366f1';
                e.target.style.boxShadow = '0 0 0 3px rgba(99, 102, 241, 0.2)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                e.target.style.boxShadow = 'none';
              }}
            />
          </div>

          <div style={styles.inputGroup}>
            <label htmlFor="email" style={styles.label}>Email Address</label>
            <input
              id="email"
              type="email"
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={styles.input}
              onFocus={(e) => {
                e.target.style.borderColor = '#6366f1';
                e.target.style.boxShadow = '0 0 0 3px rgba(99, 102, 241, 0.2)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                e.target.style.boxShadow = 'none';
              }}
            />
          </div>

          <div style={styles.inputGroup}>
            <label htmlFor="password" style={styles.label}>Password</label>
            <input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={styles.input}
              onFocus={(e) => {
                e.target.style.borderColor = '#6366f1';
                e.target.style.boxShadow = '0 0 0 3px rgba(99, 102, 241, 0.2)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                e.target.style.boxShadow = 'none';
              }}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={styles.button}
            onMouseEnter={() => setIsBtnHovered(true)}
            onMouseLeave={() => setIsBtnHovered(false)}
          >
            {loading ? 'Creating account...' : 'Register'}
          </button>
        </form>

        <p style={styles.linkText}>
          Already have an account?
          <Link
            to="/login"
            style={styles.link}
            onMouseEnter={() => setIsLinkHovered(true)}
            onMouseLeave={() => setIsLinkHovered(false)}
          >
            Login
          </Link>
        </p>
      </div>
    </div>
  );
}
