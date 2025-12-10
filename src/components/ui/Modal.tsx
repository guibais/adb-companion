import { useEffect } from 'react'
import { clsx } from 'clsx'
import { X } from 'lucide-react'

type ModalProps = {
    isOpen: boolean
    onClose: () => void
    title?: string
    children: React.ReactNode
    size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl'
    showCloseButton?: boolean
}

const sizeStyles = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    '3xl': 'max-w-3xl'
}

export function Modal({
    isOpen,
    onClose,
    title,
    children,
    size = 'md',
    showCloseButton = true
}: ModalProps) {
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose()
        }

        if (isOpen) {
            document.addEventListener('keydown', handleEscape)
            document.body.style.overflow = 'hidden'
        }

        return () => {
            document.removeEventListener('keydown', handleEscape)
            document.body.style.overflow = ''
        }
    }, [isOpen, onClose])

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={onClose}
            />
            <div
                className={clsx(
                    'relative w-full mx-4 bg-bg-secondary border border-border rounded-xl shadow-2xl animate-fade-in',
                    sizeStyles[size]
                )}
            >
                {(title || showCloseButton) && (
                    <div className="flex items-center justify-between px-6 py-4 border-b border-border">
                        {title && (
                            <h2 className="text-lg font-semibold text-white">{title}</h2>
                        )}
                        {showCloseButton && (
                            <button
                                onClick={onClose}
                                className="p-1 text-zinc-400 hover:text-white hover:bg-bg-tertiary rounded-lg transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        )}
                    </div>
                )}
                <div className="p-6">{children}</div>
            </div>
        </div>
    )
}
