@echo off
chcp 65001 >nul
title Tam An Van Su An LIVE
cd /d "%~dp0"
set "PATH=C:\Program Files\nodejs;%PATH%"

if "%1"=="--force" goto start_server
if "%1"=="--restart" goto kill_old

rem Kiem tra xem may chu co dang chay san hay khong
curl.exe -s -m 2 http://lvh.me/api/health >nul 2>&1
if %errorlevel%==0 (
  echo ========================================================
  echo   May chu Tam An LIVE dang chay tren cong 80.
  echo ========================================================
  echo   [1] Mo trang Quan Tri (giu nguyen may chu cu)
  echo   [2] KHOI DONG LAI (tat may chu cu va nap code moi)
  echo.
  choice /c 12 /n /m "Bam [1] hoac [2] (Tu dong chon [2] sau 4 giay): " /t 4 /d 2
  if errorlevel 2 goto kill_old
  if errorlevel 1 (
    echo Mo trang quan tri...
    start "" http://lvh.me/admin
    timeout /t 2 >nul
    exit /b
  )
)

goto start_server

:kill_old
echo Dang tat tien trinh cu tren cong 80 de nap code moi...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :80 ^| findstr LISTENING') do taskkill /f /pid %%a >nul 2>&1
timeout /t 1 >nul

:start_server
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
