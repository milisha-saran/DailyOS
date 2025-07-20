import logging

from sqlmodel import Session, text

from app.core.db import engine, init_db

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def init() -> None:
    with Session(engine) as session:
        # Query and print current data
        result = session.execute(text("SELECT * FROM user"))
        print("\nUsers in database:")
        for row in result:
            print(row)

        result = session.execute(text("SELECT * FROM item"))
        print("\nItems in database:")
        for row in result:
            print(row)
        init_db(session)


def main() -> None:
    logger.info("Creating initial data")
    init()
    logger.info("Initial data created")


if __name__ == "__main__":
    main()
