import { useState, useEffect } from 'react'
import { Dashboard } from './pages/Dashboard'
import { Fila } from './pages/Fila'
import { Logs } from './pages/Logs'
import { Empresas } from './pages/Empresas'
import { ToastProvider } from './components/Toast'
import './App.css'

const ABAS = [
  { id: 'dashboard', label: 'Dashboard', icon: <img src="/dashboard.png" style={{ width: 35, height: 35 }} /> },
  { id: 'fila', label: 'Fila', icon: <img src="/fila.png" style={{ width: 35, height: 35 }} /> },
  { id: 'logs', label: 'Logs', icon: <img src="/logs.png" style={{ width: 35, height: 35 }} /> },
  { id: 'empresas', label: 'Empresas', icon: <img src="/empresa.png" style={{ width: 35, height: 35 }} /> },
]

export default function App() {
  const [aba, setAba] = useState('dashboard')
  const [tema, setTema] = useState(() => localStorage.getItem('tema') || 'dark')

  useEffect(() => {
    document.documentElement.classList.toggle('light', tema === 'light')
    localStorage.setItem('tema', tema)
  }, [tema])

  const toggleTema = () => setTema(t => t === 'dark' ? 'light' : 'dark')
  const isLight = tema === 'light'

  return (
    <ToastProvider>
      <div className="app">
        <aside className="sidebar">
          <div className="sidebar-logo">
            <img
              src={isLight ? '/logo-claro.jpg' : '/logo-escuro.png'}
              alt="BLTEC"
              style={{ width: '160px', objectFit: 'contain' }}
            />
          </div>
          <nav className="sidebar-nav">
            {ABAS.map(a => (
              <button
                key={a.id}
                className={`nav-item ${aba === a.id ? 'active' : ''}`}
                onClick={() => setAba(a.id)}
              >
                <span className="nav-icon">{a.icon}</span>
                <span>{a.label}</span>
              </button>
            ))}
          </nav>
          <div className="sidebar-footer">
            <div className="theme-toggle" onClick={toggleTema}>
              <div className={`toggle-switch ${isLight ? 'on' : ''}`}>
                <span className="toggle-icon-left">🌙</span>
                <div className="toggle-thumb" />
                <span className="toggle-icon-right">☀️</span>
              </div>
            </div>
          </div>
        </aside>
        <main className="main-content">
          {aba === 'dashboard' && <Dashboard />}
          {aba === 'fila'      && <Fila />}
          {aba === 'logs'      && <Logs />}
          {aba === 'empresas'  && <Empresas />}
        </main>
      </div>
    </ToastProvider>
  )
}
