@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

rem ===================================================
rem  웹 게임 빌드 → 포털 복사 스크립트
rem  ---------------------------------------------------
rem  각 게임을 "포털 경로에 맞춘 web 빌드"로 만들고
rem  E:\MyWebsite\<slug>\play\ 에 복사합니다.
rem
rem  왜 따로 빌드하나:
rem    앱(Capacitor)·토스용 dist\ 는 자산 경로가 "/assets/..." 라
rem    사이트 하위 폴더에 올리면 깨집니다. 그래서 --base 를 준
rem    별도 출력 폴더(dist-web\)를 만들어 그것만 복사합니다.
rem    기존 dist\ 는 건드리지 않으므로 앱 빌드에 영향이 없습니다.
rem
rem  사용법:  tools\sync-games.bat            (전체)
rem           tools\sync-games.bat arrow-box  (하나만)
rem ===================================================

set "SITE=E:\MyWebsite"

if not "%~1"=="" (
  call :one %~1
  goto :done
)

call :one arrow-box
call :one mergecity
call :one tilefeast
call :one hiddenfind

:done
echo.
echo ===================================================
echo  끝났습니다.
echo  1) 브라우저에서 확인:  cd /d %SITE% ^&^& python -m http.server 8000
echo     → http://localhost:8000/play/?g=arrow-box
echo  2) 정상이면 js\games.js 에서 그 게임의 playable 을 true 로.
echo  3) git add -A ^&^& git commit ^&^& git push pages main
echo ===================================================
goto :eof


rem ---------------------------------------------------
rem  :one <slug>
rem ---------------------------------------------------
:one
set "SLUG=%~1"
set "SRC="
if /i "%SLUG%"=="arrow-box"  set "SRC=E:\Arrow"
if /i "%SLUG%"=="mergecity"  set "SRC=E:\game-2048"
if /i "%SLUG%"=="tilefeast"  set "SRC=E:\Tile-3"
if /i "%SLUG%"=="hiddenfind" set "SRC=E:\hidden_object"

if "%SRC%"=="" (
  echo [건너뜀] 모르는 게임: %SLUG%
  goto :eof
)

echo.
echo === %SLUG%  ^(%SRC%^) ===

pushd "%SRC%" || (echo [실패] 폴더 없음: %SRC% & goto :eof)

echo   - 타입 체크 / 빌드 (base=/%SLUG%/play/)
call npx tsc -b
if errorlevel 1 (echo   [실패] 타입 체크 & popd & goto :eof)

call npx vite build --base=/%SLUG%/play/ --outDir dist-web --emptyOutDir
if errorlevel 1 (echo   [실패] vite 빌드 & popd & goto :eof)

echo   - 절대경로 자산 점검
rem  코드 안에서 "/sprites/..." 처럼 루트 기준으로 부르는 자산이 있으면
rem  하위 폴더로 옮겼을 때 404가 납니다. 있으면 import.meta.env.BASE_URL 을 쓰도록 고쳐야 합니다.
findstr /s /i /m /c:"\"/sprites/" /c:"\"/levels/" /c:"\"/audio/" /c:"\"/iso/" /c:"\"/fonts/" /c:"\"/img/" dist-web\assets\*.js >nul 2>&1
if not errorlevel 1 (
  echo   [주의] 빌드 결과에 루트 절대경로 자산 참조가 있습니다.
  echo          해당 게임은 하위 경로에서 자산이 404 날 수 있으니 실제로 열어 확인하세요.
)

popd

echo   - 복사 → %SITE%\%SLUG%\play\
if not exist "%SITE%\%SLUG%" mkdir "%SITE%\%SLUG%"
robocopy "%SRC%\dist-web" "%SITE%\%SLUG%\play" /MIR /NFL /NDL /NJH /NJS /NP >nul
if errorlevel 8 (echo   [실패] 복사 & goto :eof)

echo   완료: /%SLUG%/play/
goto :eof
