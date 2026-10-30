import { createContext, useCallback, useContext, useRef, useState } from 'react'

const ToastContext = createContext(() => {})

/** Kısa onay mesajları ("Kaydedildi"). Ekran okuyuculara aria-live ile duyurulur. */
export function ToastProvider({ children }) {
  const [toast, setToast] = useState(null)
  const timer = useRef(null)

  const show = useCallback((message, tone = 'ok') => {
    clearTimeout(timer.current)
    setToast({ message, tone, id: Date.now() })
    timer.current = setTimeout(() => setToast(null), 3200)
  }, [])

  return (
    <ToastContext.Provider value={show}>
      {children}
      <div className="toast-region" role="status" aria-live="polite">
        {toast && (
          <p key={toast.id} className={`toast toast--${toast.tone}`}>
            {toast.message}
          </p>
        )}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  return useContext(ToastContext)
}
