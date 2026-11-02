@echo off
title Day Cap Nhat Len GitHub - Tam An Van Su An
cd /d "%~dp0"

set "GIT=%USERPROFILE%\.local\mingit\cmd\git.exe"
set "GH=%USERPROFILE%\.local\gh\bin\gh.exe"
set "PATH=%USERPROFILE%\.local\mingit\cmd;%USERPROFILE%\.local\gh\bin;%PATH%"

echo ========================================================
echo   DAY CAP NHAT LEN GITHUB (phonghy/chua-phong-linh-live)
echo ========================================================
echo.

"%GH%" auth status >nul 2>&1
if errorlevel 1 (
    echo [1/3] Dang mo trinh duyet de dang nhap GitHub...
    echo. | "%GH%" auth login --web -h github.com -p https -s repo,workflow
    if errorlevel 1 (
        echo Dang nhap chua hoan tat. Vui long thu lai.
        pause
        exit /b 1
    )
)

echo [2/3] Cau hinh quyen Git va dong goi cap nhat...
"%GH%" auth setup-git -h github.com
"%GIT%" add -A
"%GIT%" diff --cached --quiet || "%GIT%" commit -m "Cap nhat Tam An Van Su An LIVE"

echo [3/3] Dang day ban cap nhat len https://github.com/phonghy/chua-phong-linh-live ...
"%GIT%" push -u origin main
if errorlevel 1 (
    echo.
    echo [LOI] Chua day duoc len GitHub. Hay kiem tra tai khoan co quyen ghi vao phonghy/chua-phong-linh-live.
    pause
    exit /b 1
)

echo.
echo ========================================================
echo   THANH CONG! Da day toan bo cap nhat len GitHub:
echo   https://github.com/phonghy/chua-phong-linh-live
echo ========================================================
pause
