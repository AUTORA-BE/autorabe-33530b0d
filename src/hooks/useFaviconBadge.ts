import { useEffect, useRef } from 'react';

export function useFaviconBadge(count: number) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const originalFaviconRef = useRef<string>('/favicon.png');

  useEffect(() => {
    // Create canvas if it doesn't exist
    if (!canvasRef.current) {
      canvasRef.current = document.createElement('canvas');
      canvasRef.current.width = 32;
      canvasRef.current.height = 32;
    }

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    img.onload = () => {
      // Clear canvas
      ctx.clearRect(0, 0, 32, 32);
      
      // Draw original favicon
      ctx.drawImage(img, 0, 0, 32, 32);

      if (count > 0) {
        // Draw badge circle
        const badgeSize = count > 9 ? 18 : 14;
        const x = 32 - badgeSize / 2 - 1;
        const y = badgeSize / 2 + 1;

        // Red circle background
        ctx.beginPath();
        ctx.arc(x, y, badgeSize / 2, 0, 2 * Math.PI);
        ctx.fillStyle = '#ef4444';
        ctx.fill();

        // White border
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Badge text
        ctx.fillStyle = '#ffffff';
        ctx.font = `bold ${count > 9 ? 9 : 10}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(count > 99 ? '99+' : count.toString(), x, y);
      }

      // Update favicon
      const link = document.querySelector<HTMLLinkElement>('link[rel="icon"]') || 
                   document.createElement('link');
      link.type = 'image/png';
      link.rel = 'icon';
      link.href = canvas.toDataURL('image/png');
      
      if (!document.querySelector('link[rel="icon"]')) {
        document.head.appendChild(link);
      }
    };

    img.src = originalFaviconRef.current;

    // Update document title with count
    const baseTitle = 'AutoRa';
    document.title = count > 0 ? `(${count}) ${baseTitle}` : baseTitle;

    return () => {
      // Cleanup: restore original favicon when component unmounts
    };
  }, [count]);
}
