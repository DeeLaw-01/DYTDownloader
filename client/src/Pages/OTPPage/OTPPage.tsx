import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import api from '@/api/api'

export default function OTPPage () {
  const navigate = useNavigate()
  const [otp, setOtp] = useState('')
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) return // Only allow single digit

    const newOtp = otp.split('')
    newOtp[index] = value
    const newOtpString = newOtp.join('')
    setOtp(newOtpString)

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  const handleKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      // Move to previous input on backspace if current is empty
      inputRefs.current[index - 1]?.focus()
    }
  }

  useEffect(() => {
    const storedEmail = localStorage.getItem('verificationEmail')
    /* if (!storedEmail) {
      navigate('/register')
      return
    } */
    setEmail(storedEmail || '')
  }, [navigate])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setIsLoading(true)
      await api.post('/api/auth/verify-otp', { email, otp })
      toast.success('Email Verified', {
        description: 'Your email has been verified successfully'
      })
      localStorage.removeItem('verificationEmail')
      navigate('/login')
    } catch (error: any) {
      toast.error('Verification Failed', {
        description: error.response?.data?.message || 'Invalid OTP'
      })
    } finally {
      setIsLoading(false)
    }
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
                Verify your email
              </h2>
              <p className='text-sm text-gray-600 dark:text-gray-400 font-light'>
                Please enter the OTP sent to {email}
              </p>
            </div>

            <form className='space-y-6' onSubmit={handleSubmit}>
              <div className='space-y-4'>
                <label htmlFor='otp' className='sr-only'>
                  OTP
                </label>
                <div className='flex justify-center'>
                  <div className='flex gap-2'>
                    {Array.from({ length: 6 }, (_, index) => (
                      <input
                        key={index}
                        ref={el => {
                          inputRefs.current[index] = el
                        }}
                        type='text'
                        maxLength={1}
                        value={otp[index] || ''}
                        onChange={e => handleOtpChange(index, e.target.value)}
                        onKeyDown={e => handleKeyDown(index, e)}
                        className='h-12 w-12 text-lg font-mono text-center border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent rounded-lg transition-all duration-200'
                        placeholder=''
                      />
                    ))}
                  </div>
                </div>
                <p className='text-xs text-gray-500 dark:text-gray-400 text-center'>
                  Enter the 6-digit code sent to your email
                </p>
              </div>

              <div>
                <button
                  type='submit'
                  disabled={isLoading}
                  className='w-full px-6 py-1 sm:py-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-lg sm:rounded-xl disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2 font-medium shadow-lg hover:shadow-xl transform hover:scale-[1.01] disabled:transform-none cursor-pointer'
                >
                  {isLoading ? 'Verifying...' : 'Verify OTP'}
                </button>
              </div>
            </form>

            <div className='mt-6 text-center'>
              <p className='text-sm text-gray-600 dark:text-gray-400 font-light'>
                Didn't receive the code?{' '}
                <button
                  onClick={() => navigate('/register')}
                  className='font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors cursor-pointer'
                >
                  Try again
                </button>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
