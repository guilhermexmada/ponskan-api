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
