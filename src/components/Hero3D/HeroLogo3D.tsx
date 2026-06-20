'use client';

/**
 * 案A：現在のロゴアイコンの3D化
 * - HoshiLogo の四芒星モチーフを ExtrudeGeometry で立体化（厚みのあるプレート状の星）
 * - オレンジ系のメタリック＋発光（emissive）でアクセント
 * - オレンジの軌道リング（トーラス）を傾けて配置し、ロゴの世界観を踏襲
 * - ドラッグで回転（OrbitControls）／ホバーで emissive を強めて「触れてる感」
 * - prefers-reduced-motion: reduce のときは自動回転を停止
 */

import { useMemo, useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Float } from '@react-three/drei';
import * as THREE from 'three';
import { useReducedMotion } from './useReducedMotion';

const ACCENT = '#ff8c2a';
const ACCENT_SOFT = '#ffb066';
const ACCENT_DEEP = '#ff5e1f';

/** 四芒星（HoshiLogo の path 相当）の 2D 形状を作る */
function makeStarShape(): THREE.Shape {
  // HoshiLogo の path: M32 6 L36 28 L58 32 L36 36 L32 58 L28 36 L6 32 L28 28 Z
  // viewBox 0..64 を中心原点・スケール調整して使う
  const raw: [number, number][] = [
    [32, 6],
    [36, 28],
    [58, 32],
    [36, 36],
    [32, 58],
    [28, 36],
    [6, 32],
    [28, 28],
  ];
  const shape = new THREE.Shape();
  raw.forEach(([x, y], i) => {
    // 中心(32,32)基準・Y反転（SVGは下向き正）・スケール
    const px = (x - 32) * 0.06;
    const py = -(y - 32) * 0.06;
    if (i === 0) shape.moveTo(px, py);
    else shape.lineTo(px, py);
  });
  shape.closePath();
  return shape;
}

function StarLogoMesh() {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);
  const [active, setActive] = useState(false);
  const reduced = useReducedMotion();

  const geometry = useMemo(() => {
    const shape = makeStarShape();
    const geo = new THREE.ExtrudeGeometry(shape, {
      depth: 0.45,
      bevelEnabled: true,
      bevelThickness: 0.18,
      bevelSize: 0.16,
      bevelSegments: 6,
      curveSegments: 4,
    });
    geo.center();
    return geo;
  }, []);

  // ホバー/クリックで emissive を補間
  useFrame((_, delta) => {
    const mesh = meshRef.current;
    if (!mesh) return;
    if (!reduced) {
      mesh.rotation.y += delta * 0.35;
    }
    const mat = mesh.material as THREE.MeshStandardMaterial;
    const target = active ? 1.6 : hovered ? 1.0 : 0.45;
    mat.emissiveIntensity = THREE.MathUtils.lerp(mat.emissiveIntensity, target, 0.12);
    const scaleTarget = active ? 1.08 : hovered ? 1.04 : 1;
    mesh.scale.setScalar(THREE.MathUtils.lerp(mesh.scale.x, scaleTarget, 0.15));
  });

  return (
    <Float speed={reduced ? 0 : 1.4} rotationIntensity={reduced ? 0 : 0.3} floatIntensity={reduced ? 0 : 0.6}>
      <group>
        {/* 立体ロゴ本体 */}
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
          onPointerDown={() => setActive(true)}
          onPointerUp={() => setActive(false)}
        >
          <meshStandardMaterial
            color={ACCENT}
            emissive={ACCENT_DEEP}
            emissiveIntensity={0.45}
            metalness={0.6}
            roughness={0.25}
          />
        </mesh>

        {/* 軌道リング（HoshiLogo のオレンジ楕円リング相当） */}
        <mesh rotation={[Math.PI / 2.2, 0.4, 0]}>
          <torusGeometry args={[2.1, 0.06, 16, 96]} />
          <meshStandardMaterial
            color={ACCENT_SOFT}
            emissive={ACCENT}
            emissiveIntensity={0.8}
            metalness={0.3}
            roughness={0.4}
          />
        </mesh>
      </group>
    </Float>
  );
}

export default function HeroLogo3D() {
  const reduced = useReducedMotion();
  return (
    <Canvas
      camera={{ position: [0, 0, 6], fov: 45 }}
      dpr={[1, 1.8]}
      gl={{ antialias: true, alpha: true }}
      style={{ width: '100%', height: '100%' }}
    >
      <ambientLight intensity={0.6} />
      <directionalLight position={[4, 5, 5]} intensity={2} color={ACCENT_SOFT} />
      <pointLight position={[-4, -2, 3]} intensity={2.4} color={ACCENT} distance={20} />
      {/* リムライト（金属の縁を立たせる） */}
      <pointLight position={[0, 3, -4]} intensity={3} color={'#ffffff'} distance={18} />
      <spotLight position={[-3, 4, 4]} angle={0.5} penumbra={0.8} intensity={2} color={ACCENT_SOFT} />

      <StarLogoMesh />

      <OrbitControls
        enablePan={false}
        enableZoom={false}
        autoRotate={!reduced}
        autoRotateSpeed={0.6}
        minPolarAngle={Math.PI / 3}
        maxPolarAngle={(Math.PI * 2) / 3}
      />
    </Canvas>
  );
}
