@echo off
chcp 65001 >nul
setlocal
cd /d "%~dp0"
echo.
echo =====================================================
echo   ZIH 本地云盘 / 外接播放器 / FFmpeg 视频助手 v2
echo =====================================================
echo.
echo 支持：默认播放器、VLC、PotPlayer、MPC-HC、mpv
 echo 支持：Chrome 播放失败时自动 FFmpeg 转码为 MP4
 echo.
powershell.exe -NoProfile -ExecutionPolicy Bypass -STA -File "%~dp0system-player-helper.ps1"
pause
