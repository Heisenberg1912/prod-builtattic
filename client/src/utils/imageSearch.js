function readFileAsDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function loadImage(dataUrl) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = dataUrl;
  });
}

function rgbToHsl(r, g, b) {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h;
  let s;
  const l = (max + min) / 2;
  if (max === min) {
    h = 0;
    s = 0;
  } else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      default:
        h = (r - g) / d + 4;
        break;
    }
    h /= 6;
  }
  return { h: h * 360, s: s * 100, l: l * 100 };
}

function keywordsFromColor({ h, s, l }) {
  const keywords = [];
  if (l >= 70) keywords.push("bright");
  if (l <= 35) keywords.push("dramatic");
  if (s <= 25) keywords.push("minimal");
  if (s >= 55 && (h < 40 || h > 340)) keywords.push("warm");
  if (s >= 55 && h >= 40 && h <= 140) keywords.push("natural");
  if (h >= 180 && h <= 260) keywords.push("cool");
  if (h >= 260 && h <= 340) keywords.push("vibrant");
  if (!keywords.length) keywords.push("versatile");
  return keywords;
}

export async function analyzeImage(file) {
  if (!file) {
    throw new Error("Image file missing");
  }
  const dataUrl = await readFileAsDataURL(file);
  const img = await loadImage(dataUrl);
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  const targetSize = 32;
  canvas.width = targetSize;
  canvas.height = targetSize;
  ctx.drawImage(img, 0, 0, targetSize, targetSize);
  const { data } = ctx.getImageData(0, 0, targetSize, targetSize);
  let r = 0;
  let g = 0;
  let b = 0;
  let count = 0;
  for (let i = 0; i < data.length; i += 4) {
    r += data[i];
    g += data[i + 1];
    b += data[i + 2];
    count += 1;
  }
  r = Math.round(r / count);
  g = Math.round(g / count);
  b = Math.round(b / count);
  const hsl = rgbToHsl(r, g, b);
  const keywords = keywordsFromColor(hsl);
  return {
    dataUrl,
    averageColor: { r, g, b },
    keywords,
    hsl,
  };
}

