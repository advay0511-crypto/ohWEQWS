import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import {
  Layers,
  Droplet,
  Compass,
  RotateCcw,
  Sparkles,
  Maximize2,
  Info,
  Thermometer,
  ShieldCheck,
} from 'lucide-react';
import { FieldRecord, SavedFarmPlan } from '../../types';

interface Parcel3DViewerProps {
  farm?: SavedFarmPlan;
  field?: FieldRecord;
  cropName?: string;
  soilTexture?: string;
  moisturePercentile?: number;
  height?: string;
  interactive?: boolean;
}

export const Parcel3DViewer: React.FC<Parcel3DViewerProps> = ({
  farm,
  field,
  cropName = 'Winter Wheat',
  soilTexture = 'Sandy Loam',
  moisturePercentile = 48,
  height = '360px',
  interactive = true,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [activeLayer, setActiveLayer] = useState<'all' | 'roots' | 'moisture' | 'strata'>('all');
  const [isHovered, setIsHovered] = useState(false);
  const [autoRotate, setAutoRotate] = useState(true);
  const [inspectedDepth, setInspectedDepth] = useState<string | null>(null);

  // References for three.js cleanup
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const rootGroupRef = useRef<THREE.Group | null>(null);
  const moistureMeshRef = useRef<THREE.Mesh | null>(null);
  const cropsGroupRef = useRef<THREE.Group | null>(null);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || 600;
    const heightPx = container.clientHeight || 360;

    // 1. Scene & Camera
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(40, width / heightPx, 0.1, 100);
    camera.position.set(5.5, 4.2, 5.5);
    camera.lookAt(0, -0.2, 0);

    // 2. Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, heightPx);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    rendererRef.current = renderer;

    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // 3. Lighting Rig
    const ambientLight = new THREE.AmbientLight(0xd4ecd5, 0.85);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xfff6e6, 1.8);
    sunLight.position.set(6, 9, 5);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 1024;
    sunLight.shadow.mapSize.height = 1024;
    scene.add(sunLight);

    const rimLight = new THREE.DirectionalLight(0x78b6c7, 0.7);
    rimLight.position.set(-6, -2, -4);
    scene.add(rimLight);

    // Master Parcel Group
    const parcelGroup = new THREE.Group();
    scene.add(parcelGroup);

    // 4. Construct Multi-Horizon Soil Block (0 to -2.0)
    // Layer A: Topsoil (0.0 to -0.4)
    const topsoilGeo = new THREE.BoxGeometry(3, 0.4, 3);
    const topsoilMat = new THREE.MeshStandardMaterial({
      color: soilTexture.toLowerCase().includes('sand') ? 0x8a704c : 0x4a3728,
      roughness: 0.9,
      metalness: 0.05,
    });
    const topsoilMesh = new THREE.Mesh(topsoilGeo, topsoilMat);
    topsoilMesh.position.y = -0.2;
    topsoilMesh.receiveShadow = true;
    parcelGroup.add(topsoilMesh);

    // Layer B: Subsoil / Root Zone (-0.4 to -1.1)
    const subsoilGeo = new THREE.BoxGeometry(2.98, 0.7, 2.98);
    const subsoilMat = new THREE.MeshStandardMaterial({
      color: 0x5a432f,
      roughness: 0.85,
      metalness: 0.1,
    });
    const subsoilMesh = new THREE.Mesh(subsoilGeo, subsoilMat);
    subsoilMesh.position.y = -0.75;
    parcelGroup.add(subsoilMesh);

    // Layer C: Deep Horizon / Parent Rock (-1.1 to -1.8)
    const deepGeo = new THREE.BoxGeometry(2.96, 0.7, 2.96);
    const deepMat = new THREE.MeshStandardMaterial({
      color: 0x3d332a,
      roughness: 0.95,
      metalness: 0.2,
    });
    const deepMesh = new THREE.Mesh(deepGeo, deepMat);
    deepMesh.position.y = -1.45;
    parcelGroup.add(deepMesh);

    // 5. Translucent Moisture Saturation Horizon
    const moistureHeight = 0.55 * (moisturePercentile / 100);
    const moistureGeo = new THREE.BoxGeometry(3.02, Math.max(0.08, moistureHeight), 3.02);
    const moistureMat = new THREE.MeshPhysicalMaterial({
      color: 0x4e9f9f,
      transparent: true,
      opacity: 0.45,
      roughness: 0.1,
      transmission: 0.6,
      ior: 1.33,
    });
    const moistureMesh = new THREE.Mesh(moistureGeo, moistureMat);
    moistureMesh.position.y = -0.6 - (1 - moisturePercentile / 100) * 0.4;
    parcelGroup.add(moistureMesh);
    moistureMeshRef.current = moistureMesh;

    // 6. Procedural Crops on Surface
    const cropsGroup = new THREE.Group();
    cropsGroupRef.current = cropsGroup;
    parcelGroup.add(cropsGroup);

    const isLegume = cropName.toLowerCase().includes('bean') || cropName.toLowerCase().includes('chickpea') || cropName.toLowerCase().includes('clover');
    const isWheat = cropName.toLowerCase().includes('wheat') || cropName.toLowerCase().includes('barley') || cropName.toLowerCase().includes('grain');

    // Grid of crops
    const stemMat = new THREE.MeshStandardMaterial({ color: 0x89b96f, roughness: 0.6 });
    const headMat = new THREE.MeshStandardMaterial({ color: isWheat ? 0xdda15e : 0xa3d188, roughness: 0.5 });
    const leafMat = new THREE.MeshStandardMaterial({ color: 0x5a9e4b, roughness: 0.5, side: THREE.DoubleSide });

    for (let x = -1.1; x <= 1.1; x += 0.45) {
      for (let z = -1.1; z <= 1.1; z += 0.45) {
        const cropInstance = new THREE.Group();
        cropInstance.position.set(x + (Math.random() - 0.5) * 0.1, 0, z + (Math.random() - 0.5) * 0.1);

        if (isWheat) {
          // Wheat stalk
          const stalkGeo = new THREE.CylinderGeometry(0.015, 0.02, 0.65, 5);
          const stalk = new THREE.Mesh(stalkGeo, stemMat);
          stalk.position.y = 0.32;
          stalk.castShadow = true;
          cropInstance.add(stalk);

          // Wheat ear / grain head
          const earGeo = new THREE.ConeGeometry(0.045, 0.22, 6);
          const ear = new THREE.Mesh(earGeo, headMat);
          ear.position.y = 0.68;
          ear.rotation.z = (Math.random() - 0.5) * 0.2;
          cropInstance.add(ear);

          // Small curved leaf
          const leafGeo = new THREE.PlaneGeometry(0.05, 0.25);
          const leaf = new THREE.Mesh(leafGeo, leafMat);
          leaf.position.set(0.04, 0.3, 0);
          leaf.rotation.z = 0.5;
          cropInstance.add(leaf);
        } else if (isLegume) {
          // Bushy legume
          const stemGeo = new THREE.CylinderGeometry(0.02, 0.025, 0.45, 5);
          const stem = new THREE.Mesh(stemGeo, stemMat);
          stem.position.y = 0.22;
          cropInstance.add(stem);

          // Trifoliate leaf clusters
          for (let l = 0; l < 4; l++) {
            const leaf = new THREE.Mesh(new THREE.SphereGeometry(0.08, 6, 6), leafMat);
            leaf.scale.set(1.4, 0.5, 1.1);
            leaf.position.set(
              Math.cos((l * Math.PI) / 2) * 0.12,
              0.25 + l * 0.06,
              Math.sin((l * Math.PI) / 2) * 0.12
            );
            cropInstance.add(leaf);
          }
        } else {
          // Broadleaf leafy crop
          const leafCluster = new THREE.Group();
          for (let k = 0; k < 5; k++) {
            const leaf = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.35, 5), leafMat);
            leaf.rotation.z = 0.4 * Math.cos((k * 2 * Math.PI) / 5);
            leaf.rotation.x = 0.4 * Math.sin((k * 2 * Math.PI) / 5);
            leaf.position.y = 0.18;
            leafCluster.add(leaf);
          }
          cropInstance.add(leafCluster);
        }

        cropsGroup.add(cropInstance);
      }
    }

    // 7. Root System Strands Penetrating Soil (Fibrous or Taproot)
    const rootsGroup = new THREE.Group();
    rootGroupRef.current = rootsGroup;
    parcelGroup.add(rootsGroup);

    const rootMat = new THREE.LineBasicMaterial({
      color: 0xecd9b6,
      transparent: true,
      opacity: 0.75,
      linewidth: 1.5,
    });

    for (let rx = -1.0; rx <= 1.0; rx += 0.5) {
      for (let rz = -1.0; rz <= 1.0; rz += 0.5) {
        const rootPoints: THREE.Vector3[] = [];
        rootPoints.push(new THREE.Vector3(rx, 0, rz));

        const depthTarget = isLegume ? -1.1 : -0.7; // Legumes have deeper taproot
        let currentX = rx;
        let currentZ = rz;

        for (let d = 0; d >= depthTarget; d -= 0.12) {
          currentX += (Math.random() - 0.5) * 0.08;
          currentZ += (Math.random() - 0.5) * 0.08;
          rootPoints.push(new THREE.Vector3(currentX, d, currentZ));
        }

        const rootGeo = new THREE.BufferGeometry().setFromPoints(rootPoints);
        const rootLine = new THREE.Line(rootGeo, rootMat);
        rootsGroup.add(rootLine);
      }
    }

    // 8. Grid Coordinate Base Plate
    const gridHelper = new THREE.GridHelper(3.8, 8, 0x4e9f9f, 0x203428);
    gridHelper.position.y = -1.82;
    parcelGroup.add(gridHelper);

    // 9. Interactive Drag to Orbit
    let isDragging = false;
    let previousMouseX = 0;
    let previousMouseY = 0;
    let rotationVelocityX = 0;
    let rotationVelocityY = 0;

    const onMouseDown = (e: MouseEvent) => {
      if (!interactive) return;
      isDragging = true;
      previousMouseX = e.clientX;
      previousMouseY = e.clientY;
      setAutoRotate(false);
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const deltaX = e.clientX - previousMouseX;
      const deltaY = e.clientY - previousMouseY;

      parcelGroup.rotation.y += deltaX * 0.01;
      parcelGroup.rotation.x = Math.max(-0.4, Math.min(0.6, parcelGroup.rotation.x + deltaY * 0.005));

      rotationVelocityX = deltaX * 0.005;
      rotationVelocityY = deltaY * 0.002;

      previousMouseX = e.clientX;
      previousMouseY = e.clientY;
    };

    const onMouseUp = () => {
      isDragging = false;
    };

    const domElement = renderer.domElement;
    domElement.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);

    // Resize handler
    const onResize = () => {
      if (!container) return;
      const newWidth = container.clientWidth;
      const newHeight = container.clientHeight || 360;
      camera.aspect = newWidth / newHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(newWidth, newHeight);
    };

    const resizeObserver = new ResizeObserver(() => onResize());
    resizeObserver.observe(container);

    // Animation Loop
    let animationFrameId: number;
    const clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const delta = clock.getDelta();

      if (autoRotate && !isDragging) {
        parcelGroup.rotation.y += delta * 0.35;
      } else if (!isDragging) {
        // Inertia damping
        parcelGroup.rotation.y += rotationVelocityX;
        parcelGroup.rotation.x = Math.max(-0.4, Math.min(0.6, parcelGroup.rotation.x + rotationVelocityY));
        rotationVelocityX *= 0.94;
        rotationVelocityY *= 0.94;
      }

      // Gentle crop sway in ambient breeze
      if (cropsGroupRef.current) {
        const time = clock.getElapsedTime();
        cropsGroupRef.current.children.forEach((c, idx) => {
          c.rotation.z = Math.sin(time * 2.5 + idx) * 0.04;
        });
      }

      renderer.render(scene, camera);
    };

    animate();

    // Cleanup
    return () => {
      cancelAnimationFrame(animationFrameId);
      resizeObserver.disconnect();
      domElement.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);

      // Deep geometry and material disposal
      scene.traverse((obj) => {
        if (obj instanceof THREE.Mesh) {
          obj.geometry?.dispose();
          if (Array.isArray(obj.material)) {
            obj.material.forEach((m) => m.dispose());
          } else {
            obj.material?.dispose();
          }
        }
      });
      renderer.dispose();
      if (container.contains(domElement)) {
        container.removeChild(domElement);
      }
    };
  }, [cropName, soilTexture, moisturePercentile, interactive]);

  // Handle Layer Toggle changes
  useEffect(() => {
    if (!rootGroupRef.current || !moistureMeshRef.current || !cropsGroupRef.current) return;

    if (activeLayer === 'all') {
      rootGroupRef.current.visible = true;
      moistureMeshRef.current.visible = true;
      cropsGroupRef.current.visible = true;
    } else if (activeLayer === 'roots') {
      rootGroupRef.current.visible = true;
      moistureMeshRef.current.visible = false;
      cropsGroupRef.current.visible = true;
    } else if (activeLayer === 'moisture') {
      rootGroupRef.current.visible = false;
      moistureMeshRef.current.visible = true;
      cropsGroupRef.current.visible = true;
    } else if (activeLayer === 'strata') {
      rootGroupRef.current.visible = false;
      moistureMeshRef.current.visible = false;
      cropsGroupRef.current.visible = false;
    }
  }, [activeLayer]);

  return (
    <div
      className="relative w-full rounded-2xl overflow-hidden glass-panel border border-[#293B2E] shadow-2xl group"
      style={{ height }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* 3D WebGL Canvas */}
      <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

      {/* Top Floating Glass HUD */}
      <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none">
        <div className="flex items-center gap-2 bg-[#0B1410]/85 border border-[#89B96F]/30 backdrop-blur-md px-3 py-1.5 rounded-xl shadow-lg pointer-events-auto">
          <Sparkles className="w-4 h-4 text-[#89B96F]" />
          <div>
            <div className="text-[11px] font-bold text-[#EDF3EC] flex items-center gap-1.5">
              <span>3D Soil Stratigraphy & Root Depth</span>
              <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-[#19291F] text-[#89B96F] border border-[#89B96F]/30">
                WebGL
              </span>
            </div>
            <div className="text-[10px] text-[#B1BDB0] font-mono">
              {cropName} · {soilTexture}
            </div>
          </div>
        </div>

        {/* Live Horizon Stats */}
        <div className="hidden sm:flex items-center gap-2 bg-[#0B1410]/80 border border-[#293B2E] backdrop-blur-md px-2.5 py-1 rounded-xl text-[10px] font-mono pointer-events-auto">
          <span className="flex items-center gap-1 text-[#4E9F9F]">
            <Droplet className="w-3 h-3" />
            <span>RAW: {moisturePercentile}%</span>
          </span>
          <span className="text-[#405744]">|</span>
          <span className="text-[#89B96F]">0–120cm Profile</span>
        </div>
      </div>

      {/* Bottom Floating Layer Control Rail */}
      <div className="absolute bottom-3 left-3 z-10 flex items-center gap-1.5 p-1 bg-[#0B1410]/90 border border-[#293B2E] rounded-xl backdrop-blur-md shadow-xl">
        <button
          type="button"
          onClick={() => setActiveLayer('all')}
          className={`px-2.5 py-1 text-[10px] font-medium rounded-lg transition-all ${
            activeLayer === 'all'
              ? 'bg-[#89B96F] text-[#0B1410] font-bold shadow-md'
              : 'text-[#B1BDB0] hover:text-[#EDF3EC] hover:bg-[#19291F]'
          }`}
        >
          All Horizons
        </button>
        <button
          type="button"
          onClick={() => setActiveLayer('roots')}
          className={`px-2.5 py-1 text-[10px] font-medium rounded-lg transition-all ${
            activeLayer === 'roots'
              ? 'bg-[#89B96F] text-[#0B1410] font-bold shadow-md'
              : 'text-[#B1BDB0] hover:text-[#EDF3EC] hover:bg-[#19291F]'
          }`}
        >
          Root Architecture
        </button>
        <button
          type="button"
          onClick={() => setActiveLayer('moisture')}
          className={`px-2.5 py-1 text-[10px] font-medium rounded-lg transition-all ${
            activeLayer === 'moisture'
              ? 'bg-[#4E9F9F] text-[#0B1410] font-bold shadow-md'
              : 'text-[#B1BDB0] hover:text-[#EDF3EC] hover:bg-[#19291F]'
          }`}
        >
          Water Table
        </button>
      </div>

      {/* Auto-Rotate & Reset Trigger */}
      <div className="absolute bottom-3 right-3 z-10 flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => setAutoRotate(!autoRotate)}
          className={`p-1.5 rounded-lg border backdrop-blur-md text-[11px] transition-all flex items-center gap-1 ${
            autoRotate
              ? 'bg-[#19291F] border-[#89B96F]/50 text-[#89B96F]'
              : 'bg-[#0B1410]/80 border-[#293B2E] text-[#819082] hover:text-[#EDF3EC]'
          }`}
          title="Toggle Auto Orbit"
        >
          <RotateCcw className={`w-3.5 h-3.5 ${autoRotate ? 'animate-spin' : ''}`} style={{ animationDuration: '6s' }} />
          <span className="text-[10px] font-mono hidden md:inline">{autoRotate ? 'Auto Orbit' : 'Paused'}</span>
        </button>
      </div>
    </div>
  );
};
