@echo off
set "PATH=%LOCALAPPDATA%\.antigravity-ide\extensions\redhat.java-1.58.0-win32-x64\jre\25.0.4.1-win32-x86_64\bin;%PATH%"
cd /d "%~dp0"
echo ==============================================
echo  Compiling and Starting SPTS Java Backend...
echo ==============================================
javac Backend.java
if %errorlevel% neq 0 (
    echo Compilation failed!
    pause
    exit /b %errorlevel%
)
java Backend
pause

