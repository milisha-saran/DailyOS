import uuid
from typing import Any

from fastapi import APIRouter, HTTPException
from sqlmodel import func, select

from app.api.deps import CurrentUser, SessionDep
from app.models import (
    Goal,
    Message,
    Project,
    Task,
    TaskCreate,
    TaskPublic,
    TasksPublic,
    TaskUpdate,
)

router = APIRouter(prefix="/tasks", tags=["tasks"])


@router.get("/", response_model=TasksPublic)
def read_tasks(
    session: SessionDep, 
    current_user: CurrentUser, 
    goal_id: uuid.UUID | None = None,
    project_id: uuid.UUID | None = None,
    skip: int = 0, 
    limit: int = 100
) -> Any:
    """
    Retrieve tasks for the current user, optionally filtered by goal or project.
    """
    # Base query for user's tasks through goal -> project relationship
    base_query = (
        select(Task)
        .join(Goal)
        .join(Project)
        .where(Project.user_id == current_user.id)
    )
    
    # Filter by goal if specified
    if goal_id:
        base_query = base_query.where(Task.goal_id == goal_id)
    
    # Filter by project if specified (through goal relationship)
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
        .order_by(Task.date, Task.created_at)
    )
    tasks = session.exec(statement).all()

    return TasksPublic(data=tasks, count=count)


@router.get("/{id}", response_model=TaskPublic)
def read_task(session: SessionDep, current_user: CurrentUser, id: uuid.UUID) -> Any:
    """
    Get task by ID.
    """
    task = session.get(Task, id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    # Check if user owns the project that contains this task's goal
    goal = session.get(Goal, task.goal_id)
    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found")
    
    project = session.get(Project, goal.project_id)
    if not project or project.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    return task


@router.post("/", response_model=TaskPublic)
def create_task(
    *, session: SessionDep, current_user: CurrentUser, task_in: TaskCreate
) -> Any:
    """
    Create new task.
    """
    # Verify the goal belongs to a project owned by the current user
    goal = session.get(Goal, task_in.goal_id)
    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found")
    
    project = session.get(Project, goal.project_id)
    if not project or project.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    task = Task.model_validate(task_in)
    session.add(task)
    session.commit()
    session.refresh(task)
    return task


@router.put("/{id}", response_model=TaskPublic)
def update_task(
    *,
    session: SessionDep,
    current_user: CurrentUser,
    id: uuid.UUID,
    task_in: TaskUpdate,
) -> Any:
    """
    Update a task.
    """
    task = session.get(Task, id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    # Check if user owns the project that contains this task's goal
    goal = session.get(Goal, task.goal_id)
    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found")
    
    project = session.get(Project, goal.project_id)
    if not project or project.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    # If updating goal_id, verify the new goal belongs to user's project
    if task_in.goal_id and task_in.goal_id != task.goal_id:
        new_goal = session.get(Goal, task_in.goal_id)
        if not new_goal:
            raise HTTPException(status_code=404, detail="New goal not found")
        
        new_project = session.get(Project, new_goal.project_id)
        if not new_project or new_project.user_id != current_user.id:
            raise HTTPException(status_code=403, detail="Not enough permissions")
    
    update_dict = task_in.model_dump(exclude_unset=True)
    task.sqlmodel_update(update_dict)
    session.add(task)
    session.commit()
    session.refresh(task)
    return task


@router.delete("/{id}")
def delete_task(
    session: SessionDep, current_user: CurrentUser, id: uuid.UUID
) -> Message:
    """
    Delete a task.
    """
    task = session.get(Task, id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    # Check if user owns the project that contains this task's goal
    goal = session.get(Goal, task.goal_id)
    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found")
    
    project = session.get(Project, goal.project_id)
    if not project or project.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    session.delete(task)
    session.commit()
    return Message(message="Task deleted successfully")


@router.patch("/{id}/log-time", response_model=TaskPublic)
def log_time_to_task(
    *,
    session: SessionDep,
    current_user: CurrentUser,
    id: uuid.UUID,
    minutes: int,
) -> Any:
    """
    Log time to a task (adds to existing actual_time_minutes).
    """
    if minutes <= 0:
        raise HTTPException(status_code=400, detail="Minutes must be positive")
    
    task = session.get(Task, id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    # Check if user owns the project that contains this task's goal
    goal = session.get(Goal, task.goal_id)
    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found")
    
    project = session.get(Project, goal.project_id)
    if not project or project.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    task.actual_time_minutes += minutes
    session.add(task)
    session.commit()
    session.refresh(task)
    return task