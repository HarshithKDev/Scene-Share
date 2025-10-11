import React from 'react';
import { XCircle, CheckCircle, Info, AlertTriangle } from 'lucide-react';

const Toast = ({ message, type = 'info', onDismiss }) => {
    const icons = {
        success: <CheckCircle className="text-green-500" />,
        error: <XCircle className="text-red-500" />,
        info: <Info className="text-blue-500" />,
        warning: <AlertTriangle className="text-yellow-500" />,
    };

    return (
        <div className="bg-neutral-800 text-white py-3 px-5 rounded-full shadow-lg flex items-center gap-3 animate-fade-in-down">
            {icons[type]}
            <span className="whitespace-nowrap text-sm font-medium">{message}</span>
        </div>
    );
};

export const ToastContainer = ({ toasts, removeToast }) => {
    return (
        // --- MODIFICATION: Moved the container down to avoid overlapping the header ---
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center gap-2 px-4">
            {(toasts || []).map((toast) => (
                <Toast 
                    key={toast.id} 
                    message={toast.message} 
                    type={toast.type} 
                    onDismiss={() => removeToast(toast.id)} 
                />
            ))}
        </div>
    );
};

export default Toast;

