'use client';

import { FormEvent, useEffect } from 'react';
import Script from 'next/script';

declare global {
  interface Window {
    mapConfig?: Record<string, any>;
    i18n?: {
      t?: (key: string) => string;
      updatePage?: () => void;
    };
  }
}

const seededRandom = (seed: number) => {
  const m = 0x80000000;
  const a = 1103515245;
  const c = 12345;
  let state = seed % m;
  return () => {
    state = (a * state + c) % m;
    return state / (m - 1);
  };
};

const stringToSeed = (str: string) => {
  let seed = 0;
  for (let i = 0; i < str.length; i++) {
    seed = (seed << 5) - seed + str.charCodeAt(i);
    seed |= 0;
  }
  return seed;
};

export default function MapClient() {
  useEffect(() => {
    const viewport = document.getElementById('viewport');
    const container = document.getElementById('hex-grid-container');
    if (!viewport || !container) return;

    let isDragging = false;
    let startX = 0;
    let startY = 0;
    let currentScale = 1.0;
    let offsetX = 0;
    let offsetY = 0;

    const applyConstraints = () => {
      const config = window.mapConfig || { hexagonSize: 20 };
      const buffer = config.hexagonSize * currentScale;
      const zoomedWidth = container.clientWidth * currentScale;
      const zoomedHeight = container.clientHeight * currentScale;

      if (zoomedWidth <= viewport.clientWidth) {
        offsetX = (viewport.clientWidth - zoomedWidth) / 2;
      } else {
        offsetX = Math.max(viewport.clientWidth - zoomedWidth - buffer, Math.min(buffer, offsetX));
      }

      if (zoomedHeight <= viewport.clientHeight) {
        offsetY = (viewport.clientHeight - zoomedHeight) / 2;
      } else {
        offsetY = Math.max(viewport.clientHeight - zoomedHeight - buffer, Math.min(buffer, offsetY));
      }
    };

    const updateGridTransform = () => {
      applyConstraints();
      document.documentElement.style.setProperty('--map-zoom', String(currentScale));
      const zoomDisplay = document.getElementById('zoom-level-display');
      if (zoomDisplay) zoomDisplay.innerText = `${currentScale.toFixed(1)}x`;
      container.style.transform = `translate(${offsetX}px, ${offsetY}px) scale(${currentScale})`;

      const lines = document.getElementById('grid-lines') as SVGPathElement | null;
      if (lines) lines.style.strokeWidth = `${1 / currentScale}px`;

      const highlight = document.getElementById('hover-highlight') as SVGPolygonElement | null;
      if (highlight) {
        const config = window.mapConfig || {};
        const sw = config.hoverStrokeWidth || 2;
        highlight.style.strokeWidth = `${sw / currentScale}px`;
      }
    };

    const generateHexGrid = () => {
      const config = window.mapConfig || { gridCols: 30, gridRows: 20, hexagonSize: 20 };
      const size = config.hexagonSize;
      const fillPadding = config.fillPadding || 0;
      const cols = config.gridCols;
      const rows = config.gridRows;
      const rng = seededRandom(stringToSeed(config.seed || 'default'));
      const fillProb = config.fillPercentage !== undefined ? config.fillPercentage : 0.15;
      const hexWidth = size * Math.sqrt(3);
      const hexHeight = size * 2;
      const vertDist = hexHeight * 3 / 4;
      const horizDist = hexWidth;
      const totalWidth = cols * horizDist + horizDist / 2;
      const totalHeight = rows * vertDist + hexHeight / 4;

      container.style.width = `${totalWidth}px`;
      container.style.height = `${totalHeight}px`;

      const gridData: { isColored: boolean; color: string }[][] = [];
      const hexColors = config.hexColors || [config.primaryColor || '#6366f1'];
      for (let r = 0; r < rows; r++) {
        gridData[r] = [];
        for (let c = 0; c < cols; c++) {
          gridData[r][c] = {
            isColored: rng() < fillProb,
            color: hexColors[Math.floor(rng() * hexColors.length)],
          };
        }
      }

      let fillGroup = '';
      let gridPathD = '';
      const processedEdges = new Set<string>();

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          let x = c * horizDist + horizDist / 2;
          if (r % 2 !== 0) x += horizDist / 2;
          const y = r * vertDist + hexHeight / 2;
          const hexInfo = gridData[r][c];
          const fullPoints = [];
          const fillPoints = [];

          for (let i = 0; i < 6; i++) {
            const angle = (Math.PI / 180) * (60 * i - 30);
            fullPoints.push({ x: x + size * Math.cos(angle), y: y + size * Math.sin(angle) });
            const fillSize = Math.max(0, size - fillPadding);
            fillPoints.push({ x: x + fillSize * Math.cos(angle), y: y + fillSize * Math.sin(angle) });
          }

          const fillPointsStr = fillPoints.map(p => `${p.x},${p.y}`).join(' ');
          const fullPointsStr = fullPoints.map(p => `${p.x},${p.y}`).join(' ');
          const fillColor = hexInfo.isColored ? hexInfo.color : 'transparent';
          fillGroup += `<polygon points="${fillPointsStr}" data-full-points="${fullPointsStr}" class="hexagon ${hexInfo.isColored ? 'colored' : ''}" style="fill: ${fillColor}" data-row="${r}" data-col="${c}" />`;

          for (let i = 0; i < 6; i++) {
            const p1 = fullPoints[i];
            const p2 = fullPoints[(i + 1) % 6];
            const neighbors = r % 2 === 0
              ? [[r, c + 1], [r + 1, c], [r + 1, c - 1], [r, c - 1], [r - 1, c - 1], [r - 1, c]]
              : [[r, c + 1], [r + 1, c + 1], [r + 1, c], [r, c - 1], [r - 1, c], [r - 1, c + 1]];
            const [nr, nc] = neighbors[i];
            const neighborExists = nr >= 0 && nr < rows && nc >= 0 && nc < cols;
            const neighborIsColored = neighborExists ? gridData[nr][nc].isColored : false;

            if (config.showEmptyBorders || hexInfo.isColored || neighborIsColored) {
              const edgeKey = [
                `${Math.round(p1.x * 100)},${Math.round(p1.y * 100)}`,
                `${Math.round(p2.x * 100)},${Math.round(p2.y * 100)}`,
              ].sort().join('-');

              if (!processedEdges.has(edgeKey)) {
                processedEdges.add(edgeKey);
                gridPathD += `M ${p1.x} ${p1.y} L ${p2.x} ${p2.y} `;
              }
            }
          }
        }
      }

      container.innerHTML = `
        <svg id="main-map-svg" width="${totalWidth}" height="${totalHeight}" class="hex-svg">
          <g id="fills-layer">${fillGroup}</g>
          <path d="${gridPathD}" class="grid-lines" id="grid-lines" />
          <polygon id="hover-highlight" points="" class="hexagon-hover-stroke" />
        </svg>
      `;

      const svg = document.getElementById('main-map-svg');
      const highlight = document.getElementById('hover-highlight') as SVGPolygonElement | null;

      svg?.addEventListener('mouseover', (event) => {
        const target = event.target as Element;
        if (target.classList.contains('hexagon') && highlight) {
          highlight.setAttribute('points', target.getAttribute('data-full-points') || '');
          highlight.style.display = 'block';
        }
      });

      svg?.addEventListener('mouseout', (event) => {
        const target = event.target as Element;
        if (target.classList.contains('hexagon') && highlight) {
          highlight.style.display = 'none';
        }
      });
    };

    const resetView = () => {
      currentScale = (window.mapConfig && window.mapConfig.zoom) || 1.0;
      offsetX = (viewport.clientWidth - container.clientWidth * currentScale) / 2;
      offsetY = (viewport.clientHeight - container.clientHeight * currentScale) / 2;
      updateGridTransform();
    };

    const adjustZoom = (delta: number) => {
      const config = window.mapConfig || {};
      const minZoom = config.minZoom || 0.5;
      const maxZoom = config.maxZoom || 3.0;
      const newScale = Math.max(minZoom, Math.min(maxZoom, currentScale + delta));
      if (newScale !== currentScale) {
        currentScale = newScale;
        updateGridTransform();
      }
    };

    const onMouseDown = (event: MouseEvent) => {
      isDragging = true;
      viewport.style.cursor = 'grabbing';
      startX = event.pageX - offsetX;
      startY = event.pageY - offsetY;
    };
    const onMouseUp = () => {
      isDragging = false;
      viewport.style.cursor = 'grab';
    };
    const onMouseMove = (event: MouseEvent) => {
      if (!isDragging) return;
      event.preventDefault();
      offsetX = event.pageX - startX;
      offsetY = event.pageY - startY;
      updateGridTransform();
    };
    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      adjustZoom(event.deltaY > 0 ? -0.1 : 0.1);
    };

    (window as any).adjustZoom = adjustZoom;
    (window as any).resetView = resetView;

    currentScale = (window.mapConfig && window.mapConfig.zoom) || 1.0;
    generateHexGrid();
    resetView();

    viewport.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mouseup', onMouseUp);
    window.addEventListener('mousemove', onMouseMove);
    viewport.addEventListener('wheel', onWheel, { passive: false });

    return () => {
      viewport.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mouseup', onMouseUp);
      window.removeEventListener('mousemove', onMouseMove);
      viewport.removeEventListener('wheel', onWheel);
    };
  }, []);

  const handleSubscribe = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const emailInput = form.querySelector<HTMLInputElement>('input[name="email"]');
    const button = form.querySelector<HTMLButtonElement>('button');
    const message = document.getElementById('form-message');
    if (!emailInput || !button || !message) return;

    button.disabled = true;
    button.innerText = window.i18n?.t?.('subscription.sending') || 'Sending...';
    message.innerText = '';

    fetch('https://script.google.com/macros/s/AKfycbw3hnaUx4055rC0NomUyWCnrO_iEzQX6xAuX2jleQaziYdoBu9GIShZXvKMfNBw1shEIA/exec', {
      method: 'POST',
      mode: 'no-cors',
      headers: {
        'Content-Type': 'text/plain',
      },
      body: JSON.stringify({ email: emailInput.value }),
    }).then(() => {
      message.style.color = 'var(--primary-color)';
      message.innerText = window.i18n?.t?.('subscription.success') || 'Thank you. We will contact you.';
      form.reset();
    }).catch((error) => {
      console.error('Error:', error);
      message.style.color = '#ef4444';
      message.innerText = window.i18n?.t?.('subscription.error') || 'Submission failed. Please try again later.';
    }).finally(() => {
      button.disabled = false;
      if (window.i18n?.updatePage) window.i18n.updatePage();
      else button.innerText = 'Send';

      setTimeout(() => {
        if (message.innerText !== '') message.innerText = '';
      }, 5000);
    });
  };

  return (
    <>
      <Script src="/js/mapConfig.js" strategy="afterInteractive" />
      <div className="map-placeholder" id="viewport">
        <div id="hex-grid-container" />
        <div className="zoom-controls">
          <span id="zoom-level-display" style={{ fontSize: 10, color: 'var(--text-secondary)', marginBottom: 2 }}>1.0x</span>
          <button className="zoom-btn" onClick={() => (window as any).adjustZoom?.(0.1)} title="Zoom In">+</button>
          <button className="zoom-btn" onClick={() => (window as any).adjustZoom?.(-0.1)} title="Zoom Out">-</button>
          <button className="zoom-btn" onClick={() => (window as any).resetView?.()} title="Reset View">Reset</button>
        </div>
      </div>

      <div style={{ marginTop: 40, maxWidth: 500, marginLeft: 'auto', marginRight: 'auto' }}>
        <p style={{ marginBottom: 15, fontSize: '1.1rem' }} data-i18n="subscription.title">
          Leave your email and we will let you know when the expedition is ready.
        </p>
        <form id="subscribe-form" style={{ display: 'flex', gap: 10, justifyContent: 'center' }} onSubmit={handleSubscribe}>
          <input
            type="email"
            name="email"
            data-i18n="subscription.placeholder"
            placeholder="Email"
            style={{
              padding: '10px 15px',
              borderRadius: 8,
              border: '1px solid var(--border-color, #ccc)',
              flex: 1,
              background: 'var(--bg-secondary, #fff)',
              color: 'var(--text-primary, #000)',
            }}
            required
          />
          <button className="btn" type="submit" data-i18n="subscription.button">Send</button>
        </form>
        <div id="form-message" style={{ marginTop: 10, fontSize: '0.9rem', minHeight: 20 }} />
      </div>
    </>
  );
}
