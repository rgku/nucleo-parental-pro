@echo off
"C:\Program Files\Git\cmd\git.exe" add -A
"C:\Program Files\Git\cmd\git.exe" commit -m "fix: remove vercel.json to avoid conflicts"
"C:\Program Files\Git\cmd\git.exe" push origin main