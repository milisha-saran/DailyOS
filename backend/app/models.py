import uuid

from pydantic import EmailStr
from sqlmodel import Field, Relationship, SQLModel
from datetime import datetime


# Shared properties
class UserBase(SQLModel):
    email: EmailStr = Field(unique=True, index=True, max_length=255)
    is_active: bool = True
    is_superuser: bool = False
    full_name: str | None = Field(default=None, max_length=255)


# Properties to receive via API on creation
class UserCreate(UserBase):
    password: str = Field(min_length=8, max_length=40)


class UserRegister(SQLModel):
    email: EmailStr = Field(max_length=255)
    password: str = Field(min_length=8, max_length=40)
    full_name: str | None = Field(default=None, max_length=255)


# Properties to receive via API on update, all are optional
class UserUpdate(UserBase):
    email: EmailStr | None = Field(default=None, max_length=255)  # type: ignore
    password: str | None = Field(default=None, min_length=8, max_length=40)


class UserUpdateMe(SQLModel):
    full_name: str | None = Field(default=None, max_length=255)
    email: EmailStr | None = Field(default=None, max_length=255)


class UpdatePassword(SQLModel):
    current_password: str = Field(min_length=8, max_length=40)
    new_password: str = Field(min_length=8, max_length=40)


# Database model, database table inferred from class name
class User(UserBase, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    hashed_password: str
    items: list["Item"] = Relationship(back_populates="owner", cascade_delete=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    # DailyOS relationships
    projects: list["Project"] = Relationship(back_populates="user", cascade_delete=True)
    chores: list["Chore"] = Relationship(back_populates="user", cascade_delete=True)


# Properties to return via API, id is always required
class UserPublic(UserBase):
    id: uuid.UUID


class UsersPublic(SQLModel):
    data: list[UserPublic]
    count: int


# Shared properties
class ItemBase(SQLModel):
    title: str = Field(min_length=1, max_length=255)
    description: str | None = Field(default=None, max_length=255)


# Properties to receive on item creation
class ItemCreate(ItemBase):
    pass


# Properties to receive on item update
class ItemUpdate(ItemBase):
    title: str | None = Field(default=None, min_length=1, max_length=255)  # type: ignore


# Database model, database table inferred from class name
class Item(ItemBase, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    owner_id: uuid.UUID = Field(
        foreign_key="user.id", nullable=False, ondelete="CASCADE"
    )
    owner: User | None = Relationship(back_populates="items")


# Properties to return via API, id is always required
class ItemPublic(ItemBase):
    id: uuid.UUID
    owner_id: uuid.UUID


class ItemsPublic(SQLModel):
    data: list[ItemPublic]
    count: int


# Generic message
class Message(SQLModel):
    message: str


# JSON payload containing access token
class Token(SQLModel):
    access_token: str
    token_type: str = "bearer"


# Contents of JWT token
class TokenPayload(SQLModel):
    sub: str | None = None


class NewPassword(SQLModel):
    token: str
    new_password: str = Field(min_length=8, max_length=40)


# DailyOS Models - Time Tracking and Goal Management

# Enums for status and frequency
from enum import Enum

class TaskStatus(str, Enum):
    PLANNED = "planned"
    DONE = "done"

class ChoreFrequency(str, Enum):
    DAILY = "daily"
    WEEKLY = "weekly"
    MONTHLY = "monthly"

# Project Model
class ProjectBase(SQLModel):
    name: str = Field(max_length=255)
    color: str = Field(max_length=32, default="#3B82F6")  # Default blue
    daily_time_allocated_minutes: int = Field(ge=0)
    weekly_time_allocated_minutes: int = Field(ge=0)

class ProjectCreate(ProjectBase):
    pass

class ProjectUpdate(ProjectBase):
    name: str | None = Field(default=None, max_length=255)
    color: str | None = Field(default=None, max_length=32)
    daily_time_allocated_minutes: int | None = Field(default=None, ge=0)
    weekly_time_allocated_minutes: int | None = Field(default=None, ge=0)

class Project(ProjectBase, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    user_id: uuid.UUID = Field(foreign_key="user.id", nullable=False, ondelete="CASCADE")
    created_at: datetime = Field(default_factory=datetime.utcnow)

    # Relationships
    user: "User" = Relationship(back_populates="projects")
    goals: list["Goal"] = Relationship(back_populates="project", cascade_delete=True)

class ProjectPublic(ProjectBase):
    id: uuid.UUID
    created_at: datetime

class ProjectsPublic(SQLModel):
    data: list[ProjectPublic]
    count: int

# Goal Model
class GoalBase(SQLModel):
    name: str = Field(max_length=255)
    description: str | None = Field(default=None, max_length=1000)
    deadline: datetime | None = Field(default=None)
    daily_time_allocated_minutes: int | None = Field(default=None, ge=0)
    weekly_time_allocated_minutes: int | None = Field(default=None, ge=0)

class GoalCreate(GoalBase):
    project_id: uuid.UUID

class GoalUpdate(GoalBase):
    name: str | None = Field(default=None, max_length=255)
    project_id: uuid.UUID | None = Field(default=None)

class Goal(GoalBase, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    project_id: uuid.UUID = Field(foreign_key="project.id", nullable=False, ondelete="CASCADE")
    created_at: datetime = Field(default_factory=datetime.utcnow)

    # Relationships
    project: "Project" = Relationship(back_populates="goals")
    tasks: list["Task"] = Relationship(back_populates="goal", cascade_delete=True)

class GoalPublic(GoalBase):
    id: uuid.UUID
    project_id: uuid.UUID
    created_at: datetime

class GoalsPublic(SQLModel):
    data: list[GoalPublic]
    count: int

# Task Model
class TaskBase(SQLModel):
    name: str = Field(max_length=255)
    description: str | None = Field(default=None, max_length=1000)
    status: TaskStatus = Field(default=TaskStatus.PLANNED)
    estimated_time_minutes: int | None = Field(default=None, ge=0)
    actual_time_minutes: int = Field(default=0, ge=0)
    date: datetime = Field(default_factory=datetime.utcnow)

class TaskCreate(TaskBase):
    goal_id: uuid.UUID

class TaskUpdate(TaskBase):
    name: str | None = Field(default=None, max_length=255)
    goal_id: uuid.UUID | None = Field(default=None)
    status: TaskStatus | None = Field(default=None)
    estimated_time_minutes: int | None = Field(default=None, ge=0)
    actual_time_minutes: int | None = Field(default=None, ge=0)

class Task(TaskBase, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    goal_id: uuid.UUID = Field(foreign_key="goal.id", nullable=False, ondelete="CASCADE")
    created_at: datetime = Field(default_factory=datetime.utcnow)

    # Relationships
    goal: "Goal" = Relationship(back_populates="tasks")

class TaskPublic(TaskBase):
    id: uuid.UUID
    goal_id: uuid.UUID
    created_at: datetime

class TasksPublic(SQLModel):
    data: list[TaskPublic]
    count: int

# Chore Model
class ChoreBase(SQLModel):
    name: str = Field(max_length=255)
    frequency: ChoreFrequency
    estimated_time_minutes: int = Field(ge=0)
    is_active: bool = Field(default=True)

class ChoreCreate(ChoreBase):
    pass

class ChoreUpdate(ChoreBase):
    name: str | None = Field(default=None, max_length=255)
    frequency: ChoreFrequency | None = Field(default=None)
    estimated_time_minutes: int | None = Field(default=None, ge=0)
    is_active: bool | None = Field(default=None)

class Chore(ChoreBase, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    user_id: uuid.UUID = Field(foreign_key="user.id", nullable=False, ondelete="CASCADE")
    created_at: datetime = Field(default_factory=datetime.utcnow)

    # Relationships
    user: "User" = Relationship(back_populates="chores")
    chore_logs: list["ChoreLog"] = Relationship(back_populates="chore", cascade_delete=True)

class ChorePublic(ChoreBase):
    id: uuid.UUID
    created_at: datetime

class ChoresPublic(SQLModel):
    data: list[ChorePublic]
    count: int

# ChoreLog Model
class ChoreLogBase(SQLModel):
    date: datetime = Field(default_factory=datetime.utcnow)
    actual_time_minutes: int = Field(ge=0)

class ChoreLogCreate(ChoreLogBase):
    chore_id: uuid.UUID

class ChoreLogUpdate(ChoreLogBase):
    actual_time_minutes: int | None = Field(default=None, ge=0)

class ChoreLog(ChoreLogBase, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    chore_id: uuid.UUID = Field(foreign_key="chore.id", nullable=False, ondelete="CASCADE")
    created_at: datetime = Field(default_factory=datetime.utcnow)

    # Relationships
    chore: "Chore" = Relationship(back_populates="chore_logs")

class ChoreLogPublic(ChoreLogBase):
    id: uuid.UUID
    chore_id: uuid.UUID
    created_at: datetime

class ChoreLogsPublic(SQLModel):
    data: list[ChoreLogPublic]
    count: int
