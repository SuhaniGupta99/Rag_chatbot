import re

def clean_text(text: str) -> str:
    """
    Basic text cleaning:
    - Remove extra whitespace
    - Remove multiple newlines
    """
    text = re.sub(r'\n+', '\n', text)
    text = re.sub(r'\s+', ' ', text)
    return text.strip()
