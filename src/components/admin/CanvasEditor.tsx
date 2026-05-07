"use client";

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Move, Settings, Type, Maximize, Palette, Save, Download, Award } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Hotspot {
  x: number; // Percentage
  y: number; // Percentage
  fontSize: number;
  fontFamily: string;
  color: string;
}

interface CanvasEditorProps {
  templateUrl: string;
  initialHotspot?: Hotspot;
  onSave?: (hotspot: Hotspot) => void;
}

export function CanvasEditor({ templateUrl, initialHotspot, onSave }: CanvasEditorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [hotspot, setHotspot] = useState<Hotspot>(initialHotspot || {
    x: 50,
    y: 50,
    fontSize: 40,
    fontFamily: 'Plus Jakarta Sans',
    color: '#000000'
  });
  const [isDragging, setIsDragging] = useState(false);
  const [scale, setScale] = useState(1);
  const [nameText, setNameText] = useState("John Doe");

  // Load image
  useEffect(() => {
    const img = new Image();
    img.src = templateUrl;
    img.crossOrigin = "anonymous";
    img.onload = () => {
      setImage(img);
    };
  }, [templateUrl]);

  // Render canvas
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !image) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas dimensions to match image
    canvas.width = image.width;
    canvas.height = image.height;

    // Draw background template
    ctx.drawImage(image, 0, 0);

    // Draw name hotspot
    const pxX = (hotspot.x / 100) * canvas.width;
    const pxY = (hotspot.y / 100) * canvas.height;

    ctx.font = `bold ${hotspot.fontSize}px "${hotspot.fontFamily}"`;
    ctx.fillStyle = hotspot.color;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(nameText, pxX, pxY);

    // Draw helper box if dragging or in edit mode
    if (isDragging) {
      ctx.strokeStyle = '#3b82f6';
      ctx.lineWidth = 2;
      const textMetrics = ctx.measureText(nameText);
      const width = textMetrics.width + 20;
      const height = hotspot.fontSize + 10;
      ctx.strokeRect(pxX - width / 2, pxY - height / 2, width, height);
    }
  }, [image, hotspot, nameText, isDragging]);

  useEffect(() => {
    draw();
  }, [draw]);

  // Handle Dragging
  const handleMouseDown = (e: React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const mouseX = (e.clientX - rect.left) * (canvas.width / rect.width);
    const mouseY = (e.clientY - rect.top) * (canvas.height / rect.height);

    const pxX = (hotspot.x / 100) * canvas.width;
    const pxY = (hotspot.y / 100) * canvas.height;

    // Hit test (simple circle for now)
    const dist = Math.sqrt((mouseX - pxX) ** 2 + (mouseY - pxY) ** 2);
    if (dist < 100) {
      setIsDragging(true);
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    
    let newX = ((e.clientX - rect.left) / rect.width) * 100;
    let newY = ((e.clientY - rect.top) / rect.height) * 100;

    // Clamp values
    newX = Math.max(0, Math.min(100, newX));
    newY = Math.max(0, Math.min(100, newY));

    setHotspot(prev => ({ ...prev, x: newX, y: newY }));
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 h-full min-h-[600px]">
      {/* Canvas Area */}
      <div className="lg:col-span-3 flex flex-col gap-4">
        <div 
          ref={containerRef}
          className="relative flex-1 bg-black/40 rounded-3xl border border-white/10 overflow-hidden flex items-center justify-center cursor-crosshair group"
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          {!image && (
            <div className="flex flex-col items-center gap-4 text-muted-foreground animate-pulse">
              <Award className="w-12 h-12" />
              <p>Loading template...</p>
            </div>
          )}
          
          <canvas
            ref={canvasRef}
            onMouseDown={handleMouseDown}
            className="max-w-full max-h-full shadow-2xl transition-transform"
            style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
          />
          
          {/* Draggable Helper Layer (Optional for smoother interaction) */}
          <div className="absolute top-4 right-4 flex gap-2">
            <button className="p-2 glass rounded-lg hover:bg-white/10" title="Zoom In"><Maximize className="w-4 h-4" /></button>
          </div>
          
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 glass px-4 py-2 rounded-full text-xs font-medium text-white/60 pointer-events-none">
            Drag the name to reposition it
          </div>
        </div>
      </div>

      {/* Settings Panel */}
      <div className="lg:col-span-1 space-y-6">
        <div className="bento-card space-y-6">
          <div className="flex items-center gap-3">
            <Settings className="w-5 h-5 text-primary" />
            <h3 className="font-bold">Hotspot Settings</h3>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-muted-foreground uppercase">Preview Name</label>
              <div className="relative">
                <Type className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input 
                  type="text" 
                  value={nameText}
                  onChange={(e) => setNameText(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-2 pl-10 pr-4 focus:ring-2 ring-primary outline-none transition-all"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-muted-foreground uppercase">Font Family</label>
              <select 
                value={hotspot.fontFamily}
                onChange={(e) => setHotspot(prev => ({ ...prev, fontFamily: e.target.value }))}
                className="w-full bg-white/5 border border-white/10 rounded-xl p-2 outline-none"
              >
                <option value="Plus Jakarta Sans">Plus Jakarta Sans</option>
                <option value="Poppins">Poppins</option>
                <option value="Inter">Inter</option>
                <option value="serif">Classic Serif</option>
              </select>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between">
                <label className="text-xs font-bold text-muted-foreground uppercase">Font Size</label>
                <span className="text-xs font-mono">{hotspot.fontSize}px</span>
              </div>
              <input 
                type="range" 
                min="10" 
                max="200" 
                value={hotspot.fontSize}
                onChange={(e) => setHotspot(prev => ({ ...prev, fontSize: parseInt(e.target.value) }))}
                className="w-full accent-primary"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-muted-foreground uppercase">Color</label>
              <div className="flex gap-2">
                <input 
                  type="color" 
                  value={hotspot.color}
                  onChange={(e) => setHotspot(prev => ({ ...prev, color: e.target.value }))}
                  className="w-12 h-12 rounded-xl bg-transparent border-none cursor-pointer"
                />
                <input 
                  type="text" 
                  value={hotspot.color}
                  onChange={(e) => setHotspot(prev => ({ ...prev, color: e.target.value }))}
                  className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 outline-none"
                />
              </div>
            </div>
          </div>

          <hr className="border-white/10" />

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-muted-foreground uppercase">X Position</label>
              <div className="bg-white/5 rounded-lg p-2 text-center text-sm font-mono border border-white/5">{hotspot.x.toFixed(1)}%</div>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-muted-foreground uppercase">Y Position</label>
              <div className="bg-white/5 rounded-lg p-2 text-center text-sm font-mono border border-white/5">{hotspot.y.toFixed(1)}%</div>
            </div>
          </div>

          <button 
            onClick={() => onSave?.(hotspot)}
            className="w-full bg-white text-black py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-white/90 active:scale-[0.98] transition-all shadow-xl shadow-white/5"
          >
            <Save className="w-5 h-5" />
            Save Configuration
          </button>
        </div>
      </div>
    </div>
  );
}
