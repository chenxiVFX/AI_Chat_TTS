# -*- coding: utf-8 -*-
from flask import Flask, request, jsonify, send_from_directory, Response, stream_template
import os
import json
import time
import requests

app = Flask(__name__)

# 配置
app.config['SECRET_KEY'] = 'your-secret-key-here'
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max file size

# SiliconFlow API配置
DEFAULT_API_KEY = ""
SILICONFLOW_API_URL = "https://api.siliconflow.cn/v1/chat/completions"
SILICONFLOW_TTS_URL = "https://api.siliconflow.cn/v1/audio/speech"

# 管理员控制开关
ENABLE_BUILTIN_API_KEY = True  # 设置为False可禁用内置API密钥功能

# 存储聊天历史（实际项目中应该使用数据库）
chat_history = []
# 存储自定义音色（使用文件持久化）
import json
import os

VOICES_DATA_FILE = 'custom_voices.json'

def load_custom_voices():
    """从文件加载自定义音色数据"""
    if os.path.exists(VOICES_DATA_FILE):
        try:
            with open(VOICES_DATA_FILE, 'r', encoding='utf-8') as f:
                return json.load(f)
        except Exception as e:
            print(f"加载音色数据失败: {e}")
    return {}

def save_custom_voices(voices_data):
    """保存自定义音色数据到文件"""
    try:
        with open(VOICES_DATA_FILE, 'w', encoding='utf-8') as f:
            json.dump(voices_data, f, ensure_ascii=False, indent=2)
        print(f"音色数据已保存到 {VOICES_DATA_FILE}")
    except Exception as e:
        print(f"保存音色数据失败: {e}")

# 初始化音色数据
custom_voices = load_custom_voices()

@app.route('/')
def index():
    """提供静态文件"""
    return send_from_directory('../static', 'index.html')

@app.route('/<path:filename>')
def static_files(filename):
    """提供静态文件服务"""
    return send_from_directory('../static', filename)

@app.route('/audio/<path:filename>')
def audio_files(filename):
    """提供音频文件服务"""
    return send_from_directory('../audio', filename)

@app.route('/api/chat', methods=['POST'])
def chat():
    """处理聊天请求"""
    try:
        data = request.get_json()
        
        if not data or 'message' not in data:
            return jsonify({'error': '缺少消息内容'}), 400
        
        user_message = data['message']
        model = data.get('model', 'Pro/deepseek-ai/DeepSeek-V3')
        stream = data.get('stream', True)  # 默认启用流式传输
        history = data.get('history', [])  # 获取对话历史
        api_key = data.get('api_key', DEFAULT_API_KEY)  # 获取API密钥

        
        # 检查内置API密钥是否启用
        if not ENABLE_BUILTIN_API_KEY and api_key == DEFAULT_API_KEY:
            return jsonify({'error': '内置API密钥功能已禁用，请使用自定义密钥'}), 403
        system_prompt = data.get('system_prompt')  # 获取系统提示词

        # 内部系统提示：使用用户指定的文案
        auto_emotion_flag = request.headers.get('x-auto-emotion', '').lower() == 'true'
        internal_prompt = None
        if auto_emotion_flag:
            internal_prompt = (
                "【系统内部提示词】：我已经将你接入到了一个AI聊天的项目之中，而你负责按照用户的要求来做出回复，该怎么说就怎么说，你的下游连接着另外一个AI处理系统，会自动将你所说的任何内容自动加工成带有情感标签的话，用于最后的语音合成。所以，对这个项目的用户来说，你是一个能说话的AI系统，比如说用户向你说“你能笑一下吗”，那么你不能回答“我作为一个基于文本的AI是无法笑的，但是我可以给你讲个好笑的故事”，所以语音合成的问题，都会由你的下游程序都来解决。再比如说，用户表示“你能用粤语说句话吗”，你只要正常的说就行，也不用刻意提示切换为粤语口气，因为这些，后期的程序都会自动识别并处理好的。而且你应该就当这件事情不存在，不应该向用户告知这件事情，也不输入任何系统提示"
            )

        # 将用户“附加提示词”加上标签，并与内部提示合并
        labeled_user_prompt = None
        if system_prompt and system_prompt.strip():
            labeled_user_prompt = f"【用户附加提示词部分】：\n{system_prompt.strip()}"

        if internal_prompt and labeled_user_prompt:
            system_prompt = labeled_user_prompt + "\n\n" + internal_prompt
        elif internal_prompt:
            system_prompt = internal_prompt
        elif labeled_user_prompt:
            system_prompt = labeled_user_prompt
        else:
            system_prompt = None
        
        if stream:
            return Response(
                stream_chat_response(user_message, model, history, api_key, system_prompt),
                mimetype='text/event-stream',
                headers={
                    'Cache-Control': 'no-cache',
                    'Connection': 'keep-alive',
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Headers': 'Content-Type'
                }
            )
        else:
            # 非流式传输（兼容旧版本）
            ai_response = call_siliconflow_api(user_message, model, history, api_key, stream=False, system_prompt=system_prompt)
            
            # 保存到聊天历史
            chat_record = {
                'timestamp': time.time(),
                'user_message': user_message,
                'ai_response': ai_response,
                'model': model
            }
            chat_history.append(chat_record)
            
            return jsonify({
                'response': ai_response,
                'model': model,
                'timestamp': chat_record['timestamp']
            })
        
    except Exception as e:
        return jsonify({'error': f'服务器错误: {str(e)}'}), 500

