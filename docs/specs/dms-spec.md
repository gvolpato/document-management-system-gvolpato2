# Especificação - Document Management System (DMS)

## 1. Objetivo

O sistema deve permitir que usuários cadastrem documentos, visualizem o conjunto de arquivos enviados e realizem o download dos documentos armazenados de forma local, mantendo os metadados em memória e respeitando a arquitetura em camadas do backend.

## 2. Escopo

### Dentro do escopo

- Upload de documentos por usuários
- Listagem de documentos disponíveis
- Download de documento por identificador
- Associação de cada documento a um dono (owner)
- Persistência do arquivo no filesystem local da aplicação usando multer e diskStorage
- Manutenção dos metadados em memória durante a execução da aplicação
- Suporte a API REST para integração com frontend

### Fora do escopo

- Armazenamento externo ou em nuvem
- Versionamento de documentos
- Recuperação de arquivos apagados
- Controle de permissões avançado por papel/role
- Autenticação e autorização com usuários reais em fase inicial
- Sincronização entre múltiplas instâncias da aplicação
- Busca textual ou indexação de conteúdo dos documentos
- Compressão, conversão ou processamento do arquivo enviado

## 3. Requisitos funcionais

| ID | Requisito |
| --- | --------- |
| RF-01 | O sistema deve permitir o envio de um arquivo pelo usuário, informando o documento e o identificador do proprietário. |
| RF-02 | O upload deve gravar o arquivo no filesystem local da aplicação, preservando o nome original para uso na interface e para download. |
| RF-03 | O sistema deve gerar um identificador único para cada documento salvo. |
| RF-04 | O sistema deve registrar os metadados do documento, incluindo nome original, tamanho, data de upload e dono. |
| RF-05 | O usuário deve poder listar todos os documentos já enviados, retornando os metadados disponíveis. |
| RF-06 | O usuário deve poder consultar um documento pelo identificador para obter o arquivo correspondente. |
| RF-07 | O sistema deve permitir o download do arquivo original salvo em storage local. |
| RF-08 | Caso o documento solicitado não exista, a API deve responder com erro explícito e status adequado. |
| RF-09 | O sistema deve rejeitar uploads inválidos quando o arquivo estiver ausente ou a entrada for inconsistente. |
| RF-10 | A listagem deve permitir identificar rapidamente o dono e o momento em que o documento foi enviado. |
| RF-11 | O sistema deve manter o fluxo de operação simples: upload, listagem e download sem necessidade de processamento adicional no arquivo. |
| RF-12 | O processo de gestão do documento deve ser orientado por usuário, mesmo que a autenticação não exista como mecanismo central nesta fase. |

### Regras de negócio principais

- Cada documento deve possuir um identificador único em formato textual.
- O nome original do arquivo deve ser preservado para apresentação ao usuário.
- O tamanho do arquivo deve ser armazenado em bytes.
- O campo owner deve representar o usuário responsável pelo documento.
- O arquivo físico deve permanecer disponível no diretório local de storage durante a execução da aplicação.
- O sistema não deve implementar versionamento, sobrescrita controlada ou histórico de versões.

## 4. Requisitos não funcionais

| ID | Requisito |
| --- | --------- |
| RNF-01 | Os arquivos enviados devem ser gravados no filesystem local da aplicação, em pasta de storage configurada para uso do multer. |
| RNF-02 | Os metadados dos documentos devem permanecer em memória durante a execução da aplicação, sem persistência em banco ou serviço externo. |
| RNF-03 | A aplicação deve permitir configuração por variáveis de ambiente seguindo os princípios do 12-Factor App. |
| RNF-04 | A API deve ser acessível por clientes web usando HTTP e JSON como formato principal para metadados. |
| RNF-05 | O frontend deve consumir a API via prefixo /api, com proxy configurado em ambiente de desenvolvimento. |
| RNF-06 | O resultado das operações de upload e listagem deve ser previsível, simples e adequado ao uso em interface web. |
| RNF-07 | O sistema deve tratar erros de entrada e ausência de recursos de forma consistente, retornando respostas HTTP com status adequado. |

