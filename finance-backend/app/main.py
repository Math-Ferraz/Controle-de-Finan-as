from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import engine, Base
from app.routers import auth, categories, transactions

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Finance Dashboard API",
    description="API REST para controle de finanças pessoais",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Registra todos os módulos de rotas
app.include_router(auth.router)
app.include_router(categories.router)
app.include_router(transactions.router)

@app.get("/", tags=["Health Check"])
def read_root():
    return {"status": "ok", "message": "API de Dashboard Financeiro rodando com sucesso!"}