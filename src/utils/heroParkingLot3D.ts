import type * as THREE from 'three';
import { ParkingSlot } from '../types';

type ThreeModule = typeof import('three');

export interface HeroLotSceneController {
  updateSlots: (nextSlots: ParkingSlot[]) => void;
  resize: () => void;
  dispose: () => void;
}

const MAX_HERO_BAYS = 16;
const DRIVE_DURATION_MS = 1200;

// Theme colors matching css/style.css and Stage 1 SVG
const COLOR_GROUND = 0xe9e3d6;
const COLOR_LANE = 0xddd6c7;
const COLOR_CURB = 0xd5ddd7;
const COLOR_BAY_LINE = 0xe6b422;
const COLOR_BOOKED_EDGE = 0xc87619;
const COLOR_AVAIL_PAD = 0xdcefe2;
const COLOR_FOREST = 0x1d4a35;
const COLOR_FOREST_DEEP = 0x143426;
const COLOR_TAUPE = 0x8d8678;
const COLOR_INK = 0x1b2a22;
const COLOR_WINDOW = 0xdcebe2;
const COLOR_ARROW = 0x8a968d;

/**
 * Checks whether the current browser environment supports the Stage 2 3D hero view.
 * Falls back to Stage 1 SVG when width < 600px, reduced motion is on, or WebGL is missing.
 */
export function canUseHero3D(): boolean {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return false;
  }
  if (window.innerWidth < 600) {
    return false;
  }
  if (
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  ) {
    return false;
  }
  try {
    const probe = document.createElement('canvas');
    const gl = probe.getContext('webgl2') || probe.getContext('webgl');
    if (!gl) return false;
    const lose = gl.getExtension('WEBGL_lose_context');
    if (lose) lose.loseContext();
    return true;
  } catch {
    return false;
  }
}

/**
 * Waits until the window 'load' event has fired before downloading the Three.js chunk.
 */
function waitForPageLoad(): Promise<void> {
  if (typeof document === 'undefined' || document.readyState === 'complete') {
    return Promise.resolve();
  }
  return new Promise((resolve) => {
    window.addEventListener('load', () => resolve(), { once: true });
  });
}

function disposeGroupResources(root: THREE.Object3D): void {
  root.traverse((obj) => {
    const mesh = obj as THREE.Mesh;
    if (mesh.geometry) {
      mesh.geometry.dispose();
    }
    const mat = mesh.material;
    if (Array.isArray(mat)) {
      mat.forEach((m) => m.dispose());
    } else if (mat) {
      mat.dispose();
    }
  });
}

function buildBoxVehicle(
  T: ThreeModule,
  vehicleType: 'Car' | 'Motorcycle',
  slotIndex: number,
  facingSign: number
): THREE.Group {
  const group = new T.Group();

  const bodyColors = [COLOR_FOREST, COLOR_FOREST_DEEP, COLOR_TAUPE];
  const bodyColor = bodyColors[slotIndex % bodyColors.length];

  const bodyMat = new T.MeshLambertMaterial({ color: bodyColor, flatShading: true });
  const roofMat = new T.MeshLambertMaterial({ color: COLOR_FOREST_DEEP, flatShading: true });
  const glassMat = new T.MeshLambertMaterial({ color: COLOR_WINDOW, flatShading: true });
  const trimMat = new T.MeshLambertMaterial({ color: COLOR_INK, flatShading: true });

  if (vehicleType === 'Motorcycle') {
    // Simple two-wheeler built from boxes
    const frame = new T.Mesh(new T.BoxGeometry(0.46, 0.24, 1.12), bodyMat);
    frame.position.set(0, 0.16, 0);
    group.add(frame);

    const seat = new T.Mesh(new T.BoxGeometry(0.36, 0.14, 0.56), trimMat);
    seat.position.set(0, 0.3, -0.06 * facingSign);
    group.add(seat);

    const handle = new T.Mesh(new T.BoxGeometry(0.66, 0.08, 0.1), trimMat);
    handle.position.set(0, 0.34, 0.34 * facingSign);
    group.add(handle);

    const screen = new T.Mesh(new T.BoxGeometry(0.3, 0.1, 0.16), glassMat);
    screen.position.set(0, 0.32, 0.42 * facingSign);
    group.add(screen);

    return group;
  }

  // Car built strictly from simple box parts
  const body = new T.Mesh(new T.BoxGeometry(1.16, 0.34, 2.02), bodyMat);
  body.position.set(0, 0.2, 0);
  group.add(body);

  const roof = new T.Mesh(new T.BoxGeometry(0.92, 0.22, 1.08), roofMat);
  roof.position.set(0, 0.46, -0.04 * facingSign);
  group.add(roof);

  const frontWindow = new T.Mesh(new T.BoxGeometry(0.84, 0.14, 0.22), glassMat);
  frontWindow.position.set(0, 0.41, 0.54 * facingSign);
  group.add(frontWindow);

  const rearWindow = new T.Mesh(new T.BoxGeometry(0.84, 0.12, 0.18), glassMat);
  rearWindow.position.set(0, 0.41, -0.62 * facingSign);
  group.add(rearWindow);

  const trim = new T.Mesh(new T.BoxGeometry(1.2, 0.1, 1.94), trimMat);
  trim.position.set(0, 0.06, 0);
  group.add(trim);

  return group;
}

