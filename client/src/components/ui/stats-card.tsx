import { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface StatsCardProps {
  title: string
  value: string | number
  icon?: ReactNode
  trend?: {
    value: number
    isPositive: boolean
  }
  className?: string
  iconClassName?: string
  valueClassName?: string
}

export function StatsCard ({
  title,
  value,
  icon,
  trend,
  className,
  iconClassName,
  valueClassName
}: StatsCardProps) {
  return (
    <div
      className={cn(
        'bg-[var(--dashboard-card)] rounded-xl p-4 sm:p-6 border border-[var(--dashboard-border)] relative overflow-hidden group',
        className
      )}
    >
      <div className='flex items-center justify-between mb-3 sm:mb-4'>
        <h3 className='text-xs sm:text-sm font-medium text-[var(--dashboard-text-muted)]'>
          {title}
        </h3>
        {icon && (
          <div
            className={cn(
              'p-1.5 sm:p-2 rounded-lg transition-colors',
              iconClassName
            )}
          >
            {icon}
          </div>
        )}
      </div>

      <div className='flex items-end gap-2'>
        <div className={cn('text-xl sm:text-2xl font-bold', valueClassName)}>
          {value}
        </div>

        {trend && (
          <div
            className={cn(
              'text-xs font-medium flex items-center',
              trend.isPositive ? 'text-green-500' : 'text-red-500'
            )}
          >
            {trend.isPositive ? (
              <svg
                xmlns='http://www.w3.org/2000/svg'
                viewBox='0 0 20 20'
                fill='currentColor'
                className='w-3 h-3 sm:w-4 sm:h-4 mr-0.5 sm:mr-1'
              >
                <path
                  fillRule='evenodd'
                  d='M12.577 4.878a.75.75 0 01.919-.53l4.78 1.281a.75.75 0 01.531.919l-1.281 4.78a.75.75 0 01-1.449-.387l.81-3.022a19.407 19.407 0 00-5.594 5.203.75.75 0 01-1.139.093L7 10.06l-4.72 4.72a.75.75 0 01-1.06-1.061l5.25-5.25a.75.75 0 011.06 0l3.074 3.073a20.923 20.923 0 015.545-4.931l-3.042-.815a.75.75 0 01-.53-.919z'
                  clipRule='evenodd'
                />
              </svg>
            ) : (
              <svg
                xmlns='http://www.w3.org/2000/svg'
                viewBox='0 0 20 20'
                fill='currentColor'
                className='w-3 h-3 sm:w-4 sm:h-4 mr-0.5 sm:mr-1'
              >
                <path
                  fillRule='evenodd'
                  d='M1.22 5.222a.75.75 0 011.06 0L7 9.942l3.768-3.769a.75.75 0 011.113.058 20.908 20.908 0 013.813 7.254l1.574-2.727a.75.75 0 011.3.75l-2.475 4.286a.75.75 0 01-1.025.275l-4.287-2.475a.75.75 0 01.75-1.3l2.71 1.565a19.422 19.422 0 00-3.013-6.024L7.53 11.533a.75.75 0 01-1.06 0l-5.25-5.25a.75.75 0 010-1.06z'
                  clipRule='evenodd'
                />
              </svg>
            )}
            {trend.value}%
          </div>
        )}
      </div>

      {/* Background decoration */}
      <div className='absolute -right-12 -bottom-12 w-24 sm:w-32 h-24 sm:h-32 bg-[var(--gaming-purple)]/5 rounded-full transition-transform duration-300 group-hover:scale-150'></div>
    </div>
  )
}
