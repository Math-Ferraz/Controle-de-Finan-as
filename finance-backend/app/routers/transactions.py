# Rotas de Transações e Resumo

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from sqlalchemy import func
from fastapi import Response

from typing import List, Optional
from datetime import datetime
from sqlalchemy import extract, func


from app.database import get_db
from app import models, schemas, security

router = APIRouter(prefix="/transactions", tags=["Transações"])

@router.post("/", response_model=schemas.TransactionResponse, status_code=status.HTTP_201_CREATED)
def create_transaction(
    transaction_in: schemas.TransactionCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(security.get_current_user)
):
    new_transaction = models.Transaction(
        description=transaction_in.description,
        amount=transaction_in.amount,
        type=transaction_in.type,
        category_id=transaction_in.category_id,
        user_id=current_user.id,
        date=transaction_in.date or datetime.now()
    )
    db.add(new_transaction)
    db.commit()
    db.refresh(new_transaction)
    return new_transaction

# 1. Atualizar a rota de listagem de transações com filtro de mês/ano
@router.get("/", response_model=List[schemas.TransactionResponse])
def list_transactions(
    month: Optional[int] = None,
    year: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(security.get_current_user)
):
    query = db.query(models.Transaction).filter(models.Transaction.user_id == current_user.id)
    
    if month and year:
        query = query.filter(
            extract('month', models.Transaction.date) == month,
            extract('year', models.Transaction.date) == year
        )
        
    return query.order_by(models.Transaction.date.desc()).all()

# 2. Atualizar o resumo para considerar os filtros
@router.get("/summary")
def get_summary(
    month: Optional[int] = None,
    year: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(security.get_current_user)
):
    current_m = month or datetime.now().month
    current_y = year or datetime.now().year

    # 1. Resumo do Mês Selecionado
    rec_atual = db.query(func.sum(models.Transaction.amount)).filter(
        models.Transaction.user_id == current_user.id,
        models.Transaction.type == models.TransactionType.RECEITA,
        extract('month', models.Transaction.date) == current_m,
        extract('year', models.Transaction.date) == current_y
    ).scalar() or 0.0

    desp_atual = db.query(func.sum(models.Transaction.amount)).filter(
        models.Transaction.user_id == current_user.id,
        models.Transaction.type == models.TransactionType.DESPESA,
        extract('month', models.Transaction.date) == current_m,
        extract('year', models.Transaction.date) == current_y
    ).scalar() or 0.0

    saldo_atual = rec_atual - desp_atual

    # 2. Resumo do Mês Anterior
    prev_m = 12 if current_m == 1 else current_m - 1
    prev_y = current_y - 1 if current_m == 1 else current_y

    rec_prev = db.query(func.sum(models.Transaction.amount)).filter(
        models.Transaction.user_id == current_user.id,
        models.Transaction.type == models.TransactionType.RECEITA,
        extract('month', models.Transaction.date) == prev_m,
        extract('year', models.Transaction.date) == prev_y
    ).scalar() or 0.0

    desp_prev = db.query(func.sum(models.Transaction.amount)).filter(
        models.Transaction.user_id == current_user.id,
        models.Transaction.type == models.TransactionType.DESPESA,
        extract('month', models.Transaction.date) == prev_m,
        extract('year', models.Transaction.date) == prev_y
    ).scalar() or 0.0

    saldo_prev = rec_prev - desp_prev

    # 3. Diferença de Poupança
    diferenca_poupança = saldo_atual - saldo_prev

    return {
        "total_receitas": rec_atual,
        "total_despesas": desp_atual,
        "saldo": saldo_atual,
        "saldo_mes_anterior": saldo_prev,
        "diferenca_poupanca": diferenca_poupança
    }

@router.put("/{transaction_id}", response_model=schemas.TransactionResponse)
def update_transaction(
    transaction_id: int,
    transaction_in: schemas.TransactionCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(security.get_current_user)
):
    """Atualiza uma transação existente do usuário logado"""
    transaction = db.query(models.Transaction).filter(
        models.Transaction.id == transaction_id,
        models.Transaction.user_id == current_user.id
    ).first()

    if not transaction:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Transação não encontrada"
        )

    transaction.description = transaction_in.description
    transaction.amount = transaction_in.amount
    transaction.type = transaction_in.type
    if transaction_in.category_id:
        transaction.category_id = transaction_in.category_id

    db.commit()
    db.refresh(transaction)
    return transaction


@router.delete("/{transaction_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_transaction(
    transaction_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(security.get_current_user)
):
    """Exclui uma transação do usuário logado"""
    transaction = db.query(models.Transaction).filter(
        models.Transaction.id == transaction_id,
        models.Transaction.user_id == current_user.id
    ).first()

    if not transaction:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Transação não encontrada"
        )

    db.delete(transaction)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)


# 3. Nova rota para obter despesas por categoria (para o Gráfico de Pizza)
@router.get("/by-category")
def get_expenses_by_category(
    month: Optional[int] = None,
    year: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(security.get_current_user)
):
    query = db.query(
        models.Category.name,
        func.sum(models.Transaction.amount).label("total")
    ).join(models.Transaction, models.Transaction.category_id == models.Category.id)\
     .filter(
        models.Transaction.user_id == current_user.id,
        models.Transaction.type == models.TransactionType.DESPESA
    )

    if month and year:
        query = query.filter(
            extract('month', models.Transaction.date) == month,
            extract('year', models.Transaction.date) == year
        )

    results = query.group_by(models.Category.name).all()
    
    return [{"name": name, "value": total} for name, total in results]