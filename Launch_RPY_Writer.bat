@echo off
title RPY Writer
echo Starting RPY Writer...
npm run dev &
timeout /t 3 /nobreak
start "" http://localhost:5173