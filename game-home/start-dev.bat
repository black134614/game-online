@echo off
cd /d "%~dp0.."
call npm --prefix game-home run dev
pause
