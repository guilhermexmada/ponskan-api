# Guia de Instalação — Ponskan API

Stack: **Node.js + Express · MySQL · Redis (WSL/Ubuntu) · BullMQ**

---

## Sumário

1. [Pré-requisitos](#1-pré-requisitos)
2. [Banco de dados MySQL](#2-banco-de-dados-mysql)
3. [Redis no WSL (Ubuntu)](#3-redis-no-wsl-ubuntu)
4. [Clonar e instalar o projeto](#4-clonar-e-instalar-o-projeto)
5. [Configurar variáveis de ambiente](#5-configurar-variáveis-de-ambiente)
6. [Iniciar a aplicação](#6-iniciar-a-aplicação)
7. [Verificar funcionamento](#7-verificar-funcionamento)
8. [Referência rápida de comandos](#8-referência-rápida-de-comandos)

---

## 1. Pré-requisitos

Certifique-se de ter instalado na máquina Windows:

| Ferramenta | Versão mínima | Download |
|------------|---------------|---------|
| Node.js    | 18.x LTS      | https://nodejs.org |
| npm        | 9.x           | (incluído com Node.js) |
| MySQL      | 8.0           | https://dev.mysql.com/downloads/installer |
| WSL 2 + Ubuntu | 20.04+   | `wsl --install` no PowerShell |
| Git        | qualquer      | https://git-scm.com |

Para verificar as versões instaladas:

```bash
node -v
npm -v
mysql --version
wsl --status
```

---

## 2. Banco de dados MySQL

### 2.1 Criar o banco de dados

Abra o MySQL Workbench ou o terminal MySQL e execute:

```sql
CREATE DATABASE ponskan CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
```

### 2.2 Importar o schema

No terminal do Windows (na pasta onde está o arquivo `.sql`):

```bash
mysql -u root -p ponskan < ponskanDB.sql
```

> Se o MySQL estiver pedindo senha e você não tiver definido uma, pressione Enter na solicitação de senha.

### 2.3 Confirmar tabelas criadas

```sql
USE ponskan;
SHOW TABLES;
```

Resultado esperado:

```
+--------------------+
| Tables_in_ponskan  |
+--------------------+
| analises           |
| classificacoes     |
| imagens            |
| processadas        |
| usuarios           |
+--------------------+
```

---

## 3. Redis no WSL (Ubuntu)

O Redis roda dentro do WSL e a API Node.js (no Windows) se conecta a ele via `127.0.0.1:6379`.

### 3.1 Abrir o WSL

```powershell
wsl
```

### 3.2 Instalar o Redis

```bash
sudo apt update
sudo apt install redis-server -y
```

### 3.3 Configurar o Redis para aceitar conexões do Windows

Edite o arquivo de configuração:

```bash
sudo nano /etc/redis/redis.conf
```

Localize e ajuste as seguintes linhas:

```ini
# Permite conexões de qualquer interface (incluindo Windows → WSL)
bind 0.0.0.0

# Desativa o modo protegido (necessário para acesso externo ao WSL)
protected-mode no
```

Salve com `Ctrl+O`, `Enter`, `Ctrl+X`.

### 3.4 Iniciar o Redis

```bash
sudo service redis-server start
```

### 3.5 Verificar se está rodando

```bash
redis-cli ping
```

Resposta esperada: `PONG`

### 3.6 Manter o Redis ativo

O serviço precisa estar rodando **antes** de iniciar a API. Toda vez que abrir um novo terminal WSL, verifique com:

```bash
sudo service redis-server status
```

Se necessário, inicie novamente com o comando do passo 3.4.

> **Dica:** Para não precisar iniciar manualmente toda vez, adicione ao final do arquivo `~/.bashrc` no WSL:
> ```bash
> sudo service redis-server start > /dev/null 2>&1
> ```

---

## 4. Clonar e instalar o projeto

### 4.1 Clonar o repositório

```bash
git clone https://github.com/guilhermexmada/ponskan-api.git
cd ponskan-api
```

### 4.2 Instalar dependências

```bash
npm install
```

Pacotes instalados pelo `package.json`:

| Pacote | Finalidade |
|--------|-----------|
| `express` | Framework HTTP |
| `sequelize` + `mysql2` | ORM + driver MySQL |
| `ioredis` + `bullmq` | Cliente Redis + fila de processamento |
| `bcrypt` | Hash de senhas |
| `jsonwebtoken` | Autenticação JWT |
| `multer` | Upload de arquivos (imagens) |
| `sharp` | Processamento de imagens |
| `dotenv` | Variáveis de ambiente |
| `nodemon` | Reinício automático em desenvolvimento |
| `cors` | Controle de origens permitidas |
| `validator` | Validação de dados (UUID, e-mail etc.) |
| `express-rate-limit` | Proteção contra abuso de requisições |

---

## 5. Configurar variáveis de ambiente

Na raiz do projeto, crie um arquivo `.env`:

```bash
# Na raiz do projeto (Windows)
copy .env.example .env
# ou crie manualmente
```

Conteúdo do `.env`:

```env
# Banco de dados MySQL
DB_NAME=ponskan
DB_USER=root
DB_PASSWORD=
DB_HOST=localhost
DB_PORT=3306

# Servidor
PORT=8080
NODE_ENV=development

# JWT
JWT_SECRET=
JWT_EXPIRES_IN=1h

# Redis (WSL)
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
# REDIS_PASSWORD=   ← descomente e preencha se configurou senha no Redis
```

> **Atenção:** Nunca versione o arquivo `.env`. Confirme que ele está no `.gitignore`.

### Variáveis explicadas

| Variável | Valor padrão | Descrição |
|----------|-------------|-----------|
| `DB_NAME` | `ponskan` | Nome do banco de dados |
| `DB_USER` | `root` | Usuário do MySQL |
| `DB_PASSWORD` | _(vazio)_ | Senha do MySQL |
| `DB_HOST` | `localhost` | Host do MySQL |
| `DB_PORT` | `3306` | Porta do MySQL |
| `PORT` | `8080` | Porta em que a API escuta |
| `NODE_ENV` | `development` | Ambiente de execução |
| `JWT_SECRET` | _(string longa)_ | Segredo para assinar tokens JWT |
| `JWT_EXPIRES_IN` | `1h` | Expiração do token |
| `REDIS_HOST` | `127.0.0.1` | Host do Redis (WSL = localhost) |
| `REDIS_PORT` | `6379` | Porta padrão do Redis |

---

## 6. Iniciar a aplicação

### 6.1 Checklist antes de iniciar

- [ ] MySQL rodando e banco `ponskan` criado com as tabelas
- [ ] Redis rodando no WSL (`redis-cli ping` → `PONG`)
- [ ] Arquivo `.env` criado e preenchido
- [ ] Dependências instaladas (`node_modules` presente)

### 6.2 Modo desenvolvimento (com hot reload)

```bash
npm start
```

O comando executa `npx nodemon -r dotenv/config server.js`, que:
- Carrega automaticamente o `.env`
- Reinicia o servidor a cada alteração nos arquivos

### 6.3 Saída esperada no terminal

```
>> Redis conectado
>> Banco de dados sincronizado
>> Storage iniciado
>> Aplicação iniciada ... Servidor rodando em http://localhost:8080
```

> Se aparecer `>> Redis reconectando... Tentativa (1)`, o Redis no WSL não está rodando. Volte ao passo 3.4.

---

## 7. Verificar funcionamento

### 7.1 Health check da API

```bash
curl http://localhost:8080/health -H "Authorization: Bearer <seu_token>"
```

Resposta esperada:

```json
{
  "success": true,
  "message": "Serviço disponível",
  "data": {
    "api": "rodando",
    "uptime": 12.5,
    "timestamp": "2026-05-18T12:00:00.000Z"
  }
}
```

### 7.2 Criar um usuário de teste

```bash
curl -X POST http://localhost:8080/user \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Teste",
    "email": "teste@email.com",
    "password": "123"
  }'
```

### 7.3 Fazer login e obter token

```bash
curl -X POST http://localhost:8080/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "teste@email.com",
    "password": "123"
  }'
```

O campo `data.token` da resposta é o Bearer Token para usar nas demais rotas.

---

## 8. Referência rápida de comandos

### API

```bash
npm start                     # inicia em modo desenvolvimento
```

### MySQL

```bash
mysql -u root -p              # abre o cliente MySQL
mysql -u root -p ponskan < ponskanDB.sql   # importa o schema
```

### Redis (no terminal WSL)

```bash
sudo service redis-server start    # inicia o Redis
sudo service redis-server stop     # para o Redis
sudo service redis-server status   # verifica o status
redis-cli ping                     # testa conectividade (deve retornar PONG)
redis-cli monitor                  # monitora comandos em tempo real
```

### WSL

```bash
wsl                           # abre o terminal Ubuntu
wsl --shutdown                # desliga o WSL completamente
```

---

## Solução de problemas comuns

**Erro: `ECONNREFUSED 127.0.0.1:6379`**
O Redis não está rodando. Abra o WSL e execute `sudo service redis-server start`.

**Erro: `Access denied for user 'root'@'localhost'`**
A senha do MySQL no `.env` está incorreta. Verifique `DB_PASSWORD`.

**Erro: `Unknown database 'ponskan'`**
O banco não foi criado. Execute `CREATE DATABASE ponskan;` no MySQL.

**Porta 8080 já em uso**
Mude o valor de `PORT` no `.env` para outra porta (ex: `3001`) ou encerre o processo que ocupa a porta:
```bash
# Windows PowerShell
netstat -ano | findstr :8080
taskkill /PID <numero_do_pid> /F
```

**`nodemon` não reconhecido**
Execute `npm install` novamente para garantir que as dependências foram instaladas corretamente.


# Ponskan API — Documentação

Base URL: `http://localhost:8080`

Autenticação: **Bearer Token (JWT)** — expiração de 1 hora. Inclua o token no header `Authorization: Bearer <token>` em todas as rotas protegidas.

---

## Sumário

- [Status do Servidor](#status-do-servidor)
- [Usuários & Autenticação](#usuários--autenticação)
- [Análises de Imagem](#análises-de-imagem)
- [Respostas Padrão](#respostas-padrão)
- [Erros](#erros)

---

## Status do Servidor

### `GET /health`

Verifica se a API está em funcionamento.

**Autenticação:** Requerida

**Resposta de sucesso — `200 OK`**

```json
{
  "success": true,
  "message": "Serviço disponível",
  "data": {
    "api": "rodando",
    "uptime": 3600.5,
    "timestamp": "2026-05-18T12:00:00.000Z"
  }
}
```

**Erros possíveis**

| Código | Mensagem              |
|--------|-----------------------|
| 503    | Serviço indisponível  |

---

## Usuários & Autenticação

### `POST /user`

Cria uma nova conta de usuário. Retorna um token JWT válido.

**Autenticação:** Não requerida

**Corpo da requisição — `application/json`**

```json
{
  "name": "Teste",
  "email": "test@email.com",
  "password": "123",
  "phone": 13996757662,
  "birthDate": "2014-05-05",
  "accessType": "produtor",
  "address": "Avenida José dos Santos, 50 - Registro/SP",
  "cnpj": null,
  "highSchool": "FATEC",
  "course": "Desenvolvimento de Software Multiplataforma"
}
```

| Campo        | Tipo    | Obrigatório | Descrição                        |
|--------------|---------|-------------|----------------------------------|
| `name`       | string  | ✅           | Nome do usuário                  |
| `email`      | string  | ✅           | E-mail (único no sistema)        |
| `password`   | string  | ✅           | Senha (armazenada com bcrypt)    |
| `phone`      | number  | ❌           | Telefone                         |
| `birthDate`  | string  | ❌           | Data de nascimento (YYYY-MM-DD)  |
| `accessType` | string  | ❌           | Tipo de acesso (ex: `produtor`)  |
| `address`    | string  | ❌           | Endereço completo                |
| `cnpj`       | string  | ❌           | CNPJ (pode ser `null`)           |
| `highSchool` | string  | ❌           | Faculdade                        |
| `course`     | string  | ❌           | Curso                            |

**Resposta de sucesso — `201 Created`**

```json
{
  "success": true,
  "message": "Usuário cadastrado com sucesso",
  "data": {
    "token": "<jwt_token>",
    "user": {
      "id": "uuid",
      "name": "Teste",
      "email": "test@email.com"
    }
  }
}
```

**Erros possíveis**

| Código | Mensagem                                          |
|--------|---------------------------------------------------|
| 400    | Campos obrigatórios não preenchidos               |
| 401    | Já existe uma conta com esse endereço de e-mail   |

---

### `POST /login`

Autentica um usuário e retorna um token JWT.

**Autenticação:** Não requerida

**Corpo da requisição — `application/json`**

```json
{
  "email": "ponskan@email.com",
  "password": "123"
}
```

| Campo      | Tipo   | Obrigatório |
|------------|--------|-------------|
| `email`    | string | ✅           |
| `password` | string | ✅           |

**Resposta de sucesso — `200 OK`**

```json
{
  "success": true,
  "message": "Login realizado com sucesso",
  "data": {
    "token": "<jwt_token>",
    "user": {
      "id": "uuid",
      "name": "Ponskan",
      "email": "ponskan@email.com"
    }
  }
}
```

**Erros possíveis**

| Código | Mensagem                                                        |
|--------|-----------------------------------------------------------------|
| 400    | Campos obrigatórios não preenchidos                             |
| 401    | Suas credenciais são inválidas: verifique e tente novamente     |

---

### `GET /user/:id`

Busca um usuário pelo seu ID (UUID).

**Autenticação:** Não requerida

**Parâmetros de rota**

| Parâmetro | Tipo   | Descrição             |
|-----------|--------|-----------------------|
| `id`      | string | UUID do usuário       |

**Exemplo:** `GET /user/e8576a77-9da6-4c45-a448-d03d245ff127`

**Resposta de sucesso — `200 OK`**

```json
{
  "success": true,
  "message": "Usuário encontrado com sucesso",
  "data": {
    "id": "e8576a77-9da6-4c45-a448-d03d245ff127",
    "nome": "Ponskan",
    "email": "ponskan@email.com"
  }
}
```

**Erros possíveis**

| Código | Mensagem                       |
|--------|-------------------------------|
| 400    | ID do usuário não informado    |
| 400    | ID do usuário é inválido       |
| 404    | Usuário não encontrado         |

---

## Análises de Imagem

### `POST /analysis`

Inicia uma nova análise de imagens. As imagens são enfileiradas para processamento assíncrono (BullMQ). Use [`GET /analysis/:id`](#get-analysisid) para acompanhar o progresso.

**Autenticação:** Requerida

**Corpo da requisição — `multipart/form-data`**

| Campo    | Tipo  | Obrigatório | Descrição                                |
|----------|-------|-------------|------------------------------------------|
| `images` | file  | ✅           | Uma ou mais imagens (campo repetível)    |

> O campo `images` pode ser enviado múltiplas vezes para enviar mais de uma imagem por análise.

**Resposta de sucesso — `201 Created`**

```json
{
  "success": true,
  "message": "Análise iniciada",
  "data": {
    "id": "42d47955-c5f4-4e3a-be5d-a18211aaf0f7",
    "id_usuario": "uuid-do-usuario",
    "status": "pendente",
    "createdAt": "2026-05-18T12:00:00.000Z"
  }
}
```

**Erros possíveis**

| Código | Mensagem                    |
|--------|-----------------------------|
| 400    | Nenhuma imagem enviada      |

---

### `GET /analysis/:id`

Verifica o status de uma análise (polling). Quando finalizada, retorna o relatório completo com imagens e classificações.

**Autenticação:** Requerida

**Parâmetros de rota**

| Parâmetro | Tipo   | Descrição              |
|-----------|--------|------------------------|
| `id`      | string | UUID da análise        |

**Exemplo:** `GET /analysis/42d47955-c5f4-4e3a-be5d-a18211aaf0f7`

**Resposta — análise pendente — `200 OK`**

```json
{
  "success": true,
  "message": "A análise ainda está sendo processada",
  "data": {
    "id": "uuid-da-analise",
    "status": "pendente"
  }
}
```

**Resposta — análise finalizada — `200 OK`**

```json
{
  "success": true,
  "message": "Relatório da Análise consultado com sucesso",
  "data": {
    "analysis": {
      "id": "uuid-da-analise",
      "status": "finalizada"
    },
    "images": [...],
    "classification": {
      "id": "uuid",
      "classe": "tangerina-manchada",
      "confianca": 0.97,
      "tempo_execucao": 1240,
      "createdAt": "2026-05-18T12:01:00.000Z"
    }
  }
}
```

**Resposta — análise cancelada — `500`**

```json
{
  "success": true,
  "message": "A análise foi cancelada devido a algum erro",
  "data": {
    "id": "uuid-da-analise",
    "status": "cancelada"
  }
}
```

**Status possíveis da análise**

| Status      | Significado                                      |
|-------------|--------------------------------------------------|
| `pendente`  | Processamento em andamento                       |
| `finalizada`| Concluída — relatório disponível                 |
| `cancelada` | Falhou após tentativas de reprocessamento        |

**Erros possíveis**

| Código | Mensagem                                       |
|--------|------------------------------------------------|
| 400    | Erro ao enviar ID da análise referente         |

---

### `GET /analysis`

Lista todas as análises do usuário autenticado, com paginação.

**Autenticação:** Requerida

**Query parameters**

| Parâmetro | Tipo    | Padrão | Descrição            |
|-----------|---------|--------|----------------------|
| `page`    | number  | `1`    | Número da página     |

**Exemplo:** `GET /analysis?page=1`

**Resposta de sucesso — `200 OK`**

```json
{
  "success": true,
  "message": "Listagem de Análises realizada com sucesso",
  "data": [
    {
      "id": "uuid-da-analise",
      "status": "finalizada",
      "createdAt": "2026-05-18T12:00:00.000Z",
      "imagesCount": 3,
      "classificacao": {
        "id": "uuid",
        "classe": "tangerina-manchada",
        "confianca": 0.97,
        "tempo_execucao": 1240,
        "createdAt": "2026-05-18T12:01:00.000Z"
      }
    }
  ]
}
```

> A listagem retorna 20 registros por página, ordenados do mais recente ao mais antigo.

---

## Respostas Padrão

Todas as respostas seguem o seguinte envelope:

**Sucesso**
```json
{
  "success": true,
  "message": "Mensagem descritiva",
  "data": { }
}
```

**Erro**
```json
{
  "sucess": false,
  "message": "Mensagem de erro",
  "error": {
    "code": "CÓDIGO_DO_ERRO",
    "message": "Detalhe do erro"
  }
}
```

---

## Erros

| Código | Significado                                          |
|--------|------------------------------------------------------|
| 400    | Requisição inválida (campo faltando ou mal formatado)|
| 401    | Não autorizado (credenciais inválidas ou ausentes)   |
| 404    | Recurso não encontrado                               |
| 500    | Erro interno do servidor                             |
| 503    | Serviço indisponível                                 |

O token JWT expira em **1 hora**. Após a expiração, realize login novamente para obter um novo token.
