# YouTube 聽打練習應用

一個專注於英文聽力與拼寫訓練的 Web 應用程式，透過 YouTube 影片進行互動式聽打練習，幫助學習者提升英語聽力與拼寫能力。

## 功能特色

### 📹 YouTube 影片管理
- 支援透過 YouTube URL 下載影片和字幕
- 自動偵測並下載 VTT（自動字幕，含逐字時間戳記）或 SRT（手動字幕）格式
- SSE 串流即時顯示下載進度
- 自動取得標題、頻道、時長、縮圖等影片資訊
- 影片分類資料夾管理（建立、重新命名、刪除、移動影片）
- 影片列表管理（查看、刪除）

### 📝 字幕處理與翻譯
- 支援 VTT（自動字幕）和 SRT（手動字幕）格式
- 自動翻譯成繁體中文（使用 Google Translate）
- 根據字幕將影片進行分段
- 智慧生成字母填空模板（保留標點符號，字母替換為底線）

### 🎬 影片播放控制
- 點擊分段可自動跳轉到對應時間點
- 播放速度調整（0.5× ~ 2.0×）
- 循環播放模式：單句重複播放（暫停 2 秒後重播）
- 單次播放模式：單句僅播放一次
- 左右箭頭快速切換段落

### ✍️ 聽打練習與填空
- 每個字母獨立輸入框，精確練習拼寫
- 使用 `ch` 單位自適應等寬字體，確保對齊
- 標點符號自動顯示，不需填寫
- 輸入字母後自動跳到下一個空格
- 支援退格鍵返回上一個輸入框
- 提示功能：顯示下一個要輸入的字母
- 檢查答案：對齊顯示正確答案，標示正確/錯誤
- 翻譯功能：顯示/隱藏繁體中文翻譯

### 🤖 AI 解說功能
- 支援三種 AI 服務：OpenAI GPT、Google Gemini、Ollama（本地部署）
- 針對選定句子提供文法解析、單字說明、情境用法
- 可保存 AI 解說至資料庫，重新開啟時可查看
- 支援顯示/隱藏已保存的解說
- 可重新生成 AI 解說

### 💾 學習進度儲存
- 自動儲存練習進度到 LocalStorage（每 10 秒）
- 記錄最後練習的段落位置
- 記錄使用者輸入的字母
- 下次開啟自動恢復進度

### ⚙️ 設定管理
- AI 服務供應商選擇（OpenAI / Gemini / Ollama）
- API 金鑰管理（加密顯示前 6 後 4 碼）
- 模型選擇與自訂

## 技術架構

### 後端
- **FastAPI** - 高效能 Python Web 框架
- **yt-dlp** - YouTube 影片下載（支援請求節流，避免 429 錯誤）
- **pysrt** - SRT 字幕解析
- **webvtt-py** - VTT 字幕解析
- **deep-translator** - Google Translate 翻譯
- **SQLAlchemy** - ORM 資料庫操作
- **SQLite** - 輕量級資料庫
- **AI 整合** - OpenAI API、Google Gemini API、Ollama 本地模型

### 前端
- **React + TypeScript** - 現代化前端框架
- **Vite** - 快速的開發建置工具
- **Tailwind CSS** - 實用優先的 CSS 框架
- **React Player** - 影片播放器
- **Zustand** - 輕量級狀態管理
- **Axios** - HTTP 請求庫
- **React Router** - 路由管理
- **Lucide React** - 圖標庫

## 安裝與啟動

### 環境需求
- Python 3.11+
- Node.js 18+
- uv (Python 套件管理工具)

### 方法一：快速啟動（推薦）

雙擊 `quick_start.bat` 即可自動啟動前後端服務。

首次執行會自動安裝依賴：
- 後端：使用 `uv sync` 安裝 Python 依賴
- 前端：使用 `npm install` 安裝 Node.js 依賴

### 方法二：手動啟動

#### 後端啟動

1. 進入後端目錄：
```bash
cd backend
```

2. 使用 uv 同步依賴：
```bash
uv sync
```

3. 啟動 FastAPI 伺服器：
```bash
uv run python app.py
```

或使用 uvicorn：
```bash
uv run uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

後端 API 將運行在 `http://localhost:8000`
- API 文檔：`http://localhost:8000/docs`

#### 前端啟動

1. 進入前端目錄：
```bash
cd frontend
```

