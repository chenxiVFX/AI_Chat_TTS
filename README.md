## 🎯 项目概述

这是一个通过接入api（只适配了硅基流动的api）来实现AI对话+语音合成的web项目，除了正常的调用各种模型来实现与AI对话之外，还会自动将AI的回复自动合成成语音播放（如果勾选语音合成的话），播放的音色可以使用官方的预设也可以自行配置自定义的音色，只需要上传10s左右的参考音频和对应的文本即可自定义。如果开启“自动情感识别”，后，会接入另一个AI（代码中使用的是deepseek-v3，有不错的效果），通过对整个对话语境进行判断再结合用户需求以及情感表现，能自动为TTS合成编写情感提示词。
当然也保留的手动语音合成的功能
可以隔个人电脑上运行，也可在服务器上部署，服务器部署下方有详细的指令说明，如果是个人windows电脑上运行，下载项目，确保安装了python的前提下直接点击run_local.bat脚本会自动安装依赖并打开

此项目前端操作时，后端有详细数据，但是对话记录、参数设定数据保存在本地浏览器缓存中，并不会存储于服务端，如需清除，按ctrl+F5刷新页面即可。如果是用户创建的音色列表，是存放在服务端的，会生成一个custom_voices.json的文件，如果是在windows上运行，这个文件是创建在根目录下的，如果是在服务器上
运行，是创建在./server子文件夹中（这是不同的目录处理结构导致的）

## 📁 项目文件结构

```
AI_Chat_TTS/
├── 📁 static/                    # 前端静态文件
│   ├── 📄 index.html            # 主页面（包含3个模块）
│   ├── 📄 style.css             # 样式文件
│   └── 📄 script.js             # 前端逻辑
├── 📁 server/                    # 后端服务
│   └── 📄 app.py                # Flask应用主文件
├── 🚀 run_local.bat             # Windows本地运行脚本
├── 📦 requirements.txt          # Python依赖
├── 🚫 .gitignore               # Git忽略文件
├── 📖 README.md                # 项目说明文档
```






# AI Chat TTS 部署指南

