import React, { useMemo, useRef, useState, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import {
  LIQUID_RIBBON_VERTEX_SHADER,
  LIQUID_RIBBON_FRAGMENT_SHADER,
  LIQUID_ORB_VERTEX_SHADER,
  LIQUID_ORB_FRAGMENT_SHADER,
  LIQUID_DROPLET_VERTEX_SHADER,
} from '../shaders/liquidMetalShaders';
import {
  SHARED_SCENE_STATE,
  detectWebGLAvailable,
  stepUnifiedSceneMotion,
} from '../hooks/useScrollAndMotion';
import { AmbientLightingMode } from '../types/void';

interface LiquidProps {
  lightingMode: AmbientLightingMode;
}

function CentralLiquidOrb({ lightingMode }: LiquidProps) {
  const orbRef = useRef<THREE.Mesh>(null);
  const outerRingRef = useRef<THREE.Mesh>(null);

  const orbUniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uScroll: { value: 0 },
      uAudioIntensity: { value: 0.35 },
      uWarmth: { value: lightingMode === 'champagne-noir' ? 1.0 : 0.25 },
      uPointer: { value: new THREE.Vector2(0, 0) },
    }),
    []
  );

  const ringUniforms = useMemo(
    () => ({
      uTime: { value: 1.8 },
      uScroll: { value: 0 },
      uAudioIntensity: { value: 0.35 },
      uWarmth: { value: lightingMode === 'champagne-noir' ? 1.0 : 0.25 },
      uPointer: { value: new THREE.Vector2(0, 0) },
    }),
    []
  );

  useEffect(() => {
    const targetWarmth = lightingMode === 'champagne-noir' ? 1.0 : 0.25;
    orbUniforms.uWarmth.value = targetWarmth;
    ringUniforms.uWarmth.value = targetWarmth;
  }, [lightingMode, orbUniforms, ringUniforms]);

  useFrame((_, delta) => {
    if (SHARED_SCENE_STATE.heroScrollProgress >= 0.995) return;

    const clampedDelta = Math.min(delta, 0.05);
    const speed = SHARED_SCENE_STATE.reducedMotion ? 0.15 : 1.0;
    orbUniforms.uTime.value += clampedDelta * speed;
    orbUniforms.uScroll.value = SHARED_SCENE_STATE.heroScrollProgress;
    orbUniforms.uAudioIntensity.value = SHARED_SCENE_STATE.audioIntensity;
    orbUniforms.uPointer.value.set(SHARED_SCENE_STATE.pointerX, SHARED_SCENE_STATE.pointerY);

    ringUniforms.uTime.value += clampedDelta * speed * 0.92;
    ringUniforms.uScroll.value = SHARED_SCENE_STATE.heroScrollProgress;
    ringUniforms.uAudioIntensity.value = SHARED_SCENE_STATE.audioIntensity;
    ringUniforms.uPointer.value.set(SHARED_SCENE_STATE.pointerX, SHARED_SCENE_STATE.pointerY);

    const t = SHARED_SCENE_STATE.elapsedTime * speed;
    const scroll = SHARED_SCENE_STATE.heroScrollProgress;

    if (orbRef.current) {
      orbRef.current.position.x = 0.96 + SHARED_SCENE_STATE.pointerX * 0.12;
      orbRef.current.position.y = 0.26 + Math.sin(t * 0.55) * 0.06 + scroll * 0.32;
      orbRef.current.rotation.z = Math.sin(t * 0.3) * 0.08 - scroll * 0.22;
      orbRef.current.rotation.y = -0.28 + SHARED_SCENE_STATE.pointerX * 0.14 + scroll * 0.18;
    }

    if (outerRingRef.current) {
      outerRingRef.current.position.x = 1.02 + SHARED_SCENE_STATE.pointerX * 0.14;
      outerRingRef.current.position.y = 0.24 + Math.cos(t * 0.5) * 0.05 + scroll * 0.28;
      outerRingRef.current.rotation.z = -0.35 + Math.sin(t * 0.25) * 0.1 + scroll * 0.25;
    }
  });

  return (
    <group>
      {/* Main Sculpted Liquid-Metal Dome behind the Floating Player */}
      <mesh ref={orbRef} position={[0.96, 0.26, -0.85]} scale={[1.38, 1.34, 0.92]}>
        <sphereGeometry args={[1.15, 48, 48]} />
        <shaderMaterial
          vertexShader={LIQUID_ORB_VERTEX_SHADER}
          fragmentShader={LIQUID_ORB_FRAGMENT_SHADER}
          uniforms={orbUniforms}
        />
      </mesh>

      {/* Outer Folded Metallic Rim Crest wrapping around the Dome */}
      <mesh
        ref={outerRingRef}
        position={[1.02, 0.24, -1.02]}
        rotation={[0.24, -0.32, -0.35]}
        scale={[1.26, 1.22, 0.72]}
      >
        <torusGeometry args={[1.26, 0.24, 30, 72]} />
        <shaderMaterial
          vertexShader={LIQUID_ORB_VERTEX_SHADER}
          fragmentShader={LIQUID_ORB_FRAGMENT_SHADER}
          uniforms={ringUniforms}
        />
      </mesh>
    </group>
  );
}

