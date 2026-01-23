"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { X, ZoomIn, ZoomOut } from "lucide-react";

export function ImageViewer({
  src,
  alt,
  open,
  onClose
}: {
  src: string;
  alt: string;
  open: boolean;
  onClose: () => void;
}) {
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const lastTouchRef = useRef<{ x: number; y: number } | null>(null);
  const lastPinchDistanceRef = useRef<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Reset state when opening
  useEffect(() => {
    if (open) {
      setScale(1);
      setPosition({ x: 0, y: 0 });
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (open) {
      document.addEventListener("keydown", handleEscape);
    }
    return () => document.removeEventListener("keydown", handleEscape);
  }, [open, onClose]);

  const handleZoomIn = useCallback(() => {
    setScale((s) => Math.min(s * 1.5, 5));
  }, []);

  const handleZoomOut = useCallback(() => {
    setScale((s) => {
      const newScale = Math.max(s / 1.5, 1);
      if (newScale === 1) {
        setPosition({ x: 0, y: 0 });
      }
      return newScale;
    });
  }, []);

  const handleDoubleClick = useCallback(() => {
    if (scale > 1) {
      setScale(1);
      setPosition({ x: 0, y: 0 });
    } else {
      setScale(2.5);
    }
  }, [scale]);

  // Touch handlers for pinch-zoom and pan
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      lastTouchRef.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY
      };
    } else if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      lastPinchDistanceRef.current = Math.sqrt(dx * dx + dy * dy);
    }
  }, []);

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      e.preventDefault();

      if (e.touches.length === 1 && lastTouchRef.current && scale > 1) {
        // Pan
        const dx = e.touches[0].clientX - lastTouchRef.current.x;
        const dy = e.touches[0].clientY - lastTouchRef.current.y;
        setPosition((p) => ({ x: p.x + dx, y: p.y + dy }));
        lastTouchRef.current = {
          x: e.touches[0].clientX,
          y: e.touches[0].clientY
        };
      } else if (e.touches.length === 2 && lastPinchDistanceRef.current) {
        // Pinch zoom
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const delta = distance / lastPinchDistanceRef.current;
        setScale((s) => {
          const newScale = Math.min(Math.max(s * delta, 1), 5);
          if (newScale === 1) {
            setPosition({ x: 0, y: 0 });
          }
          return newScale;
        });
        lastPinchDistanceRef.current = distance;
      }
    },
    [scale]
  );

  const handleTouchEnd = useCallback(() => {
    lastTouchRef.current = null;
    lastPinchDistanceRef.current = null;
  }, []);

  // Mouse drag for desktop
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (scale > 1) {
        setIsDragging(true);
        lastTouchRef.current = { x: e.clientX, y: e.clientY };
      }
    },
    [scale]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (isDragging && lastTouchRef.current && scale > 1) {
        const dx = e.clientX - lastTouchRef.current.x;
        const dy = e.clientY - lastTouchRef.current.y;
        setPosition((p) => ({ x: p.x + dx, y: p.y + dy }));
        lastTouchRef.current = { x: e.clientX, y: e.clientY };
      }
    },
    [isDragging, scale]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    lastTouchRef.current = null;
  }, []);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black">
      {/* Controls */}
      <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between p-4 bg-gradient-to-b from-black/60 to-transparent">
        <div className="flex items-center gap-2">
          <button
            onClick={handleZoomOut}
            disabled={scale <= 1}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white disabled:opacity-30"
          >
            <ZoomOut size={20} />
          </button>
          <button
            onClick={handleZoomIn}
            disabled={scale >= 5}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white disabled:opacity-30"
          >
            <ZoomIn size={20} />
          </button>
          <span className="ml-2 text-sm text-white/70">{Math.round(scale * 100)}%</span>
        </div>
        <button
          onClick={onClose}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white"
        >
          <X size={20} />
        </button>
      </div>

      {/* Image container */}
      <div
        ref={containerRef}
        className="absolute inset-0 flex items-center justify-center overflow-hidden"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onDoubleClick={handleDoubleClick}
        style={{ cursor: scale > 1 ? (isDragging ? "grabbing" : "grab") : "zoom-in" }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt={alt}
          className="max-h-full max-w-full object-contain select-none"
          style={{
            transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
            transition: isDragging ? "none" : "transform 0.1s ease-out"
          }}
          draggable={false}
        />
      </div>

      {/* Hint */}
      {scale === 1 && (
        <p className="absolute bottom-8 left-0 right-0 text-center text-sm text-white/50">
          Double-tap or pinch to zoom
        </p>
      )}
    </div>
  );
}
