'use client';
import { useContext, useEffect, useRef } from 'react';
import { DockContext } from './DockGroup';

export default function DockItem({ children, className, style }) {
  const register = useContext(DockContext);
  const ref = useRef(null);

  useEffect(() => {
    if (!register || !ref.current) return;
    return register(ref.current);
  }, [register]);

  return (
    <div
      ref={ref}
      className={className}
      style={{
        willChange: 'transform',
        transformOrigin: 'center center',
        position: 'relative',
        ...style,
      }}
    >
      {children}
    </div>
  );
}
