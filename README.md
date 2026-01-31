# 💅 Beauty Studio - Sistema de Agendamento Inteligente

Sistema Full Stack desenvolvido para gestão de agendamentos em estúdios de beleza. O projeto foca em uma experiência de usuário (UX) fluida, permitindo que a cliente realize o agendamento em 3 passos simples, enquanto a administradora possui controle total sobre a aprovação dos horários.

## 🚀 Tecnologias Utilizadas

### Backend
- **Node.js** com **TypeScript**
- **Express**: Framework web
- **Prisma**: ORM para manipulação do banco de dados
- **PostgreSQL**: Banco de dados relacional
- **Date-fns**: Manipulação de datas e fusos horários

### Frontend
- **React** (Vite)
- **Tailwind CSS**: Estilização moderna e responsiva
- **Lucide React**: Biblioteca de ícones
- **Axios**: Consumo de API

## ⚙️ Funcionalidades Principais

- [x] **Agendamento em Etapas**: Serviço -> Data/Horário -> Identificação.
- [x] **Fluxo de Aprovação**: Agendamentos nascem como `pending` e aguardam confirmação da dona.
- [x] **Trava de Conflito**: Bloqueio inteligente de horários para evitar overbooking.
- [x] **Identificação por Telefone**: Cadastro automático de clientes recorrentes via WhatsApp.
- [x] **Interface Responsiva**: Design otimizado para dispositivos móveis com Tailwind.

## 🛠️ Como Executar o Projeto

### Pré-requisitos
- Node.js instalado
- Instância do PostgreSQL rodando

### 1. Configuração do Backend
```bash
cd backend
npm install
# Configure seu arquivo .env com a URL do banco de dados
npx prisma migrate dev
npm run dev

### 2. Configuração do Frontend
cd frontend
npm install
npm run dev
