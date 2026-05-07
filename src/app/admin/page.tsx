"use client";

import React from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Plus, Award, Users, Share2, ArrowUpRight } from 'lucide-react';
import { motion } from 'framer-motion';
import Link from 'next/link';

export default function AdminDashboard() {
  const events = [
    { id: '1', name: 'Web Dev Workshop 2024', claimed: 124, status: 'Active' },
    { id: '2', name: 'Design Sprint Certificate', claimed: 45, status: 'Draft' },
  ];

  return (
    <AdminLayout>
      <div className="p-10 max-w-7xl mx-auto space-y-10">
        <header className="flex justify-between items-end">
          <div className="space-y-1">
            <h1 className="text-4xl font-bold gradient-text">Overview</h1>
            <p className="text-muted-foreground">Manage your events and certificate templates.</p>
          </div>
          <button className="bg-white text-black px-6 py-3 rounded-2xl font-semibold flex items-center gap-2 hover:bg-white/90 transition-all active:scale-95">
            <Plus className="w-5 h-5" />
            New Event
          </button>
        </header>

        {/* Bento Grid Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bento-card col-span-1 md:col-span-2 flex flex-col justify-between min-h-[200px]">
            <div className="flex justify-between items-start">
              <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center border border-white/10">
                <Users className="text-white w-6 h-6" />
              </div>
              <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Total Claims</span>
            </div>
            <div>
              <div className="text-5xl font-bold mb-1">1,284</div>
              <p className="text-sm text-green-400 flex items-center gap-1 font-medium">
                <ArrowUpRight className="w-4 h-4" /> +12% from last month
              </p>
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
              <div className="text-5xl font-bold mb-1">12</div>
              <p className="text-sm text-muted-foreground font-medium">Across 4 events</p>
            </div>
          </div>
        </div>

        {/* Recent Events List */}
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold">Recent Events</h2>
            <Link href="/admin/events" className="text-sm text-muted-foreground hover:text-white transition-colors">View all</Link>
          </div>
          
          <div className="grid grid-cols-1 gap-4">
            {events.map((event, index) => (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                key={event.id}
                className="group bento-card p-4 flex items-center justify-between"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20">
                    <Award className="text-primary w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg group-hover:text-primary transition-colors">{event.name}</h3>
                    <p className="text-sm text-muted-foreground">{event.claimed} certificates claimed</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-6">
                  <div className={cn(
                    "px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border",
                    event.status === 'Active' 
                      ? "bg-green-500/10 text-green-400 border-green-500/20" 
                      : "bg-orange-500/10 text-orange-400 border-orange-500/20"
                  )}>
                    {event.status}
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <button className="p-2 rounded-lg hover:bg-white/5 text-muted-foreground transition-colors" title="Share link">
                      <Share2 className="w-5 h-5" />
                    </button>
                    <Link 
                      href={`/admin/editor/${event.id}`}
                      className="bg-white/5 hover:bg-white/10 px-4 py-2 rounded-xl border border-white/10 font-medium transition-all"
                    >
                      Edit Template
                    </Link>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
