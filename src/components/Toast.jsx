// src/components/Toast.jsx
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
        // --- FIX: Added 'justify-center' to center the content inside the toast ---
        <div className="bg-neutral-800 text-white p-4 rounded-md shadow-lg flex justify-center items-center gap-3 animate-fade-in-down min-w-[300px]">
            {icons[type]}
            <span>{message}</span>
        </div>
    );
};

export const ToastContainer = ({ toasts, removeToast }) => {
    return (
        // --- FIX: Ensured the container itself is perfectly centered ---
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center gap-2">
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