@app.route('/api/tts', methods=['POST'])
def text_to_speech():
    """处理TTS请求"""
    try:
        data = request.get_json()
        
        if not data or 'text' not in data:
            return jsonify({'error': '缺少文本内容'}), 400
        
        text = data['text']
        voice_mode = data.get('mode', 'builtin')
        voice_id = data.get('voice_id')
        api_key = data.get('api_key', DEFAULT_API_KEY)
        
        # 检查内置API密钥是否启用
        if not ENABLE_BUILTIN_API_KEY and api_key == DEFAULT_API_KEY:
            return jsonify({'error': '内置API密钥功能已禁用，请使用自定义密钥'}), 403
            
        reference_text = data.get('reference_text', '')  # 参考文本
        reference_audio = data.get('reference_audio', '')  # 参考音频base64
        speed = data.get('speed', 1.0)  # 语速，默认1.0
        
        print(f"TTS请求: 文本长度={len(text)}, 模式={voice_mode}, 音色={voice_id}, 语速={speed}")
        
        # 调用SiliconFlow TTS API
        audio_data = call_siliconflow_tts(text, voice_mode, voice_id, api_key, reference_text, reference_audio, speed)
        
        if isinstance(audio_data, str) and audio_data.startswith('error:'):
            return jsonify({'error': audio_data[6:]}), 400
        
        # 直接返回音频数据
        return Response(
            audio_data,
            mimetype='audio/mpeg',
            headers={
                'Content-Disposition': 'inline; filename="tts_audio.mp3"',
                'Cache-Control': 'no-cache'
            }
        )
        
    except Exception as e:
        print(f"TTS错误: {str(e)}")
        return jsonify({'error': f'TTS错误: {str(e)}'}), 500

@app.route('/api/manual-synthesis', methods=['POST'])
def manual_synthesis():
    """处理手动合成请求"""
    try:
        data = request.get_json()
        
        if not data or 'text' not in data:
            return jsonify({'error': '缺少文本内容'}), 400
        
        text = data['text']
        voice_mode = data.get('mode', 'builtin')
        voice_id = data.get('voice_id', 'alex')
        api_key = data.get('api_key', DEFAULT_API_KEY)
        
        # 检查内置API密钥是否启用
        if not ENABLE_BUILTIN_API_KEY and api_key == DEFAULT_API_KEY:
            return jsonify({'error': '内置API密钥功能已禁用，请使用自定义密钥'}), 403
            
        speed = data.get('speed', 1.0)
        
        print(f"手动合成请求: 文本长度={len(text)}, 音色={voice_id}")
        print(f"输入文本: {text[:100]}...")
        
        # 直接使用用户输入的文本（包含情感语法）
        audio_data = call_siliconflow_tts(text, voice_mode, voice_id, api_key, '', '', speed)
        
        if isinstance(audio_data, str) and audio_data.startswith('error:'):
            return jsonify({'error': audio_data[6:]}), 400
        
        # 直接返回音频数据
        return Response(
            audio_data,
            mimetype='audio/mpeg',
            headers={
                'Content-Disposition': 'inline; filename="synthesis_audio.mp3"',
                'Cache-Control': 'no-cache'
            }
        )
        
    except Exception as e:
        print(f"手动合成错误: {str(e)}")
        return jsonify({'error': f'手动合成错误: {str(e)}'}), 500

@app.route('/api/upload-audio', methods=['POST'])
def upload_audio():
    """处理音频文件上传"""
    try:
        if 'audio' not in request.files:
            return jsonify({'error': '没有上传文件'}), 400
        
        file = request.files['audio']
        if file.filename == '':
            return jsonify({'error': '没有选择文件'}), 400
        
        # 检查文件类型
        if not file.filename.lower().endswith(('.wav', '.mp3', '.m4a', '.ogg')):
            return jsonify({'error': '不支持的文件格式'}), 400
        
        # 保存文件（实际项目中应该保存到云存储）
        filename = f"audio_{int(time.time())}_{file.filename}"
        file_path = os.path.join('../audio', filename)
        
        # 确保audio目录存在
        os.makedirs('../audio', exist_ok=True)
        
        file.save(file_path)
        
        return jsonify({
            'success': True,
            'filename': filename,
            'message': '音频文件上传成功'
        })
        
    except Exception as e:
        return jsonify({'error': f'上传错误: {str(e)}'}), 500

