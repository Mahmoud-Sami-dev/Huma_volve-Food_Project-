from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from database import get_db
from models import Meal, Restaurant
from schemas import MealCreate, MealUpdate, MealResponse

router = APIRouter(prefix="/api", tags=["Meals"])
CURRENT_USER_ID = 1
@router.post("/restaurants/{restaurant_id}/meals", response_model=MealResponse, status_code=status.HTTP_201_CREATED)
def create_meal(restaurant_id: int, meal_data: MealCreate, db: Session = Depends(get_db)):
    restaurant = db.query(Restaurant).filter(Restaurant.id == restaurant_id).first()
    if not restaurant:
        raise HTTPException(status_code=404, detail="Restaurant does not exist")
    
    if restaurant.owner_id != CURRENT_USER_ID:
        raise HTTPException(status_code=403, detail="Not authorized to add meals to this restaurant")

    new_meal = Meal(**meal_data.model_dump(), restaurant_id=restaurant_id)
    db.add(new_meal)
    db.commit()
    db.refresh(new_meal)
    return new_meal
@router.get("/restaurants/{restaurant_id}/meals", response_model=List[MealResponse])
def get_restaurant_meals(restaurant_id: int, db: Session = Depends(get_db)):
    restaurant = db.query(Restaurant).filter(Restaurant.id == restaurant_id).first()
    if not restaurant:
        raise HTTPException(status_code=404, detail="Restaurant does not exist")
        
    return db.query(Meal).filter(Meal.restaurant_id == restaurant_id).all()
@router.get("/meals/{meal_id}", response_model=MealResponse)
def get_meal(meal_id: int, db: Session = Depends(get_db)):
    meal = db.query(Meal).filter(Meal.id == meal_id).first()
    if not meal:
        raise HTTPException(status_code=404, detail="Meal does not exist")
        
    return meal
@router.patch("/meals/{meal_id}", response_model=MealResponse)
def update_meal(meal_id: int, meal_data: MealUpdate, db: Session = Depends(get_db)):
    meal = db.query(Meal).filter(Meal.id == meal_id).first()
    if not meal:
        raise HTTPException(status_code=404, detail="Meal does not exist")

    restaurant = db.query(Restaurant).filter(Restaurant.id == meal.restaurant_id).first()
    if restaurant.owner_id != CURRENT_USER_ID:
        raise HTTPException(status_code=403, detail="Meal belongs to another restaurant or owner")

    update_data = meal_data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(meal, key, value)

    db.commit()
    db.refresh(meal)
    return meal
@router.delete("/meals/{meal_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_meal(meal_id: int, db: Session = Depends(get_db)):
    meal = db.query(Meal).filter(Meal.id == meal_id).first()
    if not meal:
        raise HTTPException(status_code=404, detail="Meal does not exist")

    restaurant = db.query(Restaurant).filter(Restaurant.id == meal.restaurant_id).first()
    
    if restaurant.owner_id != CURRENT_USER_ID:
        raise HTTPException(status_code=403, detail="Meal belongs to another restaurant or owner")

    db.delete(meal)
    db.commit()
    return None