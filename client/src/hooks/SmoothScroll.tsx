import { useEffect } from 'react'

export default function SmoothScroll () {
  useEffect(() => {
    // Save the original scrollTo function
    const originalScrollTo = window.scrollTo

    // Override the scrollTo method
    //@ts-ignore
    window.scrollTo = function (x: number | ScrollToOptions, y?: number) {
      // If it's an object with behavior property and not explicitly set to 'auto'
      if (typeof x === 'object' && x.behavior !== 'auto') {
        // Use the original scrollTo with smooth behavior
        return originalScrollTo({ ...x, behavior: 'smooth' })
      }

      // If it's just coordinates, add smooth behavior
      if (typeof x === 'number' && typeof y === 'number') {
        return originalScrollTo({ left: x, top: y, behavior: 'smooth' })
      }

      // Otherwise use the original implementation
      return originalScrollTo(x as any, y as any)
    }

    // Handle anchor links
    const handleAnchorClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      const anchor = target.closest('a')

      if (
        anchor &&
        anchor.hash &&
        anchor.pathname === window.location.pathname
      ) {
        e.preventDefault()

        const targetElement = document.querySelector(anchor.hash)
        if (targetElement) {
          targetElement.scrollIntoView({ behavior: 'smooth' })

          // Update URL without reload
          window.history.pushState(null, '', anchor.hash)
        }
      }
    }

    document.addEventListener('click', handleAnchorClick)

    return () => {
      // Restore original scrollTo
      window.scrollTo = originalScrollTo
      document.removeEventListener('click', handleAnchorClick)
    }
  }, [])

  return null
}
