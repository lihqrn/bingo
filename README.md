# 🎯 Bingo Master Interativo

Sistema de Bingo Interativo moderno, responsivo e em tempo real construído com **Python Flask**, **Bootstrap 5**, **Web Audio API** e persistência 100% no **Browser Storage (LocalStorage)**.

O sistema foi especialmente desenhado para partidas com **cartelas físicas**, servindo como o painel central da mesa para o sorteador, controle de participantes e declaração de vencedores com celebração em tempo real!

---

## 🚀 Funcionalidades

- **Mesa de Bingo & Sorteador Virtual**:
  - Globo visual 3D com destaque para a letra e o número da pedra sorteada (padrão oficial de 75 bolas: B, I, N, G, O).
  - Sorteio manual ("Sortear Pedra") e **Auto-Sorteio** com velocidade configurável (2s, 3.5s, 5s).
  - Efeitos sonoros sintetizados via **Web Audio API** (sem arquivos externos) e locutor de voz sintetizada via **Web Speech API** (*"B-12"*, *"I-24"*, *"Bingo!"*).
  - Fita cronológica com as últimas pedras sorteadas.
  - **Master Board completo (75 pedras)** iluminado em tempo real.

- **Controle de Participantes & Botão de Vitória (BINGO!)**:
  - Lista de participantes cadastrados na partida com avatares e cores personalizadas.
  - Botão exclusivo **🏆 BINGO!** ao lado de cada participante: ao clicar quando alguém na mesa física gritar Bingo, o sistema dispara a celebração triunfal (fanfarra sonora, locutor por voz e chuva de confetes no Canvas).
  - Cadastro e remoção de participantes com modais modernos e estilizados.

- **Modais e Diálogos Visuais (Sem alerts nativos do navegador)**:
  - Confirmações elegantes com Glassmorphism, ícones contextuais e botões estilizados para remoção de participantes, nova rodada e limpeza de dados.

- **Histórico de Rodadas Anteriores**:
  - Armazenado no `LocalStorage` do navegador (sem necessidade de banco de dados SQL).
  - Registra número da rodada, data/hora, vencedor, quantidade de pedras sorteadas e participantes da partida.
  - Exportação dos dados em formato **JSON** e opção de limpeza.

---

## 🏗️ Arquitetura do Projeto

```
to_do_list/
├── app/
│   ├── __init__.py                  # Application Factory (create_app)
│   ├── config.py                    # Configurações de ambiente
│   ├── controllers/
│   │   ├── __init__.py
│   │   └── bingo_controller.py      # Blueprint das rotas e APIs
│   ├── services/
│   │   ├── __init__.py
│   │   └── bingo_service.py         # Regras de negócio, geração e validação de cartelas
│   ├── templates/
│   │   ├── base.html                # Template base (Bootstrap 5, Glassmorphism, Fontes)
│   │   ├── index.html               # Mesa principal do Bingo
│   │   └── partials/
│   │       ├── participant_modal.html
│   │       ├── history_modal.html
│   │       ├── winner_modal.html
│   │       └── confirm_modal.html   # Modal moderno de confirmação
│   └── static/
│       ├── css/
│       │   └── style.css            # Estilização moderna Dark Glassmorphism e micro-animações
│       └── js/
│           ├── audio.js             # Sintetizador sonoro Web Audio & Locutor Web Speech
│           ├── storage.js           # Gerenciador de LocalStorage
│           ├── bingo-engine.js      # Validações e mapeamento de pedras
│           └── app.js               # Orquestrador da interface e reatividade
├── tests/
│   ├── __init__.py
│   ├── conftest.py                  # Fixtures do pytest e test client Flask
│   ├── test_bingo_service.py        # Testes unitários do BingoService
│   └── test_routes.py               # Testes de integração das rotas HTTP
├── requirements.txt
├── run.py                           # Ponto de entrada
└── README.md
```

---

## 🧪 Testes Automatizados

Execução dos testes unitários e de integração com cobertura:

```powershell
py -m pytest tests/ -v --cov=app --cov-report=term-missing
```

**Resultado:** 25 testes aprovados com **98% de cobertura de código**.

---

## 💻 Como Rodar a Aplicação

1. Inicie o servidor:
   ```powershell
   py run.py
   ```

2. Acesse no seu navegador:
   ```
   http://127.0.0.1:5000
   ```
