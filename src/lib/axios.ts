import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor
api.interceptors.request.use(
  (config) => {
    // Add auth token if available
    const accessToken = localStorage.getItem('accessToken')
    
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config
    
    // Handle 401 and try to refresh token
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true
      
      const refreshToken = localStorage.getItem('refreshToken')
      if (refreshToken) {
        try {
          const response = await axios.post(
            `${api.defaults.baseURL}/Auth/refresh-token`,
            { refreshToken },
            { headers: { 'Content-Type': 'application/json' } }
          )
          
          if (response.data.data?.accessToken) {
            localStorage.setItem('accessToken', response.data.data.accessToken)
            if (response.data.data.refreshToken) {
              localStorage.setItem('refreshToken', response.data.data.refreshToken)
            }
            
            originalRequest.headers.Authorization = `Bearer ${response.data.data.accessToken}`
            return api(originalRequest)
          }
        } catch (refreshError) {
          // Refresh failed, clear tokens and redirect
          localStorage.removeItem('accessToken')
          localStorage.removeItem('refreshToken')
          localStorage.removeItem('token')
          window.location.href = '/'
          return Promise.reject(refreshError)
        }
      }
      
      // No refresh token, clear and redirect
      localStorage.removeItem('accessToken')
      localStorage.removeItem('refreshToken')
      localStorage.removeItem('token')
      window.location.href = '/'
    }
    return Promise.reject(error)
  }
)

export default api
