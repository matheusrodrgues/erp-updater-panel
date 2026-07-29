import { useState, useEffect, useCallback, useRef } from 'react'
import { useToast } from '../components/Toast'

const API_URL   = import.meta.env.VITE_API_URL || 'http://localhost:8000'
const API_TOKEN = import.meta.env.VITE_API_TOKEN || 'bltec_master_token_2026'
const WS_URL    = API_URL.replace('http://', 'ws://').replace('https://', 'wss://')

const headers = { 'X-API-Token': API_TOKEN, 'Content-Type': 'application/json' }

async function api(method, path, body) {
  const res = await fetch(`${API_URL}${path}`, {
    method, headers,
    body: body ? JSON.stringify(body) : undefined
  })
  return res.json()
}

function formatarData(dt) {
  if (!dt) return '—'
  return new Date(dt).toLocaleString('pt-BR')
}

// ── MODAL CONFIRMAÇÃO ──
function ModalConfirmar({ titulo, mensagem, onConfirmar, onFechar, corBotao = 'btn-danger', labelBotao = 'Excluir' }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 }} onClick={onFechar}>
      <div style={{ background: 'var(--bg-secondary)', borderRadius: 14, border: '1px solid var(--border)', width: 420, padding: 28 }} onClick={e => e.stopPropagation()}>
        <h2 style={{ margin: '0 0 12px', fontSize: 16, color: 'var(--text-primary)' }}>⚠ {titulo}</h2>
        <p style={{ margin: '0 0 24px', fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>{mensagem}</p>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button className="btn btn-secondary" onClick={onFechar}>Cancelar</button>
          <button className={`btn ${corBotao}`} onClick={onConfirmar}>{labelBotao}</button>
        </div>
      </div>
    </div>
  )
}

// ── MODAL UPLOAD ARQUIVOS ──
function ModalUpload({ empresa, onFechar }) {
  const [arquivo, setArquivo]       = useState(null)
  const [uploading, setUploading]   = useState(false)
  const [temArquivo, setTemArquivo] = useState(false)
  const [confirmarRemover, setConfirmarRemover] = useState(false)
  const inputRef = useRef(null)
  const toast = useToast()

  useEffect(() => {
    fetch(`${API_URL}/empresas/${empresa.cnpj}/arquivo/info`, {
      headers: { 'X-API-Token': API_TOKEN }
    })
      .then(r => r.json())
      .then(d => setTemArquivo(d.existe))
      .catch(() => {})
  }, [empresa.cnpj])

  const upload = async () => {
    if (!arquivo) { toast('Selecione um arquivo.', 'aviso'); return }
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('arquivo', arquivo)
      const res = await fetch(`${API_URL}/empresas/${empresa.cnpj}/arquivo`, {
        method: 'POST',
        headers: { 'X-API-Token': API_TOKEN },
        body: formData
      })
      if (res.ok) {
        toast('Arquivo enviado com sucesso!', 'sucesso')
        setTemArquivo(true)
        setArquivo(null)
        if (inputRef.current) inputRef.current.value = ''
      } else {
        toast('Erro ao enviar arquivo.', 'erro')
      }
    } catch (e) {
      toast('Erro ao enviar arquivo.', 'erro')
    } finally {
      setUploading(false)
    }
  }

  const remover = async () => {
    try {
      await fetch(`${API_URL}/empresas/${empresa.cnpj}/arquivo`, {
        method: 'DELETE',
        headers: { 'X-API-Token': API_TOKEN }
      })
      toast('Arquivo removido!', 'sucesso')
      setTemArquivo(false)
      setConfirmarRemover(false)
    } catch (e) {
      toast('Erro ao remover arquivo.', 'erro')
    }
  }

  return (
    <>
      {confirmarRemover && (
        <ModalConfirmar
          titulo="Remover arquivo"
          mensagem={`Deseja realmente remover o arquivo de instalação de "${empresa.nome}"? Esta ação não pode ser desfeita.`}
          onConfirmar={remover}
          onFechar={() => setConfirmarRemover(false)}
          labelBotao="Remover"
        />
      )}
      <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={onFechar}>
        <div style={{ background: 'var(--bg-secondary)', borderRadius: 14, border: '1px solid var(--border)', width: 480, padding: 28 }} onClick={e => e.stopPropagation()}>
          <h2 style={{ margin: '0 0 6px', fontSize: 16, color: 'var(--text-primary)' }}>📦 Arquivos Iniciais</h2>
          <p style={{ margin: '0 0 20px', fontSize: 13, color: 'var(--text-muted)' }}>{empresa.nome}</p>

          <div style={{ background: 'var(--bg-primary)', borderRadius: 10, border: '1px solid var(--border)', padding: 16, marginBottom: 20 }}>
            {temArquivo ? (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 24 }}>📦</span>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}>arquivos.zip</div>
                    <div style={{ fontSize: 11, color: '#00cc88' }}>✓ Arquivo disponível para instalação</div>
                  </div>
                </div>
                <button className="btn btn-danger" style={{ padding: '4px 10px', fontSize: 11 }} onClick={() => setConfirmarRemover(true)}>🗑️ Remover</button>
              </div>
            ) : (
              <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: 13, padding: '8px 0' }}>
                Nenhum arquivo cadastrado
              </div>
            )}
          </div>

          <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>
            {temArquivo ? 'Substituir arquivo (.zip ou .rar)' : 'Selecionar arquivo (.zip ou .rar)'}
          </label>
          <input ref={inputRef} type="file" accept=".zip,.rar,.7z"
            onChange={e => setArquivo(e.target.files[0])}
            style={{ width: '100%', marginBottom: 20, color: 'var(--text-primary)', fontSize: 13 }} />

          {arquivo && (
            <div style={{ background: 'var(--bg-primary)', borderRadius: 8, padding: '10px 14px', marginBottom: 16, fontSize: 12, color: 'var(--text-secondary)' }}>
              📄 {arquivo.name} — {(arquivo.size / 1024 / 1024).toFixed(1)}MB
            </div>
          )}

          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <button className="btn btn-secondary" onClick={onFechar}>Fechar</button>
            <button className="btn btn-primary" onClick={upload} disabled={!arquivo || uploading}>
              {uploading ? 'Enviando...' : '📤 Enviar'}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}

