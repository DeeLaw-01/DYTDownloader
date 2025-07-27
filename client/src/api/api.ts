import axios from 'axios'
import useUserStore from '@/store/userStore'

const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api'

const api = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json'
  }
})

// Add a request interceptor for authentication
api.interceptors.request.use(
  config => {
    // Don't add auth token for login and registration endpoints
    const isAuthEndpoint =
      config.url?.includes('/login') ||
      config.url?.includes('/register') ||
      config.url?.includes('/otp')

    // Only add the Authorization header if:
    // 1. We have a token, AND
    // 2. The endpoint is not an auth endpoint
    const token = useUserStore.getState().token
    if (token && !isAuthEndpoint) {
      config.headers.Authorization = `Bearer ${token}`
    }

    return config
  },
  error => Promise.reject(error)
)

// Response interceptor for error handling
api.interceptors.response.use(
  response => response,
  error => {
    // Only handle 401 errors for routes that should be authenticated
    // We don't want to log users out when they're trying to log in
    if (
      error.response &&
      error.response.status === 401 &&
      !error.config.url.includes('/login') &&
      !error.config.url.includes('/register') &&
      !error.config.url.includes('/otp')
    ) {
      // Clear auth state on unauthorized
      const { logout } = useUserStore.getState()
      logout()
    }
    return Promise.reject(error)
  }
)

export default api
