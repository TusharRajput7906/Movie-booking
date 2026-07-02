import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api'
import { useAuth } from '../context/AuthContext';

export default function BookingPage() {
  const { showId } = useParams();
  const navigate = useNavigate();
  const { user, token } = useAuth();

  // Read saved reservation from localStorage on first load
  const getSavedReservation = () => {
    try {
      const saved = localStorage.getItem(`reserved_${showId}`)
      if (!saved) return null
      const parsed = JSON.parse(saved)
      const remaining = Math.floor((new Date(parsed.lockedUntil) - Date.now()) / 1000)
      if (remaining <= 0) {
        localStorage.removeItem(`reserved_${showId}`)
        return null
      }
      return { ...parsed, remaining }
    } catch {
      return null
    }
  }

  const savedReservation = getSavedReservation()

  const [seats, setSeats] = useState([])
  const [selectedSeats, setSelectedSeats] = useState([])
  const [reservedSeats, setReservedSeats] = useState(
    savedReservation ? savedReservation.seatIds : []
  )
  const [timeLeft, setTimeLeft] = useState(
    savedReservation ? savedReservation.remaining : 120
  )
  const [timerActive, setTimerActive] = useState(
    savedReservation ? true : false
  )
  const [show, setShow] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [paymentLoading, setPaymentLoading] = useState(false)
  const [isReserveHovered, setIsReserveHovered] = useState(false)
  const [isPayHovered, setIsPayHovered] = useState(false)

  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isMobile = windowWidth < 768;

  // Fetch show details
  useEffect(() => {
    const fetchShowDetails = async () => {
      try {
        const response = await api.get(`/api/shows/${showId}`)
        setShow(response.data)
      } catch (err) {
        console.error('Error fetching show details:', err)
        setError('Failed to load show details.')
      }
    }
    fetchShowDetails()
  }, [showId])

  // Fetch seats
  const fetchSeats = useCallback(async () => {
    try {
      const response = await api.get(`/api/shows/${showId}/seats`)
      setSeats(response.data || [])
      setLoading(false)
    } catch (err) {
      console.error('Error fetching seats:', err)
      setError('Failed to load seats layout.')
      setLoading(false)
    }
  }, [showId])

  // Seat polling every 15 seconds
  useEffect(() => {
    fetchSeats()
    const interval = setInterval(fetchSeats, 15000)
    return () => clearInterval(interval)
  }, [fetchSeats])

  // Handle seat click
  const handleSeatClick = (seat) => {
    if (seat.status === 'booked') return
    if (reservedSeats.length > 0) return // seats already reserved, don't allow changes
    const isLockedByMe = seat.lockedBy === user?.id || seat.lockedBy === user?._id
    if (seat.status === 'locked' && !isLockedByMe) return

    setSelectedSeats(prev => {
      if (prev.includes(seat._id)) {
        return prev.filter(id => id !== seat._id)
      } else {
        return [...prev, seat._id]
      }
    })
  }

  // Reserve seats and save to localStorage
  const handleReserveSeats = async () => {
    try {
      setError(null)
      const headers = { Authorization: `Bearer ${token}` }
      const lockedUntil = new Date(Date.now() + 2 * 60 * 1000)

      const promises = selectedSeats.map(seatId =>
        api.post('/api/seats/reserve', { seatId }, { headers })
      )
      await Promise.all(promises)

      // Save to localStorage so payment button survives page exit
      localStorage.setItem(`reserved_${showId}`, JSON.stringify({
        seatIds: selectedSeats,
        lockedUntil: lockedUntil.toISOString()
      }))

      setReservedSeats(selectedSeats)
      setTimerActive(true)
      setTimeLeft(120)

    } catch (err) {
      console.error('Reservation failed:', err)
      const errMsg = err.response?.data?.error || 'Some seats are no longer available. Please refresh.'
      alert(errMsg)
      fetchSeats()
    }
  }

  // Timer countdown
  useEffect(() => {
    if (!timerActive) return

    const intervalId = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(intervalId)
          setTimerActive(false)
          setSelectedSeats([])
          setReservedSeats([])
          // Clear localStorage when timer expires
          localStorage.removeItem(`reserved_${showId}`)
          alert('Time expired! Your seats have been released. Please select again.')
          fetchSeats()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(intervalId)
  }, [timerActive, showId, fetchSeats])

  // Payment handler
  const handlePayment = async () => {
    setPaymentLoading(true)
    try {
      const headers = { Authorization: `Bearer ${token}` }
      const response = await api.post('/api/payment/create-order', {
        seatIds: reservedSeats,
        showId,
        amount: show.price * reservedSeats.length
      }, { headers })

      const { orderId, key, amount } = response.data

      const options = {
        key,
        amount: amount * 100,
        currency: 'INR',
        order_id: orderId,
        name: 'MovieBooking',
        description: 'Ticket Booking',
        handler: async function (response) {
          try {
            await api.post('/api/payment/verify', response, { headers })
            // Clear localStorage after successful payment
            localStorage.removeItem(`reserved_${showId}`)
            navigate('/booking-success')
          } catch (verifyErr) {
            console.error(verifyErr)
            alert('Payment verification failed')
          }
        },
        prefill: {
          name: user?.name,
          email: user?.email
        },
        theme: { color: '#e50914' },
        modal: {
          ondismiss: function() {
            setPaymentLoading(false)
          }
        }
      }

      const rzp = new window.Razorpay(options)
      rzp.open()

    } catch (err) {
      console.error(err)
      alert(err.response?.data?.error || 'Failed to create payment order. Please try again.')
    } finally {
      setPaymentLoading(false)
    }
  }

  // Seat color
  const getSeatColor = (seat) => {
    if (seat.status === 'booked') return '#e74c3c'
    if (seat.status === 'locked' && !reservedSeats.includes(seat._id)) return '#f39c12'
    if (selectedSeats.includes(seat._id) || reservedSeats.includes(seat._id)) return '#2ecc71'
    return '#95a5a6'
  }

  const formatShowTime = (timeString) => {
    try {
      const dateObj = new Date(timeString)
      return dateObj.toLocaleDateString(undefined, {
        weekday: 'short', month: 'short', day: 'numeric'
      }) + ' at ' + dateObj.toLocaleTimeString(undefined, {
        hour: '2-digit', minute: '2-digit'
      })
    } catch {
      return timeString
    }
  }

  const styles = {
    container: {
      minHeight: '100vh',
      background: 'radial-gradient(circle at top left, #1e1b4b, #0f172a 75%)',
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      color: '#f8fafc',
      padding: isMobile ? '12px 12px 80px 12px' : '40px 20px',
      boxSizing: 'border-box',
    },
    wrapper: {
      maxWidth: isMobile ? '100%' : '680px',
      margin: '0 auto',
      background: 'rgba(30, 41, 59, 0.45)',
      backdropFilter: 'blur(24px)',
      WebkitBackdropFilter: 'blur(24px)',
      border: '1px solid rgba(255, 255, 255, 0.06)',
      borderRadius: isMobile ? '16px' : '24px',
      padding: isMobile ? '16px' : '32px',
      boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.4)',
      display: 'flex',
      flexDirection: 'column',
      gap: '24px',
    },
    title: {
      fontSize: '1.6rem',
      fontWeight: '800',
      margin: 0,
      textAlign: 'center',
      background: 'linear-gradient(to right, #38bdf8, #818cf8)',
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
    },
    showInfo: {
      background: 'rgba(15, 23, 42, 0.35)',
      border: '1px solid rgba(255, 255, 255, 0.04)',
      borderRadius: '16px',
      padding: '16px 20px',
      display: 'flex',
      flexDirection: 'column',
      gap: '6px',
      fontSize: isMobile ? '13px' : '14px',
      color: '#cbd5e1',
    },
    screenBar: {
      height: '8px',
      background: '#475569',
      borderRadius: '8px',
      width: '80%',
      margin: '20px auto 30px auto',
      position: 'relative',
      boxShadow: '0 4px 12px rgba(71, 85, 105, 0.3)',
    },
    screenText: {
      position: 'absolute',
      top: '14px',
      left: '50%',
      transform: 'translateX(-50%)',
      fontSize: '0.75rem',
      fontWeight: '700',
      color: '#64748b',
      letterSpacing: '0.2em',
    },
    grid: {
      display: 'flex',
      flexWrap: 'wrap',
      gap: isMobile ? '5px' : '8px',
      justifyContent: 'center',
      margin: '20px 0',
      maxWidth: '440px',
      alignSelf: 'center',
    },
    seat: (color) => ({
      width: isMobile ? '30px' : '36px',
      height: isMobile ? '30px' : '36px',
      borderRadius: '6px',
      backgroundColor: color,
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      fontSize: isMobile ? '9px' : '10px',
      fontWeight: 'bold',
      color: '#ffffff',
      cursor: 'pointer',
      userSelect: 'none',
      transition: 'transform 0.1s, box-shadow 0.1s',
    }),
    legend: {
      display: 'flex',
      justifyContent: 'center',
      gap: '16px',
      flexWrap: 'wrap',
      fontSize: '0.8rem',
      color: '#94a3b8',
      borderTop: '1px solid rgba(255, 255, 255, 0.05)',
      paddingTop: '16px',
    },
    legendItem: {
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
    },
    legendColor: (color) => ({
      width: '12px',
      height: '12px',
      borderRadius: '3px',
      backgroundColor: color,
    }),
    timerContainer: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '4px',
      background: 'rgba(239, 68, 68, 0.08)',
      border: '1px solid rgba(239, 68, 68, 0.2)',
      borderRadius: '12px',
      padding: '12px',
      margin: '10px 0',
    },
    timerText: (isRed) => ({
      fontSize: '1.6rem',
      fontWeight: '800',
      color: isRed ? '#ef4444' : '#e2e8f0',
      margin: 0,
      fontFamily: 'monospace',
    }),
    timerSubtext: {
      fontSize: '0.8rem',
      color: '#94a3b8',
    },
    bottomBar: {
      borderTop: '1px solid rgba(255, 255, 255, 0.05)',
      paddingTop: '20px',
      display: 'flex',
      flexDirection: isMobile ? 'column' : 'row',
      gap: isMobile ? '12px' : '0',
      justifyContent: 'space-between',
      alignItems: isMobile ? 'stretch' : 'center',
    },
    selectedLabel: {
      fontSize: '0.95rem',
      fontWeight: '600',
      color: '#cbd5e1',
    },
    totalLabel: {
      fontSize: '1.1rem',
      fontWeight: '700',
      color: '#38bdf8',
    },
    actionBtn: (isHovered) => ({
      background: isHovered
        ? 'linear-gradient(to right, #4f46e5, #0284c7)'
        : 'linear-gradient(to right, #6366f1, #0ea5e9)',
      border: 'none',
      borderRadius: '10px',
      padding: isMobile ? '14px' : '12px 24px',
      color: '#ffffff',
      fontWeight: '600',
      fontSize: '0.9rem',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      boxShadow: isHovered ? '0 4px 12px rgba(99, 102, 241, 0.35)' : 'none',
      width: isMobile ? '100%' : 'auto',
    })
  }

  if (loading || !show) {
    return (
      <div style={{ ...styles.container, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <div style={{ fontSize: '1.2rem', color: '#38bdf8', fontWeight: '600' }}>Loading seats layout...</div>
      </div>
    )
  }

  return (
    <div style={styles.container}>
      <div style={styles.wrapper}>
        <h2 style={styles.title}>Select Your Seats</h2>

        {/* Show Information */}
        <div style={styles.showInfo}>
          <div style={{ fontWeight: '700', color: '#ffffff', fontSize: '1.05rem' }}>
            {show.movieId?.title}
          </div>
          <div>📍 {show.theaterId?.name} ({show.theaterId?.city})</div>
          <div>🕒 {formatShowTime(show.showTime)}</div>
          <div>💰 Rs. {show.price} per seat</div>
        </div>

        {/* Saved reservation notice */}
        {savedReservation && (
          <div style={{
            background: 'rgba(34, 197, 94, 0.1)',
            border: '1px solid rgba(34, 197, 94, 0.3)',
            borderRadius: '12px',
            padding: '12px 16px',
            fontSize: '0.85rem',
            color: '#86efac',
            textAlign: 'center'
          }}>
            ✅ You have reserved seats. Complete your payment before time runs out!
          </div>
        )}

        {/* Screen Indicator */}
        <div style={styles.screenBar}>
          <span style={styles.screenText}>SCREEN</span>
        </div>

        {/* Seat Grid */}
        <div style={styles.grid}>
          {seats.map(seat => {
            const color = getSeatColor(seat)
            return (
              <div
                key={seat._id}
                onClick={() => handleSeatClick(seat)}
                style={styles.seat(color)}
                onMouseEnter={(e) => {
                  if (color !== '#e74c3c' && color !== '#f39c12') {
                    e.currentTarget.style.transform = 'scale(1.1)'
                    e.currentTarget.style.boxShadow = '0 0 8px rgba(255,255,255,0.2)'
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'scale(1)'
                  e.currentTarget.style.boxShadow = 'none'
                }}
              >
                {seat.seatNumber}
              </div>
            )
          })}
        </div>

        {/* Legend */}
        <div style={styles.legend}>
          <div style={styles.legendItem}>
            <div style={styles.legendColor('#95a5a6')}></div>
            <span>Available</span>
          </div>
          <div style={styles.legendItem}>
            <div style={styles.legendColor('#2ecc71')}></div>
            <span>Selected</span>
          </div>
          <div style={styles.legendItem}>
            <div style={styles.legendColor('#f39c12')}></div>
            <span>Locked by others</span>
          </div>
          <div style={styles.legendItem}>
            <div style={styles.legendColor('#e74c3c')}></div>
            <span>Booked</span>
          </div>
        </div>

        {/* Countdown Timer */}
        {reservedSeats.length > 0 && (
          <div style={styles.timerContainer}>
            <p style={styles.timerText(timeLeft < 30)}>
              {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, '0')}
            </p>
            <span style={styles.timerSubtext}>Complete payment before time runs out!</span>
          </div>
        )}

        {/* Bottom Bar */}
        <div style={styles.bottomBar}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <span style={styles.selectedLabel}>
              Selected: {reservedSeats.length > 0 ? reservedSeats.length : selectedSeats.length} seats
            </span>
            {reservedSeats.length > 0 && (
              <span style={styles.totalLabel}>
                Total: Rs. {show.price * reservedSeats.length}
              </span>
            )}
          </div>

          <div>
            {selectedSeats.length > 0 && reservedSeats.length === 0 && (
              <button
                onClick={handleReserveSeats}
                style={styles.actionBtn(isReserveHovered)}
                onMouseEnter={() => setIsReserveHovered(true)}
                onMouseLeave={() => setIsReserveHovered(false)}
              >
                Reserve Seats
              </button>
            )}

            {reservedSeats.length > 0 && (
              <button
                onClick={handlePayment}
                disabled={paymentLoading}
                style={styles.actionBtn(isPayHovered)}
                onMouseEnter={() => setIsPayHovered(true)}
                onMouseLeave={() => setIsPayHovered(false)}
              >
                {paymentLoading ? 'Processing...' : 'Proceed to Payment'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}