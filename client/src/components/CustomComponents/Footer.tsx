import { useState, useEffect } from 'react'
import { Youtube, Github, Mail, X } from 'lucide-react'

export default function Footer () {
  const [activeModal, setActiveModal] = useState<'privacy' | 'terms' | null>(
    null
  )

  // Handle escape key press
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setActiveModal(null)
      }
    }

    if (activeModal) {
      document.addEventListener('keydown', handleEscape)
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden'
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = 'unset'
    }
  }, [activeModal])

  // Handle clicking outside modal
  const handleBackdropClick = (event: React.MouseEvent) => {
    if (event.target === event.currentTarget) {
      setActiveModal(null)
    }
  }

  return (
    <>
      <footer className='bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
          <div className='flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0'>
            {/* Brand Section */}
            <div className='flex items-center space-x-2'>
              <Youtube className='w-6 h-6 text-blue-600' />
              <span className='text-lg font-bold text-gray-800 dark:text-white'>
                Dytdownloader
              </span>
            </div>

            {/* Description */}
            <div className='text-center'>
              <p className='text-sm text-gray-600 dark:text-gray-300'>
                Free YouTube video and audio downloader
              </p>
            </div>

            {/* Links */}
            <div className='flex items-center space-x-6'>
              <a
                href='mailto:support@dytdownloader.com'
                className='text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors flex items-center space-x-1'
                title='Contact Support'
              >
                <Mail className='w-4 h-4' />
                <span className='text-sm'>Reach Out</span>
              </a>
              <a
                href='https://github.com/DeeLaw-01'
                target='_blank'
                rel='noopener noreferrer'
                className='text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors flex items-center space-x-1'
                title='GitHub Repository'
              >
                <Github className='w-4 h-4' />
                <span className='text-sm'>GitHub</span>
              </a>
            </div>
          </div>

          {/* Bottom Section */}
          <div className='mt-6 pt-6 border-t border-gray-200 dark:border-gray-700'>
            <div className='flex flex-col md:flex-row justify-between items-center text-sm text-gray-500 dark:text-gray-400'>
              <p>
                © {new Date().getFullYear()} Dytdownloader. All rights reserved.
              </p>
              <div className='flex space-x-6 mt-2 md:mt-0'>
                <button
                  onClick={() => setActiveModal('privacy')}
                  className='hover:text-gray-700 dark:hover:text-gray-300 transition-colors cursor-pointer'
                >
                  Privacy Policy
                </button>
                <button
                  onClick={() => setActiveModal('terms')}
                  className='hover:text-gray-700 dark:hover:text-gray-300 transition-colors cursor-pointer'
                >
                  Terms of Service
                </button>
              </div>
            </div>
          </div>

          {/* Disclaimer */}
          <div className='mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg'>
            <p className='text-xs text-yellow-800 dark:text-yellow-200 text-center'>
              Disclaimer: This tool is for personal use only. Please respect
              YouTube's Terms of Service and copyright laws.
            </p>
          </div>
        </div>
      </footer>

      {/* Privacy Policy Modal */}
      {activeModal === 'privacy' && (
        <div
          className='fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 border-rounded-lg'
          onClick={handleBackdropClick}
        >
          <div className='bg-white dark:bg-gray-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto'>
            <div className='p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center'>
              <h2 className='text-2xl font-bold text-gray-900 dark:text-white'>
                Privacy Policy
              </h2>
              <button
                onClick={() => setActiveModal(null)}
                className='text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 cursor-pointer'
              >
                <X className='w-6 h-6' />
              </button>
            </div>
            <div className='p-6 space-y-6 text-sm text-gray-700 dark:text-gray-300'>
              <div className='bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4'>
                <h3 className='font-semibold text-red-800 dark:text-red-200 mb-2'>
                  IMPORTANT DISCLAIMER
                </h3>
                <p className='text-red-700 dark:text-red-300'>
                  This is a student learning project created for educational
                  purposes only. The developer is a student learning programming
                  and web development. This application is not intended for
                  commercial use and is provided "as is" without any warranties
                  or guarantees.
                </p>
              </div>

              <section>
                <h3 className='text-lg font-semibold text-gray-900 dark:text-white mb-3'>
                  1. Project Information
                </h3>
                <p className='mb-3'>
                  <strong>Dytdownloader</strong> is a student learning project
                  created to practice:
                </p>
                <ul className='list-disc list-inside space-y-1 ml-4'>
                  <li>Frontend development with React and TypeScript</li>
                  <li>Backend API development with Node.js</li>
                  <li>YouTube API integration and video processing</li>
                  <li>Modern UI/UX design principles</li>
                  <li>Full-stack application architecture</li>
                </ul>
              </section>

              <section>
                <h3 className='text-lg font-semibold text-gray-900 dark:text-white mb-3'>
                  2. Data Collection
                </h3>
                <p className='mb-3'>
                  <strong>
                    No personal data is collected, stored, or processed.
                  </strong>{' '}
                  This application:
                </p>
                <ul className='list-disc list-inside space-y-1 ml-4'>
                  <li>Does not use cookies or tracking technologies</li>
                  <li>Does not store any user information</li>
                  <li>Does not require user registration or accounts</li>
                  <li>Does not log or monitor user activity</li>
                  <li>
                    Only processes YouTube URLs temporarily for download
                    purposes
                  </li>
                </ul>
              </section>

              <section>
                <h3 className='text-lg font-semibold text-gray-900 dark:text-white mb-3'>
                  3. Third-Party Services
                </h3>
                <p className='mb-3'>
                  This application interacts with YouTube's services. Users are
                  responsible for:
                </p>
                <ul className='list-disc list-inside space-y-1 ml-4'>
                  <li>Complying with YouTube's Terms of Service</li>
                  <li>Respecting copyright and intellectual property rights</li>
                  <li>
                    Using downloaded content for personal, non-commercial
                    purposes only
                  </li>
                  <li>Not redistributing or sharing downloaded content</li>
                </ul>
              </section>

              <section>
                <h3 className='text-lg font-semibold text-gray-900 dark:text-white mb-3'>
                  4. Legal Disclaimers
                </h3>
                <div className='space-y-3'>
                  <p>
                    <strong>Educational Purpose:</strong> This project is
                    created solely for educational and learning purposes by a
                    student developer.
                  </p>
                  <p>
                    <strong>No Warranty:</strong> The application is provided
                    "as is" without any warranties, express or implied.
                  </p>
                  <p>
                    <strong>No Liability:</strong> The student developer assumes
                    no responsibility for any damages or legal issues arising
                    from the use of this application.
                  </p>
                  <p>
                    <strong>User Responsibility:</strong> Users are solely
                    responsible for ensuring their use of this application
                    complies with all applicable laws and regulations.
                  </p>
                </div>
              </section>

              <section>
                <h3 className='text-lg font-semibold text-gray-900 dark:text-white mb-3'>
                  5. Contact Information
                </h3>
                <p>
                  For questions about this privacy policy or the project, please
                  contact the student developer through the GitHub repository or
                  support email provided in the footer.
                </p>
              </section>

              <div className='text-xs text-gray-500 dark:text-gray-400 pt-4 border-t border-gray-200 dark:border-gray-700'>
                <p>Last updated: {new Date().toLocaleDateString()}</p>
                <p>
                  This is a student learning project - not a commercial
                  application
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Terms of Service Modal */}
      {activeModal === 'terms' && (
        <div
          className='fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 border-rounded-lg'
          onClick={handleBackdropClick}
        >
          <div className='bg-white dark:bg-gray-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto'>
            <div className='p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center'>
              <h2 className='text-2xl font-bold text-gray-900 dark:text-white'>
                Terms of Service
              </h2>
              <button
                onClick={() => setActiveModal(null)}
                className='text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 cursor-pointer'
              >
                <X className='w-6 h-6' />
              </button>
            </div>
            <div className='p-6 space-y-6 text-sm text-gray-700 dark:text-gray-300'>
              <div className='bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4'>
                <h3 className='font-semibold text-red-800 dark:text-red-200 mb-2'>
                  IMPORTANT DISCLAIMER
                </h3>
                <p className='text-red-700 dark:text-red-300'>
                  This is a student learning project created for educational
                  purposes only. The developer is a student learning programming
                  and web development. This application is not intended for
                  commercial use and is provided "as is" without any warranties
                  or guarantees.
                </p>
              </div>

              <section>
                <h3 className='text-lg font-semibold text-gray-900 dark:text-white mb-3'>
                  1. Project Nature
                </h3>
                <p className='mb-3'>
                  <strong>Dytdownloader</strong> is a student learning project
                  designed to:
                </p>
                <ul className='list-disc list-inside space-y-1 ml-4'>
                  <li>Demonstrate programming skills and knowledge</li>
                  <li>Practice full-stack development techniques</li>
                  <li>Learn API integration and video processing</li>
                  <li>Understand modern web application architecture</li>
                  <li>Build a portfolio project for educational purposes</li>
                </ul>
              </section>

              <section>
                <h3 className='text-lg font-semibold text-gray-900 dark:text-white mb-3'>
                  2. Acceptable Use
                </h3>
                <p className='mb-3'>By using this application, you agree to:</p>
                <ul className='list-disc list-inside space-y-1 ml-4'>
                  <li>
                    Use the application for personal, non-commercial purposes
                    only
                  </li>
                  <li>
                    Respect YouTube's Terms of Service and Community Guidelines
                  </li>
                  <li>
                    Comply with all applicable copyright and intellectual
                    property laws
                  </li>
                  <li>
                    Not use the application for any illegal or unauthorized
                    purposes
                  </li>
                  <li>
                    Not attempt to circumvent any technical limitations or
                    security measures
                  </li>
                  <li>Not redistribute or share downloaded content</li>
                </ul>
              </section>

              <section>
                <h3 className='text-lg font-semibold text-gray-900 dark:text-white mb-3'>
                  3. Prohibited Uses
                </h3>
                <p className='mb-3'>You are strictly prohibited from:</p>
                <ul className='list-disc list-inside space-y-1 ml-4'>
                  <li>Using this application for commercial purposes</li>
                  <li>
                    Downloading copyrighted content without proper authorization
                  </li>
                  <li>Redistributing or selling downloaded content</li>
                  <li>
                    Using the application to violate any laws or regulations
                  </li>
                  <li>
                    Attempting to reverse engineer or modify the application
                  </li>
                  <li>Using the application to harm or harass others</li>
                </ul>
              </section>

              <section>
                <h3 className='text-lg font-semibold text-gray-900 dark:text-white mb-3'>
                  4. Legal Disclaimers
                </h3>
                <div className='space-y-3'>
                  <p>
                    <strong>Student Project:</strong> This is a learning project
                    created by a student developer for educational purposes
                    only.
                  </p>
                  <p>
                    <strong>No Warranty:</strong> The application is provided
                    "as is" without any warranties of any kind, either express
                    or implied.
                  </p>
                  <p>
                    <strong>No Liability:</strong> The student developer shall
                    not be liable for any direct, indirect, incidental, special,
                    or consequential damages arising from the use of this
                    application.
                  </p>
                  <p>
                    <strong>User Responsibility:</strong> Users are entirely
                    responsible for their use of this application and must
                    ensure compliance with all applicable laws.
                  </p>
                  <p>
                    <strong>No Guarantee:</strong> The student developer does
                    not guarantee that the application will be error-free,
                    secure, or continuously available.
                  </p>
                </div>
              </section>

              <section>
                <h3 className='text-lg font-semibold text-gray-900 dark:text-white mb-3'>
                  5. Intellectual Property
                </h3>
                <p className='mb-3'>
                  This application is a student learning project. Users
                  acknowledge that:
                </p>
                <ul className='list-disc list-inside space-y-1 ml-4'>
                  <li>
                    YouTube content remains the property of its respective
                    owners
                  </li>
                  <li>
                    This application does not claim ownership of any downloaded
                    content
                  </li>
                  <li>
                    Users are responsible for obtaining proper permissions for
                    content use
                  </li>
                  <li>
                    The student developer claims no rights to YouTube's
                    intellectual property
                  </li>
                </ul>
              </section>

              <section>
                <h3 className='text-lg font-semibold text-gray-900 dark:text-white mb-3'>
                  6. Termination
                </h3>
                <p>
                  The student developer reserves the right to modify, suspend,
                  or discontinue this learning project at any time without
                  notice. Users have no right to continued access to this
                  application.
                </p>
              </section>

              <section>
                <h3 className='text-lg font-semibold text-gray-900 dark:text-white mb-3'>
                  7. Contact
                </h3>
                <p>
                  For questions about these terms or the project, please contact
                  the student developer through the GitHub repository or support
                  email provided in the footer.
                </p>
              </section>

              <div className='text-xs text-gray-500 dark:text-gray-400 pt-4 border-t border-gray-200 dark:border-gray-700'>
                <p>Last updated: {new Date().toLocaleDateString()}</p>
                <p>
                  This is a student learning project - not a commercial
                  application
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