2. 安裝依賴：
```bash
npm install
```

3. 啟動開發伺服器：
```bash
npm run dev
```

前端應用將運行在 `http://localhost:5173`

## 使用方式

### 1. 設定 AI 服務（可選）
- 進入設定頁面
- 選擇 AI 服務供應商（OpenAI / Gemini / Ollama）
- 輸入對應的 API 金鑰或設定本地模型
- 儲存設定

### 2. 下載 YouTube 影片
- 在首頁輸入 YouTube 影片網址
- 點擊「下載影片」按鈕
- 即時查看下載進度（取得資訊 → 下載影片 → 下載字幕 → 翻譯字幕）
- 等待下載完成（需要有英文字幕）

### 3. 整理影片（可選）
- 建立分類資料夾（例如：「科技」、「旅遊」、「教育」）
- 將影片移動至對應資料夾
- 重新命名或刪除資料夾

### 4. 開始練習
- 在影片列表中點擊「開始練習」
- 系統會自動載入影片和字幕分段

### 5. 聽打練習
- 觀看影片播放當前段落
- 在填空區輸入聽到的字母
- 使用「給我提示」獲得下一個字母提示
- 使用「檢查答案」查看正確答案
- 使用「顯示翻譯」查看中文翻譯
- 使用「AI 解說」獲得句子詳細解析

### 6. AI 解說使用
- 點擊「AI 解說」按鈕
- 等待 AI 生成解說（包含文法、單字、情境等）
- 點擊「保存 AI 解說」將解說儲存至資料庫
- 下次開啟同一句子時，可點擊「顯示已保存的 AI 解說」
- 可點擊「重新生成解說」獲得新的解說

### 7. 播放控制
- 調整播放速度以適應學習節奏
- 選擇「循環」模式重複聽同一段
- 選擇「單次」模式聽完後暫停
- 使用左右箭頭切換段落

## 專案結構

```
Youtube_ListenFill/
├── backend/                 # 後端應用
│   ├── app/
│   │   ├── api/            # API 路由
│   │   │   └── routes.py   # 所有 API 端點
│   │   ├── models/         # 資料模型
│   │   │   └── database.py # SQLAlchemy 模型定義
│   │   ├── services/       # 業務邏輯
│   │   │   ├── youtube_service.py   # YouTube 下載服務
│   │   │   ├── subtitle_service.py  # 字幕處理服務
│   │   │   └── ai_service.py        # AI 整合服務
│   │   └── main.py         # 應用入口
│   ├── downloads/          # 下載檔案存放
│   │   ├── videos/         # 影片檔案
│   │   └── subtitles/      # 字幕檔案
│   ├── database.db         # SQLite 資料庫（git 已忽略）
│   ├── app.py              # 啟動腳本
│   └── pyproject.toml      # Python 依賴配置
│
├── frontend/               # 前端應用
│   ├── src/
│   │   ├── components/    # React 元件
│   │   │   ├── NavBar.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   ├── VideoPlayer.tsx
│   │   │   ├── FillBlanksInput.tsx
│   │   │   ├── ActionButtons.tsx
│   │   │   ├── AIExplanationModal.tsx
│   │   │   └── DownloadProgress.tsx
│   │   ├── pages/         # 頁面元件
│   │   │   ├── HomePage.tsx
│   │   │   ├── PracticePage.tsx
│   │   │   └── SettingsPage.tsx
│   │   ├── services/      # API 服務
│   │   │   └── api.ts
│   │   ├── store/         # 狀態管理
│   │   │   └── useVideoStore.ts
│   │   ├── types/         # TypeScript 類型
│   │   │   └── index.ts
│   │   └── App.tsx        # 應用根元件
│   └── package.json       # Node 依賴配置
│
├── .gitignore             # Git 忽略檔案
├── CLAUDE.md              # Claude Code 專案指引
├── quick_start.bat        # 快速啟動腳本
└── README.md              # 專案說明
```

## API 端點

### 影片管理
- `POST /api/videos/download/stream` - 下載 YouTube 影片（SSE 串流進度）
- `GET /api/videos` - 取得影片列表
- `GET /api/videos/{video_id}` - 取得影片資訊
- `DELETE /api/videos/{video_id}` - 刪除影片
- `PUT /api/videos/{video_id}/move` - 移動影片至資料夾
- `GET /api/videos/{video_id}/stream` - 串流影片檔案

