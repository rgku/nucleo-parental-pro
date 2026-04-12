import * as React from 'react'
import { cn } from '@/lib/utils'

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, label, error, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-on-surface mb-2">
            {label}
          </label>
        )}
        <input
          type={type}
          className={cn(
            'flex h-10 w-full rounded-lg border border-outline-variant/15 bg-surface-container-lowest px-4 py-2 text-sm',
            'focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary',
            'placeholder:text-secondary/50',
            'disabled:cursor-not-allowed disabled:opacity-50',
            'transition-colors',
            error && 'border-orange-soft focus:border-orange-soft focus:ring-orange-soft',
            className
          )}
          ref={ref}
          {...props}
        />
        {error && (
          <p className="mt-1 text-xs text-orange-soft">{error}</p>
        )}
      </div>
    )
  }
)
Input.displayName = 'Input'

export { Input }