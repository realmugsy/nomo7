@echo off
echo Building...
cd D:\pet-projects\nomo7
call npm run build
if errorlevel 1 (
    echo Build failed!
    pause
    exit /b 1
)

echo Packing...
cd D:\pet-projects\nomo7\.next
tar -czf next-build.tar.gz --exclude=static --exclude=*.tar.gz --exclude=cache .
cd D:\pet-projects\nomo7
tar -czf public.tar.gz public
tar -czf static.tar.gz .next\static

echo Uploading...
scp -i D:\downloads\proton-aws-dev1.pem D:\pet-projects\nomo7\.next\next-build.tar.gz ubuntu@13.61.252.25:/var/www/nomo-next/.next/
scp -i D:\downloads\proton-aws-dev1.pem D:\pet-projects\nomo7\public.tar.gz ubuntu@13.61.252.25:/var/www/nomo-next/
scp -i D:\downloads\proton-aws-dev1.pem D:\pet-projects\nomo7\static.tar.gz ubuntu@13.61.252.25:/var/www/nomo-next/

echo Deploying on server...
ssh -i D:\downloads\proton-aws-dev1.pem ubuntu@13.61.252.25 "sudo rm -rf /var/www/nomo-next/.next/static && sudo rm -rf /var/www/nomo-next/.next/server && cd /var/www/nomo-next/.next && sudo tar -xzf next-build.tar.gz --no-same-permissions --no-same-owner && rm next-build.tar.gz && cd /var/www/nomo-next && sudo tar -xzf static.tar.gz --no-same-permissions --no-same-owner && rm static.tar.gz && sudo tar -xzf public.tar.gz --no-same-permissions --no-same-owner && rm public.tar.gz && sudo pm2 restart nomo-frontend"

echo Cleaning up...
del D:\pet-projects\nomo7\.next\next-build.tar.gz
del D:\pet-projects\nomo7\public.tar.gz
del D:\pet-projects\nomo7\static.tar.gz

echo Done!
pause