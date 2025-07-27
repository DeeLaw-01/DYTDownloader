import React, { useState, useEffect } from 'react'
import { ChevronUp } from 'lucide-react'

const ScrollToTop: React.FC = () => {
  const [visible, setVisible] = useState<boolean>(false)

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 300) {
        setVisible(true)
      } else {
        setVisible(false)
      }
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <button
      onClick={scrollToTop}
      className={`z-20 fixed bottom-4 right-4 p-3 rounded-full hover:bg-blue-800 cursor-pointer transition-all ease-in-out duration-200   text-white  ${
        visible ? 'block' : 'hidden'
      }`}
      aria-label='Scroll to top'
    >
      <ChevronUp size={20} />
    </button>
  )
}

export default ScrollToTop
