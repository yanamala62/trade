import React, { useState } from 'react';
import { X, Server, ShieldAlert, Cpu } from 'lucide-react';
import { getBackendBaseUrl, setBackendBaseUrl } from '../services/api';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  systemHealth: any;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, systemHealth }) => {
  const [hostUrl, setHostUrl] = useState(getBackendBaseUrl());
  const [savedMessage, setSavedMessage] = useState(false);

  if (!isOpen) return null;

  const handleSave = () => {
    setBackendBaseUrl(hostUrl);
    setSavedMessage(true);
    setTimeout(() => {
      setSavedMessage(false);
      window.location.reload();
    }, 700);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-md w-full p-6 shadow-2xl space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Server className="w-5 h-5 text-indigo-400" />
            <h3 className="text-lg font-semibold text-white">System & APK Configuration</h3>
          </div>
          <button 
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Backend API Host Configuration for APK & Mobile */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
            Backend API & WebSocket Host
          </label>
          <p className="text-xs text-slate-400">
            Render live backend: <code className="text-indigo-300">https://trade-yccn.onrender.com</code>, or local PC IP for offline emulator testing.
          </p>
          <input
            type="text"
            value={hostUrl}
            onChange={(e) => setHostUrl(e.target.value)}
            className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white focus:outline-hidden focus:border-indigo-500 font-mono"
            placeholder="https://trade-yccn.onrender.com"
          />
        </div>

        {/* Live Broker & Engine Specs */}
        <div className="bg-slate-950/60 p-4 rounded-lg border border-slate-800/80 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400 flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-slate-400" /> Active Broker Feed:
            </span>
            <span className="font-semibold text-emerald-400">
              {systemHealth?.active_broker || 'MockBroker (Continuous NSE)'}
            </span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400">Default Capital:</span>
            <span className="font-semibold text-slate-200">₹{systemHealth?.capital?.toLocaleString('en-IN') || '5,00,000'}</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400">Max Risk per Trade:</span>
            <span className="font-semibold text-slate-200">1.0% (Hard Gate)</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400">Daily Loss Limit:</span>
            <span className="font-semibold text-slate-200">3.0% (Hard Gate)</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400">Market Window Gate:</span>
            <span className="font-semibold text-amber-400">09:20 - 15:15 IST</span>
          </div>
        </div>

        {/* Disclaimer */}
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3 flex gap-2.5 items-start text-xs text-amber-300/90">
          <ShieldAlert className="w-4 h-4 shrink-0 text-amber-400 mt-0.5" />
          <span>
            Strict decision-support only. No automatic order execution. Always exercise human discretion before taking trades.
          </span>
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white transition"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-5 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition shadow-md shadow-indigo-600/30"
          >
            {savedMessage ? 'Saved! Reloading...' : 'Save & Connect'}
          </button>
        </div>
      </div>
    </div>
  );
};
