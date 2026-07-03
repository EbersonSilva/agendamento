# 💅 Beauty Studio - Sistema de Agendamento Inteligente

Sistema Full Stack desenvolvido para gestão de agendamentos em estúdios de beleza. O projeto foca em uma experiência de usuário (UX) fluida, permitindo que a cliente realize o agendamento em 3 passos simples, enquanto a administradora possui controle total sobre a aprovação dos horários.

## 🚀 Tecnologias Utilizadas

### Backend
- **Node.js** com **TypeScript**
- **Express**: Framework web
- **Prisma**: ORM para manipulação do banco de dados
- **PostgreSQL**: Banco de dados relacional
- **Date-fns**: Manipulação de datas e fusos horários
- **JWT**: Autenticação segura

### Frontend
- **React** (Vite)
- **Tailwind CSS**: Estilização moderna e responsiva
- **Lucide React**: Biblioteca de ícones
- **Axios**: Consumo de API
- **TypeScript**: Tipagem estática

## ⚙️ Funcionalidades Principais

- [x] **Agendamento em Etapas**: Serviço -> Data/Horário -> Identificação
- [x] **Fluxo de Aprovação**: Agendamentos nascem como `pending` e aguardam confirmação da dona
- [x] **Trava de Conflito**: Bloqueio inteligente de horários para evitar overbooking
- [x] **Identificação por Telefone**: Cadastro automático de clientes recorrentes via WhatsApp
- [x] **Interface Responsiva**: Design otimizado para dispositivos móveis com Tailwind
- [x] **Dashboard Administrativo**: Painel completo para gestão de agendamentos e serviços
- [x] **Autenticação JWT**: Login seguro com tokens
- [x] **Agendas de Fechamento**: Datas com atendimento indisponível
- [x] **Relatórios e Métricas**: Acompanhamento de agendamentos
- [x] **Notificações por E-mail**: Alerta de novo agendamento para a proprietária (Gmail/SMTP)
- [x] **Google Calendar**: Sincronização automatizada e inteligente de agendamentos em tempo real
- [x] **WhatsApp Link**: Direcionamento com mensagem pré-montada para confirmação rápida da cliente

## 📁 Estrutura do Projeto

```
agendamento/
├── backend/
│   ├── src/
│   │   ├── controllers/       # Controladores da aplicação
│   │   ├── middleware/        # Middlewares (autenticação, etc)
│   │   ├── routes/            # Rotas da API
│   │   └── lib/               # Utilitários e cliente Prisma
│   ├── prisma/
│   │   ├── schema.prisma      # Esquema do banco de dados
│   │   └── migrations/        # Histórico de migrações
│   ├── server.ts              # Arquivo de entrada
│   ├── package.json
│   └── tsconfig.json
│
├── frontend/
│   ├── src/
│   │   ├── components/        # Componentes React reutilizáveis
│   │   ├── service/           # Serviços (chamadas de API)
│   │   ├── config/            # Configurações
│   │   ├── assets/            # Imagens e recursos
│   │   ├── App.tsx            # Componente principal
│   │   └── main.tsx           # Ponto de entrada
│   ├── public/                # Arquivos públicos
│   ├── package.json
│   ├── tsconfig.json
│   └── vite.config.ts
│
└── README.md
```

## 🛠️ Como Executar o Projeto

### Pré-requisitos
- **Node.js** (v16+) instalado
- **PostgreSQL** rodando
- **npm** ou **yarn**

### 1️⃣ Configuração do Backend

```bash
cd backend
npm install

# Configure as variáveis de ambiente
# Crie um arquivo .env na raiz de /backend
DATABASE_URL="postgresql://usuario:senha@localhost:5432/studio_db"
JWT_SECRET="sua_chave_secreta_aqui"
PORT=8080
```

Para ambiente de produção, instale somente dependências de runtime com:

```bash
npm install --omit=dev
```

Evite usar `--production` ou `npm config production`, pois geram aviso nas versões atuais do npm.

#### Configurar banco de dados

```bash
npx prisma migrate dev
npx prisma generate  # Gerar Prisma Client
```

#### Iniciar servidor

```bash
npm run dev
# Servidor rodará em http://localhost:8080
```

### 2️⃣ Configuração do Frontend

```bash
cd frontend
npm install
```

#### Configurar URL da API

Edite `public/env.js` para apontar para o backend:

```javascript
window.APP_CONFIG = {
  apiUrl: "http://localhost:8080"  // Desenvolvimento local
  // apiUrl: "https://agendamento-production-6ab3.up.railway.app"  // Produção
};
```

#### Iniciar aplicação

```bash
npm run dev
# Aplicação rodará em http://localhost:5173
```

## 🔐 Autenticação JWT

Para mais informações sobre a configuração de autenticação JWT, consulte [JWT_SETUP.md](./backend/JWT_SETUP.md).

## 📧 Notificações por E-mail (SMTP / Gmail)

O sistema possui um fluxo integrado para notificar a administradora (Melissa) por e-mail a cada novo agendamento (seja realizado pela cliente no site ou manualmente no painel).