@app.route('/api/settings', methods=['GET', 'POST'])
def settings():
    """处理设置保存和获取"""
    try:
        if request.method == 'GET':
            # 获取设置
            settings_file = 'settings.json'
            if os.path.exists(settings_file):
                with open(settings_file, 'r', encoding='utf-8') as f:
                    return jsonify(json.load(f))
            else:
                return jsonify({})
        
        elif request.method == 'POST':
            # 保存设置
            data = request.get_json()
            settings_file = 'settings.json'
            
            with open(settings_file, 'w', encoding='utf-8') as f:
                json.dump(data, f, ensure_ascii=False, indent=2)
            
            return jsonify({'success': True, 'message': '设置保存成功'})
            
    except Exception as e:
        return jsonify({'error': f'设置错误: {str(e)}'}), 500

@app.route('/api/chat-history', methods=['GET'])
def get_chat_history():
    """获取聊天历史"""
    try:
        return jsonify({
            'history': chat_history,
            'count': len(chat_history)
        })
    except Exception as e:
        return jsonify({'error': f'获取历史错误: {str(e)}'}), 500

@app.route('/api/clear-history', methods=['POST'])
def clear_history():
    """清空聊天历史"""
    try:
        global chat_history
        chat_history = []
        return jsonify({'success': True, 'message': '聊天历史已清空'})
    except Exception as e:
        return jsonify({'error': f'清空历史错误: {str(e)}'}), 500

def call_siliconflow_api(message, model, history=[], api_key=DEFAULT_API_KEY, stream=False, system_prompt=None):
    """调用SiliconFlow API"""
    try:
        headers = {
            'Authorization': f'Bearer {api_key}',
            'Content-Type': 'application/json'
        }
        
        # 构建包含历史记录的消息列表
        messages = []
        
        # 添加系统提示词（如果提供）
        if system_prompt and system_prompt.strip():
            messages.append({
                'role': 'system',
                'content': system_prompt.strip()
            })
            print(f"使用系统提示词: {system_prompt.strip()}")
        
        # 添加历史对话
        for item in history:
            messages.append({
                'role': item['role'],
                'content': item['content']
            })
        
        # 添加当前用户消息
        messages.append({
            'role': 'user',
            'content': message
        })
        
        data = {
            'model': model,
            'messages': messages,
            'max_tokens': 2000,
            'temperature': 0.7,
            'stream': stream
        }
        
        print(f"调用SiliconFlow API: {model}")
        print(f"用户消息: {message}")
        print(f"流式传输: {stream}")
        
        response = requests.post(
            SILICONFLOW_API_URL,
            headers=headers,
            json=data,
            timeout=60,
            stream=stream
        )
        
        if response.status_code == 200:
            if stream:
                return response
            else:
                result = response.json()
                ai_response = result['choices'][0]['message']['content']
                print(f"AI回复: {ai_response}")
                return ai_response
        elif response.status_code == 401:
            error_msg = "API密钥无效或已过期"
            print(error_msg)
            return f"API密钥错误: {error_msg}"
        elif response.status_code == 403:
            error_msg = "API密钥权限不足"
            print(error_msg)
            return f"API密钥权限错误: {error_msg}"
        else:
            error_msg = f"API调用失败: {response.status_code} - {response.text}"
            print(error_msg)
            return f"抱歉，AI服务暂时不可用。错误信息: {error_msg}"
            
    except requests.exceptions.Timeout:
        error_msg = "API请求超时"
        print(error_msg)
        return f"抱歉，AI服务响应超时。请稍后重试。"
    except requests.exceptions.RequestException as e:
        error_msg = f"网络请求错误: {str(e)}"
        print(error_msg)
        return f"抱歉，网络连接出现问题。请检查网络连接后重试。"
    except Exception as e:
        error_msg = f"未知错误: {str(e)}"
        print(error_msg)
        return f"抱歉，发生了未知错误。请稍后重试。"

