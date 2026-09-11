from fastapi import FastAPI
from database import engine, Base, SessionLocal
from models import Restaurant
from meals import router as meals_router

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Food Ordering API - Meal Management")
app.include_router(meals_router)
@app.on_event("startup")
def startup():
    db = SessionLocal()
    if not db.query(Restaurant).filter(Restaurant.id == 1).first():
        test_restaurant = Restaurant(id=1, name="Burger King", owner_id=1)
        db.add(test_restaurant)
        db.commit()
    db.close()