import React from 'react';
import { X, Smartphone, Keyboard, Info } from 'lucide-react';

export default function KeypadModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-150">
      
      {/* Clean White Popup Box */}
      <div 
        className="relative w-full max-w-xl bg-white border-4 border-black shadow-[8px_8px_0px_#000] p-4 sm:p-6 text-black overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Black Header with Lime Accent */}
        <div className="bg-black text-white border-2 border-black p-3 mb-4 flex items-center justify-between shadow-[2px_2px_0px_#84cc16]">
          <div className="flex items-center gap-2 font-pixel text-xs font-bold text-lime-400">
            <Smartphone className="w-4 h-4 text-lime-400" />
            <span>NOKIA KEYPAD MAPPER</span>
          </div>
          <button
            onClick={onClose}
            className="font-pixel text-[11px] bg-lime-400 text-black hover:bg-lime-300 px-2 py-0.5 border-2 border-black font-bold cursor-pointer transition-colors"
          >
            [ X ]
          </button>
        </div>

        {/* Modal Content - White theme with Black borders & Lime Badges */}
        <div className="font-vt text-lg text-black space-y-3.5 max-h-[70vh] overflow-y-auto pr-1">
          
          {/* Section 1: Soft Keys */}
          <div className="bg-slate-50 border-2 border-black p-3">
            <div className="font-pixel text-[11px] bg-black text-lime-400 px-2 py-0.5 border border-black inline-block font-bold mb-2.5">
              SOFT KEYS (MOBILE MENUS)
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-base">
              <div className="flex justify-between items-center bg-white p-2 border-2 border-black">
                <span className="font-bold text-slate-800">Left Soft Key:</span>
                <span className="font-pixel text-xs bg-lime-400 text-black px-2 py-0.5 border-2 border-black font-bold shadow-[1px_1px_0px_#000]">F1 / Q</span>
              </div>
              <div className="flex justify-between items-center bg-white p-2 border-2 border-black">
                <span className="font-bold text-slate-800">Right Soft Key:</span>
                <span className="font-pixel text-xs bg-lime-400 text-black px-2 py-0.5 border-2 border-black font-bold shadow-[1px_1px_0px_#000]">F2 / W</span>
              </div>
            </div>
          </div>

          {/* Section 2: D-Pad & Action */}
          <div className="bg-slate-50 border-2 border-black p-3">
            <div className="font-pixel text-[11px] bg-black text-lime-400 px-2 py-0.5 border border-black inline-block font-bold mb-2.5">
              D-PAD & SELECTION
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-base">
              <div className="flex justify-between items-center bg-white p-2 border-2 border-black">
                <span className="font-bold text-slate-800">Arrows:</span>
                <span className="font-pixel text-xs bg-lime-400 text-black px-2 py-0.5 border-2 border-black font-bold shadow-[1px_1px_0px_#000]">↑ ↓ ← →</span>
              </div>
              <div className="flex justify-between items-center bg-white p-2 border-2 border-black">
                <span className="font-bold text-slate-800">Action / OK:</span>
                <span className="font-pixel text-xs bg-lime-400 text-black px-2 py-0.5 border-2 border-black font-bold shadow-[1px_1px_0px_#000]">ENTER</span>
              </div>
            </div>
          </div>

          {/* Section 3: Numpad */}
          <div className="bg-slate-50 border-2 border-black p-3">
            <div className="font-pixel text-[11px] bg-black text-lime-400 px-2 py-0.5 border border-black inline-block font-bold mb-2.5">
              NUMPAD & SYMBOLS
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-base">
              <div className="flex justify-between items-center bg-white p-2 border-2 border-black">
                <span className="font-bold text-slate-800">0 - 9:</span>
                <span className="font-pixel text-[10px] bg-lime-400 text-black px-1.5 py-0.5 border-2 border-black font-bold shadow-[1px_1px_0px_#000]">0 - 9</span>
              </div>
              <div className="flex justify-between items-center bg-white p-2 border-2 border-black">
                <span className="font-bold text-slate-800">* Key:</span>
                <span className="font-pixel text-[10px] bg-lime-400 text-black px-1.5 py-0.5 border-2 border-black font-bold shadow-[1px_1px_0px_#000]">E / *</span>
              </div>
              <div className="flex justify-between items-center bg-white p-2 border-2 border-black">
                <span className="font-bold text-slate-800"># Key:</span>
                <span className="font-pixel text-[10px] bg-lime-400 text-black px-1.5 py-0.5 border-2 border-black font-bold shadow-[1px_1px_0px_#000]">R / #</span>
              </div>
            </div>
          </div>

          {/* Section 4: Options */}
          <div className="bg-slate-50 border-2 border-black p-2.5 flex justify-between items-center text-base">
            <span className="font-bold text-slate-800">Emulator Options Menu:</span>
            <span className="font-pixel text-xs bg-lime-400 text-black px-2 py-0.5 border-2 border-black font-bold shadow-[1px_1px_0px_#000]">ESC</span>
          </div>

          {/* Info Note */}
          <div className="flex items-start gap-2 p-2.5 bg-lime-100 border-2 border-black text-black text-base">
            <Info className="w-4 h-4 text-black shrink-0 mt-0.5" />
            <p>
              By default, games use <strong>Nokia</strong> key mappings (arrows = 2,4,6,8 and Enter = 5).
            </p>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="pt-4 border-t-2 border-black flex justify-end">
          <button
            onClick={onClose}
            className="font-pixel text-xs px-4 py-2 bg-lime-400 hover:bg-lime-300 text-black border-2 border-black shadow-[2px_2px_0px_#000] font-bold cursor-pointer transition-colors"
          >
            [ OK CLOSE ]
          </button>
        </div>

      </div>
    </div>
  );
}
