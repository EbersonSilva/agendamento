# Configuração JWT - Guia de Uso

## O que foi configurado?

### 1. **Variável de Ambiente (.env)**
- `JWT_SECRET`: Chave secreta para assinar e verificar tokens JWT
- ⚠️ **Importante**: Mude a chave em produção para algo mais seguro

### 2. **Middleware de Autenticação** (`src/middleware/auth.ts`)
- `verifyToken`: Valida o token JWT no header `Authorization`
- `verifyAdmin`: Verifica se o usuário é administrador

### 3. **Rotas Protegidas**
As seguintes rotas agora exigem autenticação:
- `PUT /appointments/:id` - Atualizar status de agendamento
- `POST /services` - Criar serviço
- `PUT /services/:id` - Atualizar serviço
- `PATCH /services/:id/disable` - Desativar serviço
- `PATCH /services/:id/activate` - Ativar serviço
- `GET /users` - Listar usuários
- `PUT /config` - Atualizar configurações

### 4. **Nova Rota de Login**
`POST /login` - Faz login e retorna um token JWT

---

## Como Testar?

### 1. **Fazer Login (obter token)**
```bash
curl -X POST http://localhost:3333/login \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "seu_telefone_admin",
    "password": "sua_senha"
  }'
```

**Resposta sucesso:**
```json
{
  "user": {
    "id": "123",
    "name": "Nome Admin",
    "phone": "telefone"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### 2. **Usar o Token em Requisições Protegidas**
```bash
curl -X GET http://localhost:3333/users \
  -H "Authorization: Bearer seu_token_aqui"
```

**Resposta erro (sem token):**
```json
{
  "error": "Token não fornecido."
}
```

**Resposta erro (token inválido):**
```json
{
  "error": "Token expirado ou inválido."
}
```

---

## Fluxo de Autenticação

1. Admin envia credenciais em `POST /login`
2. Servidor valida e gera um JWT válido por 7 dias
3. Cliente armazena o token (localStorage, sessionStorage, etc)
4. Cliente inclui o token em requisições: `Authorization: Bearer TOKEN`
5. Middleware valida o token antes de processar a requisição

---

## Segurança

- ✅ Senhas são comparadas com hash bcryptjs
- ✅ Tokens JWT assinados com chave secreta
- ✅ Tokens expiram em 7 dias
- ✅ Apenas admins podem acessar rotas protegidas
- ⚠️ Mude `JWT_SECRET` em produção
- ⚠️ Use HTTPS em produção
