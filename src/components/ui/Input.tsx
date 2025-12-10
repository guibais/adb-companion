import { clsx } from 'clsx'
import type { InputHTMLAttributes } from 'react'

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
    label?: string
    error?: string
    icon?: React.ReactNode
}

export function Input({ label, error, icon, className, ...props }: InputProps) {
    return (
        <div className="w-full">
            {label && (
                <label className="block text-sm font-medium text-zinc-300 mb-1.5">
                    {label}
                </label>
            )}
            <div className="relative">
                {icon && (
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500">
                        {icon}
                    </div>
                )}
                <input
                    className={clsx(
                        'w-full px-4 py-2.5 bg-bg-tertiary border rounded-lg text-white',
                        'placeholder-zinc-500 focus:outline-none transition-colors',
                        error ? 'border-danger focus:border-danger' : 'border-border focus:border-accent',
                        icon && 'pl-10',
                        className
                    )}
                    {...props}
                />
            </div>
            {error && (
                <p className="mt-1 text-xs text-danger">{error}</p>
            )}
        </div>
    )
}
