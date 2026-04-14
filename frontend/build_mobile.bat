@echo off
echo ==============================================
echo  تحويل مشروع YemenMarket الى تطبيق اندرويد
echo ==============================================

cd /d "%~dp0"

echo 1. Installing Capacitor libraries...
call npm install @capacitor/core @capacitor/cli @capacitor/android

echo 2. Initializing Capacitor...
call npx cap init YemenMarket com.mazen.yemenmarket --web-dir dist

echo 3. Building React App...
call npm run build

echo 4. Adding Android Platform...
call npx cap add android
call npx cap sync android

echo ==============================================
echo !تم التجهيز بنجاح!
echo ==============================================
echo للخطوة النهائية واستخراج الـ APK:
echo 1- تأكد من تثبيت Android Studio في جهازك.
echo 2- اكتب الامر التالي لفتح المشروع في الاندرويد ستديو:
echo    npx cap open android
echo 3- من داخل البرنامج، اذهب الى القائمة فوق واضغط: Build -^> Build Bundle / APK -^> Build APK
pause
