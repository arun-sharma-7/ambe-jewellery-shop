@echo off
echo ====================================================
echo   AMBE JEWELLERY SHOP - GITHUB UPLOAD HELPER
echo ====================================================
echo.

set PATH=C:\Program Files\Git\cmd;C:\Program Files\Git\bin;%PATH%

echo [1/5] Git repository initialize kar rahe hain...
git init

echo.
set /p git_username="Apna GitHub Username ya Naam likhein: "
set /p git_email="Apna GitHub Email likhein: "

git config user.name "%git_username%"
git config user.email "%git_email%"

echo.
echo [2/5] Sare files add kar rahe hain...
git add .

echo.
echo [3/5] First Commit kar rahe hain...
git commit -m "Initial commit: Ambe Jewellery Shop Fullstack with Bihar Rate and Delivery Booking"

echo.
echo [4/5] Main branch set kar rahe hain...
git branch -M main

echo.
set /p repo_url="Apne GitHub repository ka URL paste karein (e.g. https://github.com/username/repo.git): "

git remote remove origin 2>nul
git remote add origin %repo_url%

echo.
echo [5/5] GitHub par push kar rahe hain...
git push -u origin main

echo.
echo ====================================================
echo   BADHAI HO! Code GitHub par upload ho gaya hai!
echo ====================================================
pause