### Como Configurar:
1. **Ativar no Painel**: Acesse o painel admin em **Configurações > Horários** (seção "Contato da Dona") e preencha o campo **"Email para receber notificações de agendamento"**.
2. **Variáveis do .env**: Configure os dados de SMTP no arquivo `.env` do backend (recomenda-se usar uma **Senha de App** do Gmail):
   ```env
   SMTP_HOST="smtp.gmail.com"
   SMTP_PORT="587"
   SMTP_SECURE="false"
   SMTP_USER="seu-email-da-melissa@gmail.com"
   SMTP_PASS="xxxx xxxx xxxx xxxx" # Senha de app gerada nas configurações do Google
   ```

## 📅 Sincronização com Google Calendar

Os agendamentos criados no sistema são sincronizados automaticamente com o Google Calendar da administradora.
- Eventos pendentes de aprovação recebem o prefixo `[PENDENTE]`.
- Quando confirmados no painel, o título é atualizado e o prefixo é removido.
- Se cancelados, o evento correspondente é removido da agenda Google.
- A sincronização roda em segundo plano sem travar a resposta da cliente.

## 📊 Scripts Disponíveis

### Backend
- `npm run dev`: Inicia o servidor em modo desenvolvimento
- `npm run build`: Compila o código TypeScript do backend
- `npm run start`: Inicia o servidor compilado em produção
- `npx prisma migrate dev`: Cria e aplica migrações do banco
- `npx prisma studio`: Interface gráfica para navegar no banco de dados
- `npx tsx scripts/clear-test-data.ts`: Limpa todos os agendamentos e clientes de teste (preserva serviços, administradores e configurações)
- `npx tsx scripts/generate-password-hash.ts "suasenha"`: Gera o hash de senha para novos administradores

### Frontend
- `npm run dev`: Inicia o servidor de desenvolvimento
- `npm run build`: Compila para produção
- `npm run preview`: Visualiza build de produção
- `npm run lint`: Executa verificação de lint

## 🗄️ Banco de Dados

O projeto utiliza **PostgreSQL** com **Prisma** como ORM.

### Principais Tabelas

- **User**: Usuários (clientes e administrador)
- **Service**: Serviços oferecidos
- **Appointment**: Agendamentos
- **ClosedDate**: Datas de fechamento
- **StudioConfig**: Configurações da clínica

Para gerenciar o banco via interface gráfica:
```bash
cd backend
npx prisma studio
```

## 🚀 Deploy

### 📍 URLs de Produção

- **Frontend**: https://agendamento.melbeauty.com.br
- **Backend**: https://agendamento-production-6ab3.up.railway.app

### Configuração em Produção

#### Frontend (Vercel)

1. O frontend está hospedado no Vercel e acessível via subdomínio `agendamento.melbeauty.com.br`
2. A URL da API está configurada em `public/env.js`:

```javascript
window.APP_CONFIG = {
  apiUrl: "https://agendamento-production-6ab3.up.railway.app"
};
```

#### Backend (Railway)

1. O backend está hospedado no Railway e responde em `https://agendamento-production-6ab3.up.railway.app`
2. Variáveis de ambiente configuradas no Railway:
   - `DATABASE_URL`: Conexão com banco de dados PostgreSQL
   - `JWT_SECRET`: Chave secreta para autenticação
   - `PORT`: Porta (Railway define automaticamente)
   - `NODE_ENV`: `production`

#### DNS no Hostinger

O subdomínio `agendamento.melbeauty.com.br` está apontado para o Vercel via registro CNAME.

### Plataformas de Deploy Suportadas

- **Backend**: Railway ✅, Heroku, Render, Azure
- **Frontend**: Vercel ✅, Netlify, GitHub Pages

## 📝 Contribuindo

### Checklist de Deploy para Novo Subdomínio

Se precisar configurar um novo subdomínio para a aplicação:

- [ ] **Hostinger - Criar registro DNS**
  1. Painel → Domínios → melbeauty.com.br → Gerenciar DNS
  2. Novo registro CNAME apontando para `cname.vercel-dns.com.`

- [ ] **Vercel - Adicionar domínio**
  1. Dashboard → Projeto → Settings → Domains
  2. Adicionar `agendamento.melbeauty.com.br`
  3. Aguardar propagação DNS (até 24h)

- [ ] **Frontend - Atualizar env.js**
  1. Editar `frontend/public/env.js`
  2. Configurar `apiUrl` com a URL do backend

- [ ] **Backend - Configurar CORS**
  1. Verificar que o backend permite requisições do frontend
  2. Se necessário, atualizar `server.ts` com domínio whitelist

- [ ] **Testes**
  1. Testar agendamento completo
  2. Verificar autenticação JWT
  3. Verificar resposta de `/health` do backend

## 📝 Contribuindo

Para contribuir com o projeto:

1. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
2. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
3. Push para a branch (`git push origin feature/AmazingFeature`)
4. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT.

## 👨‍💻 Autor

Desenvolvido por **Eberson Silva**
