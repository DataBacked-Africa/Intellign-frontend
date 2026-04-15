import toast, { Toast } from 'react-hot-toast';
import { CheckCircle, XCircle, AlertTriangle, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface CustomToastProps {
    t: Toast;
    type: ToastType;
    message: string;
    description?: string;
}

const icons = {
    success: CheckCircle,
    error: XCircle,
    warning: AlertTriangle,
    info: Info,
};

const colors = {
    success: 'bg-emerald-50 border-emerald-200 text-emerald-800',
    error: 'bg-red-50 border-red-200 text-red-800',
    warning: 'bg-amber-50 border-amber-200 text-amber-800',
    info: 'bg-blue-50 border-blue-200 text-blue-800',
};

const iconColors = {
    success: 'text-emerald-500',
    error: 'text-red-500',
    warning: 'text-amber-500',
    info: 'text-blue-500',
};

const toStr = (val: unknown): string => {
    if (typeof val === 'string') return val;
    if (val == null) return '';
    if (val instanceof Error) return val.message;
    return JSON.stringify(val);
};

export const CustomToast = ({ t, type, message, description }: CustomToastProps) => {
    const Icon = icons[type];
    const safeMessage = toStr(message);
    const safeDescription = toStr(description);

    return (
        <div
            className={cn(
                "max-w-md w-full bg-white shadow-lg rounded-xl pointer-events-auto flex ring-1 ring-black ring-opacity-5 transition-all duration-300",
                t.visible ? "animate-enter" : "animate-leave",
                colors[type]
            )}
        >
            <div className="flex-1 w-0 p-4">
                <div className="flex items-start">
                    <div className="flex-shrink-0 pt-0.5">
                        <Icon className={cn("h-6 w-6", iconColors[type])} />
                    </div>
                    <div className="ml-3 flex-1">
                        <p className="text-sm font-semibold">{safeMessage}</p>
                        {safeDescription && (
                            <p className="mt-1 text-sm opacity-90">{safeDescription}</p>
                        )}
                    </div>
                </div>
            </div>
            <div className="flex border-l border-black/5">
                <button
                    onClick={() => toast.dismiss(t.id)}
                    className="w-full border-transparent rounded-none rounded-r-lg p-4 flex items-center justify-center text-sm font-medium opacity-70 hover:opacity-100 focus:outline-none"
                >
                    Close
                </button>
            </div>
        </div>
    );
};

export const showToast = {
    success: (message: string, description?: string) =>
        toast.custom((t) => <CustomToast t={t} type="success" message={message} description={description} />),
    error: (message: string, description?: string) =>
        toast.custom((t) => <CustomToast t={t} type="error" message={message} description={description} />),
    warning: (message: string, description?: string) =>
        toast.custom((t) => <CustomToast t={t} type="warning" message={message} description={description} />),
    info: (message: string, description?: string) =>
        toast.custom((t) => <CustomToast t={t} type="info" message={message} description={description} />),
};
