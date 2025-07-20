import uuid
from typing import Any

from fastapi import APIRouter, HTTPException
from sqlmodel import func, select

from app.api.deps import CurrentUser, SessionDep
from app.models import (
    Chore,
    ChoreCreate,
    ChorePublic,
    ChoresPublic,
    ChoreUpdate,
    Message,
)

router = APIRouter(prefix="/chores", tags=["chores"])


@router.get("/", response_model=ChoresPublic)
def read_chores(
    session: SessionDep, 
    current_user: CurrentUser, 
    is_active: bool | None = None,
    skip: int = 0, 
    limit: int = 100
) -> Any:
    """
    Retrieve chores for the current user, optionally filtered by active status.
    """
    # Base query for user's chores
    base_query = select(Chore).where(Chore.user_id == current_user.id)
    
    # Filter by active status if specified
    if is_active is not None:
        base_query = base_query.where(Chore.is_active == is_active)
    
    # Count query
    count_statement = select(func.count()).select_from(base_query.subquery())
    count = session.exec(count_statement).one()
    
    # Data query with pagination
    statement = (
        base_query
        .offset(skip)
        .limit(limit)
        .order_by(Chore.created_at)
    )
    chores = session.exec(statement).all()

    return ChoresPublic(data=chores, count=count)


@router.get("/{id}", response_model=ChorePublic)
def read_chore(session: SessionDep, current_user: CurrentUser, id: uuid.UUID) -> Any:
    """
    Get chore by ID.
    """
    chore = session.get(Chore, id)
    if not chore:
        raise HTTPException(status_code=404, detail="Chore not found")
    if chore.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    return chore


@router.post("/", response_model=ChorePublic)
def create_chore(
    *, session: SessionDep, current_user: CurrentUser, chore_in: ChoreCreate
) -> Any:
    """
    Create new chore.
    """
    chore = Chore.model_validate(chore_in, update={"user_id": current_user.id})
    session.add(chore)
    session.commit()
    session.refresh(chore)
    return chore


@router.put("/{id}", response_model=ChorePublic)
def update_chore(
    *,
    session: SessionDep,
    current_user: CurrentUser,
    id: uuid.UUID,
    chore_in: ChoreUpdate,
) -> Any:
    """
    Update a chore.
    """
    chore = session.get(Chore, id)
    if not chore:
        raise HTTPException(status_code=404, detail="Chore not found")
    if chore.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    update_dict = chore_in.model_dump(exclude_unset=True)
    chore.sqlmodel_update(update_dict)
    session.add(chore)
    session.commit()
    session.refresh(chore)
    return chore


@router.delete("/{id}")
def delete_chore(
    session: SessionDep, current_user: CurrentUser, id: uuid.UUID
) -> Message:
    """
    Delete a chore.
    """
    chore = session.get(Chore, id)
    if not chore:
        raise HTTPException(status_code=404, detail="Chore not found")
    if chore.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    session.delete(chore)
    session.commit()
    return Message(message="Chore deleted successfully")


@router.patch("/{id}/toggle-active", response_model=ChorePublic)
def toggle_chore_active(
    *,
    session: SessionDep,
    current_user: CurrentUser,
    id: uuid.UUID,
) -> Any:
    """
    Toggle the active status of a chore.
    """
    chore = session.get(Chore, id)
    if not chore:
        raise HTTPException(status_code=404, detail="Chore not found")
    if chore.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    chore.is_active = not chore.is_active
    session.add(chore)
    session.commit()
    session.refresh(chore)
    return chore