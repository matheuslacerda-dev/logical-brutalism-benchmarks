from fastapi import FastAPI, Request
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates

app = FastAPI(title="Logical Benchs Sub-App")

# Mount independent static directory
app.mount("/static", StaticFiles(directory="static"), name="bench_static")

# Instantiate templates using the sub-app's template directory
templates = Jinja2Templates(directory="templates")

@app.get("/", response_class=HTMLResponse)
async def index(request: Request):
    return templates.TemplateResponse(request, "index.html")

@app.get("/{framework}/{app_name}", response_class=HTMLResponse)
async def benchmark_app(request: Request, framework: str, app_name: str):
    return templates.TemplateResponse(
        request, 
        "app_instruction.html", 
        {"framework": framework, "app_name": app_name}
    )
