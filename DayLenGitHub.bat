@echo off
chcp 65001 >nul
title Day Cap Nhat Len GitHub - Tam An Van Su An LIVE
cd /d "%~dp0"

echo ========================================================
echo   ĐẨY CẬP NHẬT LÊN GITHUB (phonghy/chua-phong-linh-live)
echo ========================================================
echo.

rem 1. Tim kiem git.exe tren may
set "GIT=git"
if exist "%USERPROFILE%\.local\mingit\cmd\git.exe" (
    set "GIT=%USERPROFILE%\.local\mingit\cmd\git.exe"
) else if exist "C:\Program Files\Git\cmd\git.exe" (
    set "GIT=C:\Program Files\Git\cmd\git.exe"
)

"%GIT%" --version >nul 2>&1
if errorlevel 1 (
    echo [LOI] Khong tim thay Git tren may tinh. Vui long cai dat Git.
    pause
    exit /b 1
)

rem 2. Tim kiem gh.exe (neu co thi dung de xac thuc tu dong)
set "GH="
if exist "%USERPROFILE%\.local\gh\bin\gh.exe" (
    set "GH=%USERPROFILE%\.local\gh\bin\gh.exe"
) else (
    where.exe gh >nul 2>&1
    if not errorlevel 1 set "GH=gh"
)

if defined GH (
    "%GH%" auth status >nul 2>&1
    if errorlevel 1 (
        echo [1/3] Mo trinh duyet dang nhap GitHub qua GitHub CLI...
        echo. | "%GH%" auth login --web -h github.com -p https -s repo,workflow
    )
    "%GH%" auth setup-git -h github.com >nul 2>&1
) else (
    echo [1/3] Su dung Git truc tiep de day ma nguon...
)

echo [2/3] Dong goi toan bo ma nguon va tinh nang moi...
"%GIT%" add -A
"%GIT%" diff --cached --quiet
if errorlevel 1 (
    "%GIT%" commit -m "Cap nhat nang cap toan dien: 200 vi tri dao trang, camera luot em ai, hao quang phat dac dao, tu dong nhan dien loi nguyen va hang doi uu tien"
) else (
    echo Khong co thay doi moi can commit.
)

echo.
echo [3/3] Dang day ban cap nhat len https://github.com/phonghy/chua-phong-linh-live ...
"%GIT%" push -u origin main
if errorlevel 1 (
    echo.
    echo ========================================================
    echo [THONG BAO] Neu GitHub yeu cau xac thuc:
    echo   - Trinh duyet hoac cua so dang nhap GitHub se hien len.
    echo   - Hay bam Sign In de hoan tat.
    echo Neu van chua day duoc, hay kiem tra quyen ghi vao repository.
    echo ========================================================
    pause
    exit /b 1
)

echo.
echo ========================================================
echo   THANH CONG! Da day toan bo cap nhat len GitHub:
echo   https://github.com/phonghy/chua-phong-linh-live
echo ========================================================
pause