def stream_chat_response(message, model, history=[], api_key=DEFAULT_API_KEY, system_prompt=None):
    """流式传输聊天响应"""
    try:
        # 调用流式API
        response = call_siliconflow_api(message, model, history, api_key, stream=True, system_prompt=system_prompt)
        
        if isinstance(response, str):
            # 如果返回错误信息
            yield f"data: {json.dumps({'error': response})}\n\n"
            return
        
        full_response = ""
        full_reasoning = ""
        is_reasoning_model = model == "Pro/deepseek-ai/DeepSeek-R1"
        
        for line in response.iter_lines():
            if line:
                line = line.decode('utf-8')
                if line.startswith('data: '):
                    data = line[6:]  # 移除 'data: ' 前缀
                    if data == '[DONE]':
                        break
                    
                    try:
                        json_data = json.loads(data)
                        if 'choices' in json_data and len(json_data['choices']) > 0:
                            choice = json_data['choices'][0]
                            
                            # 处理推理模型的推理内容
                            if is_reasoning_model and 'delta' in choice:
                                delta = choice['delta']
                                
                                # 处理推理过程
                                if 'reasoning_content' in delta and delta['reasoning_content']:
                                    reasoning_content = delta['reasoning_content']
                                    full_reasoning += reasoning_content
                                    yield f"data: {json.dumps({'reasoning': reasoning_content, 'type': 'reasoning'})}\n\n"
                                
                                # 处理最终答案
                                if 'content' in delta and delta['content']:
                                    content = delta['content']
                                    full_response += content
                                    yield f"data: {json.dumps({'content': content, 'type': 'answer'})}\n\n"
                            
                            # 处理普通模型的内容
                            elif 'delta' in choice and 'content' in choice['delta']:
                                content = choice['delta']['content']
                                if content:
                                    full_response += content
                                    yield f"data: {json.dumps({'content': content})}\n\n"
                                    
                    except json.JSONDecodeError:
                        continue
        
        # 保存完整的聊天记录
        chat_record = {
            'timestamp': time.time(),
            'user_message': message,
            'ai_response': full_response,
            'reasoning_content': full_reasoning if is_reasoning_model else None,
            'model': model
        }
        chat_history.append(chat_record)
        
        # 发送完成信号
        yield f"data: {json.dumps({'done': True, 'full_response': full_response, 'full_reasoning': full_reasoning if is_reasoning_model else None})}\n\n"
        
    except Exception as e:
        error_msg = f"流式传输错误: {str(e)}"
        print(error_msg)
        yield f"data: {json.dumps({'error': error_msg})}\n\n"

@app.route('/api/voices', methods=['GET', 'POST'])
def manage_voices():
    """管理自定义音色"""
    try:
        if request.method == 'GET':
            # 获取自定义音色列表
            return jsonify({
                'success': True,
                'voices': list(custom_voices.values())
            })
        
        elif request.method == 'POST':
            # 创建新的自定义音色
            data = request.get_json()
            
            if not data or 'name' not in data or 'reference_text' not in data:
                return jsonify({'error': '缺少必要参数'}), 400
            
            voice_name = data['name']
            reference_text = data['reference_text']
            reference_audio = data.get('reference_audio', '')  # base64音频数据
            api_key = data.get('api_key', DEFAULT_API_KEY)
            
            # 检查内置API密钥是否启用
            if not ENABLE_BUILTIN_API_KEY and api_key == DEFAULT_API_KEY:
                return jsonify({'error': '内置API密钥功能已禁用，请使用自定义密钥'}), 403
            
            if not reference_audio:
                return jsonify({'error': '缺少参考音频'}), 400
            
            # 调用SiliconFlow API创建自定义音色
            try:
                voice_id = create_siliconflow_voice(voice_name, reference_text, reference_audio, api_key)
                if isinstance(voice_id, str) and voice_id.startswith('error:'):
                    return jsonify({'error': voice_id[6:]}), 400
                
                voice_data = {
                    'id': voice_id,
                    'name': voice_name,
                    'reference_text': reference_text,
                    'created_at': time.time(),
                    'type': 'custom'
                }
                
                custom_voices[voice_id] = voice_data
                
                # 保存音色数据到文件
                save_custom_voices(custom_voices)
                
                print(f"创建自定义音色成功: {voice_name} -> {voice_id}")
                
                return jsonify({
                    'success': True,
                    'voice': voice_data,
                    'message': f'音色"{voice_name}"创建成功'
                })
            except Exception as e:
                print(f"创建音色失败: {str(e)}")
                return jsonify({'error': f'创建音色失败: {str(e)}'}), 500
            
    except Exception as e:
        print(f"音色管理错误: {str(e)}")
        return jsonify({'error': f'音色管理错误: {str(e)}'}), 500

@app.route('/api/voices/<voice_id>', methods=['DELETE'])
def delete_voice(voice_id):
    """删除自定义音色"""
    try:
        if voice_id not in custom_voices:
            return jsonify({'error': '音色不存在'}), 404
        
        voice_name = custom_voices[voice_id]['name']
        del custom_voices[voice_id]
        
        # 保存音色数据到文件
        save_custom_voices(custom_voices)
        
        print(f"删除自定义音色: {voice_name}")
        
        return jsonify({
            'success': True,
            'message': f'音色"{voice_name}"已删除'
        })
        
    except Exception as e:
        print(f"删除音色错误: {str(e)}")
        return jsonify({'error': f'删除音色错误: {str(e)}'}), 500

