# Ponskan API

API REST para análise de imagens de citros utilizando filas assíncronas com Redis e BullMQ.

Stack: Node.js · Express · MySQL · Redis · BullMQ

---

# Instalação

## Pré-requisitos

Instale:

- Node.js 18+
- MySQL 8
- WSL2 + Ubuntu
- Git

Verifique:

```bash
node -v
npm -v
mysql --version
wsl --status
```

---

# Banco de Dados

Crie o banco:

```sql
CREATE DATABASE ponskan CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
```

Importe o schema:

```bash
mysql -u root -p ponskan < ponskanDB.sql
```

---

# Redis no WSL

Abra o Ubuntu:

```bash
wsl
```

Instale o Redis:

```bash
sudo apt update
sudo apt install redis-server -y
```

Edite a configuração:

```bash
sudo nano /etc/redis/redis.conf
```

Altere:

```ini
bind 0.0.0.0
protected-mode no
```

Inicie o Redis:

```bash
sudo service redis-server start
```

Teste:

```bash
redis-cli ping
```

Resultado esperado:

```bash
PONG
```

---

# Instalação do Projeto

Clone o repositório:

```bash
git clone https://github.com/guilhermexmada/ponskan-api.git
cd ponskan-api
```

Instale as dependências:

```bash
npm install
```

---

# Variáveis de Ambiente

Crie o arquivo `.env` na raiz:

```env
DB_NAME=ponskan
DB_USER=root
DB_PASSWORD=
DB_HOST=localhost
DB_PORT=3306

PORT=8080
NODE_ENV=development

JWT_SECRET=sua_chave_jwt
JWT_EXPIRES_IN=1h

REDIS_HOST=127.0.0.1
REDIS_PORT=6379
```

---

# Executando a API

Antes de iniciar:

- MySQL rodando
- Redis ativo no WSL
- `.env` configurado

Inicie:

```bash
npm start
```

Saída esperada:

```bash
>> Redis conectado
>> Banco de dados sincronizado
>> Aplicação iniciada
```

API disponível em:

```text
http://localhost:8080
```

---

# Autenticação

Rotas protegidas utilizam JWT:

```http
Authorization: Bearer <token>
```

O token expira em 1 hora.

---

# Rotas

## Health Check

### `GET /health`

Verifica se a API está online.

**Autenticação:** obrigatória

### Resposta

```json
{
  "success": true,
  "message": "Serviço disponível"
}
```

---

# Usuários

## Criar usuário

### `POST /user`

### Body

```json
{
  "name": "Teste",
  "email": "teste@email.com",
  "password": "123"
}
```

### Resposta

```json
{
  "success": true,
  "data": {
    "token": "<jwt>"
  }
}
```

---

## Login

### `POST /login`

### Body

```json
{
  "email": "teste@email.com",
  "password": "123"
}
```

### Resposta

```json
{
  "success": true,
  "data": {
    "token": "<jwt>"
  }
}
```

---

## Buscar usuário

### `GET /user/:id`

Retorna um usuário pelo UUID.

### Resposta

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "Teste",
    "email": "teste@email.com"
  }
}
```

---

# Análises

## Criar análise

### `POST /analysis`

Envia imagens para processamento assíncrono.

**Autenticação:** obrigatória

### Content-Type

```http
multipart/form-data
```

### Campos

| Campo | Tipo |
|---|---|
| images | file[] |

### Resposta

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "status": "pendente"
  }
}
```

---

## Consultar análise

### `GET /analysis/:id`

Verifica o status da análise.

### Status possíveis

- `pendente`
- `finalizada`
- `cancelada`

### Resposta

```json
{
  "success": true,
  "data": {
    "analysis": {
      "id": "uuid",
      "status": "finalizada"
    },
    "classification": {
      "classe": "tangerina-manchada",
      "confianca": 0.97
    }
  }
}
```

---

## Listar análises

### `GET /analysis?page=1`

Lista as análises do usuário autenticado.

### Resposta

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "status": "finalizada"
    }
  ]
}
```

---

# Principais Erros

| Código | Descrição |
|---|---|
| 400 | Dados inválidos |
| 401 | Não autorizado |
| 404 | Recurso não encontrado |
| 500 | Erro interno |

---

# Comandos Úteis

## API

```bash
npm start
```

## MySQL

```bash
mysql -u root -p
```

## Redis

```bash
sudo service redis-server start
sudo service redis-server status
redis-cli ping
```

## WSL

```bash
wsl
wsl --shutdown
```
