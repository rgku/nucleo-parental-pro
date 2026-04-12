@echo off
"C:\Program Files\Git\cmd\git.exe" add .
"C:\Program Files\Git\cmd\git.exe" commit -m "fix: upgrade Next.js to 15.1.9 for CVE-2025-66478 patch"
"C:\Program Files\Git\cmd\git.exe" push origin main