## 5. Modelo de dados

### 5.1 Estrutura de metadados do documento

| Campo | Tipo | Descrição |
| ----- | ---- | --------- |
| id | string | Identificador único do documento. |
| originalName | string | Nome original do arquivo enviado pelo cliente. |
| storedName | string | Nome do arquivo salvo no storage local, usado internamente para evitar colisões. |
| size | number | Tamanho do arquivo em bytes. |
| mimeType | string | Tipo de conteúdo do arquivo, quando informado pelo cliente ou pela biblioteca de upload. |
| uploadedAt | string | Data e hora do upload em formato ISO 8601. |
| owner | string | Identificador do usuário responsável pelo documento. |
| storagePath | string | Caminho local do arquivo salvo em storage, usado pela camada de persistência e pelo endpoint de download. |

### 5.2 Observações do modelo

- O modelo principal é de metadados, não de entidade relacional.
- A informação de storagePath é interna e necessária para localizar o arquivo físico no filesystem local.
- Os dados de documento devem ser armazenados em memória na aplicação, com ciclo de vida do processo em execução.
- O uso de storedName evita conflitos entre arquivos com o mesmo nome original.

## 6. Contratos de API

### 6.1 POST /upload

#### Objetivo

Enviar um arquivo para o sistema e registrar seus metadados.

#### Método

- HTTP: POST
- Content-Type: multipart/form-data

#### Entrada

| Campo | Tipo | Obrigatório | Descrição |
| ----- | ---- | ---------- | --------- |
| file | file | Sim | Arquivo enviado pelo usuário. |
| owner | string | Sim | Identificador do usuário dono do documento. |

#### Regras

- O arquivo deve estar presente e ser válido.
- O identificador owner deve ser informado para manter o vínculo de responsabilidade.
- O arquivo deve ser salvo em storage local usando multer.

#### Resposta de sucesso

- Status: 201 Created
- Body: JSON com os metadados do documento criado.

Exemplo:

```json
{
  "id": "doc_123",
  "originalName": "relatorio.pdf",
  "storedName": "relatorio_20260915_123456.pdf",
  "size": 245678,
  "mimeType": "application/pdf",
  "uploadedAt": "2026-09-15T12:34:56.000Z",
  "owner": "user-001",
  "storagePath": "/app/backend/storage/relatorio_20260915_123456.pdf"
}
```

#### Possíveis erros

- 400 Bad Request: arquivo ausente ou entrada inválida
- 500 Internal Server Error: falha ao gravar o arquivo ou registrar metadata

### 6.2 GET /documents

#### Objetivo

Listar todos os documentos registrados.

#### Método

- HTTP: GET

#### Resposta de sucesso

- Status: 200 OK
- Body: array de documentos com metadados.

Exemplo:

```json
[
  {
    "id": "doc_123",
    "originalName": "relatorio.pdf",
    "size": 245678,
    "uploadedAt": "2026-09-15T12:34:56.000Z",
    "owner": "user-001"
  },
  {
    "id": "doc_456",
    "originalName": "contrato.docx",
    "size": 89021,
    "uploadedAt": "2026-09-15T15:00:00.000Z",
    "owner": "user-002"
  }
]
```

#### Possíveis erros

- 500 Internal Server Error: falha na leitura do armazenamento em memória

### 6.3 GET /documents/:id/download

#### Objetivo

Recuperar o conteúdo do arquivo físico associado a um documento.

#### Método

- HTTP: GET

#### Parâmetro de rota

| Nome | Tipo | Descrição |
| ---- | ---- | --------- |
| id | string | Identificador único do documento. |

#### Resposta de sucesso

- Status: 200 OK
- Content-Type: conforme tipo do arquivo
- Body: conteúdo binário do arquivo
- Header: Content-Disposition com nome do arquivo original

#### Possíveis erros

- 404 Not Found: documento inexistente
- 500 Internal Server Error: erro na leitura do arquivo do filesystem

### 6.4 Convenções de resposta e erros

