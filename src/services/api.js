import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'
const TOKEN   = import.meta.env.VITE_API_TOKEN || 'bltec_master_token_2026'

const api = axios.create({
  baseURL: API_URL,
  headers: { 'X-API-Token': TOKEN }
})

export const maquinas = {
  listar:   () => api.get('/maquinas/'),
  metricas: () => api.get('/maquinas/metricas'),
}

export const comandos = {
  listar:   (filtro = 'Todos') => api.get(`/comandos/?filtro=${filtro}`),
  criar:    (dados) => api.post('/comandos/', dados),
  cancelar: (id) => api.patch(`/comandos/${id}/cancelar`),
}

export const logs = {
  listar: (params = {}) => api.get('/logs/', { params }),
}

export default api
