import { useState } from 'react'
import { GoogleLogin, CredentialResponse } from '@react-oauth/google'
import { jwtDecode } from 'jwt-decode'
import { toast } from 'sonner'
import { useNavigate } from 'react-router-dom'
import api from '@/api/api'
import useUserStore from '@/store/userStore'

interface GoogleUser {
  email: string
  name: string
  picture: string
  sub: string
}

export default function LoginPage () {
  const navigate = useNavigate()
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setIsLoading(true)
      const response = await api.post('/api/auth/login', formData)

      // Check if user needs verification
      if (response.data.needsVerification) {
        // Store email for OTP verification
        localStorage.setItem('verificationEmail', formData.email)
        toast.info('Verification Required', {
          description: 'Please check your email for the OTP'
        })
        navigate('/verify-otp')
        return
      }

      const { token, user } = response.data
      useUserStore.getState().setToken(token)
      useUserStore.getState().setUser(user)

      toast.success('Login Successful', {
        description: 'Welcome back!'
      })
      navigate('/')
    } catch (error: any) {
      toast.error('Login Failed', {
        description: error.response?.data?.message || 'Invalid credentials'
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleSuccess = async (
    credentialResponse: CredentialResponse
  ) => {
    try {
      setIsLoading(true)
      if (!credentialResponse.credential) {
        toast.error('Authentication Failed', {
          description: 'No credentials received from Google'
        })
        return
      }

      const decoded = jwtDecode<GoogleUser>(credentialResponse.credential)
      const response = await api.post('/api/auth/google', {
        name: decoded.name,
        email: decoded.email,
        profilePicture: decoded.picture
      })

      const { token, user } = response.data
      useUserStore.getState().setToken(token)
      useUserStore.getState().setUser(user)

      toast.success('Success', {
        description: 'Successfully logged in with Google'
      })
      navigate('/')
    } catch (error: any) {
      toast.error('Google Login Failed', {
        description:
          error.response?.data?.message ||
          'An error occurred during Google sign-in'
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleFailure = () => {
    toast.error('Google Login Failed', {
      description: 'Unable to login with Google. Please try again.'
    })
  }

  return (
    <div className='min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800'>
      {/* Subtle background pattern matching HomePage */}
      <div className='absolute inset-0 opacity-30'>
        <div className='absolute top-0 left-0 w-72 h-72 bg-blue-200 dark:bg-blue-900 rounded-full mix-blend-multiply filter blur-xl animate-pulse'></div>
        <div className='absolute top-0 right-0 w-72 h-72 bg-purple-200 dark:bg-purple-900 rounded-full mix-blend-multiply filter blur-xl animate-pulse delay-1000'></div>
        <div className='absolute bottom-0 left-0 w-72 h-72 bg-pink-200 dark:bg-pink-900 rounded-full mix-blend-multiply filter blur-xl animate-pulse delay-500'></div>
      </div>

      <div className='relative z-10 flex items-center justify-center min-h-screen px-4 sm:px-6 lg:px-8'>
        <div className='max-w-sm w-full space-y-8'>
          <div className='bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200 dark:border-gray-700 rounded-xl sm:rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 p-6 sm:p-8'>
            <div className='text-center mb-8'>
              <h2 className='text-2xl sm:text-3xl font-extralight text-gray-900 dark:text-white mb-2 tracking-tight'>
                Welcome back
              </h2>
              <p className='text-sm text-gray-600 dark:text-gray-400 font-light '>
                Sign in to your account
              </p>
            </div>

            <form className='space-y-6' onSubmit={handleSubmit}>
              <div className='space-y-4'>
                <div>
                  <label htmlFor='email' className='sr-only'>
                    Email address
                  </label>
                  <input
                    id='email'
                    name='email'
                    type='email'
                    required
                    className='w-full px-4 py-3 text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-all duration-200'
                    placeholder='Email address'
                    value={formData.email}
                    onChange={handleChange}
                  />
                </div>
                <div>
                  <label htmlFor='password' className='sr-only'>
                    Password
                  </label>
                  <input
                    id='password'
                    name='password'
                    type='password'
                    required
                    className='w-full px-4 py-3 text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-all duration-200'
                    placeholder='Password'
                    value={formData.password}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div>
                <button
                  type='submit'
                  disabled={isLoading}
                  className='w-full px-6 py-1 sm:py-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-lg sm:rounded-xl disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2 font-medium shadow-lg hover:shadow-xl transform hover:scale-[1.01] disabled:transform-none cursor-pointer'
                >
                  {isLoading ? 'Signing in...' : 'Sign in'}
                </button>
              </div>
            </form>

            <div className='mt-8'>
              <div className='relative'>
                <div className='absolute inset-0 flex items-center'>
                  <div className='w-full border-t border-gray-200 dark:border-gray-700'></div>
                </div>
                <div className='relative flex justify-center text-sm'>
                  <span className='px-3 bg-white/80 dark:bg-gray-800/80 text-gray-600 dark:text-gray-400 font-light'>
                    Or continue with
                  </span>
                </div>
              </div>

              <div className='mt-6 flex justify-center'>
                <GoogleLogin
                  onSuccess={handleGoogleSuccess}
                  onError={handleGoogleFailure}
                />
              </div>

              <div className='mt-6 text-center'>
                <p className='text-sm text-gray-600 dark:text-gray-400 font-light'>
                  Don't have an account?{' '}
                  <button
                    onClick={() => navigate('/register')}
                    className='font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors cursor-pointer'
                  >
                    Register here
                  </button>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