@app.route('/api/upload-voice-audio', methods=['POST'])
def upload_voice_audio():
    """上传音色参考音频"""
    try:
        if 'audio' not in request.files:
            return jsonify({'error': '没有上传音频文件'}), 400
        
        file = request.files['audio']
        if file.filename == '':
            return jsonify({'error': '没有选择文件'}), 400
        
        # 检查文件类型
        allowed_extensions = {'.wav', '.mp3', '.m4a', '.ogg', '.flac'}
        file_ext = os.path.splitext(file.filename)[1].lower()
        if file_ext not in allowed_extensions:
            return jsonify({'error': f'不支持的文件格式，支持: {", ".join(allowed_extensions)}'}), 400
        
        # 保存文件
        filename = f"voice_ref_{int(time.time())}_{file.filename}"
        file_path = os.path.join('../audio', filename)
        
        # 确保audio目录存在
        os.makedirs('../audio', exist_ok=True)
        
        file.save(file_path)
        
        print(f"上传音色参考音频: {filename}")
        
        return jsonify({
            'success': True,
            'filename': filename,
            'file_path': f'/audio/{filename}',
            'message': '音频文件上传成功'
        })
        
    except Exception as e:
        print(f"音频上传错误: {str(e)}")
        return jsonify({'error': f'音频上传错误: {str(e)}'}), 500

def create_siliconflow_voice(voice_name, reference_text, reference_audio, api_key):
    """调用SiliconFlow API创建自定义音色"""
    try:
        headers = {
            'Authorization': f'Bearer {api_key}',
            'Content-Type': 'application/json'
        }
        
        # 生成符合API要求的音色名称（只允许字母、数字、下划线和连字符）
        import re
        # 移除或替换不支持的字符
        safe_name = re.sub(r'[^a-zA-Z0-9_-]', '_', voice_name)
        # 如果全是特殊字符被替换，使用时间戳
        if not re.search(r'[a-zA-Z0-9]', safe_name):
            safe_name = f"voice_{int(time.time())}"
        # 确保不超过64字符
        safe_name = safe_name[:64]
        # 确保不以下划线开头或结尾
        safe_name = safe_name.strip('_')
        if not safe_name:
            safe_name = f"voice_{int(time.time())}"
        
        data = {
            'model': 'FunAudioLLM/CosyVoice2-0.5B',
            'customName': safe_name,
            'audio': reference_audio,  # base64编码的音频
            'text': reference_text
        }
        
        print(f"创建SiliconFlow音色: {voice_name} -> {safe_name}")
        
        response = requests.post(
            'https://api.siliconflow.cn/v1/uploads/audio/voice',
            headers=headers,
            json=data,
            timeout=60
        )
        
        if response.status_code == 200:
            result = response.json()
            if 'uri' in result:
                print(f"音色创建成功，URI: {result['uri']}")
                return result['uri']
            else:
                return f"error: 无效的API响应: {result}"
        elif response.status_code == 401:
            return "error: API密钥无效或已过期"
        elif response.status_code == 403:
            return "error: 权限不足，可能需要实名认证"
        else:
            try:
                error_msg = response.json().get('message', 'Unknown error')
                return f"error: {error_msg}"
            except:
                return f"error: HTTP {response.status_code}"
                
    except requests.exceptions.Timeout:
        return "error: 请求超时"
    except requests.exceptions.RequestException as e:
        return f"error: 网络错误: {str(e)}"
    except Exception as e:
        return f"error: 未知错误: {str(e)}"

