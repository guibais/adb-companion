import { clsx } from 'clsx'
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react'
import { useUiStore } from '../../stores'

const icons = {
    success: CheckCircle,
    error: XCircle,
    warning: AlertTriangle,
    info: Info
}

const styles = {
    success: 'bg-green-500/10 border-green-500/30 text-green-400',
    error: 'bg-red-500/10 border-red-500/30 text-red-400',
    warning: 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400',
    info: 'bg-blue-500/10 border-blue-500/30 text-blue-400'
}

export function ToastContainer() {
    const { toasts, removeToast } = useUiStore()

    return (
        <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
            {toasts.map((toast) => {
                const Icon = icons[toast.type]

                return (
                    <div
                        key={toast.id}
                        className={clsx(
                            'flex items-start gap-3 px-4 py-3 rounded-lg border animate-slide-up',
                            'min-w-[300px] max-w-[400px]',
                            styles[toast.type]
                        )}
                    >
                        <Icon className="w-5 h-5 flex-shrink-0 mt-0.5" />
                        <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm">{toast.title}</p>
                            {toast.message && (
                                <p className="text-xs opacity-80 mt-0.5">{toast.message}</p>
                            )}
                        </div>
                        <button
                            onClick={() => removeToast(toast.id)}
                            className="p-0.5 hover:bg-white/10 rounded transition-colors"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                )
            })}
        </div>
    )
}