function SweepingLiquidFolds({ lightingMode }: LiquidProps) {
  const primaryWaveRef = useRef<THREE.Mesh>(null);
  const secondaryWaveRef = useRef<THREE.Mesh>(null);

  const uniformsA = useMemo(
    () => ({
      uTime: { value: 0 },
      uScroll: { value: 0 },
      uAudioIntensity: { value: 0.35 },
      uWarmth: { value: lightingMode === 'champagne-noir' ? 1.0 : 0.25 },
      uPointer: { value: new THREE.Vector2(0, 0) },
    }),
    []
  );

  const uniformsB = useMemo(
    () => ({
      uTime: { value: 3.4 },
      uScroll: { value: 0 },
      uAudioIntensity: { value: 0.35 },
      uWarmth: { value: lightingMode === 'champagne-noir' ? 1.0 : 0.25 },
      uPointer: { value: new THREE.Vector2(0, 0) },
    }),
    []
  );

  useEffect(() => {
    const targetWarmth = lightingMode === 'champagne-noir' ? 1.0 : 0.25;
    uniformsA.uWarmth.value = targetWarmth;
    uniformsB.uWarmth.value = targetWarmth;
  }, [lightingMode, uniformsA, uniformsB]);

  useFrame((_, delta) => {
    if (SHARED_SCENE_STATE.heroScrollProgress >= 0.995) return;

    const clampedDelta = Math.min(delta, 0.05);
    const speed = SHARED_SCENE_STATE.reducedMotion ? 0.15 : 1.0;
    uniformsA.uTime.value += clampedDelta * speed;
    uniformsA.uScroll.value = SHARED_SCENE_STATE.heroScrollProgress;
    uniformsA.uAudioIntensity.value = SHARED_SCENE_STATE.audioIntensity;
    uniformsA.uPointer.value.set(SHARED_SCENE_STATE.pointerX, SHARED_SCENE_STATE.pointerY);

    uniformsB.uTime.value += clampedDelta * speed * 0.85;
    uniformsB.uScroll.value = SHARED_SCENE_STATE.heroScrollProgress;
    uniformsB.uAudioIntensity.value = SHARED_SCENE_STATE.audioIntensity;
    uniformsB.uPointer.value.set(SHARED_SCENE_STATE.pointerX, SHARED_SCENE_STATE.pointerY);

    const scroll = SHARED_SCENE_STATE.heroScrollProgress;
    if (primaryWaveRef.current) {
      primaryWaveRef.current.position.y = -1.28 + scroll * 0.42;
      primaryWaveRef.current.rotation.z = 0.14 + SHARED_SCENE_STATE.pointerX * 0.025;
    }
    if (secondaryWaveRef.current) {
      secondaryWaveRef.current.position.y = -1.55 + scroll * 0.52;
    }
  });

  return (
    <group>
      {/* Primary Sweeping Liquid-Metal Fold (Bottom-left to Center-Right Crest) */}
      <mesh
        ref={primaryWaveRef}
        position={[0.05, -1.28, -0.35]}
        rotation={[-0.68, -0.12, 0.14]}
      >
        <planeGeometry args={[8.4, 3.6, 72, 42]} />
        <shaderMaterial
          vertexShader={LIQUID_RIBBON_VERTEX_SHADER}
          fragmentShader={LIQUID_RIBBON_FRAGMENT_SHADER}
          uniforms={uniformsA}
          transparent
          depthWrite={false}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Deep Underlying Molten Fold Rising Behind the Main Wave */}
      <mesh
        ref={secondaryWaveRef}
        position={[0.45, -1.55, -0.95]}
        rotation={[-0.54, 0.08, 0.22]}
      >
        <planeGeometry args={[7.8, 3.2, 54, 32]} />
        <shaderMaterial
          vertexShader={LIQUID_RIBBON_VERTEX_SHADER}
          fragmentShader={LIQUID_RIBBON_FRAGMENT_SHADER}
          uniforms={uniformsB}
          transparent
          depthWrite={false}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  );
}

