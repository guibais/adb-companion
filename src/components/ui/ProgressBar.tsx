import { clsx } from 'clsx'

type ProgressBarProps = {
    value: number
    max?: number
    size?: 'sm' | 'md' | 'lg'
    showLabel?: boolean
    label?: string
    className?: string
}

export function ProgressBar({
    value,
    max = 100,
    size = 'md',
    showLabel = false,
    label,
    className
}: ProgressBarProps) {
    const percentage = Math.min(Math.max((value / max) * 100, 0), 100)

    const sizeStyles = {
        sm: 'h-1',
        md: 'h-2',
        lg: 'h-3'
    }

    return (
        <div className={clsx('w-full', className)}>
            {(showLabel || label) && (
                <div className="flex justify-between items-center mb-1">
                    <span className="text-xs text-zinc-400">{label}</span>
                    {showLabel && (
                        <span className="text-xs text-zinc-400">{Math.round(percentage)}%</span>
                    )}
                </div>
            )}
            <div className={clsx('w-full bg-bg-tertiary rounded-full overflow-hidden', sizeStyles[size])}>
                <div
                    className="h-full bg-gradient-to-r from-accent to-green-400 rounded-full transition-all duration-300"
                    style={{ width: `${percentage}%` }}
                />
            </div>
        </div>
    )
}
