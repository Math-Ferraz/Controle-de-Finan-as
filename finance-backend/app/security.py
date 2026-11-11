# Lida com o hash seguro da senha do usuário (usando bcrypt) e com a criação/validação dos Tokens JWT

from datetime import datetime, timedelta
from typing import Optional
import hashlib
from jose import JWTError, jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from app.database import get_db
from app import models, schemas

# Configurações globais de segurança (Em produção, mova para o ficheiro .env)
SECRET_KEY = "sua_chave_secreta_super_segura_aqui_troque_em_producao"
SECRET_SALT = "sua_chave_salt_super_segura_para_senhas"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24  # Token válido por 24 horas

# Define a rota onde o Swagger irá enviar as credenciais para obter o token
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")

# --- HASH E VERIFICAÇÃO DE SENHAS ---
def get_password_hash(password: str) -> str:
    """Gera o hash da senha combinando com o salt interno usando SHA-256."""
    return hashlib.sha256((password + SECRET_SALT).encode('utf-8')).hexdigest()

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verifica se a senha enviada corresponde ao hash guardado."""
    return get_password_hash(plain_password) == hashed_password

# --- CRIAÇÃO E VALIDAÇÃO DE TOKENS JWT ---
def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Gera um token JWT com tempo de expiração definido."""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

# --- DEPENDÊNCIA PARA PROTEGER ROTAS ---
def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> models.User:
    """Valida o token JWT no cabeçalho Authorization e retorna o utilizador autenticado."""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Não foi possível validar as credenciais",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id_str: str = payload.get("sub")
        if user_id_str is None:
            raise credentials_exception
        user_id = int(user_id_str)
    except (JWTError, ValueError):
        raise credentials_exception

    user = db.query(models.User).filter(models.User.id == user_id).first()
    if user is None:
        raise credentials_exception
    return user