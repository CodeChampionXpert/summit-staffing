@echo off
REM Debug APK build — uses D: for Gradle + temp (C: full unzip/move errors fix).
REM Edit CACHE_ROOT below if you want another drive/folder.
REM Close Android Studio / Cursor while building; optional Defender exclusion for CACHE_ROOT.
REM AGP 8.x needs JDK 17+. We pick a bundled JDK 17 if JAVA_HOME is older (e.g. OpenJDK 11).

setlocal
set "_JDK17="
REM Prefer java.exe from PATH (so it uses the same Java you verified via `java -version`).
set "_JAVA_EXE="
for /f "delims=" %%J in ('where java 2^>nul') do (
  set "_JAVA_EXE=%%J"
  goto jdk_from_path_done
)
:jdk_from_path_done
if defined _JAVA_EXE (
  "%_JAVA_EXE%" -version 2>&1 | findstr /c:"17." >nul
  if not errorlevel 1 (
    REM java.exe is typically <JDK_ROOT>\bin\java.exe, so JDK root is one level above bin/
    for %%I in ("%_JAVA_EXE%") do set "_JDK17=%%~dpI.."
  )
)
if exist "%ProgramFiles%\Android\Android Studio\jbr\bin\java.exe" set "_JDK17=%ProgramFiles%\Android\Android Studio\jbr"
if not defined _JDK17 for /d %%J in ("%ProgramFiles%\Eclipse Adoptium\jdk-17*") do if not defined _JDK17 if exist "%%J\bin\java.exe" set "_JDK17=%%J"
if not defined _JDK17 for /d %%J in ("%ProgramFiles%\Microsoft\jdk-17*") do if not defined _JDK17 if exist "%%J\bin\java.exe" set "_JDK17=%%J"
if not defined _JDK17 for /d %%J in ("%ProgramFiles%\Java\jdk-17*") do if not defined _JDK17 if exist "%%J\bin\java.exe" set "_JDK17=%%J"
if not defined _JDK17 for /d %%J in ("%ProgramFiles%\openlogic-openjdk-17*") do if not defined _JDK17 if exist "%%J\bin\java.exe" set "_JDK17=%%J"
REM Temurin user install often here (not under Program Files)
if not defined _JDK17 for /d %%J in ("%LOCALAPPDATA%\Programs\Eclipse Adoptium\jdk-17*") do if not defined _JDK17 if exist "%%J\bin\java.exe" set "_JDK17=%%J"

if defined _JDK17 (
  set "JAVA_HOME=%_JDK17%"
  set "PATH=%_JDK17%\bin;%PATH%"
  echo Using JDK: %JAVA_HOME%
  echo JDK verification:
  if exist "%JAVA_HOME%\bin\java.exe" ( "%JAVA_HOME%\bin\java.exe" -version 2>&1 ) else ( echo JAVA executable not found at "%JAVA_HOME%\bin\java.exe" )
) else (
  echo No JDK 17 found. Set JAVA_HOME to your JDK 17 folder and retry.
  exit /b 1
)

set "CACHE_ROOT=C:\gradle-cache-summit-staffing"
set "GRADLE_USER_HOME=%CACHE_ROOT%\gradle-home"
set "TMP=%CACHE_ROOT%\tmp"
set "TEMP=%TMP%"

if not exist "%GRADLE_USER_HOME%" mkdir "%GRADLE_USER_HOME%" 2>nul
if not exist "%TMP%" mkdir "%TMP%" 2>nul

cd /d "%~dp0..\android"
call gradlew.bat --stop 2>nul
if exist ".gradle" rmdir /s /q ".gradle" 2>nul

call gradlew.bat assembleDebug --no-daemon
if errorlevel 1 exit /b 1

echo.
echo APK: %~dp0..\android\app\build\outputs\apk\debug\app-debug.apk
echo Gradle cache: %GRADLE_USER_HOME%
endlocal