## 📋 目录
- [Windows 本地运行](#windows-本地运行)
- [Linux 服务器部署](#linux-服务器部署)
- [常见问题](#常见问题)

---

## 🪟 Windows 本地运行

### 快速开始
1. **下载项目**
   ```bash
   git clone https://github.com/你的用户名/AI_Chat_TTS.git
   cd AI_Chat_TTS
   ```

2. **运行启动脚本**
   ```bash
   run_local.bat
   ```
   
   脚本会自动：
   - ✅ 检查Python环境
   - ✅ 创建虚拟环境
   - ✅ 安装依赖
   - ✅ 启动服务
   - ✅ 自动打开浏览器

3. **访问应用**
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
cd server
python app.py
```
```bash

注：项目中的“内置API秘钥需要在“app.py”文件的15行处的  DEFAULT_API_KEY = “”中填入自己的硅基流动秘钥

```

---

## 🐧 Linux 服务器部署

### 环境要求
- **操作系统**: Ubuntu 20.04+ / CentOS 7+ / Debian 10+
- **Python**: 3.8+
- **无特别的性能要求**


### 部署步骤

#### 1. 连接服务器

#### 2. 更新系统（可忽略）
```bash
# Ubuntu/Debian
apt update && apt upgrade -y

# CentOS/RHEL
yum update -y
```

#### 3. 安装Python和依赖（装了python3就忽略）
```bash
# Ubuntu/Debian系统使用这个
apt install -y python3 python3-pip python3-venv nginx git

# CentOS/RHEL系统使用这个
yum install -y python3 python3-pip nginx git
```

#### 4. 下载项目
```bash
# 进入root目录
cd /root

# 创建项目文件夹（名称可以自己定）
mkdir AI_chat_TTS

# 进入刚刚创建的项目文件夹
cd ~/root/AI_chat_TTS
#从github拉取（或者自己把所有文件放在刚刚创建的文件夹中道理也一样）
git clone https://github.com/你的用户名/AI_Chat_TTS.git
cd AI_Chat_TTS
```

#### 5. 创建虚拟环境
```bash
python3 -m venv venv
source venv/bin/activate
```

#### 6. 安装项目依赖
```bash
pip install --upgrade pip
pip install -r requirements.txt
```

#### 7. 测试运行
```bash
cd /root/AI_chat_TTS/server
python app.py
```

如果看到类似以下输出，说明运行成功：
```
 * Running on http://0.0.0.0:5000
 * Debug mode: off
```

按 `Ctrl+C` 停止测试。

#此时开始运行，可以在浏览器中输入“你服务器的公网ip：5000”看看能不能连上（端口如果要改的话可以去app.py文件的末尾更改端口），但是现在这样，如果关闭，程序就会终止，需要其后台持续运行

#### 9. 设置后台运行
```bash

# 使用nohup后台运行
nohup python3 app.py > app.log 2>&1 &

# 查看进程
ps aux | grep python3

# 查看日志
tail -f app.log

```


#### 9. 配置防火墙（有需要的话）
```bash

# 安装ufw防火墙
apt install -y ufw

# 允许SSH连接
ufw allow ssh

# 允许HTTP端口（如果需要）
ufw allow 80

# 允许你的应用端口（比如5000）
ufw allow 5000

# 启用防火墙
ufw enable

# 查看防火墙状态
ufw status

```

#### 10. 配置Nginx反向代理（可选，不推荐在这里设置，在服务器面板中设置会更简单，如宝塔）

创建Nginx配置：
```bash
nano /etc/nginx/sites-available/ai-chat-tts
```

添加以下内容：
```nginx
server {
    listen 80;
    server_name _;

    location / {
        proxy_pass http://127.0.0.1:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

启用配置：
```bash
# 创建软链接
ln -s /etc/nginx/sites-available/ai-chat-tts /etc/nginx/sites-enabled/

# 删除默认配置
rm -f /etc/nginx/sites-enabled/default

# 测试配置
nginx -t

# 重启Nginx
systemctl restart nginx
```



### 访问应用

- **直接访问**: `http://服务器IP:5000`
- **Nginx代理**: `http://服务器IP`（如果配置了Nginx）

---



## 🔧 服务管理命令

### 查看运行状态
```bash
# 查看Python进程
ps aux | grep python3

# 查看端口占用情况
netstat -tlnp | grep 5000
```

### 启动服务
```bash
cd /root/AI_chat_TTS/server
nohup python3 app.py > app.log 2>&1 &
```

### 停止服务
```bash
# 方法1：通过进程ID停止
ps aux | grep python3
kill -9 进程ID

# 方法2：通过端口停止（如果修改过端口，那端口改成之前自己的那个）
lsof -ti:5000 | xargs kill -9
```

### 重启服务
```bash
# 先停止
lsof -ti:5000 | xargs kill -9

# 再启动
cd /root/AI_chat_TTS/server
nohup python3 app.py > app.log 2>&1 &
```

### 查看日志
```bash
# 查看应用日志
tail -f /root/AI_chat_TTS/server/app.log

# 查看最新100行日志
tail -n 100 /root/AI_chat_TTS/server/app.log
```

### 更新项目
```bash
# 停止服务
lsof -ti:5000 | xargs kill -9

# 更新代码
cd /root/AI_chat_TTS
git pull origin main

# 重新安装依赖（如果需要）
source venv/bin/activate
pip install -r requirements.txt

# 重新启动
cd server
nohup python3 app.py > app.log 2>&1 &
```

---

### 端口5000被占用怎么办？
修改 `server/app.py` 中的端口号：
```python
if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8080, debug=False)  # 改为8080
```




###如何备份自定义语音？
备份 `server/custom_voices.json` 文件：
```bash
cp /root/AI_Chat_TTS/server/custom_voices.json /root/backup/
```

### 如何修改服务端口？
```bash
# 停止当前服务
lsof -ti:5000 | xargs kill -9

# 重新启动
cd /root/AI_chat_TTS/server
nohup python3 app.py > app.log 2>&1 &
```


- **本地开发**: 使用 `run_local.bat`
- **服务器部署**: 按照Linux部署步骤
- **外网访问**: 配置域名解析到服务器IP


