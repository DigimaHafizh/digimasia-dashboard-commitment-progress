import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  withCredentials: true,
})

// Attach stored user token on every request
api.interceptors.request.use((config) => {
  const user = JSON.parse(localStorage.getItem('auth_user') || 'null')
  if (user?.token) config.headers.Authorization = `Bearer ${user.token}`
  return config
})

export default api
