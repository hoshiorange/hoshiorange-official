'use client';

/**
 * 本番 Hero 用 統合3Dシーン（1 Canvas）
 * ------------------------------------------------------------
 * コンセプト:
 *  - 中心の「光る星」＝ ほし本人（主役）   … 案B 由来
 *  - 周囲を取り巻く「ロゴ＋軌道リング」＝ このサイト（ハブ／構造） … 案A 由来
 *
 * 構図:
 *  - 中央に GlowStar（黄〜オレンジに発光、Bloom でにじむ）
 *  - その外周を OrbitingLogos が周回（小さな立体ロゴ四芒星 × 数個＋傾けた軌道トーラス）
 *  - シーン全体は OrbitControls でドラッグ回転可。星はクリックで弾む／ホバーで明るく
 *
 * 制約対応:
 *  - prefers-reduced-motion: reduce で 自動回転/明滅/浮遊/周回/きらめき を停止（ドラッグは残す）
 *  - 1 Canvas のみ・dpr 制限・軽量ジオメトリ・Bloom 控えめでモバイル過負荷を回避
 *  - SSR 不可なので呼び出し側で next/dynamic ssr:false する想定（このファイル自体は 'use client'）
 */

import { useMemo, useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Float, Sparkles } from '@react-three/drei';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import * as THREE from 'three';
import { useReducedMotion } from './useReducedMotion';

const STAR_YELLOW = '#ffd24a';
const STAR_ORANGE = '#ff8c2a';
const ACCENT = '#ff8c2a';
const ACCENT_SOFT = '#ffb066';
const ACCENT_DEEP = '#ff5e1f';

/* ---------- ジオメトリ生成（モジュールスコープで1度だけ作る） ---------- */

/** 5芒星（案B：ほし本人）の Shape */
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

/** 四芒星（案A：HoshiLogo 相当）の Shape */
function makeFourPointStar(): THREE.Shape {
  // HoshiLogo の path: M32 6 L36 28 L58 32 L36 36 L32 58 L28 36 L6 32 L28 28 Z
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
    const px = (x - 32) * 0.06;
    const py = -(y - 32) * 0.06;
    if (i === 0) shape.moveTo(px, py);
    else shape.lineTo(px, py);
  });
  shape.closePath();
  return shape;
}

/* ---------- 主役：中心の光る星（ほし本人） ---------- */