### 字幕管理
- `GET /api/videos/{video_id}/subtitles` - 取得字幕分段
- `PUT /api/subtitles/{segment_id}` - 更新字幕分段（儲存 AI 解說）

### 資料夾管理
- `GET /api/folders` - 取得所有資料夾
- `POST /api/folders` - 建立新資料夾
- `PUT /api/folders/{folder_id}` - 更新資料夾（重新命名、更改顏色）
- `DELETE /api/folders/{folder_id}` - 刪除資料夾

### AI 服務
- `POST /api/ai/explain` - 請求 AI 解說句子
- `GET /api/ai/settings` - 取得 AI 設定
- `PUT /api/ai/settings` - 更新 AI 設定

## 資料庫結構

### Video（影片資料表）
- `id`: 主鍵
- `youtube_id`: YouTube 影片 ID（唯一）
- `title`: 影片標題
- `channel`: 頻道名稱
- `duration`: 影片時長（秒）
- `thumbnail_url`: 縮圖網址
- `video_path`: 本地影片路徑
- `folder_id`: 所屬資料夾 ID（可為空）
- `created_at`: 建立時間

### SubtitleSegment（字幕分段資料表）
- `id`: 主鍵
- `video_id`: 所屬影片 ID（外鍵）
- `index`: 段落索引
- `start_time`: 開始時間（秒）
- `end_time`: 結束時間（秒）
- `text_en`: 英文原文
- `text_zh`: 繁體中文翻譯
- `letter_template`: 字母模板
- `ai_insights`: AI 解說內容

### Folder（資料夾資料表）
- `id`: 主鍵
- `name`: 資料夾名稱
- `color`: 資料夾顏色（HEX 色碼）
- `created_at`: 建立時間

### AISettings（AI 設定資料表）
- `id`: 主鍵
- `provider`: AI 服務供應商（openai / gemini / ollama）
- `openai_api_key`: OpenAI API 金鑰
- `openai_model`: OpenAI 模型名稱
- `gemini_api_key`: Gemini API 金鑰
- `gemini_model`: Gemini 模型名稱
- `ollama_base_url`: Ollama 伺服器網址
- `ollama_model`: Ollama 模型名稱
- `updated_at`: 更新時間

## 注意事項

1. **字幕要求**：YouTube 影片必須有英文字幕（自動生成或手動上傳皆可）
2. **網路連線**：下載影片和翻譯字幕需要網路連線
3. **儲存空間**：下載的影片會佔用本地儲存空間
4. **翻譯限制**：使用 Google Translate 免費版，可能有使用頻率限制
5. **AI 服務**：使用 AI 解說功能需要設定 API 金鑰或本地 Ollama 服務
6. **下載限制**：YouTube 下載已實施請求節流機制，避免觸發 429 錯誤

## 開發團隊

本專案使用以下開源技術構建，感謝所有貢獻者。

## 授權

MIT License

## 更新日誌

### v1.2.0 (2025-12-19)
- 🤖 新增 AI 解說功能（OpenAI、Gemini、Ollama）
- 💾 支援儲存和管理 AI 解說
- 📁 新增影片分類資料夾功能
- 🎨 改進填空輸入樣式（使用 ch 單位）
- 🚀 新增 SSE 下載進度即時顯示
- 🛠️ 修復 YouTube 429 錯誤（分離影片和字幕下載）
- ✨ 新增快速啟動腳本 quick_start.bat
- ⚙️ 新增設定頁面（AI 服務設定）

### v1.1.0 (2025-12-17)
- 📝 支援 VTT 自動字幕（含逐字時間戳記）
- 🔄 智慧偵測字幕格式（VTT / SRT）
- 🎯 改進字母輸入框對齊與間距

### v1.0.0 (2025-12-16)
- ✨ 初始版本發布
- 🎬 YouTube 影片下載功能
- 📝 字幕自動翻譯
- ✍️ 互動式聽打練習
- 💾 學習進度儲存
- 📱 響應式設計

## 未來計劃

- [ ] 支援更多語言翻譯（日文、韓文等）
- [ ] 加入學習統計和成績追蹤
- [ ] 支援自訂字幕上傳
- [ ] 加入單字本功能（收集生字）
- [ ] 支援多人協作練習
- [ ] 行動裝置 App 版本
- [ ] 支援語音輸入練習
- [ ] AI 難度分析與推薦影片
