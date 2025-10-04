import pytesseract
from PIL import Image

# If on Windows, specify the Tesseract exe path (only once)
pytesseract.pytesseract.tesseract_cmd = r"C:\Program Files\Tesseract-OCR\tesseract.exe"

# Open image
img = Image.open("sample_drawing.png")

# Run OCR
text = pytesseract.image_to_string(img)

print("Extracted Text:")
print(text)