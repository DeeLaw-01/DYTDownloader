import {
  Youtube,
  User,
  LogOut,
  LogIn,
  UserPlus,
  ChevronDown,
  Shield
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import useUserStore from '@/store/userStore'
import { toast } from 'sonner'
import { useState, useRef, useEffect } from 'react'

export default function Navbar () {
  const navigate = useNavigate()
  const { user, logout } = useUserStore()
  const [showUserMenu, setShowUserMenu] = useState(false)
  const userMenuRef = useRef<HTMLDivElement>(null)

  const handleLogout = () => {
    logout()
    toast.success('Logged out successfully')
    navigate('/')
    setShowUserMenu(false)
  }

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        userMenuRef.current &&
        !userMenuRef.current.contains(event.target as Node)
      ) {
        setShowUserMenu(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  return (
    <nav className='fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-700'>
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
        <div className='flex h-16 items-center justify-between'>
          <div className='flex items-center'>
            <a
              href='/'
              className='text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2 hover:text-blue-600 dark:hover:text-blue-400 transition-colors font-extralight'
            >
              <Youtube className='w-8 h-8 text-blue-600' />
              Dytdownloader
            </a>
          </div>

          <div className='flex items-center gap-4'>
            {user ? (
              <div className='relative' ref={userMenuRef}>
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className='flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer'
                >
                  <User className='w-4 h-4' />
                  <span className='hidden sm:inline'>
                    {user.name || user.email}
                  </span>
                  <ChevronDown
                    className={`w-3 h-3 transition-transform ${
                      showUserMenu ? 'rotate-180' : ''
                    }`}
                  />
                </button>
                {/* <button
                  onClick={() => {
                    console.log(user)
                  }}
                >
                  CLICK TO LOG USER
                </button> */}
                {showUserMenu && (
                  <div className='absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-50'>
                    {user.isAdmin && (
                      <button
                        onClick={() => {
                          navigate('/admin')
                          setShowUserMenu(false)
                        }}
                        className='w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer'
                      >
                        <Shield className='w-4 h-4' />
                        Admin Dashboard
                      </button>
                    )}
                    <button
                      onClick={handleLogout}
                      className='w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer'
                    >
                      <LogOut className='w-4 h-4' />
                      Logout
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className='flex items-center gap-2'>
                <button
                  onClick={() => navigate('/login')}
                  className='flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer'
                >
                  <LogIn className='w-4 h-4' />
                  <span className='hidden sm:inline'>Login</span>
                </button>
                <button
                  onClick={() => navigate('/register')}
                  className='flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors cursor-pointer'
                >
                  <UserPlus className='w-4 h-4' />
                  <span className='hidden sm:inline'>Register</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}
