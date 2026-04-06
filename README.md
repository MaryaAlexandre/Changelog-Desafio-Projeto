# Changelog Fluig + Workflow de Sugestões de Melhoria

Projeto desenvolvido para a plataforma **TOTVS Fluig**, com o objetivo de disponibilizar um **widget público de changelog** e um **fluxo BPM para recebimento, análise e tratamento de sugestões de melhoria**.

O projeto reúne:

- **Widget em Vue.js** para exibição do changelog;
- **Datasets customizados** para leitura e normalização dos dados;
- **Formulários Fluig** para cadastro de versões e sugestões;
- **Workflow BPM** para tratamento das solicitações de melhoria;
- **Integração com documentos/anexos** para exibição de imagens no changelog.

---

## Sumário

- [Visão geral](#visão-geral)
- [Objetivo do projeto](#objetivo-do-projeto)
- [Funcionalidades](#funcionalidades)
- [Arquitetura da solução](#arquitetura-da-solução)
- [Estrutura do projeto](#estrutura-do-projeto)
- [Tecnologias utilizadas](#tecnologias-utilizadas)
- [Datasets](#datasets)
- [Formulários](#formulários)
- [Workflow](#workflow)
- [Widget Vue](#widget-vue)
- [Fluxo de funcionamento](#fluxo-de-funcionamento)
- [Configuração do ambiente](#configuração-do-ambiente)
- [Como executar o front Vue](#como-executar-o-front-vue)
- [Como gerar o build do widget](#como-gerar-o-build-do-widget)
- [Como publicar no Fluig](#como-publicar-no-fluig)
- [Melhorias futuras](#melhorias-futuras)
- [Observações importantes](#observações-importantes)
- [Autora](#autora)

---

## Visão geral

Este projeto foi criado para centralizar a comunicação de evoluções do sistema por meio de um **changelog visual e filtrável**, além de permitir que usuários enviem **sugestões de melhoria** por meio de um fluxo estruturado dentro do Fluig.

A solução combina frontend moderno com **Vue 3**, regras de negócio em **JavaScript para Fluig**, datasets personalizados, formulários e processos BPM.

---

## Objetivo do projeto

O objetivo principal é oferecer uma experiência mais organizada e acessível para:

1. **Exibir versões e atualizações do sistema** em formato de changelog;
2. **Permitir que usuários sugiram melhorias** através de um formulário integrado;
3. **Automatizar a análise e tratamento dessas sugestões** com apoio de workflow;
4. **Associar imagens/anexos** às versões publicadas;
5. **Melhorar a transparência** sobre mudanças realizadas no sistema.

---

## Funcionalidades

### Changelog
- Exibição de versões em ordem decrescente;
- Busca textual por versão, resumo, descrição e mudanças;
- Filtro por **categoria**;
- Filtro por **tag**;
- Exibição de imagem associada à versão;
- Paginação incremental com botão **"Ver mais versões"**;
- Exibição da última atualização encontrada;
- Ordenação semântica por versão (`2.10.0` > `2.9.0`).

### Sugestões de melhoria
- Abertura de sugestão via modal no widget;
- Identificação do usuário logado no Fluig;
- Envio de título, descrição, módulo, tipo, impacto e benefício;
- Upload de anexo/imagem;
- Abertura automática de processo BPM;
- Registro do protocolo/instância do processo.

### Regras de negócio no Fluig
- Preenchimento automático de campos como:
  - usuário criador;
  - data de criação;
  - status inicial;
  - origem da solicitação;
- Validações obrigatórias em formulários;
- Controle de edição conforme a atividade do workflow;
- Alteração de status por atividade;
- Registro de encerramento e motivo da decisão.

---

## Arquitetura da solução

A solução está dividida em quatro camadas principais:

### 1. Interface
Responsável pela visualização e interação do usuário:
- widget do Fluig;
- aplicação Vue.js embutida no widget;
- componentes visuais do changelog e do modal de sugestão.

### 2. Integração
Responsável por consumir dados do Fluig:
- datasets customizados;
- endpoints REST do Fluig;
- resolução de imagens por `documentId`.

### 3. Regras de negócio
Responsável por validações e automações:
- `displayFields.js`
- `validateForm.js`
- scripts de processo e eventos do formulário.

### 4. Processo BPM
Responsável pelo ciclo de vida das sugestões:
- abertura;
- validação;
- revisão;
- backlog/aprovação;
- encerramento.

---

## Estrutura do projeto

```bash
changelog-fluig-main/
├── changelog-widget-vue/          # Aplicação Vue utilizada no widget
│   ├── src/
│   │   ├── components/
│   │   ├── services/
│   │   ├── App.vue
│   │   ├── main.js
│   │   └── style.css
│   ├── package.json
│   └── vite.config.js
│
├── datasets/                      # Datasets customizados do Fluig
│   ├── ds_changelogg_marya.js
│   └── ds_sugestaomelhoria_marya.js
│
├── forms/                         # Formulários Fluig
│   ├── formChangelog/
│   └── formSugestaoMelhoria/
│
├── workflow/                      # Processos BPM e scripts
│   ├── diagrams/
│   ├── scripts/
│   └── .resources/
│
├── wcm/
│   └── widget/
│       └── widget_marya/          # Estrutura do widget Fluig
│
├── events/
├── mechanisms/
├── reports/
└── .project
