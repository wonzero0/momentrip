import { useCallback, useEffect, useMemo, useState } from 'react';
import { CheckCircle2, ChevronLeft, Download, ImageIcon, RefreshCw, Share2 } from 'lucide-react';
import { AppScreen, DiaryType } from '../App';
import { api, shareText, todayIsoDate } from '../lib/api';
import type { TravelPhoto, TripRoom } from '../types';

interface Props {
  onNavigate: (s: AppScreen) => void;
  diaryType: DiaryType;
  setDiaryType: (t: DiaryType) => void;
  activeTrip: TripRoom | null;
}

const SCRAPBOOK_WIDTH = 1080;
const SCRAPBOOK_HEIGHT = 1920;

type DiaryConcept = 'scrapbook' | 'pixelFourCut';

const FRAME_LAYOUT = [
  { x: 72, y: 244, w: 630, h: 548, rotate: -2.6, accent: '#456F9C', tape: '#DDE8F5', bottomPad: 76 },
  { x: 612, y: 560, w: 378, h: 456, rotate: 3.4, accent: '#C8644D', tape: '#F0DED7', bottomPad: 74 },
  { x: 112, y: 934, w: 815, h: 548, rotate: 1.1, accent: '#4C8367', tape: '#DDE9DF', bottomPad: 78 },
  { x: 436, y: 1428, w: 548, h: 376, rotate: -2.1, accent: '#D48A3F', tape: '#F4E5CE', bottomPad: 70 },
];

function pixelFont(size: number, weight = 700) {
  return `${weight} ${size}px "NeoDunggeunmo", "Courier New", Menlo, Monaco, "Apple SD Gothic Neo", monospace`;
}

async function ensureScrapbookFontLoaded() {
  if (!('fonts' in document)) return;
  await document.fonts.load(pixelFont(26, 400), 'MomenTrip 여행 기록 0123');
  await document.fonts.ready;
}

function loadCanvasImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('스크랩북에 사용할 사진을 불러오지 못했습니다.'));
    image.src = src;
  });
}

function seededNoise(index: number) {
  const value = Math.sin(index * 12.9898) * 43758.5453;
  return value - Math.floor(value);
}

function drawRoundRect(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number) {
  const r = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + width - r, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + r);
  ctx.lineTo(x + width, y + height - r);
  ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
  ctx.lineTo(x + r, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function fitText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number) {
  const source = text.trim();
  if (ctx.measureText(source).width <= maxWidth) return source;
  const chars = Array.from(source);
  while (chars.length > 0 && ctx.measureText(`${chars.join('')}...`).width > maxWidth) chars.pop();
  return `${chars.join('')}...`;
}

function drawWrappedText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
  maxLines = 3,
) {
  const source = text.trim();
  if (!source) return 0;

  const hasSpaces = /\s/u.test(source);
  const tokens = hasSpaces ? source.split(/\s+/u) : Array.from(source);
  const joiner = hasSpaces ? ' ' : '';
  const lines: string[] = [];
  let line = '';

  tokens.forEach((token) => {
    const testLine = line ? `${line}${joiner}${token}` : token;
    if (ctx.measureText(testLine).width <= maxWidth || !line) {
      line = testLine;
      return;
    }
    lines.push(line);
    line = token;
  });
  if (line) lines.push(line);

  lines.slice(0, maxLines).forEach((item, index) => {
    ctx.fillText(item, x, y + index * lineHeight);
  });

  return Math.min(lines.length, maxLines) * lineHeight;
}

function drawImageContain(
  ctx: CanvasRenderingContext2D,
  image: HTMLImageElement,
  x: number,
  y: number,
  width: number,
  height: number,
) {
  const scale = Math.min(width / image.naturalWidth, height / image.naturalHeight);
  const drawWidth = image.naturalWidth * scale;
  const drawHeight = image.naturalHeight * scale;
  const drawX = x + (width - drawWidth) / 2;
  const drawY = y + (height - drawHeight) / 2;
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(image, drawX, drawY, drawWidth, drawHeight);
}

function drawPixelImageContain(
  ctx: CanvasRenderingContext2D,
  image: HTMLImageElement,
  x: number,
  y: number,
  width: number,
  height: number,
) {
  const scale = Math.min(width / image.naturalWidth, height / image.naturalHeight);
  const drawWidth = image.naturalWidth * scale;
  const drawHeight = image.naturalHeight * scale;
  const drawX = x + (width - drawWidth) / 2;
  const drawY = y + (height - drawHeight) / 2;
  const pixelSize = 7;
  const offscreen = document.createElement('canvas');
  offscreen.width = Math.max(1, Math.round(drawWidth / pixelSize));
  offscreen.height = Math.max(1, Math.round(drawHeight / pixelSize));
  const offscreenCtx = offscreen.getContext('2d');
  if (!offscreenCtx) {
    drawImageContain(ctx, image, x, y, width, height);
    return;
  }

  offscreenCtx.imageSmoothingEnabled = true;
  offscreenCtx.imageSmoothingQuality = 'high';
  offscreenCtx.drawImage(image, 0, 0, offscreen.width, offscreen.height);

  ctx.save();
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(offscreen, drawX, drawY, drawWidth, drawHeight);
  ctx.restore();
}

