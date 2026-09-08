"use client";

import { Icon } from "@/components/ui/icon";
import { useApp } from "@/hooks/useApp";
import { useState } from "react";
import * as db from "@/lib/database";

export default function SettingsPage() {
  const { profile, refreshData } = useApp();
  const [showConfirm, setShowConfirm] = useState(false);

  const handleResetData = async () => {
    if (showConfirm) {
      await db.clearAllData();
      await refreshData();
      setShowConfirm(false);
    } else {
      setShowConfirm(true);
    }
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="bg-white sticky top-0 md:top-16 z-30 backdrop-blur-md bg-white/95">
        <div className="max-w-2xl mx-auto px-4 py-5">
          <div className="flex items-center gap-2">
            <Icon name="Settings" size={22} className="text-accent" />
            <h1 className="text-xl font-bold text-slate-700">Settings</h1>
          </div>
          <p className="text-sm text-slate-400 mt-0.5">Make codora yours</p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* About Hero */}
        <div className="animate-fade-in-up opacity-0" style={{ animationFillMode: "forwards" }}>
          <div className="bg-white rounded-3xl p-6 text-foreground shadow-xl shadow-primary/50 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full blur-2xl" />
            <div className="relative text-center">
              <div className="w-16 h-16 mx-auto mb-3 rounded-2xl bg-white/40 backdrop-blur-sm flex items-center justify-center">
                <Icon name="Leaf" size={32} className="text-foreground" />
              </div>
              <h2 className="text-2xl font-bold mb-1">codora c++</h2>
              <p className="text-foreground/70 text-sm">v1.0.0 - Offline-First PWA</p>
            </div>
          </div>
        </div>

        {/* Features */}
        <div className="grid grid-cols-2 gap-3">
          <div className="group bg-white rounded-2xl p-4 shadow-lg shadow-[var(--shadow-color)]/60 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 animate-fade-in-up opacity-0" style={{ animationDelay: "0.1s", animationFillMode: "forwards" }}>
            <div className="w-10 h-10 mb-2 rounded-xl bg-background flex items-center justify-center group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
              <Icon name="Wifi" size={20} className="text-accent" />
            </div>
            <p className="font-semibold text-slate-700 text-sm">Works Offline</p>
            <p className="text-xs text-slate-400">No internet needed</p>
          </div>
          <div className="group bg-white rounded-2xl p-4 shadow-lg shadow-[var(--shadow-color)]/60 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 animate-fade-in-up opacity-0" style={{ animationDelay: "0.15s", animationFillMode: "forwards" }}>
            <div className="w-10 h-10 mb-2 rounded-xl bg-background flex items-center justify-center group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
              <Icon name="Database" size={20} className="text-accent" />
            </div>
            <p className="font-semibold text-slate-700 text-sm">Local Storage</p>
            <p className="text-xs text-slate-400">Data stays private</p>
          </div>
          <div className="group bg-white rounded-2xl p-4 shadow-lg shadow-[var(--shadow-color)]/60 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 animate-fade-in-up opacity-0" style={{ animationDelay: "0.2s", animationFillMode: "forwards" }}>
            <div className="w-10 h-10 mb-2 rounded-xl bg-violet-50 flex items-center justify-center group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
              <Icon name="Smartphone" size={20} className="text-violet-500" />
            </div>
            <p className="font-semibold text-slate-700 text-sm">Installable</p>
            <p className="text-xs text-slate-400">Add to home screen</p>
          </div>
          <div className="group bg-white rounded-2xl p-4 shadow-lg shadow-[var(--shadow-color)]/60 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 animate-fade-in-up opacity-0" style={{ animationDelay: "0.25s", animationFillMode: "forwards" }}>
            <div className="w-10 h-10 mb-2 rounded-xl bg-amber-50 flex items-center justify-center group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
              <Icon name="Cpu" size={20} className="text-amber-500" />
            </div>
            <p className="font-semibold text-slate-700 text-sm">C++ Compiler</p>
            <p className="text-xs text-slate-400">In your browser</p>
          </div>
        </div>

        {/* Preferences */}
        <div className="animate-fade-in-up opacity-0" style={{ animationDelay: "0.3s", animationFillMode: "forwards" }}>
          <div className="bg-white rounded-2xl p-5 shadow-lg shadow-[var(--shadow-color)]/60 hover:shadow-lg transition-shadow duration-300">
            <h3 className="font-bold text-slate-700 mb-4 flex items-center gap-2">
              <Icon name="Settings" size={16} className="text-foreground" />
              Preferences
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-medium text-slate-700 text-sm">Daily Goal</p>
                  <p className="text-xs text-slate-400">Problems per day</p>
                </div>
                <div className="flex gap-1">
                  {[3, 5, 10].map((goal) => (
                    <button
                      key={goal}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-300 ${
                        profile.dailyGoal === goal
                          ? "bg-secondary text-foreground shadow-md"
                          : "bg-background text-slate-600 hover:bg-secondary"
                      }`}
                    >
                      {goal}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Reset Data */}
        <div className="animate-fade-in-up opacity-0" style={{ animationDelay: "0.4s", animationFillMode: "forwards" }}>
          <div className="bg-white rounded-2xl p-5 shadow-lg shadow-[var(--shadow-color)]/60 hover:shadow-lg transition-shadow duration-300">
            <div className="flex items-center gap-2 mb-2">
              <Icon name="AlertTriangle" size={16} className="text-rose-500" />
              <h3 className="font-bold text-rose-600">Danger Zone</h3>
            </div>
            <p className="text-xs text-slate-400 mb-3">
              This will permanently delete all your progress, achievements, and settings.
            </p>
            <button
              onClick={handleResetData}
              className={`w-full px-4 py-2.5 rounded-xl font-semibold transition-all duration-300 text-sm flex items-center justify-center gap-2 ${
                showConfirm
                  ? "bg-rose-500 text-white hover:bg-rose-600 shadow-md"
                  : "bg-rose-50 text-rose-600 hover:bg-rose-100"
              }`}
            >
              {showConfirm ? (
                <>
                  <Icon name="RotateCcw" size={16} />
                  Tap again to confirm
                </>
              ) : (
                <>
                  <Icon name="Trash2" size={16} />
                  Reset All Data
                </>
              )}
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center py-4 animate-fade-in-up opacity-0" style={{ animationDelay: "0.5s", animationFillMode: "forwards" }}>
          <div className="flex items-center justify-center gap-1 text-sm text-slate-400 mb-1">
            Made with <Icon name="Heart" size={14} className="text-rose-400" /> for c++ students
          </div>
          <p className="text-xs text-slate-300">
            Learn - Try - Debug - Pass - Progress
          </p>
        </div>
      </div>
    </div>
  );
}