
from abc import ABC, abstractmethod


class BaseProvider(ABC):

    @abstractmethod
    async def generate(
        self,
        model: str,
        prompt: str,
    ) -> dict:
        pass
