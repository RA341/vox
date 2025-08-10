from fastapi import APIRouter

api_routes = APIRouter()


@api_routes.get("/")
async def root():
    return {"message": "Hello World"}


@api_routes.get("/hello/{name}")
async def say_hello(name: str):
    return {"message": f"Hello {name}"}

