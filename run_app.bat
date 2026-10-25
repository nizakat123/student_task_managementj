@echo off
title Student Task Manager - Cloud & Distributed Computing
echo ===================================================
echo Starting Cloud-Based Student Task Manager (React + Vite + Supabase)
echo ===================================================
cd /d "%~dp0"
start http://localhost:3000
npm run dev
pause
