
export const applyWatermark = (base64: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return reject('No context');

      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);

      // Setup watermark style
      const fontSize = Math.max(img.width / 20, 20);
      ctx.font = `bold ${fontSize}px sans-serif`;
      ctx.fillStyle = "rgba(255, 255, 255, 0.3)";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      // Diagonal watermark pattern
      ctx.save();
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate(-Math.PI / 4);
      ctx.fillText("PicKut TRIAL MODE", 0, 0);
      ctx.restore();

      // Small repetitive watermarks
      ctx.font = `${fontSize / 2}px sans-serif`;
      for (let x = 0; x < canvas.width; x += fontSize * 4) {
        for (let y = 0; y < canvas.height; y += fontSize * 4) {
          ctx.fillText("PicKut", x, y);
        }
      }

      resolve(canvas.toDataURL('image/png'));
    };
    img.onerror = reject;
    img.src = base64;
  });
};
