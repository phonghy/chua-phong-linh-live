@echo off
chcp 65001 >nul
title Tam An Van Su An LIVE
cd /d "%~dp0"
set "PATH=C:\Program Files\nodejs;%PATH%"

echo ========================================================
echo   Dang kiem tra va khoi dong Tam An Van Su An LIVE...
echo ========================================================

rem Tu dong tat tien trinh cu tren cong 80 (neu co) de luon nap code moi nhat
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :80 ^| findstr LISTENING') do taskkill /f /pid %%a >nul 2>&1
timeout /t 1 >nul

echo ================================================
echo   Tam An Van Su An LIVE
echo   Quan tri : http://lvh.me/admin
echo   Game     : http://lvh.me/game
echo   OBS      : http://lvh.me/overlay
echo   OBS+Audio: http://lvh.me/overlay?audio=1
echo   Dong cua so nay de tat.
echo ================================================

rem Cho may chu san sang roi tu dong mo trinh duyet trang Quan tri
start "" /min cmd /c "for /l %%i in (1,1,60) do (curl.exe -s -m 1 http://lvh.me/api/health >nul 2>&1 && (start http://lvh.me/admin & exit) || timeout /t 1 >nul)"

call npx.cmd tsx apps/server/src/index.ts
echo.
echo May chu da dung. Neu thay loi EADDRINUSE: cong 80 dang bi chuong trinh khac dung.
pause
