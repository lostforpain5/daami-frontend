'use client';
import { createContext, useCallback, useRef } from 'react';

export const DockContext = createContext(null);

const MAX_DIST = 200;
const MAX_SCALE = 1.25;
const MAX_LIFT = 12;

function smoothStep(t) {
  return t * t * (3 - 2 * t);
}

export default function DockGroup({ children, className, style, isolate = true }) {
  const registry = useRef(new Set());

  const register = useCallback((el) => {
    registry.current.add(el);
    return () => registry.current.delete(el);
  }, []);

  const apply = useCallback((mx, my, active) => {
    registry.current.forEach((el) => {
      if (!el) return;

      if (!active) {
        el.style.transition = 'transform 0.5s cubic-bezier(0.25,0.46,0.45,0.94), box-shadow 0.5s ease';
        el.style.transform = '';
        el.style.boxShadow = '';
        el.style.zIndex = '';
        return;
      }

      const r = el.getBoundingClientRect();
      const cx = r.left + r.width / 2;
      const cy = r.top + r.height / 2;
      const dist = Math.hypot(mx - cx, my - cy);
      const t = dist < MAX_DIST ? smoothStep(1 - dist / MAX_DIST) : 0;
      const scale = 1 + (MAX_SCALE - 1) * t;
      const lift = MAX_LIFT * t;

      el.style.transition = 'transform 0.12s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.12s ease';
      el.style.transform = `scale(${scale.toFixed(4)}) translateY(${(-lift).toFixed(2)}px)`;
      el.style.zIndex = t > 0.08 ? String(Math.ceil(t * 20) + 5) : '';

      if (t > 0.02) {
        const offsetY = (t * 18).toFixed(1);
        const blur = (t * 32).toFixed(1);
        const shadowAlpha = (t * 0.18).toFixed(3);
        const glowAlpha = (t * 0.08).toFixed(3);
        el.style.boxShadow = `0 ${offsetY}px ${blur}px rgba(0,0,0,${shadowAlpha}), 0 0 ${(t * 22).toFixed(1)}px rgba(201,168,76,${glowAlpha})`;
      } else {
        el.style.boxShadow = '';
      }
    });
  }, []);

  return (
    <DockContext.Provider value={register}>
      <div
        className={className}
        style={{ ...(isolate ? { isolation: 'isolate' } : {}), ...style }}
        onMouseMove={(e) => apply(e.clientX, e.clientY, true)}
        onMouseLeave={() => apply(0, 0, false)}
      >
        {children}
      </div>
    </DockContext.Provider>
  );
}
