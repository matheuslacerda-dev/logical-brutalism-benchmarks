from fastapi import FastAPI, Request
from fastapi.responses import HTMLResponse
from fastapi.templating import Jinja2Templates
from fastapi.staticfiles import StaticFiles
import os

app = FastAPI(title="Logical Brutalism Benchmarks")

app.mount("/static", StaticFiles(directory="static"), name="static")

# Using the root directory for templates
templates = Jinja2Templates(directory=".")

@app.get("/", response_class=HTMLResponse)
async def read_index(request: Request):
    return templates.TemplateResponse(request=request, name="index.html")

@app.get("/{framework}/{app_name}", response_class=HTMLResponse)
async def serve_app_instruction(request: Request, framework: str, app_name: str):
    return templates.TemplateResponse(request=request, name="app_instruction.html", context={"framework": framework, "app_name": app_name})

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
