import { useState, useEffect, useCallback, useRef } from 'react'
import { comandos as comandosApi } from '../services/api'
import { useToast } from '../components/Toast'

const API_URL   = import.meta.env.VITE_API_URL || 'http://localhost:8000'
const API_TOKEN = import.meta.env.VITE_API_TOKEN || 'bltec_master_token_2026'
const WS_URL    = API_URL.replace('http://', 'ws://').replace('https://', 'wss://')

function statusBadge(s) {
  const map = {
    PENDENTE: 'pendente', EXECUTANDO: 'executando',
    SUCESSO: 'sucesso', ERRO: 'erro', CANCELADO: 'cancelado'
  }
  return <span className={`badge badge-${map[s] || 'cancelado'}`}>{s}</span>
}

function formatarData(dt) {
  if (!dt) return '—'
  return new Date(dt).toLocaleString('pt-BR')
}

function agruparPorEmpresa(dados) {
  const grupos = {}
  for (const r of dados) {
    const key = r.CNPJ_COMANDO || r.NOME_EMPRESA || 'SEM_EMPRESA'
    if (!grupos[key]) {
      grupos[key] = {
        cnpj: r.CNPJ_COMANDO || '—',
        nome: r.NOME_EMPRESA || 'Empresa não identificada',
        comandos: []
      }
    }
    grupos[key].comandos.push(r)
  }
  return Object.values(grupos).sort((a, b) => a.nome.localeCompare(b.nome))
}

