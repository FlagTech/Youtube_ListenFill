/**
 * 設定頁面 - AI 服務配置
 */
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, TestTube, CheckCircle, XCircle } from 'lucide-react';
import NavBar from '../components/NavBar';
import { aiApi } from '../services/api';
import type { AIProvider, AISettings, AISettingsUpdate } from '../types';

const LS_KEY = 'yt_listenfill_ai_settings';

function loadLocalSettings(): Record<string, string> | null {
  try {
    const s = localStorage.getItem(LS_KEY);
    return s ? JSON.parse(s) : null;
  } catch {
    return null;
  }
}

function saveLocalSettings(updates: Record<string, string>) {
  const existing = loadLocalSettings() ?? {};
  localStorage.setItem(LS_KEY, JSON.stringify({ ...existing, ...updates }));
}

function maskKey(key: string): string {
  if (key.length <= 10) return '***';
  return key.slice(0, 6) + '****' + key.slice(-4);
}

export default function SettingsPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  
  // 表單狀態
  const [provider, setProvider] = useState<AIProvider>('gemini');
  const [openaiApiKey, setOpenaiApiKey] = useState('');
  const [openaiModel, setOpenaiModel] = useState('gpt-5-mini');
  const [geminiApiKey, setGeminiApiKey] = useState('');
  const [geminiModel, setGeminiModel] = useState('gemini-2.5-flash');
  const [ollamaBaseUrl, setOllamaBaseUrl] = useState('http://localhost:11434');
  const [ollamaModel, setOllamaModel] = useState('llama3.1:8b');

  // 顯示 API Key（遮罩後的）
  const [openaiKeyMasked, setOpenaiKeyMasked] = useState<string | null>(null);
  const [geminiKeyMasked, setGeminiKeyMasked] = useState<string | null>(null);

  // Ollama 模型列表
  const [ollamaModels, setOllamaModels] = useState<string[]>([]);
  const [loadingModels, setLoadingModels] = useState(false);

  // 載入設定
  useEffect(() => {
    const loadSettings = async () => {
      try {
        let settings = await aiApi.getSettings();

        // 後端沒有 Key 時，嘗試從 localStorage 還原
        if (!settings.openai_api_key_masked && !settings.gemini_api_key_masked) {
          const local = loadLocalSettings();
          if (local?.openai_api_key || local?.gemini_api_key) {
            const syncPayload: AISettingsUpdate = {
              provider: (local.provider as AIProvider) || settings.provider,
              openai_model: local.openai_model || settings.openai_model,
              gemini_model: local.gemini_model || settings.gemini_model,
              ollama_base_url: local.ollama_base_url || settings.ollama_base_url,
              ollama_model: local.ollama_model || settings.ollama_model,
            };
            if (local.openai_api_key) syncPayload.openai_api_key = local.openai_api_key;
            if (local.gemini_api_key) syncPayload.gemini_api_key = local.gemini_api_key;
            await aiApi.updateSettings(syncPayload);
            settings = await aiApi.getSettings();
          }
        }

        setProvider(settings.provider);
        setOpenaiModel(settings.openai_model);
        setGeminiModel(settings.gemini_model);
        setOllamaBaseUrl(settings.ollama_base_url);
        setOllamaModel(settings.ollama_model);
        setOpenaiKeyMasked(settings.openai_api_key_masked || null);
        setGeminiKeyMasked(settings.gemini_api_key_masked || null);
      } catch (error) {
        // 後端無法連線時，退而使用 localStorage 顯示
        const local = loadLocalSettings();
        if (local) {
          setProvider((local.provider as AIProvider) || 'gemini');
          setOpenaiModel(local.openai_model || 'gpt-4o-mini');
          setGeminiModel(local.gemini_model || 'gemini-1.5-flash');
          setOllamaBaseUrl(local.ollama_base_url || 'http://localhost:11434');
          setOllamaModel(local.ollama_model || 'llama3.1:8b');
          if (local.openai_api_key) setOpenaiKeyMasked(maskKey(local.openai_api_key));
          if (local.gemini_api_key) setGeminiKeyMasked(maskKey(local.gemini_api_key));
        }
        console.error('載入設定失敗:', error);
      } finally {
        setLoading(false);
      }
    };

    loadSettings();
  }, []);

  // 儲存設定
  const handleSave = async () => {
    setSaving(true);
    setTestResult(null);
    
    try {
      const settings: AISettingsUpdate = {
        provider,
        openai_model: openaiModel,
        gemini_model: geminiModel,
        ollama_base_url: ollamaBaseUrl,
        ollama_model: ollamaModel,
      };
      
      // 只在使用者輸入了新的 API Key 時才傳送
      if (openaiApiKey) settings.openai_api_key = openaiApiKey;
      if (geminiApiKey) settings.gemini_api_key = geminiApiKey;
      
      await aiApi.updateSettings(settings);
      
      // 同步寫入 localStorage（僅在使用者輸入了新 Key 時才更新）
      const localUpdate: Record<string, string> = {
        provider,
        openai_model: openaiModel,
        gemini_model: geminiModel,
        ollama_base_url: ollamaBaseUrl,
        ollama_model: ollamaModel,
      };
      if (openaiApiKey) localUpdate.openai_api_key = openaiApiKey;
      if (geminiApiKey) localUpdate.gemini_api_key = geminiApiKey;
      saveLocalSettings(localUpdate);

      // 重新載入設定以更新遮罩後的 Key
      const updatedSettings = await aiApi.getSettings();
      setOpenaiKeyMasked(updatedSettings.openai_api_key_masked || null);
      setGeminiKeyMasked(updatedSettings.gemini_api_key_masked || null);

      // 清空輸入框
      setOpenaiApiKey('');
      setGeminiApiKey('');
      
      setTestResult({ success: true, message: '設定已儲存成功！' });
      setTimeout(() => setTestResult(null), 3000);
    } catch (error: any) {
      setTestResult({ 
        success: false, 
        message: error.response?.data?.detail || '儲存失敗，請稍後再試' 
      });
    } finally {
      setSaving(false);
    }
  };

  // 測試連線
  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);

    try {
      const result = await aiApi.testConnection();
      setTestResult(result);
    } catch (error) {
      setTestResult({
        success: false,
        message: '測試失敗，請確認設定是否正確'
      });
    } finally {
      setTesting(false);
    }
  };

  // 載入 Ollama 模型列表
  const loadOllamaModels = async () => {
    setLoadingModels(true);
    try {
      const models = await aiApi.getOllamaModels();
      setOllamaModels(models);
      if (models.length > 0 && !models.includes(ollamaModel)) {
        // 如果當前選擇的模型不在列表中，選擇第一個
        setOllamaModel(models[0]);
      }
    } catch (error) {
      console.error('載入 Ollama 模型失敗:', error);
      setOllamaModels([]);
    } finally {
      setLoadingModels(false);
    }
  };

  // 當切換到 Ollama 時自動載入模型列表
  useEffect(() => {
    if (provider === 'ollama') {
      loadOllamaModels();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [provider]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300 text-lg">載入中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <NavBar />
      
      <main className="px-4 md:px-6 pb-8">
        <div className="max-w-4xl mx-auto">
          {/* 標題列 */}
          <div className="mb-8 flex items-center gap-4 animate-fade-in-up">
            <button
              onClick={() => navigate(-1)}
              className="p-2 hover:bg-white/10 dark:hover:bg-white/5 rounded-lg transition-colors"
              title="返回"
            >
              <ArrowLeft size={24} className="text-gray-700 dark:text-gray-300" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">AI 設定</h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">配置您的 AI 服務以使用句子解說功能</p>
            </div>
          </div>

          {/* 測試結果提示 */}
          {testResult && (
            <div className={`mb-6 p-4 rounded-lg flex items-center gap-3 animate-fade-in ${
              testResult.success 
                ? 'bg-green-500/20 border border-green-500/50 text-green-200' 
                : 'bg-red-500/20 border border-red-500/50 text-red-200'
            }`}>
              {testResult.success ? <CheckCircle size={20} /> : <XCircle size={20} />}
              <span>{testResult.message}</span>
            </div>
          )}

          {/* 設定表單 */}
          <div className="glass-card p-6 space-y-6 animate-fade-in-up" style={{animationDelay: '0.1s'}}>
            {/* AI 服務選擇 */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                選擇 AI 服務
              </label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* OpenAI */}
                <button
                  onClick={() => setProvider('openai')}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    provider === 'openai'
                      ? 'border-blue-500 bg-blue-500/10'
                      : 'border-gray-300 dark:border-gray-600 hover:border-blue-400'
                  }`}
                >
                  <div className="font-bold text-gray-900 dark:text-white mb-1">OpenAI GPT</div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">需付費，品質最佳</div>
                </button>

                {/* Gemini */}
                <button
                  onClick={() => setProvider('gemini')}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    provider === 'gemini'
                      ? 'border-purple-500 bg-purple-500/10'
                      : 'border-gray-300 dark:border-gray-600 hover:border-purple-400'
                  }`}
                >
                  <div className="font-bold text-gray-900 dark:text-white mb-1">Google Gemini</div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">有免費額度</div>
                </button>

                {/* Ollama */}
                <button
                  onClick={() => setProvider('ollama')}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    provider === 'ollama'
                      ? 'border-green-500 bg-green-500/10'
                      : 'border-gray-300 dark:border-gray-600 hover:border-green-400'
                  }`}
                >
                  <div className="font-bold text-gray-900 dark:text-white mb-1">Ollama 本地</div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">完全免費</div>
                </button>
              </div>
            </div>

            {/* OpenAI 設定 */}
            {provider === 'openai' && (
              <div className="space-y-4 animate-fade-in">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    API Key {openaiKeyMasked && <span className="text-xs text-gray-500">（已設定：{openaiKeyMasked}）</span>}
                  </label>
                  <input
                    type="password"
                    value={openaiApiKey}
                    onChange={(e) => setOpenaiApiKey(e.target.value)}
                    placeholder={openaiKeyMasked ? "留空以保持現有設定" : "sk-..."}
                    className="w-full px-4 py-3 rounded-lg bg-white/50 dark:bg-gray-800/50 border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    前往 <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">OpenAI 平台</a> 取得 API Key
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    模型選擇
                  </label>
                  <select
                    value={openaiModel}
                    onChange={(e) => setOpenaiModel(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg bg-white/50 dark:bg-gray-800/50 border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="gpt-5.2">GPT-5.2</option>
                    <option value="gpt-5.1">GPT-5.1</option>
                    <option value="gpt-5">GPT-5</option>
                    <option value="gpt-5-mini">GPT-5 Mini</option>
                    <option value="gpt-5-nano">GPT-5 Nano</option>
                    <option value="gpt-4o">GPT-4o</option>
                    <option value="gpt-4o-mini">GPT-4o Mini</option>
                  </select>
                </div>
              </div>
            )}

            {/* Gemini 設定 */}
            {provider === 'gemini' && (
              <div className="space-y-4 animate-fade-in">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    API Key {geminiKeyMasked && <span className="text-xs text-gray-500">（已設定：{geminiKeyMasked}）</span>}
                  </label>
                  <input
                    type="password"
                    value={geminiApiKey}
                    onChange={(e) => setGeminiApiKey(e.target.value)}
                    placeholder={geminiKeyMasked ? "留空以保持現有設定" : "AIza..."}
                    className="w-full px-4 py-3 rounded-lg bg-white/50 dark:bg-gray-800/50 border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    前往 <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-purple-500 hover:underline">Google AI Studio</a> 取得 API Key
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    模型選擇
                  </label>
                  <select
                    value={geminiModel}
                    onChange={(e) => setGeminiModel(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg bg-white/50 dark:bg-gray-800/50 border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value="gemini-2.5-flash">Gemini 2.5 Flash</option>
                    <option value="gemini-2.5-pro">Gemini 2.5 Pro</option>
                    <option value="gemini-2.0-flash-exp">Gemini 2.0 Flash Exp</option>
                    <option value="gemini-1.5-flash">Gemini 1.5 Flash</option>
                    <option value="gemini-1.5-pro">Gemini 1.5 Pro</option>
                  </select>
                </div>
              </div>
            )}

            {/* Ollama 設定 */}
            {provider === 'ollama' && (
              <div className="space-y-4 animate-fade-in">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Ollama 服務地址
                  </label>
                  <input
                    type="text"
                    value={ollamaBaseUrl}
                    onChange={(e) => setOllamaBaseUrl(e.target.value)}
                    placeholder="http://localhost:11434"
                    className="w-full px-4 py-3 rounded-lg bg-white/50 dark:bg-gray-800/50 border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center justify-between">
                    <span>模型選擇</span>
                    {loadingModels && <span className="text-xs text-gray-500">載入中...</span>}
                  </label>
                  {ollamaModels.length > 0 ? (
                    <select
                      value={ollamaModel}
                      onChange={(e) => setOllamaModel(e.target.value)}
                      disabled={loadingModels}
                      className="w-full px-4 py-3 rounded-lg bg-white/50 dark:bg-gray-800/50 border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-green-500 focus:border-transparent disabled:opacity-50"
                    >
                      {ollamaModels.map((model) => (
                        <option key={model} value={model}>
                          {model}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div className="w-full px-4 py-3 rounded-lg bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400">
                      {loadingModels ? '正在載入模型列表...' : '未找到已安裝的模型'}
                    </div>
                  )}
                  <p className="text-xs text-gray-500 mt-1">
                    請確保 Ollama 已安裝並運行。前往 <a href="https://ollama.com/" target="_blank" rel="noopener noreferrer" className="text-green-500 hover:underline">Ollama 官網</a> 了解更多
                  </p>
                </div>
              </div>
            )}

            {/* 操作按鈕 */}
            <div className="flex gap-4 pt-4">
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 btn-gradient flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Save size={20} />
                <span>{saving ? '儲存中...' : '儲存設定'}</span>
              </button>
              <button
                onClick={handleTest}
                disabled={testing || saving}
                className="flex-1 btn-secondary flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <TestTube size={20} className={testing ? 'animate-bounce' : ''} />
                <span>{testing ? '測試中...' : '測試連線'}</span>
              </button>
            </div>
          </div>

          {/* 說明區域 */}
          <div className="mt-6 glass-card p-6 animate-fade-in-up" style={{animationDelay: '0.2s'}}>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3">💡 使用說明</h3>
            <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <li>• <strong>OpenAI GPT</strong>：需要付費 API Key，但提供最佳的解說品質</li>
              <li>• <strong>Google Gemini</strong>：提供免費使用額度，適合一般使用</li>
              <li>• <strong>Ollama 本地</strong>：完全免費，但需要在電腦上安裝並運行 Ollama 服務</li>
              <li>• 儲存設定後，請點擊「測試連線」確認服務可正常使用</li>
              <li>• 在練習頁面中，點擊「AI 解說」按鈕即可使用此功能</li>
            </ul>
          </div>
        </div>
      </main>
    </div>
  );
}

