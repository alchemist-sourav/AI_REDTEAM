
import asyncio
from getpass import getpass

from sqlalchemy import select

from app.core.database import AsyncSessionLocal
from app.core.security import hash_password
from app.models.user import User


async def main():
    email = input("Enter analyst email: ").strip().lower()
    password = getpass("Enter new password (minimum 12 characters): ")
    confirm = getpass("Confirm new password: ")

    if len(password) < 12:
        print("Password must contain at least 12 characters.")
        return

    if password != confirm:
        print("Passwords do not match.")
        return

    async with AsyncSessionLocal() as db:
        result = await db.execute(
            select(User).where(User.email == email)
        )
        user = result.scalar_one_or_none()

        if user is None:
            print("User not found.")
            return

        if user.role != "analyst":
            print("This account is not an analyst.")
            return

        user.password_hash = hash_password(password)
        await db.commit()

        print("Analyst password reset successfully.")


if __name__ == "__main__":
    asyncio.run(main())
