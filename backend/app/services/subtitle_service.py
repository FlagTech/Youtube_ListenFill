"""
字幕處理與翻譯服務
"""
import re
import pysrt
from deep_translator import GoogleTranslator
from typing import List, Dict
import time


class SubtitleService:
    """字幕處理服務類別"""
    
    def __init__(self):
        self.translator = GoogleTranslator(source='en', target='zh-TW')
    
    def parse_vtt_word_timing(self, file_path: str) -> List[Dict]:
        """
        解析 VTT 字幕檔案，提取每個詞的精確時間戳記
        
        VTT 格式範例:
        00:00:02.080 --> 00:00:04.230 align:start position:0%
        It's<00:00:02.320><c> a</c><00:00:02.560><c> city</c>...
        
        Args:
            file_path: VTT 檔案路徑
            
        Returns:
            每個詞的資訊列表 [{'word': 'Hello', 'time': 1.234}, ...]
        """
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        words_with_timing = []
        
        # 分割成時間塊
        blocks = re.split(r'\n\n+', content)
        
        for block in blocks:
            if '-->' not in block:
                continue
            
            lines = block.strip().split('\n')
            
            for line in lines:
                # 跳過時間軸行和空行
                if '-->' in line or not line.strip():
                    continue
                if line.startswith('WEBVTT') or line.startswith('Kind:') or line.startswith('Language:'):
                    continue
                
                # 查找包含時間戳記標籤的行
                if '<' in line and '>' in line:
                    # 先處理第一個詞（可能沒有前置時間標籤）
                    first_word_match = re.match(r'^([^<]+)<', line)
                    if first_word_match:
                        first_word = first_word_match.group(1).strip()
                        if first_word:
                            # 找到第一個時間戳記
                            time_match = re.search(r'<([\d:.]+)>', line)
                            if time_match:
                                time_str = time_match.group(1)
                                time_seconds = self._time_str_to_seconds(time_str)
                                words_with_timing.append({
                                    'word': first_word,
                                    'time': time_seconds
                                })
                    
                    # 提取所有 <time><c>word</c> 模式
                    pattern = r'<([\d:.]+)><c>\s*([^<]*?)\s*</c>'
                    matches = re.findall(pattern, line)
                    
                    for time_str, word in matches:
                        if word.strip():
                            time_seconds = self._time_str_to_seconds(time_str)
                            words_with_timing.append({
                                'word': word.strip(),
                                'time': time_seconds
                            })
        
        return words_with_timing
    
    def merge_words_into_sentences(self, words: List[Dict]) -> List[Dict]:
        """
        將逐字資訊合併成完整句子，使用精確時間軸
        
        關鍵邏輯：
        1. 按標點符號（. ! ?）分組成句子
        2. 使用第一個詞的時間作為開始時間
        3. 使用下一個句子第一個詞的時間作為結束時間（避免重疊）
        
        Args:
            words: 每個詞的資訊列表
            
        Returns:
            完整句子列表，包含精確時間軸
        """
        if not words:
            return []
        
        # 第一步：找出所有句子的邊界
        sentence_boundaries = []
        current_sentence_words = []
        
        for i, word_info in enumerate(words):
            word = word_info['word']
            current_sentence_words.append(word_info)
            
            # 檢查句子結尾
            if word.endswith(('.', '!', '?')):
                sentence_boundaries.append({
                    'words': current_sentence_words.copy(),
                    'last_word_index': i
                })
                current_sentence_words = []
        
        # 處理剩餘的詞
        if current_sentence_words:
            sentence_boundaries.append({
                'words': current_sentence_words.copy(),
                'last_word_index': len(words) - 1
            })
        
        # 第二步：為每個句子分配精確的時間
        sentences = []
        
        for i, boundary in enumerate(sentence_boundaries):
            sentence_words = boundary['words']
            sentence_text = ' '.join([w['word'] for w in sentence_words])
            
            # 開始時間：第一個詞的時間
            start_time = sentence_words[0]['time']
            
            # 結束時間：如果有下一個句子，使用下一個句子第一個詞的時間
            # 否則，使用最後一個詞的時間 + 1秒緩衝
            if i < len(sentence_boundaries) - 1:
                next_sentence = sentence_boundaries[i + 1]
                end_time = next_sentence['words'][0]['time']
            else:
                end_time = sentence_words[-1]['time'] + 1.0
            
            sentences.append({
                'index': len(sentences),
                'start_time': start_time,
                'end_time': end_time,
                'text_en': sentence_text,
            })
        
        return sentences
    
    def _time_str_to_seconds(self, time_str: str) -> float:
        """
        將時間字串轉換為秒數
        
        格式: 00:00:12.345
        
        Args:
            time_str: 時間字串
            
        Returns:
            秒數（浮點數）
        """
        parts = time_str.split(':')
        if len(parts) == 3:
            h, m, s = parts
            return int(h) * 3600 + int(m) * 60 + float(s)
        elif len(parts) == 2:
            m, s = parts
            return int(m) * 60 + float(s)
        else:
            return float(time_str)
    
    def parse_srt(self, file_path: str) -> List[Dict]:
        """
        解析 SRT 字幕檔案
        
        Args:
            file_path: SRT 檔案路徑
            
        Returns:
            字幕分段列表
        """
        try:
            subs = pysrt.open(file_path, encoding='utf-8')
        except:
            # 嘗試其他編碼
            try:
                subs = pysrt.open(file_path, encoding='latin-1')
            except:
                subs = pysrt.open(file_path, encoding='cp1252')
        
        segments = []
        for idx, sub in enumerate(subs):
            # 轉換時間為秒數
            start_time = self._time_to_seconds(sub.start)
            end_time = self._time_to_seconds(sub.end)
            
            # 清理文字（移除特殊標記）
            text = self._clean_text(sub.text)
            
            if text.strip():  # 只保留非空白的字幕
                segments.append({
                    'index': idx,
                    'start_time': start_time,
                    'end_time': end_time,
                    'text_en': text,
                })
        
        return segments
    
    def translate_segments(self, segments: List[Dict], batch_size: int = 10) -> List[Dict]:
        """
        批次翻譯字幕分段
        
        Args:
            segments: 字幕分段列表
            batch_size: 批次大小
            
        Returns:
            包含翻譯的字幕分段列表
        """
        for i in range(0, len(segments), batch_size):
            batch = segments[i:i + batch_size]
            
            for segment in batch:
                try:
                    # 翻譯英文到繁體中文
                    translated = self.translator.translate(segment['text_en'])
                    segment['text_zh'] = translated
                    
                    # 生成字母模板
                    segment['letter_template'] = self.generate_letter_template(segment['text_en'])
                    
                    # 避免 API 限流
                    time.sleep(0.1)
                    
                except Exception as e:
                    print(f"翻譯錯誤 (段落 {segment['index']}): {str(e)}")
                    segment['text_zh'] = segment['text_en']  # 翻譯失敗時使用原文
                    segment['letter_template'] = self.generate_letter_template(segment['text_en'])
        
        return segments
    
    def generate_letter_template(self, text: str) -> str:
        """
        將英文句子轉換為字母模板
        
        Args:
            text: 英文句子
            
        Returns:
            字母模板（用 | 分隔）
            
        範例:
            Input: "Hello, world!"
            Output: "H|e|l|l|o|,| |w|o|r|l|d|!"
        """
        result = []
        for char in text:
            result.append(char)
            result.append('|')
        
        # 移除最後一個 |
        if result:
            result.pop()
        
        return ''.join(result)
    
    def _time_to_seconds(self, time_obj) -> float:
        """
        將 pysrt 時間物件轉換為秒數
        
        Args:
            time_obj: pysrt 時間物件
            
        Returns:
            秒數（浮點數）
        """
        return time_obj.hours * 3600 + time_obj.minutes * 60 + time_obj.seconds + time_obj.milliseconds / 1000.0
    
    def _clean_text(self, text: str) -> str:
        """
        清理字幕文字，移除特殊標記
        
        Args:
            text: 原始字幕文字
            
        Returns:
            清理後的文字
        """
        # 移除換行符號
        text = text.replace('\n', ' ')
        
        # 移除 HTML 標籤
        import re
        text = re.sub(r'<[^>]+>', '', text)
        
        # 移除多餘空格
        text = ' '.join(text.split())
        
        return text
    
    def parse_and_translate(self, file_path: str) -> List[Dict]:
        """
        解析並翻譯字幕檔案（一站式處理）
        
        支援 VTT 格式（逐字時間戳記，精確時間軸）
        
        Args:
            file_path: 字幕檔案路徑（VTT 或 SRT）
            
        Returns:
            包含翻譯和字母模板的字幕分段列表
        """
        # 判斷檔案格式
        if file_path.endswith('.vtt'):
            # 使用 VTT 逐字時間戳記解析
            print("[INFO] 使用 VTT 逐字時間戳記解析...")
            words = self.parse_vtt_word_timing(file_path)
            print(f"[INFO] 提取了 {len(words)} 個詞")
            
            # 合併成完整句子（使用精確時間軸）
            segments = self.merge_words_into_sentences(words)
            print(f"[INFO] 合併成 {len(segments)} 個完整句子")
        else:
            # 舊的 SRT 解析邏輯（保留兼容性）
            print("[INFO] 使用 SRT 解析...")
            segments = self.parse_srt(file_path)
        
        # 翻譯
        segments = self.translate_segments(segments)
        return segments


# 建立全域實例
subtitle_service = SubtitleService()