function drawPaper(ctx: CanvasRenderingContext2D) {
  ctx.fillStyle = '#FFFDF9';
  ctx.fillRect(0, 0, SCRAPBOOK_WIDTH, SCRAPBOOK_HEIGHT);

  ctx.globalAlpha = 0.18;
  for (let i = 0; i < 2600; i += 1) {
    const x = seededNoise(i) * SCRAPBOOK_WIDTH;
    const y = seededNoise(i + 940) * SCRAPBOOK_HEIGHT;
    const size = seededNoise(i + 121) > 0.92 ? 2 : 1;
    ctx.fillStyle = seededNoise(i + 45) > 0.52 ? '#E9E3D7' : '#F5EFE4';
    ctx.fillRect(x, y, size, size);
  }

  ctx.globalAlpha = 0.06;
  ctx.strokeStyle = '#8E8477';
  ctx.lineWidth = 2;
  const creases = [
    { x1: 154, y1: 40, x2: 108, y2: 740, x3: 198, y3: 1320, x4: 152, y4: 1882 },
    { x1: 910, y1: 76, x2: 962, y2: 642, x3: 876, y3: 1180, x4: 944, y4: 1810 },
    { x1: 28, y1: 1326, x2: 292, y2: 1270, x3: 720, y3: 1334, x4: 1040, y4: 1274 },
  ];
  creases.forEach((line) => {
    ctx.beginPath();
    ctx.moveTo(line.x1, line.y1);
    ctx.bezierCurveTo(line.x2, line.y2, line.x3, line.y3, line.x4, line.y4);
    ctx.stroke();
  });

  ctx.globalAlpha = 1;
}

function drawPixelBlock(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, color: string) {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, width, height);
}

function drawTinyPixelCar(ctx: CanvasRenderingContext2D, x: number, y: number, scale = 1) {
  const s = 7 * scale;
  ctx.save();
  drawPixelBlock(ctx, x + s, y + s, s * 6, s, '#7D8F7A');
  drawPixelBlock(ctx, x + s * 2, y, s * 3, s, '#AFC2D3');
  drawPixelBlock(ctx, x, y + s * 2, s * 8, s * 2, '#7D8F7A');
  drawPixelBlock(ctx, x + s, y + s * 4, s, s, '#3E3A34');
  drawPixelBlock(ctx, x + s * 6, y + s * 4, s, s, '#3E3A34');
  ctx.restore();
}

function drawTinyPixelTree(ctx: CanvasRenderingContext2D, x: number, y: number, scale = 1) {
  const s = 7 * scale;
  ctx.save();
  drawPixelBlock(ctx, x + s * 2, y, s, s, '#879B78');
  drawPixelBlock(ctx, x + s, y + s, s * 3, s, '#879B78');
  drawPixelBlock(ctx, x, y + s * 2, s * 5, s, '#6F8564');
  drawPixelBlock(ctx, x + s * 2, y + s * 3, s, s * 2, '#8B735E');
  ctx.restore();
}

function drawTinyPixelPin(ctx: CanvasRenderingContext2D, x: number, y: number, scale = 1) {
  const s = 6 * scale;
  ctx.save();
  drawPixelBlock(ctx, x + s, y, s * 3, s, '#B87962');
  drawPixelBlock(ctx, x, y + s, s * 5, s * 3, '#B87962');
  drawPixelBlock(ctx, x + s * 2, y + s * 2, s, s, '#FFFDF9');
  drawPixelBlock(ctx, x + s * 2, y + s * 4, s, s, '#B87962');
  drawPixelBlock(ctx, x + s * 2, y + s * 5, s, s, '#B87962');
  ctx.restore();
}

function drawTinyPixelCamera(ctx: CanvasRenderingContext2D, x: number, y: number, scale = 1) {
  const s = 6 * scale;
  ctx.save();
  drawPixelBlock(ctx, x + s, y, s * 3, s, '#8FA8BE');
  drawPixelBlock(ctx, x, y + s, s * 7, s * 5, '#5F7280');
  drawPixelBlock(ctx, x + s * 2, y + s * 2, s * 3, s * 3, '#2F3131');
  drawPixelBlock(ctx, x + s * 3, y + s * 3, s, s, '#D8E5EA');
  ctx.restore();
}

function drawTinyPixelWave(ctx: CanvasRenderingContext2D, x: number, y: number, scale = 1) {
  const s = 6 * scale;
  ctx.save();
  ['#8FA8BE', '#B7C9D6', '#8FA8BE'].forEach((color, index) => {
    drawPixelBlock(ctx, x + index * s * 4, y + (index % 2) * s, s * 3, s, color);
    drawPixelBlock(ctx, x + s + index * s * 4, y + s + (index % 2) * s, s * 3, s, color);
  });
  ctx.restore();
}

function drawPixelFourCutDecorations(ctx: CanvasRenderingContext2D) {
  ctx.save();
  ctx.globalAlpha = 0.88;
  drawTinyPixelCar(ctx, 156, 224, 1);
  drawTinyPixelTree(ctx, 850, 250, 1.05);
  drawTinyPixelCamera(ctx, 132, 1320, 1);
  drawTinyPixelPin(ctx, 866, 1290, 1);
  drawTinyPixelWave(ctx, 804, 1600, 1);
  drawTinyPixelTree(ctx, 178, 1648, 0.9);

  ctx.strokeStyle = '#B9B0A3';
  ctx.lineWidth = 4;
  ctx.setLineDash([12, 18]);
  ctx.beginPath();
  ctx.moveTo(140, 420);
  ctx.bezierCurveTo(90, 650, 134, 910, 94, 1140);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(948, 420);
  ctx.bezierCurveTo(1006, 700, 946, 1008, 992, 1260);
  ctx.stroke();
  ctx.setLineDash([]);

  ctx.fillStyle = '#4A4742';
  for (let i = 0; i < 12; i += 1) {
    const x = 178 + (i % 4) * 24;
    const y = 520 + Math.floor(i / 4) * 24;
    ctx.fillRect(x, y, 5, 5);
  }
  for (let i = 0; i < 10; i += 1) {
    ctx.fillRect(846 + (i % 5) * 22, 510 + Math.floor(i / 5) * 22, 5, 5);
  }
  ctx.restore();
}

