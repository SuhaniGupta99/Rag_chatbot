from pathlib import Path
from pypdf import PdfReader


def load_text_from_file(file_path: Path) -> str:
    """
    Load text from TXT or PDF files
    """
    suffix = file_path.suffix.lower()

    if suffix == ".txt":
        return file_path.read_text(encoding="utf-8", errors="ignore")

    if suffix == ".pdf":
        reader = PdfReader(str(file_path))
        text = ""

        for page in reader.pages:
            page_text = page.extract_text()
            if page_text:
                text += page_text + "\n"

        return text

    raise ValueError("Unsupported file type")
