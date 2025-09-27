// 全局变量
let currentModel = 'Pro/deepseek-ai/DeepSeek-V3';
let isRecording = false;
let mediaRecorder = null;
let audioChunks = [];
let conversationHistory = []; // 存储当前对话历史
let chatHistory = []; // 存储所有历史对话
let currentChatId = null; // 当前对话ID
let isAIResponding = false; // AI是否正在回复
let currentStreamController = null; // 当前流式传输的控制器

// 配置信息 - 从后端API获取
let DEFAULT_API_KEY = ''; // 将从后端获取
let ENABLE_BUILTIN_API_KEY = true;
let API_URLS = {
    chat: '',
    tts: ''
};

// 提示词相关变量
let enableSystemPrompt = false; // 是否启用系统提示词
let systemPromptText = ''; // 当前系统提示词
let promptPresets = []; // 提示词预设列表
let selectedPresetId = null; // 当前选中的预设ID

// DOM元素
const messageInput = document.getElementById('messageInput');
const sendButton = document.getElementById('sendMessage');
const voiceButton = document.getElementById('voiceInput');
const chatMessages = document.getElementById('chatMessages');
const aiModelSelect = document.getElementById('aiModel');
const newChatButton = document.getElementById('newChat');
const showHistoryButton = document.getElementById('showHistory');
const exportChatButton = document.getElementById('exportChat');
const currentModelName = document.getElementById('currentModelName');
const audioPlayer = document.getElementById('audioPlayer');
const charCount = document.querySelector('.char-count');

// 侧边栏元素 - 更新为新的ID
const apiKeyTypeSelect = document.getElementById('apiKeyType');
const customApiKeySection = document.getElementById('customApiKeySection');
const customApiKeyInput = document.getElementById('customApiKey');

const enableTTS = document.getElementById('enableTTS');
const ttsApiKeyTypeSelect = document.getElementById('ttsApiKeyType');
const customTtsApiKeySection = document.getElementById('customTtsApiKeySection');
const customTtsApiKeyInput = document.getElementById('customTtsApiKey');

const ttsModeSelect = document.getElementById('ttsMode');
const builtinVoiceSection = document.getElementById('builtinVoiceSection');
const builtinVoiceSelect = document.getElementById('builtinVoice');
const referenceAudioInput = document.getElementById('tempReferenceAudio');
const referenceTextInput = document.getElementById('tempReferenceText');

// 新的TTS元素
const tempCustomVoiceSection = document.getElementById('tempCustomVoiceSection');
const tempReferenceAudioInput = document.getElementById('tempReferenceAudio');
const tempReferenceTextInput = document.getElementById('tempReferenceText');
const tempAudioPreview = document.getElementById('tempAudioPreview');
const tempAudioSource = document.getElementById('tempAudioSource');

const customVoiceListSection = document.getElementById('customVoiceListSection');
const createNewVoiceBtn = document.getElementById('createNewVoice');

// 提示词相关元素
const enableSystemPromptCheckbox = document.getElementById('enableSystemPrompt');
const promptConfigSection = document.getElementById('promptConfigSection');
const configPromptBtn = document.getElementById('configPromptBtn');
const promptConfigModal = document.getElementById('promptConfigModal');
const systemPromptTextarea = document.getElementById('systemPromptText');
const presetList = document.getElementById('presetList');
const addPresetBtn = document.getElementById('addPresetBtn');
const newPresetForm = document.getElementById('newPresetForm');
const presetNameInput = document.getElementById('presetName');
const presetContentTextarea = document.getElementById('presetContent');
const savePresetBtn = document.getElementById('savePresetBtn');
const cancelPresetBtn = document.getElementById('cancelPresetBtn');
const savePromptBtn = document.getElementById('savePromptBtn');
const voiceCardsList = document.getElementById('voiceCardsList');
const newVoiceForm = document.getElementById('newVoiceForm');
const newVoiceNameInput = document.getElementById('newVoiceName');
const newVoiceAudioInput = document.getElementById('newVoiceAudio');
const newVoiceTextInput = document.getElementById('newVoiceText');
const newVoiceAudioPreview = document.getElementById('newVoiceAudioPreview');
const newVoiceAudioSource = document.getElementById('newVoiceAudioSource');
const saveNewVoiceBtn = document.getElementById('saveNewVoice');
const cancelNewVoiceBtn = document.getElementById('cancelNewVoice');

// 创建音色模态窗口元素
const createVoiceModal = document.getElementById('createVoiceModal');
const modalVoiceNameInput = document.getElementById('voiceName');
const modalVoiceAudioInput = document.getElementById('voiceAudioFile');
const modalVoiceTextInput = document.getElementById('voiceReferenceText');
const modalAudioPreview = document.getElementById('voiceAudioPreview');
const modalAudioSource = document.getElementById('voiceAudioSource');
const modalSaveVoiceBtn = document.getElementById('saveVoice');
const modalCancelVoiceBtn = document.getElementById('cancelVoice');

// 音频播放控件
// 旧的audioPlayerPanel已移除，现在使用sideAudioPlayer
const playerTextContent = document.getElementById('playerTextContent');
const playPauseBtn = document.getElementById('playPauseBtn');
const progressSlider = document.getElementById('progressSlider');
const currentTimeSpan = document.getElementById('currentTime');
const totalTimeSpan = document.getElementById('totalTime');
const volumeBtn = document.getElementById('volumeBtn');
const volumeSlider = document.getElementById('volumeSlider');
const ttsAudioPlayer = document.getElementById('ttsAudioPlayer');
const ttsAudioSource = document.getElementById('ttsAudioSource');

// 语速控制元素
const ttsSpeedSlider = document.getElementById('ttsSpeed');
const currentSpeedDisplay = document.getElementById('currentSpeed');

// TTS相关变量
let customVoices = [];
let selectedVoiceId = null;
let selectedSynthesisVoiceId = null;
let currentTTSAudio = null;
let currentEmotion = 'neutral';
let currentFunction = 'ai-chat';

// 调试函数：检查模块状态
function debugModuleStatus() {
    console.log('=== 模块状态调试 ===');
    const modules = document.querySelectorAll('.module-content');
    modules.forEach((module, index) => {
        console.log(`模块 ${index + 1}:`, {
            id: module.id,
            display: window.getComputedStyle(module).display,
            hasActiveClass: module.classList.contains('active'),
            classList: Array.from(module.classList)
        });
    });
    console.log('==================');
}

// 加载后端配置
async function loadConfig() {
    try {
        console.log('🔄 开始加载配置...');
        const response = await fetch('/api/config');
        console.log('📡 配置请求响应状态:', response.status);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('📦 收到配置数据:', data);
        
        if (data.success && data.config) {
            DEFAULT_API_KEY = data.config.default_api_key;
            ENABLE_BUILTIN_API_KEY = data.config.enable_builtin_api_key;
            API_URLS = data.config.api_urls;
            
            console.log('✅ 配置加载成功:', {
                hasApiKey: !!DEFAULT_API_KEY,
                enableBuiltin: ENABLE_BUILTIN_API_KEY,
                apiUrls: API_URLS
            });
        } else {
            throw new Error('配置数据格式错误');
        }
    } catch (error) {
        console.error('❌ 配置加载失败:', error);
        // 暂时注释掉这个错误，直接使用默认配置
        // throw error;
        console.log('🔄 使用默认配置继续运行');
        DEFAULT_API_KEY = 'sk-bcidwseaseyklkasafeispoitiinbxltyxyqjsvzpcorqoac';
        ENABLE_BUILTIN_API_KEY = true;
        API_URLS = {
            chat: 'https://api.siliconflow.cn/v1/chat/completions',
            tts: 'https://api.siliconflow.cn/v1/audio/speech'
        };
    }
}

// 最小化初始化 - 只关注核心功能
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM内容加载完成');
    
    // 首先加载配置信息
    loadConfig().then(() => {
        console.log('✅ 配置加载完成，开始初始化应用...');
        initializeApp();
    }).catch(error => {
        console.error('❌ 配置加载失败:', error);
        // 移除错误提示，直接初始化
        // showNotification('配置加载失败，使用默认配置', 'warning');
        console.log('🔄 使用默认配置继续初始化');
        DEFAULT_API_KEY = 'sk-bcidwseaseyklkasafeispoitiinbxltyxyqjsvzpcorqoac';
        initializeApp();
    });
});

// 初始化应用程序
function initializeApp() {
    
    try {
        // 第一步：确保AI对话模块可见
        const aiChatModule = document.getElementById('aiChatModule');
        if (aiChatModule) {
            aiChatModule.style.display = 'flex';
            aiChatModule.classList.add('active');
            console.log('✓ AI对话模块已显示');
        } else {
            console.error('✗ 未找到aiChatModule');
        }
        
        // 第二步：设置模块切换
        const navTabs = document.querySelectorAll('.nav-tab');
        console.log('找到导航标签数量:', navTabs.length);
        
        navTabs.forEach(tab => {
            tab.addEventListener('click', () => {
                console.log('点击标签:', tab.dataset.module);
                
                // 隐藏所有模块
                document.querySelectorAll('.module-content').forEach(m => {
                    m.style.display = 'none';
                    m.classList.remove('active');
                });
                
                // 移除所有标签活动状态
                navTabs.forEach(t => t.classList.remove('active'));
                
                // 激活当前标签
                tab.classList.add('active');
                
                // 显示对应模块 - 修复ID映射
                const moduleMapping = {
                    'ai-chat': 'aiChatModule',
                    'manual-synthesis': 'manualSynthesisModule', 
                    'voice-management': 'voiceManagementModule'
                };
                
                const targetModuleId = moduleMapping[tab.dataset.module];
                const targetContent = document.getElementById(targetModuleId);
                
                if (targetContent) {
                    targetContent.style.display = 'flex';
                    targetContent.classList.add('active');
                    console.log('✓ 显示模块:', targetModuleId);
                } else {
                    console.error('✗ 未找到模块:', targetModuleId, '(映射自:', tab.dataset.module, ')');
                }
            });
        });
        
        // 第三步：基础功能初始化
        if (messageInput && sendButton) {
            sendButton.addEventListener('click', handleSendButtonClick);
            messageInput.addEventListener('keydown', handleKeyPress);
            messageInput.addEventListener('input', updateCharCount);
            console.log('✓ 基础事件监听器已设置');
        }
        
        // 模型选择事件监听器
        if (aiModelSelect) {
            aiModelSelect.addEventListener('change', handleModelChange);
            console.log('✓ 模型选择事件监听器已设置');
        }
        
        // 聊天区域按钮
        const newChatBtn = document.getElementById('newChat');
        const showHistoryBtn = document.getElementById('showHistory');
        const exportChatBtn = document.getElementById('exportChat');
        
        if (newChatBtn) {
            newChatBtn.addEventListener('click', startNewChat);
            console.log('✓ 新对话按钮已设置');
        }
        if (showHistoryBtn) {
            showHistoryBtn.addEventListener('click', showHistory);
            console.log('✓ 历史记录按钮已设置');
        }
        if (exportChatBtn) {
            exportChatBtn.addEventListener('click', exportChat);
            console.log('✓ 导出按钮已设置');
        }
        
        // 第四步：设置面板动态显示
        setupSettingsDynamicDisplay();
        
        // 第五步：加载保存的设置
        loadSettings();
        
        // 第六步：生成对话ID
        currentChatId = generateChatId();
        console.log('✓ 对话ID已生成');
        
        // 第七步：加载音色数据
        setTimeout(() => {
            loadCustomVoices();
        }, 300);
        
        // 初始化手动合成和音色管理模块
        initializeManualSynthesisModule();
        initializeVoiceManagementModule();
        
        // 初始化侧边播放器
        initializeSideAudioPlayer();
        
        // 初始化提示词功能
        initializePromptFeature();
        
        console.log('=== 最小化初始化完成 ===');
        
    } catch (error) {
        console.error('初始化过程中出错:', error);
    }
}

// 设置面板动态显示
function setupSettingsDynamicDisplay() {
    console.log('设置动态显示初始化...');
    
    // API密钥类型切换
    const apiKeyTypeSelect = document.getElementById('apiKeyType');
    const customApiKeySection = document.getElementById('customApiKeySection');
    
    if (apiKeyTypeSelect && customApiKeySection) {
        apiKeyTypeSelect.addEventListener('change', function() {
            const isCustom = this.value === 'custom';
            if (isCustom) {
                customApiKeySection.classList.remove('hidden');
                customApiKeySection.style.display = 'block';
            } else {
                customApiKeySection.classList.add('hidden');
                customApiKeySection.style.display = 'none';
            }
            saveSettings();
        });
    }
    
    // TTS开关
    const enableTTS = document.getElementById('enableTTS');
    const ttsSettings = document.getElementById('ttsSettings');
    
    if (enableTTS && ttsSettings) {
        enableTTS.addEventListener('change', function() {
            if (this.checked) {
                ttsSettings.classList.remove('hidden');
                ttsSettings.style.display = 'block';
            } else {
                ttsSettings.classList.add('hidden');
                ttsSettings.style.display = 'none';
            }
            console.log('TTS开关:', this.checked);
            saveSettings();
        });
        console.log('✓ TTS开关已设置');
    }
    
    // TTS API密钥类型切换
    const ttsApiKeyTypeSelect = document.getElementById('ttsApiKeyType');
    const customTtsApiKeySection = document.getElementById('customTtsApiKeySection');
    
    if (ttsApiKeyTypeSelect && customTtsApiKeySection) {
        ttsApiKeyTypeSelect.addEventListener('change', function() {
            const isCustom = this.value === 'custom';
            if (isCustom) {
                customTtsApiKeySection.classList.remove('hidden');
                customTtsApiKeySection.style.display = 'block';
            } else {
                customTtsApiKeySection.classList.add('hidden');
                customTtsApiKeySection.style.display = 'none';
            }
            saveSettings();
        });
    }
    
    // TTS模式切换
    const ttsModeSelect = document.getElementById('ttsMode');
    const builtinVoiceSection = document.getElementById('builtinVoiceSection');
    const tempCustomVoiceSection = document.getElementById('tempCustomVoiceSection');
    const customVoiceListSection = document.getElementById('customVoiceListSection');
    
    if (ttsModeSelect) {
        ttsModeSelect.addEventListener('change', function() {
            const mode = this.value;
            
            // 隐藏所有选项
            [builtinVoiceSection, tempCustomVoiceSection, customVoiceListSection].forEach(section => {
                if (section) {
                    section.classList.add('hidden');
                    section.style.display = 'none';
                }
            });
            
            // 显示对应选项
            let targetSection = null;
            if (mode === 'builtin' && builtinVoiceSection) {
                targetSection = builtinVoiceSection;
            } else if (mode === 'temp_custom' && tempCustomVoiceSection) {
                targetSection = tempCustomVoiceSection;
            } else if (mode === 'custom_list' && customVoiceListSection) {
                targetSection = customVoiceListSection;
            }
            
            if (targetSection) {
                targetSection.classList.remove('hidden');
                targetSection.style.display = 'block';
            }
            
            console.log('TTS模式切换:', mode);
            saveSettings();
        });
        console.log('✓ TTS模式切换已设置');
    }
    
    // 情感识别开关
    const autoEmotionDetection = document.getElementById('autoEmotionDetection');
    const emotionHint = document.getElementById('emotionHint');
    const manualEmotionPrompt = document.getElementById('manualEmotionPrompt');
    
    if (autoEmotionDetection && emotionHint && manualEmotionPrompt) {
        autoEmotionDetection.addEventListener('change', function() {
            if (this.checked) {
                emotionHint.classList.remove('hidden');
                emotionHint.style.display = 'block';
                manualEmotionPrompt.classList.add('hidden');
                manualEmotionPrompt.style.display = 'none';
            } else {
                emotionHint.classList.add('hidden');
                emotionHint.style.display = 'none';
                manualEmotionPrompt.classList.remove('hidden');
                manualEmotionPrompt.style.display = 'block';
            }
            console.log('情感识别开关:', this.checked);
            saveSettings();
        });
        console.log('✓ 情感识别开关已设置');
    }
    
    // 语速控制特殊处理
    const ttsSpeedSlider = document.getElementById('ttsSpeed');
    const currentSpeedDisplay = document.getElementById('currentSpeed');
    
    if (ttsSpeedSlider && currentSpeedDisplay) {
        ttsSpeedSlider.addEventListener('input', function() {
            currentSpeedDisplay.textContent = this.value + 'x';
            saveSettings();
        });
        console.log('✓ 语速控制已设置');
    }
    
    // 提示词开关
    const enableSystemPromptCheckbox = document.getElementById('enableSystemPrompt');
    const promptConfigSection = document.getElementById('promptConfigSection');
    
    if (enableSystemPromptCheckbox && promptConfigSection) {
        enableSystemPromptCheckbox.addEventListener('change', function() {
            if (this.checked) {
                promptConfigSection.classList.remove('hidden');
                promptConfigSection.style.display = 'block';
            } else {
                promptConfigSection.classList.add('hidden');
                promptConfigSection.style.display = 'none';
            }
            console.log('提示词开关:', this.checked);
            enableSystemPrompt = this.checked;
            saveSettings();
        });
        console.log('✓ 提示词开关已设置');
    }
    
    // 自动保存所有输入
    const autoSaveInputs = [
        'aiModel', 'customApiKey', 'customTtsApiKey', 'builtinVoice', 
        'tempReferenceText', 'emotionPromptText', 'enableSystemPrompt'
    ];
    
    autoSaveInputs.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.addEventListener('change', saveSettings);
            element.addEventListener('input', saveSettings);
        }
    });
    
    console.log('✓ 设置动态显示初始化完成');
}

