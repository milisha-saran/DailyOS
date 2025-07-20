import uuid
from typing import Any

from fastapi import APIRouter, HTTPException
from sqlmodel import func, select

from app.api.deps import CurrentUser, SessionDep
from app.models import (
    Goal,
    GoalCreate,
    GoalPublic,
    GoalsPublic,
    GoalUpdate,
    Message,
    Project,
)

router = APIRouter(prefix="/goals", tags=["goals"])


@router.get("/", response_model=GoalsPublic)
def read_goals(
    session: SessionDep, 
    current_user: CurrentUser, 
    project_id: uuid.UUID | None = None,
    skip: int = 0, 
    limit: int = 100
) -> Any:
    """
    Retrieve goals for the current user, optionally filtered by project.
    """
    # Base query for user's goals through project relationship
    base_query = (
        select(Goal)
        .join(Project)
        .where(Project.user_id == current_user.id)
    )
    
    # Filter by project if specified
    if project_id:
        base_query = base_query.where(Goal.project_id == project_id)
    
    # Count query
    count_statement = select(func.count()).select_from(base_query.subquery())
    count = session.exec(count_statement).one()
    
    # Data query with pagination
    statement = (
        base_query
        .offset(skip)
        .limit(limit)
        .order_by(Goal.created_at)
    )
    goals = session.exec(statement).all()

    return GoalsPublic(data=goals, count=count)


@router.get("/{id}", response_model=GoalPublic)
def read_goal(session: SessionDep, current_user: CurrentUser, id: uuid.UUID) -> Any:
    """
    Get goal by ID.
    """
    goal = session.get(Goal, id)
    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found")
    
    # Check if user owns the project that contains this goal
    project = session.get(Project, goal.project_id)
    if not project or project.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    return goal


@router.post("/", response_model=GoalPublic)
def create_goal(
    *, session: SessionDep, current_user: CurrentUser, goal_in: GoalCreate
) -> Any:
    """
    Create new goal.
    """
    # Verify the project belongs to the current user
    project = session.get(Project, goal_in.project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    if project.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    # Validate time allocation doesn't exceed project limits
    if goal_in.daily_time_allocated_minutes is not None:
        if goal_in.daily_time_allocated_minutes > project.daily_time_allocated_minutes:
            raise HTTPException(
                status_code=400, 
                detail="Goal daily time allocation cannot exceed project allocation"
            )
    
    if goal_in.weekly_time_allocated_minutes is not None:
        if goal_in.weekly_time_allocated_minutes > project.weekly_time_allocated_minutes:
            raise HTTPException(
                status_code=400, 
                detail="Goal weekly time allocation cannot exceed project allocation"
            )
    
    goal = Goal.model_validate(goal_in)
    session.add(goal)
    session.commit()
    session.refresh(goal)
    return goal


@router.put("/{id}", response_model=GoalPublic)
def update_goal(
    *,
    session: SessionDep,
    current_user: CurrentUser,
    id: uuid.UUID,
    goal_in: GoalUpdate,
) -> Any:
    """
    Update a goal.
    """
    goal = session.get(Goal, id)
    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found")
    
    # Check if user owns the project that contains this goal
    project = session.get(Project, goal.project_id)
    if not project or project.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    # If updating project_id, verify the new project belongs to user
    if goal_in.project_id and goal_in.project_id != goal.project_id:
        new_project = session.get(Project, goal_in.project_id)
        if not new_project or new_project.user_id != current_user.id:
            raise HTTPException(status_code=403, detail="Not enough permissions")
        project = new_project  # Use new project for validation
    
    # Validate time allocation doesn't exceed project limits
    update_dict = goal_in.model_dump(exclude_unset=True)
    
    if "daily_time_allocated_minutes" in update_dict and update_dict["daily_time_allocated_minutes"] is not None:
        if update_dict["daily_time_allocated_minutes"] > project.daily_time_allocated_minutes:
            raise HTTPException(
                status_code=400, 
                detail="Goal daily time allocation cannot exceed project allocation"
            )
    
    if "weekly_time_allocated_minutes" in update_dict and update_dict["weekly_time_allocated_minutes"] is not None:
        if update_dict["weekly_time_allocated_minutes"] > project.weekly_time_allocated_minutes:
            raise HTTPException(
                status_code=400, 
                detail="Goal weekly time allocation cannot exceed project allocation"
            )
    
    goal.sqlmodel_update(update_dict)
    session.add(goal)
    session.commit()
    session.refresh(goal)
    return goal


@router.delete("/{id}")
def delete_goal(
    session: SessionDep, current_user: CurrentUser, id: uuid.UUID
) -> Message:
    """
    Delete a goal.
    """
    goal = session.get(Goal, id)
    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found")
    
    # Check if user owns the project that contains this goal
    project = session.get(Project, goal.project_id)
    if not project or project.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    session.delete(goal)
    session.commit()
    return Message(message="Goal deleted successfully")