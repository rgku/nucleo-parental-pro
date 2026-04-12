@echo off
"C:\Program Files\Git\cmd\git.exe" add .
"C:\Program Files\Git\cmd\git.exe" commit -m "fix: disable middleware causing 404 on Vercel"
"C:\Program Files\Git\cmd\git.exe" push origin main