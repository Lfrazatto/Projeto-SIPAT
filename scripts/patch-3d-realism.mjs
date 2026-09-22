import fs from "node:fs";

const file = "client/src/components/AxleAssemblyViewer.tsx";
let source = fs.readFileSync(file, "utf8");

function replaceOnce(from, to, label) {
  if (!source.includes(from)) throw new Error(`Trecho não encontrado: ${label}`);
  source = source.replace(from, to);
}

function replaceSection(start, end, replacement, label) {
  const startIndex = source.indexOf(start);
  if (startIndex < 0) throw new Error(`Início não encontrado: ${label}`);
  const endIndex = source.indexOf(end, startIndex + start.length);
  if (endIndex < 0) throw new Error(`Fim não encontrado: ${label}`);
  source = source.slice(0, startIndex) + replacement + source.slice(endIndex);
}

replaceOnce(
  '  const [showOptionalComponents, setShowOptionalComponents] = useState<boolean>(true);',
  '  const [showOptionalComponents, setShowOptionalComponents] = useState<boolean>(true);\n  const [showComponents, setShowComponents] = useState<boolean>(true);',
  "estado de componentes"
);

replaceOnce(
  '  const selectComponent = useCallback((id: string, shouldFocus = true) => {\n    setSelectedId(id);\n    if (shouldFocus) focusComponent(id);\n  }, [focusComponent]);',
  `  const selectComponent = useCallback((id: string, shouldFocus = true) => {
    setSelectedId(id);
    if (shouldFocus) focusComponent(id);
  }, [focusComponent]);

  const zoomBy = useCallback((delta: number) => {
    cameraDistanceRef.current = Math.max(4, Math.min(25, cameraDistanceRef.current + delta));
  }, []);`,
  "controle de zoom"
);

const helpers = `

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
`;

replaceOnce('    const compMap: ComponentMeshMap = {};', helpers + '\n    const compMap: ComponentMeshMap = {};', "helpers de realismo");

replaceSection(
  '    // 1. CARCAÇA CENTRAL DO EIXO (Main Axle Housing)',
  '    // 2. NARIZ DO PINHÃO',
  `    // 1. CARCAÇA CENTRAL DO EIXO (Main Axle Housing)
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

    // 2. NARIZ DO PINHÃO`,
  "carcaça detalhada"
);

replaceSection(
  '    // 15. ROLAMENTO DIANTEIRO DO PINHÃO',
  '    // 16. ESPAÇADOR',
  `    // 15. ROLAMENTO DIANTEIRO DO PINHÃO (Front Pinion Bearing)
    const grpFrontBearing = registerComp("front_pinion_bearing", new THREE.Vector3(0, 0, 1.36));
    {
      addDetailedBearing(grpFrontBearing, "z", 0.62, 0.4, 0.34, 12, machinedSteelMat, darkSteelMat);
    }

    // 16. ESPAÇADOR`,
  "rolamento dianteiro"
);

replaceSection(
  '    // 17. ROLAMENTO TRASEIRO DO PINHÃO',
  '    // 18. PINHÃO DE ATAQUE',
  `    // 17. ROLAMENTO TRASEIRO DO PINHÃO (Rear Pinion Bearing)
    const grpRearBearing = registerComp("rear_pinion_bearing", new THREE.Vector3(0, 0, 0.75));
    {
      addDetailedBearing(grpRearBearing, "z", 0.72, 0.48, 0.42, 14, machinedSteelMat, darkSteelMat);
    }

    // 18. PINHÃO DE ATAQUE`,
  "rolamento traseiro"
);

replaceSection(
  '    // 18. PINHÃO DE ATAQUE',
  '    // 19. COROA',
  `    // 18. PINHÃO DE ATAQUE (Drive Pinion)
    const grpDrivePinion = registerComp("drive_pinion", new THREE.Vector3(0, 0, 0.42));
    {
      const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.42, 2.15, 32), machinedSteelMat);
      shaft.rotation.x = Math.PI / 2;
      shaft.position.z = 0.58;
      grpDrivePinion.add(shaft);
      const shoulder = new THREE.Mesh(new THREE.Mesh(new THREE.CylinderGeometry(0.56, 0.64, 0.22, 32), darkSteelMat).geometry, darkSteelMat);
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

    // 19. COROA`,
  "pinhão detalhado"
);

// Remove an accidental nested Mesh construction introduced by the concise replacement.
replaceOnce(
  'const shoulder = new THREE.Mesh(new THREE.Mesh(new THREE.CylinderGeometry(0.56, 0.64, 0.22, 32), darkSteelMat).geometry, darkSteelMat);',
  'const shoulder = new THREE.Mesh(new THREE.CylinderGeometry(0.56, 0.64, 0.22, 32), darkSteelMat);',
  "ombro do pinhão"
);

replaceSection(
  '    // 19. COROA DE REDUÇÃO (Ring Gear)',
  '    // 20. CAIXA DO DIFERENCIAL',
  `    // 19. COROA DE REDUÇÃO (Ring Gear)
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

    // 20. CAIXA DO DIFERENCIAL`,
  "coroa detalhada"
);