function drawPixelFourCutFrame(ctx: CanvasRenderingContext2D, image: HTMLImageElement, index: number) {
  const stripX = 252;
  const frameW = 576;
  const frameH = 314;
  const gap = 30;
  const top = 244;
  const x = stripX + 28;
  const y = top + index * (frameH + gap) + 28;
  const photoW = frameW - 56;
  const photoH = frameH - 56;

  ctx.save();
  ctx.shadowColor = 'rgba(43,39,34,0.08)';
  ctx.shadowBlur = 16;
  ctx.shadowOffsetY = 10;
  drawRoundRect(ctx, stripX, top + index * (frameH + gap), frameW, frameH, 22);
  ctx.fillStyle = '#FFFDF9';
  ctx.fill();
  ctx.shadowColor = 'transparent';
  ctx.strokeStyle = '#E1D8C9';
  ctx.lineWidth = 4;
  ctx.stroke();

  drawRoundRect(ctx, x, y, photoW, photoH, 12);
  ctx.clip();
  ctx.fillStyle = '#F0ECE3';
  ctx.fillRect(x, y, photoW, photoH);
  drawPixelImageContain(ctx, image, x, y, photoW, photoH);
  ctx.restore();
}

function drawPixelFourCut(ctx: CanvasRenderingContext2D, images: HTMLImageElement[]) {
  drawPaper(ctx);
  drawPixelFourCutDecorations(ctx);

  const stripX = 232;
  const stripY = 210;
  const stripW = 616;
  const stripH = 1416;
  ctx.save();
  ctx.shadowColor = 'rgba(43,39,34,0.15)';
  ctx.shadowBlur = 34;
  ctx.shadowOffsetY = 18;
  drawRoundRect(ctx, stripX, stripY, stripW, stripH, 34);
  ctx.fillStyle = '#FAF7EF';
  ctx.fill();
  ctx.shadowColor = 'transparent';
  ctx.strokeStyle = '#E2D9CC';
  ctx.lineWidth = 4;
  ctx.stroke();
  ctx.restore();

  images.forEach((image, index) => drawPixelFourCutFrame(ctx, image, index));

  ctx.save();
  ctx.fillStyle = '#4B4B48';
  ctx.font = '400 24px -apple-system, BlinkMacSystemFont, "Helvetica Neue", Arial, sans-serif';
  ctx.fillText('@Momentrip', 78, 1826);
  ctx.restore();
}

function drawTape(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, rotate: number, color: string, height = 32) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate((rotate * Math.PI) / 180);
  ctx.globalAlpha = 0.76;
  ctx.fillStyle = color;
  ctx.fillRect(-width / 2, -height / 2, width, height);
  ctx.globalAlpha = 0.2;
  ctx.strokeStyle = '#FFFFFF';
  ctx.lineWidth = 2;
  for (let i = -width / 2 + 12; i < width / 2; i += 22) {
    ctx.beginPath();
    ctx.moveTo(i, -height / 2);
    ctx.lineTo(i + 10, height / 2);
    ctx.stroke();
  }
  ctx.restore();
  ctx.globalAlpha = 1;
}

function drawSpark(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, color: string) {
  ctx.strokeStyle = color;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(x - size, y);
  ctx.lineTo(x + size, y);
  ctx.moveTo(x, y - size);
  ctx.lineTo(x, y + size);
  ctx.stroke();
}

function drawGridPatch(ctx: CanvasRenderingContext2D, x: number, y: number, cols: number, rows: number, color: string) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.5;
  ctx.globalAlpha = 0.34;
  for (let i = 0; i <= cols; i += 1) {
    ctx.beginPath();
    ctx.moveTo(x + i * 18, y);
    ctx.lineTo(x + i * 18, y + rows * 18);
    ctx.stroke();
  }
  for (let i = 0; i <= rows; i += 1) {
    ctx.beginPath();
    ctx.moveTo(x, y + i * 18);
    ctx.lineTo(x + cols * 18, y + i * 18);
    ctx.stroke();
  }
  ctx.restore();
}

function drawArrow(ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number, color: string) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 4;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
  const angle = Math.atan2(y2 - y1, x2 - x1);
  ctx.beginPath();
  ctx.moveTo(x2, y2);
  ctx.lineTo(x2 - Math.cos(angle - 0.55) * 24, y2 - Math.sin(angle - 0.55) * 24);
  ctx.moveTo(x2, y2);
  ctx.lineTo(x2 - Math.cos(angle + 0.55) * 24, y2 - Math.sin(angle + 0.55) * 24);
  ctx.stroke();
  ctx.restore();
}

function drawHeart(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, color: string) {
  ctx.save();
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x, y + size * 0.36);
  ctx.bezierCurveTo(x - size, y - size * 0.26, x - size * 0.54, y - size, x, y - size * 0.46);
  ctx.bezierCurveTo(x + size * 0.54, y - size, x + size, y - size * 0.26, x, y + size * 0.36);
  ctx.fill();
  ctx.restore();
}

