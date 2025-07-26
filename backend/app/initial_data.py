import logging
from datetime import datetime, timedelta

from sqlmodel import Session, select

from app.core.db import engine, init_db
from app.core.security import get_password_hash
from app.models import (
    User, Project, Goal, Task, Chore, ChoreLog,
    TaskStatus, ChoreFrequency
)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def create_sample_data(session: Session) -> None:
    """Create comprehensive sample data for development and testing."""
    
    # Check if sample data already exists
    existing_user = session.exec(select(User).where(User.email == "demo@example.com")).first()
    if existing_user:
        logger.info("Sample data already exists, skipping creation")
        return
    
    logger.info("Creating sample data...")
    
    # Create sample users
    demo_user = User(
        email="demo@example.com",
        full_name="Demo User",
        hashed_password=get_password_hash("demopassword"),
        is_active=True,
        is_superuser=False
    )
    
    admin_user = User(
        email="admin@example.com", 
        full_name="Admin User",
        hashed_password=get_password_hash("adminpassword"),
        is_active=True,
        is_superuser=True
    )
    
    session.add(demo_user)
    session.add(admin_user)
    session.commit()
    session.refresh(demo_user)
    session.refresh(admin_user)
    
    # Create sample projects for demo user
    work_project = Project(
        name="Work Projects",
        color="#3B82F6",  # Blue
        daily_time_allocated_minutes=480,  # 8 hours
        weekly_time_allocated_minutes=2400,  # 40 hours
        user_id=demo_user.id
    )
    
    personal_project = Project(
        name="Personal Development",
        color="#10B981",  # Green
        daily_time_allocated_minutes=120,  # 2 hours
        weekly_time_allocated_minutes=600,  # 10 hours
        user_id=demo_user.id
    )
    
    fitness_project = Project(
        name="Health & Fitness",
        color="#F59E0B",  # Yellow
        daily_time_allocated_minutes=60,  # 1 hour
        weekly_time_allocated_minutes=300,  # 5 hours
        user_id=demo_user.id
    )
    
    session.add_all([work_project, personal_project, fitness_project])
    session.commit()
    session.refresh(work_project)
    session.refresh(personal_project)
    session.refresh(fitness_project)
    
    # Create sample goals
    # Work goals
    feature_goal = Goal(
        name="Complete Q1 Feature Development",
        description="Finish the user dashboard and analytics features",
        deadline=datetime.utcnow() + timedelta(days=30),
        daily_time_allocated_minutes=360,  # 6 hours
        weekly_time_allocated_minutes=1800,  # 30 hours
        project_id=work_project.id
    )
    
    bug_fixes_goal = Goal(
        name="Bug Fixes & Maintenance",
        description="Address technical debt and fix reported issues",
        daily_time_allocated_minutes=120,  # 2 hours
        weekly_time_allocated_minutes=600,  # 10 hours
        project_id=work_project.id
    )
    
    # Personal goals
    learning_goal = Goal(
        name="Learn New Technology",
        description="Study React Native for mobile development",
        deadline=datetime.utcnow() + timedelta(days=60),
        daily_time_allocated_minutes=90,  # 1.5 hours
        weekly_time_allocated_minutes=450,  # 7.5 hours
        project_id=personal_project.id
    )
    
    side_project_goal = Goal(
        name="Build Side Project",
        description="Create a personal finance tracking app",
        daily_time_allocated_minutes=30,  # 30 minutes
        weekly_time_allocated_minutes=150,  # 2.5 hours
        project_id=personal_project.id
    )
    
    # Fitness goals
    workout_goal = Goal(
        name="Daily Workout Routine",
        description="Maintain consistent exercise schedule",
        daily_time_allocated_minutes=45,  # 45 minutes
        weekly_time_allocated_minutes=225,  # 3.75 hours
        project_id=fitness_project.id
    )
    
    nutrition_goal = Goal(
        name="Meal Planning",
        description="Plan and prep healthy meals",
        daily_time_allocated_minutes=15,  # 15 minutes
        weekly_time_allocated_minutes=75,  # 1.25 hours
        project_id=fitness_project.id
    )
    
    session.add_all([
        feature_goal, bug_fixes_goal, learning_goal, 
        side_project_goal, workout_goal, nutrition_goal
    ])
    session.commit()
    session.refresh(feature_goal)
    session.refresh(bug_fixes_goal)
    session.refresh(learning_goal)
    session.refresh(side_project_goal)
    session.refresh(workout_goal)
    session.refresh(nutrition_goal)
    
    # Create sample tasks with varied dates and statuses
    today = datetime.utcnow()
    yesterday = today - timedelta(days=1)
    two_days_ago = today - timedelta(days=2)
    
    tasks = [
        # Feature development tasks
        Task(
            name="Design user dashboard mockups",
            description="Create wireframes and visual designs for the main dashboard",
            status=TaskStatus.DONE,
            estimated_time_minutes=180,
            actual_time_minutes=195,
            date=two_days_ago,
            goal_id=feature_goal.id
        ),
        Task(
            name="Implement dashboard API endpoints",
            description="Build backend APIs for dashboard data",
            status=TaskStatus.DONE,
            estimated_time_minutes=240,
            actual_time_minutes=220,
            date=yesterday,
            goal_id=feature_goal.id
        ),
        Task(
            name="Build dashboard frontend components",
            description="Create React components for dashboard UI",
            status=TaskStatus.PLANNED,
            estimated_time_minutes=300,
            actual_time_minutes=0,
            date=today,
            goal_id=feature_goal.id
        ),
        
        # Bug fixes tasks
        Task(
            name="Fix login redirect issue",
            description="Users not redirected properly after login",
            status=TaskStatus.DONE,
            estimated_time_minutes=60,
            actual_time_minutes=75,
            date=yesterday,
            goal_id=bug_fixes_goal.id
        ),
        Task(
            name="Optimize database queries",
            description="Improve performance of slow queries",
            status=TaskStatus.PLANNED,
            estimated_time_minutes=120,
            actual_time_minutes=0,
            date=today,
            goal_id=bug_fixes_goal.id
        ),
        
        # Learning tasks
        Task(
            name="Read React Native documentation",
            description="Go through official docs and tutorials",
            status=TaskStatus.DONE,
            estimated_time_minutes=90,
            actual_time_minutes=85,
            date=yesterday,
            goal_id=learning_goal.id
        ),
        Task(
            name="Build first React Native app",
            description="Create a simple hello world app",
            status=TaskStatus.PLANNED,
            estimated_time_minutes=120,
            actual_time_minutes=0,
            date=today,
            goal_id=learning_goal.id
        ),
        
        # Side project tasks
        Task(
            name="Plan finance app features",
            description="Define MVP features and user stories",
            status=TaskStatus.DONE,
            estimated_time_minutes=45,
            actual_time_minutes=50,
            date=two_days_ago,
            goal_id=side_project_goal.id
        ),
        Task(
            name="Set up project repository",
            description="Initialize git repo and basic project structure",
            status=TaskStatus.PLANNED,
            estimated_time_minutes=30,
            actual_time_minutes=0,
            date=today,
            goal_id=side_project_goal.id
        ),
        
        # Workout tasks
        Task(
            name="Morning cardio session",
            description="30 minutes on treadmill",
            status=TaskStatus.DONE,
            estimated_time_minutes=30,
            actual_time_minutes=35,
            date=yesterday,
            goal_id=workout_goal.id
        ),
        Task(
            name="Strength training",
            description="Upper body workout",
            status=TaskStatus.PLANNED,
            estimated_time_minutes=45,
            actual_time_minutes=0,
            date=today,
            goal_id=workout_goal.id
        ),
        
        # Nutrition tasks
        Task(
            name="Plan weekly meals",
            description="Create meal plan for the week",
            status=TaskStatus.DONE,
            estimated_time_minutes=20,
            actual_time_minutes=25,
            date=two_days_ago,
            goal_id=nutrition_goal.id
        ),
        Task(
            name="Grocery shopping",
            description="Buy ingredients for meal prep",
            status=TaskStatus.PLANNED,
            estimated_time_minutes=45,
            actual_time_minutes=0,
            date=today,
            goal_id=nutrition_goal.id
        ),
    ]
    
    session.add_all(tasks)
    session.commit()
    
    # Create sample chores
    chores = [
        Chore(
            name="Clean kitchen",
            frequency=ChoreFrequency.DAILY,
            estimated_time_minutes=15,
            is_active=True,
            user_id=demo_user.id
        ),
        Chore(
            name="Take out trash",
            frequency=ChoreFrequency.WEEKLY,
            estimated_time_minutes=5,
            is_active=True,
            user_id=demo_user.id
        ),
        Chore(
            name="Vacuum living room",
            frequency=ChoreFrequency.WEEKLY,
            estimated_time_minutes=20,
            is_active=True,
            user_id=demo_user.id
        ),
        Chore(
            name="Deep clean bathroom",
            frequency=ChoreFrequency.MONTHLY,
            estimated_time_minutes=60,
            is_active=True,
            user_id=demo_user.id
        ),
        Chore(
            name="Water plants",
            frequency=ChoreFrequency.DAILY,
            estimated_time_minutes=10,
            is_active=True,
            user_id=demo_user.id
        ),
        Chore(
            name="Laundry",
            frequency=ChoreFrequency.WEEKLY,
            estimated_time_minutes=30,
            is_active=True,
            user_id=demo_user.id
        ),
    ]
    
    session.add_all(chores)
    session.commit()
    
    # Create sample chore logs
    for chore in chores:
        session.refresh(chore)
        
        # Create logs for the past few days
        for days_back in range(1, 4):
            log_date = today - timedelta(days=days_back)
            
            # Only create logs for daily chores or weekly chores if it's the right day
            should_create_log = (
                chore.frequency == ChoreFrequency.DAILY or
                (chore.frequency == ChoreFrequency.WEEKLY and days_back == 2) or
                (chore.frequency == ChoreFrequency.MONTHLY and days_back == 3)
            )
            
            if should_create_log:
                chore_log = ChoreLog(
                    chore_id=chore.id,
                    date=log_date,
                    actual_time_minutes=chore.estimated_time_minutes + (-5 if days_back % 2 else 5)  # Slight variation
                )
                session.add(chore_log)
    
    session.commit()
    logger.info("Sample data created successfully!")


def init() -> None:
    with Session(engine) as session:
        init_db(session)
        create_sample_data(session)


def main() -> None:
    logger.info("Creating initial data")
    init()
    logger.info("Initial data created")


if __name__ == "__main__":
    main()
