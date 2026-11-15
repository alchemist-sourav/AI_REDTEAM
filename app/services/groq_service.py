
from groq import AsyncGroq
from groq import (
    APIConnectionError,
    APIStatusError,
    RateLimitError,
)

from app.core.config import settings
from app.services.base_provider import BaseProvider


class GroqService(BaseProvider):

    async def generate(
        self,
        model: str,
        prompt: str,
    ) -> dict:

        if not settings.groq_api_key:
            raise RuntimeError("Groq API key is not configured.")

        client = AsyncGroq(
            api_key=settings.groq_api_key
        )

        try:
            completion = await client.chat.completions.create(
                model=model,
                messages=[
                    {
                        "role": "user",
                        "content": prompt,
                    }
                ],
            )

            message = completion.choices[0].message

            return {
                "response": message.content or "",
                "usage": {
                    "prompt_tokens": completion.usage.prompt_tokens,
                    "completion_tokens": completion.usage.completion_tokens,
                    "total_tokens": completion.usage.total_tokens,
                },
            }

        except (APIConnectionError, APIStatusError, RateLimitError):
            raise

        finally:
            await client.close()
