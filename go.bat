@echo off
"C:\Program Files\Git\cmd\git.exe" add -A
"C:\Program Files\Git\cmd\git.exe" commit -m "fix: remove trailingSlash and add explicit vercel.json config"
"C:\Program Files\Git\cmd\git.exe" push origin main