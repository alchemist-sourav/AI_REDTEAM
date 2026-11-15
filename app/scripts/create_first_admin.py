
import asyncio
from getpass import getpass

from sqlalchemy import func, select

from app.core.database import AsyncSessionLocal, init_db
from app.core.security import hash_password
from app.models.user import User


async def create_first_admin():
    # Ensure all registered database tables exist
    await init_db()

    print("\n=== Create First Admin ===\n")

    email = input("Admin email: ").strip().lower()

    password = getpass("Admin password: ")
    confirm_password = getpass("Confirm password: ")

    if len(password) < 8:
        print("Error: Password must contain at least 8 characters.")
        return

    if password != confirm_password:
        print("Error: Passwords do not match.")
        return

    async with AsyncSessionLocal() as db:
        try:
            user_count = await db.scalar(
                select(func.count()).select_from(User)
            )

            if user_count and user_count > 0:
                print("Admin bootstrap blocked: users already exist.")
                print("Use an existing admin account to manage users.")
                return

            admin = User(
                email=email,
                password_hash=hash_password(password),
                role="admin",
                is_active=True,
            )

            db.add(admin)
            await db.commit()
            await db.refresh(admin)

            print("\nFirst admin created successfully!")
            print("User ID:", admin.id)
            print("Email:", admin.email)
            print("Role:", admin.role)

        except Exception:
            await db.rollback()
            raise


if __name__ == "__main__":
    asyncio.run(create_first_admin())
