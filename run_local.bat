@echo off
chcp 65001 >nul
set PYTHONIOENCODING=utf-8
set PYTHONUTF8=1
echo ========================================
echo AI Chat TTS - 本地运行脚本
echo ========================================
echo.

:: 检查Python是否安装
python --version >nul 2>&1
if errorlevel 1 (
    echo ❌ 错误：未检测到Python，请先安装Python 3.8+
    echo 下载地址：https://www.python.org/downloads/
    pause
    exit /b 1
)

:: 检查pip是否可用
pip --version >nul 2>&1
if errorlevel 1 (
    echo ❌ 错误：pip不可用，请检查Python安装
    pause
    exit /b 1
)

echo ✅ Python环境检查通过
echo.

:: 检查虚拟环境是否存在
if exist "venv" (
    echo 📁 检测到现有虚拟环境，正在激活...
    call venv\Scripts\activate.bat
) else (
    echo 🔧 创建新的虚拟环境...
    python -m venv venv
    if errorlevel 1 (
        echo ❌ 创建虚拟环境失败
        pause
        exit /b 1
    )
    
    echo ✅ 虚拟环境创建成功，正在激活...
    call venv\Scripts\activate.bat
)

echo.
echo 📦 安装项目依赖...
pip install -r requirements.txt
if errorlevel 1 (
    echo ❌ 依赖安装失败
    pause
    exit /b 1
)

echo.
echo 🚀 启动AI Chat TTS服务...
echo 📍 服务地址：http://localhost:5000
echo 📍 按 Ctrl+C 停止服务
echo.

:: 进入server目录并启动服务
cd server
echo.
echo 🔧 设置Python环境变量...
set PYTHONIOENCODING=utf-8
set PYTHONUTF8=1
set PYTHONLEGACYWINDOWSSTDIO=utf-8

echo 🚀 启动AI Chat TTS服务...
echo 🌐 服务启动后将自动打开浏览器...
echo.

:: 启动服务并在后台等待几秒后打开浏览器
start /B python app.py
timeout /t 3 /nobreak >nul
start http://localhost:5000

echo ✅ 浏览器已打开，正在等待服务完全启动...
echo 📍 如果浏览器没有自动打开，请手动访问：http://localhost:5000
echo.

echo.
echo 👋 服务已停止
pause
