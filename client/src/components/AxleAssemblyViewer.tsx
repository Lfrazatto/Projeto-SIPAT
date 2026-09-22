import React, { useEffect, useRef, useState, useMemo, useCallback } from "react";
import * as THREE from "three";
import {
  RotateCcw,
  Layers,
  Sliders,
  Eye,
  Maximize2,
  Activity,
  Ruler,
  ChevronRight,
  ShieldCheck,
  Focus,
  Pause,
  Play
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MS120_CATALOG, ComponentDefinition, getComponentById } from "@/data/ms120Catalog";
import { REAL_PHOTOS } from "@/data/realPhotos";
import { useAccessibility } from "@/contexts/AccessibilityContext";

const ROTATING_COMPONENTS = new Set([
  "input_flange",
  "front_pinion_bearing",
  "rear_pinion_bearing",
  "drive_pinion",
  "ring_gear",
  "differential_carrier",
  "spider_cross",
  "spider_pins",
  "spider_gears",
  "side_gears",
  "left_axle_shaft",
  "right_axle_shaft",
  "left_axle_splines",
  "right_axle_splines",
  "left_wheel_hub",
  "right_wheel_hub",
  "left_hub_bearings",
  "right_hub_bearings",
  "left_hub_seal",
  "right_hub_seal",
  "left_brake_assembly",
  "right_brake_assembly",
  "wheel_studs",
]);

const AXIS_LABELS: Record<string, string> = {
  x: "transversal do veículo",
  y: "vertical de serviço",
  z: "longitudinal de entrada",
};

type Mode = "assembled" | "exploded" | "running" | "curve";
type ViewMode = "solid" | "wireframe" | "xray" | "section";
type CameraPreset = "iso" | "front" | "top" | "side" | "diff";

interface ComponentMeshMap {
  [id: string]: THREE.Group;
}

interface AxleAssemblyViewerProps {
  compact?: boolean;
  onWebglError?: () => void;
}

