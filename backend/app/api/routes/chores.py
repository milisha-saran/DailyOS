import uuid
from datetime import datetime
from typing import Any

from fastapi import APIRouter, HTTPException
from sqlmodel import func, select

from app.api.deps import CurrentUser, SessionDep
from app.crud import (
    generate_chore_instances,
    get_pending_chore_instances,
    complete_chore_instance,
    generate_chore_instances_for_date_range
)
from app.models import (
    Chore,
    ChoreCreate,
    ChorePublic,
    ChoresPublic,
    ChoreUpdate,
    ChoreLog,
    ChoreLogPublic,
    ChoreLogsPublic,
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


@router.post("/generate-instances", response_model=ChoreLogsPublic)
def generate_chore_instances_endpoint(
    *,
    session: SessionDep,
    current_user: CurrentUser,
    target_date: datetime | None = None,
) -> Any:
    """
    Generate chore instances for the current user for the target date (defaults to today).
    """
    instances = generate_chore_instances(
        session=session,
        user_id=current_user.id,
        target_date=target_date
    )
    
    return ChoreLogsPublic(data=instances, count=len(instances))


@router.get("/pending-instances", response_model=ChoreLogsPublic)
def get_pending_chore_instances_endpoint(
    *,
    session: SessionDep,
    current_user: CurrentUser,
    target_date: datetime | None = None,
) -> Any:
    """
    Get pending (uncompleted) chore instances for the target date (defaults to today).
    """
    instances = get_pending_chore_instances(
        session=session,
        user_id=current_user.id,
        target_date=target_date
    )
    
    return ChoreLogsPublic(data=instances, count=len(instances))


@router.patch("/instances/{instance_id}/complete", response_model=ChoreLogPublic)
def complete_chore_instance_endpoint(
    *,
    session: SessionDep,
    current_user: CurrentUser,
    instance_id: uuid.UUID,
    actual_time_minutes: int,
) -> Any:
    """
    Mark a chore instance as completed with the actual time spent.
    """
    if actual_time_minutes <= 0:
        raise HTTPException(status_code=400, detail="Actual time must be positive")
    
    # Verify the chore instance belongs to the current user
    chore_log = session.get(ChoreLog, instance_id)
    if not chore_log:
        raise HTTPException(status_code=404, detail="Chore instance not found")
    
    # Check ownership through chore relationship
    chore = session.get(Chore, chore_log.chore_id)
    if not chore or chore.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    completed_instance = complete_chore_instance(
        session=session,
        chore_log_id=instance_id,
        actual_time_minutes=actual_time_minutes
    )
    
    if not completed_instance:
        raise HTTPException(status_code=404, detail="Chore instance not found")
    
    return completed_instance


@router.post("/generate-instances-range", response_model=ChoreLogsPublic)
def generate_chore_instances_for_range(
    *,
    session: SessionDep,
    current_user: CurrentUser,
    start_date: datetime,
    end_date: datetime,
) -> Any:
    """
    Generate chore instances for a date range. Useful for bulk generation.
    """
    if start_date > end_date:
        raise HTTPException(status_code=400, detail="Start date must be before end date")
    
    instances = generate_chore_instances_for_date_range(
        session=session,
        user_id=current_user.id,
        start_date=start_date,
        end_date=end_date
    )
    
    return ChoreLogsPublic(data=instances, count=len(instances))