interface DropletConfig {
  id: string;
  basePos: [number, number, number];
  scale: [number, number, number];
  rotation: [number, number, number];
  elongation: number;
  phase: number;
  riseSpeed: number;
  riseRange: number;
}

const DROPLET_CONFIGS: DropletConfig[] = [
  {
    id: 'droplet-mid-left',
    basePos: [-0.36, 0.84, 0.15],
    scale: [0.16, 0.13, 0.13],
    rotation: [0.2, 0.15, -0.58],
    elongation: 0.72,
    phase: 0.4,
    riseSpeed: 0.52,
    riseRange: 0.14,
  },
  {
    id: 'droplet-top-left',
    basePos: [-0.04, 1.18, 0.05],
    scale: [0.085, 0.085, 0.085],
    rotation: [0.1, -0.2, 0.2],
    elongation: 0.12,
    phase: 1.9,
    riseSpeed: 0.68,
    riseRange: 0.12,
  },
  {
    id: 'droplet-bottom-left',
    basePos: [-0.68, -0.52, 0.22],
    scale: [0.155, 0.12, 0.12],
    rotation: [-0.15, 0.25, 0.64],
    elongation: 0.68,
    phase: 3.1,
    riseSpeed: 0.48,
    riseRange: 0.15,
  },
  {
    id: 'droplet-bottom-right',
    basePos: [2.22, -0.48, 0.18],
    scale: [0.09, 0.085, 0.085],
    rotation: [0.1, 0.3, -0.3],
    elongation: 0.22,
    phase: 4.5,
    riseSpeed: 0.6,
    riseRange: 0.11,
  },
];

