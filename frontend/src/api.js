import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'https://movie-booking-backend-zzpg.onrender.com'
})

export default api