from datetime import datetime, timedelta
from typing import Any

from fastapi import APIRouter
from sqlmodel import func, select

from app.api.deps import CurrentUser, SessionDep
from app.models import (
    Chore,
    ChoreLog,
    Goal,
    Project,
    Task,
    TaskStatus,
)

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("/summary")
def get_dashboard_summary(
    session: SessionDep, 
    current_user: CurrentUser,
) -> Any:
    """
    Get dashboard summary with key metrics for the current user.
    """
    today = datetime.utcnow().date()
    week_start = today - timedelta(days=today.weekday())
    week_end = week_start + timedelta(days=6)
    
    # Project statistics
    projects_count = session.exec(
        select(func.count(Project.id)).where(Project.user_id == current_user.id)
    ).one()
    
    # Goal statistics
    goals_count = session.exec(
        select(func.count(Goal.id))
        .select_from(Goal)
        .join(Project)
        .where(Project.user_id == current_user.id)
    ).one()
    
    # Task statistics
    total_tasks = session.exec(
        select(func.count(Task.id))
        .select_from(Task)
        .join(Goal)
        .join(Project)
        .where(Project.user_id == current_user.id)
    ).one()
    
    completed_tasks = session.exec(
        select(func.count(Task.id))
        .select_from(Task)
        .join(Goal)
        .join(Project)
        .where(Project.user_id == current_user.id)
        .where(Task.status == TaskStatus.DONE)
    ).one()
    
    # Tasks this week
    tasks_this_week = session.exec(
        select(func.count(Task.id))
        .select_from(Task)
        .join(Goal)
        .join(Project)
        .where(Project.user_id == current_user.id)
        .where(Task.date >= week_start)
        .where(Task.date <= week_end)
    ).one()
    
    completed_tasks_this_week = session.exec(
        select(func.count(Task.id))
        .select_from(Task)
        .join(Goal)
        .join(Project)
        .where(Project.user_id == current_user.id)
        .where(Task.status == TaskStatus.DONE)
        .where(Task.date >= week_start)
        .where(Task.date <= week_end)
    ).one()
    
    # Time statistics
    total_time_logged = session.exec(
        select(func.coalesce(func.sum(Task.actual_time_minutes), 0))
        .select_from(Task)
        .join(Goal)
        .join(Project)
        .where(Project.user_id == current_user.id)
    ).one()
    
    time_logged_this_week = session.exec(
        select(func.coalesce(func.sum(Task.actual_time_minutes), 0))
        .select_from(Task)
        .join(Goal)
        .join(Project)
        .where(Project.user_id == current_user.id)
        .where(Task.date >= week_start)
        .where(Task.date <= week_end)
    ).one()
    
    # Time allocated this week (sum of all project weekly allocations)
    weekly_time_allocated = session.exec(
        select(func.coalesce(func.sum(Project.weekly_time_allocated_minutes), 0))
        .where(Project.user_id == current_user.id)
    ).one()
    
    # Chore statistics
    active_chores = session.exec(
        select(func.count(Chore.id))
        .where(Chore.user_id == current_user.id)
        .where(Chore.is_active == True)
    ).one()
    
    chore_logs_this_week = session.exec(
        select(func.count(ChoreLog.id))
        .select_from(ChoreLog)
        .join(Chore)
        .where(Chore.user_id == current_user.id)
        .where(ChoreLog.date >= week_start)
        .where(ChoreLog.date <= week_end)
    ).one()
    
    chore_time_this_week = session.exec(
        select(func.coalesce(func.sum(ChoreLog.actual_time_minutes), 0))
        .select_from(ChoreLog)
        .join(Chore)
        .where(Chore.user_id == current_user.id)
        .where(ChoreLog.date >= week_start)
        .where(ChoreLog.date <= week_end)
    ).one()
    
    # Calculate completion rates
    task_completion_rate = (completed_tasks / total_tasks * 100) if total_tasks > 0 else 0
    weekly_task_completion_rate = (completed_tasks_this_week / tasks_this_week * 100) if tasks_this_week > 0 else 0
    time_allocation_rate = (time_logged_this_week / weekly_time_allocated * 100) if weekly_time_allocated > 0 else 0
    
    return {
        "projects": {
            "total": projects_count,
        },
        "goals": {
            "total": goals_count,
        },
        "tasks": {
            "total": total_tasks,
            "completed": completed_tasks,
            "completion_rate": round(task_completion_rate, 1),
            "this_week": {
                "total": tasks_this_week,
                "completed": completed_tasks_this_week,
                "completion_rate": round(weekly_task_completion_rate, 1),
            }
        },
        "time": {
            "total_logged_minutes": total_time_logged,
            "weekly_allocated_minutes": weekly_time_allocated,
            "this_week": {
                "logged_minutes": time_logged_this_week,
                "allocation_rate": round(time_allocation_rate, 1),
            }
        },
        "chores": {
            "active": active_chores,
            "this_week": {
                "completed": chore_logs_this_week,
                "time_minutes": chore_time_this_week,
            }
        },
        "period": {
            "week_start": week_start.isoformat(),
            "week_end": week_end.isoformat(),
        }
    }


@router.get("/time-by-project")
def get_time_by_project(
    session: SessionDep, 
    current_user: CurrentUser,
    days: int = 7,
) -> Any:
    """
    Get time logged by project for the last N days.
    """
    start_date = datetime.utcnow().date() - timedelta(days=days)
    
    # Get time logged per project
    result = session.exec(
        select(
            Project.id,
            Project.name,
            Project.color,
            func.coalesce(func.sum(Task.actual_time_minutes), 0).label("time_logged")
        )
        .select_from(Project)
        .outerjoin(Goal)
        .outerjoin(Task)
        .where(Project.user_id == current_user.id)
        .where((Task.date >= start_date) | (Task.date.is_(None)))
        .group_by(Project.id, Project.name, Project.color)
        .order_by(func.coalesce(func.sum(Task.actual_time_minutes), 0).desc())
    ).all()
    
    return [
        {
            "project_id": str(row.id),
            "project_name": row.name,
            "project_color": row.color,
            "time_logged_minutes": row.time_logged,
        }
        for row in result
    ]