import React, { useState, useEffect } from 'react';
import { X, Server, ShieldAlert, Cpu, Sparkles, CheckCircle2, AlertCircle, ExternalLink } from 'lucide-react';
import { getBackendBaseUrl, setBackendBaseUrl, getGeminiApiKey, setGeminiApiKey, verifyGeminiApiKey } from '../services/api';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  systemHealth: any;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, systemHealth }) => {
  const [hostUrl, setHostUrl] = useState(getBackendBaseUrl());
  const [geminiKey, setGeminiKey] = useState(getGeminiApiKey());
  const [isVerifyingKey, setIsVerifyingKey] = useState(false);
  const [verifyStatus, setVerifyStatus] = useState<{ valid?: boolean; message?: string } | null>(null);
  const [savedMessage, setSavedMessage] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setHostUrl(getBackendBaseUrl());
      setGeminiKey(getGeminiApiKey());
      setVerifyStatus(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleTestKey = async () => {
    if (!geminiKey.trim()) {
      setVerifyStatus({ valid: false, message: 'Please enter a Gemini API key first.' });
      return;
    }
    setIsVerifyingKey(true);
    setVerifyStatus(null);
    const res = await verifyGeminiApiKey(geminiKey.trim());
    setIsVerifyingKey(false);
    if (res.valid) {
      setVerifyStatus({ valid: true, message: `Connected to Google Gemini (${res.model || 'gemini-1.5-flash'})!` });
    } else {
      setVerifyStatus({ valid: false, message: res.error || 'Invalid API key or network error.' });
    }
  };

  const handleSave = () => {
    setBackendBaseUrl(hostUrl);
    setGeminiKey(geminiKey);
    setSavedMessage(true);
    setTimeout(() => {
      setSavedMessage(false);
      onClose();
      window.location.reload();
    }, 700);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-lg w-full p-6 shadow-2xl space-y-5 my-8">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Server className="w-5 h-5 text-indigo-400" />
            <h3 className="text-lg font-semibold text-white">System & AI Configuration</h3>
          </div>
          <button 
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 1. Google Gemini AI API Key (User Login / Key Input) */}
        <div className="space-y-2 p-3.5 rounded-xl bg-slate-950 border border-indigo-500/30">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>Google Gemini AI Access</span>
            </label>
            <a
              href="https://aistudio.google.com/app/apikey"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[11px] text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
            >
              <span>Get Free Key</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
          <p className="text-xs text-slate-400">
            Enter your Google Gemini API key to enable live AI trade explanations, corporate news sentiment analysis, and stock catalyst scanning.
          </p>
          <div className="flex gap-2">
            <input
              type="password"
              value={geminiKey}
              onChange={(e) => {
                setGeminiKey(e.target.value);
                setVerifyStatus(null);
              }}
              className="flex-1 px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white focus:outline-hidden focus:border-indigo-500 font-mono"
              placeholder="AIzaSy..."
            />
            <button
              onClick={handleTestKey}
              disabled={isVerifyingKey || !geminiKey.trim()}
              className="px-3 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-lg text-xs font-semibold shrink-0 transition"
            >
              {isVerifyingKey ? 'Testing...' : 'Test AI'}
            </button>
          </div>

          {verifyStatus && (
            <div className={`flex items-center gap-1.5 text-xs p-2 rounded-lg font-medium ${
              verifyStatus.valid ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30' : 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
            }`}>
              {verifyStatus.valid ? <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" /> : <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />}
              <span>{verifyStatus.message}</span>
            </div>
          )}
        </div>

        {/* 2. Backend API Host Configuration for APK & Mobile */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
            Backend API & WebSocket Host
          </label>
          <p className="text-xs text-slate-400">
            Render live backend: <code className="text-indigo-300">https://trade-yccn.onrender.com</code>
          </p>
          <input
            type="text"
            value={hostUrl}
            onChange={(e) => setHostUrl(e.target.value)}
            className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white focus:outline-hidden focus:border-indigo-500 font-mono"
            placeholder="https://trade-yccn.onrender.com"
          />
        </div>

        {/* 3. Live Broker & Engine Specs */}
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
        </div>

        {/* 4. Disclaimer */}
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3 flex gap-2.5 items-start text-xs text-amber-300/90">
          <ShieldAlert className="w-4 h-4 shrink-0 text-amber-400 mt-0.5" />
          <span>
            Decision-support only. No automatic order execution. Always exercise human discretion before taking trades.
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
            {savedMessage ? 'Saved! Reloading...' : 'Save Settings'}
          </button>
        </div>
      </div>
    </div>
  );
};
