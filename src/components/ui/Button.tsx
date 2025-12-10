import { clsx } from 'clsx'
import type { ButtonHTMLAttributes, ReactNode } from 'react'

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost'
type ButtonSize = 'sm' | 'md' | 'lg'

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: ButtonVariant
    size?: ButtonSize
    loading?: boolean
    icon?: ReactNode
    children?: ReactNode
}

const variantStyles: Record<ButtonVariant, string> = {
    primary: 'bg-accent hover:bg-accent-hover text-white',
    secondary: 'bg-bg-tertiary hover:bg-zinc-700 text-white border border-border',
    danger: 'bg-danger hover:bg-red-600 text-white',
    ghost: 'bg-transparent hover:bg-bg-tertiary text-zinc-400 hover:text-white'
}

const sizeStyles: Record<ButtonSize, string> = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base'
}

export function Button({
    variant = 'primary',
    size = 'md',
    loading = false,
    icon,
    children,
    className,
    disabled,
    ...props
}: ButtonProps) {
    return (
        <button
            className={clsx(
                'inline-flex items-center justify-center gap-2 font-medium rounded-lg transition-all',
                'focus:outline-none focus:ring-2 focus:ring-accent/50',
                'disabled:opacity-50 disabled:cursor-not-allowed',
                variantStyles[variant],
                sizeStyles[size],
                className
            )}
            disabled={disabled || loading}
            {...props}
        >
            {loading ? (
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
            ) : icon}
            {children}
        </button>
    )
}
