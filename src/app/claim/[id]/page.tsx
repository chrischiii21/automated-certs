"use client";

import { toast } from 'sonner';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, Award, ShieldCheck, Sparkles, User, ArrowRight, Loader2 } from 'lucide-react';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';


export default function ClaimPage() {
  const params = useParams();
  const id = params.id as string;
  const [userName, setUserName] = useState("");
  const [imageLoaded, setImageLoaded] = useState(false);
  const [event, setEvent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const templateRef = useRef<HTMLImageElement | null>(null);

  useEffect(() => {
    if (id) fetchEvent();
  }, [id]);

  const fetchEvent = async () => {
    try {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      setEvent(data);
    } catch (err) {
      console.error('Error fetching event:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (event) {
      const img = new Image();
      img.src = event.template_url;
      img.crossOrigin = "anonymous";
      img.onload = () => {
        templateRef.current = img;
        setImageLoaded(true);
      };
    }
  }, [event]);

  const updateCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const img = templateRef.current;
    if (!canvas || !img || !event) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = img.width;
    canvas.height = img.height;

    ctx.drawImage(img, 0, 0);

    if (userName) {
      ctx.font = `bold ${event.font_size}px "${event.font_family}"`;
      ctx.fillStyle = event.font_color;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      const pxX = (event.hotspot_x / 100) * canvas.width;
      const pxY = (event.hotspot_y / 100) * canvas.height;
      
      ctx.fillText(userName, pxX, pxY);
    }
  }, [userName, event]);

  useEffect(() => {
    updateCanvas();
  }, [updateCanvas]);


  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    try {
      const url = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `${userName || 'certificate'}-certify.png`;
      link.href = url;
      link.click();
      toast.success('Certificate downloaded successfully!');
    } catch (err) {
      console.error('Download error:', err);
      toast.error('Failed to download certificate');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center gap-4">
        <Award className="w-16 h-16 text-muted-foreground opacity-20" />
        <h1 className="text-2xl font-bold">Event not found</h1>
        <p className="text-muted-foreground">The certificate you are looking for does not exist or has been removed.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white/[0.05] to-transparent">
      <div className="max-w-4xl w-full grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        
        {/* Left Side: Info & Form */}
        <div className="space-y-8">
          <header className="space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-bold uppercase tracking-widest text-primary">
              <Sparkles className="w-3 h-3" />
              Verified Certificate
            </div>
            <h1 className="text-5xl font-bold leading-tight">
              Claim Your <br />
              <span className="gradient-text">Achievement.</span>
            </h1>
            <p className="text-lg text-muted-foreground leading-relaxed">
              Congratulations on completing <strong>{event.name}</strong>. Enter your name below to generate your official certificate.
            </p>
          </header>

          <div className="space-y-6">
            <div className="space-y-3">
              <label className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Full Name</label>
              <div className="relative group">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-white transition-colors" />
                <input 
                  type="text" 
                  placeholder="Enter your name exactly..."
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-6 text-lg focus:ring-2 ring-primary outline-none transition-all hover:bg-white/[0.08]"
                />
              </div>
            </div>

            <button 
              disabled={!userName || !imageLoaded}
              onClick={handleDownload}
              className="w-full bg-white text-black py-5 rounded-2xl font-bold text-lg flex items-center justify-center gap-3 hover:bg-white/90 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_40px_-10px_rgba(255,255,255,0.3)] group"
            >
              <Download className="w-6 h-6 group-hover:translate-y-0.5 transition-transform" />
              Download PNG
              <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
            </button>
            
            <div className="flex items-center justify-center gap-6 pt-4 grayscale opacity-40">
               <div className="flex items-center gap-2 text-xs font-medium"><ShieldCheck className="w-4 h-4" /> Secure Download</div>
               <div className="flex items-center gap-2 text-xs font-medium"><Award className="w-4 h-4" /> Official Badge</div>
            </div>
          </div>
        </div>

        {/* Right Side: Preview */}
        <div className="relative">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative z-10 bento-card p-2 group"
          >
            <div className="relative rounded-2xl overflow-hidden aspect-[1.414/1] bg-white/5 flex items-center justify-center">
              {!imageLoaded && <div className="animate-pulse text-muted-foreground">Loading preview...</div>}
              <canvas 
                ref={canvasRef}
                className="w-full h-full object-contain"
              />
              
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-6">
                <p className="text-xs text-white/60 font-medium">Real-time Preview</p>
              </div>
            </div>
          </motion.div>
          
          {/* Decorative Elements */}
          <div className="absolute -top-12 -right-12 w-64 h-64 bg-primary/20 rounded-full blur-[100px] pointer-events-none" />
          <div className="absolute -bottom-12 -left-12 w-64 h-64 bg-accent/20 rounded-full blur-[100px] pointer-events-none" />
        </div>
      </div>
    </div>
  );
}
