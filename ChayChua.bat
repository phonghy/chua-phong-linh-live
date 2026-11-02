@echo off
chcp 65001 >nul
title Tam An Van Su An LIVE
cd /d "%~dp0"
set "PATH=C:\Program Files\nodejs;%PATH%"

rem Neu da chay roi thi chi mo trang quan tri
curl.exe -s -m 2 http://lvh.me/api/health >nul 2>&1
if %errorlevel%==0 (
  echo Ung dung dang chay san. Mo trang quan tri...
  start "" http://lvh.me/admin
  timeout /t 3 >nul
  exit /b
)

echo ================================================
echo   Tam An Van Su An LIVE
echo   Quan tri : http://lvh.me/admin
echo   Game     : http://lvh.me/game
echo   OBS      : http://lvh.me/overlay
echo   OBS+Audio: http://lvh.me/overlay?audio=1
echo   Dong cua so nay de tat.
echo ================================================

rem Cho may chu san sang roi moi mo trinh duyet
start "" /min cmd /c "for /l %%i in (1,1,60) do (curl.exe -s -m 1 http://lvh.me/api/health >nul 2>&1 && (start http://lvh.me/admin & exit) || timeout /t 1 >nul)"

call npx.cmd tsx apps/server/src/index.ts
echo.
echo May chu da dung. Neu thay loi EADDRINUSE: cong 80 dang bi chuong trinh khac dung.
pause
