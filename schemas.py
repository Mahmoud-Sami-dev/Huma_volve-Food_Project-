from pydantic import BaseModel, Field
from typing import Optional

class MealCreate(BaseModel):
    name: str = Field(..., min_length=1, example="Chicken Ranch Pizza")
    description: Optional[str] = Field(None, example="Delicious pizza with grilled chicken and ranch sauce")
    price: float = Field(..., gt=0, example=180.0)
    is_available: bool = True

class MealUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1)
    description: Optional[str] = None
    price: Optional[float] = Field(None, gt=0)
    is_available: Optional[bool] = None

class MealResponse(BaseModel):
    id: int
    name: str
    description: Optional[str]
    price: float
    is_available: bool
    restaurant_id: int

    class Config:
        from_attributes = True