import { Html } from "@react-three/drei";
import { useMemo } from "react";
import type { Plant } from "@/lib/types";
import { SpeciesPortrait } from "@/components/SpeciesPortrait";
import { hashRange } from "./palette";

interface PlantClumpProps {
  plant: Plant;
  quantity: number;
  interior: { x: number; y: number; z: number; substrateY: number };
  groundY?: number;
}

/**
 * Uses an accurate, permissively licensed observation as the fallback until
 * a botanically verified 3D model is installed for this exact taxon.
 */
export function PlantClump({ plant, quantity, interior, groundY }: PlantClumpProps) {
  const y = groundY ?? interior.substrateY;
  const position = useMemo<[number, number, number]>(
    () => [
      hashRange(plant.id, 11, -interior.x * 0.24, interior.x * 0.24),
      y + 0.62,
      hashRange(plant.id, 17, -interior.z * 0.2, interior.z * 0.2),
    ],
    [plant.id, interior.x, interior.z, y],
  );

  return (
    <group position={position}>
      <mesh scale={[0.42, 0.72, 0.12]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
      <Html center sprite distanceFactor={7} zIndexRange={[18, 0]}>
        <div className="pointer-events-none w-24 overflow-hidden rounded-t-[2rem] rounded-b-xl border-2 border-white/80 bg-white shadow-[0_8px_24px_rgba(18,35,46,.2)]">
          <SpeciesPortrait
            commonName={plant.common_name}
            scientificName={plant.scientific_name}
            compact
            className="aspect-[3/4] w-full"
          />
          <div className="bg-ink px-2 py-1.5 text-center text-[8px] font-semibold leading-tight text-white">
            {plant.common_name}
            {quantity > 1 ? <span className="ml-1 text-lime">×{quantity}</span> : null}
            <span className="mt-0.5 block font-normal italic text-white/55">
              photographic reference
            </span>
          </div>
        </div>
      </Html>
    </group>
  );
}