function drawPaperClip(ctx: CanvasRenderingContext2D, x: number, y: number, rotate: number) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate((rotate * Math.PI) / 180);
  ctx.strokeStyle = '#303030';
  ctx.lineWidth = 4;
  drawRoundRect(ctx, -18, -44, 36, 88, 18);
  ctx.stroke();
  drawRoundRect(ctx, -8, -31, 16, 62, 8);
  ctx.stroke();
  ctx.restore();
}

function drawLabel(ctx: CanvasRenderingContext2D, x: number, y: number, text: string, color: string, rotate = 0) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate((rotate * Math.PI) / 180);
  ctx.font = pixelFont(22, 400);
  const width = Math.max(126, ctx.measureText(text).width + 38);
  drawRoundRect(ctx, 0, 0, width, 42, 4);
  ctx.fillStyle = 'rgba(255,255,255,0.88)';
  ctx.fill();
  ctx.strokeStyle = '#242424';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = color;
  ctx.fillRect(10, 13, 10, 16);
  ctx.fillStyle = '#242424';
  ctx.fillText(text, 28, 27);
  ctx.restore();
}

function drawHeader(ctx: CanvasRenderingContext2D, title: string) {
  ctx.fillStyle = '#242424';
  ctx.font = pixelFont(30, 400);
  ctx.textAlign = 'right';
  ctx.fillText('#Momentrip', SCRAPBOOK_WIDTH - 78, 78);
  ctx.textAlign = 'left';

  ctx.font = pixelFont(62, 400);
  ctx.fillText(fitText(ctx, title.trim() || 'TRAVEL SCRAP', 604), 78, 100);

  ctx.font = pixelFont(25, 400);
  ctx.fillStyle = '#4E4E4E';
  ctx.fillText(todayIsoDate().replaceAll('-', ' / '), 82, 158);

  ctx.strokeStyle = '#242424';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(78, 190);
  ctx.lineTo(422, 190);
  ctx.stroke();

  drawLabel(ctx, 750, 130, 'MISSION LOG / 04', '#4C8367', -1.2);
}