def call_siliconflow_tts(text, voice_mode, voice_id, api_key, reference_text='', reference_audio='', speed=1.0):
    """调用SiliconFlow TTS API"""
    try:
        headers = {
            'Authorization': f'Bearer {api_key}',
            'Content-Type': 'application/json'
        }
        
        # 根据模式设置参数
        if voice_mode == 'builtin':
            # 内置音色 - 需要添加模型前缀
            voice_name = voice_id or 'alex'
            voice = f'FunAudioLLM/CosyVoice2-0.5B:{voice_name}'
            data = {
                'model': 'FunAudioLLM/CosyVoice2-0.5B',
                'input': text,
                'voice': voice,
                'response_format': 'mp3',
                'speed': speed
            }
        elif voice_mode == 'temp_custom':
            # 临时自定义音色 - 使用动态音色模式，voice为空字符串
            if not reference_audio or not reference_text:
                return "error: 临时自定义音色需要参考音频和参考文本"
            
            data = {
                'model': 'FunAudioLLM/CosyVoice2-0.5B',
                'input': text,
                'voice': '',  # 空字符串表示使用动态音色
                'response_format': 'mp3',
                'speed': speed
            }
            
            # 对于动态音色，需要添加extra_body参数
            extra_body = {
                'references': [
                    {
                        'audio': reference_audio,  # base64编码的音频数据
                        'text': reference_text  # 参考文本
                    }
                ]
            }
        elif voice_mode == 'custom_list':
            # 自定义音色列表 - 使用已保存的自定义音色
            data = {
                'model': 'FunAudioLLM/CosyVoice2-0.5B',
                'input': text,
                'voice': voice_id,  # 使用保存的音色ID (格式: speech:name:id:hash)
                'response_format': 'mp3',
                'speed': speed
            }
        else:
            return f"error: 不支持的音色模式: {voice_mode}"
        
        print(f"调用SiliconFlow TTS API: 模型=FunAudioLLM/CosyVoice2-0.5B, 音色模式={voice_mode}")
        print(f"[TTS输入文本] => {text[:200]}{'...' if len(text)>200 else ''}")
        
        # 对于临时自定义音色，需要合并extra_body参数
        if voice_mode == 'temp_custom' and 'extra_body' in locals():
            # 将extra_body的内容合并到data中
            data.update(extra_body)
            print(f"动态音色请求数据: {data}")
        else:
            print(f"请求数据: {data}")
        
        response = requests.post(
            SILICONFLOW_TTS_URL,
            headers=headers,
            json=data,
            timeout=30
        )
        
        if response.status_code == 200:
            # 检查响应是否为音频数据
            content_type = response.headers.get('content-type', '')
            if 'audio' in content_type:
                # 直接返回音频数据
                print(f"TTS音频生成成功，大小: {len(response.content)} bytes")
                return response.content
            else:
                # 可能是JSON响应
                try:
                    result = response.json()
                    if 'audio_url' in result:
                        # 如果API返回了URL，我们需要下载音频
                        audio_response = requests.get(result['audio_url'], timeout=30)
                        if audio_response.status_code == 200:
                            return audio_response.content
                        else:
                            return f"error: 无法下载音频文件"
                    else:
                        return f"error: 无效的API响应: {result}"
                except:
                    return f"error: 无法解析API响应"
        
        elif response.status_code == 401:
            return "error: API密钥无效或已过期"
        elif response.status_code == 403:
            return "error: API密钥权限不足"
        else:
            error_text = response.text
            print(f"TTS API调用失败: {response.status_code} - {error_text}")
            return f"error: TTS API调用失败: {response.status_code}"
            
    except requests.exceptions.Timeout:
        return "error: TTS API请求超时"
    except requests.exceptions.RequestException as e:
        return f"error: TTS网络请求错误: {str(e)}"
    except Exception as e:
        return f"error: TTS未知错误: {str(e)}"

def simulate_tts(text, voice, mode):
    """模拟TTS处理"""
    # 模拟处理时间
    time.sleep(0.5)
    
    # 返回模拟的音频URL
    return f"/api/audio/sample_{voice}_{mode}.mp3"

@app.errorhandler(404)
def not_found(error):
    return jsonify({'error': '接口不存在'}), 404

@app.errorhandler(500)
def internal_error(error):
    return jsonify({'error': '服务器内部错误'}), 500

def apply_emotion_to_text(text, emotion):
    """为文本添加情感提示词"""
    emotion_prompts = {
        'neutral': '',  # 中性，不添加提示词
        'happy': '你能用开心的情感说吗？<|endofprompt|>',
        'excited': '你能用兴奋的情感说吗？<|endofprompt|>',
        'sad': '你能用悲伤的情感说吗？<|endofprompt|>',
        'angry': '你能用愤怒的情感说吗？<|endofprompt|>',
        'surprised': '你能用惊讶的情感说吗？<|endofprompt|>',
        'gentle': '你能用温和的情感说吗？<|endofprompt|>',
        'enthusiastic': '你能用热情的情感说吗？<|endofprompt|>',
        'calm': '你能用平静的情感说吗？<|endofprompt|>',
        'cheerful': '你能用愉快的情感说吗？<|endofprompt|>'
    }
    
    prompt = emotion_prompts.get(emotion, '')
    if prompt:
        return prompt + text
    return text

def detect_emotion_from_text(text):
    """简单的情感检测（基于关键词）"""
    # 情感关键词字典
    emotion_keywords = {
        'happy': ['开心', '高兴', '快乐', '喜悦', '兴高采烈', '哈哈', '笑', '太好了'],
        'excited': ['兴奋', '激动', '振奋', '惊喜', '太棒了', 'amazing', 'wonderful'],
        'sad': ['难过', '悲伤', '沮丧', '失落', '痛苦', '哭', '眼泪'],
        'angry': ['愤怒', '生气', '恼火', '气愤', '怒', '讨厌'],
        'surprised': ['惊讶', '震惊', '意外', '没想到', '天哪', '哇'],
        'gentle': ['温和', '柔和', '轻柔', '温暖', '慈祥'],
        'calm': ['平静', '冷静', '安静', '淡定', '沉着'],
        'enthusiastic': ['热情', '热烈', '积极', '充满活力']
    }
    
    text_lower = text.lower()
    emotion_scores = {}
    
    for emotion, keywords in emotion_keywords.items():
        score = 0
        for keyword in keywords:
            if keyword in text_lower:
                score += 1
        emotion_scores[emotion] = score
    
    # 返回得分最高的情感，如果没有匹配则返回中性
    if emotion_scores and max(emotion_scores.values()) > 0:
        return max(emotion_scores, key=emotion_scores.get)
    return 'neutral'

