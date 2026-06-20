'use client';

/**
 * 案B：黄色く光る星の3D化
 * - 5芒星を立体化した「光る星」。黄〜オレンジのグラデ発光
 * - @react-three/postprocessing の Bloom でグロー／にじみを付与
 * - ふわっと浮遊（Float）＋自動回転、ホバーで明るく・クリックでバウンド（弾む）
 * - ドラッグで回転（OrbitControls）
 * - prefers-reduced-motion: reduce のときは浮遊・回転・明滅を停止し静的表示
 */

import { useMemo, useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Float, Sparkles } from '@react-three/drei';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import * as THREE from 'three';
import { useReducedMotion } from './useReducedMotion';

const STAR_YELLOW = '#ffd24a';
const STAR_ORANGE = '#ff8c2a';

/** 5芒星の Shape（外周/内周の半径を交互に） */
function makeFivePointStar(): THREE.Shape {
  const shape = new THREE.Shape();
  const spikes = 5;
  const outer = 1.5;
  const inner = 0.62;
  for (let i = 0; i < spikes * 2; i++) {
    const r = i % 2 === 0 ? outer : inner;
    const a = (Math.PI / spikes) * i - Math.PI / 2;
    const x = Math.cos(a) * r;
    const y = Math.sin(a) * r;
    if (i === 0) shape.moveTo(x, y);
    else shape.lineTo(x, y);
  }
  shape.closePath();
  return shape;
}

function GlowStar() {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);
  const bounceRef = useRef(0);
  const reduced = useReducedMotion();

  const geometry = useMemo(() => {
    const geo = new THREE.ExtrudeGeometry(makeFivePointStar(), {
      depth: 0.5,
      bevelEnabled: true,
      bevelThickness: 0.22,
      bevelSize: 0.22,
      bevelSegments: 8,
      curveSegments: 6,
    });
    geo.center();
    return geo;
  }, []);

  useFrame((state, delta) => {
    const mesh = meshRef.current;
    if (!mesh) return;

    if (!reduced) {
      mesh.rotation.y += delta * 0.4;
      // ゆらぐ明滅
      const pulse = 1.4 + Math.sin(state.clock.elapsedTime * 2) * 0.25;
      const mat = mesh.material as THREE.MeshStandardMaterial;
      const target = (hovered ? 2.6 : pulse) + bounceRef.current * 1.2;
      mat.emissiveIntensity = THREE.MathUtils.lerp(mat.emissiveIntensity, target, 0.1);
    }

    // クリックのバウンド（弾む）減衰
    if (bounceRef.current > 0.001) {
      bounceRef.current = THREE.MathUtils.lerp(bounceRef.current, 0, 0.12);
      const s = 1 + bounceRef.current * 0.18;
      mesh.scale.setScalar(s);
    } else {
      mesh.scale.setScalar(THREE.MathUtils.lerp(mesh.scale.x, 1, 0.2));
    }
  });

  return (
    <Float speed={reduced ? 0 : 1.6} rotationIntensity={reduced ? 0 : 0.4} floatIntensity={reduced ? 0 : 0.9}>
      <mesh
        ref={meshRef}
        geometry={geometry}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHovered(true);
          document.body.style.cursor = 'grab';
        }}
        onPointerOut={() => {
          setHovered(false);
          document.body.style.cursor = 'auto';
        }}
        onPointerDown={() => {
          bounceRef.current = 1;
        }}
      >
        <meshStandardMaterial
          color={STAR_YELLOW}
          emissive={STAR_ORANGE}
          emissiveIntensity={1.4}
          metalness={0.2}
          roughness={0.35}
          toneMapped={false}
        />
      </mesh>
    </Float>
  );
}

/**
 * @param subtle 控えめモード（Contact で使用）。
 *   - Bloom / Sparkles を抑えて背景の StarryBackground と馴染ませる
 *   - 透過（gl alpha + 背景塗りなし）は常時。ドラッグ回転などの操作は維持する
 *   省略時は従来どおり（preview ページの強めグロー表示）。
 */
export default function HeroStar3D({ subtle = false }: { subtle?: boolean }) {
  const reduced = useReducedMotion();
  return (
    <Canvas
      camera={{ position: [0, 0, 6], fov: 45 }}
      dpr={[1, 1.8]}
      // alpha:true で透過。背景色は塗らない（scene.background 未設定）ため Canvas は完全透明。
      gl={{ antialias: true, alpha: true }}
      // style でも明示的に背景透明。四角い箱が出ないよう囲みパネル/枠は持たせない。
      style={{ width: '100%', height: '100%', background: 'transparent' }}
    >
      <ambientLight intensity={0.35} />
      <directionalLight position={[3, 4, 5]} intensity={1.2} color={STAR_YELLOW} />
      <pointLight position={[-4, -2, 4]} intensity={3} color={STAR_ORANGE} distance={20} />

      <GlowStar />

      {!reduced && (
        <Sparkles
          count={subtle ? 24 : 40}
          scale={subtle ? 5 : 6}
          size={subtle ? 2.4 : 3}
          speed={0.3}
          color={STAR_YELLOW}
        />
      )}

      <EffectComposer enableNormalPass={false}>
        <Bloom
          // 背景レイヤーでは星空に馴染むよう控えめに。単体表示では従来の強めグロー。
          intensity={subtle ? (reduced ? 0.45 : 0.9) : reduced ? 0.6 : 1.4}
          luminanceThreshold={subtle ? 0.3 : 0.2}
          luminanceSmoothing={0.9}
          mipmapBlur
        />
      </EffectComposer>

      {/* ドラッグ回転は常に有効（subtle でも“触れる”を維持）。
          reduced-motion では autoRotate のみ停止し、手動回転は残す。 */}
      <OrbitControls
        enablePan={false}
        enableZoom={false}
        autoRotate={!reduced}
        autoRotateSpeed={0.7}
        minPolarAngle={Math.PI / 3.2}
        maxPolarAngle={(Math.PI * 2) / 3}
      />
    </Canvas>
  );
}
