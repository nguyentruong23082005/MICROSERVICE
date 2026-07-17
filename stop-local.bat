@echo off
echo ==============================================================
echo 1. Dang dung cac container ha tang trong Docker...
echo ==============================================================
docker compose down

echo.
echo ==============================================================
echo 2. Dang dung cac service Java va Python local...
echo ==============================================================
taskkill /F /IM java.exe 2>nul
taskkill /F /IM python.exe 2>nul

echo.
echo ==============================================================
echo Da dung tat ca cac services local va docker infrastructure!
echo ==============================================================
pause
