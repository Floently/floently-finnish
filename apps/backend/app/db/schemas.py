"""Pydantic schemas placeholder."""

from pydantic import BaseModel


class UserCreate(BaseModel):
    email: str


class UserRead(BaseModel):
    id: str
    email: str

    class Config:
        orm_mode = True
