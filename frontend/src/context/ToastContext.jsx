import React, { createContext, useState, useContext, useCallback, useRef } from 'react';
import { FaCheckCircle, FaInfoCircle, FaExclamationTriangle } from 'react-icons/fa';
import '../styles/Toast.css';

export const ToastContext = createContext();

const ToastIcon = ({ type }) => {
  if (type === 'success') return <FaCheckCircle className="toastIcon toastIconSuccess" />;
  if (type === 'error') return <FaExclamationTriangle className="toastIcon toastIconError" />;
  return <FaInfoCircle className="toastIcon toastIconInfo" />;
};

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);
  const idRef = useRef(0);

  const dismissToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback((message, type = 'success', duration = 3000) => {
    const id = ++idRef.current;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => dismissToast(id), duration);
  }, [dismissToast]);

  const value = { showToast };

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="toastContainer" aria-live="polite">
        {toasts.map((toast) => (
          <div key={toast.id} className={`toastItem toastItem${toast.type ? toast.type[0].toUpperCase() + toast.type.slice(1) : 'Info'}`} onClick={() => dismissToast(toast.id)}>
            <ToastIcon type={toast.type} />
            <span className="toastMessage">{toast.message}</span>
            <button className="toastCloseBtn" aria-label="Dismiss">×</button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => useContext(ToastContext);
