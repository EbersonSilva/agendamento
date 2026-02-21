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
PORT=3000
```

#### Configurar banco de dados

```bash
npx prisma migrate dev
npx prisma generate  # Gerar Prisma Client
```

#### Iniciar servidor

```bash
npm run dev
# Servidor rodará em http://localhost:3000
```

### 2️⃣ Configuração do Frontend

```bash
cd frontend
npm install

# Configure o arquivo .env (se necessário)
VITE_API_URL=http://localhost:3000
```

#### Iniciar aplicação

```bash
npm run dev
# Aplicação rodará em http://localhost:5173
```

## 🔐 Autenticação JWT

Para mais informações sobre a configuração de autenticação JWT, consulte [JWT_SETUP.md](./backend/JWT_SETUP.md).

## 📊 Scripts Disponíveis

### Backend
- `npm run dev`: Inicia o servidor em modo desenvolvimento
- `npx prisma migrate dev`: Cria e aplica migrações
- `npx prisma studio`: Interface gráfica do Prisma

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

O projeto pode ser facilmente deployado em plataformas como:
- **Backend**: Heroku, Railway, Render, Azure
- **Frontend**: Vercel, Netlify, GitHub Pages

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
