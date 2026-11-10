from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app import models, schemas, security

router = APIRouter(prefix="/categories", tags=["Categorias"])

@router.get("/", response_model=List[schemas.CategoryResponse])
def list_categories(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(security.get_current_user)
):
    """Lista as categorias cadastradas (padrões ou do usuário)"""
    return db.query(models.Category).filter(
        (models.Category.user_id == current_user.id) | (models.Category.user_id == None)
    ).all()

@router.post("/", response_model=schemas.CategoryResponse, status_code=status.HTTP_201_CREATED)
def create_category(
    category_in: schemas.CategoryCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(security.get_current_user)
):
    """Cria uma nova categoria associada ao usuário logado"""
    existing = db.query(models.Category).filter(
        models.Category.name == category_in.name,
        (models.Category.user_id == current_user.id) | (models.Category.user_id == None)
    ).first()
    
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Categoria com este nome já existe."
        )

    new_category = models.Category(
        name=category_in.name,
        type=category_in.type,
        color=category_in.color,
        user_id=current_user.id
    )
    db.add(new_category)
    db.commit()
    db.refresh(new_category)
    return new_category