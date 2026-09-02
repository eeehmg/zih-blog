@echo off
chcp 65001 >nul
setlocal
cd /d "%~dp0"
echo.
echo =============================================
echo   ZIH 本地云盘 - 系统播放器助手
echo =============================================
echo.
powershell.exe -NoProfile -ExecutionPolicy Bypass -STA -File "%~dp0system-player-helper.ps1"
pause
