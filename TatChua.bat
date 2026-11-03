@echo off
chcp 65001 >nul
title Tat May Chu Tam An LIVE
cd /d "%~dp0"
echo ========================================================
echo   DANG DUNG MAY CHU TAM AN LIVE (CONG 80)
echo ========================================================
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :80 ^| findstr LISTENING') do (
  echo Dang dung tien trinh PID: %%a...
  taskkill /f /pid %%a >nul 2>&1
)
timeout /t 1 >nul
curl.exe -s -m 2 http://lvh.me/api/health >nul 2>&1
if %errorlevel%==0 (
  echo [CANH BAO] Cong 80 van con phan hoi.
) else (
  echo [THANH CONG] May chu da tat hoan toan. Cong 80 da san sang.
)
timeout /t 3 >nul
