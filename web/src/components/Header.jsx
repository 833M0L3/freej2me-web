import React, { useState } from 'react';
import { Keyboard } from 'lucide-react';

export default function Header({ onOpenControls }) {
  const [logoError, setLogoError] = useState(false);

  return (
    <header className="w-full bg-black border-b-4 border-lime-500 shadow-lg">
      {/* Top Banner strip */}
      <div className="bg-lime-500 text-black font-pixel text-[10px] py-1 px-4 text-center font-bold tracking-widest uppercase">
        ★ FREE JAVA MOBILE GAMES PORTAL &bull; WAPTRICK J2ME VAULT ★
      </div>

      <div className="max-w-5xl mx-auto px-4 py-3.5 flex flex-col sm:flex-row items-center justify-between gap-3">
        
        {/* WAP Logo inside a clean white retro frame badge so "wap" (black) and "TRICK" (green) are 100% visible! */}
        <div className="flex items-center gap-3">
          {!logoError ? (
            <div className="bg-white px-3 py-1.5 border-2 border-black shadow-[3px_3px_0px_#84cc16] flex items-center justify-center">
              <img
                src="assets/waptrick-header.png"
                alt="Waptrick Logo"
                className="h-10 sm:h-12 w-auto object-contain"
                onError={(e) => {
                  if (e.target.src.includes('waptrick-header.png')) {
                    e.target.src = 'assets/waptrick.png';
                  } else {
                    setLogoError(true);
                  }
                }}
              />
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-lime-500 border-2 border-white flex items-center justify-center font-pixel font-bold text-black text-xl shadow-[2px_2px_0px_#fff]">
                W
              </div>
              <div>
                <h1 className="font-pixel text-xl sm:text-2xl text-white tracking-wider">
                  wap<span className="text-lime-400">TRICK</span>
                </h1>
                <p className="font-vt text-sm text-slate-300 tracking-wider">
                  Free Java (.JAR) Mobile Phone Games
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Retro Keypad Guide Button */}
        <button
          onClick={onOpenControls}
          className="font-pixel text-xs px-3.5 py-2 bg-white hover:bg-lime-400 text-black border-2 border-white hover:border-black shadow-[2px_2px_0px_#84cc16] active:translate-x-[1px] active:translate-y-[1px] flex items-center gap-2 font-bold cursor-pointer transition-all"
        >
          <Keyboard className="w-4 h-4 text-black" />
          <span>[ ⌨ KEYPAD GUIDE ]</span>
        </button>

      </div>
    </header>
  );
}
