"""Root WSGI entrypoint for Render and cloud hosts."""
import os
import sys
import importlib.util
from pathlib import Path

backend_dir = Path(__file__).resolve().parent / "backend"
backend_app_path = backend_dir / "app.py"

try:
    os.chdir(str(backend_dir))
except Exception:
    pass

if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

spec = importlib.util.spec_from_file_location("adoptly_backend_app", str(backend_app_path))
backend_module = importlib.util.module_from_spec(spec)
sys.modules["adoptly_backend_app"] = backend_module
spec.loader.exec_module(backend_module)

app = backend_module.app

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8080))
    app.run(host="0.0.0.0", port=port)
