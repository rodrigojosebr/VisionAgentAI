# Analisador de Imagens com IA (Gemini)

Este projeto é uma ferramenta de linha de comando desenvolvida em Node.js que utiliza a API do Google Gemini para gerar descrições textuais confiáveis para uma lista de imagens fornecidas em uma planilha do Excel.

A principal característica desta ferramenta é o uso de um padrão de IA multi-agente para melhorar a precisão das descrições e reduzir a probabilidade de "alucinações" da IA.

## Arquitetura

O fluxo de trabalho do script é dividido em duas fases principais:

1.  **Fase de Avaliação:** Para cada URL de imagem lida da planilha, o sistema faz três chamadas paralelas e independentes para a API do Gemini. Cada uma dessas chamadas atua como um "agente avaliador", gerando uma descrição concisa de uma única sentença para a imagem.

2.  **Fase de Julgamento:** As três descrições geradas na fase anterior são então enviadas para um "agente juiz". Esta é uma quarta chamada à API Gemini, instruída a analisar as três descrições, agir como um juiz imparcial e consolidar a análise em uma única descrição final, baseada em consenso.

## Tecnologias Principais

-   **Linguagem:** JavaScript (Node.js)
-   **Modelo de IA:** Google Gemini (`@google/generative-ai`)
-   **Leitura de Dados:** `xlsx` para manipular arquivos Excel (`.xlsx`).
-   **Configuração:** `dotenv` para gerenciar variáveis de ambiente (chaves de API).

## Pré-requisitos

Antes de começar, você precisará ter o seguinte instalado:

-   [Node.js](https://nodejs.org/) (versão 18 ou superior)
-   Uma chave de API do Google Gemini. Você pode obter uma no [Google AI Studio](https://aistudio.google.com/app/apikey).

## Instalação

1.  Clone o repositório para sua máquina local:
    ```bash
    git clone <URL_DO_SEU_REPOSITORIO>
    ```

2.  Navegue até o diretório do projeto:
    ```bash
    cd <NOME_DO_DIRETORIO>
    ```

3.  Instale as dependências necessárias. Você pode usar npm ou yarn:
    ```bash
    # Usando npm
    npm install

    # Ou usando yarn
    yarn install
    ```

## Configuração

1.  **Arquivo de Ambiente:**
    Crie um arquivo chamado `.env` na raiz do projeto.

2.  **Chave de API:**
    Adicione sua chave de API do Google Gemini ao arquivo `.env` no seguinte formato:
    ```
    API_KEY=sua_chave_de_api_aqui
    ```

3.  **Dados de Entrada:**
    O script lê as URLs das imagens de um arquivo `data.xlsx`. Certifique-se de que este arquivo esteja na raiz do projeto e contenha uma coluna chamada `url` com as URLs das imagens a serem analisadas.

## Como Usar

Para executar o script, use o comando `start` do npm:

```bash
npm start
```

O script irá processar cada imagem do arquivo `data.xlsx`, e os resultados (descrições finais) serão exibidos no console.

## Testes

Atualmente, não há uma suíte de testes configurada para este projeto. O comando de teste padrão retornará um erro.

```bash
npm test
```
