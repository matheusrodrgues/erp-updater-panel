import { useState, useEffect, useCallback, useRef } from 'react'
import { maquinas as maquinasApi, comandos as comandosApi, logs as logsApi } from '../services/api'
import { useToast } from '../components/Toast'

const API_URL   = import.meta.env.VITE_API_URL || 'http://localhost:8000'
const API_TOKEN = import.meta.env.VITE_API_TOKEN || 'bltec_master_token_2026'
const WS_URL    = API_URL.replace('http://', 'ws://').replace('https://', 'wss://')

function MetricCard({ label, valor, cor, ativo, onClick }) {
  return (
    <div className="metric-card" onClick={onClick}
      style={{ cursor: onClick ? 'pointer' : 'default', outline: ativo ? `2px solid ${cor}` : 'none' }}>
      <div className="metric-label">{label}</div>
      <div className="metric-value" style={{ color: cor }}>{valor}</div>
    </div>
  )
}

function statusBadge(s) {
  const map = { ONLINE: 'online', OFFLINE: 'offline', ERRO: 'erro', SUCESSO: 'sucesso', PENDENTE: 'pendente' }
  return <span className={`badge badge-${map[s] || 'cancelado'}`}>{s}</span>
}

function formatarUltimoContato(dt) {
  if (!dt) return '—'
  const d    = new Date(dt)
  const diff = Math.floor((new Date() - d) / 1000)
  if (diff < 60)    return `${diff}s atrás`
  if (diff < 3600)  return `${Math.floor(diff / 60)}min atrás`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h atrás`
  return d.toLocaleString('pt-BR')
}

function agruparPorEmpresa(dados) {
  const grupos = {}
  for (const r of dados) {
    const key = r.CNPJ_MAQUINA || 'SEM_CNPJ'
    if (!grupos[key]) grupos[key] = {
      cnpj: r.CNPJ_MAQUINA || '—',
      nome: r.NOME_EMPRESA || 'Empresa não identificada',
      maquinas: []
    }
    grupos[key].maquinas.push(r)
  }
  return Object.values(grupos).sort((a, b) => a.nome.localeCompare(b.nome))
}

function ModalConfirmar({ dados, onConfirmar, onFechar }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={onFechar}>
      <div style={{ background: 'var(--bg-secondary)', borderRadius: 14, border: '1px solid var(--border)', width: 440, padding: 28 }} onClick={e => e.stopPropagation()}>
        <h2 style={{ margin: '0 0 12px', fontSize: 16, color: 'var(--text-primary)' }}>⚠ Confirmar ação</h2>
        <p style={{ margin: '0 0 24px', fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>{dados.mensagem}</p>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button className="btn btn-secondary" onClick={onFechar}>Cancelar</button>
          <button className="btn btn-success" onClick={onConfirmar}>▶ Confirmar</button>
        </div>
      </div>
    </div>
  )
}

function ModalHistorico({ maquina, onFechar }) {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    logsApi.listar({ servidor: maquina.HOSTNAME_MAQUINA, limite: 50 })
      .then(res => setLogs(res.data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [maquina.HOSTNAME_MAQUINA])

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={onFechar}>
      <div style={{ background: 'var(--bg-secondary)', borderRadius: 14, border: '1px solid var(--border)', width: '80%', maxWidth: 900, maxHeight: '80vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }} onClick={e => e.stopPropagation()}>
        <div style={{ padding: '18px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontWeight: 600, fontSize: 16, color: 'var(--text-primary)' }}>{maquina.HOSTNAME_MAQUINA}</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{maquina.NOME_EMPRESA} • {maquina.CNPJ_MAQUINA} • Versão: {maquina.VERSAO_MAQUINA || '—'}</div>
          </div>
          <button className="btn btn-secondary" onClick={onFechar} style={{ padding: '6px 14px' }}>✕ Fechar</button>
        </div>
        <div style={{ overflowY: 'auto', flex: 1 }}>
          {loading ? <div className="loading">Carregando histórico...</div> : logs.length === 0 ? (
            <div className="empty">Nenhum log encontrado</div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: 'var(--bg-primary)', position: 'sticky', top: 0 }}>
                  {['Data/Hora','Versão','Etapa','Status','Mensagem'].map(h => (
                    <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', borderBottom: '1px solid var(--border)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {logs.map(r => (
                  <tr key={r.ID_LOGS}>
                    <td style={{ padding: '10px 16px', borderBottom: '1px solid var(--border)', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>{r.DATA_HORA_LOGS ? new Date(r.DATA_HORA_LOGS).toLocaleString('pt-BR') : '—'}</td>
                    <td style={{ padding: '10px 16px', borderBottom: '1px solid var(--border)', color: 'var(--accent)', fontFamily: 'monospace', fontSize: 12 }}>{r.VERSAO_LOGS || '—'}</td>
                    <td style={{ padding: '10px 16px', borderBottom: '1px solid var(--border)', color: 'var(--text-primary)' }}>{r.ETAPA_LOGS || '—'}</td>
                    <td style={{ padding: '10px 16px', borderBottom: '1px solid var(--border)' }}>{statusBadge(r.STATUS_LOGS)}</td>
                    <td style={{ padding: '10px 16px', borderBottom: '1px solid var(--border)', color: 'var(--text-secondary)', maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.MENSAGEM_LOGS || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}

function GrupoEmpresa({ grupo, selecionados, onToggle, onToggleEmpresa, onVerHistorico }) {
  const [expandido, setExpandido] = useState(false)
  const todasSel   = grupo.maquinas.every(m => selecionados.has(m.HOSTNAME_MAQUINA))
  const algumasSel = grupo.maquinas.some(m => selecionados.has(m.HOSTNAME_MAQUINA))
  const online  = grupo.maquinas.filter(m => m.STATUS_MAQUINA === 'ONLINE').length
  const offline = grupo.maquinas.filter(m => m.STATUS_MAQUINA === 'OFFLINE').length
  const erro    = grupo.maquinas.filter(m => m.STATUS_MAQUINA === 'ERRO').length
  const thStyle = { padding: '10px 16px', textAlign: 'left', fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', borderBottom: '1px solid var(--border)' }
  const tdStyle = { padding: '12px 16px', borderBottom: '1px solid var(--border)', color: 'var(--text-primary)' }

  return (
    <div className="grupo-empresa">
      <div className="grupo-header" onClick={() => setExpandido(e => !e)}>
        <div className="grupo-header-left">
          <input type="checkbox" checked={todasSel}
            ref={el => { if (el) el.indeterminate = algumasSel && !todasSel }}
            onChange={() => onToggleEmpresa(grupo.maquinas)}
            onClick={e => e.stopPropagation()} className="grupo-checkbox" />
          <span className="grupo-arrow">{expandido ? '▼' : '▶'}</span>
          <div>
            <span className="grupo-nome">{grupo.nome}</span>
            <span className="grupo-cnpj">{grupo.cnpj}</span>
          </div>
        </div>
        <div className="grupo-stats">
          {online  > 0 && <span className="stat-badge stat-online">{online} online</span>}
          {offline > 0 && <span className="stat-badge stat-offline">{offline} offline</span>}
          {erro    > 0 && <span className="stat-badge stat-erro">{erro} erro</span>}
          <span className="stat-badge stat-total">{grupo.maquinas.length} máq.</span>
        </div>
      </div>
      {expandido && (
        <div className="grupo-maquinas">
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: 'var(--bg-primary)' }}>
                <th style={{ width: 40, ...thStyle }}></th>
                <th style={thStyle}>Máquina</th>
                <th style={thStyle}>Versão</th>
                <th style={thStyle}>Último contato</th>
                <th style={thStyle}>Status</th>
                <th style={{ ...thStyle, width: 80 }}></th>
              </tr>
            </thead>
            <tbody>
              {grupo.maquinas.map(m => (
                <tr key={m.HOSTNAME_MAQUINA}
                  style={{ background: selecionados.has(m.HOSTNAME_MAQUINA) ? 'var(--bg-selected)' : 'transparent', cursor: 'pointer' }}
                  onClick={() => onToggle(m.HOSTNAME_MAQUINA)}>
                  <td style={tdStyle}>
                    <input type="checkbox" checked={selecionados.has(m.HOSTNAME_MAQUINA)}
                      onChange={() => onToggle(m.HOSTNAME_MAQUINA)} onClick={e => e.stopPropagation()} />
                  </td>
                  <td style={tdStyle}>{m.HOSTNAME_MAQUINA || '—'}</td>
                  <td style={{ ...tdStyle, color: m.VERSAO_MAQUINA ? 'var(--accent)' : 'var(--text-muted)', fontFamily: 'monospace', fontSize: 12 }}>
                    {m.VERSAO_MAQUINA || '—'}
                  </td>
                  <td style={{ ...tdStyle, color: 'var(--text-secondary)' }}>{formatarUltimoContato(m.ULTIMA_VEZ_ONLINE)}</td>
                  <td style={tdStyle}>{statusBadge(m.STATUS_MAQUINA)}</td>
                  <td style={{ ...tdStyle, textAlign: 'right' }}>
                    <button className="btn btn-secondary" style={{ padding: '4px 10px', fontSize: 11 }}
                      onClick={e => { e.stopPropagation(); onVerHistorico(m) }}>📋 Histórico</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function useWebSocket(onMensagem) {
  const wsRef = useRef(null)
  const [status, setStatus] = useState('conectando')

  useEffect(() => {
    let tentativas = 0
    let timeoutId

    function conectar() {
      const url = `${WS_URL}/ws/painel?token=${API_TOKEN}`
      const ws  = new WebSocket(url)
      wsRef.current = ws

      ws.onopen = () => { setStatus('conectado'); tentativas = 0 }
      ws.onmessage = (e) => {
        try { onMensagem(JSON.parse(e.data)) } catch {}
      }
      ws.onclose = () => {
        setStatus('reconectando')
        tentativas++
        timeoutId = setTimeout(conectar, Math.min(1000 * tentativas, 10000))
      }
      ws.onerror = () => setStatus('erro')
    }

    conectar()
    return () => { clearTimeout(timeoutId); wsRef.current?.close() }
  }, [])

  return status
}

export function Dashboard() {
  const [dados, setDados]       = useState([])
  const [metricas, setMetricas] = useState({ TOTAL: 0, ONLINE: 0, OFFLINE: 0, ERRO: 0 })
  const [busca, setBusca]       = useState('')
  const [filtroStatus, setFiltroStatus] = useState('TODOS')
  const [selecionados, setSelecionados] = useState(new Set())
  const [loading, setLoading]   = useState(true)
  const [maquinaHistorico, setMaquinaHistorico] = useState(null)
  const [wsStatus, setWsStatus] = useState('conectando')
  const [modalConfirmar, setModalConfirmar] = useState(null)
  const toast = useToast()

  const carregar = useCallback(async () => {
    try {
      const [resMaq, resMet] = await Promise.all([
        maquinasApi.listar(),
        maquinasApi.metricas()
      ])
      setDados(resMaq.data)
      setMetricas(resMet.data)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { carregar() }, [carregar])

  const wsStatusReal = useWebSocket(useCallback((dados) => {
    if (dados.tipo === 'maquinas_online') carregar()
  }, [carregar]))

  useEffect(() => { setWsStatus(wsStatusReal) }, [wsStatusReal])

  const filtrados = dados.filter(r => {
    const b = busca.toLowerCase()
    const buscaOk = !b || r.HOSTNAME_MAQUINA?.toLowerCase().includes(b) ||
      r.CNPJ_MAQUINA?.toLowerCase().includes(b) || r.NOME_EMPRESA?.toLowerCase().includes(b)
    return buscaOk && (filtroStatus === 'TODOS' || r.STATUS_MAQUINA === filtroStatus)
  })

  const grupos = agruparPorEmpresa(filtrados)
  const toggleFiltroStatus = (s) => setFiltroStatus(prev => prev === s ? 'TODOS' : s)

  const toggleSelecionado = (hostname) => {
    setSelecionados(prev => {
      const novo = new Set(prev)
      novo.has(hostname) ? novo.delete(hostname) : novo.add(hostname)
      return novo
    })
  }

  const toggleEmpresa = (maquinas) => {
    setSelecionados(prev => {
      const novo = new Set(prev)
      const todasSel = maquinas.every(m => novo.has(m.HOSTNAME_MAQUINA))
      maquinas.forEach(m => todasSel ? novo.delete(m.HOSTNAME_MAQUINA) : novo.add(m.HOSTNAME_MAQUINA))
      return novo
    })
  }

  const getSelecionados = () => dados.filter(r => selecionados.has(r.HOSTNAME_MAQUINA))

  const enfileirar = async (lista, tipo) => {
    if (lista.length === 0) {
      toast('Selecione ao menos uma máquina.', 'aviso')
      return
    }
    for (const r of lista) {
      await comandosApi.criar({ cnpj: r.CNPJ_MAQUINA, hostname: r.HOSTNAME_MAQUINA, nome_empresa: r.NOME_EMPRESA || '', tipo })
    }
    toast(`${lista.length} comando(s) enfileirado(s)!`, 'sucesso')
  }

  const wsCorStatus = { conectado: '#00cc88', reconectando: '#ffaa33', erro: '#ff5555', conectando: '#888' }

  return (
    <div>
      {maquinaHistorico && <ModalHistorico maquina={maquinaHistorico} onFechar={() => setMaquinaHistorico(null)} />}

      {modalConfirmar && (
        <ModalConfirmar
          dados={modalConfirmar}
          onConfirmar={() => { enfileirar(modalConfirmar.lista, modalConfirmar.tipo); setModalConfirmar(null) }}
          onFechar={() => setModalConfirmar(null)}
        />
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <h1 className="page-title" style={{ marginBottom: 0 }}>Dashboard</h1>
          <span style={{ fontSize: 11, color: wsCorStatus[wsStatus] || '#888', display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: wsCorStatus[wsStatus], display: 'inline-block' }}></span>
            {wsStatus === 'conectado' ? 'Tempo real' : wsStatus}
          </span>
        </div>
      </div>

      <div className="cards-grid">
        <MetricCard label="Total de máquinas" valor={metricas.TOTAL} cor="#4d8fff" ativo={filtroStatus === 'TODOS'} onClick={() => setFiltroStatus('TODOS')} />
        <MetricCard label="Online" valor={metricas.ONLINE} cor="#00cc88" ativo={filtroStatus === 'ONLINE'} onClick={() => toggleFiltroStatus('ONLINE')} />
        <MetricCard label="Offline" valor={metricas.OFFLINE} cor="#ffaa33" ativo={filtroStatus === 'OFFLINE'} onClick={() => toggleFiltroStatus('OFFLINE')} />
        <MetricCard label="Com erro" valor={metricas.ERRO} cor="#ff5555" ativo={filtroStatus === 'ERRO'} onClick={() => toggleFiltroStatus('ERRO')} />
      </div>

      {filtroStatus !== 'TODOS' && (
        <div style={{ marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Filtrando por:</span>
          <span className={`badge badge-${filtroStatus.toLowerCase()}`}>{filtroStatus}</span>
          <button className="btn btn-secondary" style={{ padding: '2px 10px', fontSize: 12 }} onClick={() => setFiltroStatus('TODOS')}>× Limpar</button>
        </div>
      )}

      <div className="toolbar">
        <input className="search-input" placeholder="🔍 Buscar empresa, máquina ou CNPJ..."
          value={busca} onChange={e => setBusca(e.target.value)} />
        <button className="btn btn-danger" onClick={() => enfileirar(getSelecionados(), 'ROLLBACK')}>↩ Rollback</button>
        <button className="btn btn-primary" onClick={() => enfileirar(getSelecionados(), 'ATUALIZAR')}>Atualizar selecionados</button>
        <button className="btn btn-success" onClick={() => setModalConfirmar({
          lista: dados,
          tipo: 'ATUALIZAR',
          mensagem: `Deseja disparar atualização para todas as ${dados.length} máquinas cadastradas? Essa ação enviará o comando para todas as máquinas independente do status.`
        })}>▶ Disparar todos</button>
      </div>

      {loading ? <div className="loading">Carregando...</div> : grupos.length === 0 ? (
        <div className="empty">{filtroStatus !== 'TODOS' ? `Nenhuma máquina com status ${filtroStatus}` : 'Nenhuma máquina encontrada'}</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {grupos.map(grupo => (
            <GrupoEmpresa key={grupo.cnpj} grupo={grupo} selecionados={selecionados}
              onToggle={toggleSelecionado} onToggleEmpresa={toggleEmpresa} onVerHistorico={setMaquinaHistorico} />
          ))}
        </div>
      )}
    </div>
  )
}
