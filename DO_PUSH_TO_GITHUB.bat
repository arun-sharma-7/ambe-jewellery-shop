@echo off
set PATH=C:\Program Files\Git\cmd;C:\Program Files\Git\bin;%PATH%
cd /d "C:\Users\barun sharma\Downloads\Jewellery shop"

echo =======================================================
echo   AMBE JEWELLERY SHOP - GITHUB PUSH
echo   Target: https://github.com/arun-sharma-7/ambe-jewellery-shop.git
echo =======================================================
echo.
echo GitHub par code upload ho raha hai...
echo Agar browser popup aaye, toh 'Sign in with your browser' par click karein.
echo.

git push -u origin main

echo.
echo =======================================================
echo Kaam poora ho gaya! Browser me apna GitHub repository check karein.
echo =======================================================
pause