export function AxleAssemblyViewer({
  compact = false,
  onWebglError,
}: AxleAssemblyViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { reducedMotion } = useAccessibility();

  // States
  const [mode, setMode] = useState<Mode>("assembled");
  const [viewMode, setViewMode] = useState<ViewMode>("solid");
  const [explodeDepth, setExplodeDepth] = useState<number>(0);
  const [sectionPlanePos, setSectionPlanePos] = useState<number>(0);
  const [selectedId, setSelectedId] = useState<string>("main_axle_housing");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [showOptionalComponents, setShowOptionalComponents] = useState<boolean>(true);
  const [showComponents, setShowComponents] = useState<boolean>(true);
  const [measureModeActive, setMeasureModeActive] = useState<boolean>(false);
  const [measuredDistance, setMeasuredDistance] = useState<string | null>(null);
  const [isolatedId, setIsolatedId] = useState<string | null>(null);
  const [motionPaused, setMotionPaused] = useState(false);
  const [animationSpeed, setAnimationSpeed] = useState(1);
  const [autoRotate, setAutoRotate] = useState(!reducedMotion);

  // Three references
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const groupMapRef = useRef<ComponentMeshMap>({});
  const rootAssemblyRef = useRef<THREE.Group | null>(null);
  const materialsRef = useRef<THREE.Material[]>([]);
  const clippingPlaneRef = useRef<THREE.Plane | null>(null);
  const interiorLightRef = useRef<THREE.PointLight | null>(null);
  const animationFrameIdRef = useRef<number | null>(null);
  const rotationAngleRef = useRef<number>(0);
  const motionPausedRef = useRef(false);
  const animationSpeedRef = useRef(1);
  const autoRotateRef = useRef(!reducedMotion);
  const reducedMotionRef = useRef(reducedMotion);
  const gridRef = useRef<THREE.GridHelper | null>(null);
  const initialCameraTargetRef = useRef(new THREE.Vector3(0, 0, 0));
  const initialCameraDistanceRef = useRef(14);

  // Pointer interactions
  const isDraggingRef = useRef<boolean>(false);
  const isRightDraggingRef = useRef<boolean>(false);
  const previousMousePositionRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const cameraDistanceRef = useRef<number>(14);
  const cameraTargetRef = useRef<THREE.Vector3>(new THREE.Vector3(0, 0, 0));
  const cameraPolarRef = useRef<{ theta: number; phi: number }>({
    theta: Math.PI / 4,
    phi: Math.PI / 3.2
  });
  const modeRef = useRef<Mode>("assembled");

  const selectedComponent = useMemo(() => {
    return getComponentById(selectedId) || MS120_CATALOG[0];
  }, [selectedId]);

  const filteredCatalog = useMemo(() => {
    return MS120_CATALOG.filter((comp) => {
      if (!showOptionalComponents && comp.optional) return false;
      if (filterCategory === "all") return true;
      return comp.category === filterCategory;
    });
  }, [filterCategory, showOptionalComponents]);

  useEffect(() => {
    modeRef.current = mode;
  }, [mode]);

  useEffect(() => {
    motionPausedRef.current = motionPaused;
  }, [motionPaused]);

  useEffect(() => {
    animationSpeedRef.current = animationSpeed;
  }, [animationSpeed]);

  useEffect(() => {
    reducedMotionRef.current = reducedMotion;
    if (reducedMotion) {
      autoRotateRef.current = false;
      setAutoRotate(false);
    }
  }, [reducedMotion]);

  useEffect(() => {
    autoRotateRef.current = autoRotate;
  }, [autoRotate]);

  // Set camera preset
  const setCameraView = useCallback((preset: CameraPreset) => {
    if (!cameraPolarRef.current) return;
    if (preset === "iso") {
      cameraPolarRef.current = { theta: Math.PI / 4, phi: Math.PI / 3.2 };
      cameraDistanceRef.current = initialCameraDistanceRef.current;
      cameraTargetRef.current.copy(initialCameraTargetRef.current);
    } else if (preset === "front") {
      cameraPolarRef.current = { theta: 0, phi: Math.PI / 2 };
      cameraDistanceRef.current = 13;
      cameraTargetRef.current.copy(initialCameraTargetRef.current);
    } else if (preset === "top") {
      cameraPolarRef.current = { theta: 0, phi: 0.05 };
      cameraDistanceRef.current = 15;
      cameraTargetRef.current.copy(initialCameraTargetRef.current);
    } else if (preset === "side") {
      cameraPolarRef.current = { theta: Math.PI / 2, phi: Math.PI / 2 };
      cameraDistanceRef.current = 13;
      cameraTargetRef.current.copy(initialCameraTargetRef.current);
    } else if (preset === "diff") {
      cameraPolarRef.current = { theta: 0.2, phi: Math.PI / 2.8 };
      cameraDistanceRef.current = 7.5;
      cameraTargetRef.current.copy(initialCameraTargetRef.current);
    }
  }, []);

  const focusComponent = useCallback((id: string) => {
    const group = groupMapRef.current[id];
    const camera = cameraRef.current;
    if (!group || !camera) return;
    const bounds = new THREE.Box3().setFromObject(group);
    if (bounds.isEmpty()) return;
    const center = bounds.getCenter(new THREE.Vector3());
    const size = bounds.getSize(new THREE.Vector3());
    cameraTargetRef.current.copy(center);
    cameraDistanceRef.current = Math.min(21, Math.max(5.2, size.length() * 2.7));
  }, []);

  const selectComponent = useCallback((id: string, shouldFocus = true) => {
    setSelectedId(id);
    if (shouldFocus) focusComponent(id);
  }, [focusComponent]);

  const zoomBy = useCallback((delta: number) => {
    cameraDistanceRef.current = Math.max(4, Math.min(25, cameraDistanceRef.current + delta));
  }, []);

  // Update exploded positions strictly according to catalog specification
  const applyExplodeTransformations = useCallback((depth: number) => {
    const map = groupMapRef.current;
    MS120_CATALOG.forEach((comp) => {
      const grp = map[comp.id];
      if (!grp) return;

      const mountedPos = (grp.userData.mountedPos as THREE.Vector3) || new THREE.Vector3(0, 0, 0);

      const stageNorm = comp.explodeStage / 6;
      let factor = 0;
      if (depth > 0) {
        const start = Math.max(0, stageNorm - 0.2);
        const end = Math.min(1.0, stageNorm + 0.3);
        if (depth >= end) {
          factor = 1.0;
        } else if (depth <= start) {
          factor = 0;
        } else {
          factor = (depth - start) / (end - start);
        }
      }

      const offsetDist = comp.explodeDistance * factor;
      const xOff = comp.removalAxis === "x" ? comp.removalSign * offsetDist : 0;
      const yOff = comp.removalAxis === "y" ? comp.removalSign * offsetDist : 0;
      const zOff = comp.removalAxis === "z" ? comp.removalSign * offsetDist : 0;

      const targetPosition = new THREE.Vector3(mountedPos.x + xOff, mountedPos.y + yOff, mountedPos.z + zOff);
      grp.userData.explodeTarget = targetPosition;
      if (reducedMotionRef.current) grp.position.copy(targetPosition);
    });
  }, []);

  // Three.js scene setup
  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    // Renderer: WebGL pode estar indisponível em navegadores, dispositivos ou modos de economia.
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        canvas,
        antialias: true,
        alpha: true,
        powerPreference: "high-performance"
      });
    } catch {
      onWebglError?.();
      return;
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.localClippingEnabled = true;
    rendererRef.current = renderer;

    // Scene
    const scene = new THREE.Scene();
    // Fundo transparente: a fotografia industrial é aplicada no container HTML atrás do WebGL.
    scene.background = null;
    renderer.setClearColor(0x0e1117, 0);
    sceneRef.current = scene;

    // Camera
    const camera = new THREE.PerspectiveCamera(
      42,
      container.clientWidth / container.clientHeight,
      0.1,
      100
    );
    cameraRef.current = camera;

    // Clipping plane
    const clipPlane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 5.0);
    clippingPlaneRef.current = clipPlane;

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.55);
    scene.add(ambientLight);

    const hemiLight = new THREE.HemisphereLight(0xdcecff, 0x20262c, 1.1);
    scene.add(hemiLight);

    const dirLight1 = new THREE.DirectionalLight(0xffffff, 2.4);
    dirLight1.position.set(10, 15, 12);
    dirLight1.castShadow = true;
    dirLight1.shadow.mapSize.width = 1024;
    dirLight1.shadow.mapSize.height = 1024;
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0xff3322, 0.7);
    dirLight2.position.set(-12, 4, -10);
    scene.add(dirLight2);

    const fillLight = new THREE.DirectionalLight(0x9bb9d4, 1.2);
    fillLight.position.set(0, -10, 8);
    scene.add(fillLight);

    const rimLight = new THREE.DirectionalLight(0xff6655, 1.15);
    rimLight.position.set(-8, 6, -14);
    scene.add(rimLight);

    const interiorLight = new THREE.PointLight(0x4aa8d8, 0, 8, 2);
    interiorLight.position.set(0, 0.2, 0.2);
    scene.add(interiorLight);
    interiorLightRef.current = interiorLight;

    // Piso industrial discreto: a grade fica desligada por padrão e só aparece quando necessária para medição/wireframe.
    const factoryFloor = new THREE.Mesh(
      new THREE.PlaneGeometry(28, 18),
      new THREE.MeshStandardMaterial({
        color: 0x69737a,
        roughness: 0.92,
        metalness: 0.04,
        transparent: true,
        opacity: 0.34,
        side: THREE.DoubleSide,
      })
    );
    factoryFloor.rotation.x = -Math.PI / 2;
    factoryFloor.position.y = -2.8;
    factoryFloor.receiveShadow = true;
    scene.add(factoryFloor);

    const grid = new THREE.GridHelper(20, 20, 0xda291c, 0x34404a);
    grid.position.y = -2.76;
    grid.visible = false;
    gridRef.current = grid;
    scene.add(grid);

    // Root Assembly
    const rootAssembly = new THREE.Group();
    scene.add(rootAssembly);
    rootAssemblyRef.current = rootAssembly;

    // Materials Factory
    const materials: THREE.Material[] = [];
    const createMat = (
      color: number,
      metalness = 0.85,
      roughness = 0.25,
      opacity = 1.0,
      transparent = false
    ) => {
      const m = new THREE.MeshStandardMaterial({
        color,
        metalness,
        roughness,
        opacity,
        transparent,
        side: THREE.DoubleSide,
        clippingPlanes: [clipPlane]
      });
      materials.push(m);
      return m;
    };

    const castIronMat = createMat(0x657481, 0.68, 0.42);
    const innerIronMat = createMat(0x8796a3, 0.72, 0.32);
    const machinedSteelMat = createMat(0xd8e0e6, 0.94, 0.16);
    const darkSteelMat = createMat(0x77838f, 0.88, 0.28);
    // Aço tratado, não dourado: dentes e engrenagens permanecem industriais e legíveis.
    const gearBronzeMat = createMat(0x76828a, 0.91, 0.22);
    const gearHighlightMat = createMat(0xb8c4cb, 0.94, 0.17);
    const fastenerMat = createMat(0xd5dee5, 0.92, 0.17);
    const brakeMat = createMat(0x778693, 0.68, 0.38);
    const brakeLiningMat = createMat(0xb6754e, 0.44, 0.62);
    const rubberMat = createMat(0x22272b, 0.08, 0.88);
    materialsRef.current = materials;

    const beveledBox = (width: number, height: number, depth: number, bevel = 0.05) => {
      const shape = new THREE.Shape();
      const hw = width / 2;
      const hh = height / 2;
      shape.moveTo(-hw + bevel, -hh);
      shape.lineTo(hw - bevel, -hh);
      shape.lineTo(hw, -hh + bevel);
      shape.lineTo(hw, hh - bevel);
      shape.lineTo(hw - bevel, hh);
      shape.lineTo(-hw + bevel, hh);
      shape.lineTo(-hw, hh - bevel);
      shape.lineTo(-hw, -hh + bevel);
      shape.closePath();
      const geometry = new THREE.ExtrudeGeometry(shape, {
        depth,
        bevelEnabled: true,
        bevelSegments: 2,
        bevelSize: bevel,
        bevelThickness: bevel,
        steps: 1,
      });
      geometry.translate(0, 0, -depth / 2);
      return geometry;
    };



    // Geometria CAD-like gerada em tempo de execução: perfis, dentes, pistas e fixadores
    // permanecem peças tridimensionais independentes para seleção, explosão e inspeção.
    const annularGeometry = (outerRadius: number, innerRadius: number, depth: number, segments = 64) => {
      const shape = new THREE.Shape();
      for (let i = 0; i <= segments; i += 1) {
        const a = (i / segments) * Math.PI * 2;
        const x = Math.cos(a) * outerRadius;
        const y = Math.sin(a) * outerRadius;
        if (i === 0) shape.moveTo(x, y);
        else shape.lineTo(x, y);
      }
      const hole = new THREE.Path();
      for (let i = segments; i >= 0; i -= 1) {
        const a = (i / segments) * Math.PI * 2;
        const x = Math.cos(a) * innerRadius;
        const y = Math.sin(a) * innerRadius;
        if (i === segments) hole.moveTo(x, y);
        else hole.lineTo(x, y);
      }
      shape.holes.push(hole);
      const geometry = new THREE.ExtrudeGeometry(shape, {
        depth,
        bevelEnabled: true,
        bevelSegments: 2,
        bevelSize: Math.min(0.035, depth * 0.18),
        bevelThickness: Math.min(0.035, depth * 0.18),
        curveSegments: 3,
      });
      geometry.translate(0, 0, -depth / 2);
      return geometry;
    };

    const toothGeometry = (angle: number, rootRadius: number, tipRadius: number, halfRoot: number, halfTip: number, depth: number) => {
      const point = (radius: number, a: number) => new THREE.Vector2(Math.cos(a) * radius, Math.sin(a) * radius);
      const shape = new THREE.Shape();
      const p1 = point(rootRadius, angle - halfRoot);
      const p2 = point(tipRadius, angle - halfTip);
      const p3 = point(tipRadius, angle + halfTip);
      const p4 = point(rootRadius, angle + halfRoot);
      shape.moveTo(p1.x, p1.y);
      shape.lineTo(p2.x, p2.y);
      shape.lineTo(p3.x, p3.y);
      shape.lineTo(p4.x, p4.y);
      shape.closePath();
      const geometry = new THREE.ExtrudeGeometry(shape, {
        depth,
        bevelEnabled: true,
        bevelSegments: 2,
        bevelSize: Math.min(0.025, depth * 0.18),
        bevelThickness: Math.min(0.025, depth * 0.18),
      });
      geometry.translate(0, 0, -depth / 2);
      return geometry;
    };

    const addGearTeeth = (group: THREE.Group, count: number, rootRadius: number, tipRadius: number, depth: number, material: THREE.Material, axis: "x" | "z" = "z", helical = false) => {
      const annulus = new THREE.Mesh(annularGeometry(rootRadius, rootRadius * 0.58, depth, Math.max(48, count * 2)), material);
      if (axis === "x") annulus.rotation.y = Math.PI / 2;
      group.add(annulus);
      const segments = helical ? 5 : 1;
      for (let toothIndex = 0; toothIndex < count; toothIndex += 1) {
        const baseAngle = (toothIndex / count) * Math.PI * 2;
        for (let segment = 0; segment < segments; segment += 1) {
          const t = segments === 1 ? 0.5 : segment / (segments - 1);
          const angle = baseAngle + (helical ? (t - 0.5) * 0.42 : 0);
          const tooth = new THREE.Mesh(
            toothGeometry(angle, rootRadius * 0.98, tipRadius, Math.PI / count * 0.44, Math.PI / count * 0.22, depth / segments * 1.02),
            material
          );
          if (helical) tooth.position.z = (t - 0.5) * depth;
          if (axis === "x") tooth.rotation.y = Math.PI / 2;
          group.add(tooth);
        }
      }
    };

    const addMachiningMarks = (group: THREE.Group, radius: number, axis: "x" | "z", material: THREE.Material, count = 3) => {
      for (let i = 0; i < count; i += 1) {
        const mark = new THREE.Mesh(new THREE.TorusGeometry(radius - i * 0.075, 0.012, 6, 48), material);
        if (axis === "x") mark.rotation.y = Math.PI / 2;
        else mark.rotation.x = Math.PI / 2;
        if (axis === "x") mark.position.x = (i - (count - 1) / 2) * 0.055;
        else mark.position.z = (i - (count - 1) / 2) * 0.055;
        group.add(mark);
      }
    };

    const addDetailedBearing = (group: THREE.Group, axis: "x" | "z", outerRadius: number, innerRadius: number, width: number, rollerCount: number, rollerMaterial: THREE.Material, cageMaterial: THREE.Material) => {
      const outer = new THREE.Mesh(annularGeometry(outerRadius, outerRadius * 0.78, width, 48), rollerMaterial);
      const inner = new THREE.Mesh(annularGeometry(innerRadius * 1.35, innerRadius, width * 0.82, 48), rollerMaterial);
      group.add(outer, inner);
      const raceMaterial = rollerMaterial.clone();
      if (raceMaterial instanceof THREE.MeshStandardMaterial) {
        raceMaterial.color = new THREE.Color(0xf4f7f8);
        raceMaterial.metalness = 1;
        raceMaterial.roughness = 0.1;
      }
      const raceA = new THREE.Mesh(new THREE.TorusGeometry((outerRadius + innerRadius) / 2, 0.045, 8, 48), raceMaterial);
      const raceB = raceA.clone();
      raceA.position.z = -width * 0.3;
      raceB.position.z = width * 0.3;
      group.add(raceA, raceB);
      const rollingRadius = (outerRadius + innerRadius) / 2;
      for (let i = 0; i < rollerCount; i += 1) {
        const angle = (i / rollerCount) * Math.PI * 2;
        const roller = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.052, width * 0.52, 12), rollerMaterial);
        roller.position.set(Math.cos(angle) * rollingRadius, Math.sin(angle) * rollingRadius, 0);
        roller.rotation.z = angle;
        group.add(roller);
        const separator = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.16, width * 0.58), cageMaterial);
        separator.position.set(Math.cos(angle) * rollingRadius, Math.sin(angle) * rollingRadius, 0);
        separator.rotation.z = angle;
        group.add(separator);
      }
      if (axis === "x") group.rotation.y = Math.PI / 2;
      else group.rotation.x = 0;
    };

    const addThreadedFastener = (group: THREE.Group, axis: "x" | "z", length: number, radius: number, threadCount = 5, withWasher = true) => {
      const shank = new THREE.Mesh(new THREE.CylinderGeometry(radius * 0.48, radius * 0.48, length, 16), fastenerMat);
      shank.rotation.x = Math.PI / 2;
      shank.position.z = length * 0.05;
      group.add(shank);
      const head = new THREE.Mesh(new THREE.CylinderGeometry(radius * 1.42, radius * 1.35, radius * 0.72, 6), fastenerMat);
      head.rotation.x = Math.PI / 2;
      head.position.z = length * 0.56;
      group.add(head);
      for (let i = 0; i < threadCount; i += 1) {
        const thread = new THREE.Mesh(new THREE.TorusGeometry(radius * 0.5, radius * 0.025, 6, 18), darkSteelMat);
        thread.rotation.x = Math.PI / 2;
        thread.position.z = -length * 0.38 + i * (length * 0.11);
        group.add(thread);
      }
      if (withWasher) {
        const washer = new THREE.Mesh(new THREE.RingGeometry(radius * 0.74, radius * 1.08, 6), gearHighlightMat);
        washer.position.z = length * 0.35;
        group.add(washer);
      }
      if (axis === "x") group.rotation.y = Math.PI / 2;
    };

    const addSplinePack = (group: THREE.Group, side: -1 | 1, length = 0.62, toothCount = 20) => {
      const body = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.27, length, 32), machinedSteelMat);
      body.rotation.z = Math.PI / 2;
      body.position.x = side * 2.15;
      group.add(body);
      for (let i = 0; i < toothCount; i += 1) {
        const angle = (i / toothCount) * Math.PI * 2;
        const tooth = new THREE.Mesh(new THREE.BoxGeometry(0.58, 0.042, 0.065), gearHighlightMat);
        tooth.position.set(side * 2.15, Math.cos(angle) * 0.255, Math.sin(angle) * 0.255);
        tooth.rotation.x = angle;
        group.add(tooth);
      }
      const transition = new THREE.Mesh(new THREE.TorusGeometry(0.26, 0.025, 8, 32), darkSteelMat);
      transition.rotation.y = Math.PI / 2;
      transition.position.x = side * 1.84;
      group.add(transition);
    };

    const compMap: ComponentMeshMap = {};

    const registerComp = (id: string, mountedPos: THREE.Vector3): THREE.Group => {
      const g = new THREE.Group();
      g.position.copy(mountedPos);
      g.userData = { id, mountedPos: mountedPos.clone() };
      rootAssembly.add(g);
      compMap[id] = g;
      return g;
    };

    // 1. CARCAÇA CENTRAL DO EIXO (Main Axle Housing)
    const grpMainHousing = registerComp("main_axle_housing", new THREE.Vector3(0, 0, 0));
    {
      const profile = [
        new THREE.Vector2(0, -0.92), new THREE.Vector2(0.86, -0.88), new THREE.Vector2(1.32, -0.62),
        new THREE.Vector2(1.55, -0.2), new THREE.Vector2(1.62, 0.18), new THREE.Vector2(1.48, 0.58),
        new THREE.Vector2(1.08, 0.86), new THREE.Vector2(0.56, 1.02), new THREE.Vector2(0, 1.06),
      ];
      const pumpkinGeom = new THREE.LatheGeometry(profile, 56);
      pumpkinGeom.rotateX(Math.PI / 2);
      const pumpkinMesh = new THREE.Mesh(pumpkinGeom, castIronMat);
      pumpkinMesh.castShadow = true;
      pumpkinMesh.receiveShadow = true;
      grpMainHousing.add(pumpkinMesh);
      const machinedFace = new THREE.Mesh(annularGeometry(1.48, 0.92, 0.16, 64), machinedSteelMat);
      machinedFace.position.z = -0.9;
      grpMainHousing.add(machinedFace);
      const rearFlange = new THREE.Mesh(new THREE.TorusGeometry(1.52, 0.11, 12, 64), machinedSteelMat);
      rearFlange.position.z = -0.94;
      grpMainHousing.add(rearFlange);
      for (let i = 0; i < 8; i += 1) {
        const a = (i / 8) * Math.PI * 2;
        const rib = new THREE.Mesh(beveledBox(0.16, 2.7, 0.28, 0.06), darkSteelMat);
        rib.position.set(Math.cos(a) * 0.44, Math.sin(a) * 1.12, 0.56);
        rib.rotation.z = a;
        grpMainHousing.add(rib);
      }
      [-1, 1].forEach((side) => {
        const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.64, 0.98, 1.05, 40), castIronMat);
        neck.rotation.z = Math.PI / 2;
        neck.position.x = side * 1.44;
        grpMainHousing.add(neck);
        const seat = new THREE.Mesh(annularGeometry(0.88, 0.62, 0.18, 48), machinedSteelMat);
        seat.rotation.y = Math.PI / 2;
        seat.position.x = side * 1.98;
        grpMainHousing.add(seat);
        const pad = new THREE.Mesh(beveledBox(0.78, 0.2, 0.62, 0.055), machinedSteelMat);
        pad.position.set(side * 1.1, 0.98, -0.05);
        grpMainHousing.add(pad);
      });
      addMachiningMarks(grpMainHousing, 1.18, "z", darkSteelMat, 2);
    }

    // 2. NARIZ DO PINHÃO    // 2. NARIZ DO PINHÃO (Pinion Nose Housing)
    const grpPinionNose = registerComp("pinion_nose_housing", new THREE.Vector3(0, 0, 0.95));
    {
      const noseGeom = new THREE.CylinderGeometry(0.76, 0.92, 1.35, 32);
      const nose = new THREE.Mesh(noseGeom, castIronMat);
      nose.rotation.x = Math.PI / 2;
      grpPinionNose.add(nose);

      const noseFlangeGeom = new THREE.CylinderGeometry(1.05, 1.05, 0.18, 32);
      const noseFlange = new THREE.Mesh(noseFlangeGeom, machinedSteelMat);
      noseFlange.rotation.x = Math.PI / 2;
      noseFlange.position.set(0, 0, -0.65);
      grpPinionNose.add(noseFlange);
    }

    // 3. TAMPA TRASEIRA (Housing Cover)
    const grpHousingCover = registerComp("housing_cover", new THREE.Vector3(0, 0, -0.85));
    {
      const coverDomeGeom = new THREE.SphereGeometry(1.48, 32, 16, 0, Math.PI * 2, 0, Math.PI * 0.45);
      const coverDome = new THREE.Mesh(coverDomeGeom, castIronMat);
      coverDome.rotation.x = -Math.PI / 2;
      grpHousingCover.add(coverDome);

      const coverRingGeom = new THREE.TorusGeometry(1.52, 0.12, 16, 32);
      const coverRing = new THREE.Mesh(coverRingGeom, machinedSteelMat);
      grpHousingCover.add(coverRing);

      const coverRelief = new THREE.Mesh(new THREE.CylinderGeometry(0.72, 0.84, 0.16, 32), castIronMat);
      coverRelief.rotation.x = Math.PI / 2;
      coverRelief.position.z = -0.12;
      grpHousingCover.add(coverRelief);
      for (let i = 0; i < 4; i++) {
        const angle = (i / 4) * Math.PI * 2 + Math.PI / 4;
        const brace = new THREE.Mesh(new THREE.BoxGeometry(0.13, 1.9, 0.1), darkSteelMat);
        brace.position.set(Math.cos(angle) * 0.42, Math.sin(angle) * 0.42, -0.18);
        brace.rotation.z = angle;
        grpHousingCover.add(brace);
      }

      const coverMachinedFace = new THREE.Mesh(new THREE.TorusGeometry(1.47, 0.055, 10, 40), machinedSteelMat);
      coverMachinedFace.position.z = -0.26;
      grpHousingCover.add(coverMachinedFace);
    }

    // 4. JUNTA DA TAMPA (Cover Gasket)
    const grpCoverGasket = registerComp("cover_gasket", new THREE.Vector3(0, 0, -0.78));
    {
      const gasketGeom = new THREE.RingGeometry(1.38, 1.62, 32);
      const gasket = new THREE.Mesh(gasketGeom, rubberMat);
      grpCoverGasket.add(gasket);
    }

    // 5. PARAFUSOS DA TAMPA (Cover Bolts)
    const grpCoverBolts = registerComp("cover_bolts", new THREE.Vector3(0, 0, -0.92));
    {
      const boltGeom = new THREE.CylinderGeometry(0.065, 0.065, 0.28, 6);
      for (let i = 0; i < 12; i++) {
        const ang = (i / 12) * Math.PI * 2;
        const b = new THREE.Mesh(boltGeom, fastenerMat);
        b.rotation.x = Math.PI / 2;
        b.position.set(Math.cos(ang) * 1.5, Math.sin(ang) * 1.5, 0);
        grpCoverBolts.add(b);
      }
    }

    // 6. RESPIRO DA CARCAÇA (Housing Breather)
    const grpBreather = registerComp("housing_breather", new THREE.Vector3(0.45, 1.72, 0));
    {
      const stemGeom = new THREE.CylinderGeometry(0.06, 0.08, 0.35, 12);
      const stem = new THREE.Mesh(stemGeom, fastenerMat);
      grpBreather.add(stem);

      const capGeom = new THREE.CylinderGeometry(0.18, 0.18, 0.14, 16);
      const cap = new THREE.Mesh(capGeom, machinedSteelMat);
      cap.position.y = 0.22;
      grpBreather.add(cap);
    }

    // 7. BUJÃO DE ABASTECIMENTO (Fill Plug)
    const grpFillPlug = registerComp("fill_plug", new THREE.Vector3(0.85, 0.25, -0.92));
    {
      const plugGeom = new THREE.CylinderGeometry(0.12, 0.12, 0.18, 6);
      const plug = new THREE.Mesh(plugGeom, machinedSteelMat);
      plug.rotation.x = Math.PI / 2;
      grpFillPlug.add(plug);
    }

    // 8. BUJÃO DE DRENAGEM (Drain Plug)
    const grpDrainPlug = registerComp("drain_plug", new THREE.Vector3(0, -1.74, 0));
    {
      const drainGeom = new THREE.CylinderGeometry(0.14, 0.14, 0.2, 6);
      const drain = new THREE.Mesh(drainGeom, machinedSteelMat);
      grpDrainPlug.add(drain);
    }

    // 9. TUBO ESQUERDO (Left Axle Tube)
    const grpLeftTube = registerComp("left_axle_tube", new THREE.Vector3(-3.25, 0, 0));
    {
      const tubeGeom = new THREE.CylinderGeometry(0.68, 0.68, 3.2, 28);
      const tube = new THREE.Mesh(tubeGeom, castIronMat);
      tube.rotation.z = Math.PI / 2;
      grpLeftTube.add(tube);

      const tipGeom = new THREE.CylinderGeometry(0.62, 0.62, 0.45, 28);
      const tip = new THREE.Mesh(tipGeom, machinedSteelMat);
      tip.rotation.z = Math.PI / 2;
      tip.position.x = -1.7;
      grpLeftTube.add(tip);
      const collar = new THREE.Mesh(new THREE.TorusGeometry(0.72, 0.1, 12, 32), fastenerMat);
      collar.rotation.y = Math.PI / 2;
      collar.position.x = -1.38;
      grpLeftTube.add(collar);
      const weldBead = new THREE.Mesh(new THREE.TorusGeometry(0.72, 0.045, 8, 32), darkSteelMat);
      weldBead.rotation.y = Math.PI / 2;
      weldBead.position.x = -1.62;
      grpLeftTube.add(weldBead);
      const mountPad = new THREE.Mesh(beveledBox(0.8, 0.18, 0.62, 0.05), castIronMat);
      mountPad.position.set(0.1, 0.72, 0);
      grpLeftTube.add(mountPad);
      const lowerPad = new THREE.Mesh(beveledBox(0.64, 0.14, 0.5, 0.04), castIronMat);
      lowerPad.position.set(0.1, -0.72, 0);
      grpLeftTube.add(lowerPad);
    }

    // 10. TUBO DIREITO (Right Axle Tube)
    const grpRightTube = registerComp("right_axle_tube", new THREE.Vector3(3.25, 0, 0));
    {
      const tubeGeom = new THREE.CylinderGeometry(0.68, 0.68, 3.2, 28);
      const tube = new THREE.Mesh(tubeGeom, castIronMat);
      tube.rotation.z = Math.PI / 2;
      grpRightTube.add(tube);

      const tipGeom = new THREE.CylinderGeometry(0.62, 0.62, 0.45, 28);
      const tip = new THREE.Mesh(tipGeom, machinedSteelMat);
      tip.rotation.z = Math.PI / 2;
      tip.position.x = 1.7;
      grpRightTube.add(tip);
      const collar = new THREE.Mesh(new THREE.TorusGeometry(0.72, 0.1, 12, 32), fastenerMat);
      collar.rotation.y = Math.PI / 2;
      collar.position.x = 1.38;
      grpRightTube.add(collar);
      const weldBead = new THREE.Mesh(new THREE.TorusGeometry(0.72, 0.045, 8, 32), darkSteelMat);
      weldBead.rotation.y = Math.PI / 2;
      weldBead.position.x = 1.62;
      grpRightTube.add(weldBead);
      const mountPad = new THREE.Mesh(beveledBox(0.8, 0.18, 0.62, 0.05), castIronMat);
      mountPad.position.set(-0.1, 0.72, 0);
      grpRightTube.add(mountPad);
      const lowerPad = new THREE.Mesh(beveledBox(0.64, 0.14, 0.5, 0.04), castIronMat);
      lowerPad.position.set(-0.1, -0.72, 0);
      grpRightTube.add(lowerPad);
    }

    // 11. SUPORTES DE SUSPENSÃO (Suspension Brackets)
    const grpSuspension = registerComp("suspension_brackets", new THREE.Vector3(0, 0.68, 0));
    {
      [-2.6, 2.6].forEach((xPos) => {
        const saddleGeom = new THREE.BoxGeometry(0.85, 0.45, 0.95);
        const saddle = new THREE.Mesh(saddleGeom, castIronMat);
        saddle.position.set(xPos, 0.15, 0);
        grpSuspension.add(saddle);

        for (let j = -0.3; j <= 0.3; j += 0.6) {
          const uboltGeom = new THREE.TorusGeometry(0.42, 0.055, 12, 24, Math.PI);
          const ubolt = new THREE.Mesh(uboltGeom, fastenerMat);
          ubolt.rotation.z = -Math.PI;
          ubolt.position.set(xPos + j, 0.45, 0);
          grpSuspension.add(ubolt);
        }
      });
    }

    // 12. SUPORTES DE AMORTECEDOR (Shock Brackets)
    const grpShock = registerComp("shock_brackets", new THREE.Vector3(0, -0.4, -0.72));
    {
      [-2.3, 2.3].forEach((xPos) => {
        const earGeom = new THREE.BoxGeometry(0.35, 0.55, 0.45);
        const ear = new THREE.Mesh(earGeom, castIronMat);
        ear.position.set(xPos, 0, 0);
        grpShock.add(ear);

        const pinGeom = new THREE.CylinderGeometry(0.08, 0.08, 0.52, 16);
        const pin = new THREE.Mesh(pinGeom, machinedSteelMat);
        pin.rotation.z = Math.PI / 2;
        pin.position.set(xPos, 0, 0.05);
        grpShock.add(pin);
      });
    }

    // 13. FLANGE DE ENTRADA DO CARDÃ (Input Flange)
    const grpInputFlange = registerComp("input_flange", new THREE.Vector3(0, 0, 1.88));
    {
      const hubGeom = new THREE.CylinderGeometry(0.55, 0.55, 0.45, 32);
      const hub = new THREE.Mesh(hubGeom, machinedSteelMat);
      hub.rotation.x = Math.PI / 2;
      grpInputFlange.add(hub);

      const diskGeom = new THREE.CylinderGeometry(0.92, 0.92, 0.18, 32);
      const disk = new THREE.Mesh(diskGeom, machinedSteelMat);
      disk.rotation.x = Math.PI / 2;
      disk.position.z = 0.22;
      grpInputFlange.add(disk);

      for (let i = 0; i < 4; i++) {
        const ang = (i / 4) * Math.PI * 2;
        const b = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.3, 6), fastenerMat);
        b.rotation.x = Math.PI / 2;
        b.position.set(Math.cos(ang) * 0.72, Math.sin(ang) * 0.72, 0.24);
        grpInputFlange.add(b);
      }

      // Garfo/yoke do cardã: duas orelhas e pinos de articulação visíveis.
      [-0.66, 0.66].forEach((y) => {
        const ear = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.22, 0.62), darkSteelMat);
        ear.position.set(0, y, 0.46);
        grpInputFlange.add(ear);
        const pivot = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.075, 0.34, 12), fastenerMat);
        pivot.rotation.y = Math.PI / 2;
        pivot.position.set(0, y, 0.7);
        grpInputFlange.add(pivot);
      });
    }

    // 14. RETENTOR DO PINHÃO (Pinion Seal)
    const grpPinionSeal = registerComp("pinion_seal", new THREE.Vector3(0, 0, 1.58));
    {
      const sealGeom = new THREE.RingGeometry(0.42, 0.68, 32);
      const seal = new THREE.Mesh(sealGeom, rubberMat);
      grpPinionSeal.add(seal);
    }

    // 15. ROLAMENTO DIANTEIRO DO PINHÃO (Front Pinion Bearing)
    const grpFrontBearing = registerComp("front_pinion_bearing", new THREE.Vector3(0, 0, 1.36));
    {
      addDetailedBearing(grpFrontBearing, "z", 0.62, 0.4, 0.34, 12, machinedSteelMat, darkSteelMat);
    }

    // 16. ESPAÇADOR    // 16. ESPAÇADOR / LUVA DE ESMAGAMENTO (Pinion Spacer)
    const grpSpacer = registerComp("pinion_spacer_or_crush_sleeve", new THREE.Vector3(0, 0, 1.05));
    {
      const sleeveGeom = new THREE.CylinderGeometry(0.42, 0.42, 0.45, 24);
      const sleeve = new THREE.Mesh(sleeveGeom, castIronMat);
      sleeve.rotation.x = Math.PI / 2;
      grpSpacer.add(sleeve);
    }

    // 17. ROLAMENTO TRASEIRO DO PINHÃO (Rear Pinion Bearing)
    const grpRearBearing = registerComp("rear_pinion_bearing", new THREE.Vector3(0, 0, 0.75));
    {
      addDetailedBearing(grpRearBearing, "z", 0.72, 0.48, 0.42, 14, machinedSteelMat, darkSteelMat);
    }

    // 18. PINHÃO DE ATAQUE (Drive Pinion)
    const grpDrivePinion = registerComp("drive_pinion", new THREE.Vector3(0, 0, 0.42));
    {
      const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.42, 2.15, 32), machinedSteelMat);
      shaft.rotation.x = Math.PI / 2;
      shaft.position.z = 0.58;
      grpDrivePinion.add(shaft);
      const shoulder = new THREE.Mesh(new THREE.CylinderGeometry(0.56, 0.64, 0.22, 32), darkSteelMat);
      shoulder.rotation.x = Math.PI / 2;
      shoulder.position.z = -0.18;
      grpDrivePinion.add(shoulder);
      addGearTeeth(grpDrivePinion, 11, 0.47, 0.72, 0.5, gearBronzeMat, "z", true);
      const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.32, 0.34, 28), machinedSteelMat);
      hub.rotation.x = Math.PI / 2;
      hub.position.z = -0.4;
      grpDrivePinion.add(hub);
      addMachiningMarks(grpDrivePinion, 0.52, "z", gearHighlightMat, 2);
    }

    // 19. COROA    // 19. COROA DE REDUÇÃO (Ring Gear)
    const grpRingGear = registerComp("ring_gear", new THREE.Vector3(-0.18, 0, 0.05));
    {
      addGearTeeth(grpRingGear, 37, 1.42, 1.62, 0.42, gearBronzeMat, "x", false);
      const face = new THREE.Mesh(annularGeometry(1.2, 0.72, 0.18, 64), gearHighlightMat);
      face.rotation.y = Math.PI / 2;
      face.position.x = -0.24;
      grpRingGear.add(face);
      const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.72, 0.86, 0.44, 48), darkSteelMat);
      hub.rotation.z = Math.PI / 2;
      hub.position.x = -0.34;
      grpRingGear.add(hub);
      for (let i = 0; i < 12; i += 1) {
        const a = (i / 12) * Math.PI * 2;
        const fastener = new THREE.Group();
        fastener.position.set(-0.48, Math.cos(a) * 0.92, Math.sin(a) * 0.92);
        addThreadedFastener(fastener, "x", 0.24, 0.06, 3, true);
        grpRingGear.add(fastener);
      }
      addMachiningMarks(grpRingGear, 1.27, "x", gearHighlightMat, 3);
    }

    // 20. CAIXA DO DIFERENCIAL    // 20. CAIXA DO DIFERENCIAL (Differential Carrier Case)
    const grpCarrier = registerComp("differential_carrier", new THREE.Vector3(0.18, 0, 0));
    {
      const carrierProfile = [new THREE.Vector2(0, -0.68), new THREE.Vector2(0.66, -0.66), new THREE.Vector2(0.94, -0.42), new THREE.Vector2(1.04, 0), new THREE.Vector2(0.94, 0.42), new THREE.Vector2(0.66, 0.66), new THREE.Vector2(0, 0.7)];
      const carrierGeom = new THREE.LatheGeometry(carrierProfile, 40);
      carrierGeom.rotateX(Math.PI / 2);
      const carrier = new THREE.Mesh(carrierGeom, castIronMat);
      grpCarrier.add(carrier);
      addMachiningMarks(grpCarrier, 0.9, "z", darkSteelMat, 2);

      const ringFlangeGeom = new THREE.CylinderGeometry(1.36, 1.36, 0.15, 32);
      const ringFlange = new THREE.Mesh(ringFlangeGeom, machinedSteelMat);
      ringFlange.rotation.z = Math.PI / 2;
      ringFlange.position.x = -0.35;
      grpCarrier.add(ringFlange);
      const carrierSeam = new THREE.Mesh(new THREE.TorusGeometry(0.86, 0.055, 8, 32), fastenerMat);
      carrierSeam.rotation.y = Math.PI / 2;
      carrierSeam.position.x = -0.02;
      grpCarrier.add(carrierSeam);

      const munLeftGeom = new THREE.CylinderGeometry(0.55, 0.55, 0.5, 24);
      const munLeft = new THREE.Mesh(munLeftGeom, machinedSteelMat);
      munLeft.rotation.z = Math.PI / 2;
      munLeft.position.x = -0.75;
      grpCarrier.add(munLeft);

      const munRight = new THREE.Mesh(munLeftGeom, machinedSteelMat);
      munRight.rotation.z = Math.PI / 2;
      munRight.position.x = 0.75;
      grpCarrier.add(munRight);
    }

    // 21. ROLAMENTO ESQUERDO DO DIFERENCIAL (Left Carrier Bearing)
    const grpLeftDiffBearing = registerComp("left_differential_bearing", new THREE.Vector3(-0.95, 0, 0));
    {
      addDetailedBearing(grpLeftDiffBearing, "x", 0.76, 0.5, 0.3, 12, machinedSteelMat, darkSteelMat);
    }

    // 22. ROLAMENTO DIREITO DO DIFERENCIAL (Right Carrier Bearing)
    const grpRightDiffBearing = registerComp("right_differential_bearing", new THREE.Vector3(0.95, 0, 0));
    {
      addDetailedBearing(grpRightDiffBearing, "x", 0.76, 0.5, 0.3, 12, machinedSteelMat, darkSteelMat);
    }

    // 23. CRUZETA    // 23. CRUZETA DO DIFERENCIAL (Spider Cross)
    const grpSpiderCross = registerComp("spider_cross", new THREE.Vector3(0.18, 0, 0));
    {
      const armVerticalGeom = new THREE.CylinderGeometry(0.14, 0.14, 1.4, 16);
      const armV = new THREE.Mesh(armVerticalGeom, machinedSteelMat);
      grpSpiderCross.add(armV);

      const armHorizGeom = new THREE.CylinderGeometry(0.14, 0.14, 1.4, 16);
      const armH = new THREE.Mesh(armHorizGeom, machinedSteelMat);
      armH.rotation.x = Math.PI / 2;
      grpSpiderCross.add(armH);
      const crossHub = new THREE.Mesh(new THREE.SphereGeometry(0.28, 20, 16), machinedSteelMat);
      grpSpiderCross.add(crossHub);
    }

    // Pinos da cruzeta, separados para inspeção individual.
    const grpSpiderPins = registerComp("spider_pins", new THREE.Vector3(0.18, 0, 0));
    {
      const pinGeom = new THREE.CylinderGeometry(0.08, 0.08, 1.55, 14);
      const pinVertical = new THREE.Mesh(pinGeom, darkSteelMat);
      grpSpiderPins.add(pinVertical);
      const pinHorizontal = new THREE.Mesh(pinGeom, darkSteelMat);
      pinHorizontal.rotation.x = Math.PI / 2;
      grpSpiderPins.add(pinHorizontal);
    }

    // 24. ENGRENAGENS SATÉLITES (Spider Gears)
    const grpSpiderGears = registerComp("spider_gears", new THREE.Vector3(0.18, 0, 0));
    {
      const positions = [
        { x: 0, y: 0.52, z: 0 }, { x: 0, y: -0.52, z: 0 },
        { x: 0, y: 0, z: 0.52 }, { x: 0, y: 0, z: -0.52 },
      ];
      positions.forEach((position, index) => {
        const gear = new THREE.Group();
        gear.position.set(position.x, position.y, position.z);
        if (index >= 2) gear.rotation.x = index === 2 ? -Math.PI / 2 : Math.PI / 2;
        addGearTeeth(gear, 12, 0.24, 0.36, 0.25, gearBronzeMat, "z", true);
        grpSpiderGears.add(gear);
      });
    }

    // 25. ENGRENAGENS PLANETÁRIAS    // 25. ENGRENAGENS PLANETÁRIAS LATERAIS (Side Gears)
    const grpSideGears = registerComp("side_gears", new THREE.Vector3(0.18, 0, 0));
    {
      [-0.46, 0.46].forEach((xOff, idx) => {
        const gear = new THREE.Group();
        gear.position.x = xOff;
        gear.rotation.z = idx === 0 ? -Math.PI / 2 : Math.PI / 2;
        addGearTeeth(gear, 16, 0.43, 0.56, 0.34, gearBronzeMat, "x", true);
        const spline = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.23, 0.48, 24), machinedSteelMat);
        spline.rotation.z = Math.PI / 2;
        spline.position.x = idx === 0 ? -0.18 : 0.18;
        gear.add(spline);
        grpSideGears.add(gear);
      });
    }

    // Arruelas de encosto    // Arruelas de encosto separadas das engrenagens para leitura de montagem.
    const grpThrustWashers = registerComp("thrust_washers", new THREE.Vector3(0.18, 0, 0));
    {
      [-0.52, 0.52].forEach((x) => {
        const washer = new THREE.Mesh(new THREE.TorusGeometry(0.38, 0.055, 10, 28), fastenerMat);
        washer.rotation.y = Math.PI / 2;
        washer.position.x = x;
        grpThrustWashers.add(washer);
      });
    }

    // 26. SEMIEIXO ESQUERDO (Left Axle Shaft)
    const grpLeftShaft = registerComp("left_axle_shaft", new THREE.Vector3(-3.25, 0, 0));
    {
      const shaftGeom = new THREE.CylinderGeometry(0.24, 0.24, 4.4, 24);
      const shaft = new THREE.Mesh(shaftGeom, machinedSteelMat);
      shaft.rotation.z = Math.PI / 2;
      grpLeftShaft.add(shaft);

      const flangeGeom = new THREE.CylinderGeometry(0.68, 0.68, 0.22, 24);
      const flange = new THREE.Mesh(flangeGeom, machinedSteelMat);
      flange.rotation.z = Math.PI / 2;
      flange.position.x = -2.25;
      grpLeftShaft.add(flange);

      const splinesGeom = new THREE.CylinderGeometry(0.23, 0.23, 0.45, 12);
      const splines = new THREE.Mesh(splinesGeom, machinedSteelMat);
      splines.rotation.z = Math.PI / 2;
      splines.position.x = 2.15;
      grpLeftShaft.add(splines);
    }

    const grpLeftSplines = registerComp("left_axle_splines", new THREE.Vector3(-3.25, 0, 0));
    {
      addSplinePack(grpLeftSplines, -1, 0.62, 20);
    }

    // 27. SEMIEIXO DIREITO    // 27. SEMIEIXO DIREITO (Right Axle Shaft)
    const grpRightShaft = registerComp("right_axle_shaft", new THREE.Vector3(3.25, 0, 0));
    {
      const shaftGeom = new THREE.CylinderGeometry(0.24, 0.24, 4.4, 24);
      const shaft = new THREE.Mesh(shaftGeom, machinedSteelMat);
      shaft.rotation.z = Math.PI / 2;
      grpRightShaft.add(shaft);

      const flangeGeom = new THREE.CylinderGeometry(0.68, 0.68, 0.22, 24);
      const flange = new THREE.Mesh(flangeGeom, machinedSteelMat);
      flange.rotation.z = Math.PI / 2;
      flange.position.x = 2.25;
      grpRightShaft.add(flange);

      const splinesGeom = new THREE.CylinderGeometry(0.23, 0.23, 0.45, 12);
      const splines = new THREE.Mesh(splinesGeom, machinedSteelMat);
      splines.rotation.z = Math.PI / 2;
      splines.position.x = -2.15;
      grpRightShaft.add(splines);
    }

    const grpRightSplines = registerComp("right_axle_splines", new THREE.Vector3(3.25, 0, 0));
    {
      addSplinePack(grpRightSplines, 1, 0.62, 20);
    }

    // 28. CUBO DE RODA ESQUERDO    // 28. CUBO DE RODA ESQUERDO (Left Wheel Hub)
    const grpLeftHub = registerComp("left_wheel_hub", new THREE.Vector3(-5.35, 0, 0));
    {
      const hubGeom = new THREE.CylinderGeometry(0.85, 0.85, 0.95, 32);
      const hub = new THREE.Mesh(hubGeom, castIronMat);
      hub.rotation.z = Math.PI / 2;
      grpLeftHub.add(hub);

      const flangeGeom = new THREE.CylinderGeometry(1.65, 1.65, 0.24, 36);
      const flange = new THREE.Mesh(flangeGeom, machinedSteelMat);
      flange.rotation.z = Math.PI / 2;
      flange.position.x = -0.15;
      grpLeftHub.add(flange);
      const hubCap = new THREE.Mesh(new THREE.CylinderGeometry(0.62, 0.72, 0.18, 32), darkSteelMat);
      hubCap.rotation.z = Math.PI / 2;
      hubCap.position.x = -0.58;
      grpLeftHub.add(hubCap);
      const outerStep = new THREE.Mesh(new THREE.TorusGeometry(1.42, 0.09, 12, 36), machinedSteelMat);
      outerStep.rotation.y = Math.PI / 2;
      outerStep.position.x = -0.16;
      grpLeftHub.add(outerStep);
      const innerStep = new THREE.Mesh(new THREE.TorusGeometry(0.78, 0.065, 10, 32), fastenerMat);
      innerStep.rotation.y = Math.PI / 2;
      innerStep.position.x = -0.48;
      grpLeftHub.add(innerStep);
    }

    // 29. CUBO DE RODA DIREITO (Right Wheel Hub)
    const grpRightHub = registerComp("right_wheel_hub", new THREE.Vector3(5.35, 0, 0));
    {
      const hubGeom = new THREE.CylinderGeometry(0.85, 0.85, 0.95, 32);
      const hub = new THREE.Mesh(hubGeom, castIronMat);
      hub.rotation.z = Math.PI / 2;
      grpRightHub.add(hub);

      const flangeGeom = new THREE.CylinderGeometry(1.65, 1.65, 0.24, 36);
      const flange = new THREE.Mesh(flangeGeom, machinedSteelMat);
      flange.rotation.z = Math.PI / 2;
      flange.position.x = 0.15;
      grpRightHub.add(flange);
      const hubCap = new THREE.Mesh(new THREE.CylinderGeometry(0.62, 0.72, 0.18, 32), darkSteelMat);
      hubCap.rotation.z = Math.PI / 2;
      hubCap.position.x = 0.58;
      grpRightHub.add(hubCap);
      const outerStep = new THREE.Mesh(new THREE.TorusGeometry(1.42, 0.09, 12, 36), machinedSteelMat);
      outerStep.rotation.y = Math.PI / 2;
      outerStep.position.x = 0.16;
      grpRightHub.add(outerStep);
      const innerStep = new THREE.Mesh(new THREE.TorusGeometry(0.78, 0.065, 10, 32), fastenerMat);
      innerStep.rotation.y = Math.PI / 2;
      innerStep.position.x = 0.48;
      grpRightHub.add(innerStep);
    }

    const grpLeftHubBearings = registerComp("left_hub_bearings", new THREE.Vector3(-5.35, 0, 0));
    {
      [-0.32, 0.28].forEach((x) => {
        const bearing = new THREE.Mesh(new THREE.TorusGeometry(0.64, 0.1, 12, 32), machinedSteelMat);
        bearing.rotation.y = Math.PI / 2;
        bearing.position.x = x;
        grpLeftHubBearings.add(bearing);
      });
    }

    const grpRightHubBearings = registerComp("right_hub_bearings", new THREE.Vector3(5.35, 0, 0));
    {
      [0.32, -0.28].forEach((x) => {
        const bearing = new THREE.Mesh(new THREE.TorusGeometry(0.64, 0.1, 12, 32), machinedSteelMat);
        bearing.rotation.y = Math.PI / 2;
        bearing.position.x = x;
        grpRightHubBearings.add(bearing);
      });
    }

    const grpLeftHubSeal = registerComp("left_hub_seal", new THREE.Vector3(-5.35, 0, 0));
    {
      const seal = new THREE.Mesh(new THREE.TorusGeometry(0.56, 0.09, 12, 32), rubberMat);
      seal.rotation.y = Math.PI / 2;
      seal.position.x = -0.58;
      grpLeftHubSeal.add(seal);
    }

    const grpRightHubSeal = registerComp("right_hub_seal", new THREE.Vector3(5.35, 0, 0));
    {
      const seal = new THREE.Mesh(new THREE.TorusGeometry(0.56, 0.09, 12, 32), rubberMat);
      seal.rotation.y = Math.PI / 2;
      seal.position.x = 0.58;
      grpRightHubSeal.add(seal);
    }

    // 30. PRISIONEIROS DE RODA (Wheel Studs & Nuts)
    const grpWheelStuds = registerComp("wheel_studs", new THREE.Vector3(0, 0, 0));
    {
      [-5.5, 5.5].forEach((xCenter) => {
        for (let i = 0; i < 10; i += 1) {
          const angle = (i / 10) * Math.PI * 2;
          const fastener = new THREE.Group();
          fastener.position.set(xCenter + (xCenter < 0 ? -0.32 : 0.32), Math.cos(angle) * 1.35, Math.sin(angle) * 1.35);
          addThreadedFastener(fastener, "x", 0.5, 0.095, 5, true);
          grpWheelStuds.add(fastener);
        }
      });
    }

    // 31. CONJUNTO DE FREIO ESQUERDO    // 31. CONJUNTO DE FREIO ESQUERDO (Left Brake Assembly)
    const grpLeftBrake = registerComp("left_brake_assembly", new THREE.Vector3(-4.65, 0, 0));
    {
      const drumGeom = new THREE.CylinderGeometry(1.68, 1.68, 0.85, 32, 1, true);
      const drum = new THREE.Mesh(drumGeom, brakeMat);
      drum.rotation.z = Math.PI / 2;
      grpLeftBrake.add(drum);

      const plateGeom = new THREE.CylinderGeometry(1.62, 1.62, 0.12, 32);
      const plate = new THREE.Mesh(plateGeom, castIronMat);
      plate.rotation.z = Math.PI / 2;
      plate.position.x = 0.42;
      grpLeftBrake.add(plate);
      const cam = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.8, 14), darkSteelMat);
      cam.rotation.z = Math.PI / 2;
      cam.position.set(0.18, 0, 0.18);
      grpLeftBrake.add(cam);
    }

    // 32. CONJUNTO DE FREIO DIREITO (Right Brake Assembly)
    const grpRightBrake = registerComp("right_brake_assembly", new THREE.Vector3(4.65, 0, 0));
    {
      const drumGeom = new THREE.CylinderGeometry(1.68, 1.68, 0.85, 32, 1, true);
      const drum = new THREE.Mesh(drumGeom, brakeMat);
      drum.rotation.z = Math.PI / 2;
      grpRightBrake.add(drum);

      const plateGeom = new THREE.CylinderGeometry(1.62, 1.62, 0.12, 32);
      const plate = new THREE.Mesh(plateGeom, castIronMat);
      plate.rotation.z = Math.PI / 2;
      plate.position.x = -0.42;
      grpRightBrake.add(plate);
      const cam = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.8, 14), darkSteelMat);
      cam.rotation.z = Math.PI / 2;
      cam.position.set(-0.18, 0, 0.18);
      grpRightBrake.add(cam);
    }

    // 33. CÂMARA DE FREIO ESQUERDA (Left Brake Chamber)
    const grpLeftChamber = registerComp("left_brake_chamber", new THREE.Vector3(-4.4, -0.65, -0.85));
    {
      const chamberGeom = new THREE.CylinderGeometry(0.48, 0.48, 0.72, 24);
      const chamber = new THREE.Mesh(chamberGeom, castIronMat);
      chamber.rotation.x = Math.PI / 2;
      grpLeftChamber.add(chamber);

      const rodGeom = new THREE.CylinderGeometry(0.08, 0.08, 0.65, 12);
      const rod = new THREE.Mesh(rodGeom, machinedSteelMat);
      rod.position.set(0, 0.35, 0.2);
      grpLeftChamber.add(rod);
    }

    // 34. CÂMARA DE FREIO DIREITA (Right Brake Chamber)
    const grpRightChamber = registerComp("right_brake_chamber", new THREE.Vector3(4.4, -0.65, -0.85));
    {
      const chamberGeom = new THREE.CylinderGeometry(0.48, 0.48, 0.72, 24);
      const chamber = new THREE.Mesh(chamberGeom, castIronMat);
      chamber.rotation.x = Math.PI / 2;
      grpRightChamber.add(chamber);

      const rodGeom = new THREE.CylinderGeometry(0.08, 0.08, 0.65, 12);
      const rod = new THREE.Mesh(rodGeom, machinedSteelMat);
      rod.position.set(0, 0.35, 0.2);
      grpRightChamber.add(rod);
    }

    const grpLeftBrakeShoes = registerComp("left_brake_shoes", new THREE.Vector3(-4.65, 0, 0));
    {
      [-0.42, 0.42].forEach((x) => {
        const shoe = new THREE.Mesh(new THREE.TorusGeometry(1.15, 0.13, 12, 28, Math.PI * 0.72), brakeLiningMat);
        shoe.rotation.y = Math.PI / 2;
        shoe.position.set(x, 0, 0.18);
        grpLeftBrakeShoes.add(shoe);
      });
      const anchor = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 1.3, 12), darkSteelMat);
      anchor.rotation.z = Math.PI / 2;
      grpLeftBrakeShoes.add(anchor);
    }

    const grpRightBrakeShoes = registerComp("right_brake_shoes", new THREE.Vector3(4.65, 0, 0));
    {
      [-0.42, 0.42].forEach((x) => {
        const shoe = new THREE.Mesh(new THREE.TorusGeometry(1.15, 0.13, 12, 28, Math.PI * 0.72), brakeLiningMat);
        shoe.rotation.y = Math.PI / 2;
        shoe.position.set(x, 0, 0.18);
        grpRightBrakeShoes.add(shoe);
      });
      const anchor = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 1.3, 12), darkSteelMat);
      anchor.rotation.z = Math.PI / 2;
      grpRightBrakeShoes.add(anchor);
    }

    const grpLeftBrakeSprings = registerComp("left_brake_springs", new THREE.Vector3(-4.65, 0, 0));
    {
      [-0.34, 0.34].forEach((y) => {
        const spring = new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.035, 8, 18), fastenerMat);
        spring.rotation.y = Math.PI / 2;
        spring.position.set(-0.05, y, 0.45);
        grpLeftBrakeSprings.add(spring);
      });
    }

    const grpRightBrakeSprings = registerComp("right_brake_springs", new THREE.Vector3(4.65, 0, 0));
    {
      [-0.34, 0.34].forEach((y) => {
        const spring = new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.035, 8, 18), fastenerMat);
        spring.rotation.y = Math.PI / 2;
        spring.position.set(0.05, y, 0.45);
        grpRightBrakeSprings.add(spring);
      });
    }

    // 35. BLOQUEIO DO DIFERENCIAL DCDL (DCDL Actuator)
    const grpDCDL = registerComp("dcdl_actuator", new THREE.Vector3(0.95, 1.15, 0.25));
    {
      const cylGeom = new THREE.CylinderGeometry(0.24, 0.24, 0.52, 20);
      const cyl = new THREE.Mesh(cylGeom, machinedSteelMat);
      cyl.rotation.z = Math.PI / 2;
      grpDCDL.add(cyl);

      const airFittingGeom = new THREE.CylinderGeometry(0.06, 0.06, 0.2, 8);
      const airFitting = new THREE.Mesh(airFittingGeom, fastenerMat);
      airFitting.position.set(0, 0.28, 0);
      grpDCDL.add(airFitting);
    }

    const grpDCDLFork = registerComp("dcdl_fork", new THREE.Vector3(0.95, 1.15, 0.25));
    {
      const fork = new THREE.Mesh(new THREE.TorusGeometry(0.26, 0.055, 10, 20, Math.PI), fastenerMat);
      fork.rotation.y = Math.PI / 2;
      fork.position.x = 0.28;
      grpDCDLFork.add(fork);
    }

    const grpDCDLCollar = registerComp("dcdl_collar", new THREE.Vector3(0.95, 1.15, 0.25));
    {
      const collar = new THREE.Mesh(new THREE.TorusGeometry(0.32, 0.08, 10, 24), gearHighlightMat);
      collar.rotation.y = Math.PI / 2;
      collar.position.x = 0.45;
      grpDCDLCollar.add(collar);
    }

    // 36. SENSOR ABS E ANEL (ABS Sensor)
    const grpABS = registerComp("left_abs_sensor", new THREE.Vector3(-4.95, 0.85, 0));
    {
      const toneRingGeom = new THREE.TorusGeometry(0.72, 0.06, 8, 36);
      const toneRing = new THREE.Mesh(toneRingGeom, machinedSteelMat);
      toneRing.rotation.y = Math.PI / 2;
      grpABS.add(toneRing);

      const probeGeom = new THREE.BoxGeometry(0.12, 0.22, 0.12);
      const probe = new THREE.Mesh(probeGeom, rubberMat);
      probe.position.set(0, 0.76, 0);
      grpABS.add(probe);
    }

    // Contornos de leitura: uma linha econômica por grupo, ativada no X-ray/Section.
    Object.values(compMap).forEach((group) => {
      const meshes: THREE.Mesh[] = [];
      group.traverse((object) => {
        if (object instanceof THREE.Mesh && !object.userData.isOutline) meshes.push(object);
      });
      meshes.slice(0, 4).forEach((mesh) => {
        const outline = new THREE.LineSegments(
          new THREE.EdgesGeometry(mesh.geometry, 28),
          new THREE.LineBasicMaterial({ color: 0x69c8ef, transparent: true, opacity: 0.62 })
        );
        outline.userData.isOutline = true;
        outline.visible = false;
        outline.renderOrder = 5;
        outline.scale.setScalar(1.012);
        mesh.add(outline);
      });
    });

    const grpPinionShims = registerComp("pinion_shims", new THREE.Vector3(0, 0, 1.16));
    {
      [0.95, 1.1, 1.25].forEach((z) => {
        const shim = new THREE.Mesh(new THREE.RingGeometry(0.44, 0.62, 28), fastenerMat);
        shim.position.z = z - 1.16;
        grpPinionShims.add(shim);
      });
    }

    const grpCarrierCaps = registerComp("carrier_caps", new THREE.Vector3(0, 0, 0));
    {
      [-0.98, 0.98].forEach((x) => {
        const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.68, 0.78, 0.18, 24), castIronMat);
        cap.rotation.z = Math.PI / 2;
        cap.position.x = x;
        grpCarrierCaps.add(cap);
      });
    }

    const grpAdjustmentRings = registerComp("carrier_adjustment_rings", new THREE.Vector3(0, 0, 0));
    {
      [-1.08, 1.08].forEach((x) => {
        const ring = new THREE.Mesh(new THREE.TorusGeometry(0.55, 0.07, 10, 28), gearHighlightMat);
        ring.rotation.y = Math.PI / 2;
        ring.position.x = x;
        grpAdjustmentRings.add(ring);
      });
    }

    groupMapRef.current = compMap;
    Object.values(compMap).forEach((group) => {
      group.userData.componentDefinition = MS120_CATALOG.find((item) => item.id === group.userData.id);
    });

    const assemblyBounds = new THREE.Box3().setFromObject(rootAssembly);
    const assemblyCenter = assemblyBounds.getCenter(new THREE.Vector3());
    const assemblySize = assemblyBounds.getSize(new THREE.Vector3());
    const verticalFov = THREE.MathUtils.degToRad(camera.fov);
    const horizontalFov = 2 * Math.atan(Math.tan(verticalFov / 2) * camera.aspect);
    const fitVertical = assemblySize.y / (2 * Math.tan(verticalFov / 2));
    const fitHorizontal = assemblySize.x / (2 * Math.tan(horizontalFov / 2));
    const fitDistance = Math.max(fitVertical, fitHorizontal, assemblySize.z * 1.7) * 1.24;
    initialCameraTargetRef.current.copy(assemblyCenter);
    initialCameraDistanceRef.current = Math.min(22, Math.max(11.5, fitDistance));
    cameraTargetRef.current.copy(assemblyCenter);
    cameraDistanceRef.current = initialCameraDistanceRef.current;

    // Attach raycasting click handler
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const handleCanvasClick = (event: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(rootAssembly.children, true);

      if (intersects.length > 0) {
        let current: THREE.Object3D | null = intersects[0].object;
        while (current && current.parent && current.parent !== rootAssembly) {
          current = current.parent;
        }
        if (current && current.userData?.id) {
          selectComponent(current.userData.id, true);
        }
      }
    };

    canvas.addEventListener("click", handleCanvasClick);

    // Mouse Controls (Orbit & Pan)
    const onMouseDown = (e: MouseEvent) => {
      if (autoRotateRef.current) {
        autoRotateRef.current = false;
        setAutoRotate(false);
      }
      if (e.button === 0) isDraggingRef.current = true;
      if (e.button === 2) isRightDraggingRef.current = true;
      previousMousePositionRef.current = { x: e.clientX, y: e.clientY };
    };

    const onMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - previousMousePositionRef.current.x;
      const deltaY = e.clientY - previousMousePositionRef.current.y;

      if (isDraggingRef.current) {
        cameraPolarRef.current.theta -= deltaX * 0.007;
        cameraPolarRef.current.phi = Math.max(
          0.05,
          Math.min(Math.PI - 0.05, cameraPolarRef.current.phi - deltaY * 0.007)
        );
      } else if (isRightDraggingRef.current) {
        const factor = 0.012;
        cameraTargetRef.current.x -= deltaX * factor;
        cameraTargetRef.current.y += deltaY * factor;
      }

      previousMousePositionRef.current = { x: e.clientX, y: e.clientY };
    };

    const onMouseUp = () => {
      isDraggingRef.current = false;
      isRightDraggingRef.current = false;
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      cameraDistanceRef.current = Math.max(
        4,
        Math.min(25, cameraDistanceRef.current + e.deltaY * 0.012)
      );
    };

    const onContextMenu = (e: MouseEvent) => e.preventDefault();

    let previousTouchDistance = 0;
    let previousTouchMidpoint = { x: 0, y: 0 };
    const getTouchPoint = (touch: Touch) => ({ x: touch.clientX, y: touch.clientY });
    const getTouchDistance = (a: Touch, b: Touch) => Math.hypot(b.clientX - a.clientX, b.clientY - a.clientY);
    const getTouchMidpoint = (a: Touch, b: Touch) => ({
      x: (a.clientX + b.clientX) / 2,
      y: (a.clientY + b.clientY) / 2,
    });

    const onTouchStart = (e: TouchEvent) => {
      if (autoRotateRef.current) {
        autoRotateRef.current = false;
        setAutoRotate(false);
      }
      if (e.touches.length === 1) {
        isDraggingRef.current = true;
        previousMousePositionRef.current = getTouchPoint(e.touches[0]);
      } else if (e.touches.length >= 2) {
        isDraggingRef.current = false;
        previousTouchDistance = getTouchDistance(e.touches[0], e.touches[1]);
        previousTouchMidpoint = getTouchMidpoint(e.touches[0], e.touches[1]);
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      if (e.touches.length === 1 && isDraggingRef.current) {
        const point = getTouchPoint(e.touches[0]);
        const deltaX = point.x - previousMousePositionRef.current.x;
        const deltaY = point.y - previousMousePositionRef.current.y;
        cameraPolarRef.current.theta -= deltaX * 0.009;
        cameraPolarRef.current.phi = Math.max(
          0.05,
          Math.min(Math.PI - 0.05, cameraPolarRef.current.phi - deltaY * 0.009)
        );
        previousMousePositionRef.current = point;
      } else if (e.touches.length >= 2) {
        const distance = getTouchDistance(e.touches[0], e.touches[1]);
        const midpoint = getTouchMidpoint(e.touches[0], e.touches[1]);
        if (previousTouchDistance > 0) {
          cameraDistanceRef.current = Math.max(
            4,
            Math.min(25, cameraDistanceRef.current - (distance - previousTouchDistance) * 0.025)
          );
        }
        cameraTargetRef.current.x -= (midpoint.x - previousTouchMidpoint.x) * 0.012;
        cameraTargetRef.current.y += (midpoint.y - previousTouchMidpoint.y) * 0.012;
        previousTouchDistance = distance;
        previousTouchMidpoint = midpoint;
      }
    };

    const onTouchEnd = () => {
      isDraggingRef.current = false;
      previousTouchDistance = 0;
    };

    canvas.addEventListener("mousedown", onMouseDown);
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    canvas.addEventListener("wheel", onWheel, { passive: false });
    canvas.addEventListener("contextmenu", onContextMenu);
    canvas.addEventListener("touchstart", onTouchStart, { passive: false });
    canvas.addEventListener("touchmove", onTouchMove, { passive: false });
    canvas.addEventListener("touchend", onTouchEnd);
    canvas.addEventListener("touchcancel", onTouchEnd);

    // Render loop
    const render = () => {
      animationFrameIdRef.current = requestAnimationFrame(render);

      const { theta, phi } = cameraPolarRef.current;
      const dist = cameraDistanceRef.current;
      const target = cameraTargetRef.current;

      // A desmontagem percorre os estágios em aproximadamente 1–2 segundos,
      // preservando o alinhamento mecânico em vez de teleportar as peças.
      Object.values(compMap).forEach((group) => {
        const explodeTarget = group.userData.explodeTarget as THREE.Vector3 | undefined;
        if (explodeTarget) {
          if (reducedMotionRef.current) group.position.copy(explodeTarget);
          else group.position.lerp(explodeTarget, 0.075);
        }
      });

      if (autoRotateRef.current && !reducedMotionRef.current) {
        cameraPolarRef.current.theta += 0.0025 * animationSpeedRef.current;
      }

      camera.position.x = target.x + dist * Math.sin(phi) * Math.sin(theta);
      camera.position.y = target.y + dist * Math.cos(phi);
      camera.position.z = target.z + dist * Math.sin(phi) * Math.cos(theta);
      camera.lookAt(target);

      // Running mode animation
      if ((modeRef.current === "running" || modeRef.current === "curve") && !motionPausedRef.current) {
        const isCurve = modeRef.current === "curve";
        rotationAngleRef.current += 0.04 * animationSpeedRef.current;
        const ang = rotationAngleRef.current;

        // Pinhão e flange giram em torno do eixo de entrada Z com relação de redução (approx 3.91:1)
        if (compMap["drive_pinion"]) compMap["drive_pinion"].rotation.z = ang * 3.5;
        if (compMap["input_flange"]) compMap["input_flange"].rotation.z = ang * 3.5;
        if (compMap["front_pinion_bearing"]) compMap["front_pinion_bearing"].rotation.z = ang * 3.5;
        if (compMap["rear_pinion_bearing"]) compMap["rear_pinion_bearing"].rotation.z = ang * 3.5;

        // Coroa e caixa do diferencial giram no eixo transversal perpendicular X
        if (compMap["ring_gear"]) compMap["ring_gear"].rotation.x = ang;
        if (compMap["differential_carrier"]) compMap["differential_carrier"].rotation.x = ang;
        if (compMap["spider_cross"]) compMap["spider_cross"].rotation.x = ang;
        if (compMap["spider_pins"]) compMap["spider_pins"].rotation.x = ang;
        if (compMap["left_differential_bearing"]) compMap["left_differential_bearing"].rotation.x = ang;
        if (compMap["right_differential_bearing"]) compMap["right_differential_bearing"].rotation.x = ang;

        // No modo curva, semieixo externo gira mais rápido e satélites giram em torno de seus próprios eixos
        const leftSpeed = isCurve ? 0.65 : 1.0;
        const rightSpeed = isCurve ? 1.35 : 1.0;
        const relativeDiff = rightSpeed - leftSpeed;

        if (compMap["spider_gears"]) {
          compMap["spider_gears"].rotation.x = ang;
          compMap["spider_gears"].rotation.y = isCurve ? ang * relativeDiff * 2.2 : 0;
        }
        if (compMap["side_gears"]) compMap["side_gears"].rotation.x = ang;

        if (compMap["left_axle_shaft"]) compMap["left_axle_shaft"].rotation.x = ang * leftSpeed;
        if (compMap["right_axle_shaft"]) compMap["right_axle_shaft"].rotation.x = ang * rightSpeed;
        if (compMap["left_axle_splines"]) compMap["left_axle_splines"].rotation.x = ang * leftSpeed;
        if (compMap["right_axle_splines"]) compMap["right_axle_splines"].rotation.x = ang * rightSpeed;
        if (compMap["left_wheel_hub"]) compMap["left_wheel_hub"].rotation.x = ang * leftSpeed;
        if (compMap["right_wheel_hub"]) compMap["right_wheel_hub"].rotation.x = ang * rightSpeed;
        if (compMap["left_hub_bearings"]) compMap["left_hub_bearings"].rotation.x = ang * leftSpeed;
        if (compMap["right_hub_bearings"]) compMap["right_hub_bearings"].rotation.x = ang * rightSpeed;
        if (compMap["left_hub_seal"]) compMap["left_hub_seal"].rotation.x = ang * leftSpeed;
        if (compMap["right_hub_seal"]) compMap["right_hub_seal"].rotation.x = ang * rightSpeed;
        if (compMap["left_brake_assembly"]) compMap["left_brake_assembly"].rotation.x = ang * leftSpeed;
        if (compMap["right_brake_assembly"]) compMap["right_brake_assembly"].rotation.x = ang * rightSpeed;
        if (compMap["wheel_studs"]) compMap["wheel_studs"].rotation.x = ang;
      }

      renderer.render(scene, camera);
    };

    render();

    // Resize observer
    const resizeObserver = new ResizeObserver(() => {
      if (!container || !renderer || !camera) return;
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    });
    resizeObserver.observe(container);

    return () => {
      if (animationFrameIdRef.current) cancelAnimationFrame(animationFrameIdRef.current);
      resizeObserver.disconnect();
      canvas.removeEventListener("click", handleCanvasClick);
      canvas.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
      canvas.removeEventListener("wheel", onWheel);
      canvas.removeEventListener("contextmenu", onContextMenu);
      canvas.removeEventListener("touchstart", onTouchStart);
      canvas.removeEventListener("touchmove", onTouchMove);
      canvas.removeEventListener("touchend", onTouchEnd);
      canvas.removeEventListener("touchcancel", onTouchEnd);
      rootAssembly.traverse((object) => {
        if (object instanceof THREE.Mesh) {
          object.geometry.dispose();
          const material = object.material;
          if (Array.isArray(material)) material.forEach((item) => item.dispose());
          else material.dispose();
        }
      });
      materials.forEach((material) => material.dispose());
      renderer.dispose();
      renderer.forceContextLoss();
    };
  }, []);

  // Handle Explode Depth Changes
  useEffect(() => {
    applyExplodeTransformations(explodeDepth);
  }, [explodeDepth, applyExplodeTransformations]);

  // Mostra ou oculta o miolo mecânico sem destruir a montagem; X-Ray sempre força a leitura interna.
  useEffect(() => {
    const map = groupMapRef.current;
    if (!Object.keys(map).length) return;
    MS120_CATALOG.forEach((component) => {
      const group = map[component.id];
      if (!group) return;
      group.visible = showComponents || component.category !== "internal" || viewMode === "xray" || viewMode === "section";
    });
  }, [showComponents, viewMode]);

  // Handle View Mode Materials with per-mesh clones so X-ray does not flatten every material.
  useEffect(() => {
    const root = rootAssemblyRef.current;
    if (!root) return;
    const externalIds = new Set([
      "main_axle_housing", "pinion_nose_housing", "housing_cover",
      "left_axle_tube", "right_axle_tube", "left_wheel_hub", "right_wheel_hub",
      "left_brake_assembly", "right_brake_assembly", "left_brake_chamber", "right_brake_chamber"
    ]);
    root.children.forEach((group) => {
      const isExternal = externalIds.has(String(group.userData.id));
      group.traverse((obj) => {
        if (!(obj instanceof THREE.Mesh)) return;
        const mesh = obj as THREE.Mesh;
        const current = mesh.material as THREE.MeshStandardMaterial;
        if (!mesh.userData.solidMaterial) mesh.userData.solidMaterial = current;
        const base = mesh.userData.solidMaterial as THREE.MeshStandardMaterial;
        const oldModeMaterial = mesh.userData.modeMaterial as THREE.Material | undefined;
        if (oldModeMaterial && oldModeMaterial !== base) oldModeMaterial.dispose();

        if (viewMode === "solid" || viewMode === "section") {
          mesh.material = base;
          base.wireframe = false;
          base.opacity = 1;
          base.transparent = false;
          base.depthWrite = true;
          mesh.userData.modeMaterial = base;
        } else if (viewMode === "wireframe") {
          const wire = base.clone() as THREE.MeshStandardMaterial;
          wire.wireframe = true;
          wire.opacity = 0.9;
          wire.transparent = true;
          wire.depthWrite = true;
          mesh.material = wire;
          mesh.userData.modeMaterial = wire;
        } else {
          const xray = base.clone() as THREE.MeshStandardMaterial;
          xray.wireframe = false;
          xray.opacity = isExternal ? 0.14 : 0.94;
          xray.transparent = true;
          xray.depthWrite = !isExternal;
          xray.emissive = isExternal ? new THREE.Color(0x0b1016) : new THREE.Color(0x173c56);
          xray.emissiveIntensity = isExternal ? 0.05 : 0.35;
          mesh.material = xray;
          mesh.userData.modeMaterial = xray;
        }
      });
    });
  }, [viewMode]);

  // Handle Clipping Plane for Section View
  useEffect(() => {
    if (!clippingPlaneRef.current) return;
    if (viewMode === "section") {
      clippingPlaneRef.current.constant = sectionPlanePos;
    } else {
      clippingPlaneRef.current.constant = 999.0;
    }
  }, [viewMode, sectionPlanePos]);

  useEffect(() => {
    if (gridRef.current) {
      gridRef.current.visible = measureModeActive || viewMode === "wireframe";
    }
  }, [measureModeActive, viewMode]);

  // Highlight Selected Component
  useEffect(() => {
    const map = groupMapRef.current;
    Object.keys(map).forEach((id) => {
      const grp = map[id];
      if (!grp) return;
      const isSelected = id === selectedId;

      grp.traverse((obj) => {
        if (obj instanceof THREE.LineSegments) {
          obj.visible = isSelected;
          const lineMaterial = obj.material as THREE.LineBasicMaterial;
          lineMaterial.color.set(isSelected ? 0xff3b30 : 0x69c8ef);
          lineMaterial.opacity = isSelected ? 0.98 : 0.12;
          return;
        }
        if (obj instanceof THREE.Mesh) {
          const mat = obj.material as THREE.MeshStandardMaterial;
          if (isSelected) {
            mat.emissive = new THREE.Color(0xda291c);
            mat.emissiveIntensity = 0.38;
          } else {
            mat.emissive = new THREE.Color(0x000000);
            mat.emissiveIntensity = 0.0;
          }
        }
      });
    });
  }, [selectedId]);

  const handleMeasureToggle = () => {
    if (!measureModeActive) {
      setMeasureModeActive(true);
      setMeasuredDistance("Bitola entre flanges dos cubos: 1,688 mm (referência didática do catálogo MS-120)");
    } else {
      setMeasureModeActive(false);
      setMeasuredDistance(null);
    }
  };

  const handleReset = () => {
    setMode("assembled");
    setMotionPaused(false);
    setAnimationSpeed(1);
    const shouldAutoRotate = !reducedMotionRef.current;
    autoRotateRef.current = shouldAutoRotate;
    setAutoRotate(shouldAutoRotate);
    setExplodeDepth(0);
    setViewMode("solid");
    setSectionPlanePos(0);
    setMeasureModeActive(false);
    setMeasuredDistance(null);
    setSelectedId("main_axle_housing");
    setCameraView("iso");
    if (gridRef.current) gridRef.current.visible = false;
    applyExplodeTransformations(0);
  };

  return (
    <div className={`axle-viewer-root w-full flex flex-col gap-4 ${compact ? "axle-viewer-compact" : ""}`}>
      {/* Top Bar with Mode Buttons & Presets */}
      <div className="axle-viewer-toolbar flex flex-wrap items-center justify-between gap-3 p-4 rounded-xl border border-white/10 bg-[#12151d] backdrop-blur-md">
        <div className="flex flex-wrap items-center gap-2">
          <Button
            size="sm"
            variant={mode === "assembled" ? "default" : "outline"}
            onClick={() => {
              setMode("assembled");
              setExplodeDepth(0);
            }}
            className={mode === "assembled" ? "bg-[#da291c] hover:bg-red-700 text-white" : "border-white/15 text-slate-300"}
          >
            <ShieldCheck className="w-4 h-4 mr-1.5" />
            Montado (0%)
          </Button>

          <Button
            size="sm"
            variant={mode === "exploded" ? "default" : "outline"}
            onClick={() => {
              setMode("exploded");
              setExplodeDepth(1.0);
            }}
            className={mode === "exploded" ? "bg-[#da291c] hover:bg-red-700 text-white" : "border-white/15 text-slate-300"}
          >
            <Layers className="w-4 h-4 mr-1.5" />
            Exploded View
          </Button>

          <Button
            size="sm"
            variant={mode === "running" ? "default" : "outline"}
            onClick={() => {
              setMode("running");
              setMotionPaused(false);
              setExplodeDepth(0);
            }}
            className={mode === "running" ? "bg-amber-600 hover:bg-amber-700 text-white" : "border-white/15 text-slate-300"}
          >
            <Activity className="w-4 h-4 mr-1.5" />
            Torque em Reta
          </Button>

          <Button
            size="sm"
            variant={mode === "curve" ? "default" : "outline"}
            onClick={() => {
              setMode("curve");
              setMotionPaused(false);
              setExplodeDepth(0);
            }}
            className={mode === "curve" ? "bg-cyan-600 hover:bg-cyan-700 text-white" : "border-white/15 text-slate-300"}
          >
            <Activity className="w-4 h-4 mr-1.5" />
            Dinâmica de Curva
          </Button>

          {(mode === "running" || mode === "curve") && (
            <>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setMotionPaused((value) => !value)}
                className="border-white/15 text-slate-200"
                aria-pressed={motionPaused}
              >
                {motionPaused ? <Play className="w-4 h-4 mr-1.5" /> : <Pause className="w-4 h-4 mr-1.5" />}
                {motionPaused ? "Retomar" : "Pausar"}
              </Button>
              <label className="flex items-center gap-2 rounded-md border border-white/10 bg-black/20 px-2 py-1 text-[10px] text-slate-300">
                Velocidade
                <input
                  aria-label="Velocidade da animação"
                  type="range"
                  min="0.25"
                  max="2"
                  step="0.25"
                  value={animationSpeed}
                  onChange={(event) => setAnimationSpeed(Number(event.target.value))}
                  className="w-20 accent-[#da291c]"
                />
                <span className="w-7 font-mono text-right">{animationSpeed.toFixed(2)}x</span>
              </label>
            </>
          )}

          <Button
            size="sm"
            variant={autoRotate ? "secondary" : "outline"}
            onClick={() => {
              if (reducedMotionRef.current) return;
              setAutoRotate((value) => !value);
            }}
            className="text-xs border-white/15"
            aria-pressed={autoRotate}
          >
            {autoRotate ? <Pause className="w-4 h-4 mr-1.5" /> : <Play className="w-4 h-4 mr-1.5" />}
            {autoRotate ? "Pausar rotação" : "Ativar rotação"}
          </Button>

          <div className="h-6 w-px bg-white/10 mx-1 hidden sm:block" />

          {/* View Modes */}
          <Button
            size="sm"
            variant={viewMode === "solid" ? "secondary" : "ghost"}
            onClick={() => setViewMode("solid")}
            className="text-xs"
          >
            Sólido
          </Button>
          <Button
            size="sm"
            variant={viewMode === "wireframe" ? "secondary" : "ghost"}
            onClick={() => setViewMode("wireframe")}
            className="text-xs"
          >
            Wireframe
          </Button>
          <Button
            size="sm"
            variant={viewMode === "xray" ? "secondary" : "ghost"}
            onClick={() => setViewMode("xray")}
            className="text-xs text-sky-400"
          >
            <Eye className="w-3.5 h-3.5 mr-1" />
            Ver Interior (X-Ray)
          </Button>
          <Button
            size="sm"
            variant={viewMode === "section" ? "secondary" : "ghost"}
            onClick={() => setViewMode("section")}
            className="text-xs text-amber-400"
          >
            <Sliders className="w-3.5 h-3.5 mr-1" />
            Section View
          </Button>

          <Button
            size="sm"
            variant={showComponents ? "secondary" : "outline"}
            onClick={() => setShowComponents((value) => !value)}
            className="text-xs border-white/15"
            aria-pressed={showComponents}
          >
            <Eye className="w-3.5 h-3.5 mr-1" />
            {showComponents ? "Ocultar miolo" : "Mostrar componentes"}
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={() => zoomBy(-1.2)}
            className="text-xs border-white/15"
            aria-label="Aproximar o modelo"
          >
            Zoom +
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={() => zoomBy(1.2)}
            className="text-xs border-white/15"
            aria-label="Afastar o modelo"
          >
            Zoom −
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant={measureModeActive ? "destructive" : "outline"}
            onClick={handleMeasureToggle}
            className="text-xs border-white/15"
          >
            <Ruler className="w-3.5 h-3.5 mr-1" />
            {measureModeActive ? "Medição Ativa" : "Medir"}
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={handleReset}
            className="text-xs border-white/15 text-slate-300 hover:bg-white/10"
          >
            <RotateCcw className="w-3.5 h-3.5 mr-1" />
            Reset
          </Button>
        </div>
      </div>

      {compact && (
        <div className="axle-compact-toolbar flex flex-col gap-3 rounded-xl border border-white/10 bg-[#12151d] p-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="text-[11px] font-mono font-bold uppercase tracking-[.14em] text-amber-200">Controles do modelo</div>
            <div className="mt-1 text-xs text-slate-400">A imagem permanece limpa; use os controles fora do palco.</div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => {
                if (reducedMotionRef.current) return;
                setAutoRotate((value) => !value);
              }}
              className="inline-flex min-h-11 items-center gap-1.5 rounded-lg border border-white/15 px-3 py-2 text-xs font-bold text-white hover:bg-white/10"
              aria-pressed={autoRotate}
            >
              {autoRotate ? <Pause className="h-4 w-4" aria-hidden="true" /> : <Play className="h-4 w-4" aria-hidden="true" />}
              {autoRotate ? "Pausar rotação" : "Rotacionar"}
            </button>
            <button
              type="button"
              onClick={() => setCameraView("iso")}
              className="inline-flex min-h-11 items-center gap-1.5 rounded-lg border border-white/15 px-3 py-2 text-xs font-bold text-slate-200 hover:bg-white/10"
            >
              <Focus className="h-4 w-4" aria-hidden="true" /> Vista inicial
            </button>
            <button
              type="button"
              onClick={handleReset}
              className="inline-flex min-h-11 items-center gap-1.5 rounded-lg border border-red-400/40 bg-red-950/30 px-3 py-2 text-xs font-bold text-red-100 hover:bg-red-900/50"
            >
              <RotateCcw className="h-4 w-4" aria-hidden="true" /> Resetar
            </button>
            <button
              type="button"
              onClick={() => setShowComponents((value) => !value)}
              className="inline-flex min-h-11 items-center gap-1.5 rounded-lg border border-cyan-400/30 px-3 py-2 text-xs font-bold text-cyan-100 hover:bg-cyan-900/30"
              aria-pressed={showComponents}
            >
              <Eye className="h-4 w-4" aria-hidden="true" /> {showComponents ? "Ocultar miolo" : "Mostrar componentes"}
            </button>
            <button
              type="button"
              onClick={() => zoomBy(-1.2)}
              className="inline-flex min-h-11 items-center gap-1.5 rounded-lg border border-white/15 px-3 py-2 text-xs font-bold text-white hover:bg-white/10"
              aria-label="Aproximar o modelo"
            >
              Zoom +
            </button>
            <button
              type="button"
              onClick={() => zoomBy(1.2)}
              className="inline-flex min-h-11 items-center gap-1.5 rounded-lg border border-white/15 px-3 py-2 text-xs font-bold text-white hover:bg-white/10"
              aria-label="Afastar o modelo"
            >
              Zoom −
            </button>
          </div>
        </div>
      )}

      {/* Main 3D Canvas + Technical Sidebar */}
      <div className="axle-viewer-main-grid grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* 3D Viewport Area */}
        <div className="lg:col-span-8 flex flex-col gap-3">
          <div
            ref={containerRef}
            className="axle-viewer-viewport relative isolate w-full h-[540px] sm:h-[620px] rounded-2xl overflow-hidden border border-white/10 bg-[#0a0d12] shadow-2xl"
            style={{
              backgroundImage: explodeDepth > 0.05
                ? `linear-gradient(90deg, rgba(5, 8, 12, .68) 0%, rgba(8, 12, 18, .46) 48%, rgba(5, 8, 12, .7) 100%), linear-gradient(180deg, rgba(10, 14, 20, .1), rgba(5, 7, 10, .62)), url(${REAL_PHOTOS.productionLine.src})`
                : `linear-gradient(90deg, rgba(5, 8, 12, .58) 0%, rgba(8, 12, 18, .34) 48%, rgba(5, 8, 12, .62) 100%), linear-gradient(180deg, rgba(10, 14, 20, .08), rgba(5, 7, 10, .54)), url(${REAL_PHOTOS.productionLine.src})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          >
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_42%,rgba(218,41,28,.15),transparent_38%)]" aria-hidden="true" />
            <canvas
              ref={canvasRef}
              tabIndex={0}
              role="application"
              aria-label="Visualizador 3D interativo do eixo traseiro Meritor Cummins MS-120. Use as setas para girar, mais e menos para zoom, R para resetar e M para medir."
              onKeyDown={(event) => {
                if (event.key === "r" || event.key === "R") { event.preventDefault(); handleReset(); return; }
                if (event.key === "m" || event.key === "M") { event.preventDefault(); handleMeasureToggle(); return; }
                if (event.key === "+" || event.key === "=") { event.preventDefault(); zoomBy(-1.2); return; }
                if (event.key === "-" || event.key === "_") { event.preventDefault(); zoomBy(1.2); return; }
                if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
                  event.preventDefault(); cameraPolarRef.current.theta += event.key === "ArrowLeft" ? -0.12 : 0.12;
                }
                if (event.key === "ArrowUp" || event.key === "ArrowDown") {
                  event.preventDefault(); cameraPolarRef.current.phi = Math.max(0.25, Math.min(Math.PI - 0.25, cameraPolarRef.current.phi + (event.key === "ArrowUp" ? -0.08 : 0.08)));
                }
              }}
              className="relative z-10 w-full h-full cursor-grab active:cursor-grabbing outline-none focus-visible:ring-4 focus-visible:ring-amber-300"
            />
          </div>

          {/* Precision Exploded View & Section Sliders with Native Range Controls */}
          <div className="axle-viewer-sliders grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl border border-white/10 bg-[#12151d]">
            <div className="flex flex-col gap-2">
              <div className="flex justify-between items-center text-xs">
                <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-red-500" />
                  Profundidade de Desmontagem (Exploded View)
                </span>
                <span className="text-red-400 font-mono font-bold">
                  {Math.round(explodeDepth * 100)}%
                </span>
              </div>
              
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={explodeDepth}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  setExplodeDepth(val);
                  if (val > 0 && mode === "assembled") setMode("exploded");
                  if (val === 0 && mode === "exploded") setMode("assembled");
                }}
                className="w-full accent-[#da291c] h-2 bg-slate-800 rounded-lg cursor-pointer"
              />

              <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                <span>0% Montado</span>
                <span>25% Fixadores</span>
                <span>50% Tubos/Tampa</span>
                <span>75% Diferencial</span>
                <span>100% Desmontado</span>
              </div>
            </div>

            {viewMode === "section" ? (
              <div className="flex flex-col gap-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-semibold text-amber-300 flex items-center gap-1.5">
                    <Sliders className="w-3.5 h-3.5 text-amber-400" />
                    Plano de Corte Transversal
                  </span>
                  <span className="text-amber-400 font-mono font-bold">
                    {sectionPlanePos.toFixed(2)} m
                  </span>
                </div>
                
                <input
                  type="range"
                  min="-2"
                  max="2"
                  step="0.05"
                  value={sectionPlanePos}
                  onChange={(e) => setSectionPlanePos(parseFloat(e.target.value))}
                  className="w-full accent-amber-500 h-2 bg-slate-800 rounded-lg cursor-pointer"
                />

                <span className="text-[10px] text-slate-500">
                  Deslize para cortar a carcaça e observar o engrenamento interno da coroa e pinhão.
                </span>
              </div>
            ) : (
              <div className="flex flex-col justify-center gap-1.5 text-xs text-slate-400 bg-white/5 p-3 rounded-lg border border-white/5">
                <span className="font-semibold text-slate-300">Controles do Mouse:</span>
                <span>• Botão Esquerdo + Arrastar: Rotação orbital 360°</span>
                <span>• Botão Direito + Arrastar: Translação horizontal e vertical</span>
                <span>• Scroll / Roda do Mouse: Zoom in / Zoom out de precisão</span>
              </div>
            )}
          </div>
        </div>

        {/* Technical Component Inspector & Catalog (Right Column) */}
        <div className="axle-viewer-sidebar lg:col-span-4 flex flex-col gap-4">
          {/* Active Component Spec Sheet Card */}
          <div className="p-5 rounded-2xl border border-white/10 bg-[#141822] shadow-xl flex flex-col gap-3">
            <div className="flex items-start justify-between gap-2 border-b border-white/10 pb-3">
              <div>
                <span className="text-[11px] font-mono uppercase tracking-wider text-red-400 font-semibold flex items-center gap-1">
                  Item #{selectedComponent.number} • {selectedComponent.category.toUpperCase()}
                </span>
                <h3 className="text-lg font-bold text-white mt-0.5">
                  {selectedComponent.namePt}
                </h3>
                {selectedComponent.nameEn && (
                  <span className="text-xs text-slate-400 italic">
                    {selectedComponent.nameEn}
                  </span>
                )}
              </div>

              <Badge
                variant={selectedComponent.optional ? "outline" : "default"}
                className={selectedComponent.optional ? "border-amber-400/50 text-amber-300 text-[10px]" : "bg-red-600/80 text-white text-[10px]"}
              >
                {selectedComponent.optional ? "Opcional" : "Padrão"}
              </Badge>
            </div>

              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => focusComponent(selectedComponent.id)}
                  className="h-7 text-[11px] border-red-400/30 text-red-300 hover:bg-red-500/10"
                >
                  <Focus className="w-3.5 h-3.5 mr-1" /> Focar peça
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setCameraView("iso")}
                  className="h-7 text-[11px] text-slate-300 hover:bg-white/10"
                >
                  <Maximize2 className="w-3.5 h-3.5 mr-1" /> Ver conjunto
                </Button>
              </div>

              <div className="flex flex-col gap-2.5 text-xs">
              <div>
                <span className="font-semibold text-slate-300 block mb-0.5">Função Mecânica:</span>
                <p className="text-slate-400 leading-relaxed">{selectedComponent.function}</p>
              </div>

              <div>
                <span className="font-semibold text-slate-300 block mb-0.5">Localização no Conjunto:</span>
                <p className="text-slate-400 leading-relaxed">{selectedComponent.location}</p>
              </div>

              <div>
                <span className="font-semibold text-slate-300 block mb-0.5">Material & Fabricação:</span>
                <span className="inline-block px-2 py-0.5 rounded bg-white/5 border border-white/10 text-slate-300 capitalize">
                  {selectedComponent.material.replace("-", " ")}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-md border border-white/10 bg-white/5 p-2">
                  <span className="block text-[10px] uppercase tracking-wide text-slate-500">Movimento</span>
                  <span className={ROTATING_COMPONENTS.has(selectedComponent.id) ? "text-emerald-300" : "text-slate-300"}>
                    {ROTATING_COMPONENTS.has(selectedComponent.id) ? "Girante" : "Fixa"}
                  </span>
                </div>
                <div className="rounded-md border border-white/10 bg-white/5 p-2">
                  <span className="block text-[10px] uppercase tracking-wide text-slate-500">Eixo</span>
                  <span className="text-slate-300">{AXIS_LABELS[selectedComponent.removalAxis] || "conforme montagem"}</span>
                </div>
              </div>

              <div>
                <span className="font-semibold text-slate-300 block mb-0.5">Conjunto:</span>
                <p className="text-slate-400 leading-relaxed">{selectedComponent.groupId.replaceAll("_", " ")}</p>
              </div>

              <div className="p-3 rounded-lg bg-red-950/20 border border-red-500/20 text-red-200/90 text-[11px] leading-relaxed">
                <span className="font-bold block text-red-400 mb-0.5">Nota Técnica de Engenharia:</span>
                {selectedComponent.technicalNote}
              </div>
            </div>
          </div>

          {/* Interactive Catalog Navigator */}
          <div className="p-4 rounded-2xl border border-white/10 bg-[#12151d] shadow-xl flex flex-col flex-1 max-h-[420px]">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <h4 className="text-sm font-bold text-white uppercase tracking-wider">
                Catálogo de Componentes ({filteredCatalog.length})
              </h4>
              <button
                onClick={() => setShowOptionalComponents(!showOptionalComponents)}
                className="text-[11px] text-slate-400 hover:text-white underline"
              >
                {showOptionalComponents ? "Ocultar Opcionais" : "Exibir Opcionais"}
              </button>
            </div>

            {/* Category Filter Chips */}
            <div className="flex flex-wrap gap-1.5 py-2.5 border-b border-white/10">
              {["all", "external", "internal", "fastener", "optional"].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setFilterCategory(cat)}
                  className={`px-2 py-1 text-[10px] rounded-md uppercase font-semibold transition ${
                    filterCategory === cat
                      ? "bg-[#da291c] text-white"
                      : "bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  {cat === "all" ? "Todos" : cat}
                </button>
              ))}
            </div>

            {/* Scrollable Items List */}
            <div className="flex flex-col gap-1.5 overflow-y-auto mt-2 pr-1 custom-scrollbar">
              {filteredCatalog.map((item) => {
                const isSelected = item.id === selectedId;
                return (
                  <button
                    key={item.id}
                    onClick={() => selectComponent(item.id, true)}
                    className={`flex items-center justify-between p-2 rounded-lg text-left transition border ${
                      isSelected
                        ? "bg-red-500/20 border-red-500/60 text-white"
                        : "bg-white/[0.02] border-transparent hover:bg-white/5 text-slate-300"
                    }`}
                  >
                    <div className="flex items-center gap-2 overflow-hidden">
                      <span className="w-5 h-5 rounded-full bg-white/10 text-[10px] font-mono flex items-center justify-center shrink-0 text-slate-300">
                        {item.number}
                      </span>
                      <span className="text-xs truncate font-medium">{item.namePt}</span>
                    </div>

                    <ChevronRight className={`w-3.5 h-3.5 shrink-0 ${isSelected ? "text-red-400" : "text-slate-600"}`} />
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