function GrupoEmpresa({ grupo, selecionados, onToggle, onToggleEmpresa, onCancelar }) {
  const [expandido, setExpandido] = useState(false)

  const todasSel   = grupo.comandos.every(c => selecionados.has(c.ID_COMANDO))
  const algumasSel = grupo.comandos.some(c => selecionados.has(c.ID_COMANDO))

  const pendente   = grupo.comandos.filter(c => c.STATUS_COMANDO === 'PENDENTE').length
  const executando = grupo.comandos.filter(c => c.STATUS_COMANDO === 'EXECUTANDO').length
  const sucesso    = grupo.comandos.filter(c => c.STATUS_COMANDO === 'SUCESSO').length
  const erro       = grupo.comandos.filter(c => c.STATUS_COMANDO === 'ERRO').length

  const thStyle = {
    padding: '10px 16px', textAlign: 'left', fontSize: 11,
    color: 'var(--text-muted)', textTransform: 'uppercase',
    borderBottom: '1px solid var(--border)'
  }
  const tdStyle = {
    padding: '11px 16px', borderBottom: '1px solid var(--border)',
    color: 'var(--text-primary)', fontSize: 13
  }

  return (
    <div className="grupo-empresa">
      <div className="grupo-header" onClick={() => setExpandido(e => !e)}>
        <div className="grupo-header-left">
          <input type="checkbox" checked={todasSel}
            ref={el => { if (el) el.indeterminate = algumasSel && !todasSel }}
            onChange={() => onToggleEmpresa(grupo.comandos)}
            onClick={e => e.stopPropagation()} className="grupo-checkbox" />
          <span className="grupo-arrow">{expandido ? '▼' : '▶'}</span>
          <div>
            <span className="grupo-nome">{grupo.nome}</span>
            <span className="grupo-cnpj">{grupo.cnpj}</span>
          </div>
        </div>
        <div className="grupo-stats">
          {pendente   > 0 && <span className="stat-badge stat-offline">{pendente} pendente</span>}
          {executando > 0 && <span className="stat-badge" style={{ background: 'rgba(77,143,255,0.15)', color: '#4d8fff' }}>{executando} executando</span>}
          {sucesso    > 0 && <span className="stat-badge stat-online">{sucesso} sucesso</span>}
          {erro       > 0 && <span className="stat-badge stat-erro">{erro} erro</span>}
          <span className="stat-badge stat-total">{grupo.comandos.length} cmd</span>
        </div>
      </div>

      {expandido && (
        <div className="grupo-maquinas">
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'var(--bg-primary)' }}>
                <th style={{ width: 40, ...thStyle }}></th>
                <th style={thStyle}>ID</th>
                <th style={thStyle}>Máquina</th>
                <th style={thStyle}>Tipo</th>
                <th style={thStyle}>Status</th>
                <th style={thStyle}>Criado em</th>
                <th style={thStyle}>Mensagem</th>
                <th style={{ ...thStyle, width: 80 }}></th>
              </tr>
            </thead>
            <tbody>
              {grupo.comandos.map(r => (
                <tr key={r.ID_COMANDO}
                  style={{ background: selecionados.has(r.ID_COMANDO) ? 'var(--bg-selected)' : 'transparent', cursor: 'pointer' }}
                  onClick={() => onToggle(r.ID_COMANDO)}>
                  <td style={tdStyle}>
                    <input type="checkbox" checked={selecionados.has(r.ID_COMANDO)}
                      onChange={() => onToggle(r.ID_COMANDO)} onClick={e => e.stopPropagation()} />
                  </td>
                  <td style={{ ...tdStyle, color: 'var(--text-muted)', fontSize: 12 }}>#{r.ID_COMANDO}</td>
                  <td style={tdStyle}>{r.HOSTNAME_COMANDO || '—'}</td>
                  <td style={tdStyle}>{r.TIPO_COMANDO}</td>
                  <td style={tdStyle}>{statusBadge(r.STATUS_COMANDO)}</td>
                  <td style={{ ...tdStyle, color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>{formatarData(r.DATA_CRIACAO)}</td>
                  <td style={{ ...tdStyle, color: 'var(--text-secondary)', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {r.MENSAGEM_RETORNO || '—'}
                  </td>
                  <td style={{ ...tdStyle, textAlign: 'right' }}>
                    {r.STATUS_COMANDO === 'PENDENTE' && (
                      <button className="btn btn-danger"
                        style={{ padding: '3px 10px', fontSize: 11 }}
                        onClick={e => { e.stopPropagation(); onCancelar(r.ID_COMANDO) }}>
                        ✕
                      </button>
                    )}
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
      const ws = new WebSocket(`${WS_URL}/ws/painel?token=${API_TOKEN}`)
      wsRef.current = ws
      ws.onopen  = () => { setStatus('conectado'); tentativas = 0 }
      ws.onmessage = (e) => { try { onMensagem(JSON.parse(e.data)) } catch {} }
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

export function Fila() {
  const [dados, setDados]               = useState([])
  const [filtro, setFiltro]             = useState('Todos')
  const [selecionados, setSelecionados] = useState(new Set())
  const [loading, setLoading]           = useState(true)
  const [wsStatus, setWsStatus]         = useState('conectando')
  const toast = useToast()

  const carregar = useCallback(async () => {
    try {
      const res = await comandosApi.listar(filtro)
      setDados(res.data)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [filtro])

  useEffect(() => {
    carregar()
    const t = setInterval(carregar, 15000)
    return () => clearInterval(t)
  }, [carregar])

  // WebSocket — atualiza quando status de comando muda
  const wsStatusReal = useWebSocket(useCallback((dados) => {
    if (dados.tipo === 'maquinas_online') carregar()
  }, [carregar]))

  useEffect(() => { setWsStatus(wsStatusReal) }, [wsStatusReal])

  const grupos = agruparPorEmpresa(filtro === 'Todos' ? dados : dados.filter(r => r.STATUS_COMANDO === filtro))

  const toggleSelecionado = (id) => {
    setSelecionados(prev => {
      const novo = new Set(prev)
      novo.has(id) ? novo.delete(id) : novo.add(id)
      return novo
    })
  }

  const toggleEmpresa = (comandos) => {
    setSelecionados(prev => {
      const novo = new Set(prev)
      const todasSel = comandos.every(c => novo.has(c.ID_COMANDO))
      comandos.forEach(c => todasSel ? novo.delete(c.ID_COMANDO) : novo.add(c.ID_COMANDO))
      return novo
    })
  }

  const cancelarComando = async (id) => {
    await comandosApi.cancelar(id)
    carregar()
    toast('Comando cancelado!', 'sucesso')
  }

  const cancelarSelecionados = async () => {
    if (selecionados.size === 0) {
      toast('Selecione ao menos um item.', 'aviso')
      return
    }
    for (const id of selecionados) {
      await comandosApi.cancelar(id)
    }
    setSelecionados(new Set())
    carregar()
    toast(`${selecionados.size} comando(s) cancelado(s)!`, 'sucesso')
  }

  const wsCorStatus = { conectado: '#00cc88', reconectando: '#ffaa33', erro: '#ff5555', conectando: '#888' }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <h1 className="page-title" style={{ marginBottom: 0 }}>Fila de Atualizações</h1>
          <span style={{ fontSize: 11, color: wsCorStatus[wsStatus] || '#888', display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: wsCorStatus[wsStatus], display: 'inline-block' }}></span>
            {wsStatus === 'conectado' ? 'Tempo real' : wsStatus}
          </span>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <select className="select-input" value={filtro} onChange={e => setFiltro(e.target.value)}>
            <option>Todos</option>
            <option>PENDENTE</option>
            <option>EXECUTANDO</option>
            <option>SUCESSO</option>
            <option>ERRO</option>
            <option>CANCELADO</option>
          </select>
          <button className="btn btn-danger" onClick={cancelarSelecionados}>✕ Cancelar selecionados</button>
          <button className="btn btn-secondary" onClick={carregar}>↻ Atualizar</button>
        </div>
      </div>

      {loading ? <div className="loading">Carregando...</div> : grupos.length === 0 ? (
        <div className="empty">Nenhum comando encontrado</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {grupos.map(grupo => (
            <GrupoEmpresa
              key={grupo.cnpj}
              grupo={grupo}
              selecionados={selecionados}
              onToggle={toggleSelecionado}
              onToggleEmpresa={toggleEmpresa}
              onCancelar={cancelarComando}
            />
          ))}
        </div>
      )}
    </div>
  )
}
