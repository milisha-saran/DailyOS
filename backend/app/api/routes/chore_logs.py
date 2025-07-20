import uuid
from datetime import datetime
from typing import Any

from fastapi import APIRouter, HTTPException
from sqlmodel import func, select

from app.api.deps import CurrentUser, SessionDep
from app.models import (
    Chore,
    ChoreLog,
    ChoreLogCreate,
    ChoreLogPublic,
    ChoreLogsPublic,
    ChoreLogUpdate,
    Message,
)

router = APIRouter(prefix="/chore-logs", tags=["chore-logs"])


@router.get("/", response_model=ChoreLogsPublic)
def read_chore_logs(
    session: SessionDep, 
    current_user: CurrentUser, 
    chore_id: uuid.UUID | None = None,
    date_from: datetime | None = None,
    date_to: datetime | None = None,
    skip: int = 0, 
    limit: int = 100
) -> Any:
    """
    Retrieve chore logs for the current user, optionally filtered by chore and date range.
    """
    # Base query for user's chore logs through chore relationship
    base_query = (
        select(ChoreLog)
        .join(Chore)
        .where(Chore.user_id == current_user.id)
    )
    
    # Filter by chore if specified
    if chore_id:
        base_query = base_query.where(ChoreLog.chore_id == chore_id)
    
    # Filter by date range if specified
    if date_from:
        base_query = base_query.where(ChoreLog.date >= date_from)
    if date_to:
        base_query = base_query.where(ChoreLog.date <= date_to)
    
    # Count query
    count_statement = select(func.count()).select_from(base_query.subquery())
    count = session.exec(count_statement).one()
    
    # Data query with pagination
    statement = (
        base_query
        .offset(skip)
        .limit(limit)
        .order_by(ChoreLog.date, ChoreLog.created_at)
    )
    chore_logs = session.exec(statement).all()

    return ChoreLogsPublic(data=chore_logs, count=count)


@router.get("/{id}", response_model=ChoreLogPublic)
def read_chore_log(session: SessionDep, current_user: CurrentUser, id: uuid.UUID) -> Any:
    """
    Get chore log by ID.
    """
    chore_log = session.get(ChoreLog, id)
    if not chore_log:
        raise HTTPException(status_code=404, detail="Chore log not found")
    
    # Check if user owns the chore that this log belongs to
    chore = session.get(Chore, chore_log.chore_id)
    if not chore or chore.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    return chore_log


@router.post("/", response_model=ChoreLogPublic)
def create_chore_log(
    *, session: SessionDep, current_user: CurrentUser, chore_log_in: ChoreLogCreate
) -> Any:
    """
    Create new chore log.
    """
    # Verify the chore belongs to the current user
    chore = session.get(Chore, chore_log_in.chore_id)
    if not chore:
        raise HTTPException(status_code=404, detail="Chore not found")
    if chore.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    chore_log = ChoreLog.model_validate(chore_log_in)
    session.add(chore_log)
    session.commit()
    session.refresh(chore_log)
    return chore_log


@router.put("/{id}", response_model=ChoreLogPublic)
def update_chore_log(
    *,
    session: SessionDep,
    current_user: CurrentUser,
    id: uuid.UUID,
    chore_log_in: ChoreLogUpdate,
) -> Any:
    """
    Update a chore log.
    """
    chore_log = session.get(ChoreLog, id)
    if not chore_log:
        raise HTTPException(status_code=404, detail="Chore log not found")
    
    # Check if user owns the chore that this log belongs to
    chore = session.get(Chore, chore_log.chore_id)
    if not chore or chore.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    update_dict = chore_log_in.model_dump(exclude_unset=True)
    chore_log.sqlmodel_update(update_dict)
    session.add(chore_log)
    session.commit()
    session.refresh(chore_log)
    return chore_log


@router.delete("/{id}")
def delete_chore_log(
    session: SessionDep, current_user: CurrentUser, id: uuid.UUID
) -> Message:
    """
    Delete a chore log.
    """
    chore_log = session.get(ChoreLog, id)
    if not chore_log:
        raise HTTPException(status_code=404, detail="Chore log not found")
    
    # Check if user owns the chore that this log belongs to
    chore = session.get(Chore, chore_log.chore_id)
    if not chore or chore.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    session.delete(chore_log)
    session.commit()
    return Message(message="Chore log deleted successfully")