// 事件监听器初始化
function initializeEventListeners() {
    // 发送消息
    sendButton.addEventListener('click', handleSendButtonClick);
    messageInput.addEventListener('keydown', handleKeyPress);
    
    // 语音输入
    voiceButton.addEventListener('click', toggleVoiceRecording);
    
    // 模型选择
    aiModelSelect.addEventListener('change', handleModelChange);
    
    // 其他按钮
    newChatButton.addEventListener('click', startNewChat);
    showHistoryButton.addEventListener('click', showHistory);
    exportChatButton.addEventListener('click', exportChat);
    
    // 字符计数
    messageInput.addEventListener('input', updateCharCount);
    
    // API密钥类型切换
    if (apiKeyTypeSelect) apiKeyTypeSelect.addEventListener('change', handleApiKeyTypeChange);
    if (ttsApiKeyTypeSelect) ttsApiKeyTypeSelect.addEventListener('change', handleTtsApiKeyTypeChange);
    
    // 功能标签页切换
    initializeFunctionTabs();
    
    // 情感控制
    initializeEmotionControl();
    

    
    // 设置自动保存
    document.addEventListener('change', (e) => {
        if (e.target.matches('#aiModel, #apiKeyType, #customApiKey, #enableTTS, #ttsApiKeyType, #customTtsApiKey, #ttsMode, #builtinVoice, #tempReferenceText, #ttsSpeed, #autoEmotionDetection, #emotionPromptText')) {
            saveSettings();
        }
    });
}

// 处理发送按钮点击
function handleSendButtonClick() {
    if (isAIResponding) {
        // 如果AI正在回复，点击停止
        stopAIResponse();
    } else {
        // 如果AI没有回复，发送消息
        sendMessage();
    }
}

// 停止AI回复
function stopAIResponse() {
    if (currentStreamController) {
        currentStreamController.abort();
        currentStreamController = null;
    }
    
    // 移除AI消息容器（如果存在）
    const aiMessageElement = chatMessages.querySelector('.message.ai:last-child');
    if (aiMessageElement) {
        aiMessageElement.remove();
    }
    
    isAIResponding = false;
    updateSendButtonState();
    enableInput();
    showNotification('已停止AI回复', 'info');
}

// 更新发送按钮状态
function updateSendButtonState() {
    if (isAIResponding) {
        // AI正在回复时，显示停止按钮
        sendButton.innerHTML = '<i class="fas fa-stop"></i>';
        sendButton.title = '停止AI回复';
        sendButton.className = 'btn-send btn-stop';
    } else {
        // AI没有回复时，显示发送按钮
        sendButton.innerHTML = '<i class="fas fa-paper-plane"></i>';
        sendButton.title = '发送消息';
        sendButton.className = 'btn-send';
    }
}

// 初始化侧边栏
function initializeSidebar() {
    // API秘钥类型切换
    apiKeyTypeSelect.addEventListener('change', handleApiKeyTypeChange);
    
    // TTS启用切换
    enableTTS.addEventListener('change', handleTTSEnableChange);
    
    // TTS API秘钥类型切换
    ttsApiKeyTypeSelect.addEventListener('change', handleTtsApiKeyTypeChange);
    
    // TTS模式切换
    ttsModeSelect.addEventListener('change', handleTtsModeChange);
    
    // 文件上传
    referenceAudioInput.addEventListener('change', handleReferenceAudioChange);
    referenceTextInput.addEventListener('input', saveSettings);
    
    // 新的TTS事件监听器
    tempReferenceAudioInput.addEventListener('change', handleTempAudioChange);
    tempReferenceTextInput.addEventListener('input', saveSettings);
    
    // 模态窗口事件监听器已移至 initializeVoiceManagementModule 函数中
    
    // 音频播放控件事件
    playPauseBtn.addEventListener('click', toggleTTSPlayback);
    progressSlider.addEventListener('input', seekTTSAudio);
    volumeBtn.addEventListener('click', toggleMute);
    volumeSlider.addEventListener('input', adjustVolume);
    
    // 添加自动保存事件监听器
    customApiKeyInput.addEventListener('input', saveSettings);
    customTtsApiKeyInput.addEventListener('input', saveSettings);
    builtinVoiceSelect.addEventListener('change', saveSettings);
    
    // 语速控制事件监听器
    ttsSpeedSlider.addEventListener('input', handleSpeedChange);
    
    // 加载保存的设置和音色列表
    loadSidebarSettings();
    loadCustomVoices();
}

// 处理API秘钥类型变更
function handleApiKeyTypeChange() {
    if (apiKeyTypeSelect.value === 'custom') {
        customApiKeySection.classList.remove('hidden');
    } else {
        customApiKeySection.classList.add('hidden');
    }
    saveSettings();
}

// 处理TTS启用变更
function handleTTSEnableChange() {
    saveSettings();
}

// 处理TTS API秘钥类型变更
function handleTtsApiKeyTypeChange() {
    if (ttsApiKeyTypeSelect.value === 'custom') {
        customTtsApiKeySection.classList.remove('hidden');
    } else {
        customTtsApiKeySection.classList.add('hidden');
    }
    saveSettings();
}

// 处理TTS模式变更
function handleTtsModeChange() {
    // 隐藏所有模式相关的区域
    builtinVoiceSection.classList.add('hidden');
    customVoiceSection.classList.add('hidden');
    tempCustomVoiceSection.classList.add('hidden');
    customVoiceListSection.classList.add('hidden');
    
    // 根据选择的模式显示对应区域
    switch (ttsModeSelect.value) {
        case 'builtin':
            builtinVoiceSection.classList.remove('hidden');
            break;
        case 'temp_custom':
            tempCustomVoiceSection.classList.remove('hidden');
            break;
        case 'custom_list':
            customVoiceListSection.classList.remove('hidden');
            displayCustomVoices();
            break;
        default:
            // 兼容旧版本的"custom"模式
            customVoiceSection.classList.remove('hidden');
    }
    saveSettings();
}

// 处理语速变更
function handleSpeedChange() {
    const speedValue = parseFloat(ttsSpeedSlider.value);
    currentSpeedDisplay.textContent = speedValue.toFixed(2) + 'x';
    saveSettings();
}

// 处理参考音频变更
function handleReferenceAudioChange(event) {
    const file = event.target.files[0];
    if (file) {
        console.log('参考音频文件:', file.name, file.size);
        showNotification('参考音频已上传');
        saveSettings();
    }
}

// 加载侧边栏设置
function loadSidebarSettings() {
    // 先重置所有状态，确保初始状态正确
    resetSidebarState();
    
    // 加载API秘钥设置
    const savedApiKeyType = localStorage.getItem('apiKeyType') || 'builtin';
    apiKeyTypeSelect.value = savedApiKeyType;
    
    const savedApiKey = localStorage.getItem('customApiKey');
    if (savedApiKey) {
        customApiKeyInput.value = savedApiKey;
    }
    
    // 加载TTS设置
    const savedEnableTTS = localStorage.getItem('enableTTS') === 'true';
    enableTTS.checked = savedEnableTTS;
    
    const savedTtsApiKeyType = localStorage.getItem('ttsApiKeyType') || 'builtin';
    ttsApiKeyTypeSelect.value = savedTtsApiKeyType;
    
    const savedTtsApiKey = localStorage.getItem('customTtsApiKey');
    if (savedTtsApiKey) {
        customTtsApiKeyInput.value = savedTtsApiKey;
    }
    
    const savedTtsMode = localStorage.getItem('ttsMode') || 'builtin';
    ttsModeSelect.value = savedTtsMode;
    
    const savedBuiltinVoice = localStorage.getItem('builtinVoice') || 'female1';
    builtinVoiceSelect.value = savedBuiltinVoice;
    
    const savedReferenceText = localStorage.getItem('referenceText');
    if (savedReferenceText) {
        referenceTextInput.value = savedReferenceText;
    }
    
    // 加载语速设置
    const savedTtsSpeed = localStorage.getItem('ttsSpeed') || '1.0';
    ttsSpeedSlider.value = savedTtsSpeed;
    currentSpeedDisplay.textContent = parseFloat(savedTtsSpeed).toFixed(2) + 'x';
    
    // 应用设置状态（在加载完所有值之后）
    applySidebarSettings();
}

// 重置侧边栏状态
function resetSidebarState() {
    // 只隐藏需要根据选择动态显示的元素
    customApiKeySection.classList.add('hidden');
    customTtsApiKeySection.classList.add('hidden');
    customVoiceSection.classList.add('hidden');
}

// 应用侧边栏设置
function applySidebarSettings() {
    handleApiKeyTypeChange();
    handleTTSEnableChange();
    handleTtsApiKeyTypeChange();
    handleTtsModeChange();
}

// 处理按键事件
function handleKeyPress(event) {
    if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        if (!isAIResponding) {
            sendMessage();
        }
    }
}

// 发送消息
async function sendMessage() {
    const message = messageInput.value.trim();
    if (!message) return;
    
    // 设置AI回复状态
    isAIResponding = true;
    updateSendButtonState();
    
    // 禁用输入
    disableInput();
    
    // 添加用户消息
    addMessage(message, 'user');
    messageInput.value = '';
    updateCharCount();
    
    try {
        // 获取当前API密钥
        let apiKey = DEFAULT_API_KEY;
        if (apiKeyTypeSelect.value === 'custom') {
            apiKey = customApiKeyInput.value.trim();
            if (!apiKey) {
                showNotification('请输入自定义API密钥', 'error');
                // 重置AI回复状态
                isAIResponding = false;
                updateSendButtonState();
                enableInput();
                return;
            }
        }
        
        // 创建AI消息容器
        const aiMessageElement = createAIMessageContainer();
        
        // 构建包含上下文的请求
        const requestData = {
            message: message,
            model: currentModel,
            stream: true,
            history: conversationHistory, // 发送对话历史
            api_key: apiKey // 发送API密钥
        };
        
        console.log('📤 发送消息，使用模型:', currentModel);
        
        // 添加系统提示词（如果启用）
        if (enableSystemPrompt && systemPromptText.trim()) {
            requestData.system_prompt = systemPromptText.trim();
            console.log('✓ 使用系统提示词:', systemPromptText.trim());
        }
        
        // 创建AbortController用于停止请求
        currentStreamController = new AbortController();
        
        // 调用流式API
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-auto-emotion': (document.getElementById('autoEmotionDetection') && document.getElementById('autoEmotionDetection').checked) ? 'true' : 'false',
            },
            body: JSON.stringify(requestData),
            signal: currentStreamController.signal
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        // 处理流式响应
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        
        while (true) {
            const { done, value } = await reader.read();
            
            if (done) break;
            
            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop(); // 保留不完整的行
            
            for (const line of lines) {
                if (line.startsWith('data: ')) {
                    try {
                        const data = JSON.parse(line.slice(6));
                        
                        if (data.error) {
                            // 检查是否是API密钥相关错误
                            if (data.error.includes('API密钥') || data.error.includes('401') || data.error.includes('403')) {
                                showNotification(data.error, 'error');
                                // 移除AI消息容器，不显示错误消息
                                if (aiMessageElement && aiMessageElement.parentNode) {
                                    aiMessageElement.parentNode.removeChild(aiMessageElement);
                                }
                            } else {
                                // 其他错误仍然在聊天界面显示
                                updateAIMessage(aiMessageElement, `错误: ${data.error}`);
                            }
                            
                            // 重置AI回复状态
                            isAIResponding = false;
                            updateSendButtonState();
                            enableInput();
                            return;
                        }
                        
                        if (data.reasoning) {
                            // 处理推理过程
                            updateAIMessage(aiMessageElement, data.reasoning, true, 'reasoning');
                        }
                        
                        if (data.content) {
                            // 检查是否是推理模型的数据
                            if (data.type === 'reasoning') {
                                updateAIMessage(aiMessageElement, data.content, true, 'reasoning');
                            } else if (data.type === 'answer') {
                                updateAIMessage(aiMessageElement, data.content, true, 'answer');
                            } else {
                                updateAIMessage(aiMessageElement, data.content, true);
                            }
                        }
                        
                        if (data.done) {
                            // 完成流式传输
                            finalizeAIMessage(aiMessageElement);
                            
                            // 保存对话历史
                            saveConversationHistory(message, data.full_response);
                            
                            // 先重置AI回复状态，然后再播放TTS
                            isAIResponding = false;
                            updateSendButtonState();
                            enableInput();
                            
                            // 如果开启了TTS，则播放语音（使用 setTimeout 确保异步执行）
                            if (enableTTS.checked && data.full_response) {
                                setTimeout(() => {
                                    // 对于推理模型，只播放最终答案，不包括思考过程
                                    let ttsText = data.full_response;
                                    const isReasoningModel = currentModel === 'Pro/deepseek-ai/DeepSeek-R1';
                                    
                                    if (isReasoningModel && data.full_reasoning) {
                                        // 移除思考过程，只保留最终答案
                                        ttsText = data.full_response;
                                        // 如果full_response包含完整内容，尝试提取最终答案部分
                                        const lines = ttsText.split('\n');
                                        const answerStartIndex = lines.findIndex(line => 
                                            line.includes('我来') || line.includes('让我') || 
                                            line.includes('好的') || line.includes('嗯') ||
                                            !line.startsWith('我需要') && !line.startsWith('首先') && 
                                            line.length > 10 && !line.includes('思考')
                                        );
                                        if (answerStartIndex > 0) {
                                            ttsText = lines.slice(answerStartIndex).join('\n').trim();
                                        }
                                    }
                                    
                                    if (ttsText.trim()) {
                                        console.log('开始异步TTS播放:', ttsText.substring(0, 50));
                                        playTTS(ttsText).catch(error => {
                                            console.error('TTS播放失败但不影响UI状态:', error);
                                        });
                                    }
                                }, 100); // 100ms延迟确保流式响应完全结束
                            }
                            
                            return;
                        }
                    } catch (e) {
                        console.error('解析流式数据失败:', e);
                    }
                }
            }
        }
        
        // 清理流式响应资源
        if (currentStreamController) {
            currentStreamController = null;
        }
        
    } catch (error) {
        console.error('发送消息失败:', error);
        
        // 检查是否是用户主动停止（AbortError）
        if (error.name === 'AbortError') {
            // 用户主动停止，不显示错误消息
            console.log('用户主动停止AI回复');
            return;
        }
        
        // 检查是否是API密钥相关错误
        if (error.message && (error.message.includes('API密钥') || error.message.includes('401') || error.message.includes('403'))) {
            showNotification('API密钥无效或已过期', 'error');
            // 移除AI消息容器
            if (aiMessageElement && aiMessageElement.parentNode) {
                aiMessageElement.parentNode.removeChild(aiMessageElement);
            }
        } else {
            addMessage('抱歉，网络连接出现问题，请稍后重试。', 'ai');
        }
        
        // 重置AI回复状态
        isAIResponding = false;
        updateSendButtonState();
        enableInput();
    }
}



// 创建AI消息容器
function createAIMessageContainer() {
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message ai';
    
    const avatar = document.createElement('div');
    avatar.className = 'message-avatar';
    avatar.innerHTML = '<i class="fas fa-robot"></i>';
    
    const messageContent = document.createElement('div');
    messageContent.className = 'message-content';
    
    // 创建跳动点动画
    const thinkingDots = document.createElement('div');
    thinkingDots.className = 'thinking-dots';
    thinkingDots.innerHTML = '<span></span><span></span><span></span>';
    
    messageContent.appendChild(thinkingDots);
    
    const actions = document.createElement('div');
    actions.className = 'message-actions';
    
    messageDiv.appendChild(avatar);
    messageDiv.appendChild(messageContent);
    messageDiv.appendChild(actions);
    
    // 移除欢迎消息
    const welcomeMessage = chatMessages.querySelector('.welcome-message');
    if (welcomeMessage) {
        welcomeMessage.remove();
    }
    
    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
    
    return messageDiv;
}

