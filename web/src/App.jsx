import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import GameGrid from './components/GameGrid';
import KeypadModal from './components/KeypadModal';
import { installRangeFetchPolyfill } from './rangePolyfill.js';

installRangeFetchPolyfill();

export default function App() {
  const [games, setGames] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isControlsOpen, setIsControlsOpen] = useState(false);

  useEffect(() => {
    fetchCatalog();
  }, []);

  const fetchCatalog = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('games/games.json');
      if (res.ok) {
        const data = await res.json();
        setGames(data);
      }
    } catch (e) {
      console.warn("Could not load games/games.json:", e);
    } finally {
      setIsLoading(false);
    }
  };

  const initCheerpJIfNeeded = async () => {
    if (window.launcherUtil) return window.launcherUtil;

    if (window.cheerpjInit) {
      await window.cheerpjInit({ enableDebug: false });
    }

    const cheerpjWebRoot = '/app' + location.pathname.replace(/\/[^/]*$/, '');
    const lib = await window.cheerpjRunLibrary(cheerpjWebRoot + "/freej2me-web.jar");
    const launcherUtil = await lib.pl.zb3.freej2me.launcher.LauncherUtil;
    await launcherUtil.resetTmpDir();

    const Config = await lib.org.recompile.freej2me.Config;
    const defaultSettings = {};
    const es = await Config.DEFAULT_SETTINGS.entrySet();
    const esi = await es.iterator();
    while (await esi.hasNext()) {
      const entry = await esi.next();
      const key = await entry.getKey();
      const value = await entry.getValue();
      defaultSettings[key] = value;
    }

    window.cheerpJLib = lib;
    window.launcherUtil = launcherUtil;
    window.defaultSettings = defaultSettings;
    return launcherUtil;
  };

  const handlePlayGame = async (game, isTouch) => {
    const isMobileDevice = isTouch || ('ontouchstart' in window) || (navigator.maxTouchPoints > 0) || (window.innerWidth <= 800);
    const mobileParam = isMobileDevice ? '&mobile=1' : '';

    if (game.appId) {
      window.location.href = `run?app=${encodeURIComponent(game.appId)}${mobileParam}`;
      return;
    }

    if (!game.jar) {
      alert("Game entry missing JAR file path!");
      return;
    }

    const appId = game.id || game.title.toLowerCase().replace(/[^a-z0-9]/g, '_');

    try {
      const launcherUtil = await initCheerpJIfNeeded();
      const lib = window.cheerpJLib;
      const defaultSettings = window.defaultSettings;

      const res = await fetch(game.jar);
      if (!res.ok) throw new Error(`HTTP ${res.status} - ${game.jar} not found`);
      const fileBuffer = await res.arrayBuffer();

      const File = await lib.java.io.File;
      window.uploadedJars = (window.uploadedJars || 0) + 1;
      const jarFile = await new File("/files/_tmp/" + window.uploadedJars + ".jar");
      await launcherUtil.copyJar(new Int8Array(fileBuffer), jarFile);

      const MIDletLoader = await lib.org.recompile.mobile.MIDletLoader;
      const loader = await MIDletLoader.getMIDletLoader(jarFile);

      if (game.jad) {
        try {
          const jadRes = await fetch(game.jad);
          if (jadRes.ok) {
            const jadAb = await jadRes.arrayBuffer();
            await launcherUtil.augementLoaderWithJAD(loader, new Int8Array(jadAb));
          }
        } catch (e) {}
      }

      if (!(await loader.getAppId())) {
        await launcherUtil.ensureAppId(loader, game.title || appId);
      }

      let finalAppId = (await loader.getAppId()) || appId;

      const settings = {
        ...defaultSettings,
        phone: game.phoneType || "Nokia",
        sound: game.enableSound !== false ? "on" : "off",
      };
      if (game.screenSize) {
        const [w, h] = game.screenSize.split("x");
        if (w && h) {
          settings.width = w;
          settings.height = h;
        }
      }

      const HashMap = await lib.java.util.HashMap;
      const jsettings = await new HashMap();
      for (const k of Object.keys(settings)) {
        await jsettings.put(k, settings[k]);
      }
      const jappProps = await new HashMap();
      const jsysProps = await new HashMap();

      await launcherUtil.initApp(jarFile, loader, jsettings, jappProps, jsysProps);
      window.location.href = `run?app=${encodeURIComponent(finalAppId)}${mobileParam}`;
    } catch (err) {
      console.error("Error launching game:", err);
      alert(`Failed to launch game: ${err.message}`);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header onOpenControls={() => setIsControlsOpen(true)} />
      
      <main className="flex-grow">
        <GameGrid games={games} onPlayGame={handlePlayGame} isLoading={isLoading} />
      </main>

      <footer className="py-4 bg-black text-white border-t-4 border-lime-500 text-center font-vt text-base tracking-wider">
        <p>★ WAPTRICK J2ME VAULT &bull; POWERED BY <span className="text-lime-400 font-pixel text-xs">FREEJ2ME & CHEERPJ</span> ★</p>
      </footer>

      <KeypadModal isOpen={isControlsOpen} onClose={() => setIsControlsOpen(false)} />
    </div>
  );
}
