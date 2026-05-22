# Documentação Interna

Nesta seção, você pode encontrar os detalhes do funcionamento interno da API.
Isso inclui fluxos de dados, regras de negócio e conceitos técnicos.

<!-- Nesta seção, você pode encontrar os detalhes da comunicação entre cliente e API.
Isso inclui os padrões de dados e seus formatos nas requisições e respostas. -->

# Menu de Navegação

- [Server Start](#server-start)
- [Redis](#redis)
- [CORS](#cors)
- [MySQL Database](#mysql-database)
- [Storage](#storage)
- [Controllers & Services](#controllers--services)
- [Middlewares](#middlewares)
- [BullMQ](#bullmq)

## Server Start

Durante o desenvolvimento, a API pode ser inicializada usando o comando de terminal `npm start`. Isso chama o entry-point `server.js`, responsável pela execução das ações abaixo:

1. Importação do pacote `dotenv/config`, permitindo utilização de variáveis de ambiente de modo global e independente da ordem de importações
2. Importação das configurações básicas do Express, incluindo as rotas da API e a configuração do CORS
3. Importação do Worker, que por consequência importa o arquivo de conexão do banco Redis
4. Inicialização do banco de dados
5. Inicialização das pastas locais de storage da API
6. Inicialização do servidor Node

A sequência de logs do terminal deve ser:

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
>> Aplicação iniciada ... Servidor rodando em http://localhost:4040
```

O servidor Node é iniciado na porta definida nas variáveis de ambiente, ou por padrão, a porta 4040. Existe a diferenciação de erros conhecidos, falta de _try-catch_ e _promises_ não tratadas.

## Redis

A API usa o banco em memória Redis para gerenciar filas assíncronas de processamento, como na rota POST `/analysis`. 

O arquivo de configuração `src/config/redis-config.js` tenta conectar-se ao Redis usando variáveis de ambiente ou com host '127.0.0.1', porta 6379 sem senha. Também configura _retry_ da conexão.

## CORS

O arquivo de configuração `src/config/cors-config.js` define que a API aceita requisições do tipo 'GET', 'POST', 'PUT' e 'DELETE' de um conjunto de endereços, incluindo a URL de desenvolvimento do front-end _'http://localhost:3000'_.

## MySQL Database

O start do servidor começa invocando a função utilitária de inicialização do banco de dados relacional da API, que por sua vez invoca outras utilitárias. Na pasta `src/database`, você encontra:

```
    initDB.js ⭢ Tenta conexão com banco já existente
    createDB.js ⭢ Se não existir, cria o banco
    syncTB.js ⭢ Cria as tabelas do banco
```

`syncTB.js` usa como referência as tabelas importadas da Model principal `src/models/index.js`. Essa Model é responsável por definir os relacionamentos entre as outras Models e exportar toda a configuração de tabelas de forma centralizada.

Atualmente a base de dados da API usa MySQL e a biblioteca `Sequelize` para conexão com o projeto em Node + Express.

## Storage

A função utilitária `src/utils/storage/init.js` é responsável por criar as seguintes pastas, caso não existam, de forma assíncrona:

```
    storage/uploads ⭢ armazena arquivos de imagens originais que o usuário envia
    storage/processed ⭢ armazena arquivos de imagens processadas
    storage/temp ⭢ armazena arquivos de forma temporária
```

As outras utilitárias em `src/utils/storage/storageService.js` permitem armazenamento e limpeza de arquivos temporários e a movimentação de arquivos entre pastas.

## Controllers & Services

Controllers usam o parâmetro _"next"_ devido ao um middleware de erro global. Usa-se _try-catch_ para capturar quaisquer erros que "flutuem" das services chamadas.

Recomenda-se que eles construam um objeto _"result"_. 
Retornos bem-sucedidos usam a classe utilitária APIResponse.
Retornos mal-sucedidos usam a classe utilitária AppError.

```
class Controller{
    async method(req, res, next){
        try{
            const parameter = req.body.parameter
            const service = await Service.method(parameter)
            const result = {
                id = service.id,
                number = service.number
            }
            return new APIResponse(res, 'message', 200, result)
        } catch (error){
            next(error)
        }
    }
}
```

Services que são chamadas diretamente por um Controller não precisam de _try-catch_, pois o comportamento nativo do _async/await_ no Express
permite que os erros capturados "flutuem" para o Controller sem travar a aplicação. Outro motivo, seria para não sobrescrever erros específicos da Service usando um AppError no _catch_.

Em caso de erro, Services invocam a classe utilitária AppError. Em caso de sucesso, a Service deve apenas retornar os dados necessários
para o Controller. O uso de APIResponse exclusivo dos Controllers ajuda a centralizar o tratamento de requisições.

```
class Service{
    async method(parameter){
        try{
            const p = parameter
            if(!p){
                throw new AppError('message', 400)
            } else {
                const double = p.number * 2
                const triple = p.number * 3

                return {
                    double,
                    triple
                }
            }
        } catch (error){
            next(error)
        }
    }
}
```

## Middlewares

Middlewares interceptam requisições do usuário e devem ser posicionados corretamente nas rotas da aplicação, garantindo a ordem correta
do tratamento dos dados.

O `errorMiddleware` atua como middleware de erro global. Isso significa que ele é a última camada de tratamento de erros da API: todos os 
erros, esperados ou inesperados, devem cair nessa instância. Suas funções são o registro dos logs de erro e o retorno de uma response específica de erros. 

O `errorMiddleware` trabalha junto com a classe utilitária AppError, que formata erros encontrados de acordo com um padrão.

```
    return res.status(statusCode).json({
        sucess: false,
        message: message,
        error: errorContent
    })
```

Não é necessário escrevê-lo nas rotas. Por padrão, esse tipo de middleware é o único com 4 parâmetros. O comportamento nativo do Express
é chamá-lo, desde que se use _next(error)_ nos Controllers.

O `authMiddleware` garante a autenticação do usuário, permitindo ou não o consumo da API. Ele usa a biblioteca `jsonwebtoken` para
gerar e validar tokens no padrão Bearer. 

A função Authorization deve ser a primeira instância em todas as rotas que necessitem de autenticação. Ela extrai o token do cabeçalho
da requisição e, caso seja válido, anexa o seguinte objeto à requisição (para uso posterior dos Controllers e Services):

```
    {
        req.token = token;
        req.loggedUser = {
            id: data.id,
            email: data.email
        }
    }
```

O `uploadMiddleware` utiliza a biblioteca `multer` para tratar o envio de arquivos de imagens nas requisições. Atualmente, serve apenas
como uma camada de segurança que valida tipo, tamanho e quantidade das imagens. 

No caso, a requisição fica restrita ao envio de 4 arquivos de imagem com no máximo 5mb de tamanho, entre os tipos MIME 'image/png', 'image/jpg', 'image/jpeg' e 'image/webp'. Em caso de sucesso, prossegue a requisição para o Controller.

## BullMQ

`BullMQ` é a biblioteca responsável pela definição dos fluxos de processamento assíncronos independentes do fluxo do Node.js

Por exemplo, a rota POST `/analysis` não processa, classifica e salva imagens e resultados na mesma _thread_ do Node - ela sua uma fila assíncrona para realizar todo o processamento mais pesado, evitando desacelerar ou interromper as requisições. Isso porque esse processamento é totalmente gerenciado na memória RAM, através do Redis.

O funcionamento pode ser entendido no seguinte fluxo:

```
    Controller captura dados ⭢ Monta Job (tarefa) ⭢ Envia para Queue (fila) ⭢ Worker processa 
```

- Job funciona como uma tarefa, carregando dados que precisam ser processados
- Queues acumulam Jobs em ordem, onde esperam o Worker terminar a tarefa atual para serem processados
- Worker é quem realiza o processamento em si, executando operações com os dados do Job


 
