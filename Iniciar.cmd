@echo off
setlocal
cd /d "%~dp0"
where node.exe >nul 2>nul
if errorlevel 1 (
  echo Instala Node.js 22 o superior para iniciar MundoGlobal Travel.
  pause
  exit /b 1
)
if not exist "node_modules\.bin\next.cmd" (
  echo Instalando las dependencias del proyecto...
  call npm.cmd ci --no-audit --no-fund
  if errorlevel 1 (
    echo No se pudieron instalar las dependencias. Revisa la conexion y vuelve a intentar.
    pause
    exit /b 1
  )
)
echo.
echo Abri http://localhost:3000 cuando el servidor indique que esta listo.
echo Para detenerlo, presiona Ctrl+C.
call npm.cmd run dev -- --hostname 127.0.0.1
pause
