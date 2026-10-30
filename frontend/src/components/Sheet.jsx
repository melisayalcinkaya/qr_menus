import { useEffect, useRef } from 'react'
import { X } from 'lucide-react'

/**
 * Erişilebilir alt panel / iletişim kutusu. Yerel <dialog> öğesi odak tuzağını,
 * Esc ile kapanmayı ve arka planın etkisizleşmesini tarayıcıya bırakır.
 */
export default function Sheet({ open, onClose, title, children, closeLabel = 'Kapat', className = '' }) {
  const ref = useRef(null)

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (open && !dialog.open) dialog.showModal?.()
    if (!open && dialog.open) dialog.close?.()
  }, [open])

  return (
    <dialog
      ref={ref}
      className={`sheet ${className}`}
      aria-labelledby="sheet-title"
      onClose={onClose}
      onClick={(e) => e.target === ref.current && onClose()}
    >
      {open && (
        <div className="sheet__body">
          <header className="sheet__header">
            <h2 id="sheet-title">{title}</h2>
            <button type="button" className="icon-button" onClick={onClose} aria-label={closeLabel}>
              <X size={20} />
            </button>
          </header>
          {children}
        </div>
      )}
    </dialog>
  )
}
