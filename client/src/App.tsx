// React Hooks
import { Routes, Route, Navigate } from 'react-router-dom'

// Custom Hooks
import SmoothScroll from '@/hooks/SmoothScroll'
import ScrollToTop from '@/hooks/ScrollToTop'

// Components
import { Toaster } from '@/components/ui/sonner'
import Navbar from '@/components/CustomComponents/Navbar'
import Footer from '@/components/CustomComponents/Footer'

// Pages
import HomePage from '@/Pages/HomePage/HomePage'
import LoginPage from '@/Pages/LoginPage/LoginPage'
import RegisterPage from '@/Pages/RegisterPage/RegisterPage'
import OTPPage from '@/Pages/OTPPage/OTPPage'
import AdminPage from '@/Pages/AdminPage/AdminPage'

// Styles
import './App.css'

function App () {
  return (
    <>
      <Navbar />
      <SmoothScroll />
      <main className='pt-16'>
        <Routes>
          <Route path='/' element={<HomePage />} />
          <Route path='/login' element={<LoginPage />} />
          <Route path='/register' element={<RegisterPage />} />
          <Route path='/verify-otp' element={<OTPPage />} />
          <Route path='/admin' element={<AdminPage />} />
          {/* Catch All - redirect to home */}
          <Route path='*' element={<Navigate to='/' />} />
        </Routes>
      </main>
      <ScrollToTop />
      <Footer />
      <Toaster />
    </>
  )
}

export default App
