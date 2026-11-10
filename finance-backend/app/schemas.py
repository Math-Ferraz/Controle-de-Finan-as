# garantem a validação dos dados que entram na API e formatam os dados que saem.

from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import Optional
from app.models import TransactionType

# --- SCHEMAS DE USUÁRIO ---
class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: int
    name: str
    email: EmailStr
    created_at: datetime

    class Config:
        from_attributes = True

# --- SCHEMAS DE AUTENTICAÇÃO ---
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    user_id: Optional[int] = None

# --- SCHEMAS DE CATEGORIA ---
class CategoryCreate(BaseModel):
    name: str
    type: TransactionType
    color: Optional[str] = "#6B7280"

class CategoryResponse(BaseModel):
    id: int
    name: str
    type: TransactionType
    color: str

    class Config:
        from_attributes = True

# --- SCHEMAS DE TRANSAÇÃO ---
class TransactionCreate(BaseModel):
    description: str
    amount: float
    type: TransactionType
    category_id: Optional[int] = None
    date: Optional[datetime] = None  # <-- Adicionado campo opcional de data

class TransactionResponse(BaseModel):
    id: int
    description: str
    amount: float
    type: TransactionType
    date: datetime
    category_id: Optional[int] = None

    class Config:
        from_attributes = True