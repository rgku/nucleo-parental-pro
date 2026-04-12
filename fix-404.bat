@echo off
"C:\Program Files\Git\cmd\git.exe" add .
"C:\Program Files\Git\cmd\git.exe" commit -m "fix: remove trailingSlash causing 404"
"C:\Program Files\Git\cmd\git.exe" push origin main