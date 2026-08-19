import React, { useState } from 'react';
import { Play, Gamepad2 } from 'lucide-react';

export default function GameCard({ game, onPlay }) {
  const [imgError, setImgError] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handlePlayClick = async (e) => {
    setIsLoading(true);
    try {
      const isTouch = (e && e.pointerType === 'touch') || ('ontouchstart' in window) || (navigator.maxTouchPoints > 0) || (window.innerWidth <= 800);
      await onPlay(game, isTouch);
    } catch (err) {
      console.error(err);
      setIsLoading(false);
    }
  };

  return (
    <div className="wap-box group relative p-4 flex flex-col items-center text-center transition-transform hover:-translate-y-1">
      
      {/* Top Retro Tag */}
      <div className="w-full bg-black text-lime-400 font-pixel text-[9px] py-0.5 px-2 border-b-2 border-black flex justify-between items-center mb-3">
        <span>[ JAVA GAME ]</span>
        <span className="text-white">{game.size || 'JAR'}</span>
      </div>

      {/* Game Icon */}
      <div className="relative mb-3">
        <div className="w-18 h-18 bg-slate-100 border-2 border-black p-1 flex items-center justify-center shadow-[2px_2px_0px_#000]">
          {game.icon && !imgError ? (
            <img
              src={game.icon}
              alt={game.title}
              className="w-full h-full object-cover"
              onError={() => setImgError(true)}
            />
          ) : (
            <Gamepad2 className="w-9 h-9 text-black" />
          )}
        </div>
      </div>

      {/* Game Title & Vendor */}
      <h3 className="font-pixel text-xs text-black group-hover:text-lime-600 tracking-tight line-clamp-1 mb-1 font-bold">
        {game.title || game.id || "Untitled Game"}
      </h3>
      
      <p className="font-vt text-base text-slate-600 line-clamp-1 mb-3">
        {game.vendor ? `By ${game.vendor}` : game.description || "J2ME Mobile Game"}
      </p>

      {/* Retro Badges */}
      <div className="flex flex-wrap items-center justify-center gap-1 mb-4 mt-auto">
        {game.version && (
          <span className="wap-badge bg-lime-100 text-black border-black">
            v{game.version}
          </span>
        )}
        {game.screenSize && (
          <span className="wap-badge bg-slate-100 text-black border-black">
            {game.screenSize}
          </span>
        )}
        {game.phoneType && (
          <span className="wap-badge bg-slate-100 text-black border-black">
            {game.phoneType}
          </span>
        )}
      </div>

      {/* Retro Lime Green Play Button */}
      <button
        onClick={handlePlayClick}
        disabled={isLoading}
        className="wap-btn-play w-full py-2 px-3 font-pixel text-xs flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-70"
      >
        {isLoading ? (
          <>
            <div className="w-3.5 h-3.5 border-2 border-black/40 border-t-black rounded-full animate-spin" />
            <span>LOADING...</span>
          </>
        ) : (
          <>
            <Play className="w-3.5 h-3.5 fill-black text-black" />
            <span>▶ PLAY NOW</span>
          </>
        )}
      </button>

    </div>
  );
}
