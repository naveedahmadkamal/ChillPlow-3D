/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { GameState, GameStats, VehicleUpgrades } from './types/game';
import { createScene, SceneBundle } from './game/threeScene';
import { GameEngine } from './game/gameEngine';
import { LEVELS } from './game/levels';
import { synthAudio } from './audio/synthAudio';
import { GameHUD } from './components/GameHUD';
import { TitleScreen } from './components/TitleScreen';
import { UpgradeDock } from './components/UpgradeDock';
import { PauseModal } from './components/PauseModal';
import { VictoryModal } from './components/VictoryModal';
import { TouchControls } from './components/TouchControls';

export default function App() {
  const containerRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<GameEngine | null>(null);
  const sceneBundleRef = useRef<SceneBundle | null>(null);

  const [gameState, setGameState] = useState<GameState>('title');
  const [stats, setStats] = useState<GameStats>({
    score: 0,
    coins: 150,
    clearedSnowCount: 0,
    totalSnowCount: 1,
    clearedPercent: 0,
    elapsedTime: 0,
    combo: {
      multiplier: 1.0,
      streak: 0,
      timer: 0,
      maxCombo: 1.0,
      lastPointsAdded: 0,
      label: '',
    },
    starsCollected: 0,
    reputation: {
      score: 50,
      rankTitle: 'Neighborhood Helper',
      incidents: [],
      roadsCleanedCount: 0,
      propertyDamageCount: 0,
      rescuedCabins: 0,
    },
    weather: {
      intensity: 'flurries',
      intensityFactor: 0.4,
      name: 'Cozy Flurries',
      icon: '❄️',
      desc: 'Light powder falling steadily',
      windAngle: 0,
      windSpeed: 0.5,
      accumulationRate: 0.35,
      timeRemainingInWeather: 40,
      blizzardWarning: false,
    },
    activeEvent: null,
  });

  const [upgrades, setUpgrades] = useState<VehicleUpgrades>({
    bladeLevel: 1,
    engineLevel: 1,
    blowerLevel: 1,
    saltLevel: 1,
    gripLevel: 1,
    colorScheme: 'nordic-red',
    bladeColor: 'gold',
    decalId: 'none',
  });

  const [currentLevelIndex, setCurrentLevelIndex] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isTouchDevice, setIsTouchDevice] = useState(false);

  // Initialize Three.js scene & Game Engine once on mount
  useEffect(() => {
    if (!containerRef.current) return;

    // Detect touch
    if ('ontouchstart' in window || navigator.maxTouchPoints > 0) {
      setIsTouchDevice(true);
    }

    const sceneBundle = createScene(containerRef.current);
    sceneBundleRef.current = sceneBundle;

    const engine = new GameEngine(sceneBundle.scene, sceneBundle.camera);
    engineRef.current = engine;

    engine.onStatsUpdate = (newStats) => {
      setStats({ ...newStats });
    };

    engine.onStateChange = (newState) => {
      setGameState(newState);
    };

    engine.init();

    // Animation Render Loop
    let frameId = 0;
    let lastTime = performance.now();
    const clockCenter = new THREE.Vector3();

    function afterDraw(cb: () => void) {
      const gl = sceneBundle.renderer.getContext() as WebGL2RenderingContext;
      const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
      gl.flush();
      const poll = () => {
        const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
        if (state === gl.UNSIGNALED) {
          frameId = window.setTimeout(poll, 5);
        } else {
          gl.deleteSync(sync);
          frameId = window.setTimeout(cb, 80);
        }
      };
      frameId = window.setTimeout(poll, 5);
    }

    function tick() {
      const now = performance.now();
      const dt = Math.min((now - lastTime) / 1000, 0.05);
      lastTime = now;

      // Update engine simulation
      engine.update(dt);

      // Update falling snowflakes center around vehicle
      if (engine.vehicleMeshBundle) {
        clockCenter.set(engine.vehicleState.x, 0, engine.vehicleState.z);
      }
      sceneBundle.updateSnowFall(dt, clockCenter);

      // Render
      sceneBundle.renderer.render(sceneBundle.scene, sceneBundle.camera);

      if (sceneBundle.isSoftwareGl) {
        afterDraw(tick);
      } else {
        frameId = requestAnimationFrame(tick);
      }
    }

    if (sceneBundle.isSoftwareGl) {
      afterDraw(tick);
    } else {
      frameId = requestAnimationFrame(tick);
    }

    // Keyboard controls
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!engineRef.current) return;
      const eng = engineRef.current;

      // Title screen quick-start
      if (eng.gameState === 'title') {
        if (e.code === 'Space' || e.code === 'Enter') {
          e.preventDefault();
          eng.setGameState('playing');
          return;
        }
      }

      // Pause toggle
      if (e.code === 'Escape') {
        e.preventDefault();
        if (eng.gameState === 'playing') eng.setGameState('paused');
        else if (eng.gameState === 'paused') eng.setGameState('playing');
        return;
      }

      // Vehicle steering keys
      if (e.code === 'KeyW' || e.code === 'ArrowUp') eng.inputs.forward = true;
      if (e.code === 'KeyS' || e.code === 'ArrowDown') eng.inputs.backward = true;
      if (e.code === 'KeyA' || e.code === 'ArrowLeft') eng.inputs.left = true;
      if (e.code === 'KeyD' || e.code === 'ArrowRight') eng.inputs.right = true;
      if (e.code === 'Space') {
        e.preventDefault();
        eng.inputs.boost = true;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (!engineRef.current) return;
      const eng = engineRef.current;
      if (e.code === 'KeyW' || e.code === 'ArrowUp') eng.inputs.forward = false;
      if (e.code === 'KeyS' || e.code === 'ArrowDown') eng.inputs.backward = false;
      if (e.code === 'KeyA' || e.code === 'ArrowLeft') eng.inputs.left = false;
      if (e.code === 'KeyD' || e.code === 'ArrowRight') eng.inputs.right = false;
      if (e.code === 'Space') eng.inputs.boost = false;
    };

    const handleBlur = () => {
      if (engineRef.current) {
        engineRef.current.inputs.forward = false;
        engineRef.current.inputs.backward = false;
        engineRef.current.inputs.left = false;
        engineRef.current.inputs.right = false;
        engineRef.current.inputs.boost = false;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('blur', handleBlur);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('blur', handleBlur);

      cancelAnimationFrame(frameId);
      clearTimeout(frameId);
      engine.dispose();
      sceneBundle.dispose();
    };
  }, []);

  // UI Handlers
  const handleStartGame = () => {
    if (engineRef.current) {
      engineRef.current.setGameState('playing');
    }
  };

  const handleSelectLevel = (index: number) => {
    if (engineRef.current) {
      setCurrentLevelIndex(index);
      engineRef.current.loadLevel(index);
      if (gameState !== 'playing') {
        engineRef.current.setGameState('playing');
      }
    }
  };

  const handleUpgrade = (id: keyof Omit<VehicleUpgrades, 'colorScheme' | 'bladeColor' | 'decalId'>) => {
    if (engineRef.current) {
      const success = engineRef.current.purchaseUpgrade(id);
      if (success) {
        setUpgrades({ ...engineRef.current.upgrades });
      }
    }
  };

  const handleSelectColor = (colorKey: string) => {
    if (engineRef.current) {
      engineRef.current.applyCustomization(
        colorKey,
        engineRef.current.upgrades.bladeColor,
        engineRef.current.upgrades.decalId
      );
      setUpgrades({ ...engineRef.current.upgrades });
    }
  };

  const handleSelectBladeColor = (bladeKey: string) => {
    if (engineRef.current) {
      engineRef.current.applyCustomization(
        engineRef.current.upgrades.colorScheme,
        bladeKey,
        engineRef.current.upgrades.decalId
      );
      setUpgrades({ ...engineRef.current.upgrades });
    }
  };

  const handleSelectDecal = (decalId: string) => {
    if (engineRef.current) {
      engineRef.current.applyCustomization(
        engineRef.current.upgrades.colorScheme,
        engineRef.current.upgrades.bladeColor,
        decalId
      );
      setUpgrades({ ...engineRef.current.upgrades });
    }
  };

  const handleToggleMute = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    synthAudio.setMuted(nextMuted);
  };

  const handleTouchInput = (
    action: 'forward' | 'backward' | 'left' | 'right' | 'boost',
    active: boolean
  ) => {
    if (engineRef.current) {
      engineRef.current.inputs[action] = active;
      if (action === 'boost' && active) {
        synthAudio.unlock();
      }
    }
  };

  const currentLevelConfig = LEVELS[currentLevelIndex].config;

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-slate-950 select-none">
      {/* 3D WebGL Canvas isolated container */}
      <div ref={containerRef} className="absolute inset-0 w-full h-full z-0 cursor-grab active:cursor-grabbing" />

      {/* Title Screen Overlay */}
      {gameState === 'title' && (
        <TitleScreen
          levels={LEVELS.map((l) => l.config)}
          currentLevelId={currentLevelConfig.id}
          stats={stats}
          onStartGame={handleStartGame}
          onSelectLevel={handleSelectLevel}
          onOpenGarage={() => {
            // Focus upgrades dock
          }}
        />
      )}

      {/* In-Game HUD Overlay */}
      {(gameState === 'playing' || gameState === 'paused' || gameState === 'level_complete') && (
        <GameHUD
          stats={stats}
          levelConfig={currentLevelConfig}
          vehicleState={engineRef.current?.vehicleState || {
            x: 0,
            z: 0,
            vx: 0,
            vz: 0,
            heading: 0,
            steerAngle: 0,
            speed: 0,
            isBoosting: false,
            boostFuel: 100,
            isDrifting: false,
            bladeWidth: 2.45,
          }}
          isMuted={isMuted}
          onToggleMute={handleToggleMute}
          onPause={() => {
            if (engineRef.current) engineRef.current.setGameState('paused');
          }}
        />
      )}

      {/* Virtual Touch Controls (Shown during playing) */}
      {gameState === 'playing' && isTouchDevice && (
        <TouchControls
          onInput={handleTouchInput}
          isBoosting={engineRef.current?.vehicleState.isBoosting || false}
        />
      )}

      {/* Unified Collapsible Bottom Dock (Upgrades, Customizer, Map) */}
      <UpgradeDock
        stats={stats}
        upgrades={upgrades}
        currentLevelId={currentLevelConfig.id}
        onUpgrade={handleUpgrade}
        onSelectColor={handleSelectColor}
        onSelectBladeColor={handleSelectBladeColor}
        onSelectDecal={handleSelectDecal}
        onSelectLevel={handleSelectLevel}
      />

      {/* Pause Modal */}
      {gameState === 'paused' && (
        <PauseModal
          stats={stats}
          isMuted={isMuted}
          onResume={() => {
            if (engineRef.current) engineRef.current.setGameState('playing');
          }}
          onRestart={() => {
            if (engineRef.current) {
              engineRef.current.loadLevel(currentLevelIndex);
              engineRef.current.setGameState('playing');
            }
          }}
          onToggleMute={handleToggleMute}
          onMainMenu={() => {
            if (engineRef.current) engineRef.current.setGameState('title');
          }}
        />
      )}

      {/* Level Complete / Victory Modal */}
      {gameState === 'level_complete' && (
        <VictoryModal
          stats={stats}
          levelConfig={currentLevelConfig}
          onNextLevel={() => {
            const nextIdx = (currentLevelIndex + 1) % LEVELS.length;
            handleSelectLevel(nextIdx);
          }}
          onReplay={() => {
            if (engineRef.current) {
              engineRef.current.loadLevel(currentLevelIndex);
              engineRef.current.setGameState('playing');
            }
          }}
          onMainMenu={() => {
            if (engineRef.current) engineRef.current.setGameState('title');
          }}
        />
      )}
    </div>
  );
}
