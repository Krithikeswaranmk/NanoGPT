@echo off
echo.
echo   NanoGPT Visualizer -- Startup
echo   ==============================
echo.

:: Check .env
if not exist "backend\.env" (
  copy "backend\.env.example" "backend\.env"
  echo   [!] Edit backend\.env with your GROQ_API_KEY then run again.
  echo       Get a free key at: https://console.groq.com
  pause
  exit /b 1
)

echo   [+] Setting up backend...
cd backend
if not exist "venv" python -m venv venv
call venv\Scripts\activate.bat
pip install -r requirements.txt -q
echo   [+] Backend ready.

:: Start backend
start "NanoGPT Backend" cmd /k "venv\Scripts\activate.bat && uvicorn main:app --host 0.0.0.0 --port 8000 --reload"

cd ..\frontend
echo.
echo   [+] Setting up frontend...
if not exist "node_modules" npm install -q
echo   [+] Frontend ready.

echo.
echo   =============================================
echo   NanoGPT Visualizer starting!
echo   Frontend:  http://localhost:3000
echo   Backend:   http://localhost:8000
echo   API Docs:  http://localhost:8000/docs
echo   =============================================
echo.

start "" http://localhost:3000
npm run dev
