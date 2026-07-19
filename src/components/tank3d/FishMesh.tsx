import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import type { Species } from "@/lib/types";
import { hash01, hashRange, speciesColour } from "./palette";
import {
  fishVisualProfile,
  type FishPattern,
  type FishTailStyle,
  type FishVisualProfile,
} from "./fishVisuals";
import { fishBehaviourProfile, type FishBehaviourProfile } from "./fishBehaviours";
import { useReducedMotion } from "./useReducedMotion";

interface FishGroupProps {
  species: Species;
  quantity: number;
  /** Tank interior in scene units. */
  interior: { x: number; y: number; z: number; substrateY: number };
  selected: boolean;
  onSelect: () => void;
  /** Optional override for the school's vertical centre (in world Y). */
  centerY?: number;
}

const CM_PER_UNIT = 10;

function zoneY(zone: "top" | "mid" | "bottom", interior: FishGroupProps["interior"]): number {
  const bottom = interior.substrateY;
  const top = interior.y / 2 - 0.15;
  const usable = top - bottom;
  if (zone === "top") return bottom + usable * 0.78;
  if (zone === "bottom") return bottom + usable * 0.18;
  return bottom + usable * 0.5;
}

interface FishInstance {
  offset: [number, number, number];
  phase: number;
  amp: number;
  speed: number;
}

export function FishGroup({ species, quantity, interior, selected, onSelect, centerY }: FishGroupProps) {
  const colour = useMemo(() => speciesColour(species), [species]);
  const profile = useMemo(() => fishVisualProfile(species), [species]);
  const behaviour = useMemo(() => fishBehaviourProfile(species), [species]);
  const reduced = useReducedMotion();

  // Models are normalised to approximately one scene unit from nose to tail.
  const rawLen = species.adult_size_cm / CM_PER_UNIT;
  const maxLen = Math.min(interior.x, interior.y, interior.z) * 0.42;
  const fishLen = Math.max(0.12, Math.min(rawLen, maxLen));

  const instances = useMemo<FishInstance[]>(() => {
    const yCentre = centerY ?? zoneY(species.swim_zone, interior);

    const school = species.is_schooling && quantity > 1;
    const out: FishInstance[] = [];
    const clusterR = Math.min(interior.x, interior.z) * (school ? 0.35 : 0.45);

    for (let i = 0; i < quantity; i++) {
      const rx = hashRange(species.id, i * 3 + 1, -clusterR, clusterR);
      const rz = hashRange(species.id, i * 3 + 2, -interior.z * 0.4, interior.z * 0.4);
      const verticalSpread = species.swim_zone === "bottom" ? 0.12 : 0.25;
      const ry = hashRange(species.id, i * 3 + 3, -verticalSpread, verticalSpread);
      out.push({
        offset: [rx, yCentre + ry, rz],
        phase: hash01(species.id, i * 7) * Math.PI * 2,
        amp: school ? 0.25 : 0.55,
        speed: hashRange(
          species.id,
          i * 11 + 5,
          species.active ? 0.6 : 0.42,
          species.active ? 0.86 : 0.68,
        ),
      });
    }
    return out;
  }, [
    species.id,
    species.swim_zone,
    species.is_schooling,
    species.active,
    quantity,
    interior.x,
    interior.y,
    interior.z,
    interior.substrateY,
    centerY,
  ]);


  return (
    <group>
      {instances.map((inst, idx) => (
        <FishRenderer
          key={idx}
          species={species}
          quantity={quantity}
          speciesId={species.id}
          instanceIndex={idx}
          basePosition={inst.offset}
          phase={inst.phase}
          colour={colour}
          profile={profile}
          behaviour={behaviour}
          length={fishLen}
          selected={selected}
          reduced={reduced}
          bounds={interior}
          showFineDetail={quantity <= 20}
          onSelect={onSelect}
        />
      ))}
    </group>
  );
}


interface FishMeshProps {
  speciesId: string;
  instanceIndex: number;
  basePosition: [number, number, number];
  phase: number;
  colour: string;
  profile: FishVisualProfile;
  behaviour: FishBehaviourProfile;
  length: number;
  selected: boolean;
  reduced: boolean;
  bounds: FishGroupProps["interior"];
  showFineDetail: boolean;
  onSelect: () => void;
}

