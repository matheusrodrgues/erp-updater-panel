import { useState, useEffect, useCallback } from 'react'
import { logs as logsApi } from '../services/api'

function statusBadge(s) {
  const map = { SUCESSO: 'sucesso', ERRO: 'erro', PENDENTE: 'pendente' }
  return <span className={`badge badge-${map[s] || 'cancelado'}`}>{s}</span>
}

export function Logs() {
  const [dados, setDados] = useState([])
  const [filtroEtapa, setFiltroEtapa] = useState('')
  const [filtroStatus, setFiltroStatus] = useState('')
  const [loading, setLoading] = useState(true)

  const carregar = useCallback(async () => {
    try {
      const res = await logsApi.listar({
        etapa:  filtroEtapa  || undefined,
        status: filtroStatus || undefined,
        limite: 100
      })
      setDados(res.data)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [filtroEtapa, filtroStatus])

  useEffect(() => { carregar() }, [carregar])

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 className="page-title" style={{ marginBottom: 0 }}>Logs</h1>
        <div style={{ display: 'flex', gap: 10 }}>
          <select className="select-input" value={filtroEtapa} onChange={e => setFiltroEtapa(e.target.value)}>
            <option value="">Todas as etapas</option>
            <option>INICIO</option>
            <option>BACKUP</option>
            <option>DESINSTALAR</option>
            <option>VALIDAR_CRC</option>
            <option>INSTALAR</option>
            <option>FINAL</option>
            <option>ROLLBACK</option>
            <option>ERRO</option>
            <option>CRC</option>
          </select>
          <select className="select-input" value={filtroStatus} onChange={e => setFiltroStatus(e.target.value)}>
            <option value="">Todos os status</option>
            <option>SUCESSO</option>
            <option>ERRO</option>
            <option>PUBLICADO</option>
          </select>
          <button className="btn btn-secondary" onClick={carregar}>↻ Atualizar</button>
        </div>
      </div>

      <div className="table-wrapper">
        {loading ? <div className="loading">Carregando...</div> : (
          <table>
            <thead>
              <tr>
                <th>Data/Hora</th>
                <th>Empresa</th>
                <th>Versão</th>
                <th>Etapa</th>
                <th>Status</th>
                <th>Mensagem</th>
              </tr>
            </thead>
            <tbody>
              {dados.length === 0 ? (
                <tr><td colSpan={6} className="empty">Nenhum log encontrado</td></tr>
              ) : dados.map(r => (
                <tr key={r.ID_LOGS}>
                  <td>{r.DATA_HORA_LOGS ? new Date(r.DATA_HORA_LOGS).toLocaleString('pt-BR') : '—'}</td>
                  <td>{r.NOME_EMPRESA_LOGS || r.CNPJ_LOGS || '—'}</td>
                  <td>{r.VERSAO_LOGS || '—'}</td>
                  <td>{r.ETAPA_LOGS || '—'}</td>
                  <td>{statusBadge(r.STATUS_LOGS)}</td>
                  <td style={{ maxWidth: 250, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {r.MENSAGEM_LOGS || '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