// ── MODAL CADASTRO EMPRESA ──
function ModalEmpresa({ empresa, onSalvar, onFechar }) {
  const [cnpj, setCnpj]     = useState(empresa?.cnpj || '')
  const [nome, setNome]     = useState(empresa?.nome || '')
  const [saving, setSaving] = useState(false)
  const toast = useToast()

  const salvar = async () => {
    if (!cnpj.trim() || !nome.trim()) { toast('Preencha CNPJ e nome.', 'aviso'); return }
    setSaving(true)
    try { await onSalvar({ cnpj: cnpj.trim(), nome: nome.trim() }); onFechar() }
    catch (e) { toast('Erro ao salvar empresa.', 'erro') }
    finally { setSaving(false) }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={onFechar}>
      <div style={{ background: 'var(--bg-secondary)', borderRadius: 14, border: '1px solid var(--border)', width: 440, padding: 28 }} onClick={e => e.stopPropagation()}>
        <h2 style={{ margin: '0 0 20px', fontSize: 16, color: 'var(--text-primary)' }}>{empresa ? 'Editar Empresa' : 'Nova Empresa'}</h2>
        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>CNPJ</label>
          <input className="search-input" value={cnpj} onChange={e => setCnpj(e.target.value)} placeholder="00.000.000/0000-00" style={{ width: '100%' }} />
        </div>
        <div style={{ marginBottom: 24 }}>
          <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>Nome da Empresa</label>
          <input className="search-input" value={nome} onChange={e => setNome(e.target.value)} placeholder="Nome da empresa" style={{ width: '100%' }} />
        </div>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button className="btn btn-secondary" onClick={onFechar}>Cancelar</button>
          <button className="btn btn-primary" onClick={salvar} disabled={saving}>{saving ? 'Salvando...' : 'Salvar'}</button>
        </div>
      </div>
    </div>
  )
}

