import fitz
import logging

logger = logging.getLogger(__name__)

class PDFParser:
    @staticmethod
    def extract_text(file_bytes: bytes) -> str:
        """
        Extracts text from PDF bytes using PyMuPDF (fitz).
        Raises ValueError if PDF is invalid or cannot be parsed.
        """
        try:
            doc = fitz.open(stream=file_bytes, filetype="pdf")
        except Exception as e:
            logger.error(f"Failed to open PDF stream: {str(e)}", exc_info=True)
            raise ValueError(f"Invalid PDF file format: {str(e)}")

        text_content = []
        try:
            for page_num in range(len(doc)):
                page = doc.load_page(page_num)
                text = page.get_text()
                if text:
                    text_content.append(text)
        except Exception as e:
            logger.error(f"Error while reading pages: {str(e)}", exc_info=True)
            raise ValueError(f"Error extracting text from PDF: {str(e)}")
        finally:
            doc.close()

        final_text = "\n".join(text_content).strip()
        if not final_text:
            raise ValueError("The PDF document contains no extractable text.")
            
        return final_text
