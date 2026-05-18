"""
Prompt 管理器 - YouTube 聽打練習應用

統一管理 AI Prompt 模板，模板以 .md 檔存放於 backend/prompts/ 資料夾
"""
from pathlib import Path
from jinja2 import Environment, FileSystemLoader

_PROMPTS_DIR = Path(__file__).parent.parent.parent.parent / "prompts"
_env = Environment(
    loader=FileSystemLoader(str(_PROMPTS_DIR)),
    keep_trailing_newline=True,
    trim_blocks=True,
    lstrip_blocks=True,
)


class PromptManager:
    """Prompt 管理器，從 md 模板檔載入並渲染 Prompt"""

    def get_explain_sentence_prompt(self, sentence: str, context: str = "") -> str:
        """
        取得句子解說 Prompt

        Args:
            sentence: 要解說的英文句子
            context: 上下文資訊（影片標題等），可為空

        Returns:
            渲染後的 Prompt 字串
        """
        return _env.get_template("explain_sentence.md").render(
            sentence=sentence,
            context=context,
        )
