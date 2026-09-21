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
  Info,
  ChevronRight,
  ShieldCheck,
  CheckCircle2,
  HelpCircle,
  ExternalLink,
  Sparkles,
  Focus,
  Tags
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MS120_CATALOG, ComponentDefinition, getComponentById } from "@/data/ms120Catalog";
import { REAL_PHOTOS } from "@/data/realPhotos";

type Mode = "assembled" | "exploded" | "running" | "curve";
type ViewMode = "solid" | "wireframe" | "xray" | "section";
type CameraPreset = "iso" | "front" | "top" | "side" | "diff";

interface ComponentMeshMap {
  [id: string]: THREE.Group;
}

export function AxleAssemblyViewer() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // States
  const [mode, setMode] = useState<Mode>("assembled");
  const [viewMode, setViewMode] = useState<ViewMode>("solid");
  const [explodeDepth, setExplodeDepth] = useState<number>(0);
  const [sectionPlanePos, setSectionPlanePos] = useState<number>(0);
  const [selectedId, setSelectedId] = useState<string>("main_axle_housing");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [showOptionalComponents, setShowOptionalComponents] = useState<boolean>(true);
  const [measureModeActive, setMeasureModeActive] = useState<boolean>(false);
  const [measuredDistance, setMeasuredDistance] = useState<string | null>(null);
  const [showLabels, setShowLabels] = useState<boolean>(true);
  const [isolatedId, setIsolatedId] = useState<string | null>(null);

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
  const labelIdsRef = useRef<string[]>([]);
  const labelElementsRef = useRef<Record<string, HTMLDivElement | null>>({});

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

  const labelIds = useMemo(() => {
    const candidates = MS120_CATALOG.filter((comp) => {
      if (comp.id === selectedId) return true;
      return showLabels && explodeDepth > 0.05 && comp.visibleInExploded && comp.explodeStage > 0;
    }).sort((a, b) => {
      if (a.id === selectedId) return -1;
      if (b.id === selectedId) return 1;
      return a.explodeStage - b.explodeStage;
    });
    return candidates.slice(0, showLabels ? 7 : 1).map((comp) => comp.id);
  }, [selectedId, showLabels, explodeDepth]);

  useEffect(() => {
    modeRef.current = mode;
  }, [mode]);

  useEffect(() => {
    labelIdsRef.current = labelIds;
  }, [labelIds]);

  // Set camera preset
  const setCameraView = useCallback((preset: CameraPreset) => {
    if (!cameraPolarRef.current) return;
    if (preset === "iso") {
      cameraPolarRef.current = { theta: Math.PI / 4, phi: Math.PI / 3.2 };
      cameraDistanceRef.current = 14;
      cameraTargetRef.current.set(0, 0, 0);
    } else if (preset === "front") {
      cameraPolarRef.current = { theta: 0, phi: Math.PI / 2 };
      cameraDistanceRef.current = 13;
      cameraTargetRef.current.set(0, 0, 0);
    } else if (preset === "top") {
      cameraPolarRef.current = { theta: 0, phi: 0.05 };
      cameraDistanceRef.current = 15;
      cameraTargetRef.current.set(0, 0, 0);
    } else if (preset === "side") {
      cameraPolarRef.current = { theta: Math.PI / 2, phi: Math.PI / 2 };
      cameraDistanceRef.current = 13;
      cameraTargetRef.current.set(0, 0, 0);
    } else if (preset === "diff") {
      cameraPolarRef.current = { theta: 0.2, phi: Math.PI / 2.8 };
      cameraDistanceRef.current = 7.5;
      cameraTargetRef.current.set(0, 0, 0);
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

      grp.position.set(mountedPos.x + xOff, mountedPos.y + yOff, mountedPos.z + zOff);
    });
  }, []);

  // Three.js scene setup
  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    // Renderer
    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
      powerPreference: "high-performance"
    });
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
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0xffffff, 2.0);
    dirLight1.position.set(10, 15, 12);
    dirLight1.castShadow = true;
    dirLight1.shadow.mapSize.width = 1024;
    dirLight1.shadow.mapSize.height = 1024;
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0xff3322, 0.7);
    dirLight2.position.set(-12, 4, -10);
    scene.add(dirLight2);

    const fillLight = new THREE.DirectionalLight(0x7799bb, 0.9);
    fillLight.position.set(0, -10, 8);
    scene.add(fillLight);

    const rimLight = new THREE.DirectionalLight(0xff6655, 1.15);
    rimLight.position.set(-8, 6, -14);
    scene.add(rimLight);

    const interiorLight = new THREE.PointLight(0x4aa8d8, 0, 8, 2);
    interiorLight.position.set(0, 0.2, 0.2);
    scene.add(interiorLight);
    interiorLightRef.current = interiorLight;

    // Floor grid
    const grid = new THREE.GridHelper(20, 20, 0xda291c, 0x222733);
    grid.position.y = -2.8;
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

    const castIronMat = createMat(0x657481, 0.68, 0.36);
    const innerIronMat = createMat(0x8796a3, 0.72, 0.28);
    const machinedSteelMat = createMat(0xd8e0e6, 0.94, 0.13);
    const darkSteelMat = createMat(0x77838f, 0.88, 0.22);
    const gearBronzeMat = createMat(0xc99c4d, 0.9, 0.2);
    const gearHighlightMat = createMat(0xf0cf70, 0.94, 0.13);
    const fastenerMat = createMat(0xd5dee5, 0.92, 0.14);
    const brakeMat = createMat(0x778693, 0.68, 0.34);
    const brakeLiningMat = createMat(0xb6754e, 0.44, 0.56);
    const rubberMat = createMat(0x22272b, 0.08, 0.88);
    materialsRef.current = materials;

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
      const pumpkinGeom = new THREE.SphereGeometry(1.65, 32, 24);
      pumpkinGeom.scale(1.08, 1.15, 0.92);
      const pumpkinMesh = new THREE.Mesh(pumpkinGeom, castIronMat);
      pumpkinMesh.castShadow = true;
      pumpkinMesh.receiveShadow = true;
      grpMainHousing.add(pumpkinMesh);

      const rearFlangeGeom = new THREE.TorusGeometry(1.58, 0.14, 16, 48);
      const rearFlange = new THREE.Mesh(rearFlangeGeom, castIronMat);
      rearFlange.position.set(0, 0, -0.72);
      grpMainHousing.add(rearFlange);

      for (let i = 0; i < 6; i++) {
        const ang = (i / 6) * Math.PI;
        const ribGeom = new THREE.BoxGeometry(0.12, 2.9, 0.35);
        const rib = new THREE.Mesh(ribGeom, castIronMat);
        rib.rotation.z = ang;
        rib.position.set(0, 0, 0.25);
        grpMainHousing.add(rib);
      }

      const neckLeftGeom = new THREE.CylinderGeometry(0.72, 1.1, 1.0, 24);
      const neckLeft = new THREE.Mesh(neckLeftGeom, castIronMat);
      neckLeft.rotation.z = Math.PI / 2;
      neckLeft.position.set(-1.45, 0, 0);
      grpMainHousing.add(neckLeft);

      const neckRightGeom = new THREE.CylinderGeometry(1.1, 0.72, 1.0, 24);
      const neckRight = new THREE.Mesh(neckRightGeom, castIronMat);
      neckRight.rotation.z = Math.PI / 2;
      neckRight.position.set(1.45, 0, 0);
      grpMainHousing.add(neckRight);

      // Reforços longitudinais e ressaltos de fixação para leitura de peça fundida pesada.
      [-1.05, -0.35, 0.35, 1.05].forEach((y) => {
        const rib = new THREE.Mesh(new THREE.BoxGeometry(2.35, 0.12, 0.22), darkSteelMat);
        rib.position.set(0, y, 0.92);
        grpMainHousing.add(rib);
      });
      [-1.28, 1.28].forEach((x) => {
        const boss = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.28, 0.34, 16), castIronMat);
        boss.rotation.x = Math.PI / 2;
        boss.position.set(x, 0.8, -0.2);
        grpMainHousing.add(boss);
      });
    }

    // 2. NARIZ DO PINHÃO (Pinion Nose Housing)
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
      const mountPad = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.18, 0.62), castIronMat);
      mountPad.position.set(0.1, 0.72, 0);
      grpLeftTube.add(mountPad);
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
      const mountPad = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.18, 0.62), castIronMat);
      mountPad.position.set(-0.1, 0.72, 0);
      grpRightTube.add(mountPad);
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
      const coneGeom = new THREE.CylinderGeometry(0.44, 0.58, 0.32, 24);
      const cone = new THREE.Mesh(coneGeom, machinedSteelMat);
      cone.rotation.x = Math.PI / 2;
      grpFrontBearing.add(cone);
      const outerRace = new THREE.Mesh(new THREE.TorusGeometry(0.58, 0.055, 10, 28), fastenerMat);
      outerRace.rotation.x = Math.PI / 2;
      grpFrontBearing.add(outerRace);
      for (let i = 0; i < 10; i++) {
        const a = (i / 10) * Math.PI * 2;
        const roller = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.16, 10), gearHighlightMat);
        roller.rotation.x = Math.PI / 2;
        roller.position.set(Math.cos(a) * 0.5, Math.sin(a) * 0.5, 0);
        grpFrontBearing.add(roller);
      }
    }

    // 16. ESPAÇADOR / LUVA DE ESMAGAMENTO (Pinion Spacer)
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
      const coneGeom = new THREE.CylinderGeometry(0.52, 0.68, 0.38, 24);
      const cone = new THREE.Mesh(coneGeom, machinedSteelMat);
      cone.rotation.x = Math.PI / 2;
      grpRearBearing.add(cone);
      const outerRace = new THREE.Mesh(new THREE.TorusGeometry(0.68, 0.06, 10, 28), fastenerMat);
      outerRace.rotation.x = Math.PI / 2;
      grpRearBearing.add(outerRace);
      for (let i = 0; i < 12; i++) {
        const a = (i / 12) * Math.PI * 2;
        const roller = new THREE.Mesh(new THREE.CylinderGeometry(0.048, 0.048, 0.17, 10), gearHighlightMat);
        roller.rotation.x = Math.PI / 2;
        roller.position.set(Math.cos(a) * 0.58, Math.sin(a) * 0.58, 0);
        grpRearBearing.add(roller);
      }
    }

    // 18. PINHÃO DE ATAQUE (Drive Pinion)
    const grpDrivePinion = registerComp("drive_pinion", new THREE.Vector3(0, 0, 0.42));
    {
      const shaftGeom = new THREE.CylinderGeometry(0.38, 0.38, 1.6, 24);
      const shaft = new THREE.Mesh(shaftGeom, machinedSteelMat);
      shaft.rotation.x = Math.PI / 2;
      shaft.position.z = 0.55;
      grpDrivePinion.add(shaft);

      const headGeom = new THREE.ConeGeometry(0.68, 0.75, 28);
      const head = new THREE.Mesh(headGeom, gearBronzeMat);
      head.rotation.x = -Math.PI / 2;
      grpDrivePinion.add(head);

      for (let i = 0; i < 9; i++) {
        const ang = (i / 9) * Math.PI * 2;
        const toothGeom = new THREE.BoxGeometry(0.08, 0.45, 0.75);
        const tooth = new THREE.Mesh(toothGeom, gearBronzeMat);
        tooth.position.set(Math.cos(ang) * 0.42, Math.sin(ang) * 0.42, -0.05);
        tooth.rotation.z = ang + 0.3;
        grpDrivePinion.add(tooth);
      }
    }

    // 19. COROA DE REDUÇÃO (Ring Gear)
    const grpRingGear = registerComp("ring_gear", new THREE.Vector3(-0.18, 0, 0.05));
    {
      const ringGeom = new THREE.CylinderGeometry(1.42, 1.42, 0.38, 48);
      const ring = new THREE.Mesh(ringGeom, gearBronzeMat);
      ring.rotation.z = Math.PI / 2;
      grpRingGear.add(ring);

      const ringFace = new THREE.Mesh(new THREE.TorusGeometry(1.12, 0.14, 12, 48), gearHighlightMat);
      ringFace.rotation.y = Math.PI / 2;
      ringFace.position.x = -0.22;
      grpRingGear.add(ringFace);
      for (let i = 0; i < 37; i++) {
        const ang = (i / 37) * Math.PI * 2;
        const toothGeom = new THREE.BoxGeometry(0.34, 0.09, 0.24);
        const tooth = new THREE.Mesh(toothGeom, gearHighlightMat);
        tooth.position.set(0.12, Math.cos(ang) * 1.38, Math.sin(ang) * 1.38);
        tooth.rotation.x = ang;
        grpRingGear.add(tooth);
      }
      for (let i = 0; i < 12; i++) {
        const ang = (i / 12) * Math.PI * 2;
        const bolt = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.065, 0.22, 8), fastenerMat);
        bolt.rotation.z = Math.PI / 2;
        bolt.position.set(-0.42, Math.cos(ang) * 0.88, Math.sin(ang) * 0.88);
        grpRingGear.add(bolt);
      }
    }

    // 20. CAIXA DO DIFERENCIAL (Differential Carrier Case)
    const grpCarrier = registerComp("differential_carrier", new THREE.Vector3(0.18, 0, 0));
    {
      const carrierGeom = new THREE.SphereGeometry(1.05, 24, 20);
      carrierGeom.scale(0.85, 1.05, 1.05);
      const carrier = new THREE.Mesh(carrierGeom, castIronMat);
      grpCarrier.add(carrier);

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
      const brgGeom = new THREE.CylinderGeometry(0.62, 0.75, 0.28, 24);
      const brg = new THREE.Mesh(brgGeom, machinedSteelMat);
      brg.rotation.z = Math.PI / 2;
      grpLeftDiffBearing.add(brg);
    }

    // 22. ROLAMENTO DIREITO DO DIFERENCIAL (Right Carrier Bearing)
    const grpRightDiffBearing = registerComp("right_differential_bearing", new THREE.Vector3(0.95, 0, 0));
    {
      const brgGeom = new THREE.CylinderGeometry(0.75, 0.62, 0.28, 24);
      const brg = new THREE.Mesh(brgGeom, machinedSteelMat);
      brg.rotation.z = Math.PI / 2;
      grpRightDiffBearing.add(brg);
    }

    // 23. CRUZETA DO DIFERENCIAL (Spider Cross)
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
      const pinPositions = [
        { x: 0, y: 0.52, z: 0, rotZ: 0 },
        { x: 0, y: -0.52, z: 0, rotZ: Math.PI },
        { x: 0, y: 0, z: 0.52, rotX: -Math.PI / 2 },
        { x: 0, y: 0, z: -0.52, rotX: Math.PI / 2 }
      ];

      pinPositions.forEach((pos) => {
        const gearGeom = new THREE.ConeGeometry(0.32, 0.28, 16);
        const gear = new THREE.Mesh(gearGeom, gearBronzeMat);
        gear.position.set(pos.x, pos.y, pos.z);
        if (pos.rotZ !== undefined) gear.rotation.z = pos.rotZ;
        if (pos.rotX !== undefined) gear.rotation.x = pos.rotX;
        grpSpiderGears.add(gear);
      });
    }

    // 25. ENGRENAGENS PLANETÁRIAS LATERAIS (Side Gears)
    const grpSideGears = registerComp("side_gears", new THREE.Vector3(0.18, 0, 0));
    {
      [-0.42, 0.42].forEach((xOff, idx) => {
        const gearGeom = new THREE.ConeGeometry(0.48, 0.32, 20);
        const gear = new THREE.Mesh(gearGeom, gearBronzeMat);
        gear.position.x = xOff;
        gear.rotation.z = idx === 0 ? -Math.PI / 2 : Math.PI / 2;
        grpSideGears.add(gear);

        for (let toothIndex = 0; toothIndex < 12; toothIndex++) {
          const angle = (toothIndex / 12) * Math.PI * 2;
          const tooth = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, 0.16), gearHighlightMat);
          tooth.position.set(xOff, Math.cos(angle) * 0.46, Math.sin(angle) * 0.46);
          tooth.rotation.x = angle;
          grpSideGears.add(tooth);
        }

        const splineGeom = new THREE.CylinderGeometry(0.18, 0.18, 0.38, 12);
        const spline = new THREE.Mesh(splineGeom, machinedSteelMat);
        spline.rotation.z = Math.PI / 2;
        spline.position.x = xOff + (idx === 0 ? -0.15 : 0.15);
        grpSideGears.add(spline);

        const washer = new THREE.Mesh(new THREE.TorusGeometry(0.42, 0.04, 10, 24), fastenerMat);
        washer.rotation.y = Math.PI / 2;
        washer.position.x = xOff + (idx === 0 ? 0.18 : -0.18);
        grpSideGears.add(washer);
      });
    }

    // Arruelas de encosto separadas das engrenagens para leitura de montagem.
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
      for (let i = 0; i < 12; i++) {
        const spline = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.04, 0.06), gearHighlightMat);
        const angle = (i / 12) * Math.PI * 2;
        spline.position.set(2.14, Math.cos(angle) * 0.26, Math.sin(angle) * 0.26);
        spline.rotation.x = angle;
        grpLeftSplines.add(spline);
      }
    }

    // 27. SEMIEIXO DIREITO (Right Axle Shaft)
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
      for (let i = 0; i < 12; i++) {
        const spline = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.04, 0.06), gearHighlightMat);
        const angle = (i / 12) * Math.PI * 2;
        spline.position.set(-2.14, Math.cos(angle) * 0.26, Math.sin(angle) * 0.26);
        spline.rotation.x = angle;
        grpRightSplines.add(spline);
      }
    }

    // 28. CUBO DE RODA ESQUERDO (Left Wheel Hub)
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
        for (let i = 0; i < 10; i++) {
          const ang = (i / 10) * Math.PI * 2;
          const y = Math.cos(ang) * 1.35;
          const z = Math.sin(ang) * 1.35;

          const studGeom = new THREE.CylinderGeometry(0.065, 0.065, 0.42, 8);
          const stud = new THREE.Mesh(studGeom, fastenerMat);
          stud.rotation.z = Math.PI / 2;
          stud.position.set(xCenter + (xCenter < 0 ? -0.22 : 0.22), y, z);
          grpWheelStuds.add(stud);

          const nutGeom = new THREE.CylinderGeometry(0.11, 0.11, 0.18, 6);
          const nut = new THREE.Mesh(nutGeom, fastenerMat);
          nut.rotation.z = Math.PI / 2;
          nut.position.set(xCenter + (xCenter < 0 ? -0.38 : 0.38), y, z);
          grpWheelStuds.add(nut);
        }
      });
    }

    // 31. CONJUNTO DE FREIO ESQUERDO (Left Brake Assembly)
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

      camera.position.x = target.x + dist * Math.sin(phi) * Math.sin(theta);
      camera.position.y = target.y + dist * Math.cos(phi);
      camera.position.z = target.z + dist * Math.sin(phi) * Math.cos(theta);
      camera.lookAt(target);

      // Technical labels are HTML overlays positioned from the 3D bounding-box centers.
      labelIdsRef.current.forEach((id) => {
        const label = labelElementsRef.current[id];
        const group = compMap[id];
        if (!label || !group) return;
        const labelPoint = new THREE.Box3().setFromObject(group).getCenter(new THREE.Vector3()).project(camera);
        const x = (labelPoint.x * 0.5 + 0.5) * container.clientWidth;
        const y = (-labelPoint.y * 0.5 + 0.5) * container.clientHeight;
        const visible = labelPoint.z > -1 && labelPoint.z < 1;
        label.style.transform = `translate3d(${x}px, ${y}px, 0) translate(-50%, -50%)`;
        label.style.opacity = visible ? "1" : "0";
      });

      // Running mode animation
      if (modeRef.current === "running" || modeRef.current === "curve") {
        const isCurve = modeRef.current === "curve";
        rotationAngleRef.current += 0.04;
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

  // Highlight Selected Component
  useEffect(() => {
    const map = groupMapRef.current;
    Object.keys(map).forEach((id) => {
      const grp = map[id];
      if (!grp) return;
      const isSelected = id === selectedId;

      grp.traverse((obj) => {
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
      setMeasuredDistance("Bitola entre flanges dos cubos: 1.688 mm (Conforme catálogo MS-120)");
    } else {
      setMeasureModeActive(false);
      setMeasuredDistance(null);
    }
  };

  const handleReset = () => {
    setMode("assembled");
    setExplodeDepth(0);
    setViewMode("solid");
    setSectionPlanePos(0);
    setMeasureModeActive(false);
    setMeasuredDistance(null);
    setSelectedId("main_axle_housing");
    setCameraView("iso");
    applyExplodeTransformations(0);
  };

  return (
    <div className="w-full flex flex-col gap-4">
      {/* Top Bar with Mode Buttons & Presets */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-xl border border-white/10 bg-[#12151d] backdrop-blur-md">
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
              setExplodeDepth(0);
            }}
            className={mode === "curve" ? "bg-cyan-600 hover:bg-cyan-700 text-white" : "border-white/15 text-slate-300"}
          >
            <Activity className="w-4 h-4 mr-1.5" />
            Dinâmica de Curva
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
            variant={showLabels ? "secondary" : "ghost"}
            onClick={() => setShowLabels((value) => !value)}
            className="text-xs text-red-300"
            aria-pressed={showLabels}
          >
            <Tags className="w-3.5 h-3.5 mr-1" />
            Labels
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

      {/* Main 3D Canvas + Technical Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* 3D Viewport Area */}
        <div className="lg:col-span-8 flex flex-col gap-3">
          <div
            ref={containerRef}
            className="relative isolate w-full h-[540px] sm:h-[620px] rounded-2xl overflow-hidden border border-white/10 bg-[#0a0d12] shadow-2xl"
            style={{
              backgroundImage: `linear-gradient(90deg, rgba(5, 8, 12, .58) 0%, rgba(8, 12, 18, .34) 48%, rgba(5, 8, 12, .62) 100%), linear-gradient(180deg, rgba(10, 14, 20, .08), rgba(5, 7, 10, .54)), url(${REAL_PHOTOS.productionLine.src})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          >
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_42%,rgba(218,41,28,.15),transparent_38%)]" aria-hidden="true" />
            <canvas
              ref={canvasRef}
              aria-label="Visualizador 3D Interativo do Eixo Traseiro Meritor Cummins MS-120 com Exploded View"
              className="relative z-10 w-full h-full cursor-grab active:cursor-grabbing outline-none"
            />
            <div ref={(node) => { if (!node) return; }} className="pointer-events-none absolute inset-0 z-20 overflow-hidden">
              {labelIds.map((id) => {
                const item = getComponentById(id);
                if (!item) return null;
                return (
                  <div
                    key={id}
                    ref={(node) => { labelElementsRef.current[id] = node; }}
                    className="absolute left-0 top-0 rounded-md border border-red-400/60 bg-[#120e0e]/90 px-2 py-1 text-[10px] font-semibold text-red-100 shadow-lg shadow-black/40 backdrop-blur-sm whitespace-nowrap transition-opacity duration-150"
                    style={{ opacity: 0 }}
                  >
                    #{item.number} {item.namePt}
                  </div>
                );
              })}
            </div>

            <div className="pointer-events-none absolute bottom-4 right-4 z-20 max-w-[14rem] rounded-lg border border-white/10 bg-black/65 px-3 py-2 text-[10px] leading-relaxed text-slate-300 backdrop-blur-md">
              Fundo industrial: linha de produção Cummins/Meritor em Osasco · Crédito: Transporte Moderno
            </div>

            {/* Overlaid Camera Preset Bar */}
            <div className="absolute top-4 left-4 z-20 flex flex-wrap gap-1.5 p-1 rounded-lg bg-black/60 backdrop-blur-md border border-white/10">
              <button
                onClick={() => setCameraView("iso")}
                className="px-2.5 py-1 text-xs rounded font-medium text-slate-300 hover:text-white hover:bg-white/10"
              >
                Isométrica 3/4
              </button>
              <button
                onClick={() => setCameraView("front")}
                className="px-2.5 py-1 text-xs rounded font-medium text-slate-300 hover:text-white hover:bg-white/10"
              >
                Frontal (Pinhão)
              </button>
              <button
                onClick={() => setCameraView("top")}
                className="px-2.5 py-1 text-xs rounded font-medium text-slate-300 hover:text-white hover:bg-white/10"
              >
                Superior
              </button>
              <button
                onClick={() => setCameraView("side")}
                className="px-2.5 py-1 text-xs rounded font-medium text-slate-300 hover:text-white hover:bg-white/10"
              >
                Lateral (Cubo)
              </button>
              <button
                onClick={() => setCameraView("diff")}
                className="px-2.5 py-1 text-xs rounded font-medium text-red-400 hover:text-red-300 hover:bg-red-500/10"
              >
                Zoom Diferencial
              </button>
            </div>

            {/* Floating Status & Instruction Badge */}
            <div className="absolute bottom-4 left-4 z-20 flex flex-col gap-2 max-w-sm">
              {measuredDistance && (
                <div className="p-3 rounded-lg bg-amber-950/80 border border-amber-500/40 text-amber-200 text-xs backdrop-blur-md">
                  <span className="font-semibold block mb-0.5">Medição Visual:</span>
                  {measuredDistance}
                  <span className="block mt-1 text-[10px] text-amber-300/80">
                    Aviso: Medição do modelo 3D educacional. Não utilizar como desenho de fabricação.
                  </span>
                </div>
              )}

              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/70 border border-white/10 text-xs text-slate-400 backdrop-blur-md">
                <span className="w-2 h-2 rounded-full bg-[#da291c] animate-pulse" />
                <span>Clique em qualquer peça para inspecionar ficha técnica e função.</span>
              </div>
            </div>

            {/* Torque Flow Banner when Running */}
            {mode === "running" && (
              <div className="absolute top-4 right-4 z-20 p-3 rounded-xl bg-gradient-to-r from-red-950/90 to-black/80 border border-red-500/40 backdrop-blur-md max-w-xs text-xs text-slate-200">
                <div className="font-bold text-red-400 uppercase tracking-wide flex items-center gap-1.5">
                  <Activity className="w-4 h-4 animate-spin text-red-500" />
                  Fluxo de Potência & Torque
                </div>
                <p className="mt-1 text-[11px] leading-relaxed text-slate-300">
                  Cardã → Flange → Pinhão Cônico → Coroa Hipoide → Caixa do Diferencial → Satélites & Planetárias → Semieixos → Cubos de Roda.
                </p>
              </div>
            )}

            {mode === "curve" && (
              <div className="absolute top-4 right-4 z-20 p-3 rounded-xl bg-gradient-to-r from-cyan-950/90 to-black/80 border border-cyan-500/40 backdrop-blur-md max-w-xs text-xs text-slate-200">
                <div className="font-bold text-cyan-400 uppercase tracking-wide flex items-center gap-1.5">
                  <Activity className="w-4 h-4 animate-spin text-cyan-400" />
                  Dinâmica em Curva (Didático)
                </div>
                <p className="mt-1 text-[11px] leading-relaxed text-slate-300">
                  As engrenagens satélites giram sobre o eixo cruzeta. O semieixo externo (direito) gira mais rápido do que o interno (esquerdo) para compensar o raio da curva sem arrasto de pneu.
                </p>
              </div>
            )}
          </div>

          {/* Precision Exploded View & Section Sliders with Native Range Controls */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl border border-white/10 bg-[#12151d]">
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
        <div className="lg:col-span-4 flex flex-col gap-4">
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
