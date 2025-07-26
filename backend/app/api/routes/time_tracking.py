import uuid
from datetime import datetime, date
from typing import Any

from fastapi import APIRouter
from sqlmodel import func, select

from app.api.deps import CurrentUser, SessionDep
from app.models import Goal, Project, Task

router = APIRouter(prefix="/time-tracking", tags=["time-tracking"])


@router.get("/daily-summary")
def get_daily_time_summary(
    session: SessionDep, 
    current_user: CurrentUser,
    target_date: date | None = None
) -> Any:
    """
    Get daily time summary for projects and goals.
    """
    if target_date is None:
        target_date = date.today()
    
    # Get all user's projects
    projects_statement = (
        select(Project)
        .where(Project.user_id == current_user.id)
    )
    projects = session.exec(projects_statement).all()
    
    summary = []
    
    for project in projects:
        # Get goals for this project
        goals_statement = (
            select(Goal)
            .where(Goal.project_id == project.id)
        )
        goals = session.exec(goals_statement).all()
        
        # Calculate total time logged today for this project
        project_time_logged = 0
        goal_summaries = []
        
        for goal in goals:
            # Get tasks for this goal on the target date
            tasks_statement = (
                select(Task)
                .where(
                    Task.goal_id == goal.id,
                    func.date(Task.date) == target_date
                )
            )
            tasks = session.exec(tasks_statement).all()
            
            goal_time_logged = sum(task.actual_time_minutes for task in tasks)
            project_time_logged += goal_time_logged
            
            goal_summaries.append({
                "goal_id": goal.id,
                "goal_name": goal.name,
                "daily_limit": goal.daily_time_allocated_minutes,
                "time_logged": goal_time_logged,
                "remaining": (goal.daily_time_allocated_minutes or 0) - goal_time_logged if goal.daily_time_allocated_minutes else None,
                "percentage": (goal_time_logged / goal.daily_time_allocated_minutes * 100) if goal.daily_time_allocated_minutes else 0,
                "is_over_limit": goal.daily_time_allocated_minutes and goal_time_logged > goal.daily_time_allocated_minutes,
            })
        
        summary.append({
            "project_id": project.id,
            "project_name": project.name,
            "project_color": project.color,
            "daily_limit": project.daily_time_allocated_minutes,
            "time_logged": project_time_logged,
            "remaining": project.daily_time_allocated_minutes - project_time_logged,
            "percentage": (project_time_logged / project.daily_time_allocated_minutes * 100) if project.daily_time_allocated_minutes else 0,
            "is_over_limit": project_time_logged > project.daily_time_allocated_minutes,
            "goals": goal_summaries,
        })
    
    return {
        "date": target_date,
        "projects": summary,
        "total_time_logged": sum(p["time_logged"] for p in summary),
        "total_daily_limit": sum(p["daily_limit"] for p in summary),
    }


@router.get("/weekly-summary")
def get_weekly_time_summary(
    session: SessionDep, 
    current_user: CurrentUser,
    week_start: date | None = None
) -> Any:
    """
    Get weekly time summary for projects and goals.
    """
    if week_start is None:
        today = date.today()
        week_start = today - datetime.timedelta(days=today.weekday())
    
    week_end = week_start + datetime.timedelta(days=6)
    
    # Get all user's projects
    projects_statement = (
        select(Project)
        .where(Project.user_id == current_user.id)
    )
    projects = session.exec(projects_statement).all()
    
    summary = []
    
    for project in projects:
        # Get goals for this project
        goals_statement = (
            select(Goal)
            .where(Goal.project_id == project.id)
        )
        goals = session.exec(goals_statement).all()
        
        # Calculate total time logged this week for this project
        project_time_logged = 0
        goal_summaries = []
        
        for goal in goals:
            # Get tasks for this goal in the week range
            tasks_statement = (
                select(Task)
                .where(
                    Task.goal_id == goal.id,
                    func.date(Task.date) >= week_start,
                    func.date(Task.date) <= week_end
                )
            )
            tasks = session.exec(tasks_statement).all()
            
            goal_time_logged = sum(task.actual_time_minutes for task in tasks)
            project_time_logged += goal_time_logged
            
            goal_summaries.append({
                "goal_id": goal.id,
                "goal_name": goal.name,
                "weekly_limit": goal.weekly_time_allocated_minutes,
                "time_logged": goal_time_logged,
                "remaining": (goal.weekly_time_allocated_minutes or 0) - goal_time_logged if goal.weekly_time_allocated_minutes else None,
                "percentage": (goal_time_logged / goal.weekly_time_allocated_minutes * 100) if goal.weekly_time_allocated_minutes else 0,
                "is_over_limit": goal.weekly_time_allocated_minutes and goal_time_logged > goal.weekly_time_allocated_minutes,
            })
        
        summary.append({
            "project_id": project.id,
            "project_name": project.name,
            "project_color": project.color,
            "weekly_limit": project.weekly_time_allocated_minutes,
            "time_logged": project_time_logged,
            "remaining": project.weekly_time_allocated_minutes - project_time_logged,
            "percentage": (project_time_logged / project.weekly_time_allocated_minutes * 100) if project.weekly_time_allocated_minutes else 0,
            "is_over_limit": project_time_logged > project.weekly_time_allocated_minutes,
            "goals": goal_summaries,
        })
    
    return {
        "week_start": week_start,
        "week_end": week_end,
        "projects": summary,
        "total_time_logged": sum(p["time_logged"] for p in summary),
        "total_weekly_limit": sum(p["weekly_limit"] for p in summary),
    }