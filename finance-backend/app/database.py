#Configura a Conexão com o Banco - Gerencia a sessão e a conexão com o PostgreSQL.
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
import os
from dotenv import load_dotenv

load_dotenv()

# Para testes rápidos sem subir o Postgres de início, você pode trocar por: "sqlite:///./finance.db"
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./finance.db")

connect_args = {"check_same_thread": False} if "sqlite" in DATABASE_URL else {}

engine = create_engine(DATABASE_URL, connect_args=connect_args)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

# Dependency para injetar a sessão do banco nas rotas
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()