import axios from 'axios'

const api = axios.create({
  baseURL: 'https://movie-booking-backend-zzpg.onrender.com'
})

export default api