function makeTailShape(style: FishTailStyle, length: number, height: number): THREE.Shape {
  const shape = new THREE.Shape();
  const root = height * 0.32;

  shape.moveTo(0.02, root);

  if (style === "forked") {
    shape.lineTo(-length, height);
    shape.lineTo(-length * 0.72, height * 0.18);
    shape.lineTo(-length * 0.98, 0);
    shape.lineTo(-length * 0.72, -height * 0.18);
    shape.lineTo(-length, -height);
  } else if (style === "flowing") {
    shape.bezierCurveTo(
      -length * 0.35,
      height * 1.22,
      -length * 0.9,
      height * 1.05,
      -length,
      height * 0.62,
    );
    shape.bezierCurveTo(
      -length * 1.08,
      height * 0.15,
      -length * 0.9,
      -height * 0.95,
      -length * 0.65,
      -height,
    );
    shape.bezierCurveTo(-length * 0.34, -height * 0.9, -length * 0.12, -height * 0.48, 0.02, -root);
  } else if (style === "fan") {
    shape.bezierCurveTo(
      -length * 0.45,
      height * 1.05,
      -length * 0.92,
      height * 0.94,
      -length,
      height * 0.62,
    );
    shape.lineTo(-length, -height * 0.62);
    shape.bezierCurveTo(
      -length * 0.92,
      -height * 0.94,
      -length * 0.45,
      -height * 1.05,
      0.02,
      -root,
    );
  } else {
    shape.bezierCurveTo(-length * 0.55, height * 0.95, -length, height * 0.72, -length, 0);
    shape.bezierCurveTo(-length, -height * 0.72, -length * 0.55, -height * 0.95, 0.02, -root);
  }

  shape.lineTo(0.02, root);
  shape.closePath();
  return shape;
}

function makeFinShape(width: number, height: number, swept = false): THREE.Shape {
  const shape = new THREE.Shape();
  shape.moveTo(-width / 2, 0);
  shape.quadraticCurveTo(swept ? width * 0.15 : 0, height, width / 2, 0);
  shape.closePath();
  return shape;
}

function colourSet(colour: string, speciesId: string) {
  const base = new THREE.Color(colour);
  const secondary = base.clone().offsetHSL(hashRange(speciesId, 91, -0.035, 0.055), -0.05, 0.16);
  const accent = base
    .clone()
    .offsetHSL(hashRange(speciesId, 97, 0.08, 0.22), 0.08, hashRange(speciesId, 101, -0.12, 0.05));
  const shadow = base.clone().offsetHSL(-0.015, -0.03, -0.18);

  return {
    base: `#${base.getHexString()}`,
    secondary: `#${secondary.getHexString()}`,
    accent: `#${accent.getHexString()}`,
    shadow: `#${shadow.getHexString()}`,
  };
}

interface MarkingsProps {
  pattern: FishPattern;
  profile: FishVisualProfile;
  speciesId: string;
  instanceIndex: number;
  colour: string;
}

function Markings({ pattern, profile, speciesId, instanceIndex, colour }: MarkingsProps) {
  const z = profile.bodyDepth * 1.02;
  const sides = [-1, 1];

  if (pattern === "none") return null;

  if (pattern === "lateral-stripe") {
    return (
      <>
        {sides.map((side) => (
          <mesh key={side} position={[0.02, -profile.bodyHeight * 0.04, side * z]}>
            <planeGeometry
              args={[profile.bodyHalfLength * 1.45, Math.max(0.018, profile.bodyHeight * 0.17)]}
            />
            <meshBasicMaterial
              color={colour}
              transparent
              opacity={0.88}
              side={THREE.DoubleSide}
              toneMapped={false}
            />
          </mesh>
        ))}
      </>
    );
  }

  if (pattern === "vertical-bands") {
    const bands = [-0.18, 0.02, 0.2];
    return (
      <>
        {sides.flatMap((side) =>
          bands.map((x, index) => (
            <mesh key={`${side}-${index}`} position={[x, 0, side * z]}>
              <planeGeometry
                args={[Math.max(0.025, profile.bodyHalfLength * 0.14), profile.bodyHeight * 1.55]}
              />
              <meshBasicMaterial
                color={colour}
                transparent
                opacity={0.55}
                side={THREE.DoubleSide}
                toneMapped={false}
              />
            </mesh>
          )),
        )}
      </>
    );
  }

  const spots = Array.from({ length: 5 }, (_, index) => ({
    x: hashRange(
      speciesId,
      instanceIndex * 41 + index * 5 + 1,
      -profile.bodyHalfLength * 0.62,
      profile.bodyHalfLength * 0.62,
    ),
    y: hashRange(
      speciesId,
      instanceIndex * 41 + index * 5 + 2,
      -profile.bodyHeight * 0.52,
      profile.bodyHeight * 0.52,
    ),
    size: hashRange(speciesId, instanceIndex * 41 + index * 5 + 3, 0.024, 0.052),
  }));

  return (
    <>
      {sides.flatMap((side) =>
        spots.map((spot, index) => (
          <mesh key={`${side}-${index}`} position={[spot.x, spot.y, side * z]}>
            <circleGeometry args={[spot.size, 10]} />
            <meshBasicMaterial
              color={colour}
              transparent
              opacity={0.78}
              side={THREE.DoubleSide}
              toneMapped={false}
            />
          </mesh>
        )),
      )}
    </>
  );
}