/**
 * Dynamically loads pinned Three.js after initial page load, mounts a fixed
 * 3/4 top-down scene inside the existing inset box, runs a 1.2s arrival animation once,
 * and re-renders only on resize or when slots change.
 */
export async function mountHeroParkingLot3D(
  canvas: HTMLCanvasElement,
  initialSlots: ParkingSlot[],
  onFallback: () => void
): Promise<HeroLotSceneController | null> {
  if (!canUseHero3D()) {
    onFallback();
    return null;
  }

  await waitForPageLoad();

  // Re-check viewport and reduced motion after awaiting load
  if (!canUseHero3D() || !canvas.isConnected) {
    onFallback();
    return null;
  }

  let T: ThreeModule;
  try {
    T = await import('three');
  } catch {
    onFallback();
    return null;
  }

  if (!canvas.isConnected || !canUseHero3D()) {
    onFallback();
    return null;
  }

  let renderer: THREE.WebGLRenderer;
  try {
    renderer = new T.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: false,
      powerPreference: 'default'
    });
  } catch {
    onFallback();
    return null;
  }

  renderer.outputColorSpace = T.SRGBColorSpace;
  renderer.shadowMap.enabled = false;
  renderer.setClearColor(COLOR_GROUND, 1);

  const scene = new T.Scene();
  scene.background = new T.Color(COLOR_GROUND);

  const getSize = () => {
    const w = Math.max(canvas.clientWidth || 440, 240);
    const h = Math.max(canvas.clientHeight || 180, 140);
    return { w, h };
  };

  const initSize = getSize();
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setSize(initSize.w, initSize.h, false);

  // Fixed camera in a gentle 3/4 top view
  const camera = new T.PerspectiveCamera(34, initSize.w / initSize.h, 0.1, 80);
  camera.position.set(0, 11.4, 6.2);
  camera.lookAt(0, 0, 0.25);

  // Soft even lighting without reflections or cast shadows
  const ambient = new T.AmbientLight(0xf6f3ec, 0.85);
  scene.add(ambient);

  const hemi = new T.HemisphereLight(0xfbf9f4, 0xd4ccbc, 0.65);
  scene.add(hemi);

  const keyLight = new T.DirectionalLight(0xfffdf8, 0.55);
  keyLight.position.set(4, 14, 7);
  keyLight.castShadow = false;
  scene.add(keyLight);

  // Static parking lot base planes (ground, top curb, middle driving lane, lane arrows)
  const staticGroup = new T.Group();
  const groundPlane = new T.Mesh(
    new T.PlaneGeometry(24, 12),
    new T.MeshLambertMaterial({ color: COLOR_GROUND, flatShading: true })
  );
  groundPlane.rotation.x = -Math.PI / 2;
  staticGroup.add(groundPlane);

  // Short top curb wall
  const curb = new T.Mesh(
    new T.BoxGeometry(14.8, 0.22, 0.26),
    new T.MeshLambertMaterial({ color: COLOR_CURB, flatShading: true })
  );
  curb.position.set(0, 0.11, -3.75);
  staticGroup.add(curb);

  const curbCap = new T.Mesh(
    new T.BoxGeometry(14.8, 0.05, 0.08),
    new T.MeshLambertMaterial({ color: COLOR_INK, flatShading: true })
  );
  curbCap.position.set(0, 0.23, -3.75);
  staticGroup.add(curbCap);

  // Center driving lane between top and bottom rows
  const lanePlane = new T.Mesh(
    new T.PlaneGeometry(14.8, 2.2),
    new T.MeshLambertMaterial({ color: COLOR_LANE, flatShading: true })
  );
  lanePlane.rotation.x = -Math.PI / 2;
  lanePlane.position.set(0, 0.01, 0);
  staticGroup.add(lanePlane);

  // Simple lane arrows built from boxes
  const arrowMat = new T.MeshLambertMaterial({ color: COLOR_ARROW, flatShading: true });
  [-4.2, 0, 4.2].forEach((ax) => {
    const shaft = new T.Mesh(new T.BoxGeometry(0.75, 0.02, 0.08), arrowMat);
    shaft.position.set(ax - 0.1, 0.02, 0);
    staticGroup.add(shaft);

    const tipTop = new T.Mesh(new T.BoxGeometry(0.26, 0.02, 0.08), arrowMat);
    tipTop.position.set(ax + 0.32, 0.02, -0.09);
    tipTop.rotation.y = Math.PI / 4;
    staticGroup.add(tipTop);

    const tipBot = new T.Mesh(new T.BoxGeometry(0.26, 0.02, 0.08), arrowMat);
    tipBot.position.set(ax + 0.32, 0.02, 0.09);
    tipBot.rotation.y = -Math.PI / 4;
    staticGroup.add(tipBot);
  });

  scene.add(staticGroup);

  // Dynamic group holding current area's bays and vehicles
  const dynamicGroup = new T.Group();
  scene.add(dynamicGroup);

  interface AnimatedVehicle {
    group: THREE.Group;
    startZ: number;
    endZ: number;
  }

  let animatedVehicles: AnimatedVehicle[] = [];
  let frameId: number | null = null;
  let disposed = false;

  const renderOnce = () => {
    if (disposed) return;
    renderer.render(scene, camera);
  };

  const stopAnimLoop = () => {
    if (frameId !== null) {
      cancelAnimationFrame(frameId);
      frameId = null;
    }
  };

  const buildBaysForSlots = (slots: ParkingSlot[], animateEntry: boolean) => {
    disposeGroupResources(dynamicGroup);
    dynamicGroup.clear();
    animatedVehicles = [];

    const visibleSlots = slots.slice(0, MAX_HERO_BAYS);
    if (visibleSlots.length === 0) {
      renderOnce();
      return;
    }

    const topCount = Math.ceil(visibleSlots.length / 2);
    const topSlots = visibleSlots.slice(0, topCount);
    const bottomSlots = visibleSlots.slice(topCount);

    const lineMat = new T.MeshLambertMaterial({ color: COLOR_BAY_LINE, flatShading: true });
    const bookedMat = new T.MeshLambertMaterial({ color: COLOR_BOOKED_EDGE, flatShading: true });
    const availMat = new T.MeshLambertMaterial({ color: COLOR_AVAIL_PAD, flatShading: true });
    const markerMat = new T.MeshLambertMaterial({ color: COLOR_FOREST, flatShading: true });

    const renderRow = (rowSlots: ParkingSlot[], rowZ: number, isTopRow: boolean) => {
      if (rowSlots.length === 0) return;

      const bayWidths = rowSlots.map((s) => (s.vehicle_type === 'Motorcycle' ? 1.15 : 1.72));
      const gap = 0.2;
      const totalWidth =
        bayWidths.reduce((acc, w) => acc + w, 0) + Math.max(0, rowSlots.length - 1) * gap;
      let cursorX = -totalWidth / 2;

      const bayDepth = 2.25;
      const facingSign = isTopRow ? 1 : -1;

      rowSlots.forEach((slot, idx) => {
        const w = bayWidths[idx];
        const cx = cursorX + w / 2;
        cursorX += w + gap;

        const bayGroup = new T.Group();
        bayGroup.position.set(cx, 0, rowZ);

        // Dashed yellow side dividers (3 segments each)
        [-w / 2, w / 2].forEach((sideX) => {
          [-0.72, 0, 0.72].forEach((segZ) => {
            const dash = new T.Mesh(new T.BoxGeometry(0.06, 0.02, 0.5), lineMat);
            dash.position.set(sideX, 0.015, segZ);
            bayGroup.add(dash);
          });
        });

        if (slot.status === 'Booked') {
          // Orange top edge line on booked bay
          const edgeZ = isTopRow ? -bayDepth / 2 + 0.08 : bayDepth / 2 - 0.08;
          const bookedBar = new T.Mesh(new T.BoxGeometry(w - 0.14, 0.04, 0.14), bookedMat);
          bookedBar.position.set(0, 0.025, edgeZ);
          bayGroup.add(bookedBar);
        } else if (slot.status === 'Available') {
          // Empty bay with a small green P tile
          const pad = new T.Mesh(new T.BoxGeometry(0.56, 0.02, 0.56), availMat);
          pad.position.set(0, 0.015, 0);
          bayGroup.add(pad);

          const pBar = new T.Mesh(new T.BoxGeometry(0.3, 0.03, 0.3), markerMat);
          pBar.position.set(0, 0.025, 0);
          bayGroup.add(pBar);
        } else if (slot.status === 'Occupied') {
          // Occupied bay with simple car or motorcycle driving in from the lane
          const vehicle = buildBoxVehicle(T, slot.vehicle_type, slot.slot_id, facingSign);
          const endZ = 0;
          const startZ = isTopRow ? 1.55 : -1.55;
          vehicle.position.set(0, 0.01, animateEntry ? startZ : endZ);
          bayGroup.add(vehicle);

          if (animateEntry) {
            animatedVehicles.push({ group: vehicle, startZ, endZ });
          }
        }

        dynamicGroup.add(bayGroup);
      });
    };

    renderRow(topSlots, -2.38, true);
    renderRow(bottomSlots, 2.38, false);

    if (animateEntry && animatedVehicles.length > 0) {
      const startTime = performance.now();
      const tick = (now: number) => {
        if (disposed) return;
        const t = Math.min((now - startTime) / DRIVE_DURATION_MS, 1);
        const eased = 1 - Math.pow(1 - t, 3);

        for (let i = 0; i < animatedVehicles.length; i += 1) {
          const item = animatedVehicles[i];
          item.group.position.z = item.startZ + (item.endZ - item.startZ) * eased;
        }

        renderOnce();
        if (t < 1) {
          frameId = requestAnimationFrame(tick);
        } else {
          frameId = null;
        }
      };
      frameId = requestAnimationFrame(tick);
    } else {
      renderOnce();
    }
  };

  buildBaysForSlots(initialSlots, true);

  return {
    updateSlots: (nextSlots: ParkingSlot[]) => {
      if (disposed) return;
      stopAnimLoop();
      buildBaysForSlots(nextSlots, false);
    },
    resize: () => {
      if (disposed) return;
      const { w, h } = getSize();
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      renderer.setSize(w, h, false);
      renderOnce();
    },
    dispose: () => {
      if (disposed) return;
      disposed = true;
      stopAnimLoop();
      disposeGroupResources(staticGroup);
      disposeGroupResources(dynamicGroup);
      scene.clear();
      renderer.dispose();
    }
  };
}
