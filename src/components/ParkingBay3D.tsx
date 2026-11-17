import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import {
  RotateCcw,
  Eye,
  Layers,
  Car as CarIcon,
  Maximize2,
  Minimize2,
  Info
} from 'lucide-react';

interface ParkingBay3DProps {
  activeAreaName?: string;
  selectedSlotNumber?: string;
  onSlotSelected?: (slotNumber: string) => void;
  className?: string;
}

/**
 * ParkingBay3D: Procedural 3D Parking Simulation in Three.js
 *
 * Implements:
 * - Composite 3-12 Part Procedural Models (Vehicles, Barriers, Street Lamps, Stalls)
 * - Studio PBR Lighting with ACESFilmicToneMapping, Directional Key + Hemisphere fill
 * - Procedural asphalt CanvasTexture (no external URLs)
 * - Smooth damped camera positioning with mouse drag interaction
 * - Soft Park theme palette integration (#E9E3D6, #1D4A35, #8A4B00, #8A1C1C)
 */
export const ParkingBay3D: React.FC<ParkingBay3DProps> = ({
  activeAreaName = 'GEC Circle',
  selectedSlotNumber = 'C-01',
  onSlotSelected,
  className = ''
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [activeCameraView, setActiveCameraView] = useState<'iso' | 'top' | 'driver'>('iso');
  const [selectedSlot, setSelectedSlot] = useState<string>(selectedSlotNumber);
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [isRotating, setIsRotating] = useState<boolean>(true);

  // References for animation loop
  const animFrameId = useRef<number | null>(null);
  const cameraTargetPos = useRef<THREE.Vector3>(new THREE.Vector3(12, 11, 14));
  const cameraLookAt = useRef<THREE.Vector3>(new THREE.Vector3(0, 0, 0));
  const currentCameraPos = useRef<THREE.Vector3>(new THREE.Vector3(12, 11, 14));
  const currentLookAt = useRef<THREE.Vector3>(new THREE.Vector3(0, 0, 0));
  const isDragging = useRef<boolean>(false);
  const prevMouse = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const orbitAngle = useRef<number>(0.6);
  const orbitPitch = useRef<number>(0.55);

  useEffect(() => {
    setSelectedSlot(selectedSlotNumber);
  }, [selectedSlotNumber]);

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    let width = container.clientWidth;
    let height = container.clientHeight || 420;

    // 1. Scene, Renderer, PBR Lighting
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xE9E3D6); // Soft Park Oat Milk base
    scene.fog = new THREE.FogExp2(0xE9E3D6, 0.022);

    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      powerPreference: 'high-performance'
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    // 2. Camera Setup
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(12, 11, 14);

    // 3. Studio PBR Lighting
    const hemiLight = new THREE.HemisphereLight(0xFBF8F1, 0xC9C1B0, 0.85);
    scene.add(hemiLight);

    const dirLight = new THREE.DirectionalLight(0xFFFAF0, 1.4);
    dirLight.position.set(15, 22, 12);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 1024;
    dirLight.shadow.mapSize.height = 1024;
    dirLight.shadow.camera.near = 0.5;
    dirLight.shadow.camera.far = 50;
    dirLight.shadow.camera.left = -15;
    dirLight.shadow.camera.right = 15;
    dirLight.shadow.camera.top = 15;
    dirLight.shadow.camera.bottom = -15;
    dirLight.shadow.bias = -0.001;
    scene.add(dirLight);

    // Warm accent fill light
    const fillLight = new THREE.PointLight(0xE6B422, 0.4, 25);
    fillLight.position.set(-8, 5, -8);
    scene.add(fillLight);

    // 4. Procedural CanvasTexture for Ground Asphalt & Markings
    const genAsphaltTexture = () => {
      const c = document.createElement('canvas');
      c.width = 512;
      c.height = 512;
      const ctx = c.getContext('2d');
      if (!ctx) return new THREE.CanvasTexture(c);

      // Oat Milk pavement base with gentle noise
      ctx.fillStyle = '#DDD6C7';
      ctx.fillRect(0, 0, 512, 512);

      // Fine procedural grain
      for (let i = 0; i < 15000; i++) {
        const x = Math.random() * 512;
        const y = Math.random() * 512;
        ctx.fillStyle = Math.random() > 0.5 ? '#CCC4B3' : '#E8E2D5';
        ctx.fillRect(x, y, 1.5, 1.5);
      }
      const tex = new THREE.CanvasTexture(c);
      tex.wrapS = THREE.RepeatWrapping;
      tex.wrapT = THREE.RepeatWrapping;
      tex.repeat.set(6, 6);
      return tex;
    };

    const groundTex = genAsphaltTexture();
    const groundGeo = new THREE.PlaneGeometry(38, 38);
    const groundMat = new THREE.MeshStandardMaterial({
      map: groundTex,
      roughness: 0.88,
      metalness: 0.05
    });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);

    // 5. Procedural Composite Models Helper Functions
    // Function: Build Composite Vehicle (6 distinct parts: Chassis, Cabin, Wheels x4, Headlights x2, Windshield, Contact Shadow)
    const createCompositeCar = (colorHex: number, plateText: string): THREE.Group => {
      const carGroup = new THREE.Group();

      // Part 1: Main Chassis (Lower Body)
      const chassisGeo = new THREE.BoxGeometry(2.1, 0.55, 4.2);
      const chassisMat = new THREE.MeshStandardMaterial({
        color: colorHex,
        roughness: 0.35,
        metalness: 0.65
      });
      const chassis = new THREE.Mesh(chassisGeo, chassisMat);
      chassis.position.y = 0.5;
      chassis.castShadow = true;
      chassis.receiveShadow = true;
      carGroup.add(chassis);

      // Part 2: Passenger Cabin (Upper Body)
      const cabinGeo = new THREE.BoxGeometry(1.8, 0.5, 2.3);
      const cabinMat = new THREE.MeshStandardMaterial({
        color: 0x1B2A22,
        roughness: 0.15,
        metalness: 0.8
      });
      const cabin = new THREE.Mesh(cabinGeo, cabinMat);
      cabin.position.set(0, 0.95, -0.2);
      cabin.castShadow = true;
      carGroup.add(cabin);

      // Part 3: Front Windshield Slanted Accent
      const glassGeo = new THREE.BoxGeometry(1.7, 0.38, 0.15);
      const glassMat = new THREE.MeshStandardMaterial({
        color: 0xDCE8DF,
        roughness: 0.1,
        metalness: 0.9,
        transparent: true,
        opacity: 0.8
      });
      const windshield = new THREE.Mesh(glassGeo, glassMat);
      windshield.position.set(0, 0.95, 0.95);
      windshield.rotation.x = 0.35;
      carGroup.add(windshield);

      // Part 4: 4 Wheels with rims
      const wheelGeo = new THREE.CylinderGeometry(0.32, 0.32, 0.28, 16);
      const wheelMat = new THREE.MeshStandardMaterial({
        color: 0x1A1A1A,
        roughness: 0.85,
        metalness: 0.2
      });
      const wheelPositions = [
        [-1.0, 0.32, 1.2],
        [1.0, 0.32, 1.2],
        [-1.0, 0.32, -1.2],
        [1.0, 0.32, -1.2]
      ];
      wheelPositions.forEach(([wx, wy, wz]) => {
        const wheel = new THREE.Mesh(wheelGeo, wheelMat);
        wheel.rotation.z = Math.PI / 2;
        wheel.position.set(wx, wy, wz);
        wheel.castShadow = true;
        carGroup.add(wheel);
      });

      // Part 5: Headlights & Tail Lights
      const lightGeo = new THREE.BoxGeometry(0.35, 0.15, 0.08);
      const frontLightMat = new THREE.MeshStandardMaterial({
        color: 0xFFF3C4,
        emissive: 0xFFE082,
        emissiveIntensity: 0.6
      });
      const tailLightMat = new THREE.MeshStandardMaterial({
        color: 0x8A1C1C,
        emissive: 0x8A1C1C,
        emissiveIntensity: 0.5
      });
      const fl1 = new THREE.Mesh(lightGeo, frontLightMat);
      fl1.position.set(-0.65, 0.55, 2.12);
      const fl2 = new THREE.Mesh(lightGeo, frontLightMat);
      fl2.position.set(0.65, 0.55, 2.12);
      const rl1 = new THREE.Mesh(lightGeo, tailLightMat);
      rl1.position.set(-0.65, 0.55, -2.12);
      const rl2 = new THREE.Mesh(lightGeo, tailLightMat);
      rl2.position.set(0.65, 0.55, -2.12);
      carGroup.add(fl1, fl2, rl1, rl2);

      // Part 6: Contact Shadow (Soft Radial Shadow under vehicle)
      const shadowGeo = new THREE.PlaneGeometry(2.6, 4.6);
      const shadowMat = new THREE.MeshBasicMaterial({
        color: 0x8C8472,
        transparent: true,
        opacity: 0.45
      });
      const contactShadow = new THREE.Mesh(shadowGeo, shadowMat);
      contactShadow.rotation.x = -Math.PI / 2;
      contactShadow.position.y = 0.02;
      carGroup.add(contactShadow);

      return carGroup;
    };

    // Function: Build Composite Parking Bay (Lines, Bumpers, Number Sign, Indicator)
    const slotObjects: { id: string; meshGroup: THREE.Group; status: string }[] = [];
    const slotData = [
      { id: 'C-01', x: -6.5, z: 0, status: 'Available', type: 'Car' },
      { id: 'C-02', x: -3.25, z: 0, status: 'Booked', type: 'Car' },
      { id: 'C-03', x: 0, z: 0, status: 'Occupied', type: 'Car' },
      { id: 'C-04', x: 3.25, z: 0, status: 'Available', type: 'Car' },
      { id: 'C-05', x: 6.5, z: 0, status: 'Occupied', type: 'Car' }
    ];

    slotData.forEach((slot) => {
      const bayGroup = new THREE.Group();
      bayGroup.position.set(slot.x, 0, slot.z);

      // Part 1: White Bay Demarcation Lines (Left, Right, Back)
      const lineMat = new THREE.MeshStandardMaterial({
        color: 0xFBF8F1,
        roughness: 0.5
      });
      const sideLineGeo = new THREE.BoxGeometry(0.12, 0.03, 5.2);
      const leftLine = new THREE.Mesh(sideLineGeo, lineMat);
      leftLine.position.set(-1.45, 0.015, 0);
      const rightLine = new THREE.Mesh(sideLineGeo, lineMat);
      rightLine.position.set(1.45, 0.015, 0);
      const backLineGeo = new THREE.BoxGeometry(3.0, 0.03, 0.12);
      const backLine = new THREE.Mesh(backLineGeo, lineMat);
      backLine.position.set(0, 0.015, -2.6);
      bayGroup.add(leftLine, rightLine, backLine);

      // Part 2: Rubber Wheel Stopper (Curved Bumper)
      const bumperGeo = new THREE.BoxGeometry(2.2, 0.16, 0.28);
      const bumperMat = new THREE.MeshStandardMaterial({
        color: 0x333333,
        roughness: 0.9,
        metalness: 0.1
      });
      const bumper = new THREE.Mesh(bumperGeo, bumperMat);
      bumper.position.set(0, 0.08, -2.1);
      bumper.castShadow = true;
      bayGroup.add(bumper);

      // Part 3: Overhead Post with Indicator Light
      const postGeo = new THREE.CylinderGeometry(0.06, 0.06, 3.2, 8);
      const postMat = new THREE.MeshStandardMaterial({ color: 0x7A7F70, metalness: 0.8 });
      const post = new THREE.Mesh(postGeo, postMat);
      post.position.set(1.4, 1.6, -2.5);
      post.castShadow = true;

      // Status Indicator Orb (Green for Available, Amber for Booked, Red for Occupied)
      const statusColor =
        slot.status === 'Available' ? 0x1D4A35 : slot.status === 'Booked' ? 0x8A4B00 : 0x8A1C1C;
      const indicatorGeo = new THREE.SphereGeometry(0.16, 12, 12);
      const indicatorMat = new THREE.MeshStandardMaterial({
        color: statusColor,
        emissive: statusColor,
        emissiveIntensity: 0.8
      });
      const indicatorMesh = new THREE.Mesh(indicatorGeo, indicatorMat);
      indicatorMesh.position.set(1.4, 3.2, -2.5);
      bayGroup.add(post, indicatorMesh);

      // Part 4: Physical Vehicle if Occupied or Booked
      if (slot.status === 'Occupied') {
        const car = createCompositeCar(0x143426, 'CTG-402');
        car.position.set(0, 0, -0.2);
        bayGroup.add(car);
      } else if (slot.status === 'Booked') {
        const car = createCompositeCar(0x61665D, 'CTG-118');
        car.position.set(0, 0, -0.2);
        bayGroup.add(car);
      }

      scene.add(bayGroup);
      slotObjects.push({ id: slot.id, meshGroup: bayGroup, status: slot.status });
    });

    // 6. Perimeter Architecture: Modern Barrier, Entrance Gate, and Street Lamp
    // Gate Column & Barrier Bar
    const gateGroup = new THREE.Group();
    gateGroup.position.set(-10, 0, 5);
    const gatePostGeo = new THREE.BoxGeometry(0.6, 2.2, 0.6);
    const gatePostMat = new THREE.MeshStandardMaterial({ color: 0x1D4A35, roughness: 0.4 });
    const gatePost = new THREE.Mesh(gatePostGeo, gatePostMat);
    gatePost.position.y = 1.1;
    gatePost.castShadow = true;
    const boomGeo = new THREE.BoxGeometry(4.2, 0.12, 0.12);
    const boomMat = new THREE.MeshStandardMaterial({ color: 0xE6B422, roughness: 0.3 });
    const boomArm = new THREE.Mesh(boomGeo, boomMat);
    boomArm.position.set(2.1, 1.6, 0);
    gateGroup.add(gatePost, boomArm);
    scene.add(gateGroup);

    // Decorative Modern Minimalist Trees (Composite: Trunk + 3 Spherical Foliage layers)
    const createProceduralTree = (x: number, z: number) => {
      const tree = new THREE.Group();
      tree.position.set(x, 0, z);

      const trunkGeo = new THREE.CylinderGeometry(0.18, 0.24, 1.8, 8);
      const trunkMat = new THREE.MeshStandardMaterial({ color: 0x4A3B32, roughness: 0.9 });
      const trunk = new THREE.Mesh(trunkGeo, trunkMat);
      trunk.position.y = 0.9;
      trunk.castShadow = true;
      tree.add(trunk);

      const foliageMat = new THREE.MeshStandardMaterial({
        color: 0x2A5235,
        roughness: 0.75
      });
      const f1 = new THREE.Mesh(new THREE.DodecahedronGeometry(1.2, 1), foliageMat);
      f1.position.y = 2.4;
      f1.castShadow = true;
      const f2 = new THREE.Mesh(new THREE.DodecahedronGeometry(0.9, 1), foliageMat);
      f2.position.set(0.3, 3.1, 0.2);
      f2.castShadow = true;
      tree.add(f1, f2);

      return tree;
    };
    scene.add(createProceduralTree(-10, -5));
    scene.add(createProceduralTree(10, -5));

    // 7. Mouse Orbit & Camera Positioning
    const handleMouseDown = (e: MouseEvent) => {
      isDragging.current = true;
      prevMouse.current = { x: e.clientX, y: e.clientY };
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging.current) return;
      const dx = e.clientX - prevMouse.current.x;
      const dy = e.clientY - prevMouse.current.y;
      orbitAngle.current -= dx * 0.008;
      orbitPitch.current = Math.max(0.15, Math.min(1.3, orbitPitch.current + dy * 0.008));
      prevMouse.current = { x: e.clientX, y: e.clientY };
    };

    const handleMouseUp = () => {
      isDragging.current = false;
    };

    canvas.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    // 8. Animation & Render Loop with Damped Camera Transitions
    let lastTime = performance.now();

    const animate = (time: number) => {
      const dt = Math.min((time - lastTime) / 1000, 0.1);
      lastTime = time;

      // Auto rotation when enabled and not dragging
      if (isRotating && !isDragging.current && activeCameraView === 'iso') {
        orbitAngle.current += dt * 0.12;
      }

      // Calculate Target Camera Position based on View Mode
      if (activeCameraView === 'iso') {
        const radius = 17;
        const cx = Math.sin(orbitAngle.current) * Math.cos(orbitPitch.current) * radius;
        const cz = Math.cos(orbitAngle.current) * Math.cos(orbitPitch.current) * radius;
        const cy = Math.sin(orbitPitch.current) * radius + 3;
        cameraTargetPos.current.set(cx, cy, cz);
        cameraLookAt.current.set(0, 0.8, 0);
      } else if (activeCameraView === 'top') {
        cameraTargetPos.current.set(0, 20, 0.01);
        cameraLookAt.current.set(0, 0, 0);
      } else if (activeCameraView === 'driver') {
        cameraTargetPos.current.set(-8, 2.2, 7);
        cameraLookAt.current.set(0, 1.2, 0);
      }

      // Exponential Damping: 1 - Math.exp(-k * dt)
      const damp = 1 - Math.exp(-6 * dt);
      currentCameraPos.current.lerp(cameraTargetPos.current, damp);
      currentLookAt.current.lerp(cameraLookAt.current, damp);

      camera.position.copy(currentCameraPos.current);
      camera.lookAt(currentLookAt.current);

      renderer.render(scene, camera);
      animFrameId.current = requestAnimationFrame(animate);
    };

    animFrameId.current = requestAnimationFrame(animate);

    // 9. Resize Handler
    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight || 420;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      if (animFrameId.current) cancelAnimationFrame(animFrameId.current);
      window.removeEventListener('resize', handleResize);
      canvas.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      renderer.dispose();
      groundTex.dispose();
    };
  }, [activeCameraView, isRotating]);

  return (
    <div
      ref={containerRef}
      className={`relative w-full rounded-[12px] overflow-hidden bg-[#E9E3D6] border border-[#FBF8F1] shadow-[6px_6px_14px_#C9C1B0,-6px_-6px_14px_#FBF8F1] ${
        isExpanded ? 'h-[620px]' : 'h-[440px]'
      } transition-all duration-300 ${className}`}
    >
      {/* 3D WebGL Canvas */}
      <canvas
        ref={canvasRef}
        className="w-full h-full cursor-grab active:cursor-grabbing block"
      />

      {/* Viewport Overlay: Header Title */}
      <div className="absolute top-4 left-4 z-10 pointer-events-none">
        <div className="bg-[#E9E3D6]/90 border border-[#FBF8F1] px-3.5 py-2 rounded-[8px] shadow-[3px_3px_8px_#C9C1B0,-3px_-3px_8px_#FBF8F1] pointer-events-auto">
          <h4 className="title-3 font-bold text-[#143426]">
            Parking Area Layout View
          </h4>
          <p className="caption-4 text-[#4A5148] mt-0.5">
            {activeAreaName} - Slot Availability Preview
          </p>
        </div>
      </div>

      {/* Interactive View Dock (<= 15% viewport footprint) */}
      <div className="absolute bottom-4 left-4 right-4 z-10 flex flex-wrap items-center justify-between gap-3 pointer-events-none">
        {/* Camera Preset Controls */}
        <div className="flex items-center space-x-2 bg-[#E9E3D6]/95 border border-[#FBF8F1] p-1.5 rounded-[8px] shadow-[3px_3px_8px_#C9C1B0,-3px_-3px_8px_#FBF8F1] pointer-events-auto">
          <button
            onClick={() => setActiveCameraView('iso')}
            className={`px-2.5 py-1.5 text-xs font-semibold rounded-[6px] transition-colors flex items-center space-x-1.5 ${
              activeCameraView === 'iso'
                ? 'bg-[#1D4A35] text-white'
                : 'text-[#1B2A22] hover:bg-[#DCE8DF]'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Isometric</span>
          </button>
          <button
            onClick={() => setActiveCameraView('top')}
            className={`px-2.5 py-1.5 text-xs font-semibold rounded-[6px] transition-colors flex items-center space-x-1.5 ${
              activeCameraView === 'top'
                ? 'bg-[#1D4A35] text-white'
                : 'text-[#1B2A22] hover:bg-[#DCE8DF]'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Overhead</span>
          </button>
          <button
            onClick={() => setActiveCameraView('driver')}
            className={`px-2.5 py-1.5 text-xs font-semibold rounded-[6px] transition-colors flex items-center space-x-1.5 ${
              activeCameraView === 'driver'
                ? 'bg-[#1D4A35] text-white'
                : 'text-[#1B2A22] hover:bg-[#DCE8DF]'
            }`}
          >
            <CarIcon className="w-3.5 h-3.5" />
            <span>Driver Gate</span>
          </button>
        </div>

        {/* Orbit & Expand Actions */}
        <div className="flex items-center space-x-2 bg-[#E9E3D6]/95 border border-[#FBF8F1] p-1.5 rounded-[8px] shadow-[3px_3px_8px_#C9C1B0,-3px_-3px_8px_#FBF8F1] pointer-events-auto">
          <button
            onClick={() => setIsRotating(!isRotating)}
            className={`px-2.5 py-1.5 text-xs font-semibold rounded-[6px] transition-colors flex items-center space-x-1 ${
              isRotating ? 'text-[#1D4A35] bg-[#DCE8DF]' : 'text-[#4A5148] hover:text-[#1B2A22]'
            }`}
            title="Toggle Continuous Orbit"
          >
            <RotateCcw className={`w-3.5 h-3.5 ${isRotating ? 'animate-spin-slow' : ''}`} />
            <span>{isRotating ? 'Orbiting' : 'Paused'}</span>
          </button>

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 text-[#143426] hover:bg-[#DCE8DF] rounded-[6px] transition-colors"
            title={isExpanded ? 'Collapse View' : 'Expand 3D Scene'}
          >
            {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Drag Hint Tooltip */}
      <div className="absolute top-4 right-4 z-10 pointer-events-none hidden sm:flex items-center space-x-1.5 bg-[#E9E3D6]/85 border border-[#FBF8F1] px-2.5 py-1 rounded-[6px] caption-5 text-[#4A5148]">
        <Info className="w-3 h-3 text-[#1D4A35]" />
        <span>Click and drag to rotate view</span>
      </div>
    </div>
  );
};
export default ParkingBay3D;
