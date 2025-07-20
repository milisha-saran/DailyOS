from fastapi import APIRouter

from app.api.routes import chore_logs, chores, dashboard, goals, login, projects, tasks, users, utils
from app.core.config import settings

api_router = APIRouter()
api_router.include_router(login.router)
api_router.include_router(users.router)
api_router.include_router(utils.router)
api_router.include_router(projects.router)
api_router.include_router(goals.router)
api_router.include_router(tasks.router)
api_router.include_router(chores.router)
api_router.include_router(chore_logs.router)
api_router.include_router(dashboard.router)

