import { useState, useEffect, useCallback, createContext, useContext } from 'react'

// ── CONTEXT ──
const ToastContext = createContext(null)

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const addToast = useCallback((mensagem, tipo = 'sucesso', duracao = 3000) => {
    const id = Date.now()
    setToasts(prev => [...prev, { id, mensagem, tipo }])
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id))
    }, duracao)
  }, [])

  const removeToast = (id) => setToasts(prev => prev.filter(t => t.id !== id))

  const cores = {
    sucesso: { bg: '#003320', color: '#00cc88', border: '#005533' },
    erro:    { bg: '#330000', color: '#ff5555', border: '#660000' },
    aviso:   { bg: '#332500', color: '#ffaa33', border: '#664400' },
    info:    { bg: '#001a40', color: '#4d8fff', border: '#003380' },
  }

  const icones = { sucesso: '✓', erro: '✕', aviso: '⚠', info: 'ℹ' }

  return (
    <ToastContext.Provider value={addToast}>
      {children}
      <div style={{
        position: 'fixed', bottom: 24, right: 24,
        display: 'flex', flexDirection: 'column', gap: 10,
        zIndex: 9999, maxWidth: 380
      }}>
        {toasts.map(t => {
          const c = cores[t.tipo] || cores.info
          return (
            <div key={t.id} style={{
              background: c.bg, color: c.color,
              border: `1px solid ${c.border}`,
              borderRadius: 10, padding: '12px 16px',
              display: 'flex', alignItems: 'center', gap: 10,
              boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
              animation: 'slideIn 0.2s ease',
              fontSize: 14, fontWeight: 500
            }}>
              <span style={{ fontSize: 16, fontWeight: 700 }}>{icones[t.tipo]}</span>
              <span style={{ flex: 1 }}>{t.mensagem}</span>
              <button onClick={() => removeToast(t.id)} style={{
                background: 'none', border: 'none', color: c.color,
                cursor: 'pointer', fontSize: 16, padding: 0, opacity: 0.7
              }}>✕</button>
            </div>
          )
        })}
      </div>
      <style>{`
        @keyframes slideIn {
          from { opacity: 0; transform: translateX(20px); }
          to   { opacity: 1; transform: translateX(0); }
        }
      `}</style>
    </ToastContext.Provider>
  )
}

export function useToast() {
  return useContext(ToastContext)
}