- A API deve responder em JSON para metadados.
- O endpoint de download deve responder com o binário do arquivo, sem conversão de conteúdo.
- Erros esperados devem seguir coerência HTTP básica: ausência de recurso, entrada inválida e falhas no processamento.
- Respostas devem manter mensagens em português para melhor clareza ao usuário.

## 7. Decisões arquiteturais

### 7.1 Clean Architecture simples

A aplicação deve seguir a estrutura mínima em camadas:

- routes: definição dos endpoints e delegação para controle
- controllers: tratamento da entrada HTTP e retorno de respostas
- services: regras de negócio, validação e orquestração
- repositories: acesso e atualização dos dados em memória e do filesystem local

#### Diretrizes

- As camadas internas não devem conhecer a camada de interface web.
- O fluxo de dependência deve ser estritamente: routes -> controllers -> services -> repositories.
- Cada camada deve ter responsabilidade única e bem definida.

### 7.2 Armazenamento local

- O arquivo deve ser salvo no filesystem local da aplicação, em diretório específico de storage.
- O uso de multer com diskStorage é obrigatório para cumprir a restrição do projeto.
- O resultado do upload deve ser rastreado por metadados em memória, sem uso de banco de dados ou storage externo.

### 7.3 Frontend

- O frontend deve utilizar React e comunicação via fetch com prefixo /api.
- A interface deve consumir os endpoints definidos e apresentar uma experiência simples de upload, listagem e download.
- Não existe necessidade de persistência local no browser para esta fase.

## 8. Plano de execução

### Etapa 1 - Definição do problema e alinhamento do escopo

- Confirmar o objetivo do sistema e os limites do produto.
- Validar que o foco está em upload, listagem e download de documentos.
- Definir que a solução será local, simples e orientada por usuário.

### Etapa 2 - Modelagem dos requisitos e regras de negócio

- Consolidar os requisitos funcionais e não funcionais.
- Definir o identificador do documento, o dono, o timestamp de upload e os campos principais dos metadados.
- Estabelecer as regras de fluxo de operação e cenários de erro esperados.

### Etapa 3 - Definição dos contratos de API

- Formalizar o contrato de upload em multipart/form-data.
- Definir a estrutura de resposta da listagem e o comportamento do download por identificador.
- Especificar status HTTP e cenários de erro da API.

### Etapa 4 - Projeto da camada de armazenamento e dados

- Definir a política de armazenamento local com multer e diskStorage.
- Especificar a organização dos arquivos e a relação entre arquivo físico e metadados em memória.
- Garantir que o nome original e o nome salvo sejam consistentes com o uso do sistema.

### Etapa 5 - Validação do comportamento esperado

- Validar cenários principais de sucesso: upload, listagem e download.
- Validar erros de arquivo ausente, documento inexistente e problemas de leitura/escrita.
- Confirmar que o sistema atende ao objetivo de gestão simples de documentos.

### Etapa 6 - Preparação para entrega e evolução

- Revisar a consistência entre requisitos, modelo de dados e contratos.
- Verificar se a solução está alinhada com a arquitetura em camadas e com as restrições da fase atual.
- Registrar melhorias possíveis para evolução futura, sem ampliar o escopo inicial do DMS.

## 9. Critérios de aceitação

- O usuário consegue enviar um documento e obter confirmação do registro.
- O sistema lista os documentos com metadados básicos suficientes para identificação.
- O sistema consegue baixar corretamente o arquivo salvo no filesystem local.
- O fluxo funciona sem uso de armazenamento externo.
- O sistema mantém a arquitetura em camadas e os dados relevantes em memória.
- O comportamento de erro é claro e consistente para entradas inválidas ou recursos inexistentes.

## 10. Resumo executivo

O Document Management System proposto é uma solução local, simples e funcional para upload, listagem e download de arquivos. A arquitetura prioriza responsabilidade por camada, armazenamento local via multer, metadados em memória e APIs REST compatíveis com um frontend em React. O objetivo é fornecer uma base sólida para operação de documentos em ambiente limitado, sem introduzir complexidade desnecessária ou dependências externas.
