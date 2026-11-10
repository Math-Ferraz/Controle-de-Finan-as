# 🚀 FinanceApp - Gestão Financeira Full-Stack

O **FinanceApp** é uma aplicação web completa de gestão financeira pessoal desenvolvida com arquitetura moderna e de alta performance. O sistema permite controle total sobre receitas, despesas, categorias dinâmicas, filtros temporais e métricas comparativas mês a mês com gráficos interativos e suporte a **Modo Escuro / Modo Claro**.

---

## 📸 Demonstração da Interface

| Modo Escuro (Dark) | Modo Claro (Light) |
| :---: | :---: |
| <img width="1903" height="992" alt="image" src="https://github.com/user-attachments/assets/ac0bc699-f8cf-4b9b-8612-bf78967d0ef8" />| <img width="1905" height="992" alt="image" src="https://github.com/user-attachments/assets/d94183be-bffe-45f9-b91d-a67e6a885cb3" />

---

## ✨ Funcionalidades Principais

- 🔐 **Autenticação Segura (JWT):** Cadastro, login e controle de sessão com suporte a hashes seguros de senha (`bcrypt`).
- 📊 **Dashboard Financeiro Completo:**
  - Cartões de resumo com **Entradas**, **Saídas** e **Saldo do Mês**.
  - Cartão comparativo **vs. Mês Anterior** para acompanhamento da taxa de economia.
  - Gráfico de Barras (**Balanço do Mês**) e Gráfico de Rosca (**Gastos por Categoria** com legenda e tooltips detalhados).
- 🏷️ **Gestão de Categorias:** Seleção e criação dinâmica de novas categorias personalizadas em tempo real.
- 📅 **Filtro Temporal e Histórico Dinâmico:** Seleção por Mês/Ano com atualização instantânea do painel e listagem detalhada com badges de categoria.
- ⚡ **CRUD de Transações:** Operações completas de Criação, Listagem, Edição e Exclusão com atualização reativa do saldo.
- 🌗 **Alternador de Temas (Dark/Light):** Suporte nativo a modo claro e escuro integrado ao Tailwind CSS.

---

## 🛠️ Tech Stack

### Backend
- **Linguagem:** Python 3.10+
- **Framework:** FastAPI
- **ORM:** SQLAlchemy
- **Banco de Dados:** SQLite (Desenvolvimento) / PostgreSQL (Produção)
- **Validação de Dados:** Pydantic v2
- **Autenticação:** PyJWT & Passlib (Bcrypt)

### Frontend
- **Biblioteca:** React + TypeScript
- **Bundler:** Vite
- **Estilização:** Tailwind CSS v3
- **Gráficos:** Recharts
- **Ícones:** Lucide React
- **HTTP Client:** Axios

---

## 🚀 Como Executar o Projeto Localmente

### Pré-requisitos
- Python 3.10 ou superior
- Node.js 18 ou superior
- npm ou yarn

---

### 1. Configurando o Backend (FastAPI)

```bash
# Acesse a pasta do backend
cd finance-backend

# Crie e ative um ambiente virtual
python -m venv venv

# No Windows (PowerShell):
.\venv\Scripts\activate

# No Linux/macOS:
source venv/bin/activate

# Instale as dependências
pip install -r requirements.txt

# Inicie o servidor em modo de desenvolvimento
uvicorn app.main:app --reload

```

### 2. Configurando o Frontend (React_Vite)
```
# Acesse a pasta do frontend (em outro terminal)
cd finance-frontend

# Instale as dependências
npm install

# Execute o ambiente de desenvolvimento
npm run dev

O frontend estará acessível em http://localhost:5173.
```

### Estrutura do Projeto
```Plaintext
Controle-de-Finan-as/
├── finance-backend/
│   ├── app/
│   │   ├── models.py          # Modelos de dados do SQLAlchemy
│   │   ├── schemas.py         # Schemas de validação Pydantic
│   │   ├── database.py        # Conexão com o banco de dados
│   │   ├── security.py        # Hashing e geração de tokens JWT
│   │   └── routers/
│   │       ├── auth.py        # Endpoints de Login/Registro
│   │       ├── categories.py  # Endpoints de Categorias
│   │       └── transactions.py# Endpoints de Transações e Resumo
│   ├── main.py                # Ponto de entrada do FastAPI
│   └── requirements.txt
│
└── finance-frontend/
    ├── src/
    │   ├── components/        # Componentes reutilizáveis
    │   ├── pages/
    │   │   ├── Login.tsx      # Tela de autenticação
    │   │   └── Dashboard.tsx  # Painel financeiro principal
    │   ├── services/
    │   │   └── api.ts         # Instância do Axios com Interceptors
    │   ├── App.tsx            # Roteamento e controle de sessão
    │   └── main.tsx
    ├── package.json
    └── tailwind.config.js
```

📝 Licença


Este projeto foi desenvolvido para fins de estudo e portfólio. Sinta-se à vontade para explorar e modificar o código!
