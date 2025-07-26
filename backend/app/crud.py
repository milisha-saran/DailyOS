import uuid
from typing import Any
from datetime import datetime, timedelta

from sqlmodel import Session, select

from app.core.security import get_password_hash, verify_password
from app.models import (
    Item, ItemCreate, User, UserCreate, UserUpdate,
    Chore, ChoreLog, ChoreFrequency
)


def create_user(*, session: Session, user_create: UserCreate) -> User:
    db_obj = User.model_validate(
        user_create, update={"hashed_password": get_password_hash(user_create.password)}
    )
    session.add(db_obj)
    session.commit()
    session.refresh(db_obj)
    return db_obj


def update_user(*, session: Session, db_user: User, user_in: UserUpdate) -> Any:
    user_data = user_in.model_dump(exclude_unset=True)
    extra_data = {}
    if "password" in user_data:
        password = user_data["password"]
        hashed_password = get_password_hash(password)
        extra_data["hashed_password"] = hashed_password
    db_user.sqlmodel_update(user_data, update=extra_data)
    session.add(db_user)
    session.commit()
    session.refresh(db_user)
    return db_user


def get_user_by_email(*, session: Session, email: str) -> User | None:
    statement = select(User).where(User.email == email)
    session_user = session.exec(statement).first()
    return session_user


def authenticate(*, session: Session, email: str, password: str) -> User | None:
    db_user = get_user_by_email(session=session, email=email)
    if not db_user:
        return None
    if not verify_password(password, db_user.hashed_password):
        return None
    return db_user


def create_item(*, session: Session, item_in: ItemCreate, owner_id: uuid.UUID) -> Item:
    db_item = Item.model_validate(item_in, update={"owner_id": owner_id})
    session.add(db_item)
    session.commit()
    session.refresh(db_item)
    return db_item


def get_chores_needing_instances(*, session: Session, user_id: uuid.UUID, target_date: datetime) -> list[Chore]:
    """
    Get active chores that need instances generated for the target date.
    """
    statement = select(Chore).where(
        Chore.user_id == user_id,
        Chore.is_active == True
    )
    chores = session.exec(statement).all()
    
    chores_needing_instances = []
    
    for chore in chores:
        if should_generate_chore_instance(session=session, chore=chore, target_date=target_date):
            chores_needing_instances.append(chore)
    
    return chores_needing_instances


def should_generate_chore_instance(*, session: Session, chore: Chore, target_date: datetime) -> bool:
    """
    Determine if a chore instance should be generated for the target date.
    """
    # Check if there's already a log for this date
    existing_log = session.exec(
        select(ChoreLog).where(
            ChoreLog.chore_id == chore.id,
            ChoreLog.date >= target_date.replace(hour=0, minute=0, second=0, microsecond=0),
            ChoreLog.date < target_date.replace(hour=0, minute=0, second=0, microsecond=0) + timedelta(days=1)
        )
    ).first()
    
    if existing_log:
        return False
    
    # Check frequency requirements
    if chore.frequency == ChoreFrequency.DAILY:
        return True
    
    elif chore.frequency == ChoreFrequency.WEEKLY:
        # Generate on Mondays (weekday 0)
        return target_date.weekday() == 0
    
    elif chore.frequency == ChoreFrequency.MONTHLY:
        # Generate on the 1st of each month
        return target_date.day == 1
    
    return False


def generate_chore_instances(*, session: Session, user_id: uuid.UUID, target_date: datetime | None = None) -> list[ChoreLog]:
    """
    Generate chore instances (ChoreLog entries) for chores that need them.
    Returns a list of created ChoreLog instances.
    """
    if target_date is None:
        target_date = datetime.utcnow()
    
    # Normalize target_date to start of day
    target_date = target_date.replace(hour=0, minute=0, second=0, microsecond=0)
    
    chores_needing_instances = get_chores_needing_instances(
        session=session, 
        user_id=user_id, 
        target_date=target_date
    )
    
    created_instances = []
    
    for chore in chores_needing_instances:
        # Create a ChoreLog instance (not completed yet, actual_time_minutes = 0)
        chore_log = ChoreLog(
            chore_id=chore.id,
            date=target_date,
            actual_time_minutes=0  # Not completed yet
        )
        
        session.add(chore_log)
        created_instances.append(chore_log)
    
    if created_instances:
        session.commit()
        for instance in created_instances:
            session.refresh(instance)
    
    return created_instances


def get_pending_chore_instances(*, session: Session, user_id: uuid.UUID, target_date: datetime | None = None) -> list[ChoreLog]:
    """
    Get chore instances that are pending completion for the target date.
    Pending means actual_time_minutes = 0.
    """
    if target_date is None:
        target_date = datetime.utcnow()
    
    # Normalize to start of day
    start_of_day = target_date.replace(hour=0, minute=0, second=0, microsecond=0)
    end_of_day = start_of_day + timedelta(days=1)
    
    statement = (
        select(ChoreLog)
        .join(Chore)
        .where(
            Chore.user_id == user_id,
            ChoreLog.date >= start_of_day,
            ChoreLog.date < end_of_day,
            ChoreLog.actual_time_minutes == 0
        )
    )
    
    return session.exec(statement).all()


def complete_chore_instance(*, session: Session, chore_log_id: uuid.UUID, actual_time_minutes: int) -> ChoreLog | None:
    """
    Mark a chore instance as completed by setting the actual time.
    """
    chore_log = session.get(ChoreLog, chore_log_id)
    if not chore_log:
        return None
    
    chore_log.actual_time_minutes = actual_time_minutes
    session.add(chore_log)
    session.commit()
    session.refresh(chore_log)
    
    return chore_log


def generate_chore_instances_for_date_range(
    *, 
    session: Session, 
    user_id: uuid.UUID, 
    start_date: datetime, 
    end_date: datetime
) -> list[ChoreLog]:
    """
    Generate chore instances for a range of dates.
    Useful for bulk generation or catching up on missed days.
    """
    all_created_instances = []
    current_date = start_date.replace(hour=0, minute=0, second=0, microsecond=0)
    
    while current_date <= end_date:
        instances = generate_chore_instances(
            session=session,
            user_id=user_id,
            target_date=current_date
        )
        all_created_instances.extend(instances)
        current_date += timedelta(days=1)
    
    return all_created_instances
