"use client";

import React, { useEffect, useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Plus, Award, Users, Share2, ArrowUpRight, Loader2, X, Image as ImageIcon, Trash2, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { cn } from '../lib/utils';
import { toast } from 'sonner';

interface Event {
  id: string;
  name: string;
  template_url: string;
  claimed_count?: number;
  status: string;
}

export default function AdminDashboard() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [newEvent, setNewEvent] = useState({ name: '', file: null as File | null });
  const [eventToDelete, setEventToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setEvents(data || []);
    } catch (err) {
      console.error('Error fetching events:', err);
      toast.error('Failed to load events');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEvent.name || !newEvent.file) return;

    setIsCreating(true);
    const promise = new Promise(async (resolve, reject) => {
      try {
        const fileExt = newEvent.file!.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('templates')
          .upload(fileName, newEvent.file!);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('templates')
          .getPublicUrl(fileName);

        const { error: insertError } = await supabase
          .from('events')
          .insert([{ 
            name: newEvent.name, 
            template_url: publicUrl,
            status: 'Draft',
            hotspot_x: 50,
            hotspot_y: 50,
            font_size: 64,
            font_family: 'Plus Jakarta Sans',
            font_color: '#000000'
          }]);

        if (insertError) throw insertError;

        setIsModalOpen(false);
        setNewEvent({ name: '', file: null });
        fetchEvents();
        resolve(true);
      } catch (err) {
        console.error('Error creating event:', err);
        reject(err);
      } finally {
        setIsCreating(false);
      }
    });

    toast.promise(promise, {
      loading: 'Creating event...',
      success: 'Event created successfully!',
      error: 'Failed to create event. Make sure you have a "templates" bucket.',
    });
  };

  const handleDeleteEvent = async () => {
    if (!eventToDelete) return;

    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from('events')
        .delete()
        .eq('id', eventToDelete);

      if (error) throw error;
      
      toast.success('Event deleted successfully');
      fetchEvents();
      setEventToDelete(null);
    } catch (err) {
      console.error('Error deleting event:', err);
      toast.error('Failed to delete event');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <AdminLayout>
      <div className="p-10 max-w-7xl mx-auto space-y-10">
        <header className="flex justify-between items-end">
          <div className="space-y-1">
            <h1 className="text-4xl font-bold gradient-text">Overview</h1>
            <p className="text-muted-foreground">Manage your events and certificate templates.</p>
          </div>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-white text-black px-6 py-3 rounded-2xl font-semibold flex items-center gap-2 hover:bg-white/90 transition-all active:scale-95"
          >
            <Plus className="w-5 h-5" />
            New Event
          </button>
        </header>

        {loading ? (
          <div className="flex flex-col items-center justify-center h-64 gap-4">
            <Loader2 className="w-10 h-10 text-primary animate-spin" />
            <p className="text-sm text-muted-foreground animate-pulse">Fetching your events...</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bento-card col-span-1 md:col-span-2 flex flex-col justify-between min-h-[200px]">
                <div className="flex justify-between items-start">
                  <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center border border-white/10">
                    <Users className="text-white w-6 h-6" />
                  </div>
                  <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Total Claims</span>
                </div>
                <div>
                  <div className="text-5xl font-bold mb-1">0</div>
                  <p className="text-sm text-muted-foreground font-medium">No claims recorded yet</p>
                </div>
              </div>

              <div className="bento-card flex flex-col justify-between min-h-[200px]">
                <div className="flex justify-between items-start">
                  <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center border border-white/10">
                    <Award className="text-white w-6 h-6" />
                  </div>
                  <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Active Templates</span>
                </div>
                <div>
                  <div className="text-5xl font-bold mb-1">{events.length}</div>
                  <p className="text-sm text-muted-foreground font-medium">Ready for distribution</p>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">Recent Events</h2>
              </div>
              
              <div className="grid grid-cols-1 gap-4">
                {events.length === 0 ? (
                  <div className="bento-card p-12 text-center text-muted-foreground flex flex-col items-center gap-4">
                    <Award className="w-12 h-12 opacity-20" />
                    <p>No events found. Create your first event to get started!</p>
                  </div>
                ) : (
                  events.map((event, index) => (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      key={event.id}
                      className="group bento-card p-4 flex items-center justify-between hover:border-primary/30"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20">
                          <Award className="text-primary w-6 h-6" />
                        </div>
                        <div>
                          <h3 className="font-bold text-lg group-hover:text-primary transition-colors">{event.name}</h3>
                          <p className="text-sm text-muted-foreground">ID: {event.id.slice(0, 8)}...</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4">
                        <div className={cn(
                          "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border",
                          event.status === 'Active' 
                            ? "bg-green-500/10 text-green-400 border-green-500/20" 
                            : "bg-orange-500/10 text-orange-400 border-orange-500/20"
                        )}>
                          {event.status}
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={() => {
                              const url = `${window.location.origin}/claim/${event.id}`;
                              navigator.clipboard.writeText(url);
                              toast.success('Claim link copied!');
                            }}
                            className="p-2 rounded-lg hover:bg-white/5 text-muted-foreground hover:text-white transition-all" 
                            title="Copy link"
                          >
                            <Share2 className="w-5 h-5" />
                          </button>
                          <Link 
                            href={`/admin/editor/${event.id}`}
                            className="bg-white/5 hover:bg-white/10 px-4 py-2 rounded-xl border border-white/10 font-medium transition-all text-sm"
                          >
                            Edit
                          </Link>
                          <button 
                            onClick={() => setEventToDelete(event.id)}
                            className="p-2 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-all"
                            title="Delete event"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            </div>
          </>
        )}

        {/* New Event Modal */}
        <AnimatePresence>
          {isModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsModalOpen(false)}
                className="absolute inset-0 bg-black/80 backdrop-blur-sm"
              />
              <motion.div 
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                className="relative w-full max-w-lg glass p-8 rounded-3xl space-y-6 shadow-2xl border border-white/10"
              >
                <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-bold">New Event</h2>
                  <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <form onSubmit={handleCreateEvent} className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-muted-foreground uppercase">Event Name</label>
                    <input 
                      type="text" 
                      required
                      placeholder="e.g. Design Hackathon 2024"
                      value={newEvent.name}
                      onChange={e => setNewEvent({ ...newEvent, name: e.target.value })}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:ring-2 ring-primary transition-all"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-muted-foreground uppercase">Certificate Template</label>
                    <div className="relative group">
                      <input 
                        type="file" 
                        accept="image/*"
                        required
                        onChange={e => setNewEvent({ ...newEvent, file: e.target.files?.[0] || null })}
                        className="absolute inset-0 opacity-0 cursor-pointer z-10"
                      />
                      <div className="border-2 border-dashed border-white/10 rounded-2xl p-10 text-center group-hover:border-primary/50 transition-all flex flex-col items-center gap-3 bg-white/[0.02]">
                        {newEvent.file ? (
                          <>
                            <ImageIcon className="w-12 h-12 text-primary" />
                            <p className="font-medium text-sm">{newEvent.file.name}</p>
                          </>
                        ) : (
                          <>
                            <Plus className="w-12 h-12 text-muted-foreground group-hover:scale-110 transition-transform" />
                            <div className="space-y-1">
                              <p className="text-sm font-medium">Drop your certificate image here</p>
                              <p className="text-xs text-muted-foreground">PNG or JPG, up to 10MB</p>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <button 
                    type="submit"
                    disabled={isCreating}
                    className="w-full bg-white text-black py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-white/90 active:scale-[0.98] transition-all disabled:opacity-50"
                  >
                    {isCreating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
                    Create Event
                  </button>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Delete Confirmation Modal */}
        <AnimatePresence>
          {eventToDelete && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
              <motion.div 
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                className="relative w-full max-w-md glass p-8 rounded-3xl space-y-6 border border-white/10"
              >
                <div className="flex flex-col items-center text-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-destructive/10 flex items-center justify-center border border-destructive/20">
                    <AlertCircle className="text-destructive w-8 h-8" />
                  </div>
                  <div className="space-y-2">
                    <h2 className="text-2xl font-bold">Delete Event?</h2>
                    <p className="text-muted-foreground">This action cannot be undone. All claims associated with this event will be permanently removed.</p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button 
                    onClick={() => setEventToDelete(null)}
                    className="flex-1 px-6 py-4 rounded-2xl bg-white/5 hover:bg-white/10 font-bold transition-all"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleDeleteEvent}
                    disabled={isDeleting}
                    className="flex-1 px-6 py-4 rounded-2xl bg-destructive text-white hover:bg-destructive/90 font-bold transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isDeleting && <Loader2 className="w-5 h-5 animate-spin" />}
                    Delete
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </AdminLayout>
  );
}
