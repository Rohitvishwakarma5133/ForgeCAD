import sys
import cv2
import numpy as np

# Usage: python preprocess.py input_path output_path
inp = sys.argv[1]
outp = sys.argv[2]

img = cv2.imread(inp, cv2.IMREAD_GRAYSCALE)
if img is None:
    raise SystemExit('Failed to read input image')

# Denoise
img = cv2.medianBlur(img, 3)

# Adaptive threshold
thr = cv2.adaptiveThreshold(img, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
                            cv2.THRESH_BINARY, 31, 10)

# Optionally deskew using moments
coords = np.column_stack(np.where(thr > 0))
angle = 0.0
if coords.size:
    rect = cv2.minAreaRect(coords)
    angle = rect[-1]
    if angle < -45:
        angle = -(90 + angle)
    else:
        angle = -angle
    (h, w) = thr.shape[:2]
    M = cv2.getRotationMatrix2D((w // 2, h // 2), angle, 1.0)
    thr = cv2.warpAffine(thr, M, (w, h), flags=cv2.INTER_CUBIC, borderMode=cv2.BORDER_REPLICATE)

cv2.imwrite(outp, thr)
print('ok')