function GlowStar({ reduced }: { reduced: boolean }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);
  const bounceRef = useRef(0);

  const geometry = useMemo(() => {
    const geo = new THREE.ExtrudeGeometry(makeFivePointStar(), {
      depth: 0.5,
      bevelEnabled: true,
      bevelThickness: 0.22,
      bevelSize: 0.22,
      bevelSegments: 6,
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
    <Float speed={reduced ? 0 : 1.5} rotationIntensity={reduced ? 0 : 0.35} floatIntensity={reduced ? 0 : 0.7}>
      <mesh
        ref={meshRef}
        geometry={geometry}
        scale={0.92}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHovered(true);
          document.body.style.cursor = 'grab';
        }}
        onPointerOut={() => {
          setHovered(false);
          document.body.style.cursor = 'auto';
        }}
        onPointerDown={(e) => {
          e.stopPropagation();
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

/* ---------- 周囲：サイトを表すロゴ＋軌道リング（星を取り巻く） ---------- */

const LOGO_COUNT = 3;

function OrbitingLogos({ reduced }: { reduced: boolean }) {
  const groupRef = useRef<THREE.Group>(null);
  const logosRef = useRef<Array<THREE.Mesh | null>>([]);
  const [hovered, setHovered] = useState(false);

  const logoGeometry = useMemo(() => {
    const geo = new THREE.ExtrudeGeometry(makeFourPointStar(), {
      depth: 0.4,
      bevelEnabled: true,
      bevelThickness: 0.16,
      bevelSize: 0.14,
      bevelSegments: 4,
      curveSegments: 4,
    });
    geo.center();
    return geo;
  }, []);

  // 周回半径・配置（星を内側、ロゴを外周に）
  const orbitRadius = 2.7;
  const tilt = useMemo(() => new THREE.Euler(Math.PI / 2.4, 0.35, 0), []);

  useFrame((_, delta) => {
    const group = groupRef.current;
    if (group && !reduced) {
      // グループごと傾いた面上を周回
      group.rotation.z += delta * 0.18;
    }
    // 各ロゴは自身も自転＋ホバーで発光
    logosRef.current.forEach((mesh) => {
      if (!mesh) return;
      if (!reduced) mesh.rotation.y += delta * 0.6;
      const mat = mesh.material as THREE.MeshStandardMaterial;
      const target = hovered ? 1.2 : 0.5;
      mat.emissiveIntensity = THREE.MathUtils.lerp(mat.emissiveIntensity, target, 0.1);
    });
  });

  return (
    <group rotation={tilt}>
      {/* 軌道リング（オレンジのトーラス）＝ サイトの「構造」 */}
      <mesh>
        <torusGeometry args={[orbitRadius, 0.045, 16, 120]} />
        <meshStandardMaterial
          color={ACCENT_SOFT}
          emissive={ACCENT}
          emissiveIntensity={0.7}
          metalness={0.3}
          roughness={0.45}
          toneMapped={false}
        />
      </mesh>

      {/* 周回する立体ロゴ群 */}
      <group ref={groupRef}>
        {Array.from({ length: LOGO_COUNT }).map((_, i) => {
          const a = (Math.PI * 2 * i) / LOGO_COUNT;
          const x = Math.cos(a) * orbitRadius;
          const y = Math.sin(a) * orbitRadius;
          return (
            <mesh
              key={i}
              ref={(m) => {
                logosRef.current[i] = m;
              }}
              geometry={logoGeometry}
              position={[x, y, 0]}
              scale={0.62}
              onPointerOver={(e) => {
                e.stopPropagation();
                setHovered(true);
                document.body.style.cursor = 'grab';
              }}
              onPointerOut={() => {
                setHovered(false);
                document.body.style.cursor = 'auto';
              }}
            >
              <meshStandardMaterial
                color={ACCENT}
                emissive={ACCENT_DEEP}
                emissiveIntensity={0.5}
                metalness={0.6}
                roughness={0.25}
                toneMapped={false}
              />
            </mesh>
          );
        })}
      </group>
    </group>
  );
}

/* ---------- Canvas ---------- */

export default function HeroScene3D() {
  const reduced = useReducedMotion();

  return (
    <Canvas
      camera={{ position: [0, 0.4, 7], fov: 42 }}
      dpr={[1, 1.8]}
      gl={{ antialias: true, alpha: true }}
      style={{ width: '100%', height: '100%' }}
    >
      {/* ライティング：星（黄）とロゴ（オレンジ）双方が映える構成 */}
      <ambientLight intensity={0.4} />
      <directionalLight position={[3, 4, 5]} intensity={1.4} color={STAR_YELLOW} />
      <pointLight position={[-4, -2, 4]} intensity={3} color={STAR_ORANGE} distance={22} />
      <pointLight position={[0, 3, -4]} intensity={2.4} color={'#ffffff'} distance={18} />
      <spotLight position={[-3, 4, 4]} angle={0.5} penumbra={0.8} intensity={1.6} color={ACCENT_SOFT} />

      {/* サイト（外周・背後） */}
      <OrbitingLogos reduced={reduced} />

      {/* ほし本人（中心・主役） */}
      <GlowStar reduced={reduced} />

      {!reduced && <Sparkles count={36} scale={7} size={2.6} speed={0.3} color={STAR_YELLOW} />}

      <EffectComposer enableNormalPass={false}>
        <Bloom
          intensity={reduced ? 0.5 : 1.1}
          luminanceThreshold={0.25}
          luminanceSmoothing={0.9}
          mipmapBlur
        />
      </EffectComposer>

      {/* シーン全体ドラッグ回転（ズーム/パンなし）。reduced でも回転操作は残す（autoRotate のみ止める） */}
      <OrbitControls
        enablePan={false}
        enableZoom={false}
        autoRotate={!reduced}
        autoRotateSpeed={0.5}
        minPolarAngle={Math.PI / 3.2}
        maxPolarAngle={(Math.PI * 2) / 3}
      />
    </Canvas>
  );
}
