# 🎙️ AI Chat TTS - 智能对话语音合成系统

## 🎯 项目概述

这是一个集成了AI对话和语音合成功能的Web应用，通过接入SiliconFlow API实现智能对话，并自动将AI回复转换为语音播放。项目支持自定义音色、情感识别、手动语音合成等多种功能。

### ✨ 主要特性

- 🤖 **AI智能对话**: 支持多种AI模型（DeepSeek-V3等）
- 🎵 **自动语音合成**: AI回复自动转换为语音播放
- 🎭 **自定义音色**: 上传10秒音频即可创建专属音色
- 💭 **智能情感识别**: 自动分析对话情感并生成合适的语音表现
- 🎛️ **手动语音合成**: 独立的文本转语音功能
- 🔧 **环境变量配置**: 集中管理API密钥和配置信息
- 💾 **本地数据存储**: 对话记录保存在浏览器，音色数据保存在服务端

## 🆕 最新更新

- ✅ **环境变量集中管理**: 通过 `.env` 文件统一管理配置
- ✅ **API密钥安全**: 敏感信息不再硬编码在代码中
- ✅ **配置动态加载**: 前端自动从后端获取配置信息
- ✅ **错误处理优化**: 改善用户体验，减少不必要的错误提示

## 📁 项目文件结构

```
AI_Chat_TTS/
├── 📁 static/                    # 前端静态文件
│   ├── 📄 index.html            # 主页面（包含3个模块）
│   ├── 📄 style.css             # 样式文件
│   └── 📄 script.js             # 前端逻辑
├── 📁 server/                    # 后端服务
│   ├── 📄 app.py                # Flask应用主文件
│   └── 📄 requirements.txt      # 后端依赖
├── 📁 venv/                      # Python虚拟环境
├── 🔧 .env                       # 环境变量配置文件
├── 🚀 run_local.bat             # Windows本地运行脚本
├── 📦 requirements.txt          # Python依赖
├── 🚫 .gitignore               # Git忽略文件
└── 📖 README.md                # 项目说明文档
```

## ⚙️ 环境配置

### 配置 API 密钥

1. **复制环境变量模板**:
   项目根目录下的 `.env` 文件包含所有配置项

2. **修改 API 密钥**:
   ```env
   # SiliconFlow API 密钥 - 请替换为你的密钥
   SILICONFLOW_API_KEY=你的API密钥

   # API 服务地址（通常不需要修改）
   SILICONFLOW_API_URL=https://api.siliconflow.cn/v1/chat/completions
   SILICONFLOW_TTS_URL=https://api.siliconflow.cn/v1/audio/speech

   # 服务器配置
   SERVER_HOST=0.0.0.0
   SERVER_PORT=5000
   DEBUG_MODE=false
   ```