function FishMesh({
  speciesId,
  instanceIndex,
  basePosition,
  phase,
  colour,
  profile,
  behaviour,
  length,
  selected,
  reduced,
  bounds,
  showFineDetail,
  onSelect,
}: FishMeshProps) {
  const groupRef = useRef<THREE.Group>(null);
  const tailRef = useRef<THREE.Mesh>(null);
  const leftPectoralRef = useRef<THREE.Mesh>(null);
  const rightPectoralRef = useRef<THREE.Mesh>(null);
  const target = useMemo(() => new THREE.Vector3(), []);
  const colours = useMemo(() => colourSet(colour, speciesId), [colour, speciesId]);
  const tailShape = useMemo(
    () => makeTailShape(profile.tailStyle, profile.tailLength, profile.tailHeight),
    [profile.tailStyle, profile.tailLength, profile.tailHeight],
  );
  const dorsalShape = useMemo(
    () =>
      makeFinShape(
        profile.bodyHalfLength * 1.15,
        profile.dorsalHeight,
        profile.bodyStyle === "flowing",
      ),
    [profile.bodyHalfLength, profile.dorsalHeight, profile.bodyStyle],
  );
  const ventralShape = useMemo(
    () =>
      makeFinShape(
        profile.bodyHalfLength * 0.82,
        profile.ventralHeight,
        profile.bodyStyle === "flowing",
      ),
    [profile.bodyHalfLength, profile.ventralHeight, profile.bodyStyle],
  );

  useFrame(({ clock }, delta) => {
    const g = groupRef.current;
    if (!g) return;

    if (reduced) {
      g.position.set(basePosition[0], basePosition[1], basePosition[2]);
      g.rotation.set(0, 0, 0);
      return;
    }

    const t = clock.getElapsedTime();

    // Group-level phase (shared across all instances of this species).
    const groupPhase = hash01(speciesId, 999) * Math.PI * 2;
    const cohesion = behaviour.schoolingCohesion;
    const wander = behaviour.individualWander;

    // Shared group orbit — larger, slower path used when cohesion is high.
    const gT = t * behaviour.cruiseSpeed + groupPhase;
    const gx = Math.sin(gT * 0.6) * behaviour.rangeX * bounds.x * 0.5;
    const gz = Math.cos(gT * 0.42) * behaviour.rangeZ * bounds.z * 0.5;
    const gy = Math.sin(gT * 0.3) * behaviour.verticalRange * bounds.y * 0.5;

    // Per-instance wander overlaid on top.
    const iT = t * behaviour.cruiseSpeed * (0.85 + (instanceIndex % 5) * 0.06) + phase;
    const ix = Math.sin(iT * 1.15) * behaviour.rangeX * bounds.x * 0.38 * wander;
    const iz = Math.cos(iT * 0.93) * behaviour.rangeZ * bounds.z * 0.38 * wander;
    const iy = Math.sin(iT * 1.3) * behaviour.verticalRange * bounds.y * 0.42 * wander;

    // Burst modulation — occasional darts for active/predatory species.
    const burstCycle = Math.sin(t * 0.55 + phase * 2.7);
    const burst = burstCycle > 0.72 ? (burstCycle - 0.72) / 0.28 : 0;
    const speedMul = 1 + burst * behaviour.burstStrength * 1.5;

    // Pause envelope — slows movement periodically for hoverers, grazers.
    const pauseCycle = (Math.sin(t * 0.24 + phase * 1.7) + 1) * 0.5;
    const pauseMul = 1 - pauseCycle * behaviour.pauseStrength * 0.85;

    let dx = (gx * cohesion + ix) * speedMul * pauseMul;
    let dz = (gz * cohesion + iz) * speedMul * pauseMul;
    let dy = gy * cohesion + iy;

    // Occasional rise toward the surface for labyrinth fish.
    if (behaviour.surfaceVisit > 0) {
      const surface = (Math.sin(t * 0.18 + phase * 0.9) + 1) * 0.5;
      dy += surface * behaviour.surfaceVisit * bounds.y * 0.35;
    }

    // Extra lateral wiggle for slender bottom fish (kuhli, loach).
    if (behaviour.bodyWiggle > 0) {
      dz += Math.sin(t * behaviour.tailFrequency * 0.45 + phase) * behaviour.bodyWiggle * 0.35;
      dx += Math.cos(t * behaviour.tailFrequency * 0.35 + phase) * behaviour.bodyWiggle * 0.2;
    }

    // Forage — nose down and pause periodically for bottom feeders/grazers.
    let foragePitch = 0;
    if (behaviour.forageStrength > 0) {
      const f = Math.sin(t * 0.5 + phase * 1.3);
      if (f > 0.6) {
        const k = (f - 0.6) / 0.4;
        foragePitch = -k * behaviour.forageStrength * behaviour.maxPitch * 1.8;
        dx *= 1 - k * 0.6;
        dz *= 1 - k * 0.6;
      }
    }

    const modelHalfLength = length * (profile.bodyHalfLength + profile.tailLength + 0.2);
    const horizontalMargin = Math.max(0.12, modelHalfLength);
    const depthMargin = Math.max(0.1, length * profile.bodyDepth * 1.6);
    const verticalMargin = Math.max(0.1, length * (profile.bodyHeight + profile.dorsalHeight));

    const nx = THREE.MathUtils.clamp(
      basePosition[0] + dx,
      -bounds.x / 2 + horizontalMargin,
      bounds.x / 2 - horizontalMargin,
    );
    const nz = THREE.MathUtils.clamp(
      basePosition[2] + dz,
      -bounds.z / 2 + depthMargin,
      bounds.z / 2 - depthMargin,
    );
    const ny = THREE.MathUtils.clamp(
      basePosition[1] + dy,
      bounds.substrateY + verticalMargin,
      bounds.y / 2 - verticalMargin,
    );

    target.set(nx, ny, nz);
    g.position.lerp(target, Math.min(delta * 2.25, 1));

    // Heading — derivative of the path, combining group + individual.
    const vx =
      Math.cos(gT * 0.6) * 0.6 * behaviour.rangeX * bounds.x * 0.5 * cohesion +
      Math.cos(iT * 1.15) * 1.15 * behaviour.rangeX * bounds.x * 0.38 * wander;
    const vz =
      -Math.sin(gT * 0.42) * 0.42 * behaviour.rangeZ * bounds.z * 0.5 * cohesion -
      Math.sin(iT * 0.93) * 0.93 * behaviour.rangeZ * bounds.z * 0.38 * wander;
    const desiredHeading = Math.atan2(-vz, vx);
    const headingDelta = Math.atan2(
      Math.sin(desiredHeading - g.rotation.y),
      Math.cos(desiredHeading - g.rotation.y),
    );
    g.rotation.y += headingDelta * Math.min(delta * behaviour.turnRate * 0.85, 1);
    g.rotation.z = Math.sin(t * behaviour.tailFrequency * 0.14 + phase) * behaviour.bodyRoll;
    g.rotation.x =
      foragePitch + Math.sin(t * 0.42 + phase * 0.7) * behaviour.maxPitch * 0.15;

    // Tail beat scales with speed.
    const tailFreq = behaviour.tailFrequency * (0.55 + speedMul * 0.55) * pauseMul + 0.6;
    const tailBeat = Math.sin(t * tailFreq + phase) * behaviour.tailAmplitude;
    if (tailRef.current) tailRef.current.rotation.y = tailBeat;
    if (leftPectoralRef.current)
      leftPectoralRef.current.rotation.x =
        -0.45 + Math.sin(t * behaviour.pectoralFrequency + phase) * 0.18;
    if (rightPectoralRef.current)
      rightPectoralRef.current.rotation.x =
        0.45 - Math.sin(t * behaviour.pectoralFrequency + phase) * 0.18;
  });

  const bodyY = profile.bodyStyle === "bottom" ? -profile.bodyHeight * 0.12 : 0;
  const headX = profile.bodyHalfLength * 0.62;
  const tailRootX = -profile.bodyHalfLength * 0.88;
  const eyeX = headX + profile.headLength * 0.42;
  const eyeY = bodyY + profile.bodyHeight * 0.28;
  const eyeZ = profile.bodyDepth * 0.92;

  return (
    <group
      ref={groupRef}
      position={basePosition}
      scale={length}
      onPointerDown={(event) => {
        event.stopPropagation();
        onSelect();
      }}
    >
      {/* Main tapered body */}
      <mesh
        position={[0, bodyY, 0]}
        scale={[profile.bodyHalfLength, profile.bodyHeight, profile.bodyDepth]}
      >
        <sphereGeometry args={[1, 20, 14]} />
        <meshPhysicalMaterial
          color={colours.base}
          roughness={0.34}
          metalness={0.03}
          clearcoat={0.28}
          clearcoatRoughness={0.3}
        />
      </mesh>

      {/* Softer, lighter head gives the silhouette a natural taper. */}
      <mesh
        position={[headX, bodyY - profile.bodyHeight * 0.02, 0]}
        scale={[profile.headLength, profile.bodyHeight * 0.82, profile.bodyDepth * 0.9]}
      >
        <sphereGeometry args={[1, 18, 12]} />
        <meshPhysicalMaterial
          color={colours.secondary}
          roughness={0.36}
          metalness={0.02}
          clearcoat={0.22}
          clearcoatRoughness={0.34}
        />
      </mesh>

      {/* Tail base prevents the tail from looking glued to a sphere. */}
      <mesh
        position={[tailRootX + 0.03, bodyY, 0]}
        scale={[0.14, profile.bodyHeight * 0.46, profile.bodyDepth * 0.52]}
      >
        <sphereGeometry args={[1, 14, 10]} />
        <meshStandardMaterial color={colours.shadow} roughness={0.45} />
      </mesh>

      <mesh ref={tailRef} position={[tailRootX, bodyY, -0.002]}>
        <shapeGeometry args={[tailShape, 10]} />
        <meshStandardMaterial
          color={colours.accent}
          transparent
          opacity={profile.finOpacity}
          roughness={0.4}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>

      {/* Dorsal and ventral fins */}
      <mesh position={[-0.03, bodyY + profile.bodyHeight * 0.83, 0]}>
        <shapeGeometry args={[dorsalShape, 8]} />
        <meshStandardMaterial
          color={colours.accent}
          transparent
          opacity={profile.finOpacity * 0.92}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>
      <mesh position={[-0.04, bodyY - profile.bodyHeight * 0.78, 0]} rotation={[0, 0, Math.PI]}>
        <shapeGeometry args={[ventralShape, 8]} />
        <meshStandardMaterial
          color={colours.accent}
          transparent
          opacity={profile.finOpacity * 0.82}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>

      {/* Pectoral fins add movement and depth from angled camera views. */}
      {showFineDetail && (
        <>
          <mesh
            ref={leftPectoralRef}
            position={[
              profile.bodyHalfLength * 0.2,
              bodyY - profile.bodyHeight * 0.02,
              profile.bodyDepth * 0.86,
            ]}
            rotation={[-0.45, 0.18, -0.45]}
            scale={[profile.pectoralSize, profile.pectoralSize * 0.55, profile.pectoralSize * 0.08]}
          >
            <coneGeometry args={[1, 1.35, 3]} />
            <meshStandardMaterial
              color={colours.secondary}
              transparent
              opacity={profile.finOpacity * 0.72}
              side={THREE.DoubleSide}
              depthWrite={false}
            />
          </mesh>
          <mesh
            ref={rightPectoralRef}
            position={[
              profile.bodyHalfLength * 0.2,
              bodyY - profile.bodyHeight * 0.02,
              -profile.bodyDepth * 0.86,
            ]}
            rotation={[0.45, -0.18, 0.45]}
            scale={[profile.pectoralSize, profile.pectoralSize * 0.55, profile.pectoralSize * 0.08]}
          >
            <coneGeometry args={[1, 1.35, 3]} />
            <meshStandardMaterial
              color={colours.secondary}
              transparent
              opacity={profile.finOpacity * 0.72}
              side={THREE.DoubleSide}
              depthWrite={false}
            />
          </mesh>
        </>
      )}

      {showFineDetail && (
        <Markings
          pattern={profile.pattern}
          profile={profile}
          speciesId={speciesId}
          instanceIndex={instanceIndex}
          colour={colours.accent}
        />
      )}

      {/* Eyes: pale iris, dark pupil and a tiny highlight. */}
      {[-1, 1].map((side) => (
        <group key={side}>
          <mesh position={[eyeX, eyeY, side * eyeZ]} scale={profile.eyeScale}>
            <sphereGeometry args={[1, 14, 10]} />
            <meshStandardMaterial color="#eef7f4" roughness={0.25} />
          </mesh>
          <mesh
            position={[
              eyeX + profile.eyeScale * 0.15,
              eyeY,
              side * (eyeZ + profile.eyeScale * 0.62),
            ]}
            scale={profile.eyeScale * 0.58}
          >
            <sphereGeometry args={[1, 12, 8]} />
            <meshStandardMaterial color="#101b20" roughness={0.2} />
          </mesh>
          {showFineDetail && (
            <mesh
              position={[
                eyeX + profile.eyeScale * 0.31,
                eyeY + profile.eyeScale * 0.28,
                side * (eyeZ + profile.eyeScale * 1.05),
              ]}
              scale={profile.eyeScale * 0.16}
            >
              <sphereGeometry args={[1, 8, 6]} />
              <meshBasicMaterial color="#ffffff" toneMapped={false} />
            </mesh>
          )}
        </group>
      ))}

      {/* Mouth and a subtle gill mark */}
      <mesh
        position={[headX + profile.headLength * 0.88, bodyY - profile.bodyHeight * 0.12, 0]}
        scale={[profile.mouthScale * 0.5, profile.mouthScale * 0.24, profile.bodyDepth * 0.42]}
      >
        <sphereGeometry args={[1, 10, 8]} />
        <meshStandardMaterial color={colours.shadow} roughness={0.55} />
      </mesh>

      {showFineDetail &&
        [-1, 1].map((side) => (
          <mesh
            key={side}
            position={[headX - profile.headLength * 0.22, bodyY, side * profile.bodyDepth * 1.025]}
            rotation={[0, 0, Math.PI * 0.5]}
            scale={[profile.bodyHeight * 0.38, profile.bodyHeight * 0.56, 1]}
          >
            <torusGeometry args={[0.18, 0.018, 4, 14, Math.PI * 0.8]} />
            <meshBasicMaterial
              color={colours.shadow}
              transparent
              opacity={0.5}
              side={THREE.DoubleSide}
              toneMapped={false}
            />
          </mesh>
        ))}

      {/* Bottom-dweller barbels and gourami/angel feelers. */}
      {showFineDetail &&
        profile.hasBarbels &&
        [-1, 1].map((side) => (
          <mesh
            key={side}
            position={[
              headX + profile.headLength * 0.74,
              bodyY - profile.bodyHeight * 0.34,
              side * profile.bodyDepth * 0.38,
            ]}
            rotation={[0, 0, side * 0.35]}
          >
            <cylinderGeometry args={[0.008, 0.003, 0.22, 6]} />
            <meshStandardMaterial color={colours.shadow} roughness={0.7} />
          </mesh>
        ))}

      {showFineDetail &&
        profile.hasFeelers &&
        [-1, 1].map((side) => (
          <mesh
            key={side}
            position={[
              profile.bodyHalfLength * 0.12,
              bodyY - profile.bodyHeight * 0.72,
              side * profile.bodyDepth * 0.35,
            ]}
            rotation={[0, 0, side * 0.12]}
          >
            <cylinderGeometry args={[0.006, 0.002, profile.ventralHeight * 1.55 + 0.2, 6]} />
            <meshStandardMaterial color={colours.accent} transparent opacity={0.72} />
          </mesh>
        ))}

      {selected && (
        <mesh
          rotation={[-Math.PI / 2, 0, 0]}
          position={[0, -Math.max(0.3, profile.bodyHeight + profile.ventralHeight + 0.12), 0]}
        >
          <ringGeometry args={[0.48, 0.61, 36]} />
          <meshBasicMaterial
            color="#B8E84A"
            transparent
            opacity={0.9}
            side={THREE.DoubleSide}
            toneMapped={false}
          />
        </mesh>
      )}
    </group>
  );
}
