@echo off
title Himawari Bot
color 0a

:check_network
echo Checking for internet connection...
ping -n 1 8.8.8.8 >nul 2>&1

if %errorlevel% neq 0 (
    color 0c
    echo No internet detected! Retrying in 10 seconds...
    timeout /t 10 >nul
    color 0a
    goto check_network
)

echo Internet connected!
echo Starting the bot...
cd /d "C:\Users\shash\Downloads\Ayush-1\Ayush-1"
npm run dev
pause