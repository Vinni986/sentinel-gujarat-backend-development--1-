"""
Number Plate OCR Model
Uses EasyOCR for reading Indian vehicle registration plates
"""
import re
import numpy as np
from PIL import Image
import easyocr


class PlateReader:
    """
    Number plate OCR using EasyOCR
    Optimized for Indian vehicle registration formats
    """
    
    def __init__(self, gpu: bool = False):
        """
        Initialize EasyOCR reader
        Args:
            gpu: Use GPU acceleration (requires CUDA)
        """
        print("Initializing EasyOCR (this may take a minute on first run)...")
        self.reader = easyocr.Reader(['en'], gpu=gpu, verbose=False)
        print("EasyOCR initialized successfully")
    
    def read_plate(self, image_path_or_array) -> dict:
        """
        Read number plate from image
        
        Args:
            image_path_or_array: Image file path or numpy array
            
        Returns:
            Dict with raw text, normalized text, and confidence
            None if no text detected
        """
        # Read image
        if isinstance(image_path_or_array, str):
            image = np.array(Image.open(image_path_or_array))
        else:
            image = image_path_or_array
        
        # Run OCR
        results = self.reader.readtext(image)
        
        if not results:
            return None
        
        # Combine all detected text
        texts = []
        confidences = []
        
        for (bbox, text, confidence) in results:
            # Clean text (remove spaces, special chars)
            cleaned = re.sub(r'[^A-Z0-9]', '', text.upper())
            if cleaned:
                texts.append(cleaned)
                confidences.append(confidence)
        
        if not texts:
            return None
        
        # Combine all text fragments
        combined_text = ''.join(texts)
        avg_confidence = sum(confidences) / len(confidences) if confidences else 0.0
        
        # Normalize to Indian plate format
        normalized = self.normalize_indian_plate(combined_text)
        
        return {
            'raw': combined_text,
            'normalized': normalized,
            'confidence': round(avg_confidence, 4)
        }
    
    def normalize_indian_plate(self, text: str) -> str:
        """
        Normalize and extract an Indian vehicle registration number
        from noisy OCR output.

        Handles common OCR errors such as:
        - GJO1AB1234 -> GJ01AB1234
        - INDGJO1AB1234 -> GJ01AB1234
        - CARINDGJO1AB1234 -> GJ01AB1234
        """

        cleaned = re.sub(r'[^A-Z0-9]', '', text.upper())

        # Common OCR substitutions.
        # These are especially useful in the numeric district section.
        candidates = [
            cleaned,
            cleaned.replace('O', '0'),
            cleaned.replace('I', '1'),
            cleaned.replace('O', '0').replace('I', '1'),
        ]

        # Indian state/UT registration prefixes.
        state_codes = (
            "AN|AP|AR|AS|BR|CG|CH|DD|DL|DN|GA|GJ|HP|HR|JH|JK|KA|"
            "KL|LA|LD|MH|ML|MN|MP|MZ|NL|OD|PB|PY|RJ|SK|TN|TR|"
            "TS|UK|UP|WB"
        )

        # Search for a plate embedded inside noisy OCR.
        #
        # Supports:
        #   GJ01AB1234
        #   GJ1AB1234
        #   DL1CAB1234
        #
        # State + 1-2 digit district + 1-3 letter series + 4 digit number.
        pattern = re.compile(
            rf'({state_codes})([0-9]{{1,2}})([A-Z]{{1,3}})([0-9]{{4}})'
        )

        for candidate in candidates:
            match = pattern.search(candidate)

            if match:
                state, district, series, number = match.groups()

                # Indian registration numbers normally use a
                # two-digit district representation.
                district = district.zfill(2)

                return f"{state}{district}{series}{number}"

        # Additional targeted recovery for OCR confusion where
        # the first state/district portion contains O/I errors.
        #
        # Example:
        #   GJO1AB1234 -> GJ01AB1234
        corrected = cleaned.replace('O', '0').replace('I', '1')

        match = re.search(
            rf'({state_codes})([0-9]{{1,2}})([A-Z]{{1,3}})([0-9]{{4}})',
            corrected
        )

        if match:
            state, district, series, number = match.groups()
            district = district.zfill(2)
            return f"{state}{district}{series}{number}"

        # Preserve previous fallback behavior.
        return cleaned



# Global instance (singleton)
_plate_reader = None

def get_plate_reader() -> PlateReader:
    """Get or create global plate reader instance"""
    global _plate_reader
    if _plate_reader is None:
        _plate_reader = PlateReader(gpu=False)  # Set to True if GPU available
    return _plate_reader
