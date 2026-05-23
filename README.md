# Documentação da API

Nesta seção, você pode encontrar os detalhes da comunicação entre cliente e API.
Isso inclui os padrões de dados e seus formatos nas requisições e respostas.

Além disso, está disponibilizado um guia de instalação e inicialização do projeto.

**Base URL:** `http://localhost:8080`  
**Versão do Node:** ESModules (`"type": "module"`)  
**Stack:** Express · Sequelize (MySQL) · BullMQ · Redis · Sharp · JWT

### Índice

# Índice

- [Instalações](#instalações)
  - [Node.js](#nodejs)
  - [MySQL](#mysql)
  - [WSL & Redis](#wsl--redis)
  - [GIT](#git)

- [Inicialização](#inicialização)
  - [Redis](#redis)
  - [Dependências](#dependências)
  - [Variáveis de ambiente](#variáveis-de-ambiente)
  - [Start da API](#start-da-api)


## Instalações

---

### Node.js

Instale o Node.js para que a API possa utilizar JS em server-side:

- Link de download oficial: _https://nodejs.org/pt-br/download_

```
  # O Docker possui instruções específicas de instalação para cada sistema operacional.
  # Consulte a documentação oficial em https://docker.com/get-started/
  # Baixar a imagem Docker do Node.js:
  docker pull node:24-alpine
  # Criar um contêiner do Node.js e iniciar uma sessão Shell:
  docker run -it --rm --entrypoint sh node:24-alpine
  # Verifique a versão do Node.js:
  node -v # Deve exibir "v24.16.0".
  # Verificar a versão do npm:
  npm -v # Deve imprimir "11.13.0".
```

### MySQL

Instale o MySQL para que a API possa criar o banco de dados relacional:

- Link de download oficial: _https://www.mysql.com/downloads/_

Para subir o servidor MySQL, recomendamos programas como XAMPP ou Laragon. Também recomendamos um gerenciador de bancos relacionais como Workbench ou HeidiSQL:

- Laragon: _https://laragon.org/download_
- XAMPP: _https://www.apachefriends.org/pt_br/download.html_
- Heidi: _https://www.heidisql.com/download.php_

### WSL & Redis

Se você usa Windows, instale o Ubuntu usando WSL e o Redis Server para que a API possa processar filas assíncronas, paralelas e independentes do Node:

```
  # no Powershell
  wsl --install
  wsl -l -v

  # no Ubuntu
  sudo apt update
  sudo apt install redis-server 
```

### GIT

Instale o GIT para facilitar cópia e manipulação da API:

- Link de download oficial: _https://git-scm.com/install/windows_ 
- Link do repositório github: _https://github.com/MatheusBertoldo1/ponskan-web-app.git_

```
  # no terminal do Git ou CMD
  git clone https://github.com/MatheusBertoldo1/ponskan-web-app.git
  cd ponskan-web-app
```

## Inicialização

--- 

### Redis

Antes de iniciar a API, você precisa certificar-se de que:

- Servidor MySQL está operando
- Servidor Redis está operando

Para inicializar o servidor Redis, abra o terminal do Ubuntu, execute os comandos abaixo e mantenha aberto:

```
  # no Ubuntu
  sudo service redis-server start
  
  # deve exibir PONG
  redis-cli ping  
```

### Dependências

Além disso, instale as dependências da API usando o comando `npm install`!

### Variáveis de ambiente

Depois, defina as variáveis de ambiente criando um arquivo `.env` na raiz do repositório. Você pode seguir o modelo do arquivo `.env.example`, que é algo como:

```
  # banco
  DB_NAME=ponskan
  DB_USER=root
  DB_PASSWORD=
  DB_HOST=localhost
  DB_PORT=3306

  PORT=8080
  NODE_ENV=development

  JWT_SECRET=sua_chave_secreta
  JWT_EXPIRES_IN=1h
```

### Start da API

Para iniciar a API, utilize o comando de terminal `npm start`. Ele deve executar as seguintes ações, em ordem:

1. Importação do pacote `dotenv/config` para uso global de variáveis de ambiente
2. Disparada do entry-point `server.js`
3. Importação das configurações básicas do Express em `app.js`, incluindo as rotas da API e a configuração do CORS para comunicar-se com o app React
4. Importação do Worker, que por sua vez importa a configuração do banco Redis
5. Inicialização do banco de dados (se não existir, a API constrói)
6. Inicialização das pastas de storage local na raiz do repositório back-end (storage/temp, storage/uploads e storage/processed)
7. Inicialização do servidor Node

O log de saída no terminal deve ser:

```
> ponskan-api@1.0.0 start
> npx nodemon -r dotenv/config server.js

[nodemon] 3.1.14
[nodemon] to restart at any time, enter `rs`
[nodemon] watching path(s): *.*
[nodemon] watching extensions: js,mjs,cjs,json
[nodemon] starting `node -r dotenv/config server.js`
>> Redis conectado
>> Banco de dados conectado com sucesso
>> Storage criada com sucesso
>> Aplicação iniciada ... Servidor rodando em http://localhost:8080
```

Se tudo deu certo até aqui, você pode consumir a API utilizando o aplicativo em React.js + Next.js na pasta front-end do repositório.

## Documentação de Rotas e Arquitetura

1. [Visão Geral da Arquitetura](#1-visão-geral-da-arquitetura)
2. [Autenticação](#2-autenticação)
3. [Formato Padrão de Resposta](#3-formato-padrão-de-resposta)
4. [Tratamento de Erros](#4-tratamento-de-erros)
5. [Rotas — Status do Servidor](#5-rotas--status-do-servidor)
6. [Rotas — Usuários & Autenticação](#6-rotas--usuários--autenticação)
7. [Rotas — Análise de Imagens](#7-rotas--análise-de-imagens)
8. [Pipeline de Processamento Assíncrono](#8-pipeline-de-processamento-assíncrono)
9. [Upload de Arquivos](#9-upload-de-arquivos)
10. [Modelos de Dados](#10-modelos-de-dados)
11. [Variáveis de Ambiente](#11-variáveis-de-ambiente)

---

## 1. Visão Geral da Arquitetura

A API segue uma arquitetura em camadas bem definida: `Routes → Middlewares → Controllers → Services → Models`. O processamento de imagens é desacoplado do ciclo HTTP — ao receber um upload, a API registra a análise no banco, empurra um job para uma fila BullMQ (Redis) e responde imediatamente ao cliente. Um worker dedicado consome a fila de forma assíncrona, executando o pré-processamento via Sharp e a inferência via CNN.

```
Cliente → [Auth Middleware] → Controller → Service → Banco
                                  ↓
                            ImageQueue (BullMQ/Redis)
                                  ↓
                            ImageWorker → Sharp → CNN → Banco
```

O cliente acompanha o progresso da análise através de polling na rota `GET /analysis/:id`.

---

## 2. Autenticação

A API utiliza **JWT (JSON Web Token)** com assinatura HMAC-SHA256. Todas as rotas — exceto `POST /user` e `POST /login` — exigem autenticação.

**Header obrigatório:**
```
Authorization: Bearer <token>
```

O token é gerado no momento do cadastro (`POST /user`) e do login (`POST /login`), com validade de **1 hora** a partir da emissão.

**Comportamento do middleware de autenticação:**

O middleware `Authorization` extrai o token do header, verifica a assinatura com `JWT_SECRET` e, em caso de sucesso, injeta `req.loggedUser` contendo `{ id, email }` para uso nos controllers subsequentes. Qualquer falha resulta em `401`.

| Cenário | Código | Mensagem |
|---|---|---|
| Header ausente ou mal formatado | `401` | `Acesso não autorizado: token não fornecido ou mal formatado` |
| Token expirado | `401` | `Acesso não autorizado: token expirado` |
| Assinatura inválida | `401` | `Acesso não autorizado: token inválido` |

---

## 3. Formato Padrão de Resposta

Todas as respostas seguem a estrutura abaixo, tanto em casos de sucesso quanto de erro.

**Sucesso:**
```json
{
  "success": true,
  "message": "Mensagem descritiva da operação",
  "data": { },
  "meta": null
}
```

**Erro:**
```json
{
  "sucess": false,
  "message": "Mensagem de erro legível",
  "error": {
    "code": "CODIGO_DO_ERRO",
    "message": "Mensagem de erro legível"
  }
}
```

> **Nota:** O campo `sucess` no envelope de erro contém um typo intencional no código-fonte (`sucess` em vez de `success`). Clientes que dependam desse campo para detecção de erro devem observar a grafia exata.

O campo `meta` é reservado para paginação e metadados adicionais, atualmente não populado nas respostas existentes.

---

## 4. Tratamento de Erros

Erros são centralizados no middleware `errorMiddleware`, posicionado como última camada do Express. Ele distingue dois tipos:

- **`AppError`** — erros operacionais previstos (validação, autenticação, recurso não encontrado). Possuem `isOperational: true` e um `statusCode` explícito.
- **Erros genéricos** — bugs não tratados. Resultam em `500` com `code: INTERNAL_ERROR`.

Os controllers nunca respondem diretamente em caso de erro — todos chamam `next(error)`, delegando ao middleware.

**Códigos HTTP utilizados:**

| Código | Uso |
|---|---|
| `200` | Sucesso em leitura ou autenticação |
| `201` | Criação bem-sucedida (usuário, análise) |
| `400` | Parâmetros ausentes, formato inválido, limites de upload violados |
| `401` | Credenciais inválidas, token ausente/expirado/inválido, e-mail já cadastrado |
| `404` | Recurso não encontrado |
| `500` | Erro interno ou análise cancelada |
| `503` | Serviço indisponível (health check) |

---

## 5. Rotas — Status do Servidor

### `GET /health`

Verifica a disponibilidade da API. Requer autenticação.

**Autenticação:** Bearer token obrigatório.

**Request:**
```
GET /health
Authorization: Bearer <token>
```

Sem body.

**Response `200`:**
```json
{
  "success": true,
  "message": "Serviço disponível",
  "data": {
    "api": "rodando",
    "uptime": 3742.18,
    "timestamp": "2026-05-23T12:00:00.000Z"
  }
}
```

| Campo | Tipo | Descrição |
|---|---|---|
| `api` | `string` | Estado literal da API (`"rodando"`) |
| `uptime` | `number` | Tempo de execução do processo em segundos (`process.uptime()`) |
| `timestamp` | `string` | Data/hora ISO 8601 da consulta |

**Response `503`:**
```json
{
  "sucess": false,
  "message": "Serviço indisponível",
  "error": { "code": "INTERNAL_ERROR", "message": "Serviço indisponível" }
}
```

---

## 6. Rotas — Usuários & Autenticação

### `POST /user`

Cria uma nova conta de usuário. Não requer autenticação. Após o cadastro, um token JWT é gerado e retornado imediatamente — não é necessário fazer login em seguida.

**Autenticação:** Nenhuma.

**Content-Type:** `application/json`

**Body:**
```json
{
  "name": "string",
  "email": "string",
  "password": "string",
  "phone": "string | number | null",
  "birthDate": "string (YYYY-MM-DD) | null",
  "accessType": "produtor | estudante",
  "address": "string | null",
  "cnpj": "string | null",
  "highSchool": "string | null",
  "course": "string | null"
}
```

| Campo | Obrigatório | Tipo | Descrição |
|---|---|---|---|
| `name` | Sim | `string` | Nome completo do usuário |
| `email` | Sim | `string` | E-mail único no sistema |
| `password` | Sim | `string` | Senha em texto plano (hasheada com bcrypt, salt rounds: 10) |
| `phone` | Não | `string \| number` | Telefone de contato |
| `birthDate` | Não | `string` | Data de nascimento no formato `YYYY-MM-DD` |
| `accessType` | Não | `enum` | Perfil de acesso: `"produtor"` (padrão) ou `"estudante"` |
| `address` | Não | `string` | Endereço completo |
| `cnpj` | Não | `string` | CNPJ (relevante para perfil produtor) |
| `highSchool` | Não | `string` | Instituição de ensino (relevante para perfil estudante) |
| `course` | Não | `string` | Curso (relevante para perfil estudante) |

**Response `201`:**
```json
{
  "success": true,
  "message": "Usuário cadastrado com sucesso",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "uuid-v4",
      "name": "Nome do Usuário",
      "email": "email@exemplo.com"
    }
  }
}
```

**Erros possíveis:**

| Condição | Código | Mensagem |
|---|---|---|
| `name`, `email` ou `password` ausentes | `400` | `Campos obrigatórios não preenchidos` |
| E-mail já cadastrado | `401` | `Já existe uma conta com esse endereço de e-mail` |

---

### `POST /login`

Autentica um usuário existente e retorna um novo token JWT.

**Autenticação:** Nenhuma.

**Content-Type:** `application/json`

**Body:**
```json
{
  "email": "string",
  "password": "string"
}
```

| Campo | Obrigatório | Descrição |
|---|---|---|
| `email` | Sim | E-mail cadastrado |
| `password` | Sim | Senha em texto plano para comparação com o hash bcrypt |

**Response `200`:**
```json
{
  "success": true,
  "message": "Login realizado com sucesso",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "uuid-v4",
      "name": "Nome do Usuário",
      "email": "email@exemplo.com"
    }
  }
}
```

**Erros possíveis:**

| Condição | Código | Mensagem |
|---|---|---|
| `email` ou `password` ausentes | `400` | `Campos obrigatórios não preenchidos` |
| E-mail não encontrado ou senha incorreta | `401` | `Suas credenciais são inválidas: verifique e tente novamente` |

> A mensagem de erro é propositalmente genérica para os dois casos (e-mail inexistente e senha errada), evitando enumeração de usuários.

---

### `GET /user/:id`

Busca um usuário pelo seu identificador UUID. Não requer autenticação.

**Autenticação:** Nenhuma.

**Parâmetros de rota:**

| Parâmetro | Tipo | Descrição |
|---|---|---|
| `id` | `string (UUID v4)` | Identificador único do usuário |

**Request:**
```
GET /user/e8576a77-9da6-4c45-a448-d03d245ff127
```

**Response `200`:**

Retorna o objeto completo do modelo `Usuario` conforme armazenado no banco (incluindo todos os campos do cadastro). A senha **não** é omitida explicitamente no nível do service `getOne` — depende da configuração do modelo Sequelize.

```json
{
  "success": true,
  "message": "Usuário encontrado com sucesso",
  "data": {
    "id": "uuid-v4",
    "nome": "Nome do Usuário",
    "email": "email@exemplo.com",
    "telefone": "13999999999",
    "data_nascimento": "2000-05-05T00:00:00.000Z",
    "tipo_acesso": "produtor",
    "endereco": "Av. Exemplo, 100 - Registro/SP",
    "cnpj": null,
    "faculdade": null,
    "curso": null,
    "createdAt": "2026-05-01T00:00:00.000Z",
    "updatedAt": "2026-05-01T00:00:00.000Z",
    "deletedAt": null
  }
}
```

**Erros possíveis:**

| Condição | Código | Mensagem |
|---|---|---|
| `id` com formato inválido (não UUID) | `400` | `ID do usuário é inválido` |
| UUID inexistente no banco | `404` | `Usuário não encontrado` |

> O formato do `id` é validado com a biblioteca `validator` (`validator.isUUID(id)`) antes de qualquer consulta ao banco.

---

## 7. Rotas — Análise de Imagens

Todas as rotas deste grupo exigem autenticação. O usuário autenticado é identificado a partir do payload do JWT (`req.loggedUser.id`), garantindo que cada análise seja sempre associada ao dono da requisição.

---

### `POST /analysis`

Inicia uma nova análise de imagens. As imagens são recebidas, validadas e enfileiradas para processamento assíncrono. A resposta é imediata — o cliente recebe o ID da análise e deve fazer polling para acompanhar o resultado.

**Autenticação:** Bearer token obrigatório.

**Content-Type:** `multipart/form-data`

**Body (form-data):**

| Campo | Tipo | Obrigatório | Restrições |
|---|---|---|---|
| `images` | `file` | Sim (1 a 4 arquivos) | Tipos aceitos: `image/jpeg`, `image/png`, `image/webp`. Tamanho máximo por arquivo: **5 MB**. Máximo de **4 arquivos** por requisição. |

O campo deve ser enviado com o nome exato `images`. Múltiplos arquivos são aceitos repetindo o campo no form-data.

**Response `201`:**
```json
{
  "success": true,
  "message": "Análise iniciada",
  "data": {
    "id": "42d47955-c5f4-4e3a-be5d-a18211aaf0f7",
    "id_usuario": "uuid-do-usuario",
    "status": "pendente",
    "createdAt": "2026-05-23T12:00:00.000Z",
    "updatedAt": "2026-05-23T12:00:00.000Z"
  }
}
```

O campo `status` retorna `"pendente"` sempre neste momento — o processamento não ocorreu ainda.

**Erros possíveis:**

| Condição | Código | Mensagem |
|---|---|---|
| Nenhum arquivo enviado | `400` | `Nenhuma imagem enviada` |
| Mais de 4 arquivos | `400` | `Limite máximo de 4 imagens atingido` |
| Arquivo maior que 5 MB | `400` | `A imagem é muito grande (máximo 5MB)` |
| Tipo MIME não suportado | `400` | `Tipo de arquivo inválido: são aceitos JPG, PNG e WebP` |
| Token ausente/inválido/expirado | `401` | *(ver seção Autenticação)* |

**Detalhes do campo `error` em erros de upload:**
```json
{
  "sucess": false,
  "message": "Limite máximo de 4 imagens atingido",
  "error": {
    "code": "LIMIT_FILE_COUNT",
    "message": "Limite máximo de 4 imagens atingido"
  }
}
```

Códigos de erro específicos do Multer expostos:

| `error.code` | Causa |
|---|---|
| `LIMIT_FILE_COUNT` | Número de arquivos excede o limite de 4 |
| `LIMIT_FILE_SIZE` | Tamanho do arquivo excede 5 MB |
| `INVALID_MIME_TYPE` | MIME type não está na lista permitida |

---

### `GET /analysis/:id`

Consulta o status de uma análise e, quando concluída, retorna o relatório completo com imagens e classificação. Este é o endpoint de polling.

**Autenticação:** Bearer token obrigatório.

**Parâmetros de rota:**

| Parâmetro | Tipo | Descrição |
|---|---|---|
| `id` | `string (UUID v4)` | Identificador da análise retornado pelo `POST /analysis` |

**Request:**
```
GET /analysis/42d47955-c5f4-4e3a-be5d-a18211aaf0f7
Authorization: Bearer <token>
```

---

**Response `200` — status `pendente`:**
```json
{
  "success": true,
  "message": "A análise ainda está sendo processada",
  "data": {
    "id": "42d47955-c5f4-4e3a-be5d-a18211aaf0f7",
    "id_usuario": "uuid-do-usuario",
    "status": "pendente",
    "createdAt": "2026-05-23T12:00:00.000Z",
    "updatedAt": "2026-05-23T12:00:00.000Z"
  }
}
```

O cliente deve repetir a requisição após um intervalo (recomendado: 2–5 segundos) até o status mudar.

---

**Response `200` — status `finalizada`:**
```json
{
  "success": true,
  "message": "Relatório da Análise consultado com sucesso",
  "data": {
    "analysis": {
      "id": "42d47955-c5f4-4e3a-be5d-a18211aaf0f7",
      "id_usuario": "uuid-do-usuario",
      "status": "finalizada",
      "createdAt": "2026-05-23T12:00:00.000Z",
      "updatedAt": "2026-05-23T12:05:00.000Z"
    },
    "images": [
      {
        "id": "uuid-da-imagem",
        "id_analise": "42d47955-c5f4-4e3a-be5d-a18211aaf0f7",
        "nome": "tangerina.webp",
        "caminho": "storage/uploads/analysis/2026/5/...",
        "coordenadas": null,
        "tipo_mime": "image/webp",
        "tamanho": 2068844,
        "createdAt": "2026-05-23T12:03:00.000Z"
      }
    ],
    "classification": [
      {
        "id": "uuid-da-classificacao",
        "id_analise": "42d47955-c5f4-4e3a-be5d-a18211aaf0f7",
        "classe": "manchada",
        "confianca": 0.87,
        "tempo_execucao": 1243,
        "modelo_cnn": "nome-do-modelo",
        "createdAt": "2026-05-23T12:04:00.000Z"
      }
    ]
  }
}
```

| Campo | Tipo | Descrição |
|---|---|---|
| `analysis` | `object` | Entidade principal da análise |
| `images` | `array` | Lista das imagens originais enviadas |
| `images[].caminho` | `string` | Caminho relativo no sistema de arquivos do servidor |
| `images[].coordenadas` | `object \| null` | Ponto geográfico (GEOMETRY POINT), atualmente não populado no fluxo padrão |
| `classification` | `array` | Resultado(s) da inferência CNN |
| `classification[].classe` | `string` | Diagnóstico pré-liminar retornado pelo modelo |
| `classification[].confianca` | `float` | Score de confiança entre `0` e `1` |
| `classification[].tempo_execucao` | `integer` | Tempo de execução da CNN em milissegundos |
| `classification[].modelo_cnn` | `string` | Identificador do modelo utilizado |

---

**Response `500` — status `cancelada`:**
```json
{
  "success": true,
  "message": "A análise foi cancelada devido a algum erro",
  "data": {
    "id": "uuid-da-analise",
    "status": "cancelada",
    ...
  }
}
```

> Apesar do HTTP `500`, a resposta retorna `success: true` pois o cancelamento é um estado previsto do sistema (falha no worker após esgotamento das tentativas), não uma falha da requisição em si.

**Erros possíveis:**

| Condição | Código | Mensagem |
|---|---|---|
| `id` ausente na rota | `400` | `Erro ao enviar ID da análise referente` |

---

### `GET /analysis`

Lista todas as análises do usuário autenticado, com paginação, contagem de imagens e resultado da classificação embutidos.

**Autenticação:** Bearer token obrigatório.

**Query Parameters:**

| Parâmetro | Tipo | Padrão | Descrição |
|---|---|---|---|
| `page` | `integer` | `1` | Número da página desejada |

A paginação é fixa em **20 registros por página**, ordenados por `createdAt` decrescente (mais recentes primeiro).

**Request:**
```
GET /analysis?page=1
Authorization: Bearer <token>
```

**Response `200`:**
```json
{
  "success": true,
  "message": "Listagem de Análises realizada com sucesso",
  "data": [
    {
      "id": "uuid-da-analise",
      "status": "finalizada",
      "createdAt": "2026-05-23T12:00:00.000Z",
      "imagesCount": "3",
      "classificacao": {
        "id": "uuid-da-classificacao",
        "classe": "manchada",
        "confianca": 0.87,
        "tempo_execucao": 1243,
        "createdAt": "2026-05-23T12:04:00.000Z"
      }
    },
    {
      "id": "outro-uuid",
      "status": "pendente",
      "createdAt": "2026-05-22T08:00:00.000Z",
      "imagesCount": "1",
      "classificacao": null
    }
  ]
}
```

| Campo | Tipo | Descrição |
|---|---|---|
| `imagesCount` | `string` | Contagem de imagens associadas, retornada como string (resultado de subquery SQL `COUNT(*)`) |
| `classificacao` | `object \| null` | Classificação associada; `null` para análises ainda pendentes |

> O filtro por usuário é aplicado automaticamente via `WHERE id_usuario = <id do token>`. Não é possível listar análises de outros usuários através deste endpoint.

---

## 8. Pipeline de Processamento Assíncrono

Ao receber um `POST /analysis` bem-sucedido, o seguinte pipeline é executado em background:

**1. Enfileiramento**

O job é adicionado à fila `analysis-queue` no Redis (BullMQ) com os buffers das imagens serializados. Configuração de retry: até **3 tentativas**, backoff exponencial com delay inicial de 3 segundos.

**2. Pré-processamento (Sharp)**

Para cada imagem, o `SharpPipeline` aplica:
- Redimensionamento para **224×224 px** (`fit: cover`, `position: center`)
- Suavização leve (`blur: 0.5`) para redução de ruído
- Ajuste de brilho (`1.05×`) e saturação (`1.2×`)
- Conversão para espaço de cor `sRGB`
- Exportação como **WebP** (qualidade 90, compressão máxima)

**3. Armazenamento temporário**

Ambas as versões (original e processada) são salvas temporariamente em `storage/temp/<analysisId>/`.

**4. Inferência CNN**

O buffer processado é enviado ao `cnnService`, que retorna `{ preDiagnosis, confidence, cnnModel }`.

**5. Persistência definitiva**

Após a inferência, os arquivos temporários são movidos para seus destinos permanentes:
- Original: `storage/uploads/analysis/<ano>/<mês>/<analysisId>/<userId>/`
- Processada: `storage/processed/analysis/<ano>/<mês>/<analysisId>/<userId>/`

Os registros são então persistidos nas tabelas `imagens`, `processadas` e `classificacoes`.

**6. Atualização de status**

Ao completar (`worker.on('completed')`): `status → "finalizada"`  
Ao falhar após todas as tentativas (`worker.on('failed')`): `status → "cancelada"`

---

## 9. Upload de Arquivos

O middleware de upload utiliza `multer` com armazenamento em **memória RAM** (`memoryStorage`). As imagens nunca tocam o disco antes de passar pelo pipeline de validação e pré-processamento — os buffers são mantidos em `req.files` e repassados diretamente ao worker via BullMQ.

**Limites:**

| Restrição | Valor |
|---|---|
| Tamanho máximo por arquivo | 5 MB |
| Número máximo de arquivos por requisição | 4 |
| Tipos MIME aceitos | `image/jpeg`, `image/png`, `image/webp` |
| Nome do campo no form-data | `images` |

---

## 10. Modelos de Dados

Todos os modelos utilizam UUID v4 como chave primária, com `timestamps: true` (campos `createdAt` e `updatedAt`) e `paranoid: true` (soft delete via `deletedAt`).

### `usuarios`

| Coluna | Tipo | Nullable | Observações |
|---|---|---|---|
| `id` | UUID | Não | PK, gerado automaticamente |
| `nome` | STRING | Não | |
| `email` | STRING | Não | |
| `senha` | STRING | Não | Hash bcrypt |
| `telefone` | STRING | Sim | |
| `data_nascimento` | DATE | Sim | |
| `tipo_acesso` | ENUM | Não | `'produtor'` \| `'estudante'`, default: `'produtor'` |
| `endereco` | STRING | Sim | |
| `cnpj` | STRING | Sim | |
| `faculdade` | STRING | Sim | |
| `curso` | STRING | Sim | |

### `analises`

| Coluna | Tipo | Nullable | Observações |
|---|---|---|---|
| `id` | UUID | Não | PK |
| `id_usuario` | UUID | Não | FK → `usuarios.id` |
| `status` | ENUM | Não | `'pendente'` \| `'finalizada'` \| `'cancelada'`, default: `'pendente'` |

### `imagens`

| Coluna | Tipo | Nullable | Observações |
|---|---|---|---|
| `id` | UUID | Não | PK |
| `id_analise` | UUID | Não | FK → `analises.id` |
| `nome` | STRING | Não | Nome original do arquivo |
| `caminho` | STRING | Não | Caminho relativo no storage |
| `coordenadas` | GEOMETRY(POINT) | Sim | Geolocalização; não populado no fluxo atual |
| `tipo_mime` | ENUM | Não | `image/jpeg` \| `image/jpg` \| `image/png` \| `image/webp` |
| `tamanho` | INTEGER | Não | Tamanho em bytes (mínimo: 1) |

### `processadas`

| Coluna | Tipo | Nullable | Observações |
|---|---|---|---|
| `id` | UUID | Não | PK |
| `id_imagem` | UUID | Não | FK → `imagens.id` |
| `nome` | STRING | Não | |
| `caminho` | STRING | Não | Caminho no diretório `processed/` |
| `tipo_mime` | ENUM | Não | Sempre `image/webp` após o pipeline |
| `tamanho` | INTEGER | Não | Tamanho em bytes |

### `classificacoes`

| Coluna | Tipo | Nullable | Observações |
|---|---|---|---|
| `id` | UUID | Não | PK |
| `id_analise` | UUID | Não | FK → `analises.id` |
| `classe` | STRING | Não | Diagnóstico pré-liminar do modelo |
| `confianca` | FLOAT | Não | Score entre 0 e 1 |
| `tempo_execucao` | INTEGER | Sim | Duração da inferência em ms |
| `modelo_cnn` | STRING | Não | Identificador do modelo CNN utilizado |

---

## 11. Variáveis de Ambiente

O arquivo `.env` deve ser criado na raiz do projeto com base no `.env.example`:

| Variável | Descrição | Exemplo |
|---|---|---|
| `DB_NAME` | Nome do banco de dados MySQL | `ponskan` |
| `DB_USER` | Usuário do banco | `root` |
| `DB_PASSWORD` | Senha do banco | *(vazio em dev)* |
| `DB_HOST` | Host do banco | `localhost` |
| `DB_PORT` | Porta do banco | `3306` |
| `PORT` | Porta onde a API escuta | `8080` |
| `NODE_ENV` | Ambiente de execução | `development` |
| `JWT_SECRET` | Chave secreta para assinar tokens JWT | string hex de 64 bytes |
| `JWT_EXPIRES_IN` | Validade do token | `1h` |

Para gerar um `JWT_SECRET` seguro:
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

O servidor Redis utilizado pelo BullMQ é configurado em `src/config/redis-config.js`, separado das variáveis de ambiente principais.










