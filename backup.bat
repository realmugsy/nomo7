@echo off
set DATE_STR=%date:~0,2%.%date:~3,2%.%date:~6,2%
set BACKUP_DIR=D:\pet-projects\backup\nomo7_%DATE_STR%

echo Creating backup in %BACKUP_DIR%...
mkdir "%BACKUP_DIR%"

xcopy /E /I /Y D:\pet-projects\nomo7 "%BACKUP_DIR%" ^
  /EXCLUDE:D:\pet-projects\nomo7\exclude.txt

echo Backup done!
pause