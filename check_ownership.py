
import asyncio
from sqlalchemy import text
from app.core.database import AsyncSessionLocal


async def main():
    async with AsyncSessionLocal() as db:
        users = await db.execute(
            text("""
                SELECT id, email, role, is_active
                FROM users
                ORDER BY id
            """)
        )

        print("\nUSERS:")
        for row in users:
            print(row)

        executions = await db.execute(
            text("""
                SELECT COUNT(*), COUNT(DISTINCT batch_id)
                FROM execution_results
            """)
        )

        print("\nEXECUTION RECORDS:")
        print(executions.one())

        columns = await db.execute(
            text("""
                SELECT column_name, data_type, is_nullable
                FROM information_schema.columns
                WHERE table_name = 'execution_results'
                ORDER BY ordinal_position
            """)
        )

        print("\nEXECUTION TABLE COLUMNS:")
        for row in columns:
            print(row)


if __name__ == "__main__":
    asyncio.run(main())
