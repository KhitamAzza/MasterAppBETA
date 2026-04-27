// ─── ESC/POS Encoder Class ──────────────────────────────────────────────────

class EscPosEncoder {
  encodeText(text) {
    const encoder = new TextEncoder();
    return Array.from(encoder.encode(text));
  }

  // GS v 0 - Print raster bit image
  // m=0, xL,xH=1 (width in bytes = 48 for 384px), yL,yH=height
  rasterImage(width, height, data) {
    const bytesPerRow = Math.ceil(width / 8);
    const xL = bytesPerRow & 0xFF;
    const xH = (bytesPerRow >> 8) & 0xFF;
    const yL = height & 0xFF;
    const yH = (height >> 8) & 0xFF;

    // GS v 0 m xL xH yL yH d1...dk
    // m=0 (normal), m=1 (double width), m=2 (double height), m=3 (quadruple)
    const commands = [0x1D, 0x76, 0x30, 0x00, xL, xH, yL, yH];
    commands.push(...Array.from(data));
    return commands;
  }
}
// Fetch QR image from URL and convert to 1-bit bitmap data
async function fetchQrImageData(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        // Scale to thermal printer width (384px for 58mm printer)
        const targetWidth = 256;
        const scale = targetWidth / img.width;
        const targetHeight = Math.round(img.height * scale);

        canvas.width = targetWidth;
        canvas.height = targetHeight;
        const ctx = canvas.getContext('2d');

        // Draw white background first
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, targetWidth, targetHeight);

        // Draw image centered
        ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

        const imageData = ctx.getImageData(0, 0, targetWidth, targetHeight);
        const data = imageData.data;

        // Convert to 1-bit (dithered)
        const bytesPerRow = Math.ceil(targetWidth / 8);
        const bitmap = new Uint8Array(bytesPerRow * targetHeight);

        for (let y = 0; y < targetHeight; y++) {
          for (let x = 0; x < targetWidth; x++) {
            const idx = (y * targetWidth + x) * 4;
            const r = data[idx];
            const g = data[idx + 1];
            const b = data[idx + 2];
            const gray = Math.round(0.299 * r + 0.587 * g + 0.114 * b);

            // Simple threshold (128) - QR codes are high contrast so this works well
            const bit = gray < 128 ? 1 : 0;
            const byteIndex = y * bytesPerRow + Math.floor(x / 8);
            const bitIndex = 7 - (x % 8);
            bitmap[byteIndex] |= (bit << bitIndex);
          }
        }

        resolve({
          width: targetWidth,
          height: targetHeight,
          data: bitmap
        });
      } catch (e) {
        reject(e);
      }
    };
    img.onerror = () => reject(new Error('Gagal memuat gambar QR'));
    img.src = url;
  });
}
// ─── Toast Indicator ────────────────────────────────────────────────────────

function showIndicator(type, message) {
  const indicator = document.getElementById('saveIndicator');
  if (!indicator) return;
  indicator.textContent = message;
  indicator.className = `save-indicator ${type} show`;
  setTimeout(() => indicator.classList.remove('show'), 2000);
}
