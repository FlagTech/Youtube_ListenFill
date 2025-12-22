"""
AI 服務層：整合 OpenAI、Gemini 和 Ollama
"""
from typing import Optional
import openai
import google.generativeai as genai
import requests
from sqlalchemy.orm import Session

from app.models.database import AISettings


class AIService:
    """AI 服務類別，支援多種 AI 模型"""
    
    def __init__(self, db: Session):
        """
        初始化 AI 服務
        
        Args:
            db: 資料庫連線
        """
        self.db = db
        self.settings = self._load_settings()
    
    def _load_settings(self) -> Optional[AISettings]:
        """
        從資料庫載入 AI 設定
        
        Returns:
            AISettings 物件，如果不存在則返回 None
        """
        return self.db.query(AISettings).first()
    
    def _build_prompt(self, sentence: str, context: str = "") -> str:
        """
        建構 AI 提示詞
        
        Args:
            sentence: 要解說的句子
            context: 上下文資訊（影片標題等）
        
        Returns:
            完整的提示詞
        """
        prompt = f"""請以學習英文的角度，詳細解說以下句子：

"{sentence}"
"""
        if context:
            prompt += f"\n情境：這句話出自影片「{context}」\n"
        
        prompt += """
請提供：
1. 文法結構分析（句型、時態）
2. 關鍵單字解釋（詞性、中文意思、例句）
3. 片語和慣用語
4. 這句話在影片情境中的使用說明

請用繁體中文回答，並以清晰的格式呈現。
"""
        return prompt
    
    def _call_openai(self, prompt: str) -> str:
        """
        呼叫 OpenAI GPT API
        
        Args:
            prompt: 提示詞
        
        Returns:
            AI 回應文字
        
        Raises:
            Exception: API 呼叫失敗時拋出異常
        """
        if not self.settings or not self.settings.openai_api_key:
            raise ValueError("OpenAI API Key 未設定")
        
        try:
            client = openai.OpenAI(api_key=self.settings.openai_api_key)
            response = client.chat.completions.create(
                model=self.settings.openai_model,
                messages=[
                    {"role": "system", "content": "你是一位專業的英文教師，擅長用繁體中文解說英文句子。"},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.7,
                max_tokens=2000
            )
            return response.choices[0].message.content
        except openai.AuthenticationError:
            raise ValueError("OpenAI API Key 無效或已過期")
        except openai.RateLimitError:
            raise ValueError("OpenAI API 使用額度已達上限")
        except Exception as e:
            raise Exception(f"OpenAI API 呼叫失敗: {str(e)}")
    
    def _call_gemini(self, prompt: str) -> str:
        """
        呼叫 Google Gemini API
        
        Args:
            prompt: 提示詞
        
        Returns:
            AI 回應文字
        
        Raises:
            Exception: API 呼叫失敗時拋出異常
        """
        if not self.settings or not self.settings.gemini_api_key:
            raise ValueError("Gemini API Key 未設定")
        
        try:
            genai.configure(api_key=self.settings.gemini_api_key)
            model = genai.GenerativeModel(self.settings.gemini_model)
            
            response = model.generate_content(prompt)
            return response.text
        except Exception as e:
            error_msg = str(e).lower()
            if "api key" in error_msg or "authentication" in error_msg:
                raise ValueError("Gemini API Key 無效或已過期")
            elif "quota" in error_msg or "rate limit" in error_msg:
                raise ValueError("Gemini API 使用額度已達上限")
            else:
                raise Exception(f"Gemini API 呼叫失敗: {str(e)}")
    
    def _call_ollama(self, prompt: str) -> str:
        """
        呼叫本地 Ollama API
        
        Args:
            prompt: 提示詞
        
        Returns:
            AI 回應文字
        
        Raises:
            Exception: API 呼叫失敗時拋出異常
        """
        if not self.settings:
            raise ValueError("Ollama 設定未初始化")
        
        base_url = self.settings.ollama_base_url.rstrip('/')
        api_url = f"{base_url}/api/generate"
        
        try:
            response = requests.post(
                api_url,
                json={
                    "model": self.settings.ollama_model,
                    "prompt": prompt,
                    "stream": False
                },
                timeout=60
            )
            
            if response.status_code == 404:
                raise ValueError(f"Ollama 模型 '{self.settings.ollama_model}' 未找到，請先下載模型")
            
            response.raise_for_status()
            result = response.json()
            return result.get("response", "")
        except requests.exceptions.ConnectionError:
            raise ValueError("無法連線到 Ollama 服務，請確認 Ollama 是否已啟動")
        except requests.exceptions.Timeout:
            raise ValueError("Ollama 服務回應超時，請稍後再試")
        except Exception as e:
            raise Exception(f"Ollama API 呼叫失敗: {str(e)}")
    
    def explain_sentence(self, sentence: str, context: str = "") -> str:
        """
        解說句子（根據設定選擇對應的 AI 服務）
        
        Args:
            sentence: 要解說的句子
            context: 上下文資訊（影片標題等）
        
        Returns:
            AI 解說文字
        
        Raises:
            ValueError: 設定不完整或 API 呼叫失敗時拋出異常
        """
        if not self.settings:
            raise ValueError("AI 設定尚未初始化，請先到設定頁面進行設定")
        
        prompt = self._build_prompt(sentence, context)
        
        if self.settings.provider == "openai":
            return self._call_openai(prompt)
        elif self.settings.provider == "gemini":
            return self._call_gemini(prompt)
        elif self.settings.provider == "ollama":
            return self._call_ollama(prompt)
        else:
            raise ValueError(f"不支援的 AI 服務: {self.settings.provider}")
    
    def test_connection(self) -> dict:
        """
        測試 AI 服務連線

        Returns:
            包含測試結果的字典: {"success": bool, "message": str}
        """
        if not self.settings:
            return {"success": False, "message": "AI 設定尚未初始化"}

        try:
            # 使用簡單的測試句子
            test_sentence = "Hello, how are you?"
            result = self.explain_sentence(test_sentence, "測試")

            if result:
                return {"success": True, "message": "連線成功！AI 服務運作正常"}
            else:
                return {"success": False, "message": "AI 服務返回空白回應"}
        except Exception as e:
            return {"success": False, "message": str(e)}

    def get_ollama_models(self) -> list:
        """
        取得本地 Ollama 已安裝的模型列表

        Returns:
            模型名稱列表

        Raises:
            Exception: 無法獲取模型列表時拋出異常
        """
        if not self.settings:
            base_url = "http://localhost:11434"
        else:
            base_url = self.settings.ollama_base_url.rstrip('/')

        api_url = f"{base_url}/api/tags"

        try:
            response = requests.get(api_url, timeout=5)
            response.raise_for_status()
            result = response.json()

            # 提取模型名稱列表
            models = []
            for model in result.get("models", []):
                model_name = model.get("name", "")
                if model_name:
                    models.append(model_name)

            return models
        except requests.exceptions.ConnectionError:
            raise ValueError("無法連線到 Ollama 服務，請確認 Ollama 是否已啟動")
        except requests.exceptions.Timeout:
            raise ValueError("Ollama 服務回應超時")
        except Exception as e:
            raise Exception(f"獲取 Ollama 模型列表失敗: {str(e)}")


# 建立服務實例的輔助函數
def get_ai_service(db: Session) -> AIService:
    """
    取得 AI 服務實例
    
    Args:
        db: 資料庫連線
    
    Returns:
        AIService 實例
    """
    return AIService(db)

