# BLTEC Painel

Painel web para gerenciamento e monitoramento das máquinas/empresas clientes da BLTEC, com controle de atualizações remotas, fila de comandos e histórico de logs em tempo real.

## Funcionalidades

- **Dashboard** — visão geral das máquinas (online, offline, com erro), agrupadas por empresa, com busca, seleção em massa e disparo de comandos de atualização/rollback. Atualização em tempo real via WebSocket.
- **Fila** — acompanhamento dos comandos enviados (pendente, executando, sucesso, erro, cancelado), com filtro por status e cancelamento individual ou em massa.
- **Logs** — histórico das etapas de atualização (backup, desinstalar, validar CRC, instalar, rollback etc.), com filtros por etapa e status.
- **Empresas** — cadastro de empresas (CNPJ/nome), associação de máquinas ainda não vinculadas a nenhuma empresa e upload/remoção do arquivo de instalação (.zip/.rar) de cada empresa.
- Tema claro/escuro persistido em `localStorage`.

## Stack

- [React 19](https://react.dev/) + [Vite](https://vite.dev/)
- [Axios](https://axios-http.com/) e `fetch` para consumo da API REST
- WebSocket nativo para atualizações em tempo real (`/ws/painel`)

## Pré-requisitos

- Node.js 18+
- Uma instância da API do BLTEC rodando (backend separado deste repositório)

## Configuração

Crie um arquivo `.env.local` (ou ajuste o `env.local` existente) na raiz do projeto com:

```
VITE_API_URL=http://<host-da-api>:8000
VITE_API_TOKEN=<token de acesso à API>
```

O painel usa `VITE_API_TOKEN` no header `X-API-Token` em todas as requisições e deriva a URL do WebSocket a partir de `VITE_API_URL` (`http(s)` → `ws(s)`).

## Instalação e uso

```bash
npm install
npm run dev       # ambiente de desenvolvimento (http://localhost:5173)
npm run build     # build de produção
npm run preview   # pré-visualização do build
npm run lint      # lint do projeto
```

## Estrutura

```
src/
├─ pages/          # Dashboard, Fila, Logs, Empresas
├─ components/      # componentes compartilhados (ex.: Toast)
├─ services/api.js  # cliente Axios e endpoints da API
└─ App.jsx          # navegação lateral e tema
```
