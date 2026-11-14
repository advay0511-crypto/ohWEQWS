import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { Globe, Satellite, Sparkles, Navigation, Layers } from 'lucide-react';

interface AgroGlobeViewerProps {
  activeLat?: number;
  activeLon?: number;
  height?: string;
  farmPoints?: Array<{ name: string; lat: number; lon: number; status: string }>;
  onSelectCoordinate?: (lat: number, lon: number) => void;
}

export const AgroGlobeViewer: React.FC<AgroGlobeViewerProps> = ({
  activeLat = 25.6741,
  activeLon = 55.9804,
  height = '340px',
  farmPoints = [
    { name: 'Ras Al Khaimah Demo', lat: 25.6741, lon: 55.9804, status: 'good' },
    { name: 'Kansas Winter Parcel', lat: 38.8403, lon: -97.6114, status: 'good' },
    { name: 'Darling Downs Plot', lat: -27.5606, lon: 151.9507, status: 'attention' },
  ],
  onSelectCoordinate,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [activeTelemetry, setActiveTelemetry] = useState('NASA POWER & SMAP');

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || 500;
    const heightPx = container.clientHeight || 340;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(40, width / heightPx, 0.1, 100);
    camera.position.set(0, 0, 4.2);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, heightPx);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // Master Globe Group
    const globeGroup = new THREE.Group();
    scene.add(globeGroup);

    // Atmospheric Glow Shell
    const atmoGeo = new THREE.SphereGeometry(1.58, 48, 48);
    const atmoMat = new THREE.MeshBasicMaterial({
      color: 0x4e9f9f,
      transparent: true,
      opacity: 0.12,
      side: THREE.BackSide,
    });
    const atmoMesh = new THREE.Mesh(atmoGeo, atmoMat);
    scene.add(atmoMesh);

    // Earth Sphere with procedural continental grid
    const earthGeo = new THREE.SphereGeometry(1.5, 64, 64);
    const earthMat = new THREE.MeshStandardMaterial({
      color: 0x0c1e15,
      roughness: 0.8,
      metalness: 0.15,
      wireframe: false,
    });
    const earthSphere = new THREE.Mesh(earthGeo, earthMat);
    globeGroup.add(earthSphere);

    // Latitude & Longitude Coordinate Wire Grid
    const wireGeo = new THREE.SphereGeometry(1.505, 32, 16);
    const wireMat = new THREE.MeshBasicMaterial({
      color: 0x203428,
      wireframe: true,
      transparent: true,
      opacity: 0.35,
    });
    const wireMesh = new THREE.Mesh(wireGeo, wireMat);
    globeGroup.add(wireMesh);

    // Lat/Lon to Vector3 conversion
    const latLonToVector3 = (lat: number, lon: number, radius: number): THREE.Vector3 => {
      const phi = (90 - lat) * (Math.PI / 180);
      const theta = (lon + 180) * (Math.PI / 180);
      const x = -(radius * Math.sin(phi) * Math.cos(theta));
      const z = radius * Math.sin(phi) * Math.sin(theta);
      const y = radius * Math.cos(phi);
      return new THREE.Vector3(x, y, z);
    };

    // Add Beacon Markers for Farm Points
    const beaconsGroup = new THREE.Group();
    globeGroup.add(beaconsGroup);

    farmPoints.forEach((farm) => {
      const pos = latLonToVector3(farm.lat, farm.lon, 1.51);

      // Glowing pin base
      const pinGeo = new THREE.SphereGeometry(0.035, 12, 12);
      const pinMat = new THREE.MeshBasicMaterial({
        color: farm.status === 'alert' ? 0xd96c63 : farm.status === 'attention' ? 0xd7ac58 : 0x89b96f,
      });
      const pin = new THREE.Mesh(pinGeo, pinMat);
      pin.position.copy(pos);
      beaconsGroup.add(pin);

      // Radiating pulse ring
      const ringGeo = new THREE.RingGeometry(0.04, 0.07, 16);
      const ringMat = new THREE.MeshBasicMaterial({
        color: 0x89b96f,
        transparent: true,
        opacity: 0.8,
        side: THREE.DoubleSide,
      });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.position.copy(pos);
      ring.lookAt(0, 0, 0);
      beaconsGroup.add(ring);
    });

    // Orbital Satellite Path (e.g. Sentinel-2 / NASA SMAP Polar Orbit)
    const orbitCurve = new THREE.EllipseCurve(0, 0, 1.85, 1.85, 0, 2 * Math.PI, false, 0);
    const orbitPoints = orbitCurve.getPoints(64).map((p) => new THREE.Vector3(p.x, p.y, 0));
    const orbitGeo = new THREE.BufferGeometry().setFromPoints(orbitPoints);
    const orbitMat = new THREE.LineDashedMaterial({
      color: 0x78b6c7,
      dashSize: 0.1,
      gapSize: 0.05,
      transparent: true,
      opacity: 0.6,
    });
    const orbitLine = new THREE.Line(orbitGeo, orbitMat);
    orbitLine.computeLineDistances();
    orbitLine.rotation.x = Math.PI / 3;
    orbitLine.rotation.y = Math.PI / 6;
    scene.add(orbitLine);

    // Satellite Model
    const satGroup = new THREE.Group();
    const satBody = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.04, 0.04), new THREE.MeshStandardMaterial({ color: 0xedf3ec, metalness: 0.8 }));
    const solarPanel = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.01, 0.06), new THREE.MeshStandardMaterial({ color: 0x4e9f9f, metalness: 0.9 }));
    satGroup.add(satBody);
    satGroup.add(solarPanel);
    scene.add(satGroup);

    // Initial orientation towards active coordinates
    const targetTheta = (activeLon + 180) * (Math.PI / 180);
    globeGroup.rotation.y = -targetTheta + Math.PI / 2;
    globeGroup.rotation.x = 0.25;

    // Interactive Dragging
    let isDragging = false;
    let previousX = 0;
    let previousY = 0;

    const onMouseDown = (e: MouseEvent) => {
      isDragging = true;
      previousX = e.clientX;
      previousY = e.clientY;
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const dx = e.clientX - previousX;
      const dy = e.clientY - previousY;
      globeGroup.rotation.y += dx * 0.008;
      globeGroup.rotation.x = Math.max(-0.6, Math.min(0.6, globeGroup.rotation.x + dy * 0.005));
      previousX = e.clientX;
      previousY = e.clientY;
    };

    const onMouseUp = () => {
      isDragging = false;
    };

    const domElement = renderer.domElement;
    domElement.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);

    // Resize
    const onResize = () => {
      if (!container) return;
      const nw = container.clientWidth;
      const nh = container.clientHeight || 340;
      camera.aspect = nw / nh;
      camera.updateProjectionMatrix();
      renderer.setSize(nw, nh);
    };

    const resizeObserver = new ResizeObserver(() => onResize());
    resizeObserver.observe(container);

    // Animation loop
    let animId: number;
    let orbitAngle = 0;

    const animate = () => {
      animId = requestAnimationFrame(animate);

      if (!isDragging) {
        globeGroup.rotation.y += 0.0018;
      }

      // Move satellite along orbit
      orbitAngle += 0.012;
      const sx = 1.85 * Math.cos(orbitAngle);
      const sy = 1.85 * Math.sin(orbitAngle);
      satGroup.position.set(sx, sy, 0);
      satGroup.position.applyEuler(orbitLine.rotation);

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(animId);
      resizeObserver.disconnect();
      domElement.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);

      earthGeo.dispose();
      earthMat.dispose();
      atmoGeo.dispose();
      atmoMat.dispose();
      renderer.dispose();
      if (container.contains(domElement)) {
        container.removeChild(domElement);
      }
    };
  }, [activeLat, activeLon, farmPoints]);

  return (
    <div
      className="relative w-full rounded-2xl overflow-hidden glass-panel border border-[#293B2E] shadow-2xl flex items-center justify-center"
      style={{ height }}
    >
      <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

      {/* Floating Header */}
      <div className="absolute top-3 left-3 flex items-center gap-2 bg-[#0B1410]/85 border border-[#89B96F]/30 backdrop-blur-md px-3 py-1.5 rounded-xl shadow-lg pointer-events-none">
        <Satellite className="w-4 h-4 text-[#78B6C7] animate-pulse" />
        <div>
          <span className="text-[11px] font-bold text-[#EDF3EC]">Global Agro-Climatic Sphere</span>
          <div className="text-[9px] font-mono text-[#89B96F]">NASA POWER & SMAP Earth Observatories</div>
        </div>
      </div>

      {/* Farm Pin Indicators */}
      <div className="absolute bottom-3 left-3 flex items-center gap-2 text-[10px] font-mono text-[#B1BDB0] bg-[#0B1410]/80 border border-[#293B2E] px-2.5 py-1 rounded-xl backdrop-blur-md pointer-events-none">
        <span className="w-2 h-2 rounded-full bg-[#89B96F] animate-ping" />
        <span>Live Orbit Coverage · 3 Active Farm Beacons</span>
      </div>
    </div>
  );
};