3. **获取 API 密钥**:
   - 访问 [SiliconFlow官网](https://siliconflow.cn/)
   - 注册账号并获取API密钥
   - 将密钥填入 `.env` 文件中的 `SILICONFLOW_API_KEY`

## 🚀 快速开始

### Windows 本地运行

1. **下载项目**
   ```bash
   git clone https://github.com/你的用户名/AI_Chat_TTS.git
   cd AI_Chat_TTS
   ```

2. **配置环境变量**
   - 编辑 `.env` 文件
   - 填入你的 SiliconFlow API 密钥

3. **运行启动脚本**
   ```bash
   run_local.bat
   ```
   
   脚本会自动：
   - ✅ 检查Python环境
   - ✅ 创建虚拟环境
   - ✅ 安装依赖
   - ✅ 启动服务
   - ✅ 自动打开浏览器

4. **访问应用**
   - 浏览器会自动打开 `http://localhost:5000`
   - 如果没有自动打开，请手动访问

### 手动启动（如果脚本有问题）

```bash
# 1. 检查Python版本（需要3.8+）
python --version

# 2. 创建虚拟环境
python -m venv venv

# 3. 激活虚拟环境
venv\Scripts\activate

# 4. 安装依赖
pip install -r requirements.txt

# 5. 启动服务
python server/app.py
```

## 🐧 Linux 服务器部署

### 环境要求
- **操作系统**: Ubuntu 20.04+ / CentOS 7+ / Debian 10+
- **Python**: 3.8+
- **内存**: 512MB+ 
- **存储**: 1GB+

### 部署步骤

#### 1. 更新系统并安装依赖
```bash
# Ubuntu/Debian
sudo apt update && sudo apt upgrade -y
sudo apt install -y python3 python3-pip python3-venv git

# CentOS/RHEL
sudo yum update -y
sudo yum install -y python3 python3-pip git
```

#### 2. 下载项目
```bash
cd /opt
sudo git clone https://github.com/你的用户名/AI_Chat_TTS.git
cd AI_Chat_TTS
```

#### 3. 配置环境变量
```bash
# 编辑环境变量文件
sudo nano .env

# 填入你的API密钥
SILICONFLOW_API_KEY=你的API密钥
```

#### 4. 创建虚拟环境并安装依赖
```bash
python3 -m venv venv
source venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt
```

#### 5. 测试运行
```bash
python server/app.py
```

#### 6. 后台运行
```bash
# 使用nohup后台运行
nohup python server/app.py > app.log 2>&1 &

# 查看运行状态
ps aux | grep python
```

### 服务管理

```bash
# 查看服务状态
ps aux | grep python

# 停止服务
pkill -f "python server/app.py"

# 重启服务
pkill -f "python server/app.py"
cd /opt/AI_Chat_TTS
source venv/bin/activate
nohup python server/app.py > app.log 2>&1 &

# 查看日志
tail -f app.log
```

## 🔧 功能说明

### 1. AI对话模块
- 支持多种AI模型选择
- 实时流式对话
- 对话历史记录
- 系统提示词配置

### 2. 语音合成模块
- 自动语音合成：AI回复自动转语音
- 手动语音合成：独立的TTS功能
- 多种音色选择：内置音色 + 自定义音色
- 语音参数调节：语速、情感等

### 3. 音色管理模块
- 自定义音色创建
- 音色试听和管理
- 参考音频上传（支持多种格式）
- 音色数据持久化存储

### 4. 智能情感识别
- 自动分析对话情感
- 生成合适的情感提示词
- 提升语音表现力

## 📊 数据存储说明

- **对话记录**: 保存在浏览器本地存储中，按 `Ctrl+F5` 可清除
- **用户设置**: 保存在浏览器本地存储中
- **自定义音色**: 保存在服务端 `custom_voices.json` 文件中
- **环境配置**: 保存在 `.env` 文件中（不会被提交到Git）

## ❓ 常见问题

### Q: API密钥错误怎么办？
A: 检查 `.env` 文件中的 `SILICONFLOW_API_KEY` 是否正确填写

### Q: 端口被占用怎么办？
A: 修改 `.env` 文件中的 `SERVER_PORT` 为其他端口

### Q: 语音合成失败怎么办？
A: 
1. 检查API密钥是否有效
2. 确认网络连接正常
3. 查看浏览器控制台错误信息

### Q: 自定义音色上传失败？
A: 
1. 确保音频文件格式正确（支持 wav, mp3, m4a, ogg, flac）
2. 音频文件大小不超过16MB
3. 参考文本与音频内容匹配

### Q: 如何备份自定义音色？
A: 备份项目根目录下的 `custom_voices.json` 文件

## 🔒 安全说明

- ✅ API密钥通过环境变量管理，不会暴露在代码中
- ✅ `.env` 文件已加入 `.gitignore`，不会被提交到版本控制
- ✅ 支持自定义API密钥，无需使用内置密钥
- ⚠️ 请妥善保管你的API密钥，不要分享给他人

## 🤝 贡献指南

欢迎提交 Issue 和 Pull Request 来改进项目！

## 📄 许可证

本项目采用 MIT 许可证，详见 LICENSE 文件。

---

**享受与AI的智能对话和语音交互体验！** 🎉