function drawBackgroundDetails(ctx: CanvasRenderingContext2D) {
  drawGridPatch(ctx, 764, 246, 8, 4, '#456F9C');
  drawGridPatch(ctx, 72, 812, 5, 4, '#B9AA9A');
  drawGridPatch(ctx, 210, 1608, 5, 5, '#D48A3F');

  ctx.save();
  ctx.fillStyle = '#242424';
  ctx.globalAlpha = 0.9;
  for (let i = 0; i < 5; i += 1) {
    ctx.beginPath();
    ctx.arc(955, 1116 + i * 22, 4, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawSmallStickers(ctx: CanvasRenderingContext2D, memo: string) {
  ctx.save();
  ctx.strokeStyle = '#252525';
  ctx.fillStyle = '#252525';
  ctx.lineWidth = 3;

  drawSpark(ctx, 910, 214, 12, '#242424');
  drawSpark(ctx, 142, 824, 10, '#456F9C');
  drawSpark(ctx, 954, 1268, 11, '#D48A3F');
  drawSpark(ctx, 364, 1512, 9, '#4C8367');
  drawHeart(ctx, 922, 1060, 17, '#C8644D');
  drawArrow(ctx, 252, 852, 360, 902, '#242424');

  ctx.font = pixelFont(23, 400);
  ctx.fillText('CHECK', 82, 880);
  ctx.strokeRect(180, 861, 26, 26);
  ctx.beginPath();
  ctx.moveTo(185, 875);
  ctx.lineTo(195, 884);
  ctx.lineTo(214, 860);
  ctx.stroke();

  ctx.setLineDash([9, 8]);
  ctx.strokeStyle = '#B8AEA0';
  ctx.strokeRect(78, 1536, 286, 205);
  ctx.setLineDash([]);

  ctx.font = pixelFont(25, 400);
  ctx.fillStyle = '#242424';
  ctx.fillText('NOTES', 96, 1582);
  ctx.font = pixelFont(22, 400);
  drawWrappedText(ctx, memo || '미션 사진 4장으로 완성한 여행 스크랩북.', 96, 1624, 234, 31, 4);

  drawTape(ctx, 220, 1536, 120, -4, '#E8F0E7', 28);
  drawPaperClip(ctx, 948, 1390, 11);

  ctx.restore();
}

function drawFrame(
  ctx: CanvasRenderingContext2D,
  image: HTMLImageElement,
  index: number,
  caption: string,
) {
  const frame = FRAME_LAYOUT[index];
  const centerX = frame.x + frame.w / 2;
  const centerY = frame.y + frame.h / 2;
  const pad = 22;
  const bottomPad = frame.bottomPad;
  const photoX = -frame.w / 2 + pad;
  const photoY = -frame.h / 2 + pad;
  const photoW = frame.w - pad * 2;
  const photoH = frame.h - pad * 2 - bottomPad;

  ctx.save();
  ctx.translate(centerX, centerY);
  ctx.rotate((frame.rotate * Math.PI) / 180);

  ctx.shadowColor = 'rgba(34,28,22,0.18)';
  ctx.shadowBlur = 30;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 18;
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(-frame.w / 2, -frame.h / 2, frame.w, frame.h);
  ctx.shadowColor = 'transparent';

  ctx.fillStyle = '#F7F5EF';
  ctx.fillRect(photoX, photoY, photoW, photoH);
  drawImageContain(ctx, image, photoX, photoY, photoW, photoH);

  ctx.strokeStyle = 'rgba(35,35,35,0.08)';
  ctx.lineWidth = 3;
  ctx.strokeRect(photoX, photoY, photoW, photoH);

  drawTape(ctx, -frame.w * 0.22, -frame.h / 2 + 8, frame.w * 0.28, -7, frame.tape, 24);

  ctx.fillStyle = '#222222';
  ctx.font = pixelFont(index === 2 ? 26 : 23, 400);
  ctx.fillText(`NO.${String(index + 1).padStart(2, '0')}`, photoX, photoY + photoH + 30);

  ctx.fillStyle = frame.accent;
  ctx.fillRect(photoX, photoY + photoH + 45, 52, 7);

  ctx.fillStyle = '#333333';
  ctx.font = pixelFont(index === 2 ? 24 : 21, 400);
  drawWrappedText(ctx, caption, photoX + 75, photoY + photoH + 30, photoW - 88, index === 2 ? 31 : 28, 2);

  ctx.restore();
}

function captionParts(memo: string, photos: TravelPhoto[]) {
  const parts = memo
    .split(/\n+|[.!?。！？]+|[,，]+/u)
    .map((item) => item.trim())
    .filter(Boolean);

  return photos.map((photo, index) => {
    const source = parts[index] || photo.label || `Moment ${index + 1}`;
    const chars = Array.from(source);
    return chars.length > 44 ? `${chars.slice(0, 44).join('')}...` : source;
  });
}

function outputFileName(concept: DiaryConcept) {
  const type = concept === 'pixelFourCut' ? 'pixel-fourcut' : 'scrapbook';
  return `momentrip-${type}-${todayIsoDate()}.png`;
}

function downloadDataUrl(dataUrl: string, concept: DiaryConcept) {
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = outputFileName(concept);
  document.body.appendChild(link);
  link.click();
  link.remove();
}

export function DiaryScreen({ onNavigate, diaryType, setDiaryType, activeTrip }: Props) {
  const [missionPhotos, setMissionPhotos] = useState<TravelPhoto[]>([]);
  const [memo, setMemo] = useState('오늘의 여행에서 반짝였던 순간들.');
  const [title, setTitle] = useState('TRAVEL SCRAP');
  const [scrapbookDataUrl, setScrapbookDataUrl] = useState<string | null>(null);
  const [selectedConcept, setSelectedConcept] = useState<DiaryConcept>('scrapbook');
  const [loadingPhotos, setLoadingPhotos] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [notice, setNotice] = useState('');
  const [lastSavedId, setLastSavedId] = useState<string | null>(null);
  const [selectedPhotoIds, setSelectedPhotoIds] = useState<string[]>([]);

  const selectedPhotos = useMemo(
    () => selectedPhotoIds
      .map((id) => missionPhotos.find((photo) => photo.id === id))
      .filter((photo): photo is TravelPhoto => Boolean(photo)),
    [missionPhotos, selectedPhotoIds],
  );
  const conceptLabel = selectedConcept === 'pixelFourCut' ? '2번 컨셉 픽셀 네컷' : '1번 컨셉 스크랩북';

  const loadMissionPhotos = useCallback(async () => {
    setLoadingPhotos(true);
    setNotice('');
    try {
      const photos = await api.photos(undefined, activeTrip?.id);
      const missionSource = activeTrip?.id ? `mission:${activeTrip.id}` : 'mission';
      const next = photos.filter((photo) => {
        if (activeTrip?.id) return photo.roomId === activeTrip.id || photo.source === missionSource || photo.source.startsWith(`${missionSource}:`);
        return photo.source === 'mission' || photo.source.startsWith('mission:');
      });
      setMissionPhotos(next);
      setSelectedPhotoIds((prev) => {
        const validIds = new Set(next.map((photo) => photo.id));
        const kept = prev.filter((id) => validIds.has(id)).slice(0, 4);
        if (kept.length > 0) return kept;
        return next.length === 4 ? next.map((photo) => photo.id) : [];
      });
      setScrapbookDataUrl(null);
      if (next.length < 4) {
        setNotice(`현재 여행의 미션 사진이 ${next.length}장입니다. 결과물은 미션 사진 4장이 필요합니다.`);
      } else if (next.length > 4) {
        setNotice(`현재 여행의 미션 사진 ${next.length}장 중 결과물에 넣을 사진 4장을 선택해주세요.`);
      }
    } catch (error) {
      setNotice(error instanceof Error ? error.message : '미션 사진을 불러오지 못했습니다.');
    } finally {
      setLoadingPhotos(false);
    }
  }, [activeTrip?.id]);

  useEffect(() => {
    if (!diaryType) return;
    void loadMissionPhotos();
  }, [diaryType, loadMissionPhotos]);

  const togglePhotoSelection = (photoId: string) => {
    setScrapbookDataUrl(null);
    setSaved(false);
    setNotice('');
    if (selectedPhotoIds.includes(photoId)) {
      setSelectedPhotoIds((prev) => prev.filter((id) => id !== photoId));
      return;
    }
    if (selectedPhotoIds.length >= 4) {
      setNotice('결과물에는 사진 4장만 선택할 수 있습니다. 다른 사진을 빼고 다시 선택해주세요.');
      return;
    }
    setSelectedPhotoIds((prev) => [...prev, photoId]);
  };

  const generateScrapbook = useCallback(async () => {
    if (selectedPhotos.length !== 4) {
      setNotice('미션에서 업로드한 사진 4장을 선택해야 만들 수 있습니다.');
      return null;
    }

    setGenerating(true);
    setNotice('');
    try {
      await ensureScrapbookFontLoaded();
      const images = await Promise.all(selectedPhotos.map((photo) => loadCanvasImage(photo.dataUrl)));
      const canvas = document.createElement('canvas');
      canvas.width = SCRAPBOOK_WIDTH;
      canvas.height = SCRAPBOOK_HEIGHT;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('브라우저 캔버스를 사용할 수 없습니다.');

      if (selectedConcept === 'pixelFourCut') {
        drawPixelFourCut(ctx, images);
      } else {
        drawPaper(ctx);
        drawBackgroundDetails(ctx);
        drawHeader(ctx, title);

        const captions = captionParts(memo, selectedPhotos);
        images.forEach((image, index) => drawFrame(ctx, image, index, captions[index]));
        drawSmallStickers(ctx, memo);

        ctx.strokeStyle = '#222222';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(78, 1840);
        ctx.lineTo(1002, 1840);
        ctx.stroke();
        ctx.font = pixelFont(21, 400);
        ctx.fillStyle = '#555555';
        ctx.fillText('4 ORIGINAL MISSION PHOTOS ONLY / CLEAN JOURNAL PAGE', 78, 1876);
      }

      const dataUrl = canvas.toDataURL('image/png');
      setScrapbookDataUrl(dataUrl);
      return dataUrl;
    } catch (error) {
      setNotice(error instanceof Error ? error.message : '이미지 생성에 실패했습니다.');
      return null;
    } finally {
      setGenerating(false);
    }
  }, [memo, selectedConcept, selectedPhotos, title]);

  const handleSave = async () => {
    const dataUrl = scrapbookDataUrl || await generateScrapbook();
    if (!dataUrl) return;

    setSaving(true);
    setNotice('');
    try {
      if (selectedConcept === 'pixelFourCut') {
        await api.saveFourCut({
          photoIds: selectedPhotoIds,
          filter: 'premium-minimal-korean-domestic-pixel-fourcut',
          imageDataUrl: dataUrl,
        }).catch(() => undefined);
      }
      const diary = await api.saveDiary({
        date: todayIsoDate(),
        title: selectedConcept === 'pixelFourCut' ? 'PIXEL FOUR CUT' : title.trim() || 'TRAVEL SCRAP',
        text: selectedConcept === 'pixelFourCut' ? '2번 컨셉 픽셀 네컷 포토부스' : memo,
        photoIds: selectedPhotoIds,
        imageDataUrl: dataUrl,
      });
      setLastSavedId(diary.id);
      setSaved(true);
      setTimeout(() => setSaved(false), 1800);
      setNotice(`${conceptLabel} 이미지가 서버에 저장되었습니다.`);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : '이미지 저장에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  };

  const handleDownload = async () => {
    const dataUrl = scrapbookDataUrl || await generateScrapbook();
    if (!dataUrl) return;
    downloadDataUrl(dataUrl, selectedConcept);
  };

  const handleShare = async () => {
    const dataUrl = scrapbookDataUrl || await generateScrapbook();
    if (!dataUrl) return;

    try {
      downloadDataUrl(dataUrl, selectedConcept);
      await shareText('MomenTrip 여행 다이어리', selectedConcept === 'pixelFourCut' ? '2번 컨셉 픽셀 네컷 포토부스' : `${title}\n${memo}`);
      await api.share({ kind: 'diary', targetId: lastSavedId || undefined, channel: 'system' }).catch(() => undefined);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : '공유에 실패했습니다.');
    }
  };

  if (!diaryType) {
    return (
      <div className="w-full h-full flex flex-col" style={{ background: '#FAF8F5', fontFamily: "'Noto Sans KR', sans-serif" }}>
        <div className="px-5 pt-4 pb-2 flex-shrink-0 flex items-center gap-3">
          <button onClick={() => onNavigate('mission')} className="w-10 h-10 flex items-center justify-center rounded-xl active:opacity-60" style={{ background: '#EDE5DB' }}>
            <ChevronLeft size={20} color="#2A1F1A" />
          </button>
          <p style={{ fontSize: 18, fontWeight: 700, color: '#2A1F1A' }}>여행 기록</p>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center px-6">
          <button
            onClick={() => {
              setDiaryType('scrapbook');
              void loadMissionPhotos();
            }}
            className="w-full rounded-3xl p-6 text-left active:scale-95 transition-all flex items-center gap-5"
            style={{ background: '#FFFFFF', boxShadow: '0 8px 24px rgba(42,31,26,0.1)', border: '1.5px solid rgba(201,124,86,0.12)' }}
          >
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ background: 'linear-gradient(135deg, #F5EFE6, #EDE5DB)' }}>
              <ImageIcon size={24} color="#C97C56" />
            </div>
            <div>
              <p style={{ fontSize: 17, fontWeight: 700, color: '#2A1F1A' }}>여행 다이어리 이미지</p>
              <p style={{ fontSize: 12, color: '#9E8B7E', marginTop: 3 }}>미션 사진 4장으로 컨셉 이미지를 만들어요</p>
            </div>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col" style={{ background: '#FAF8F5', fontFamily: "'Noto Sans KR', sans-serif" }}>
      <div className="px-5 pt-4 pb-2 flex-shrink-0 flex items-center gap-3">
        <button onClick={() => onNavigate('mission')} className="w-10 h-10 flex items-center justify-center rounded-xl active:opacity-60" style={{ background: '#EDE5DB' }}>
          <ChevronLeft size={20} color="#2A1F1A" />
        </button>
        <div className="flex-1">
          <p style={{ fontSize: 18, fontWeight: 800, color: '#2A1F1A' }}>여행 다이어리 이미지</p>
          <p style={{ fontSize: 11, color: '#9E8B7E' }}>
            {conceptLabel} · {activeTrip ? activeTrip.name : '현재'} 미션 사진 4장만 사용
          </p>
        </div>
        <button onClick={loadMissionPhotos} disabled={loadingPhotos} className="w-10 h-10 flex items-center justify-center rounded-xl active:opacity-70" style={{ background: '#EDE5DB' }}>
          <RefreshCw size={17} color="#2A1F1A" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-5 pb-4">
        <div className="rounded-2xl p-4 mb-3" style={{ background: '#FFFFFF', boxShadow: '0 2px 12px rgba(42,31,26,0.06)' }}>
          <div className="flex items-center justify-between mb-3">
            <p style={{ fontSize: 13, fontWeight: 800, color: '#2A1F1A' }}>사용 사진 선택</p>
            <span style={{ fontSize: 11, fontWeight: 800, color: selectedPhotos.length === 4 ? '#2A8B4A' : '#C97C56' }}>
              {selectedPhotos.length}/4
            </span>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {Array.from({ length: 4 }).map((_, index) => {
              const photo = selectedPhotos[index];
              return (
                <button
                  key={photo?.id || index}
                  onClick={() => photo && togglePhotoSelection(photo.id)}
                  className="rounded-xl overflow-hidden flex items-center justify-center relative active:scale-95"
                  style={{ aspectRatio: '1', background: '#F0EAE2', border: photo ? '2px solid #2A1F1A' : '2px dashed #D8CCB8' }}
                >
                  {photo ? (
                    <>
                      <img src={photo.dataUrl} alt={photo.label} className="w-full h-full object-contain" />
                      <span
                        className="absolute top-1 left-1 w-5 h-5 rounded-full flex items-center justify-center"
                        style={{ background: '#2A1F1A', color: '#FFFFFF', fontSize: 10, fontWeight: 900 }}
                      >
                        {index + 1}
                      </span>
                    </>
                  ) : (
                    <ImageIcon size={18} color="#B9A79A" />
                  )}
                </button>
              );
            })}
          </div>
          <p style={{ fontSize: 10, color: '#9E8B7E', marginTop: 8 }}>
            위 순서대로 결과물에 배치됩니다. 선택된 사진을 다시 누르면 제외됩니다.
          </p>
          <div className="mt-4 pt-4" style={{ borderTop: '1px solid rgba(42,31,26,0.06)' }}>
            <div className="flex items-center justify-between mb-3">
              <p style={{ fontSize: 12, fontWeight: 800, color: '#6B5040' }}>현재 여행 미션 사진</p>
              <span style={{ fontSize: 10, color: '#9E8B7E' }}>{missionPhotos.length}장</span>
            </div>
            {missionPhotos.length > 0 ? (
              <div className="grid grid-cols-3 gap-2">
                {missionPhotos.map((photo) => {
                  const selectedIndex = selectedPhotoIds.indexOf(photo.id);
                  const isSelected = selectedIndex >= 0;
                  return (
                    <button
                      key={photo.id}
                      onClick={() => togglePhotoSelection(photo.id)}
                      className="rounded-xl overflow-hidden relative active:scale-95 transition-all"
                      style={{
                        aspectRatio: '1',
                        background: '#F0EAE2',
                        border: isSelected ? '3px solid #C97C56' : '1.5px solid rgba(42,31,26,0.08)',
                        boxShadow: isSelected ? '0 6px 16px rgba(201,124,86,0.22)' : 'none',
                      }}
                    >
                      <img src={photo.dataUrl} alt={photo.label} className="w-full h-full object-contain" />
                      <div
                        className="absolute inset-x-0 bottom-0 px-2 py-1"
                        style={{ background: 'linear-gradient(to top, rgba(42,31,26,0.72), rgba(42,31,26,0))' }}
                      >
                        <p style={{ color: '#FFFFFF', fontSize: 9, fontWeight: 800, textAlign: 'left', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {photo.label}
                        </p>
                      </div>
                      {isSelected && (
                        <div
                          className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full flex items-center justify-center"
                          style={{ background: '#C97C56', color: '#FFFFFF', fontSize: 11, fontWeight: 900, border: '2px solid #FFFFFF' }}
                        >
                          {selectedIndex + 1}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="rounded-xl flex items-center justify-center" style={{ height: 92, background: '#F5EFE6', color: '#9E8B7E', fontSize: 11 }}>
                {loadingPhotos ? '미션 사진을 불러오는 중입니다.' : '현재 여행의 미션 사진이 없습니다.'}
              </div>
            )}
          </div>
        </div>

        <div className="rounded-2xl p-4 mb-3" style={{ background: '#FFFFFF', boxShadow: '0 2px 12px rgba(42,31,26,0.06)' }}>
          <p style={{ fontSize: 13, fontWeight: 800, color: '#2A1F1A', marginBottom: 10 }}>컨셉 선택</p>
          <div className="grid grid-cols-2 gap-2">
            {[
              { id: 'scrapbook' as DiaryConcept, title: '1번 컨셉', desc: '기존 프리미엄 스크랩북' },
              { id: 'pixelFourCut' as DiaryConcept, title: '2번 컨셉', desc: '국내여행 픽셀 네컷' },
            ].map((item) => {
              const active = selectedConcept === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setSelectedConcept(item.id);
                    setScrapbookDataUrl(null);
                    setSaved(false);
                    setNotice('');
                  }}
                  className="rounded-2xl p-3 text-left active:scale-95 transition-all"
                  style={{
                    background: active ? '#2A1F1A' : '#F5EFE6',
                    color: active ? '#FFFFFF' : '#2A1F1A',
                    border: active ? 'none' : '1.5px solid rgba(42,31,26,0.08)',
                  }}
                >
                  <p style={{ fontSize: 13, fontWeight: 900 }}>{item.title}</p>
                  <p style={{ fontSize: 10, opacity: active ? 0.72 : 0.65, marginTop: 3, lineHeight: 1.35 }}>{item.desc}</p>
                </button>
              );
            })}
          </div>
        </div>

        {selectedConcept === 'scrapbook' ? (
          <div className="rounded-2xl p-4 mb-3" style={{ background: '#FFFFFF', boxShadow: '0 2px 12px rgba(42,31,26,0.06)' }}>
            <label style={{ fontSize: 11, fontWeight: 800, color: '#9E8B7E' }}>제목</label>
            <input
              value={title}
              onChange={(event) => {
                setTitle(event.target.value);
                setScrapbookDataUrl(null);
              }}
              className="w-full mt-2 rounded-xl px-3 outline-none"
              style={{ height: 42, background: '#F5EFE6', fontSize: 13, fontWeight: 800, color: '#2A1F1A' }}
            />
            <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: '#9E8B7E', marginTop: 12 }}>짧은 메모</label>
            <textarea
              value={memo}
              onChange={(event) => {
                setMemo(event.target.value);
                setScrapbookDataUrl(null);
              }}
              className="w-full mt-2 rounded-xl p-3 outline-none resize-none"
              style={{ height: 86, background: '#F5EFE6', fontSize: 12, color: '#2A1F1A', lineHeight: 1.45 }}
              placeholder="사진 근처에 나눠 배치할 짧은 메모를 입력하세요."
            />
          </div>
        ) : (
          <div className="rounded-2xl p-4 mb-3" style={{ background: '#FFFFFF', boxShadow: '0 2px 12px rgba(42,31,26,0.06)' }}>
            <p style={{ fontSize: 13, fontWeight: 800, color: '#2A1F1A' }}>2번 컨셉 규칙</p>
            <p style={{ fontSize: 11, color: '#9E8B7E', marginTop: 6, lineHeight: 1.55 }}>
              선택한 사진 4장을 같은 순서로 네컷 스트립에 배치하고, 최종 이미지 내부 텍스트는 @Momentrip만 사용합니다.
            </p>
          </div>
        )}

        {notice && (
          <p className="rounded-xl px-3 py-2 mb-3" style={{ background: '#F5EFE6', color: '#6B5040', fontSize: 11, lineHeight: 1.45 }}>
            {notice}
          </p>
        )}

        <button
          onClick={() => void generateScrapbook()}
          disabled={generating || selectedPhotos.length !== 4}
          className="w-full py-4 rounded-2xl flex items-center justify-center gap-2 active:scale-95 transition-all mb-3"
          style={{
            background: selectedPhotos.length === 4 && !generating ? '#2A1F1A' : '#EDE5DB',
            color: selectedPhotos.length === 4 && !generating ? '#FAF8F5' : '#9E8B7E',
            fontSize: 15,
            fontWeight: 800,
            border: 'none',
          }}
        >
          {generating ? <RefreshCw size={17} /> : <ImageIcon size={17} />}
          {generating ? '이미지 제작 중' : `${conceptLabel} 만들기`}
        </button>

        {scrapbookDataUrl && (
          <div className="rounded-3xl overflow-hidden mb-3" style={{ background: '#FFFFFF', boxShadow: '0 8px 28px rgba(42,31,26,0.12)' }}>
            <img src={scrapbookDataUrl} alt={`MomenTrip ${conceptLabel}`} className="w-full object-cover" />
          </div>
        )}
      </div>

      <div className="px-5 py-4 flex-shrink-0 grid grid-cols-3 gap-2">
        <button onClick={handleSave} disabled={saving || selectedPhotos.length !== 4} className="py-3.5 rounded-2xl flex items-center justify-center gap-1.5 active:scale-95" style={{ background: saved ? '#2A8B4A' : '#2A1F1A', color: '#FFFFFF', fontSize: 13, fontWeight: 800, border: 'none' }}>
          <CheckCircle2 size={15} />
          {saving ? '저장 중' : saved ? '저장됨' : '저장'}
        </button>
        <button onClick={handleDownload} disabled={selectedPhotos.length !== 4} className="py-3.5 rounded-2xl flex items-center justify-center gap-1.5 active:scale-95" style={{ background: '#C97C56', color: '#FFFFFF', fontSize: 13, fontWeight: 800, border: 'none' }}>
          <Download size={15} />
          다운로드
        </button>
        <button onClick={handleShare} disabled={selectedPhotos.length !== 4} className="py-3.5 rounded-2xl flex items-center justify-center gap-1.5 active:scale-95" style={{ background: '#F0EAE2', color: '#2A1F1A', fontSize: 13, fontWeight: 800, border: 'none' }}>
          <Share2 size={15} />
          공유
        </button>
      </div>
    </div>
  );
}