// ── MODAL MÁQUINAS AGUARDANDO ──
function ModalAguardando({ naoAssociadas, empresas, onAssociar, onFechar }) {
  const [modalAssociar, setModalAssociar] = useState(null)
  const thStyle = { padding: '10px 16px', textAlign: 'left', fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', borderBottom: '1px solid var(--border)' }
  const tdStyle = { padding: '12px 16px', borderBottom: '1px solid var(--border)', color: 'var(--text-primary)', fontSize: 13 }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={onFechar}>
      <div style={{ background: 'var(--bg-secondary)', borderRadius: 14, border: '1px solid var(--border)', width: '70%', maxWidth: 800, maxHeight: '80vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }} onClick={e => e.stopPropagation()}>
        <div style={{ padding: '18px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontWeight: 600, fontSize: 16, color: 'var(--text-primary)' }}>Máquinas Aguardando Associação</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{naoAssociadas.length} máquina(s) sem empresa associada</div>
          </div>
          <button className="btn btn-secondary" onClick={onFechar} style={{ padding: '6px 14px' }}>✕ Fechar</button>
        </div>
        <div style={{ overflowY: 'auto', flex: 1 }}>
          {modalAssociar ? (
            <ModalAssociarInline
              maquina={modalAssociar}
              empresas={empresas}
              onAssociar={async (machineId, cnpj) => { await onAssociar(machineId, cnpj); setModalAssociar(null) }}
              onCancelar={() => setModalAssociar(null)}
            />
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'var(--bg-primary)', position: 'sticky', top: 0 }}>
                  <th style={thStyle}>Hostname</th>
                  <th style={thStyle}>Machine ID</th>
                  <th style={thStyle}>Cadastrada em</th>
                  <th style={{ ...thStyle, width: 100 }}></th>
                </tr>
              </thead>
              <tbody>
                {naoAssociadas.map(m => (
                  <tr key={m.MACHINE_ID}>
                    <td style={tdStyle}>{m.HOSTNAME_MAQUINA}</td>
                    <td style={{ ...tdStyle, fontFamily: 'monospace', fontSize: 11, color: 'var(--text-muted)' }}>{m.MACHINE_ID}</td>
                    <td style={{ ...tdStyle, color: 'var(--text-secondary)' }}>{formatarData(m.DATA_CADASTRO)}</td>
                    <td style={tdStyle}>
                      <button className="btn btn-primary" style={{ padding: '4px 12px', fontSize: 11 }} onClick={() => setModalAssociar(m)}>Associar</button>
                    </td>
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

function ModalAssociarInline({ maquina, empresas, onAssociar, onCancelar }) {
  const [busca, setBusca]                     = useState('')
  const [cnpjSelecionado, setCnpjSelecionado] = useState('')
  const [saving, setSaving]                   = useState(false)
  const toast = useToast()

  const empresasFiltradas = empresas.filter(e =>
    e.nome.toLowerCase().includes(busca.toLowerCase()) || e.cnpj.includes(busca)
  )

  const associar = async () => {
    if (!cnpjSelecionado) { toast('Selecione uma empresa.', 'aviso'); return }
    setSaving(true)
    try { await onAssociar(maquina.MACHINE_ID, cnpjSelecionado) }
    catch (e) { toast('Erro ao associar máquina.', 'erro') }
    finally { setSaving(false) }
  }

  return (
    <div style={{ padding: 24 }}>
      <button onClick={onCancelar} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 13, marginBottom: 16, padding: 0 }}>← Voltar</button>
      <div style={{ background: 'var(--bg-primary)', borderRadius: 10, border: '1px solid var(--border)', padding: 16, marginBottom: 20 }}>
        <div style={{ fontWeight: 500, fontSize: 14, color: 'var(--text-primary)', marginBottom: 4 }}>{maquina.HOSTNAME_MAQUINA}</div>
        <div style={{ fontFamily: 'monospace', fontSize: 11, color: 'var(--text-muted)' }}>{maquina.MACHINE_ID}</div>
      </div>
      <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>Buscar empresa</label>
      <input className="search-input" value={busca} onChange={e => { setBusca(e.target.value); setCnpjSelecionado('') }}
        placeholder="🔍 Nome ou CNPJ..." style={{ width: '100%', marginBottom: 10 }} />
      <select className="select-input" value={cnpjSelecionado} onChange={e => setCnpjSelecionado(e.target.value)} style={{ width: '100%', marginBottom: 20 }}>
        <option value="">Selecione uma empresa...</option>
        {empresasFiltradas.map(e => (
          <option key={e.cnpj} value={e.cnpj}>{e.nome} — {e.cnpj}</option>
        ))}
      </select>
      <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
        <button className="btn btn-secondary" onClick={onCancelar}>Cancelar</button>
        <button className="btn btn-primary" onClick={associar} disabled={saving}>{saving ? 'Associando...' : 'Associar'}</button>
      </div>
    </div>
  )
}

function useWebSocketNotificacao(onNovaMaquina) {
  const wsRef = useRef(null)

  useEffect(() => {
    let timeoutId
    let tentativas = 0

    function conectar() {
      const ws = new WebSocket(`${WS_URL}/ws/painel?token=${API_TOKEN}`)
      wsRef.current = ws
      ws.onmessage = (e) => {
        try {
          const dados = JSON.parse(e.data)
          if (dados.tipo === 'nova_maquina_aguardando') onNovaMaquina(dados)
        } catch {}
      }
      ws.onclose = () => {
        tentativas++
        timeoutId = setTimeout(conectar, Math.min(1000 * tentativas, 10000))
      }
    }

    conectar()
    return () => { clearTimeout(timeoutId); wsRef.current?.close() }
  }, [])
}

export function Empresas() {
  const [empresas, setEmpresas]               = useState([])
  const [naoAssociadas, setNaoAssociadas]     = useState([])
  const [loading, setLoading]                 = useState(true)
  const [modalEmpresa, setModalEmpresa]       = useState(null)
  const [modalAguardando, setModalAguardando] = useState(false)
  const [modalUpload, setModalUpload]         = useState(null)
  const [confirmarExcluir, setConfirmarExcluir] = useState(null)
  const [busca, setBusca]                     = useState('')
  const toast = useToast()

  const carregar = useCallback(async () => {
    try {
      const [resEmpresas, resNaoAssoc] = await Promise.all([
        api('GET', '/empresas/'),
        api('GET', '/maquinas/nao_associadas')
      ])
      setEmpresas(Array.isArray(resEmpresas) ? resEmpresas : [])
      setNaoAssociadas(Array.isArray(resNaoAssoc) ? resNaoAssoc : [])
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { carregar() }, [carregar])

  useWebSocketNotificacao(useCallback((dados) => {
    toast(`Nova máquina aguardando associação: ${dados.hostname}`, 'aviso', 8000)
    carregar()
  }, [carregar]))

  const salvarEmpresa = async (dados) => {
    if (modalEmpresa && modalEmpresa !== 'novo') {
      await api('PUT', `/empresas/${modalEmpresa.cnpj}`, dados)
      toast('Empresa atualizada!', 'sucesso')
    } else {
      await api('POST', '/empresas/', dados)
      toast('Empresa cadastrada!', 'sucesso')
    }
    carregar()
  }

  const excluirEmpresa = async (cnpj) => {
    await api('DELETE', `/empresas/${cnpj}`)
    toast('Empresa excluída!', 'sucesso')
    setConfirmarExcluir(null)
    carregar()
  }

  const associarMaquina = async (machineId, cnpj) => {
    await api('POST', '/maquinas/associar', { machine_id: machineId, cnpj })
    toast('Máquina associada com sucesso!', 'sucesso')
    carregar()
  }

  const empresasFiltradas = empresas.filter(e =>
    !busca || e.nome.toLowerCase().includes(busca.toLowerCase()) || e.cnpj.includes(busca)
  )

  const thStyle = { padding: '10px 16px', textAlign: 'left', fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', borderBottom: '1px solid var(--border)' }
  const tdStyle = { padding: '12px 16px', borderBottom: '1px solid var(--border)', color: 'var(--text-primary)', fontSize: 13 }

  return (
    <div>
      {modalEmpresa !== null && (
        <ModalEmpresa
          empresa={modalEmpresa === 'novo' ? null : modalEmpresa}
          onSalvar={salvarEmpresa}
          onFechar={() => setModalEmpresa(null)}
        />
      )}
      {modalAguardando && (
        <ModalAguardando
          naoAssociadas={naoAssociadas}
          empresas={empresas}
          onAssociar={associarMaquina}
          onFechar={() => { setModalAguardando(false); carregar() }}
        />
      )}
      {modalUpload && (
        <ModalUpload empresa={modalUpload} onFechar={() => setModalUpload(null)} />
      )}
      {confirmarExcluir && (
        <ModalConfirmar
          titulo="Excluir empresa"
          mensagem={`Deseja realmente excluir "${confirmarExcluir.nome}"? Esta ação removerá todos os dados e arquivos associados e não pode ser desfeita.`}
          onConfirmar={() => excluirEmpresa(confirmarExcluir.cnpj)}
          onFechar={() => setConfirmarExcluir(null)}
          labelBotao="Excluir definitivamente"
        />
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 className="page-title" style={{ marginBottom: 0 }}>Empresas</h1>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          {naoAssociadas.length > 0 && (
            <button className="btn btn-secondary" onClick={() => setModalAguardando(true)} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ background: '#ffaa33', color: '#000', borderRadius: '50%', width: 20, height: 20, fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {naoAssociadas.length}
              </span>
              Aguardando associação
            </button>
          )}
          <button className="btn btn-primary" onClick={() => setModalEmpresa('novo')}>+ Nova Empresa</button>
        </div>
      </div>

      {loading ? <div className="loading">Carregando...</div> : (
        <div className="grupo-empresa">
          <div className="grupo-header" style={{ cursor: 'default' }}>
            <div className="grupo-header-left">
              <span className="grupo-nome">Empresas Cadastradas</span>
            </div>
            <div className="grupo-stats">
              <span className="stat-badge stat-total">{empresasFiltradas.length} de {empresas.length} empresa(s)</span>
            </div>
          </div>
          <div className="grupo-maquinas">
            <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)' }}>
              <input className="search-input" value={busca} onChange={e => setBusca(e.target.value)}
                placeholder="🔍 Buscar por nome ou CNPJ..." style={{ width: '100%' }} />
            </div>
            {empresasFiltradas.length === 0 ? (
              <div className="empty">Nenhuma empresa encontrada</div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: 'var(--bg-primary)' }}>
                    <th style={thStyle}>CNPJ</th>
                    <th style={thStyle}>Nome</th>
                    <th style={thStyle}>Máquinas</th>
                    <th style={{ ...thStyle, width: 150 }}></th>
                  </tr>
                </thead>
                <tbody>
                  {empresasFiltradas.map(e => (
                    <tr key={e.cnpj}>
                      <td style={{ ...tdStyle, fontFamily: 'monospace', fontSize: 12, color: 'var(--accent)' }}>{e.cnpj}</td>
                      <td style={tdStyle}>{e.nome}</td>
                      <td style={{ ...tdStyle, color: 'var(--text-secondary)' }}>{e.total_maquinas || 0} máq.</td>
                      <td style={{ ...tdStyle, textAlign: 'right', display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                        <button className="btn btn-secondary" style={{ padding: '4px 10px', fontSize: 11 }} title="Arquivos iniciais" onClick={() => setModalUpload(e)}>📦</button>
                        <button className="btn btn-secondary" style={{ padding: '4px 10px', fontSize: 11 }} onClick={() => setModalEmpresa(e)}>✏️</button>
                        <button className="btn btn-danger" style={{ padding: '4px 10px', fontSize: 11 }} onClick={() => setConfirmarExcluir(e)}>🗑️</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
