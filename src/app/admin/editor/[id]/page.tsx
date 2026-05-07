"use client";

import React, { useEffect, useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { CanvasEditor } from '@/components/admin/CanvasEditor';
import { useParams, useRouter } from 'next/navigation';
import { ChevronLeft, Award, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

export default function AdminEditorPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [event, setEvent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);

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
      toast.error('Failed to load event data');
      router.push('/');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (hotspot: any) => {
    setIsSaving(true);
    const promise = new Promise(async (resolve, reject) => {
      try {
        const { error } = await supabase
          .from('events')
          .update({
            hotspot_x: hotspot.x,
            hotspot_y: hotspot.y,
            font_size: hotspot.fontSize,
            font_family: hotspot.fontFamily,
            font_color: hotspot.color
          })
          .eq('id', id);

        if (error) throw error;
        resolve(true);
      } catch (err) {
        console.error('Error saving hotspot:', err);
        reject(err);
      } finally {
        setIsSaving(false);
      }
    });

    toast.promise(promise, {
      loading: 'Saving changes...',
      success: 'Configuration saved!',
      error: 'Failed to save configuration.',
    });
  };

  const handlePublish = async () => {
    setIsPublishing(true);
    const promise = new Promise(async (resolve, reject) => {
      try {
        const { error } = await supabase
          .from('events')
          .update({ status: 'Active' })
          .eq('id', id);

        if (error) throw error;
        setEvent({ ...event, status: 'Active' });
        resolve(true);
      } catch (err) {
        console.error('Error publishing:', err);
        reject(err);
      } finally {
        setIsPublishing(false);
      }
    });

    toast.promise(promise, {
      loading: 'Publishing certificate...',
      success: 'Certificate is now live!',
      error: 'Failed to publish.',
    });
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex flex-col items-center justify-center h-screen gap-4">
          <Loader2 className="w-10 h-10 text-primary animate-spin" />
          <p className="text-sm text-muted-foreground animate-pulse">Loading template editor...</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="p-10 h-full flex flex-col gap-6">
        <header className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Link 
              href="/" 
              className="p-2 rounded-xl hover:bg-white/5 border border-transparent hover:border-white/10 transition-all"
            >
              <ChevronLeft className="w-6 h-6" />
            </Link>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Award className="w-4 h-4 text-primary" />
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">Editor Mode</span>
              </div>
              <h1 className="text-2xl font-bold">{event?.name}</h1>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
             <button 
               onClick={() => {
                 fetchEvent();
                 toast.success('Changes reset to last save');
               }}
               className="px-6 py-2.5 rounded-xl border border-white/10 hover:bg-white/5 transition-all text-sm font-medium"
             >
               Reset
             </button>
             <button 
               onClick={handlePublish}
               disabled={isPublishing || event?.status === 'Active'}
               className="px-6 py-2.5 rounded-xl bg-white text-black hover:bg-white/90 disabled:opacity-50 transition-all text-sm font-bold flex items-center gap-2"
             >
               {isPublishing && <Loader2 className="w-4 h-4 animate-spin" />}
               {event?.status === 'Active' ? 'Published' : 'Publish'}
             </button>
          </div>
        </header>

        <div className="flex-1 overflow-hidden">
          {event && (
            <CanvasEditor 
              templateUrl={event.template_url} 
              initialHotspot={{
                x: event.hotspot_x,
                y: event.hotspot_y,
                fontSize: event.font_size,
                fontFamily: event.font_family,
                color: event.font_color
              }}
              onSave={handleSave}
            />
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