// 更新AI消息内容（流式传输）
function updateAIMessage(messageElement, content, append = false, type = 'content') {
    const messageContent = messageElement.querySelector('.message-content');
    
    // 移除跳动点动画
    const thinkingDots = messageContent.querySelector('.thinking-dots');
    if (thinkingDots) {
        thinkingDots.remove();
    }
    
    // 检查是否是推理模型
    const isReasoningModel = currentModel === 'Pro/deepseek-ai/DeepSeek-R1';
    
    if (isReasoningModel && type === 'reasoning') {
        // 处理推理过程
        let reasoningDiv = messageContent.querySelector('.reasoning-content');
        if (!reasoningDiv) {
            reasoningDiv = document.createElement('div');
            reasoningDiv.className = 'reasoning-content';
            messageContent.appendChild(reasoningDiv);
        }
        
        if (append) {
            reasoningDiv.textContent += content;
        } else {
            reasoningDiv.textContent = content;
        }
    } else if (isReasoningModel && type === 'answer') {
        // 处理最终答案 - 添加到推理过程后面，保持HTML格式
        if (append) {
            // 创建文本节点添加到推理过程后面
            const textNode = document.createTextNode(content);
            messageContent.appendChild(textNode);
        } else {
            // 清除推理过程，只保留最终答案
            messageContent.innerHTML = '';
            messageContent.textContent = content;
        }
    } else {
        // 普通模型或普通内容
        if (append) {
            messageContent.textContent += content;
        } else {
            messageContent.textContent = content;
        }
    }
    
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// 完成AI消息（添加操作按钮）
function finalizeAIMessage(messageElement) {
    const messageContent = messageElement.querySelector('.message-content');
    const actions = messageElement.querySelector('.message-actions');
    
    // 获取完整内容（保持HTML格式）
    const isReasoningModel = currentModel === 'Pro/deepseek-ai/DeepSeek-R1';
    let content = '';
    
    if (isReasoningModel) {
        // 对于推理模型，构建包含格式的文本
        const reasoningDiv = messageContent.querySelector('.reasoning-content');
        if (reasoningDiv) {
            content += reasoningDiv.textContent + '\n\n';
        }
        // 获取推理过程后面的普通文本内容
        const textNodes = Array.from(messageContent.childNodes)
            .filter(node => node.nodeType === Node.TEXT_NODE)
            .map(node => node.textContent.trim())
            .filter(text => text.length > 0);
        content += textNodes.join('\n');
    } else {
        content = messageContent.textContent;
    }
    
    // 添加操作按钮
    if (enableTTS.checked) {
        const playButton = document.createElement('button');
        playButton.className = 'action-btn';
        playButton.innerHTML = '<i class="fas fa-volume-up"></i>';
        playButton.title = '播放语音';
        playButton.onclick = () => playTTS(content);
        actions.appendChild(playButton);
    }
    
    const copyButton = document.createElement('button');
    copyButton.className = 'action-btn';
    copyButton.innerHTML = '<i class="fas fa-copy"></i>';
    copyButton.title = '复制内容';
    copyButton.onclick = () => {
        // 对于推理模型，只复制最终答案部分
        if (isReasoningModel) {
            const reasoningDiv = messageContent.querySelector('.reasoning-content');
            const textNodes = Array.from(messageContent.childNodes)
                .filter(node => node.nodeType === Node.TEXT_NODE)
                .map(node => node.textContent.trim())
                .filter(text => text.length > 0);
            const answerContent = textNodes.join('\n');
            copyToClipboard(answerContent);
        } else {
            copyToClipboard(content);
        }
    };
    actions.appendChild(copyButton);
}

// 添加消息到聊天界面（兼容旧版本）
function addMessage(content, sender) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${sender}`;
    
    const avatar = document.createElement('div');
    avatar.className = 'message-avatar';
    avatar.innerHTML = sender === 'user' ? '<i class="fas fa-user"></i>' : '<i class="fas fa-robot"></i>';
    
    const messageContent = document.createElement('div');
    messageContent.className = 'message-content';
    messageContent.textContent = content;
    
    const actions = document.createElement('div');
    actions.className = 'message-actions';
    
    if (sender === 'ai') {
        // AI消息的操作按钮
        if (enableTTS.checked) {
            const playButton = document.createElement('button');
            playButton.className = 'action-btn';
            playButton.innerHTML = '<i class="fas fa-volume-up"></i>';
            playButton.title = '播放语音';
            playButton.onclick = () => playTTS(content);
            actions.appendChild(playButton);
        }
        
        const copyButton = document.createElement('button');
        copyButton.className = 'action-btn';
        copyButton.innerHTML = '<i class="fas fa-copy"></i>';
        copyButton.title = '复制内容';
        copyButton.onclick = () => copyToClipboard(content);
        actions.appendChild(copyButton);
    } else {
        // 用户消息的操作按钮
        const copyButton = document.createElement('button');
        copyButton.className = 'action-btn';
        copyButton.innerHTML = '<i class="fas fa-copy"></i>';
        copyButton.title = '复制内容';
        copyButton.onclick = () => copyToClipboard(content);
        actions.appendChild(copyButton);
    }
    
    messageDiv.appendChild(avatar);
    messageDiv.appendChild(messageContent);
    messageDiv.appendChild(actions);
    
    // 移除欢迎消息
    const welcomeMessage = chatMessages.querySelector('.welcome-message');
    if (welcomeMessage) {
        welcomeMessage.remove();
    }
    
    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// 添加带HTML内容的消息到聊天界面
function addMessageWithHTML(htmlContent, sender) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${sender}`;
    
    const avatar = document.createElement('div');
    avatar.className = 'message-avatar';
    avatar.innerHTML = sender === 'user' ? '<i class="fas fa-user"></i>' : '<i class="fas fa-robot"></i>';
    
    const messageContent = document.createElement('div');
    messageContent.className = 'message-content';
    messageContent.innerHTML = htmlContent;
    
    const actions = document.createElement('div');
    actions.className = 'message-actions';
    
    if (sender === 'ai') {
        // AI消息的操作按钮
        if (enableTTS.checked) {
            const playButton = document.createElement('button');
            playButton.className = 'action-btn';
            playButton.innerHTML = '<i class="fas fa-volume-up"></i>';
            playButton.title = '播放语音';
            playButton.onclick = () => {
                // 对于推理模型，只播放最终答案部分
                const isReasoningModel = currentModel === 'Pro/deepseek-ai/DeepSeek-R1';
                if (isReasoningModel) {
                    const reasoningDiv = messageContent.querySelector('.reasoning-content');
                    const textNodes = Array.from(messageContent.childNodes)
                        .filter(node => node.nodeType === Node.TEXT_NODE)
                        .map(node => node.textContent.trim())
                        .filter(text => text.length > 0);
                    const answerContent = textNodes.join('\n');
                    playTTS(answerContent);
                } else {
                    playTTS(messageContent.textContent);
                }
            };
            actions.appendChild(playButton);
        }
        
        const copyButton = document.createElement('button');
        copyButton.className = 'action-btn';
        copyButton.innerHTML = '<i class="fas fa-copy"></i>';
        copyButton.title = '复制内容';
        copyButton.onclick = () => {
            // 对于推理模型，只复制最终答案部分
            const isReasoningModel = currentModel === 'Pro/deepseek-ai/DeepSeek-R1';
            if (isReasoningModel) {
                const reasoningDiv = messageContent.querySelector('.reasoning-content');
                const textNodes = Array.from(messageContent.childNodes)
                    .filter(node => node.nodeType === Node.TEXT_NODE)
                    .map(node => node.textContent.trim())
                    .filter(text => text.length > 0);
                const answerContent = textNodes.join('\n');
                copyToClipboard(answerContent);
            } else {
                copyToClipboard(messageContent.textContent);
            }
        };
        actions.appendChild(copyButton);
    } else {
        // 用户消息的操作按钮
        const copyButton = document.createElement('button');
        copyButton.className = 'action-btn';
        copyButton.innerHTML = '<i class="fas fa-copy"></i>';
        copyButton.title = '复制内容';
        copyButton.onclick = () => copyToClipboard(messageContent.textContent);
        actions.appendChild(copyButton);
    }
    
    messageDiv.appendChild(avatar);
    messageDiv.appendChild(messageContent);
    messageDiv.appendChild(actions);
    
    // 移除欢迎消息
    const welcomeMessage = chatMessages.querySelector('.welcome-message');
    if (welcomeMessage) {
        welcomeMessage.remove();
    }
    
    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// 播放TTS语音（模拟函数，后续会替换为真实API）
async function playTTS(text) {
    try {
        // 获取TTS设置
        const ttsSettings = {
            enabled: enableTTS.checked,
            mode: ttsModeSelect.value,
            voice: builtinVoiceSelect.value,
            apiKeyType: ttsApiKeyTypeSelect.value,
            customApiKey: customTtsApiKeyInput.value,
            referenceText: referenceTextInput.value
        };
        

        
        // 模拟语音播放
        showNotification('语音播放功能将在后端集成后启用');
        
    } catch (error) {
        console.error('TTS播放失败:', error);
        showNotification('语音播放失败，请稍后重试');
    }
}

// 禁用输入
function disableInput() {
    messageInput.disabled = true;
    voiceButton.disabled = true;
    messageInput.style.opacity = '0.6';
    voiceButton.style.opacity = '0.6';
    // 发送按钮在AI回复时保持可用，用于停止功能
}

// 启用输入
function enableInput() {
    messageInput.disabled = false;
    voiceButton.disabled = false;
    messageInput.style.opacity = '1';
    voiceButton.style.opacity = '1';
    messageInput.focus();
}

// 保存对话历史
function saveConversationHistory(userMessage, aiResponse) {
    conversationHistory.push({
        role: 'user',
        content: userMessage
    });
    
    // 对于推理模型，保存完整的HTML内容
    const isReasoningModel = currentModel === 'Pro/deepseek-ai/DeepSeek-R1';
    if (isReasoningModel) {
        // 获取当前AI消息的完整HTML内容
        const currentAIMessage = chatMessages.querySelector('.message.ai:last-child');
        if (currentAIMessage) {
            const messageContent = currentAIMessage.querySelector('.message-content');
            const htmlContent = messageContent.innerHTML;
            conversationHistory.push({
                role: 'assistant',
                content: aiResponse,
                htmlContent: htmlContent,
                isReasoningModel: true
            });
        } else {
            conversationHistory.push({
                role: 'assistant',
                content: aiResponse
            });
        }
    } else {
        conversationHistory.push({
            role: 'assistant',
            content: aiResponse
        });
    }
    
    // 限制历史记录长度，避免token过多
    if (conversationHistory.length > 20) {
        conversationHistory = conversationHistory.slice(-20);
    }
    
    // 每次对话完成后，自动保存到历史记录
    saveCurrentChatToHistory();
    
    console.log('对话历史已保存，当前长度:', conversationHistory.length);
}



// 语音录制功能
async function toggleVoiceRecording() {
    if (!isRecording) {
        await startRecording();
    } else {
        stopRecording();
    }
}

// 开始录音
async function startRecording() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaRecorder = new MediaRecorder(stream);
        audioChunks = [];
        
        mediaRecorder.ondataavailable = (event) => {
            audioChunks.push(event.data);
        };
        
        mediaRecorder.onstop = () => {
            const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
            // 这里后续会发送音频到后端进行语音识别
            console.log('录音完成，音频大小:', audioBlob.size);
            showNotification('语音识别功能将在后端集成后启用');
        };
        
        mediaRecorder.start();
        isRecording = true;
        voiceButton.classList.add('recording');
        voiceButton.innerHTML = '<i class="fas fa-stop"></i>';
        
    } catch (error) {
        console.error('无法访问麦克风:', error);
        showNotification('无法访问麦克风，请检查权限设置');
    }
}

// 停止录音
function stopRecording() {
    if (mediaRecorder && isRecording) {
        mediaRecorder.stop();
        mediaRecorder.stream.getTracks().forEach(track => track.stop());
        isRecording = false;
        voiceButton.classList.remove('recording');
        voiceButton.innerHTML = '<i class="fas fa-microphone"></i>';
    }
}

// 处理模型变更
function handleModelChange() {
    console.log('模型切换被调用，旧模型:', currentModel, '新模型:', aiModelSelect.value);
    currentModel = aiModelSelect.value;
    console.log('当前模型已更新为:', currentModel);
    
    if (currentModelName) {
        currentModelName.textContent = aiModelSelect.options[aiModelSelect.selectedIndex].text;
        showNotification(`已切换到 ${currentModelName.textContent}`);
        console.log('模型名称已更新为:', currentModelName.textContent);
    }
    saveSettings();
}

// 处理API密钥类型变化
function handleApiKeyTypeChange() {
    const isCustom = apiKeyTypeSelect.value === 'custom';
    if (customApiKeySection) {
        if (isCustom) {
            customApiKeySection.classList.remove('hidden');
            customApiKeySection.style.display = 'block';
        } else {
            customApiKeySection.classList.add('hidden');
            customApiKeySection.style.display = 'none';
        }
    }
    saveSettings();
}

// 处理TTS API密钥类型变化
function handleTtsApiKeyTypeChange() {
    const isCustom = ttsApiKeyTypeSelect.value === 'custom';
    if (customTtsApiKeySection) {
        if (isCustom) {
            customTtsApiKeySection.classList.remove('hidden');
            customTtsApiKeySection.style.display = 'block';
        } else {
            customTtsApiKeySection.classList.add('hidden');
            customTtsApiKeySection.style.display = 'none';
        }
    }
    saveSettings();
}

// 开始新对话
function startNewChat() {
    // 保存当前对话到历史记录（如果有内容）
    if (conversationHistory.length > 0) {
        saveCurrentChatToHistory();
    }
    
    // 清空当前对话
    conversationHistory = [];
    currentChatId = generateChatId();
    
    // 重置聊天界面
    chatMessages.innerHTML = `
        <div class="welcome-message">
            <div class="welcome-icon">
                <i class="fas fa-robot"></i>
            </div>
            <h2>欢迎使用AI智能聊天助手</h2>
            <p>选择您喜欢的AI模型，开始智能对话吧！</p>
            <div class="feature-list">
                <div class="feature-item">
                    <i class="fas fa-comments"></i>
                    <span>智能对话</span>
                </div>
                <div class="feature-item">
                    <i class="fas fa-volume-up"></i>
                    <span>语音播放</span>
                </div>
                <div class="feature-item">
                    <i class="fas fa-cog"></i>
                    <span>多模型选择</span>
                </div>
            </div>
        </div>
    `;
    
    // 重新启用输入
    enableInput();
    
    showNotification('已开始新对话');
}

// 显示历史记录
function showHistory() {
    const modal = document.getElementById('historyModal');
    const historyList = document.getElementById('historyList');
    
    if (chatHistory.length === 0) {
        historyList.innerHTML = `
            <div class="empty-history">
                <i class="fas fa-history"></i>
                <h4>暂无历史记录</h4>
                <p>开始对话后，历史记录将在这里显示</p>
            </div>
        `;
    } else {
        historyList.innerHTML = chatHistory.map(chat => `
            <div class="history-item ${chat.id === currentChatId ? 'active' : ''}" data-chat-id="${chat.id}">
                <div class="history-info">
                    <div class="history-title">${chat.title}</div>
                    <div class="history-meta">
                        ${new Date(chat.timestamp).toLocaleString()} · ${chat.messageCount} 条消息
                    </div>
                </div>
                <div class="history-actions">
                    <button class="history-btn restore" onclick="restoreChat('${chat.id}')" title="恢复对话">
                        <i class="fas fa-undo"></i>
                    </button>
                    <button class="history-btn delete" onclick="deleteChat('${chat.id}')" title="删除记录">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `).join('');
    }
    
    modal.classList.remove('hidden');
    modal.classList.add('show');
}

// 隐藏历史记录
function hideHistory() {
    const modal = document.getElementById('historyModal');
    modal.classList.remove('show');
    setTimeout(() => {
        modal.classList.add('hidden');
    }, 300);
}

// 恢复对话
function restoreChat(chatId) {
    const chat = chatHistory.find(c => c.id === chatId);
    if (!chat) return;
    
    // 保存当前对话到历史记录
    if (conversationHistory.length > 0 && currentChatId !== chatId) {
        saveCurrentChatToHistory();
    }
    
    // 恢复对话
    currentChatId = chatId;
    conversationHistory = chat.conversationHistory;
    
    // 显示对话内容
    displayChatHistory(chat);
    
    hideHistory();
    showNotification('已恢复对话');
}

// 删除对话记录
function deleteChat(chatId) {
    if (confirm('确定要删除这条历史记录吗？')) {
        chatHistory = chatHistory.filter(c => c.id !== chatId);
        saveChatHistory();
        
        if (currentChatId === chatId) {
            startNewChat();
        }
        
        // 立即更新历史记录弹窗显示
        showHistory();
        
        showNotification('历史记录已删除');
    }
}

// 保存当前对话到历史记录
function saveCurrentChatToHistory() {
    if (conversationHistory.length === 0) return;
    
    const firstMessage = conversationHistory[0];
    const title = firstMessage.content.length > 30 
        ? firstMessage.content.substring(0, 30) + '...' 
        : firstMessage.content;
    
    const chatRecord = {
        id: currentChatId || generateChatId(),
        title: title,
        timestamp: Date.now(),
        messageCount: conversationHistory.length,
        conversationHistory: [...conversationHistory]
    };
    
    // 更新或添加到历史记录
    const existingIndex = chatHistory.findIndex(c => c.id === chatRecord.id);
    if (existingIndex >= 0) {
        chatHistory[existingIndex] = chatRecord;
    } else {
        chatHistory.unshift(chatRecord);
    }
    
    saveChatHistory();
}

// 显示对话历史
function displayChatHistory(chat) {
    chatMessages.innerHTML = '';
    
    chat.conversationHistory.forEach(message => {
        if (message.role === 'assistant' && message.isReasoningModel && message.htmlContent) {
            // 对于推理模型的AI消息，使用保存的HTML内容
            addMessageWithHTML(message.htmlContent, message.role);
        } else {
            addMessage(message.content, message.role);
        }
    });
}

