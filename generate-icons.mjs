import fs from 'fs';
import path from 'path';
import { createCanvas } from 'canvas';

const ICON_DIR = 'public/icons';
if (!fs.existsSync(ICON_DIR)) fs.mkdirSync(ICON_DIR, { recursive: true });

// SVG to PNG function
async function createIcon(size, isMaskable = false) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');

  if (!isMaskable) {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, size, size);
  }

  // Green background circle (for maskable, this becomes the main icon)
  const circleSize = isMaskable ? size * 0.8 : size * 0.7;
  const circleX = (size - circleSize) / 2;
  ctx.fillStyle = '#065f46';
  ctx.beginPath();
  ctx.arc(size / 2, size / 2, circleSize / 2, 0, Math.PI * 2);
  ctx.fill();

  // Shopping bag SVG-like icon
  ctx.strokeStyle = '#ffffff';
  ctx.fillStyle = '#ffffff';
  ctx.lineWidth = Math.max(1, size / 64);
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';

  const bagLeft = size * 0.35;
  const bagTop = size * 0.35;
  const bagWidth = size * 0.3;
  const bagHeight = size * 0.35;

  // Bag outline
  ctx.beginPath();
  ctx.moveTo(bagLeft, bagTop);
  ctx.lineTo(bagLeft, bagTop + bagHeight);
  ctx.lineTo(bagLeft + bagWidth, bagTop + bagHeight);
  ctx.lineTo(bagLeft + bagWidth, bagTop);
  ctx.fill();
  ctx.stroke();

  // Handle
  ctx.beginPath();
  ctx.arc(size / 2, bagTop - size * 0.05, bagWidth * 0.4, 0, Math.PI, true);
  ctx.stroke();

  return canvas.toBuffer('image/png');
}

async function generateIcons() {
  try {
    const sizes = [
      { size: 192, maskable: false },
      { size: 512, maskable: false },
      { size: 192, maskable: true },
      { size: 512, maskable: true },
      { size: 96, maskable: false },
    ];

    for (const { size, maskable } of sizes) {
      const buffer = await createIcon(size, maskable);
      const suffix = maskable ? '-maskable' : '';
      const filename = `icon-${size}x${size}${suffix}.png`;
      fs.writeFileSync(path.join(ICON_DIR, filename), buffer);
      console.log(`✓ Generated ${filename}`);
    }

    // Create a simple screenshot placeholder
    const canvas = createCanvas(540, 720);
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#f3f4f6';
    ctx.fillRect(0, 0, 540, 720);

    ctx.fillStyle = '#065f46';
    ctx.fillRect(0, 0, 540, 80);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 32px sans-serif';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    ctx.fillText('סל-מת', 480, 40);

    fs.writeFileSync(path.join(ICON_DIR, 'screenshot-1.png'), canvas.toBuffer('image/png'));
    console.log('✓ Generated screenshot-1.png');

    console.log('\n✓ All icons generated successfully!');
  } catch (error) {
    console.error('Error generating icons:', error);
    process.exit(1);
  }
}

generateIcons();