@app.route('/api/tts-postprocess', methods=['POST'])
def tts_postprocess():
    """使用 Hunyuan-A13B-Instruct 对文本进行情感后处理，产出  情感<|endofprompt|>正文  结构"""
    try:
        data = request.get_json()
        if not data or 'text' not in data:
            return jsonify({'error': '缺少文本内容'}), 400

        raw_text = data['text']
        api_key = data.get('api_key', DEFAULT_API_KEY)
        
        # 检查内置API密钥是否启用
        if not ENABLE_BUILTIN_API_KEY and api_key == DEFAULT_API_KEY:
            return jsonify({'error': '内置API密钥功能已禁用，请使用自定义密钥'}), 403
            
        dialect = data.get('dialect')  # 可选：方言名称
        history = data.get('history', [])  # 可选：最近对话历史（数组）

        print("[TTS后处理] 输入文本:", raw_text[:200] + ("..." if len(raw_text) > 200 else ""))

        headers = {
            'Authorization': f'Bearer {api_key}',
            'Content-Type': 'application/json'
        }

        # 方言限定：仅允许这几种
        allowed_dialects = ["粤语", "四川话", "天津话", "武汉话", "上海话"]
        dialect_hint = ""
        if dialect and dialect in allowed_dialects:
            dialect_hint = f"使用{dialect}。"

        # 根据最近历史生成简短上下文提示，帮助模型选择语气/方言
        context_hint = ""
        try:
            if isinstance(history, list) and history:
                # 取最近3条组成简短摘要提示
                tail = history[-3:]
                brief = []
                for h in tail:
                    r = h.get('role', '')
                    c = h.get('content', '')
                    brief.append(f"{r}: {c[:80]}")
                context_hint = "\n".join(brief)
                if context_hint:
                    context_hint = "【对话摘要】\n" + context_hint + "\n"
        except Exception:
            context_hint = ""

        system_prompt = (
            "你是负责‘后期加工’的AI，用于将对话AI输出转化为TTS友好的文本。\n"
            "请严格输出一行，格式：描述<|endofprompt|>正文。具体要求：\n"
            "1) 描述（<|endofprompt|>之前）：\n"
            "   - 仅写必要信息，用中文短句，示例：‘使用粤语。语气高兴。’\n"
            "   - 若历史或当前用户要求了方言（粤语/四川话/天津话/武汉话/上海话），在描述中加入‘使用XX。’\n"
            "   - 根据上下文场景选择合适情感/语气（如：高兴、平静、伤心、惊讶等），用‘语气X。’表达；若不明显，用‘语气中性。’\n"
            "   - 若用户提出诸如‘笑一下’之类要求，不要把这句话放进正文，转而体现在描述/正文的TTS语法中（如<laughter>…</laughter>）。\n"
            "2) 正文（<|endofprompt|>之后）：\n"
            "   - 是要给TTS朗读的内容，不增删关键信息。\n"
            "   - 去掉括号里的补充说明/神情/动作（如（微笑）），并转化为合适的TTS语法（如<laughter>…</laughter>或[laughter]/[breath]），频率较低。\n"
            "   - 只保留标点：。，！？~；删除其他标点和特殊符号（保留必要的TTS标签）。\n"
            "   - 语言风格需与描述匹配（如‘使用粤语’则正文用粤语口语表达）。\n"
            "3) 仅输出目标格式，不要解释，不要多行。\n"
            "你会收到完整的上下文（当前内容 + 若干条历史），请据此判断最合适的方言与情感。\n"
        )

        user_content = (context_hint + raw_text) if context_hint else raw_text
        if dialect_hint:
            user_content = f"{dialect_hint}\n" + user_content

        payload = {
            'model': 'deepseek-ai/DeepSeek-V3',
            'messages': [
                {'role': 'system', 'content': system_prompt},
                {'role': 'user', 'content': user_content}
            ],
            'stream': False,
            'max_tokens': 512,
            'temperature': 0.2,
            'top_p': 0.7
        }

        resp = requests.post(
            SILICONFLOW_API_URL,
            headers=headers,
            json=payload,
            timeout=60,
            stream=False
        )

        if resp.status_code != 200:
            error_msg = f"TTS后处理API调用失败: {resp.status_code} - {resp.text}"
            print(error_msg)
            return jsonify({'error': error_msg}), 400

        result = resp.json()
        processed = result.get('choices', [{}])[0].get('message', {}).get('content', '')
        print("[TTS后处理] 模型返回原文:", processed[:200] + ("..." if len(processed) > 200 else ""))
        if not processed or not processed.strip():
            print("[TTS后处理] 首次无输出，尝试二次请求(放宽采样/明确兜底)")
            relaxed_prompt = system_prompt + "\n若无法确定，也必须输出：语气中性<|endofprompt|>" + raw_text
            retry_payload = {
                'model': 'deepseek-ai/DeepSeek-V3',
                'messages': [
                    {'role': 'system', 'content': relaxed_prompt},
                    {'role': 'user', 'content': user_content}
                ],
                'stream': False,
                'max_tokens': 512,
                'temperature': 0.5,
                'top_p': 0.8
            }
            resp2 = requests.post(
                SILICONFLOW_API_URL,
                headers=headers,
                json=retry_payload,
                timeout=60,
                stream=False
            )
            if resp2.status_code == 200:
                result2 = resp2.json()
                processed = result2.get('choices', [{}])[0].get('message', {}).get('content', '')
                print("[TTS后处理] 二次返回原文:", processed[:200] + ("..." if len(processed) > 200 else ""))
            else:
                print(f"[TTS后处理] 二次请求失败: {resp2.status_code} - {resp2.text}")
                processed = ''

        # 若仍为空，使用本地启发式兜底
        if not processed or not processed.strip():
            print("[TTS后处理] 二次仍无输出，启用启发式兜底")
            # 情感启发：简单根据文本判断
            emo = '语气中性'
            happy_patterns = ['哈哈', '开心', '高兴', '真不错', '太好了', '😀', '😄', '！']
            sad_patterns = ['难过', '伤心', '遗憾', '抱歉']
            angry_patterns = ['生气', '愤怒']
            fear_patterns = ['害怕', '恐惧']
            surprised_patterns = ['惊讶', '没想到']
            txt = raw_text
            if any(p in txt for p in happy_patterns):
                emo = '语气高兴'
            elif any(p in txt for p in sad_patterns):
                emo = '语气伤心'
            elif any(p in txt for p in angry_patterns):
                emo = '语气愤怒'
            elif any(p in txt for p in fear_patterns):
                emo = '语气害怕'
            elif any(p in txt for p in surprised_patterns):
                emo = '语气惊讶'

            # 注解/括号说明清理
            import re
            cleaned = re.sub(r'[\(（][^\)）]{0,60}[\)）]', '', raw_text)  # 去掉短括号段
            # 笑声注入（仅当有“哈”）
            if '哈' in cleaned:
                cleaned = f"<laughter>{cleaned}</laughter>"
            # 标点白名单
            allow = r"[\u4e00-\u9fa5A-Za-z0-9，。！？?！~\s\[\]<>/]|<\|endofprompt\|>"
            cleaned = ''.join(ch for ch in cleaned if re.match(allow, ch))

            desc = (dialect_hint + ('' if not dialect_hint else '')) + (emo)
            desc = desc.strip('。') + '。' if not desc.endswith('。') else desc
            processed = f"{desc}<|endofprompt|>{cleaned}"
            print("[TTS后处理] 启发式输出:", processed[:200] + ("..." if len(processed) > 200 else ""))

        if '<|endofprompt|>' in processed:
            first, rest = processed.split('<|endofprompt|>', 1)
            rest = rest.replace('<|endofprompt|>', '')
            desc = first.strip()
            body_raw = rest
        else:
            desc = '语气中性'
            body_raw = processed

        def resolve_desc(d: str) -> str:
            emos = ['高兴','开心','伤心','难过','害怕','恐惧','愤怒','生气','惊讶','平静','中性']
            hit = [e for e in emos if e in d]
            if '中性' in hit and len(hit) > 1:
                hit = [e for e in hit if e != '中性']
            if not hit:
                return d if d else '语气中性'
            for e in hit:
                if e != '中性':
                    return re.sub(r'中性', '', d).strip() or f'语气{e}'
            return '语气中性'

        import re
        desc = resolve_desc(desc)
        allow = r"[\u4e00-\u9fa5A-Za-z0-9，。！？?！~\s\[\]<>/]|<\|endofprompt\|>"
        def filter_punct(s):
            return ''.join(ch for ch in s if re.match(allow, ch))
        body = filter_punct(body_raw)

        processed = f"{desc}<|endofprompt|>{body}"
        print("[TTS后处理] 规范化输出:", processed[:200] + ("..." if len(processed) > 200 else ""))
        return jsonify({'processed_text': processed, 'dialect': dialect or ''})

    except Exception as e:
        print(f"[TTS后处理] 错误: {str(e)}")
        return jsonify({'error': f'后处理错误: {str(e)}'}), 500

if __name__ == '__main__':
    print("启动AI聊天服务器...")
    print("访问地址: http://localhost:5000")
    print("API文档:")
    print("  POST /api/chat - 发送聊天消息")
    print("  POST /api/tts - 文本转语音")
    print("  GET/POST /api/voices - 管理自定义音色")
    print("  DELETE /api/voices/<voice_id> - 删除自定义音色")
    print("  POST /api/upload-voice-audio - 上传音色参考音频")
    print("  POST /api/upload-audio - 上传音频文件")
    print("  GET/POST /api/settings - 获取/保存设置")
    print("  GET /api/chat-history - 获取聊天历史")
    print("  POST /api/clear-history - 清空聊天历史")
    
    app.run(debug=False, host='0.0.0.0', port=5000) 