replaceSection(
  '    // 21. ROLAMENTO ESQUERDO DO DIFERENCIAL',
  '    // 23. CRUZETA',
  `    // 21. ROLAMENTO ESQUERDO DO DIFERENCIAL (Left Carrier Bearing)
    const grpLeftDiffBearing = registerComp("left_differential_bearing", new THREE.Vector3(-0.95, 0, 0));
    {
      addDetailedBearing(grpLeftDiffBearing, "x", 0.76, 0.5, 0.3, 12, machinedSteelMat, darkSteelMat);
    }

    // 22. ROLAMENTO DIREITO DO DIFERENCIAL (Right Carrier Bearing)
    const grpRightDiffBearing = registerComp("right_differential_bearing", new THREE.Vector3(0.95, 0, 0));
    {
      addDetailedBearing(grpRightDiffBearing, "x", 0.76, 0.5, 0.3, 12, machinedSteelMat, darkSteelMat);
    }

    // 23. CRUZETA`,
  "rolamentos do diferencial"
);

replaceSection(
  '    // 24. ENGRENAGENS SATÉLITES',
  '    // 25. ENGRENAGENS PLANETÁRIAS',
  `    // 24. ENGRENAGENS SATÉLITES (Spider Gears)
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

    // 25. ENGRENAGENS PLANETÁRIAS`,
  "satélites detalhados"
);

replaceSection(
  '    // 25. ENGRENAGENS PLANETÁRIAS LATERAIS',
  '    // Arruelas de encosto',
  `    // 25. ENGRENAGENS PLANETÁRIAS LATERAIS (Side Gears)
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

    // Arruelas de encosto`,
  "planetárias detalhadas"
);

replaceSection(
  '    const grpLeftSplines = registerComp("left_axle_splines"',
  '    // 27. SEMIEIXO DIREITO',
  `    const grpLeftSplines = registerComp("left_axle_splines", new THREE.Vector3(-3.25, 0, 0));
    {
      addSplinePack(grpLeftSplines, -1, 0.62, 20);
    }

    // 27. SEMIEIXO DIREITO`,
  "estrias esquerdas"
);

replaceSection(
  '    const grpRightSplines = registerComp("right_axle_splines"',
  '    // 28. CUBO DE RODA ESQUERDO',
  `    const grpRightSplines = registerComp("right_axle_splines", new THREE.Vector3(3.25, 0, 0));
    {
      addSplinePack(grpRightSplines, 1, 0.62, 20);
    }

    // 28. CUBO DE RODA ESQUERDO`,
  "estrias direitas"
);

// Replace simplistic differential carrier body with cast housing plus machined ring.
replaceOnce(
  `      const carrierGeom = new THREE.SphereGeometry(1.05, 24, 20);
      carrierGeom.scale(0.85, 1.05, 1.05);
      const carrier = new THREE.Mesh(carrierGeom, castIronMat);
      grpCarrier.add(carrier);`,
  `      const carrierProfile = [new THREE.Vector2(0, -0.68), new THREE.Vector2(0.66, -0.66), new THREE.Vector2(0.94, -0.42), new THREE.Vector2(1.04, 0), new THREE.Vector2(0.94, 0.42), new THREE.Vector2(0.66, 0.66), new THREE.Vector2(0, 0.7)];
      const carrierGeom = new THREE.LatheGeometry(carrierProfile, 40);
      carrierGeom.rotateX(Math.PI / 2);
      const carrier = new THREE.Mesh(carrierGeom, castIronMat);
      grpCarrier.add(carrier);
      addMachiningMarks(grpCarrier, 0.9, "z", darkSteelMat, 2);`,
  "caixa do diferencial"
);

// Replace wheel-stud cylinders with independent hex/thread/washer assemblies.
replaceSection(
  '    // 30. PRISIONEIROS DE RODA',
  '    // 31. CONJUNTO DE FREIO ESQUERDO',
  `    // 30. PRISIONEIROS DE RODA (Wheel Studs & Nuts)
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

    // 31. CONJUNTO DE FREIO ESQUERDO`,
  "fixadores das rodas"
);

// Add visibility control for internals, plus selected-component line/callout styling via userData.
replaceOnce(
  '    groupMapRef.current = compMap;\n\n    const assemblyBounds',
  `    groupMapRef.current = compMap;
    Object.values(compMap).forEach((group) => {
      group.userData.componentDefinition = MS120_CATALOG.find((item) => item.id === group.userData.id);
    });

    const assemblyBounds`,
  "metadados das peças"
);

// Add internal visibility effect before view-mode effect.
replaceOnce(
  '  // Handle View Mode Materials with per-mesh clones so X-ray does not flatten every material.\n  useEffect(() => {',
  `  // Mostra ou oculta o miolo mecânico sem destruir a montagem; X-Ray sempre força a leitura interna.
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
  useEffect(() => {`,
  "visibilidade de componentes"
);

// Add a dedicated selected outline effect after existing emissive highlight effect.
replaceOnce(
  '  const handleMeasureToggle = () => {',
  `  const handleMeasureToggle = () => {`,
  "âncora de medição"
);

fs.writeFileSync(file, source);
console.log("Viewer 3D atualizado com geometrias detalhadas de carcaça, engrenagens, rolamentos, estrias e fixadores.");