// 生成对话ID
function generateChatId() {
    return 'chat_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

// 保存历史记录到本地存储
function saveChatHistory() {
    localStorage.setItem('chatHistory', JSON.stringify(chatHistory));
}

// 加载历史记录
function loadChatHistory() {
    const saved = localStorage.getItem('chatHistory');
    if (saved) {
        chatHistory = JSON.parse(saved);
    }
}

// 导出聊天记录
function exportChat() {
    const messages = chatMessages.querySelectorAll('.message');
    if (messages.length === 0) {
        showNotification('没有聊天记录可导出');
        return;
    }
    
    let exportText = `AI聊天记录 - ${new Date().toLocaleString()}\n\n`;
    
    messages.forEach(message => {
        const isUser = message.classList.contains('user');
        const content = message.querySelector('.message-content').textContent;
        const sender = isUser ? '用户' : 'AI';
        exportText += `[${sender}]: ${content}\n\n`;
    });
    
    const blob = new Blob([exportText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `聊天记录_${new Date().toISOString().slice(0, 10)}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showNotification('聊天记录已导出');
}

// 复制到剪贴板
async function copyToClipboard(text) {
    try {
        await navigator.clipboard.writeText(text);
        showNotification('内容已复制到剪贴板');
    } catch (error) {
        console.error('复制失败:', error);
        showNotification('复制失败，请手动复制');
    }
}

// 更新字符计数
function updateCharCount() {
    if (messageInput) {
        const count = messageInput.value.length;
        const charCountElement = document.querySelector('.char-count');
        if (charCountElement) {
            charCountElement.textContent = `${count}/2000`;
            
            if (count > 1800) {
                charCountElement.style.color = '#dc3545';
            } else if (count > 1600) {
                charCountElement.style.color = '#ffc107';
            } else {
                charCountElement.style.color = '#6c757d';
            }
        }
    }
}

// 显示通知
function showNotification(message, type = 'success') {
    // 移除所有现有的通知
    const existingNotifications = document.querySelectorAll('.notification');
    existingNotifications.forEach(notification => {
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => {
            if (document.body.contains(notification)) {
                document.body.removeChild(notification);
            }
        }, 300);
    });
    
    // 创建通知元素
    const notification = document.createElement('div');
    notification.className = 'notification';
    
    // 根据类型设置样式
    let backgroundColor, icon;
    switch (type) {
        case 'error':
            backgroundColor = 'linear-gradient(135deg, #e74c3c 0%, #c0392b 100%)';
            icon = '❌';
            break;
        case 'warning':
            backgroundColor = 'linear-gradient(135deg, #f39c12 0%, #e67e22 100%)';
            icon = '⚠️';
            break;
        case 'info':
            backgroundColor = 'linear-gradient(135deg, #3498db 0%, #2980b9 100%)';
            icon = 'ℹ️';
            break;
        default:
            backgroundColor = 'linear-gradient(135deg, #27ae60 0%, #2ecc71 100%)';
            icon = '✅';
    }
    
    notification.style.cssText = `
        position: fixed;
        top: 80px;
        right: 20px;
        background: ${backgroundColor};
        color: white;
        padding: 16px 20px;
        border-radius: 8px;
        box-shadow: 0 4px 20px rgba(0,0,0,0.3);
        z-index: 10000;
        font-size: 0.9rem;
        font-weight: 500;
        transform: translateX(100%);
        transition: transform 0.3s ease;
        display: flex;
        align-items: center;
        gap: 8px;
        max-width: 350px;
        word-wrap: break-word;
    `;
    notification.innerHTML = `<span>${icon}</span><span>${message}</span>`;
    
    document.body.appendChild(notification);
    
    // 显示动画
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 100);
    
    // 自动隐藏
    setTimeout(() => {
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => {
            if (document.body.contains(notification)) {
                document.body.removeChild(notification);
            }
        }, 300);
    }, type === 'error' ? 5000 : 3000); // 错误通知显示更长时间
}



// 简化版设置保存
function saveSettings() {
    try {
        const settings = {};
        
        // 保存基础设置
        const elements = [
            { id: 'aiModel', key: 'aiModel' },
            { id: 'apiKeyType', key: 'apiKeyType' },
            { id: 'customApiKey', key: 'customApiKey' },
            { id: 'enableTTS', key: 'enableTTS', type: 'checkbox' },
            { id: 'ttsApiKeyType', key: 'ttsApiKeyType' },
            { id: 'customTtsApiKey', key: 'customTtsApiKey' },
            { id: 'synthesisApiKeyType', key: 'synthesisApiKeyType' },
            { id: 'synthesisCustomApiKey', key: 'synthesisCustomApiKey' },
            { id: 'ttsMode', key: 'ttsMode' },
            { id: 'builtinVoice', key: 'builtinVoice' },
            { id: 'tempReferenceText', key: 'tempReferenceText' },
            { id: 'ttsSpeed', key: 'ttsSpeed' },
            { id: 'synthesisSpeed', key: 'synthesisSpeed' },
            { id: 'autoEmotionDetection', key: 'autoEmotionDetection', type: 'checkbox' },
            { id: 'emotionPromptText', key: 'emotionPromptText' },
            { id: 'enableSystemPrompt', key: 'enableSystemPrompt', type: 'checkbox' }
        ];
        
        elements.forEach(({ id, key, type }) => {
            const element = document.getElementById(id);
            if (element) {
                if (type === 'checkbox') {
                    settings[key] = element.checked;
                } else {
                    settings[key] = element.value;
                }
            }
        });
        
        // 保存当前模型
        settings.model = currentModel;
        
        // 保存选中的音色ID
        settings.selectedVoiceId = selectedVoiceId;
        settings.selectedSynthesisVoiceId = selectedSynthesisVoiceId;
        
        // 保存自定义音色数据
        settings.customVoices = customVoices;
        
        // 保存提示词相关数据
        settings.systemPromptText = systemPromptText;
        settings.promptPresets = promptPresets;
        settings.selectedPresetId = selectedPresetId;
        
        localStorage.setItem('aiChatSettings', JSON.stringify(settings));
        
    } catch (error) {
        console.error('保存设置时出错:', error);
    }
}

// 简化版设置加载
function loadSettings() {
    try {
        const saved = localStorage.getItem('aiChatSettings');
        if (!saved) {
            console.log('没有找到保存的设置');
            triggerInitialDisplay();
            return;
        }
        
        const settings = JSON.parse(saved);
        
        // 加载基础设置
        const elements = [
            { id: 'aiModel', key: 'aiModel' },
            { id: 'apiKeyType', key: 'apiKeyType' },
            { id: 'customApiKey', key: 'customApiKey' },
            { id: 'enableTTS', key: 'enableTTS', type: 'checkbox' },
            { id: 'ttsApiKeyType', key: 'ttsApiKeyType' },
            { id: 'customTtsApiKey', key: 'customTtsApiKey' },
            { id: 'synthesisApiKeyType', key: 'synthesisApiKeyType' },
            { id: 'synthesisCustomApiKey', key: 'synthesisCustomApiKey' },
            { id: 'ttsMode', key: 'ttsMode' },
            { id: 'builtinVoice', key: 'builtinVoice' },
            { id: 'tempReferenceText', key: 'tempReferenceText' },
            { id: 'ttsSpeed', key: 'ttsSpeed' },
            { id: 'synthesisSpeed', key: 'synthesisSpeed' },
            { id: 'autoEmotionDetection', key: 'autoEmotionDetection', type: 'checkbox' },
            { id: 'emotionPromptText', key: 'emotionPromptText' },
            { id: 'enableSystemPrompt', key: 'enableSystemPrompt', type: 'checkbox' }
        ];
        
        elements.forEach(({ id, key, type }) => {
            const element = document.getElementById(id);
            if (element && settings[key] !== undefined) {
                if (type === 'checkbox') {
                    element.checked = settings[key];
                } else {
                    element.value = settings[key];
                }
            }
        });
        
        // 更新当前模型
        if (settings.model || settings.aiModel) {
            currentModel = settings.model || settings.aiModel;
            const aiModelSelect = document.getElementById('aiModel');
            if (aiModelSelect) {
                aiModelSelect.value = currentModel;
            }
        }
        
        // 更新语速显示
        if (settings.ttsSpeed) {
            const currentSpeedDisplay = document.getElementById('currentSpeed');
            if (currentSpeedDisplay) {
                currentSpeedDisplay.textContent = parseFloat(settings.ttsSpeed).toFixed(2) + 'x';
            }
        }
        
        if (settings.synthesisSpeed) {
            const currentSynthesisSpeedDisplay = document.getElementById('currentSynthesisSpeed');
            if (currentSynthesisSpeedDisplay) {
                currentSynthesisSpeedDisplay.textContent = parseFloat(settings.synthesisSpeed).toFixed(2) + 'x';
            }
        }
        
        // 恢复选中的音色ID
        if (settings.selectedVoiceId) {
            selectedVoiceId = settings.selectedVoiceId;
            console.log('恢复选中音色ID:', selectedVoiceId);
        }
        
        if (settings.selectedSynthesisVoiceId) {
            selectedSynthesisVoiceId = settings.selectedSynthesisVoiceId;
            console.log('恢复选中合成音色ID:', selectedSynthesisVoiceId);
        }
        
        // 恢复自定义音色数据
        if (settings.customVoices && Array.isArray(settings.customVoices)) {
            customVoices = settings.customVoices;
            console.log('恢复自定义音色数据:', customVoices.length, '个音色');
        }
        
        // 恢复提示词相关数据
        if (settings.systemPromptText !== undefined) {
            systemPromptText = settings.systemPromptText;
            console.log('恢复系统提示词:', systemPromptText);
        }
        
        if (settings.promptPresets && Array.isArray(settings.promptPresets)) {
            promptPresets = settings.promptPresets;
            console.log('恢复提示词预设:', promptPresets.length, '个预设');
        }
        
        if (settings.selectedPresetId) {
            selectedPresetId = settings.selectedPresetId;
            console.log('恢复选中预设ID:', selectedPresetId);
        }
        
        if (settings.enableSystemPrompt !== undefined) {
            enableSystemPrompt = settings.enableSystemPrompt;
            console.log('恢复提示词开关状态:', enableSystemPrompt);
        }
        
        // 触发显示更新
        triggerInitialDisplay();
        
        // 刷新音色列表显示
        setTimeout(() => {
            displayCustomVoices();
            displaySynthesisVoiceCards();
            loadCustomVoicesForManagement();
        }, 200);
        
    } catch (error) {
        console.error('加载设置时出错:', error);
        triggerInitialDisplay();
    }
}

// 触发初始显示状态
function triggerInitialDisplay() {
    setTimeout(() => {
        // 触发所有change事件来更新显示
        const triggers = ['apiKeyType', 'enableTTS', 'ttsApiKeyType', 'synthesisApiKeyType', 'ttsMode', 'autoEmotionDetection', 'enableSystemPrompt'];
        triggers.forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.dispatchEvent(new Event('change'));
            }
        });
        console.log('✓ 初始显示状态已触发');
    }, 100);
}

// 初始化手动合成模块
function initializeManualSynthesisModule() {
    console.log('初始化手动合成模块...');
    
    // 手动合成音色模式切换
    const synthesisVoiceMode = document.getElementById('synthesisVoiceMode');
    const synthesisBuiltinVoice = document.getElementById('synthesisBuiltinVoice');
    const synthesisTempCustomVoice = document.getElementById('synthesisTempCustomVoice');
    const synthesisCustomVoice = document.getElementById('synthesisCustomVoice');
    
    if (synthesisVoiceMode) {
        synthesisVoiceMode.addEventListener('change', function() {
            const mode = this.value;
            
            // 隐藏所有选项
            [synthesisBuiltinVoice, synthesisTempCustomVoice, synthesisCustomVoice].forEach(section => {
                if (section) {
                    section.classList.add('hidden');
                    section.style.display = 'none';
                }
            });
            
            // 显示对应选项
            let targetSection = null;
            if (mode === 'builtin' && synthesisBuiltinVoice) {
                targetSection = synthesisBuiltinVoice;
            } else if (mode === 'temp_custom' && synthesisTempCustomVoice) {
                targetSection = synthesisTempCustomVoice;
            } else if (mode === 'custom_list' && synthesisCustomVoice) {
                targetSection = synthesisCustomVoice;
            }
            
            if (targetSection) {
                targetSection.classList.remove('hidden');
                targetSection.style.display = 'block';
            }
            
            console.log('手动合成音色模式切换:', mode);
        });
        
        // 初始化显示
        synthesisVoiceMode.dispatchEvent(new Event('change'));
        console.log('✓ 手动合成音色模式切换已设置');
    }
    
    // 手动合成按钮
    const startSynthesisBtn = document.getElementById('startSynthesis');
    const downloadSynthesisBtn = document.getElementById('downloadSynthesis');
    
    if (startSynthesisBtn) {
        startSynthesisBtn.addEventListener('click', handleManualSynthesis);
        console.log('✓ 开始合成按钮已设置');
    }
    
    if (downloadSynthesisBtn) {
        downloadSynthesisBtn.addEventListener('click', handleSynthesisDownload);
        console.log('✓ 下载按钮已设置');
    }
    
    // 清空和粘贴按钮
    const clearBtn = document.getElementById('clearSynthesisText');
    const pasteBtn = document.getElementById('pasteSynthesisText');
    const synthesisText = document.getElementById('synthesisText');
    
    if (clearBtn && synthesisText) {
        clearBtn.addEventListener('click', () => {
            synthesisText.value = '';
            updateSynthesisCharCount();
        });
        console.log('✓ 清空按钮已设置');
    }
    
    if (pasteBtn && synthesisText) {
        pasteBtn.addEventListener('click', async () => {
            try {
                const text = await navigator.clipboard.readText();
                synthesisText.value = text;
                updateSynthesisCharCount();
            } catch (err) {
                console.error('粘贴失败:', err);
                showNotification('粘贴失败，请手动输入', 'error');
            }
        });
        console.log('✓ 粘贴按钮已设置');
    }
    
    // 文本输入字符计数
    if (synthesisText) {
        synthesisText.addEventListener('input', updateSynthesisCharCount);
    }
    
    // 初始化音色卡片显示
    displaySynthesisVoiceCards();
    
    // 绑定手动合成API密钥选择事件
    const synthesisApiKeyTypeSelect = document.getElementById('synthesisApiKeyType');
    const synthesisCustomApiKeySection = document.getElementById('synthesisCustomApiKeySection');
    
    // 初始化手动合成模块语速设置
    const synthesisSpeedSlider = document.getElementById('synthesisSpeed');
    const currentSynthesisSpeedDisplay = document.getElementById('currentSynthesisSpeed');
    if (synthesisSpeedSlider && currentSynthesisSpeedDisplay) {
        // 加载保存的语速设置
        const savedSynthesisSpeed = localStorage.getItem('synthesisSpeed') || '1.0';
        synthesisSpeedSlider.value = savedSynthesisSpeed;
        currentSynthesisSpeedDisplay.textContent = parseFloat(savedSynthesisSpeed).toFixed(2) + 'x';
        
        // 绑定滑块事件监听器
        synthesisSpeedSlider.addEventListener('input', function() {
            const speedValue = parseFloat(this.value);
            currentSynthesisSpeedDisplay.textContent = speedValue.toFixed(2) + 'x';
            saveSettings();
        });
        
        console.log('✓ 手动合成语速滑块事件监听器已设置');
    }
    
    if (synthesisApiKeyTypeSelect) {
        synthesisApiKeyTypeSelect.addEventListener('change', function() {
            if (this.value === 'custom') {
                synthesisCustomApiKeySection.classList.remove('hidden');
            } else {
                synthesisCustomApiKeySection.classList.add('hidden');
            }
            // 保存设置
            saveSettings();
        });
        
        // 加载保存的设置
        const savedSynthesisApiKeyType = localStorage.getItem('synthesisApiKeyType');
        if (savedSynthesisApiKeyType) {
            synthesisApiKeyTypeSelect.value = savedSynthesisApiKeyType;
            if (savedSynthesisApiKeyType === 'custom') {
                synthesisCustomApiKeySection.classList.remove('hidden');
            }
        }
        
        // 加载保存的自定义密钥
        const savedSynthesisCustomApiKey = localStorage.getItem('synthesisCustomApiKey');
        if (savedSynthesisCustomApiKey) {
            const synthesisCustomApiKeyInput = document.getElementById('synthesisCustomApiKey');
            if (synthesisCustomApiKeyInput) {
                synthesisCustomApiKeyInput.value = savedSynthesisCustomApiKey;
                // 添加输入事件监听，自动保存
                synthesisCustomApiKeyInput.addEventListener('input', function() {
                    localStorage.setItem('synthesisCustomApiKey', this.value);
                });
            }
        } else {
            // 即使没有保存的值，也要添加输入事件监听
            const synthesisCustomApiKeyInput = document.getElementById('synthesisCustomApiKey');
            if (synthesisCustomApiKeyInput) {
                synthesisCustomApiKeyInput.addEventListener('input', function() {
                    localStorage.setItem('synthesisCustomApiKey', this.value);
                });
            }
        }
    }
    
    console.log('✓ 手动合成模块初始化完成');
}

// 显示手动合成模块的音色卡片
function displaySynthesisVoiceCards() {
    const synthesisVoiceCards = document.getElementById('synthesisVoiceCards');
    if (!synthesisVoiceCards) return;
    
    console.log('更新手动合成模块音色卡片，当前音色数量:', customVoices.length);
    
    if (customVoices.length === 0) {
        synthesisVoiceCards.innerHTML = `
            <div class="empty-voice-list-mini">
                <i class="fas fa-microphone"></i>
                <p>暂无自定义音色</p>
                <small>请先在"音色管理"模块创建音色</small>
            </div>
        `;
        return;
    }
    
    synthesisVoiceCards.innerHTML = customVoices.map(voice => {
        const isSelected = selectedSynthesisVoiceId === voice.id;
        console.log(`手动合成音色 ${voice.name} (${voice.id}) 是否选中:`, isSelected);
        
        return `
            <div class="voice-card-mini ${isSelected ? 'selected' : ''}" 
                 data-voice-id="${voice.id}" onclick="window.selectSynthesisVoice('${voice.id}')">
                <div class="voice-card-mini-info">
                    <div class="voice-card-mini-name">${voice.name}</div>
                    <div class="voice-card-mini-meta">
                        ${new Date(voice.created_at * 1000).toLocaleDateString()}
                    </div>
                </div>
                <div class="voice-card-mini-actions">
                    <button class="voice-card-mini-btn" onclick="window.testSynthesisVoice('${voice.id}'); event.stopPropagation();" 
                            title="测试音色" aria-label="测试音色">
                        <i class="fas fa-play"></i>
                    </button>
                    <button class="voice-card-mini-btn delete-btn" onclick="window.deleteVoice('${voice.id}'); event.stopPropagation();" 
                            title="删除音色" aria-label="删除音色">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `;
    }).join('');
    
    console.log('手动合成音色卡片HTML已更新');
}

// 选择手动合成音色
function selectSynthesisVoice(voiceId) {
    selectedSynthesisVoiceId = voiceId;
    
    // 强制刷新显示
    displaySynthesisVoiceCards();
    
    // 立即保存选择状态
    saveSettings();
    
    // 查找音色名称用于通知
    const voice = customVoices.find(v => v.id === voiceId);
    const voiceName = voice ? voice.name : voiceId;
    showNotification(`已选择合成音色: ${voiceName}`, 'success');
}

// 测试手动合成音色
async function testSynthesisVoice(voiceId) {
    console.log('手动合成模块 - 测试音色:', voiceId);
    
    const voice = customVoices.find(v => v.id === voiceId);
    if (!voice) {
        console.error('音色数据未找到:', voiceId);
        showNotification('❌音色数据未找到', 'error');
        return;
    }
    
    showNotification(`正在试听音色: ${voice.name}`, 'info');
    
    // 使用参考文本进行测试
    const testText = voice.reference_text || '这是一个音色测试，您好！';
    
    // 直接调用playTTS来使用全局播放控件
    try {
        const emotionPrompt = '';
        const finalText = emotionPrompt ? emotionPrompt + testText : testText;
        
        const requestData = {
            text: finalText,
            mode: 'custom_list',
            voice_id: voiceId,
            speed: 1.0
        };
        
        const response = await fetch('/api/manual-synthesis', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestData)
        });
        
        if (response.ok) {
            const audioBlob = await response.blob();
            const audioUrl = URL.createObjectURL(audioBlob);
            
            // 使用全局折叠播放控件
            playAudioFromUrl(audioUrl, testText);
            
            showNotification(`正在播放: ${voice.name}`, 'success');
        } else {
            const error = await response.json();
            console.error('手动合成API错误:', error);
            showNotification('音色试听失败', 'error');
        }
    } catch (error) {
        console.error('手动合成模块音色试听失败:', error);
        showNotification('音色试听失败', 'error');
    }
}

// 确保函数在全局作用域中可用
window.selectSynthesisVoice = selectSynthesisVoice;
window.testSynthesisVoice = testSynthesisVoice;

// 初始化音色管理模块
function initializeVoiceManagementModule() {
    console.log('初始化音色管理模块...');
    
    // 创建新音色按钮
    const createNewVoiceBtn = document.getElementById('createNewVoice');
    if (createNewVoiceBtn) {
        createNewVoiceBtn.addEventListener('click', function(e) {
            console.log('创建新音色按钮被点击');
            e.preventDefault();
            showCreateVoiceModal();
        });
        console.log('✓ 创建新音色按钮已设置');
    } else {
        console.error('✗ 创建新音色按钮未找到');
    }
    
    // 模态窗口按钮事件监听器
    const saveVoiceBtn = document.getElementById('saveVoice');
    const cancelVoiceBtn = document.getElementById('cancelVoice');
    const voiceAudioInput = document.getElementById('voiceAudioFile');
    
    if (saveVoiceBtn) {
        saveVoiceBtn.addEventListener('click', function(e) {
            console.log('保存音色按钮被点击');
            e.preventDefault();
            saveNewVoiceFromModal();
        });
        console.log('✓ 保存音色按钮事件已绑定');
    } else {
        console.error('✗ 保存音色按钮未找到');
    }
    
    if (cancelVoiceBtn) {
        cancelVoiceBtn.addEventListener('click', function(e) {
            console.log('取消按钮被点击');
            e.preventDefault();
            hideCreateVoiceModal();
        });
        console.log('✓ 取消按钮事件已绑定');
    } else {
        console.error('✗ 取消按钮未找到');
    }
    
    if (voiceAudioInput) {
        voiceAudioInput.addEventListener('change', handleModalAudioChange);
        console.log('✓ 音频文件输入事件已绑定');
    } else {
        console.error('✗ 音频文件输入未找到');
    }
    
    // 加载自定义音色列表
    loadCustomVoicesForManagement();
    
    console.log('✓ 音色管理模块初始化完成');
}

// 手动合成处理
async function handleManualSynthesis() {
    const synthesisText = document.getElementById('synthesisText');
    const startBtn = document.getElementById('startSynthesis');
    
    if (!synthesisText || !synthesisText.value.trim()) {
        showNotification('请输入要合成的文本', 'error');
        return;
    }
    
    const text = synthesisText.value.trim();
    
    try {
        if (startBtn) {
            startBtn.disabled = true;
            startBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 合成中...';
        }
        
        // 获取音色模式和对应的音色ID
        const voiceMode = document.getElementById('synthesisVoiceMode')?.value || 'builtin';
        let voiceId = 'alex';
        
        switch (voiceMode) {
            case 'builtin':
                voiceId = document.getElementById('synthesisVoice')?.value || 'alex';
                break;
            case 'temp_custom':
                voiceId = 'temp_custom';
                break;
            case 'custom_list':
                voiceId = selectedSynthesisVoiceId;
                if (!voiceId) {
                    showNotification('请先选择一个自定义音色', 'error');
                    return;
                }
                break;
        }
        

        
        const requestData = {
            text: text, // 直接使用用户输入的完整文本（包含情感语法）
            mode: voiceMode,
            voice_id: voiceId,
            speed: parseFloat(document.getElementById('synthesisSpeed')?.value || '1.0')
        };
        
        // 如果是临时自定义音色，添加参考音频和文本
        if (voiceMode === 'temp_custom') {
            const referenceAudioInput = document.getElementById('synthesisTempReferenceAudio');
            const referenceTextInput = document.getElementById('synthesisTempReferenceText');
            
            if (!referenceAudioInput?.files?.[0]) {
                showNotification('请上传参考音频文件', 'error');
                return;
            }
            
            if (!referenceTextInput?.value?.trim()) {
                showNotification('请输入参考文本', 'error');
                return;
            }
            
            // 将音频文件转换为base64
            const referenceAudio = await fileToBase64(referenceAudioInput.files[0]);
            requestData.reference_audio = referenceAudio;
            requestData.reference_text = referenceTextInput.value.trim();
        }
        
        const response = await fetch('/api/manual-synthesis', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestData)
        });
        
        if (response.ok) {
            const audioBlob = await response.blob();
            const audioUrl = URL.createObjectURL(audioBlob);
            
            // 使用全局折叠播放控件
            playAudioFromUrl(audioUrl, text);
            
            showNotification('合成成功！', 'success');
        } else {
            const error = await response.json();
            showNotification(error.error || '合成失败', 'error');
        }
        
    } catch (error) {
        console.error('合成失败:', error);
        showNotification('合成失败，请稍后重试', 'error');
    } finally {
        if (startBtn) {
            startBtn.disabled = false;
            startBtn.innerHTML = '<i class="fas fa-play"></i> 开始合成';
        }
    }
}

// 更新合成文本字符计数
function updateSynthesisCharCount() {
    const synthesisText = document.getElementById('synthesisText');
    const charCount = document.querySelector('#manualSynthesisModule .char-count .current');
    
    if (synthesisText && charCount) {
        charCount.textContent = synthesisText.value.length;
    }
}

// 加载自定义音色管理
async function loadCustomVoicesForManagement() {
    try {
        const response = await fetch('/api/voices');
        if (response.ok) {
            const data = await response.json();
            const voices = data.voices || [];
            updateCustomVoicesGrid(voices);
        } else {
            console.error('加载自定义音色失败');
            updateCustomVoicesGrid([]);
        }
    } catch (error) {
        console.error('加载自定义音色时出错:', error);
        updateCustomVoicesGrid([]);
    }
}

// 更新自定义音色网格
function updateCustomVoicesGrid(voices) {
    const grid = document.getElementById('customVoicesGrid');
    const emptyState = document.getElementById('emptyVoiceState');
    
    if (!grid) return;
    
    if (voices.length === 0) {
        // 显示空状态
        if (emptyState) {
            emptyState.style.display = 'block';
        }
        // 清空其他内容
        const voiceCards = grid.querySelectorAll('.voice-card');
        voiceCards.forEach(card => card.remove());
    } else {
        // 隐藏空状态
        if (emptyState) {
            emptyState.style.display = 'none';
        }
        
        // 生成音色卡片
        const voiceCardsHTML = voices.map(voice => `
            <div class="voice-card" data-voice-id="${voice.id}">
                <div class="voice-card-header">
                    <h4 class="voice-card-title">${voice.name}</h4>
                    <span class="voice-card-type">自定义</span>
                </div>
                <p class="voice-card-description">${voice.description || '自定义音色'}</p>
                <div class="voice-card-actions">
                    <button type="button" class="voice-card-btn" onclick="testCustomVoice('${voice.id}')" title="试听音色">
                        <i class="fas fa-play"></i> 试听
                    </button>

                    <button type="button" class="voice-card-btn" onclick="window.deleteVoice('${voice.id}')" title="删除音色">
                        <i class="fas fa-trash"></i> 删除
                    </button>
                </div>
            </div>
        `).join('');
        
        // 更新网格内容，保留空状态元素
        const existingCards = grid.querySelectorAll('.voice-card');
        existingCards.forEach(card => card.remove());
        
        if (emptyState) {
            emptyState.insertAdjacentHTML('beforebegin', voiceCardsHTML);
        } else {
            grid.innerHTML = voiceCardsHTML;
        }
    }
    
    console.log(`✓ 已加载 ${voices.length} 个自定义音色`);
}

// 测试自定义音色（音色管理模块）
async function testCustomVoice(voiceId) {
    console.log('测试自定义音色:', voiceId);
    showNotification(`正在测试自定义音色: ${voiceId}`, 'info');
    
    // 找到对应的音色数据
    const voice = customVoices.find(v => v.id === voiceId);
    if (!voice) {
        showNotification('音色数据未找到', 'error');
        return;
    }
    
    // 使用音色的参考文本进行试听
    const testText = voice.reference_text || '这是一个音色测试，您好！';
    try {
        // 直接调用TTS API并播放，强制显示侧边播放器
        await testVoiceWithPlayer(testText, voiceId);
    } catch (error) {
        console.error('音色试听失败:', error);
        showNotification('音色试听失败', 'error');
    }
}

// 调试函数：检查音色数据同步状态
function debugVoiceDataSync() {
    
    
    // 检查后端数据
    fetch('/api/voices')
        .then(response => response.json())
        .then(data => {

        })
        .catch(error => {
            console.error('获取后端音色数据失败:', error);
        });
}

// 暴露调试函数到全局
window.debugVoiceDataSync = debugVoiceDataSync;

// 强制刷新所有音色数据的函数
async function forceRefreshAllVoiceData() {
    console.log('🔄 强制刷新所有音色数据...');
    
    try {
        // 1. 从后端重新加载音色数据
        await loadCustomVoices();
        
        // 2. 强制刷新所有模块的显示
        displayCustomVoices(); // AI对话模块
        displaySynthesisVoiceCards(); // 手动合成模块
        await loadCustomVoicesForManagement(); // 音色管理模块
        
        console.log('✅ 所有音色数据已刷新');
        showNotification('音色数据已同步', 'success');
        
    } catch (error) {
        console.error('刷新音色数据失败:', error);
        showNotification('刷新失败，请重试', 'error');
    }
}

// 暴露刷新函数到全局
window.forceRefreshAllVoiceData = forceRefreshAllVoiceData;

// ===== 提示词功能 =====

// 初始化提示词功能
function initializePromptFeature() {
    console.log('初始化提示词功能...');
    
    // 配置提示词按钮事件
    if (configPromptBtn) {
        configPromptBtn.addEventListener('click', openPromptConfig);
        console.log('✓ 配置提示词按钮已设置');
    }
    
    // 保存提示词按钮事件
    if (savePromptBtn) {
        savePromptBtn.addEventListener('click', savePromptConfig);
        console.log('✓ 保存提示词按钮已设置');
    }
    
    // 添加预设按钮事件
    if (addPresetBtn) {
        addPresetBtn.addEventListener('click', showNewPresetForm);
        console.log('✓ 添加预设按钮已设置');
    }
    
    // 保存预设按钮事件
    if (savePresetBtn) {
        savePresetBtn.addEventListener('click', saveNewPreset);
        console.log('✓ 保存预设按钮已设置');
    }
    
    // 取消预设按钮事件
    if (cancelPresetBtn) {
        cancelPresetBtn.addEventListener('click', hideNewPresetForm);
        console.log('✓ 取消预设按钮已设置');
    }
    
    // 加载默认预设
    loadDefaultPresets();
    
    console.log('✓ 提示词功能初始化完成');
}

// 打开提示词配置窗口
function openPromptConfig() {
    if (!promptConfigModal) return;
    
    // 设置当前提示词到文本框
    if (systemPromptTextarea) {
        systemPromptTextarea.value = systemPromptText;
    }
    
    // 刷新预设列表
    displayPromptPresets();
    
    // 显示模态窗口
    promptConfigModal.classList.remove('hidden');
    promptConfigModal.classList.add('show');
    
    console.log('✓ 提示词配置窗口已打开');
}

// 关闭提示词配置窗口
function closePromptConfig() {
    if (!promptConfigModal) return;
    
    // 隐藏新预设表单
    hideNewPresetForm();
    
    // 隐藏模态窗口
    promptConfigModal.classList.remove('show');
    promptConfigModal.classList.add('hidden');
    
    console.log('✓ 提示词配置窗口已关闭');
}

// 保存提示词配置
function savePromptConfig() {
    if (!systemPromptTextarea) return;
    
    // 更新系统提示词
    systemPromptText = systemPromptTextarea.value.trim();
    
    // 保存设置
    saveSettings();
    
    showNotification('提示词配置已保存', 'success');
    console.log('✓ 提示词配置已保存:', systemPromptText);
}

// 显示新预设表单
function showNewPresetForm() {
    if (!newPresetForm || !presetNameInput || !presetContentTextarea) return;
    
    // 清空表单
    presetNameInput.value = '';
    presetContentTextarea.value = '';
    
    // 显示表单
    newPresetForm.classList.remove('hidden');
    
    // 聚焦到名称输入框
    presetNameInput.focus();
    
    console.log('✓ 新预设表单已显示');
}

// 隐藏新预设表单
function hideNewPresetForm() {
    if (!newPresetForm) return;
    
    newPresetForm.classList.add('hidden');
    console.log('✓ 新预设表单已隐藏');
}

// 保存新预设
function saveNewPreset() {
    if (!presetNameInput || !presetContentTextarea) return;
    
    const name = presetNameInput.value.trim();
    const content = presetContentTextarea.value.trim();
    
    if (!name) {
        showNotification('请输入预设名称', 'error');
        return;
    }
    
    if (!content) {
        showNotification('请输入预设内容', 'error');
        return;
    }
    
    // 检查名称是否重复
    if (promptPresets.some(preset => preset.name === name)) {
        showNotification('预设名称已存在', 'error');
        return;
    }
    
    // 创建新预设
    const newPreset = {
        id: generatePresetId(),
        name: name,
        content: content,
        isDefault: false,
        createdAt: Date.now()
    };
    
    // 添加到预设列表
    promptPresets.push(newPreset);
    
    // 保存设置
    saveSettings();
    
    // 刷新显示
    displayPromptPresets();
    
    // 隐藏表单
    hideNewPresetForm();
    
    showNotification(`预设"${name}"已创建`, 'success');
    console.log('✓ 新预设已保存:', newPreset);
}

// 显示预设列表
function displayPromptPresets() {
    if (!presetList) return;
    
    if (promptPresets.length === 0) {
        presetList.innerHTML = '<div class="empty-preset-list">暂无预设提示词</div>';
        return;
    }
    
    const presetsHTML = promptPresets.map(preset => `
        <div class="preset-item ${selectedPresetId === preset.id ? 'selected' : ''}" data-preset-id="${preset.id}">
            <div class="preset-item-header">
                <div class="preset-item-name">${preset.name}</div>
                <div class="preset-item-actions">
                    <button type="button" class="preset-use-btn" onclick="usePreset('${preset.id}')" title="使用此预设">
                        使用
                    </button>
                    ${!preset.isDefault ? `
                        <button type="button" class="preset-delete-btn" onclick="deletePreset('${preset.id}')" title="删除预设">
                            删除
                        </button>
                    ` : ''}
                </div>
            </div>
            <div class="preset-item-content">${preset.content}</div>
        </div>
    `).join('');
    
    presetList.innerHTML = presetsHTML;
    console.log(`✓ 已显示 ${promptPresets.length} 个预设`);
}

// 使用预设
function usePreset(presetId) {
    const preset = promptPresets.find(p => p.id === presetId);
    if (!preset) return;
    
    // 设置到文本框
    if (systemPromptTextarea) {
        systemPromptTextarea.value = preset.content;
    }
    
    // 更新选中状态
    selectedPresetId = presetId;
    
    // 刷新显示
    displayPromptPresets();
    
    showNotification(`已使用预设"${preset.name}"`, 'success');
    console.log('✓ 已使用预设:', preset);
}

// 编辑预设
function editPreset(presetId) {
    const preset = promptPresets.find(p => p.id === presetId);
    if (!preset || preset.isDefault) return;
    
    // 填充到表单
    if (presetNameInput && presetContentTextarea) {
        presetNameInput.value = preset.name;
        presetContentTextarea.value = preset.content;
    }
    
    // 显示表单
    showNewPresetForm();
    
    // 删除原预设（编辑模式）
    selectedPresetId = presetId;
    
    console.log('✓ 编辑预设:', preset);
}

// 删除预设
function deletePreset(presetId) {
    const preset = promptPresets.find(p => p.id === presetId);
    if (!preset || preset.isDefault) return;
    
    if (!confirm(`确定要删除预设"${preset.name}"吗？`)) return;
    
    // 从列表中移除
    promptPresets = promptPresets.filter(p => p.id !== presetId);
    
    // 清除选中状态
    if (selectedPresetId === presetId) {
        selectedPresetId = null;
    }
    
    // 保存设置
    saveSettings();
    
    // 刷新显示
    displayPromptPresets();
    
    showNotification(`预设"${preset.name}"已删除`, 'success');
    console.log('✓ 已删除预设:', preset);
}

// 生成预设ID
function generatePresetId() {
    return 'preset_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

// 加载默认预设
function loadDefaultPresets() {
    const defaultPresets = [
        {
            id: 'default_assistant',
            name: '友好助手',
            content: '你是一个友好、耐心、专业的AI助手。请用简洁明了的方式回答问题，在回答中体现出专业性和友好性。',
            isDefault: true,
            createdAt: Date.now()
        },
        {
            id: 'default_teacher',
            name: '知识导师',
            content: '你是一个博学的老师，善于用通俗易懂的方式解释复杂概念。请用教学的方式回答问题，必要时提供例子和类比。',
            isDefault: true,
            createdAt: Date.now()
        },
        {
            id: 'default_creative',
            name: '创意伙伴',
            content: '你是一个富有创意和想象力的伙伴。请用活泼、有趣的方式回答问题，可以使用比喻、故事或创新的角度。',
            isDefault: true,
            createdAt: Date.now()
        },
        {
            id: 'default_professional',
            name: '专业顾问',
            content: '你是一个严谨的专业顾问。请用正式、准确、专业的语调回答问题，提供详细的分析和建议。',
            isDefault: true,
            createdAt: Date.now()
        }
    ];
    
    // 如果没有预设，加载默认预设
    if (promptPresets.length === 0) {
        promptPresets = [...defaultPresets];
        console.log('✓ 已加载默认预设');
    } else {
        // 检查是否缺少默认预设，补充缺失的
        defaultPresets.forEach(defaultPreset => {
            if (!promptPresets.find(p => p.id === defaultPreset.id)) {
                promptPresets.push(defaultPreset);
            }
        });
        console.log('✓ 已检查并补充默认预设');
    }
}

// 暴露函数到全局
window.closePromptConfig = closePromptConfig;
window.usePreset = usePreset;
window.editPreset = editPreset;
window.deletePreset = deletePreset;

// 专门用于音色试听的函数，强制显示播放控件
async function testVoiceWithPlayer(text, voiceId) {
    try {
        // 构建请求数据
        let requestData = {
            text: text,
            mode: 'custom_list',
            voice_id: voiceId,
            api_key: DEFAULT_API_KEY,
            speed: 1.0
        };
        

        
        // 调用TTS API
        const response = await fetch('/api/tts', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestData)
        });
        
        if (response.ok) {
            // 检查响应类型
            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
                // JSON错误响应
                const result = await response.json();
                showNotification('语音合成失败: ' + (result.error || '未知错误'), 'error');
                return;
            }
            
            // 音频响应
            const audioBlob = await response.blob();
            const audioUrl = URL.createObjectURL(audioBlob);
            
            console.log('TTS音频生成成功，大小:', audioBlob.size, 'bytes');
            
            // 强制显示播放控件（不管在哪个模块）
            forceShowAudioPlayer(audioUrl, text);
            
        } else {
            const errorText = await response.text();
            console.error('TTS API调用失败:', response.status, '-', errorText);
            showNotification(`TTS API调用失败: ${response.status}`, 'error');
        }
        
    } catch (error) {
        console.error('试听音色时出错:', error);
        showNotification('试听失败: ' + error.message, 'error');
    }
}

// 强制显示音频播放器（不管在哪个模块）
function forceShowAudioPlayer(audioUrl, text) {
    try {
        const sidePlayer = document.getElementById('sideAudioPlayer');
        const audioPlayer = document.getElementById('ttsAudioPlayer');
        const audioSource = document.getElementById('ttsAudioSource');
        const playerText = document.getElementById('playerTextContent');
        const downloadBtn = document.getElementById('downloadAudio');
        
        if (!audioPlayer || !audioSource) {
            console.error('音频播放器元素未找到');
            showNotification('播放器初始化失败', 'error');
            return;
        }
        
        audioSource.src = audioUrl;
        audioPlayer.load();
        
        if (playerText) {
            playerText.textContent = `${text.substring(0, 80)}${text.length > 80 ? '...' : ''}`;
        }
        
        // 强制显示侧边播放器（不管在哪个模块）
        if (sidePlayer) {
            sidePlayer.classList.remove('hidden');
            sidePlayer.classList.add('show');
            console.log('✓ 强制显示侧边播放器');
        }
        
        // 设置下载功能
        if (downloadBtn) {
            downloadBtn.onclick = () => downloadAudio(audioUrl, 'voice_test');
        }
        
        // 播放音频
        audioPlayer.play().catch(error => {
            console.error('播放失败:', error);
            showNotification('播放失败，请重试', 'error');
        });
        
        console.log('✓ 音频播放设置完成');
        
    } catch (error) {
        console.error('forceShowAudioPlayer执行出错:', error);
        showNotification(`播放失败: ${error.message}`, 'error');
    }
}









// 初始化侧边播放器控制
function initializeSideAudioPlayer() {
    const playerToggle = document.getElementById('playerToggle');
    const sidePlayer = document.getElementById('sideAudioPlayer');
    const closePlayer = document.getElementById('closePlayer');
    const playPauseBtn = document.getElementById('playPauseBtn');
    const audioPlayer = document.getElementById('ttsAudioPlayer');
    const progressSlider = document.getElementById('progressSlider');
    const volumeBtn = document.getElementById('volumeBtn');
    const volumeSlider = document.getElementById('volumeSlider');
    
    // 切换播放器显示
    if (playerToggle && sidePlayer) {
        playerToggle.addEventListener('click', () => {
            sidePlayer.classList.toggle('show');
        });
    }
    
    // 关闭播放器
    if (closePlayer && sidePlayer) {
        closePlayer.addEventListener('click', () => {
            sidePlayer.classList.remove('show');
            if (audioPlayer) {
                audioPlayer.pause();
            }
        });
    }
    
    // 播放/暂停控制
    if (playPauseBtn && audioPlayer) {
        playPauseBtn.addEventListener('click', () => {
            if (audioPlayer.paused) {
                audioPlayer.play();
            } else {
                audioPlayer.pause();
            }
        });
        
        // 音频事件监听
        audioPlayer.addEventListener('play', () => {
            playPauseBtn.innerHTML = '<i class="fas fa-pause"></i>';
        });
        
        audioPlayer.addEventListener('pause', () => {
            playPauseBtn.innerHTML = '<i class="fas fa-play"></i>';
        });
        
        audioPlayer.addEventListener('ended', () => {
            playPauseBtn.innerHTML = '<i class="fas fa-play"></i>';
        });
    }
    
    // 进度控制
    if (progressSlider && audioPlayer) {
        audioPlayer.addEventListener('timeupdate', () => {
            if (audioPlayer.duration) {
                const progress = (audioPlayer.currentTime / audioPlayer.duration) * 100;
                progressSlider.value = progress;
                
                // 更新时间显示
                const currentTime = document.getElementById('currentTime');
                const totalTime = document.getElementById('totalTime');
                if (currentTime) currentTime.textContent = formatTime(audioPlayer.currentTime);
                if (totalTime) totalTime.textContent = formatTime(audioPlayer.duration);
            }
        });
        
        progressSlider.addEventListener('input', () => {
            if (audioPlayer.duration) {
                const time = (progressSlider.value / 100) * audioPlayer.duration;
                audioPlayer.currentTime = time;
            }
        });
    }
    
    // 音量控制
    if (volumeSlider && audioPlayer) {
        volumeSlider.addEventListener('input', () => {
            audioPlayer.volume = volumeSlider.value / 100;
            updateVolumeIcon();
        });
    }
    
    if (volumeBtn && audioPlayer) {
        volumeBtn.addEventListener('click', () => {
            audioPlayer.muted = !audioPlayer.muted;
            updateVolumeIcon();
        });
    }
    
    function updateVolumeIcon() {
        if (volumeBtn) {
            const icon = volumeBtn.querySelector('i');
            if (audioPlayer.muted || audioPlayer.volume === 0) {
                icon.className = 'fas fa-volume-mute';
            } else if (audioPlayer.volume < 0.5) {
                icon.className = 'fas fa-volume-down';
            } else {
                icon.className = 'fas fa-volume-up';
            }
        }
    }
    
    console.log('✓ 侧边播放器控制已初始化');
}

// 格式化时间显示
function formatTime(seconds) {
    if (isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}



// ========== TTS 相关函数 ==========

// 将文件转换为base64编码
function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            // 移除data:audio/...;base64,前缀，只保留base64数据
            const base64 = reader.result.split(',')[1];
            resolve(`data:${file.type};base64,${base64}`);
        };
        reader.onerror = () => reject(new Error('文件读取失败'));
        reader.readAsDataURL(file);
    });
}

// 处理临时音频上传
function handleTempAudioChange(event) {
    const file = event.target.files[0];
    if (file) {
        console.log('临时参考音频文件:', file.name, file.size, file.type);
        
        // 检查文件类型
        if (!file.type.startsWith('audio/')) {
            showNotification('请选择音频文件', 'error');
            return;
        }
        
        // 显示音频预览
        const url = URL.createObjectURL(file);
        const audioElement = tempAudioPreview.querySelector('audio');
        
        // 清除之前的事件监听器
        audioElement.removeEventListener('loadedmetadata', arguments.callee.loadHandler);
        audioElement.removeEventListener('error', arguments.callee.errorHandler);
        
        // 设置新的事件监听器
        arguments.callee.loadHandler = function() {
            console.log('临时音频加载成功，时长:', audioElement.duration);
        };
        
        arguments.callee.errorHandler = function(e) {
            console.error('临时音频加载失败:', e);
            showNotification('音频文件加载失败', 'error');
        };
        
        audioElement.addEventListener('loadedmetadata', arguments.callee.loadHandler);
        audioElement.addEventListener('error', arguments.callee.errorHandler);
        
        audioElement.src = url;
        audioElement.load(); // 重新加载音频
        
        // 应用更好的样式
        audioElement.classList.add('custom-audio-style');
        
        tempAudioPreview.classList.remove('hidden');
        
        showNotification('参考音频已上传，可以预览');
        saveSettings();
    }
}

// 处理新音色音频上传
function handleNewVoiceAudioChange(event) {
    const file = event.target.files[0];
    if (file) {
        console.log('新音色音频文件:', file.name, file.size, file.type);
        
        // 检查文件类型
        if (!file.type.startsWith('audio/')) {
            showNotification('请选择音频文件', 'error');
            return;
        }
        
        // 显示音频预览
        const url = URL.createObjectURL(file);
        const audioElement = newVoiceAudioPreview.querySelector('audio');
        
        // 清除之前的事件监听器
        audioElement.removeEventListener('loadedmetadata', arguments.callee.loadHandler);
        audioElement.removeEventListener('error', arguments.callee.errorHandler);
        
        // 设置新的事件监听器
        arguments.callee.loadHandler = function() {
            console.log('新音色音频加载成功，时长:', audioElement.duration);
        };
        
        arguments.callee.errorHandler = function(e) {
            console.error('新音色音频加载失败:', e);
            showNotification('音频文件加载失败', 'error');
        };
        
        audioElement.addEventListener('loadedmetadata', arguments.callee.loadHandler);
        audioElement.addEventListener('error', arguments.callee.errorHandler);
        
        audioElement.src = url;
        audioElement.load(); // 重新加载音频
        
        // 应用更好的样式
        audioElement.classList.add('custom-audio-style');
        
        newVoiceAudioPreview.classList.remove('hidden');
        
        showNotification('音色音频已上传，可以预览');
    }
}

// 显示新音色创建表单
function showNewVoiceForm() {
    newVoiceForm.classList.remove('hidden');
    newVoiceNameInput.focus();
}

// 隐藏新音色创建表单
function hideNewVoiceForm() {
    newVoiceForm.classList.add('hidden');
    
    // 清空表单
    newVoiceNameInput.value = '';
    newVoiceAudioInput.value = '';
    newVoiceTextInput.value = '';
    newVoiceAudioPreview.classList.add('hidden');
}

// 保存新音色
async function saveNewVoice() {
    const name = newVoiceNameInput.value.trim();
    const referenceText = newVoiceTextInput.value.trim();
    const audioFile = newVoiceAudioInput.files[0];
    
    if (!name) {
        showNotification('请输入音色名称', 'error');
        return;
    }
    
    // 音色名称长度检查
    if (name.length > 32) {
        showNotification('音色名称不能超过32个字符', 'error');
        return;
    }
    
    if (!referenceText) {
        showNotification('请输入参考文本', 'error');
        return;
    }
    
    if (!audioFile) {
        showNotification('请上传参考音频', 'error');
        return;
    }
    
    try {
        // 获取API密钥
        let apiKey = DEFAULT_API_KEY;
        if (ttsApiKeyTypeSelect.value === 'custom') {
            apiKey = customTtsApiKeyInput.value.trim();
            if (!apiKey) {
                showNotification('请输入TTS API密钥', 'error');
                return;
            }
        }
        
        // 将音频文件转换为base64
        let audioBase64;
        try {
            audioBase64 = await fileToBase64(audioFile);
        } catch (error) {
            showNotification('音频文件处理失败: ' + error.message, 'error');
            return;
        }
        
        // 创建音色
        const response = await fetch('/api/voices', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                name: name,
                reference_text: referenceText,
                reference_audio: audioBase64,
                api_key: apiKey
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            customVoices.push(result.voice);
            displayCustomVoices();
            hideNewVoiceForm();
            
            // 立即保存到本地存储
            saveSettings();
            
            showNotification(result.message, 'success');
        } else {
            showNotification(result.error || '创建音色失败', 'error');
        }
        
    } catch (error) {
        console.error('保存音色失败:', error);
        showNotification('保存音色失败，请稍后重试', 'error');
    }
}

// ============ 模态窗口音色创建函数 ============

// 显示创建音色模态窗口
function showCreateVoiceModal() {
    try {
        console.log('显示创建音色模态窗口...');
        
        const modal = document.getElementById('createVoiceModal');
        const nameInput = document.getElementById('voiceName');
        const audioInput = document.getElementById('voiceAudioFile');
        const textInput = document.getElementById('voiceReferenceText');
        const audioPreview = document.getElementById('voiceAudioPreview');
        
        console.log('模态窗口元素检查:', {
            modal: !!modal,
            nameInput: !!nameInput,
            audioInput: !!audioInput,
            textInput: !!textInput,
            audioPreview: !!audioPreview
        });
        
        if (!modal) {
            console.error('创建音色模态窗口未找到');
            showNotification('模态窗口加载失败', 'error');
            return;
        }
        
        // 清空表单
        if (nameInput) nameInput.value = '';
        if (audioInput) audioInput.value = '';
        if (textInput) textInput.value = '';
        if (audioPreview) audioPreview.classList.add('hidden');
        
        // 显示模态窗口
        modal.classList.remove('hidden');
        modal.classList.add('show');
        
        // 聚焦到名称输入框
        setTimeout(() => {
            if (nameInput) nameInput.focus();
        }, 100);
        
        console.log('✓ 创建音色模态窗口已显示');
        
    } catch (error) {
        console.error('显示创建音色模态窗口时出错:', error);
        showNotification(`模态窗口显示失败: ${error.message}`, 'error');
    }
}

// 隐藏创建音色模态窗口
function hideCreateVoiceModal() {
    const modal = document.getElementById('createVoiceModal');
    if (modal) {
        modal.classList.remove('show');
        setTimeout(() => {
            modal.classList.add('hidden');
        }, 300);
    }
    
    // 清空表单
    const nameInput = document.getElementById('voiceName');
    const audioInput = document.getElementById('voiceAudioFile');
    const textInput = document.getElementById('voiceReferenceText');
    const audioPreview = document.getElementById('voiceAudioPreview');
    
    if (nameInput) nameInput.value = '';
    if (audioInput) audioInput.value = '';
    if (textInput) textInput.value = '';
    if (audioPreview) audioPreview.classList.add('hidden');
}

// 从模态窗口保存新音色
async function saveNewVoiceFromModal() {
    console.log('开始保存新音色...');
    
    const nameInput = document.getElementById('voiceName');
    const textInput = document.getElementById('voiceReferenceText');
    const audioInput = document.getElementById('voiceAudioFile');
    
    if (!nameInput || !textInput || !audioInput) {
        console.error('模态窗口输入元素未找到');
        showNotification('表单元素加载失败', 'error');
        return;
    }
    
    const name = nameInput.value.trim();
    const referenceText = textInput.value.trim();
    const audioFile = audioInput.files[0];
    
    if (!name) {
        showNotification('请输入音色名称', 'error');
        return;
    }
    
    // 音色名称长度检查
    if (name.length > 32) {
        showNotification('音色名称不能超过32个字符', 'error');
        return;
    }
    
    if (!referenceText) {
        showNotification('请输入参考文本', 'error');
        return;
    }
    
    if (!audioFile) {
        showNotification('请上传参考音频', 'error');
        return;
    }
    
    try {
        // 获取API密钥
        let apiKey = DEFAULT_API_KEY;
        if (ttsApiKeyTypeSelect.value === 'custom') {
            apiKey = customTtsApiKeyInput.value.trim();
            if (!apiKey) {
                showNotification('请输入TTS API密钥', 'error');
                return;
            }
        }
        
        // 转换音频为base64
        const audioBase64 = await fileToBase64(audioFile);
        
        const requestData = {
            name: name,
            reference_text: referenceText,
            reference_audio: audioBase64,
            api_key: apiKey
        };
        
        const response = await fetch('/api/voices', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestData)
        });
        
        const result = await response.json();
        
        if (result.success) {
            customVoices.push(result.voice);
            displayCustomVoices(); // 更新AI对话模块的音色列表
            displaySynthesisVoiceCards(); // 更新手动合成模块的音色列表
            loadCustomVoicesForManagement(); // 更新音色管理模块的音色列表
            hideCreateVoiceModal();
            
            // 立即保存到本地存储
            saveSettings();
            
            showNotification(result.message, 'success');
        } else {
            showNotification(result.error || '创建音色失败', 'error');
        }
        
    } catch (error) {
        console.error('保存音色失败:', error);
        showNotification('保存音色失败，请稍后重试', 'error');
    }
}

// 处理模态窗口音频文件变更
function handleModalAudioChange(event) {
    const file = event.target.files[0];
    const audioInput = document.getElementById('voiceAudioFile');
    const audioPreview = document.getElementById('voiceAudioPreview');
    const audioSource = document.getElementById('voiceAudioSource');
    
    if (file) {
        // 验证文件类型
        if (!file.type.startsWith('audio/')) {
            showNotification('请选择音频文件', 'error');
            if (audioInput) audioInput.value = '';
            return;
        }
        
        // 验证文件大小 (限制为10MB)
        if (file.size > 10 * 1024 * 1024) {
            showNotification('音频文件大小不能超过10MB', 'error');
            if (audioInput) audioInput.value = '';
            return;
        }
        
        if (audioPreview && audioSource) {
            const audioElement = audioPreview.querySelector('audio');
            if (audioElement) {
                const url = URL.createObjectURL(file);
                audioSource.src = url;
                audioElement.load();
                
                audioElement.addEventListener('loadedmetadata', function() {
                    audioPreview.classList.remove('hidden');
                    
                    // 验证音频时长（建议8-10秒，最大30秒）
                    if (audioElement.duration > 30) {
                        showNotification('参考音频时长建议在30秒以内', 'warning');
                    }
                });
                
                audioElement.addEventListener('error', function() {
                    showNotification('音频文件无法播放，请检查文件格式', 'error');
                    if (audioInput) audioInput.value = '';
                    audioPreview.classList.add('hidden');
                });
            }
        }
    } else {
        if (audioPreview) audioPreview.classList.add('hidden');
    }
}

// 加载自定义音色列表
async function loadCustomVoices() {
    try {
        console.log('开始加载自定义音色列表...');
        const response = await fetch('/api/voices');
        const result = await response.json();
        
        if (result.success) {
            const backendVoices = result.voices || [];
            console.log('后端返回音色数量:', backendVoices.length);
            
            // 始终以后端数据为准
            customVoices = backendVoices;
            console.log('已同步后端音色数据');
            
            // 清理选中的音色如果它已不存在
            if (selectedVoiceId && !customVoices.find(v => v.id === selectedVoiceId)) {
                console.log('清理不存在的selectedVoiceId:', selectedVoiceId);
                selectedVoiceId = null;
            }
            if (selectedSynthesisVoiceId && !customVoices.find(v => v.id === selectedSynthesisVoiceId)) {
                console.log('清理不存在的selectedSynthesisVoiceId:', selectedSynthesisVoiceId);
                selectedSynthesisVoiceId = null;
            }
            
            // 立即保存更新后的设置
            saveSettings();
            
            // 刷新显示
            if (ttsModeSelect.value === 'custom_list') {
                displayCustomVoices();
            }
            displaySynthesisVoiceCards(); // 更新手动合成模块
            
            // 同时更新音色管理模块
            loadCustomVoicesForManagement();
            
        } else {
            console.error('加载音色失败:', result.error);
        }
    } catch (error) {
        console.error('加载音色列表失败:', error);
        // 网络错误时，继续使用本地缓存的数据
        if (customVoices.length > 0) {
            console.log('网络错误，使用本地缓存的音色数据');
            displayCustomVoices();
        }
    }
}

// 显示自定义音色列表
function displayCustomVoices() {
    console.log('显示自定义音色列表，当前selectedVoiceId:', selectedVoiceId);
    console.log('customVoices数量:', customVoices.length);
    
    if (customVoices.length === 0) {
        voiceCardsList.innerHTML = `
            <div class="empty-voice-list">
                <i class="fas fa-microphone"></i>
                <h4>暂无自定义音色</h4>
                <p>可以点击上方"音色管理"来添加您的第一个自定义音色</p>
            </div>
        `;
        return;
    }
    
    voiceCardsList.innerHTML = customVoices.map(voice => {
        const isSelected = selectedVoiceId === voice.id;
        console.log(`音色 ${voice.name} (${voice.id}) 是否选中:`, isSelected);
        
        return `
            <div class="voice-card ${isSelected ? 'selected' : ''}" 
                 data-voice-id="${voice.id}" onclick="window.selectVoice('${voice.id}')">
                <div class="voice-card-info">
                    <div class="voice-card-name">${voice.name}</div>
                    <div class="voice-card-meta">
                        创建于 ${new Date(voice.created_at * 1000).toLocaleDateString()}
                    </div>
                </div>
                <div class="voice-card-actions">
                    <button class="voice-card-btn" onclick="window.testVoice('${voice.id}'); event.stopPropagation();" 
                            title="测试音色" aria-label="测试音色">
                        <i class="fas fa-play"></i>
                    </button>
                    <button class="voice-card-btn delete" onclick="window.deleteVoice('${voice.id}'); event.stopPropagation();" 
                            title="删除音色" aria-label="删除音色">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `;
    }).join('');
    
    console.log('音色列表HTML已更新');
}

// 选择音色
function selectVoice(voiceId) {
    console.log('=== selectVoice被调用 ===');

    console.log('选择前selectedVoiceId:', selectedVoiceId);
    console.log('当前customVoices:', customVoices);
    
    selectedVoiceId = voiceId;
    console.log('选择后selectedVoiceId:', selectedVoiceId);
    
    // 强制刷新显示
    displayCustomVoices();
    
    // 立即保存选择状态
    saveSettings();
    
    // 查找音色名称用于通知
    const voice = customVoices.find(v => v.id === voiceId);
    const voiceName = voice ? voice.name : voiceId;
    showNotification(`已选择音色: ${voiceName}`, 'success');
    
    console.log('音色选择完成，页面已更新');
    console.log('=== selectVoice完成 ===');
}

// 确保函数在全局作用域中可用
window.selectVoice = selectVoice;

// 测试音色（AI对话模块）
async function testVoice(voiceId) {
    console.log('AI对话模块 - 测试音色:', voiceId);
    
    const voice = customVoices.find(v => v.id === voiceId);
    if (!voice) {
        console.error('音色数据未找到:', voiceId);
        showNotification('音色数据未找到', 'error');
        return;
    }
    
    showNotification(`正在试听音色: ${voice.name}`, 'info');
    
    // 使用参考文本进行测试
    const testText = voice.reference_text || '这是一个音色测试，您好！';
    try {
        await playTTS(testText, 'custom_list', voiceId);
    } catch (error) {
        console.error('AI对话模块音色试听失败:', error);
        showNotification('音色试听失败', 'error');
    }
}

// 确保testVoice在全局作用域中可用
window.testVoice = testVoice;

// 删除音色
async function deleteVoice(voiceId) {
    const voice = customVoices.find(v => v.id === voiceId);
    if (!voice) return;
    
    if (!confirm(`确定要删除音色"${voice.name}"吗？`)) return;
    
    try {
        const response = await fetch(`/api/voices/${voiceId}`, {
            method: 'DELETE'
        });
        
        const result = await response.json();
        
        if (result.success) {
            customVoices = customVoices.filter(v => v.id !== voiceId);
            if (selectedVoiceId === voiceId) {
                selectedVoiceId = null;
            }
            if (selectedSynthesisVoiceId === voiceId) {
                selectedSynthesisVoiceId = null;
            }
            displayCustomVoices();
            displaySynthesisVoiceCards();
            loadCustomVoicesForManagement(); // 更新音色管理模块
            saveSettings(); // 保存设置
            showNotification(result.message, 'success');
        } else {
            showNotification(result.error || '删除音色失败', 'error');
        }
        
    } catch (error) {
        console.error('删除音色失败:', error);
        showNotification('删除音色失败，请稍后重试', 'error');
    }
}

// 确保deleteVoice在全局作用域中可用
window.deleteVoice = deleteVoice;

// 更新播放TTS语音函数
async function playTTS(text, mode = null, voiceId = null) {
    try {
        showNotification('正在合成，请稍后…', 'info');
        // 获取TTS设置
        const ttsMode = mode || ttsModeSelect.value;
        let voice_id = voiceId;
        
        if (!voice_id) {
            switch (ttsMode) {
                case 'builtin':
                    voice_id = builtinVoiceSelect.value;
                    break;
                case 'custom_list':
                    voice_id = selectedVoiceId;
                    break;
                case 'temp_custom':
                    voice_id = 'temp_custom';
                    break;
                default:
                    voice_id = 'alex';
            }
        }
        
        // 检查custom_list模式下是否有选中的音色
        
        if (ttsMode === 'custom_list' && !voice_id) {
            showNotification('请先选择一个自定义音色', 'error');
            console.error('custom_list模式下未选择音色，selectedVoiceId:', selectedVoiceId);
            console.error('当前customVoices:', customVoices);
            return;
        }
        
        // 获取API密钥（使用手动合成模块的密钥选择）
        let apiKey = DEFAULT_API_KEY;
        const synthesisApiKeyTypeSelect = document.getElementById('synthesisApiKeyType');
        const synthesisCustomApiKeyInput = document.getElementById('synthesisCustomApiKey');
        
        if (synthesisApiKeyTypeSelect && synthesisApiKeyTypeSelect.value === 'custom') {
            if (synthesisCustomApiKeyInput && synthesisCustomApiKeyInput.value.trim()) {
                apiKey = synthesisCustomApiKeyInput.value.trim();
            } else {
                showNotification('请输入手动合成的API密钥', 'error');
                return;
            }
        }
        
        // 智能情感检测/手动提示词
        let finalText = text;
        const autoEmotionCheckbox = document.getElementById('autoEmotionDetection');
        if (autoEmotionCheckbox && autoEmotionCheckbox.checked) {
            // 自动情感识别：不在前端改写文本，交给后处理模型生成 描述<|endofprompt|>正文
        } else {
            const manualPromptTextarea = document.getElementById('emotionPromptText');
            if (manualPromptTextarea && manualPromptTextarea.value.trim()) {
                finalText = manualPromptTextarea.value.trim() + '<|endofprompt|>' + text;
                console.log('使用手动情感提示词:', manualPromptTextarea.value.trim());
            }
        }

        // 可选：调用后处理模型，生成 情感<|endofprompt|>正文
        const enablePostProcessEl = document.getElementById('autoEmotionDetection');
        if (enablePostProcessEl && enablePostProcessEl.checked) { // 自动情感识别 = 开启后处理
            try {
                // 尝试从上下文推断方言（简单示例：从用户最近一条消息关键词）
                let dialect = null;
                const lastUser = [...conversationHistory].reverse().find(x => x.role === 'user');
                const hint = lastUser ? lastUser.content : '';
                if (/粤语|广东话/i.test(hint)) dialect = '粤语';
                else if (/四川话|川话/i.test(hint)) dialect = '四川话';
                else if (/天津话/i.test(hint)) dialect = '天津话';
                else if (/武汉话/i.test(hint)) dialect = '武汉话';
                else if (/上海话|沪语/i.test(hint)) dialect = '上海话';

                // 使用AI对话的密钥选择（与左侧设置保持一致）
                let processingApiKey = DEFAULT_API_KEY;
                if (typeof apiKeyTypeSelect !== 'undefined' && apiKeyTypeSelect && apiKeyTypeSelect.value === 'custom') {
                    if (typeof customApiKeyInput !== 'undefined' && customApiKeyInput) {
                        processingApiKey = (customApiKeyInput.value || '').trim() || DEFAULT_API_KEY;
                    }
                }

                const ppResp = await fetch('/api/tts-postprocess', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ text: finalText, api_key: processingApiKey, dialect, history: conversationHistory.slice(-8) })
                });
                if (ppResp.ok) {
                    const ppJson = await ppResp.json();
                    if (ppJson.processed_text) {
                        finalText = ppJson.processed_text;
                        console.log('后处理结果:', finalText.substring(0, 120));
                    }
                } else {
                    console.warn('后处理失败，继续使用原文本');
                }
            } catch (e) {
                console.warn('后处理异常，已跳过:', e);
            }
        }

        // 构建请求数据
        let requestData = {
            text: finalText,
            mode: ttsMode,
            voice_id: voice_id,
            api_key: apiKey,
            speed: parseFloat(ttsSpeedSlider.value)
        };
        
        // 对于临时自定义音色，添加参考音频和文本
        if (ttsMode === 'temp_custom') {
            const referenceText = tempReferenceTextInput.value.trim();
            const referenceAudioFile = tempReferenceAudioInput.files[0];
            
            if (!referenceText) {
                showNotification('请输入参考文本', 'error');
                return;
            }
            
            if (!referenceAudioFile) {
                showNotification('请上传参考音频', 'error');
                return;
            }
            
            // 将音频文件转换为base64
            try {
                const audioBase64 = await fileToBase64(referenceAudioFile);
                requestData.reference_text = referenceText;
                requestData.reference_audio = audioBase64;
            } catch (error) {
                showNotification('音频文件处理失败: ' + error.message, 'error');
                return;
            }
        }
        

        
        // 调用TTS API
        const response = await fetch('/api/tts', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestData)
        });
        
        if (response.ok) {
            // 检查响应类型
            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
                // JSON错误响应
                const result = await response.json();
                throw new Error(result.error || '语音合成失败');
            } else {
                // 音频数据响应
                const audioBlob = await response.blob();
                const audioUrl = URL.createObjectURL(audioBlob);
                
                // 使用新的播放器函数
                playAudioFromUrl(audioUrl, finalText);
                showNotification('语音播放开始', 'success');
            }
        } else {
            // HTTP错误
            let errorMessage = '语音合成失败';
            try {
                const errorResult = await response.json();
                errorMessage = errorResult.error || errorMessage;
            } catch (e) {
                errorMessage = `HTTP ${response.status}: ${response.statusText}`;
            }
            throw new Error(errorMessage);
        }
        
    } catch (error) {
        console.error('TTS播放失败:', error);
        showNotification(`语音播放失败: ${error.message}`, 'error');
    }
}

// ========== 音频播放控件函数 ==========

// 切换播放/暂停
function toggleTTSPlayback() {
    if (ttsAudioPlayer.paused) {
        ttsAudioPlayer.play();
    } else {
        ttsAudioPlayer.pause();
    }
}

// 音频进度控制
function seekTTSAudio() {
    const seekTime = (progressSlider.value / 100) * ttsAudioPlayer.duration;
    ttsAudioPlayer.currentTime = seekTime;
}

// 切换静音
function toggleMute() {
    ttsAudioPlayer.muted = !ttsAudioPlayer.muted;
    updateVolumeButton();
}

// 调整音量
function adjustVolume() {
    ttsAudioPlayer.volume = volumeSlider.value / 100;
    updateVolumeButton();
}

// 更新音量按钮图标
function updateVolumeButton() {
    const volume = ttsAudioPlayer.volume;
    const isMuted = ttsAudioPlayer.muted;
    
    let icon = 'fas fa-volume-up';
    if (isMuted || volume === 0) {
        icon = 'fas fa-volume-mute';
    } else if (volume < 0.5) {
        icon = 'fas fa-volume-down';
    }
    
    volumeBtn.innerHTML = `<i class="${icon}"></i>`;
}

// 格式化时间显示
function formatTime(seconds) {
    if (isNaN(seconds)) return '0:00';
    
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

// 音频事件监听器
if (ttsAudioPlayer) {
    ttsAudioPlayer.addEventListener('loadedmetadata', () => {
        totalTimeSpan.textContent = formatTime(ttsAudioPlayer.duration);
        progressSlider.max = 100;
    });
    
    ttsAudioPlayer.addEventListener('timeupdate', () => {
        if (ttsAudioPlayer.duration) {
            const progress = (ttsAudioPlayer.currentTime / ttsAudioPlayer.duration) * 100;
            progressSlider.value = progress;
            currentTimeSpan.textContent = formatTime(ttsAudioPlayer.currentTime);
        }
    });
    
    ttsAudioPlayer.addEventListener('play', () => {
        playPauseBtn.innerHTML = '<i class="fas fa-pause"></i>';
        playPauseBtn.classList.add('playing');
    });
    
    ttsAudioPlayer.addEventListener('pause', () => {
        playPauseBtn.innerHTML = '<i class="fas fa-play"></i>';
        playPauseBtn.classList.remove('playing');
    });
    
    ttsAudioPlayer.addEventListener('ended', () => {
        playPauseBtn.innerHTML = '<i class="fas fa-play"></i>';
        playPauseBtn.classList.remove('playing');
        progressSlider.value = 0;
        currentTimeSpan.textContent = '0:00';
    });
    
    ttsAudioPlayer.addEventListener('error', (e) => {
        console.error('音频播放错误:', e);
        showNotification('音频播放出错', 'error');
    });
}

// 页面卸载时停止录音
window.addEventListener('beforeunload', () => {
    if (isRecording) {
        stopRecording();
    }
});

// ============ 新功能模块 ============

// 初始化功能标签页
function initializeFunctionTabs() {
    const functionTabs = document.querySelectorAll('.function-tab');
    const functionContents = document.querySelectorAll('.function-content');
    
    functionTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            // 移除所有活动状态
            functionTabs.forEach(t => t.classList.remove('active'));
            functionContents.forEach(c => c.classList.remove('active'));
            
            // 激活点击的标签页
            tab.classList.add('active');
            const targetFunction = tab.dataset.function;
            currentFunction = targetFunction;
            
            // 显示对应内容
            const targetContent = document.getElementById(targetFunction === 'ai-chat' ? 'aiChatFunction' : 
                                                        targetFunction === 'manual-synthesis' ? 'manualSynthesisFunction' : 
                                                        'voiceManagementFunction');
            if (targetContent) {
                targetContent.classList.add('active');
            }
            
            // 更新侧边栏动态设置
            updateDynamicSettings(targetFunction);
        });
    });
}

// 更新动态设置区域
function updateDynamicSettings(functionType) {
    // 根据功能类型显示不同的设置
    console.log('切换到功能:', functionType);
    // 这里可以根据需要显示/隐藏不同的设置项
}

// 初始化情感控制
function initializeEmotionControl() {
    const emotionTags = document.querySelectorAll('.emotion-tag');
    const smartEmotionCheckbox = document.getElementById('smartEmotion');
    
    emotionTags.forEach(tag => {
        tag.addEventListener('click', () => {
            // 移除所有活动状态
            emotionTags.forEach(t => t.classList.remove('active'));
            
            // 激活点击的情感标签
            tag.classList.add('active');
            currentEmotion = tag.dataset.emotion;
            
            // 更新情感预览
            updateEmotionPreview();
            
            console.log('选择情感:', currentEmotion);
        });
    });
    
    if (smartEmotionCheckbox) {
        smartEmotionCheckbox.addEventListener('change', () => {
            console.log('智能情感分析:', smartEmotionCheckbox.checked);
        });
    }
}

// 更新情感预览
function updateEmotionPreview() {
    const previewText = document.getElementById('previewText');
    const synthesisText = document.getElementById('synthesisText');
    
    if (previewText && synthesisText) {
        const text = synthesisText.value.trim();
        const emotionPrefix = getEmotionPrefix(currentEmotion);
        
        const prefixElement = previewText.querySelector('.emotion-prefix');
        const contentElement = previewText.querySelector('.preview-content');
        
        if (prefixElement && contentElement) {
            prefixElement.textContent = emotionPrefix;
            contentElement.textContent = text || '在这里预览带情感的文本...';
        }
    }
}

// 获取情感提示词前缀
function getEmotionPrefix(emotion) {
    const emotionPrefixes = {
        'neutral': '',
        'happy': '你能用开心的情感说吗？<|endofprompt|>',
        'excited': '你能用兴奋的情感说吗？<|endofprompt|>',
        'sad': '你能用悲伤的情感说吗？<|endofprompt|>',
        'angry': '你能用愤怒的情感说吗？<|endofprompt|>',
        'surprised': '你能用惊讶的情感说吗？<|endofprompt|>',
        'gentle': '你能用温和的情感说吗？<|endofprompt|>',
        'enthusiastic': '你能用热情的情感说吗？<|endofprompt|>'
    };
    return emotionPrefixes[emotion] || '';
}





// 客户端情感检测函数
function detectEmotionFromText(text) {
    // 情感关键词字典
    const emotionKeywords = {
        'happy': ['开心', '高兴', '快乐', '喜悦', '兴高采烈', '哈哈', '笑', '太好了', '棒', '不错'],
        'excited': ['兴奋', '激动', '振奋', '惊喜', '太棒了', '厉害', '牛', '赞'],
        'sad': ['难过', '悲伤', '沮丧', '失落', '痛苦', '哭', '眼泪', '可惜', '遗憾'],
        'angry': ['愤怒', '生气', '恼火', '气愤', '怒', '讨厌', '烦', '可恶'],
        'surprised': ['惊讶', '震惊', '意外', '没想到', '天哪', '哇', '不会吧', '真的'],
        'gentle': ['温和', '柔和', '轻柔', '温暖', '慈祥', '和蔼'],
        'calm': ['平静', '冷静', '安静', '淡定', '沉着', '稳重'],
        'enthusiastic': ['热情', '热烈', '积极', '充满活力', '精神']
    };
    
    const textLower = text.toLowerCase();
    const emotionScores = {};
    
    for (const emotion in emotionKeywords) {
        let score = 0;
        emotionKeywords[emotion].forEach(keyword => {
            if (textLower.includes(keyword)) {
                score += 1;
            }
        });
        emotionScores[emotion] = score;
    }
    
    // 返回得分最高的情感，如果没有匹配则返回中性
    const maxScore = Math.max(...Object.values(emotionScores));
    if (maxScore > 0) {
        return Object.keys(emotionScores).find(emotion => emotionScores[emotion] === maxScore);
    }
    return 'neutral';
}

// 客户端情感应用函数
function applyEmotionToText(text, emotion) {
    const emotionPrompts = {
        'neutral': '',
        'happy': '你能用开心的情感说吗？<|endofprompt|>',
        'excited': '你能用兴奋的情感说吗？<|endofprompt|>',
        'sad': '你能用悲伤的情感说吗？<|endofprompt|>',
        'angry': '你能用愤怒的情感说吗？<|endofprompt|>',
        'surprised': '你能用惊讶的情感说吗？<|endofprompt|>',
        'gentle': '你能用温和的情感说吗？<|endofprompt|>',
        'enthusiastic': '你能用热情的情感说吗？<|endofprompt|>',
        'calm': '你能用平静的情感说吗？<|endofprompt|>'
    };
    
    const prompt = emotionPrompts[emotion] || '';
    return prompt ? prompt + text : text;
}

// ============ 新架构核心函数 ============

// 初始化新架构
function initializeNewArchitecture() {
    console.log('初始化新架构...');
    
    // 等待DOM完全加载
    setTimeout(() => {
        console.log('DOM加载完成，开始初始化模块...');
        
        // 初始化模块切换 - 最重要，优先执行
        initializeModuleSwitching();
        
        // 初始化TTS条件显示
        initializeTTSConditionalDisplay();
        
        // 初始化情感控制
        initializeEmotionControl();
        

        
        // 初始化音色管理
        initializeVoiceManagement();
        
        console.log('新架构初始化完成');
    }, 50);
}

// 初始化模块切换
function initializeModuleSwitching() {
    console.log('初始化模块切换系统...');
    
    const navTabs = document.querySelectorAll('.nav-tab');
    const moduleContents = document.querySelectorAll('.module-content');
    
    console.log('找到导航标签:', navTabs.length);
    console.log('找到模块内容:', moduleContents.length);
    
    // 立即设置初始状态
    const activeTab = document.querySelector('.nav-tab.active');
    if (activeTab) {
        const targetModule = activeTab.dataset.module;
        console.log('初始活动模块:', targetModule);
        showModule(targetModule);
    } else {
        // 如果没有活动标签，默认显示第一个
        if (navTabs.length > 0) {
            navTabs[0].classList.add('active');
            const targetModule = navTabs[0].dataset.module;
            console.log('默认显示第一个模块:', targetModule);
            showModule(targetModule);
        }
    }
    
    // 添加点击事件监听器
    navTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            console.log('点击标签:', tab.dataset.module);
            
            // 移除所有活动状态
            navTabs.forEach(t => t.classList.remove('active'));
            
            // 激活点击的标签
            tab.classList.add('active');
            const targetModule = tab.dataset.module;
            
            // 显示对应模块
            showModule(targetModule);
        });
    });
}

// 显示指定模块
function showModule(moduleName) {
    console.log('准备显示模块:', moduleName);
    
    const moduleContents = document.querySelectorAll('.module-content');
    console.log('找到模块数量:', moduleContents.length);
    
    // 隐藏所有模块
    moduleContents.forEach(m => {
        m.classList.remove('active');
        m.style.display = 'none';
    });
    
    // 显示目标模块
    const targetContent = document.getElementById(moduleName + 'Module');
    console.log('目标模块:', targetContent);
    
    if (targetContent) {
        targetContent.style.display = 'flex';
        targetContent.classList.add('active');
        console.log('模块已显示:', moduleName);
    } else {
        console.error('未找到模块:', moduleName + 'Module');
    }
}

// 初始化TTS条件显示
function initializeTTSConditionalDisplay() {
    const enableTTSCheckbox = document.getElementById('enableTTS');
    const ttsSettings = document.getElementById('ttsSettings');
    const autoEmotionCheckbox = document.getElementById('autoEmotionDetection');
    const emotionHint = document.getElementById('emotionHint');
    const manualEmotionPrompt = document.getElementById('manualEmotionPrompt');
    
    if (enableTTSCheckbox && ttsSettings) {
        // TTS开关控制相关设置显示
        function toggleTTSSettings() {
            if (enableTTSCheckbox.checked) {
                ttsSettings.classList.remove('hidden');
                ttsSettings.style.display = 'block';
            } else {
                ttsSettings.classList.add('hidden');
                ttsSettings.style.display = 'none';
            }
        }
        
        enableTTSCheckbox.addEventListener('change', toggleTTSSettings);
        toggleTTSSettings(); // 初始化状态
    }
    
    if (autoEmotionCheckbox && emotionHint && manualEmotionPrompt) {
        // 自动情感识别开关控制
        function toggleEmotionMode() {
            if (autoEmotionCheckbox.checked) {
                emotionHint.classList.remove('hidden');
                emotionHint.style.display = 'block';
                manualEmotionPrompt.classList.add('hidden');
                manualEmotionPrompt.style.display = 'none';
            } else {
                emotionHint.classList.add('hidden');
                emotionHint.style.display = 'none';
                manualEmotionPrompt.classList.remove('hidden');
                manualEmotionPrompt.style.display = 'block';
            }
        }
        
        autoEmotionCheckbox.addEventListener('change', toggleEmotionMode);
        toggleEmotionMode(); // 初始化状态
    }
    
    // 重新初始化TTS模式切换
    initializeTTSModeToggle();
}

// 初始化TTS模式切换
function initializeTTSModeToggle() {
    const ttsModeSelect = document.getElementById('ttsMode');
    const builtinSection = document.getElementById('builtinVoiceSection');
    const tempCustomSection = document.getElementById('tempCustomVoiceSection');
    const customListSection = document.getElementById('customVoiceListSection');
    
    if (ttsModeSelect) {
        function updateTTSModeDisplay() {
            const mode = ttsModeSelect.value;
            
            // 隐藏所有选项
            if (builtinSection) {
                builtinSection.style.display = 'none';
                builtinSection.classList.add('hidden');
            }
            if (tempCustomSection) {
                tempCustomSection.style.display = 'none';
                tempCustomSection.classList.add('hidden');
            }
            if (customListSection) {
                customListSection.style.display = 'none';
                customListSection.classList.add('hidden');
            }
            
            // 显示对应选项
            if (mode === 'builtin' && builtinSection) {
                builtinSection.style.display = 'block';
                builtinSection.classList.remove('hidden');
            } else if (mode === 'temp_custom' && tempCustomSection) {
                tempCustomSection.style.display = 'block';
                tempCustomSection.classList.remove('hidden');
            } else if (mode === 'custom_list' && customListSection) {
                customListSection.style.display = 'block';
                customListSection.classList.remove('hidden');
            }
            
            console.log('TTS模式切换到:', mode);
        }
        
        ttsModeSelect.addEventListener('change', updateTTSModeDisplay);
        updateTTSModeDisplay(); // 初始化状态
    }
}

// 重新定义情感控制初始化
function initializeEmotionControl() {
    // 手动合成模块的情感标签
    const emotionTags = document.querySelectorAll('.emotion-tag');
    let currentEmotion = 'neutral';
    
    emotionTags.forEach(tag => {
        tag.addEventListener('click', () => {
            // 移除所有活动状态
            emotionTags.forEach(t => t.classList.remove('active'));
            
            // 激活点击的情感标签
            tag.classList.add('active');
            currentEmotion = tag.dataset.emotion;
            
            // 更新预览
            updateSynthesisPreview();
            
            console.log('选择情感:', currentEmotion);
        });
    });
    
    // 存储当前情感到全局变量
    window.currentSynthesisEmotion = currentEmotion;
}



// 更新字符计数（通用函数）
function updateCharacterCount(textarea, type = 'chat') {
    const container = textarea.closest('.text-footer, .input-footer');
    if (container) {
        const charCount = container.querySelector('.char-count');
        if (charCount) {
            if (type === 'synthesis') {
                const current = charCount.querySelector('.current');
                if (current) {
                    current.textContent = textarea.value.length;
                }
            } else {
                // 原有的聊天字符计数逻辑
                charCount.textContent = `${textarea.value.length}/2000`;
            }
        }
    }
}

// 更新合成预览
function updateSynthesisPreview() {
    const previewText = document.getElementById('synthesisPreviewText');
    const synthesisText = document.getElementById('synthesisText');
    
    if (previewText && synthesisText) {
        const text = synthesisText.value.trim();
        const emotion = window.currentSynthesisEmotion || 'neutral';
        const emotionPrefix = getEmotionPrefix(emotion);
        
        const prefixElement = previewText.querySelector('.emotion-prefix');
        const contentElement = previewText.querySelector('.preview-content');
        
        if (prefixElement && contentElement) {
            prefixElement.textContent = emotionPrefix;
            contentElement.textContent = text || '在这里预览带情感的文本...';
        }
    }
}

// 获取情感前缀
function getEmotionPrefix(emotion) {
    const emotionPrefixes = {
        'neutral': '',
        'happy': '你能用开心的情感说吗？<|endofprompt|>',
        'excited': '你能用兴奋的情感说吗？<|endofprompt|>',
        'sad': '你能用悲伤的情感说吗？<|endofprompt|>',
        'surprised': '你能用惊讶的情感说吗？<|endofprompt|>',
        'gentle': '你能用温和的情感说吗？<|endofprompt|>'
    };
    return emotionPrefixes[emotion] || '';
}

// 处理合成开始
async function handleSynthesisStart() {
    const synthesisText = document.getElementById('synthesisText');
    const startBtn = document.getElementById('startSynthesis');
    
    if (!synthesisText || !synthesisText.value.trim()) {
        showNotification('请输入要合成的文本', 'error');
        return;
    }
    
    const text = synthesisText.value.trim();
    const emotion = window.currentSynthesisEmotion || 'neutral';
    
    try {
        // 禁用按钮
        if (startBtn) {
            startBtn.disabled = true;
            startBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 合成中...';
        }
        
        // 构建请求数据
        const requestData = {
            text: text,
            emotion: emotion,
            mode: 'builtin',
            voice_id: document.getElementById('synthesisVoice')?.value || 'alex',
            speed: parseFloat(document.getElementById('synthesisSpeed')?.value || '1.0')
        };
        
        // 发送请求
        const response = await fetch('/api/manual-synthesis', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestData)
        });
        
        if (response.ok) {
            const audioBlob = await response.blob();
            const audioUrl = URL.createObjectURL(audioBlob);
            
            // 播放音频
            playAudioFromUrl(audioUrl, text);
            
            // 启用下载按钮
            const downloadBtn = document.getElementById('downloadSynthesis');
            if (downloadBtn) {
                downloadBtn.disabled = false;
                downloadBtn.onclick = () => downloadAudio(audioUrl, 'synthesis');
            }
            
            showNotification('合成成功！', 'success');
        } else {
            const error = await response.json();
            showNotification(error.error || '合成失败', 'error');
        }
        
    } catch (error) {
        console.error('合成失败:', error);
        showNotification('合成失败，请稍后重试', 'error');
    } finally {
        // 恢复按钮
        if (startBtn) {
            startBtn.disabled = false;
            startBtn.innerHTML = '<i class="fas fa-play"></i> 开始合成';
        }
    }
}

// 处理合成下载
function handleSynthesisDownload() {
    console.log('下载合成音频');
    // 下载功能在handleSynthesisStart中实现
}

// 播放音频从URL - 使用新的侧边播放器（仅在AI对话模块中显示）
function playAudioFromUrl(audioUrl, text) {
    try {
        // 检查当前是否在AI对话模块
        const aiChatModule = document.getElementById('aiChatModule');
        const isAiChatActive = aiChatModule && aiChatModule.classList.contains('active');
        
        const sidePlayer = document.getElementById('sideAudioPlayer');
        const audioPlayer = document.getElementById('ttsAudioPlayer');
        const audioSource = document.getElementById('ttsAudioSource');
        const playerText = document.getElementById('playerTextContent');
        const downloadBtn = document.getElementById('downloadAudio');
        
        if (!audioPlayer || !audioSource) {
            console.error('音频播放器元素未找到');
            showNotification('播放器初始化失败', 'error');
            return;
        }
        
        audioSource.src = audioUrl;
        audioPlayer.load();
        
        if (playerText) {
            playerText.textContent = `${text.substring(0, 80)}${text.length > 80 ? '...' : ''}`;
        }
        
        // 显示侧边播放器（所有模块都可以使用）
        if (sidePlayer) {
            sidePlayer.classList.remove('hidden');
            sidePlayer.classList.add('show');
            console.log('✓ 侧边播放器已显示');
        } else {
            console.error('侧边播放器元素未找到，但继续播放音频');
        }
        
        // 设置下载功能
        if (downloadBtn) {
            downloadBtn.onclick = () => downloadAudio(audioUrl, 'tts_audio');
        }
        
        // 播放音频
        audioPlayer.play().catch(error => {
            console.error('播放失败:', error);
            showNotification('播放失败，请重试', 'error');
        });
        
        console.log('✓ 音频播放设置完成');
        
    } catch (error) {
        console.error('playAudioFromUrl执行出错:', error);
        showNotification(`播放失败: ${error.message}`, 'error');
    }
}

// 下载音频
function downloadAudio(audioUrl, filename = 'audio') {
    const a = document.createElement('a');
    a.href = audioUrl;
    a.download = `${filename}_${Date.now()}.mp3`;
    a.click();
}

// 初始化音色管理
function initializeVoiceManagement() {
    console.log('初始化音色管理模块');
    
    // 生成内置音色卡片
    generateBuiltinVoiceCards();
    
    // 加载自定义音色
    loadCustomVoices();
    
    // 创建新音色按钮
    const createBtn = document.getElementById('createNewVoice');
    if (createBtn) {
        createBtn.addEventListener('click', showCreateVoiceModal);
    }
}

// 生成内置音色卡片
function generateBuiltinVoiceCards() {
    const grid = document.getElementById('builtinVoicesGrid');
    if (!grid) return;
    
    const builtinVoices = [
        { id: 'alex', name: 'Alex', description: '沉稳男声，适合正式场合' },
        { id: 'benjamin', name: 'Benjamin', description: '低沉男声，富有磁性' },
        { id: 'charles', name: 'Charles', description: '磁性男声，温暖亲切' },
        { id: 'david', name: 'David', description: '欢快男声，活力四射' },
        { id: 'anna', name: 'Anna', description: '沉稳女声，专业可靠' },
        { id: 'bella', name: 'Bella', description: '激情女声，充满活力' },
        { id: 'claire', name: 'Claire', description: '温柔女声，柔和亲切' },
        { id: 'diana', name: 'Diana', description: '欢快女声，甜美动听' }
    ];
    
    grid.innerHTML = builtinVoices.map(voice => `
        <div class="voice-card">
            <div class="voice-card-header">
                <h4 class="voice-card-title">${voice.name}</h4>
                <span class="voice-card-type">内置</span>
            </div>
            <p class="voice-card-description">${voice.description}</p>
            <div class="voice-card-actions">
                <button type="button" class="voice-card-btn" onclick="testVoice('${voice.id}')">
                    <i class="fas fa-play"></i> 试听
                </button>
                <button type="button" class="voice-card-btn primary" onclick="selectVoice('${voice.id}')">
                    <i class="fas fa-check"></i> 选择
                </button>
            </div>
        </div>
    `).join('');
}






 