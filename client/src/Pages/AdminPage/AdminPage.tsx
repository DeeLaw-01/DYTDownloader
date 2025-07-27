import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { useNavigate } from 'react-router-dom'
import {
  Users,
  Download,
  Shield,
  Activity,
  Search,
  Trash2,
  CheckCircle,
  XCircle,
  BarChart3
} from 'lucide-react'
import api from '@/api/api'
import useUserStore from '@/store/userStore'

interface User {
  _id: string
  name: string
  email: string
  isVerified: boolean
  isAdmin: boolean
  isGoogle: boolean
  createdAt: string
}

interface Stats {
  userStats: {
    total: number
    verified: number
    google: number
    admin: number
    recent: User[]
  }
  downloadStats: {
    total: number
    recent: any[]
    popularFormats: any[]
  }
  dailyStats: any[]
}

interface LogEntry {
  _id: string
  level: string
  message: string
  timestamp: string
  method?: string
  url?: string
  statusCode?: number
  responseTime?: number
  ip?: string
  action?: string
  userId?: {
    _id: string
    name: string
    email: string
  }
  metadata?: any
  error?: {
    name: string
    message: string
  }
}

export default function AdminPage () {
  const navigate = useNavigate()
  const { user } = useUserStore()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<Stats | null>(null)
  const [users, setUsers] = useState<User[]>([])
  const [usersLoading, setUsersLoading] = useState(false)
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [logsLoading, setLogsLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('dashboard')
  const [searchTerm, setSearchTerm] = useState('')
  const [logFilters, setLogFilters] = useState({
    level: '',
    action: '',
    startDate: '',
    endDate: ''
  })
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalUsers: 0
  })
  const [logPagination, setLogPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalLogs: 0
  })

  // Check if user is admin
  useEffect(() => {
    if (!user?.isAdmin) {
      toast.error('Access denied. Admin privileges required.')
      navigate('/')
      return
    }
  }, [user, navigate])

  // Load dashboard stats
  useEffect(() => {
    if (user?.isAdmin) {
      loadStats()
    }
  }, [user])

  // Load users when users tab is active
  useEffect(() => {
    if (activeTab === 'users' && user?.isAdmin) {
      loadUsers()
    }
  }, [activeTab, user, pagination.currentPage, searchTerm])

  // Load logs when logs tab is active
  useEffect(() => {
    if (activeTab === 'logs' && user?.isAdmin) {
      loadLogs()
    }
  }, [activeTab, user, logPagination.currentPage, logFilters])

  const loadStats = async () => {
    try {
      setLoading(true)
      const response = await api.get('/api/admin/stats')
      setStats(response.data.data)
    } catch (error: any) {
      toast.error('Failed to load stats')
      console.error('Stats error:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadUsers = async () => {
    try {
      setUsersLoading(true)
      const response = await api.get('/api/admin/users', {
        params: {
          page: pagination.currentPage,
          limit: 20,
          search: searchTerm
        }
      })
      setUsers(response.data.data.users)
      setPagination({
        currentPage: response.data.data.currentPage,
        totalPages: response.data.data.totalPages,
        totalUsers: response.data.data.totalUsers
      })
    } catch (error: any) {
      toast.error('Failed to load users')
      console.error('Users error:', error)
    } finally {
      setUsersLoading(false)
    }
  }

  const loadLogs = async () => {
    try {
      setLogsLoading(true)
      const response = await api.get('/api/admin/logs', {
        params: {
          page: logPagination.currentPage,
          limit: 50,
          level: logFilters.level || undefined,
          action: logFilters.action || undefined,
          startDate: logFilters.startDate || undefined,
          endDate: logFilters.endDate || undefined
        }
      })
      setLogs(response.data.data.logs)
      setLogPagination({
        currentPage: response.data.data.currentPage,
        totalPages: response.data.data.totalPages,
        totalLogs: response.data.data.totalLogs
      })
    } catch (error: any) {
      toast.error('Failed to load logs')
      console.error('Logs error:', error)
    } finally {
      setLogsLoading(false)
    }
  }

  const updateUser = async (userId: string, updates: Partial<User>) => {
    try {
      await api.put(`/api/admin/users/${userId}`, updates)
      toast.success('User updated successfully')
      loadUsers()
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update user')
    }
  }

  const deleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user?')) return

    try {
      await api.delete(`/api/admin/users/${userId}`)
      toast.success('User deleted successfully')
      loadUsers()
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to delete user')
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getLogLevelColor = (level: string) => {
    switch (level) {
      case 'error':
        return 'text-red-600 bg-red-100 dark:bg-red-900/30'
      case 'warn':
        return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30'
      case 'info':
        return 'text-blue-600 bg-blue-100 dark:bg-blue-900/30'
      case 'debug':
        return 'text-gray-600 bg-gray-100 dark:bg-gray-900/30'
      default:
        return 'text-gray-600 bg-gray-100 dark:bg-gray-900/30'
    }
  }

  const getStatusCodeColor = (statusCode?: number) => {
    if (!statusCode) return 'text-gray-600'
    if (statusCode >= 200 && statusCode < 300) return 'text-green-600'
    if (statusCode >= 300 && statusCode < 400) return 'text-yellow-600'
    if (statusCode >= 400 && statusCode < 500) return 'text-orange-600'
    if (statusCode >= 500) return 'text-red-600'
    return 'text-gray-600'
  }

  if (!user?.isAdmin) {
    return null
  }

  return (
    <div className='min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800'>
      {/* Background pattern */}
      <div className='absolute inset-0 opacity-30'>
        <div className='absolute top-0 left-0 w-72 h-72 bg-blue-200 dark:bg-blue-900 rounded-full mix-blend-multiply filter blur-xl animate-pulse'></div>
        <div className='absolute top-0 right-0 w-72 h-72 bg-purple-200 dark:bg-purple-900 rounded-full mix-blend-multiply filter blur-xl animate-pulse delay-1000'></div>
        <div className='absolute bottom-0 left-0 w-72 h-72 bg-pink-200 dark:bg-pink-900 rounded-full mix-blend-multiply filter blur-xl animate-pulse delay-500'></div>
      </div>

      <div className='relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
        {/* Header */}
        <div className='mb-8'>
          <h1 className='text-3xl font-extralight text-gray-900 dark:text-white mb-2'>
            Admin Dashboard
          </h1>
          <p className='text-gray-600 dark:text-gray-400'>
            Manage users, view statistics, and monitor system activity
          </p>
        </div>

        {/* Navigation Tabs */}
        <div className='mb-8'>
          <div className='bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200 dark:border-gray-700 rounded-xl p-1'>
            <nav className='flex space-x-1'>
              {[
                { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
                { id: 'users', label: 'Users', icon: Users },
                { id: 'logs', label: 'Logs', icon: Activity }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    activeTab === tab.id
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  <tab.icon className='w-4 h-4' />
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && (
          <div className='space-y-6'>
            {loading ? (
              <div className='text-center py-12'>
                <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto'></div>
                <p className='mt-4 text-gray-600 dark:text-gray-400'>
                  Loading stats...
                </p>
              </div>
            ) : stats ? (
              <>
                {/* Stats Cards */}
                <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'>
                  <div className='bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200 dark:border-gray-700 rounded-xl p-6'>
                    <div className='flex items-center justify-between'>
                      <div>
                        <p className='text-sm font-medium text-gray-600 dark:text-gray-400'>
                          Total Users
                        </p>
                        <p className='text-2xl font-bold text-gray-900 dark:text-white'>
                          {stats.userStats.total}
                        </p>
                      </div>
                      <Users className='w-8 h-8 text-blue-600' />
                    </div>
                  </div>

                  <div className='bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200 dark:border-gray-700 rounded-xl p-6'>
                    <div className='flex items-center justify-between'>
                      <div>
                        <p className='text-sm font-medium text-gray-600 dark:text-gray-400'>
                          Verified Users
                        </p>
                        <p className='text-2xl font-bold text-gray-900 dark:text-white'>
                          {stats.userStats.verified}
                        </p>
                      </div>
                      <CheckCircle className='w-8 h-8 text-green-600' />
                    </div>
                  </div>

                  <div className='bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200 dark:border-gray-700 rounded-xl p-6'>
                    <div className='flex items-center justify-between'>
                      <div>
                        <p className='text-sm font-medium text-gray-600 dark:text-gray-400'>
                          Total Downloads
                        </p>
                        <p className='text-2xl font-bold text-gray-900 dark:text-white'>
                          {stats.downloadStats.total}
                        </p>
                      </div>
                      <Download className='w-8 h-8 text-purple-600' />
                    </div>
                  </div>

                  <div className='bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200 dark:border-gray-700 rounded-xl p-6'>
                    <div className='flex items-center justify-between'>
                      <div>
                        <p className='text-sm font-medium text-gray-600 dark:text-gray-400'>
                          Admin Users
                        </p>
                        <p className='text-2xl font-bold text-gray-900 dark:text-white'>
                          {stats.userStats.admin}
                        </p>
                      </div>
                      <Shield className='w-8 h-8 text-red-600' />
                    </div>
                  </div>
                </div>

                {/* Recent Users */}
                <div className='bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200 dark:border-gray-700 rounded-xl p-6'>
                  <h3 className='text-lg font-semibold text-gray-900 dark:text-white mb-4'>
                    Recent Users
                  </h3>
                  <div className='overflow-x-auto'>
                    <table className='w-full text-sm'>
                      <thead>
                        <tr className='border-b border-gray-200 dark:border-gray-700'>
                          <th className='text-left p-2 text-gray-600 dark:text-gray-400'>
                            Name
                          </th>
                          <th className='text-left p-2 text-gray-600 dark:text-gray-400'>
                            Email
                          </th>
                          <th className='text-left p-2 text-gray-600 dark:text-gray-400'>
                            Status
                          </th>
                          <th className='text-left p-2 text-gray-600 dark:text-gray-400'>
                            Joined
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {stats.userStats.recent.map(user => (
                          <tr
                            key={user._id}
                            className='border-b border-gray-100 dark:border-gray-800'
                          >
                            <td className='p-2 text-gray-900 dark:text-white'>
                              {user.name}
                            </td>
                            <td className='p-2 text-gray-600 dark:text-gray-400'>
                              {user.email}
                            </td>
                            <td className='p-2'>
                              <div className='flex items-center gap-2'>
                                {user.isVerified ? (
                                  <CheckCircle className='w-4 h-4 text-green-600' />
                                ) : (
                                  <XCircle className='w-4 h-4 text-red-600' />
                                )}
                                {user.isGoogle && (
                                  <span className='text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded'>
                                    Google
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className='p-2 text-gray-600 dark:text-gray-400'>
                              {formatDate(user.createdAt)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            ) : null}
          </div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div className='space-y-6'>
            {/* Search */}
            <div className='bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200 dark:border-gray-700 rounded-xl p-4'>
              <div className='flex items-center gap-4'>
                <div className='flex-1 relative'>
                  <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400' />
                  <input
                    type='text'
                    placeholder='Search users by name or email...'
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className='w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500'
                  />
                </div>
              </div>
            </div>

            {/* Users Table */}
            <div className='bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200 dark:border-gray-700 rounded-xl p-6'>
              <div className='flex items-center justify-between mb-4'>
                <h3 className='text-lg font-semibold text-gray-900 dark:text-white'>
                  Users ({pagination.totalUsers})
                </h3>
              </div>

              {usersLoading ? (
                <div className='text-center py-8'>
                  <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto'></div>
                  <p className='mt-2 text-gray-600 dark:text-gray-400'>
                    Loading users...
                  </p>
                </div>
              ) : (
                <div className='overflow-x-auto'>
                  <table className='w-full text-sm'>
                    <thead>
                      <tr className='border-b border-gray-200 dark:border-gray-700'>
                        <th className='text-left p-3 text-gray-600 dark:text-gray-400'>
                          User
                        </th>
                        <th className='text-left p-3 text-gray-600 dark:text-gray-400'>
                          Status
                        </th>
                        <th className='text-left p-3 text-gray-600 dark:text-gray-400'>
                          Role
                        </th>
                        <th className='text-left p-3 text-gray-600 dark:text-gray-400'>
                          Joined
                        </th>
                        <th className='text-right p-3 text-gray-600 dark:text-gray-400'>
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map(user => (
                        <tr
                          key={user._id}
                          className='border-b border-gray-100 dark:border-gray-800'
                        >
                          <td className='p-3'>
                            <div>
                              <div className='font-medium text-gray-900 dark:text-white'>
                                {user.name}
                              </div>
                              <div className='text-gray-600 dark:text-gray-400'>
                                {user.email}
                              </div>
                            </div>
                          </td>
                          <td className='p-3'>
                            <div className='flex items-center gap-2'>
                              {user.isVerified ? (
                                <span className='flex items-center gap-1 text-green-600'>
                                  <CheckCircle className='w-4 h-4' />
                                  Verified
                                </span>
                              ) : (
                                <span className='flex items-center gap-1 text-red-600'>
                                  <XCircle className='w-4 h-4' />
                                  Unverified
                                </span>
                              )}
                              {user.isGoogle && (
                                <span className='text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded'>
                                  Google
                                </span>
                              )}
                            </div>
                          </td>
                          <td className='p-3'>
                            {user.isAdmin ? (
                              <span className='flex items-center gap-1 text-red-600'>
                                <Shield className='w-4 h-4' />
                                Admin
                              </span>
                            ) : (
                              <span className='text-gray-600 dark:text-gray-400'>
                                User
                              </span>
                            )}
                          </td>
                          <td className='p-3 text-gray-600 dark:text-gray-400'>
                            {formatDate(user.createdAt)}
                          </td>
                          <td className='p-3'>
                            <div className='flex items-center justify-end gap-2'>
                              <button
                                onClick={() =>
                                  updateUser(user._id, {
                                    isVerified: !user.isVerified
                                  })
                                }
                                className='p-1 text-blue-600 hover:text-blue-800 transition-colors'
                                title={
                                  user.isVerified
                                    ? 'Unverify user'
                                    : 'Verify user'
                                }
                              >
                                <CheckCircle className='w-4 h-4' />
                              </button>
                              <button
                                onClick={() =>
                                  updateUser(user._id, {
                                    isAdmin: !user.isAdmin
                                  })
                                }
                                className='p-1 text-purple-600 hover:text-purple-800 transition-colors'
                                title={
                                  user.isAdmin ? 'Remove admin' : 'Make admin'
                                }
                              >
                                <Shield className='w-4 h-4' />
                              </button>
                              <button
                                onClick={() => deleteUser(user._id)}
                                className='p-1 text-red-600 hover:text-red-800 transition-colors'
                                title='Delete user'
                              >
                                <Trash2 className='w-4 h-4' />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className='flex items-center justify-between mt-6'>
                  <p className='text-sm text-gray-600 dark:text-gray-400'>
                    Page {pagination.currentPage} of {pagination.totalPages}
                  </p>
                  <div className='flex gap-2'>
                    <button
                      onClick={() =>
                        setPagination(prev => ({
                          ...prev,
                          currentPage: prev.currentPage - 1
                        }))
                      }
                      disabled={pagination.currentPage === 1}
                      className='px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded disabled:opacity-50 disabled:cursor-not-allowed'
                    >
                      Previous
                    </button>
                    <button
                      onClick={() =>
                        setPagination(prev => ({
                          ...prev,
                          currentPage: prev.currentPage + 1
                        }))
                      }
                      disabled={
                        pagination.currentPage === pagination.totalPages
                      }
                      className='px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded disabled:opacity-50 disabled:cursor-not-allowed'
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Logs Tab */}
        {activeTab === 'logs' && (
          <div className='space-y-6'>
            {/* Log Filters */}
            <div className='bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200 dark:border-gray-700 rounded-xl p-4'>
              <div className='grid grid-cols-1 md:grid-cols-4 gap-4'>
                <div>
                  <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'>
                    Level
                  </label>
                  <select
                    value={logFilters.level}
                    onChange={e =>
                      setLogFilters({ ...logFilters, level: e.target.value })
                    }
                    className='w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500'
                  >
                    <option value=''>All Levels</option>
                    <option value='error'>Error</option>
                    <option value='warn'>Warning</option>
                    <option value='info'>Info</option>
                    <option value='debug'>Debug</option>
                  </select>
                </div>
                <div>
                  <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'>
                    Action
                  </label>
                  <select
                    value={logFilters.action}
                    onChange={e =>
                      setLogFilters({ ...logFilters, action: e.target.value })
                    }
                    className='w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500'
                  >
                    <option value=''>All Actions</option>
                    <option value='login'>Login</option>
                    <option value='registration'>Registration</option>
                    <option value='download'>Download</option>
                  </select>
                </div>
                <div>
                  <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'>
                    Start Date
                  </label>
                  <input
                    type='datetime-local'
                    value={logFilters.startDate}
                    onChange={e =>
                      setLogFilters({
                        ...logFilters,
                        startDate: e.target.value
                      })
                    }
                    className='w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500'
                  />
                </div>
                <div>
                  <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'>
                    End Date
                  </label>
                  <input
                    type='datetime-local'
                    value={logFilters.endDate}
                    onChange={e =>
                      setLogFilters({ ...logFilters, endDate: e.target.value })
                    }
                    className='w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500'
                  />
                </div>
              </div>
            </div>

            {/* Logs Table */}
            <div className='bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200 dark:border-gray-700 rounded-xl p-6'>
              <div className='flex items-center justify-between mb-4'>
                <h3 className='text-lg font-semibold text-gray-900 dark:text-white'>
                  System Logs ({logPagination.totalLogs})
                </h3>
              </div>

              {logsLoading ? (
                <div className='text-center py-8'>
                  <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto'></div>
                  <p className='mt-2 text-gray-600 dark:text-gray-400'>
                    Loading logs...
                  </p>
                </div>
              ) : (
                <div className='overflow-x-auto'>
                  <table className='w-full text-sm'>
                    <thead>
                      <tr className='border-b border-gray-200 dark:border-gray-700'>
                        <th className='text-left p-3 text-gray-600 dark:text-gray-400'>
                          Time
                        </th>
                        <th className='text-left p-3 text-gray-600 dark:text-gray-400'>
                          Level
                        </th>
                        <th className='text-left p-3 text-gray-600 dark:text-gray-400'>
                          Message
                        </th>
                        <th className='text-left p-3 text-gray-600 dark:text-gray-400'>
                          User
                        </th>
                        <th className='text-left p-3 text-gray-600 dark:text-gray-400'>
                          Method
                        </th>
                        <th className='text-left p-3 text-gray-600 dark:text-gray-400'>
                          Status
                        </th>
                        <th className='text-left p-3 text-gray-600 dark:text-gray-400'>
                          IP
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {logs.map(log => (
                        <tr
                          key={log._id}
                          className='border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                        >
                          <td className='p-3 text-gray-600 dark:text-gray-400 font-mono text-xs'>
                            {formatDate(log.timestamp)}
                          </td>
                          <td className='p-3'>
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-medium ${getLogLevelColor(
                                log.level
                              )}`}
                            >
                              {log.level.toUpperCase()}
                            </span>
                          </td>
                          <td className='p-3 text-gray-900 dark:text-white max-w-md'>
                            <div className='truncate' title={log.message}>
                              {log.message}
                            </div>
                            {log.error && (
                              <div
                                className='text-red-600 text-xs mt-1 truncate'
                                title={log.error.message}
                              >
                                Error: {log.error.message}
                              </div>
                            )}
                          </td>
                          <td className='p-3 text-gray-600 dark:text-gray-400'>
                            {log.userId ? (
                              <div>
                                <div className='font-medium'>
                                  {log.userId.name}
                                </div>
                                <div className='text-xs'>
                                  {log.userId.email}
                                </div>
                              </div>
                            ) : (
                              <span className='text-gray-400'>Anonymous</span>
                            )}
                          </td>
                          <td className='p-3'>
                            {log.method && (
                              <span className='px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded text-xs font-mono'>
                                {log.method}
                              </span>
                            )}
                          </td>
                          <td className='p-3'>
                            {log.statusCode && (
                              <span
                                className={`font-mono text-xs ${getStatusCodeColor(
                                  log.statusCode
                                )}`}
                              >
                                {log.statusCode}
                              </span>
                            )}
                          </td>
                          <td className='p-3 text-gray-600 dark:text-gray-400 font-mono text-xs'>
                            {log.ip}
                          </td>
                        </tr>
                      ))}
                      {logs.length === 0 && (
                        <tr>
                          <td
                            colSpan={7}
                            className='p-8 text-center text-gray-500 dark:text-gray-400'
                          >
                            No logs found
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Log Pagination */}
              {logPagination.totalPages > 1 && (
                <div className='flex items-center justify-between mt-6'>
                  <p className='text-sm text-gray-600 dark:text-gray-400'>
                    Page {logPagination.currentPage} of{' '}
                    {logPagination.totalPages}
                  </p>
                  <div className='flex gap-2'>
                    <button
                      onClick={() =>
                        setLogPagination(prev => ({
                          ...prev,
                          currentPage: prev.currentPage - 1
                        }))
                      }
                      disabled={logPagination.currentPage === 1}
                      className='px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded disabled:opacity-50 disabled:cursor-not-allowed'
                    >
                      Previous
                    </button>
                    <button
                      onClick={() =>
                        setLogPagination(prev => ({
                          ...prev,
                          currentPage: prev.currentPage + 1
                        }))
                      }
                      disabled={
                        logPagination.currentPage === logPagination.totalPages
                      }
                      className='px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded disabled:opacity-50 disabled:cursor-not-allowed'
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
