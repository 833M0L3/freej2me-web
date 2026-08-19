import React, { useState } from 'react';
import GameCard from './GameCard';
import { Search, FolderOpen } from 'lucide-react';

export default function GameGrid({ games, onPlayGame, isLoading }) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredGames = games.filter(g => {
    const term = searchTerm.toLowerCase();
    const titleMatch = (g.title || '').toLowerCase().includes(term);
    const vendorMatch = (g.vendor || '').toLowerCase().includes(term);
    return titleMatch || vendorMatch;
  });

  return (
    <section className="max-w-5xl mx-auto px-4 py-6">
      
      {/* Search Input (only shown if multiple games exist) */}
      {games.length > 3 && (
        <div className="mb-6 flex justify-end">
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search games..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 font-vt text-base bg-white border-2 border-black text-black placeholder-slate-500 focus:outline-none shadow-[2px_2px_0px_#000]"
            />
          </div>
        </div>
      )}

      {/* Loading Skeleton */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="wap-box p-4 animate-pulse flex flex-col items-center">
              <div className="w-18 h-18 bg-slate-300 border-2 border-black mb-3" />
              <div className="h-4 bg-slate-300 rounded w-3/4 mb-2" />
              <div className="h-3 bg-slate-200 rounded w-1/2 mb-4" />
              <div className="h-8 bg-lime-500 rounded w-full border-2 border-black" />
            </div>
          ))}
        </div>
      ) : filteredGames.length > 0 ? (
        /* Game Cards Grid */
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {filteredGames.map((game, index) => (
            <GameCard key={game.id || index} game={game} onPlay={onPlayGame} />
          ))}
        </div>
      ) : (
        /* Empty State */
        <div className="wap-box p-8 text-center max-w-md mx-auto my-8">
          <div className="w-12 h-12 bg-slate-100 border-2 border-black flex items-center justify-center mx-auto mb-3 text-black">
            <FolderOpen className="w-6 h-6" />
          </div>
          <h3 className="font-pixel text-xs text-black mb-2">NO GAMES FOUND</h3>
          <p className="font-vt text-base text-slate-700">
            {searchTerm ? `No games match "${searchTerm}"` : 'Drop J2ME games into web/games/jar/ and run npm run scan'}
          </p>
        </div>
      )}

    </section>
  );
}