function SingleMercuryDroplet({
  config,
  lightingMode,
}: {
  config: DropletConfig;
  lightingMode: AmbientLightingMode;
}) {
  const meshRef = useRef<THREE.Mesh>(null);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uPhase: { value: config.phase },
      uElongation: { value: config.elongation },
      uWarmth: { value: lightingMode === 'champagne-noir' ? 1.0 : 0.25 },
      uPointer: { value: new THREE.Vector2(0, 0) },
    }),
    [config.elongation, config.phase]
  );

  useEffect(() => {
    uniforms.uWarmth.value = lightingMode === 'champagne-noir' ? 1.0 : 0.25;
  }, [lightingMode, uniforms]);

  useFrame((_, delta) => {
    if (SHARED_SCENE_STATE.heroScrollProgress >= 0.995) return;

    const clampedDelta = Math.min(delta, 0.05);
    const speed = SHARED_SCENE_STATE.reducedMotion ? 0.15 : 1.0;
    uniforms.uTime.value += clampedDelta * speed;
    uniforms.uPointer.value.set(SHARED_SCENE_STATE.pointerX, SHARED_SCENE_STATE.pointerY);

    if (meshRef.current) {
      const t = SHARED_SCENE_STATE.elapsedTime * speed;
      const scroll = SHARED_SCENE_STATE.heroScrollProgress;

      const upwardCycle = Math.sin(t * config.riseSpeed + config.phase) * config.riseRange;
      const lateralDrift = Math.cos(t * config.riseSpeed * 0.75 + config.phase) * 0.05;

      meshRef.current.position.set(
        config.basePos[0] + lateralDrift + SHARED_SCENE_STATE.pointerX * 0.08,
        config.basePos[1] + upwardCycle + scroll * 0.38 - SHARED_SCENE_STATE.pointerY * 0.05,
        config.basePos[2]
      );

      meshRef.current.rotation.set(
        config.rotation[0] + Math.sin(t * 0.6 + config.phase) * 0.12,
        config.rotation[1] + Math.cos(t * 0.5 + config.phase) * 0.14,
        config.rotation[2] + Math.sin(t * 0.45 + config.phase) * 0.1 + scroll * 0.3
      );
    }
  });

  return (
    <mesh
      ref={meshRef}
      position={config.basePos}
      rotation={config.rotation}
      scale={config.scale}
    >
      <sphereGeometry args={[1, 24, 24]} />
      <shaderMaterial
        vertexShader={LIQUID_DROPLET_VERTEX_SHADER}
        fragmentShader={LIQUID_ORB_FRAGMENT_SHADER}
        uniforms={uniforms}
      />
    </mesh>
  );
}

function SceneCameraRig() {
  const { camera, size } = useThree();

  useEffect(() => {
    SHARED_SCENE_STATE.webglDrivenLoop = true;
    return () => {
      SHARED_SCENE_STATE.webglDrivenLoop = false;
    };
  }, []);

  useFrame((_, delta) => {
    // Drive both CSS3D stage transforms and WebGL state in a single synchronized RAF tick
    stepUnifiedSceneMotion(delta);

    if (SHARED_SCENE_STATE.heroScrollProgress >= 0.995) return;

    const isMobile = size.width < 900;
    const targetX = isMobile
      ? 0.65 + SHARED_SCENE_STATE.pointerX * 0.06
      : 0.0 + SHARED_SCENE_STATE.pointerX * 0.1;
    const targetY =
      SHARED_SCENE_STATE.pointerY * -0.08 - SHARED_SCENE_STATE.heroScrollProgress * 0.22;
    const targetZ = isMobile ? 4.35 : 3.65 + SHARED_SCENE_STATE.heroScrollProgress * 0.25;

    camera.position.x += (targetX - camera.position.x) * 0.08;
    camera.position.y += (targetY - camera.position.y) * 0.08;
    camera.position.z += (targetZ - camera.position.z) * 0.08;
    camera.lookAt(isMobile ? 0.65 : 0.15, -0.08, 0);
  });

  return null;
}

export const LiquidMetalScene: React.FC<LiquidProps> = React.memo(({ lightingMode }) => {
  const [webglSupported, setWebglSupported] = useState<boolean>(true);

  useEffect(() => {
    setWebglSupported(detectWebGLAvailable());
  }, []);

  if (!webglSupported) {
    return (
      <div className="void-liquid-fallback" aria-hidden="true">
        <div className="void-fallback-orb" />
        <div className="void-fallback-wave" />
      </div>
    );
  }

  return (
    <div className="void-webgl-canvas-wrapper" aria-hidden="true">
      <Canvas
        dpr={1}
        camera={{ position: [0, 0, 3.65], fov: 42, near: 0.1, far: 25 }}
        gl={{
          antialias: false,
          alpha: true,
          stencil: false,
          depth: true,
          powerPreference: 'high-performance',
        }}
      >
        <SceneCameraRig />
        <CentralLiquidOrb lightingMode={lightingMode} />
        <SweepingLiquidFolds lightingMode={lightingMode} />
        {DROPLET_CONFIGS.map((cfg) => (
          <SingleMercuryDroplet key={cfg.id} config={cfg} lightingMode={lightingMode} />
        ))}
      </Canvas>
    </div>
  );
});
