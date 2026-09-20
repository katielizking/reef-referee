interface Props {
  label?: string;
}

/**
 * Minimal filter/heater block. Rendered by TankScene inside a DragGroup that
 * snaps to the back glass.
 */
export function EquipmentMesh(_props: Props) {
  return (
    <group>
      <mesh position={[0, 0.55, 0]}>
        <boxGeometry args={[0.5, 1.1, 0.28]} />
        <meshStandardMaterial color="#1f2937" roughness={0.6} />
      </mesh>
      <mesh position={[0, 1.15, 0.12]}>
        <cylinderGeometry args={[0.06, 0.06, 0.25, 12]} />
        <meshStandardMaterial color="#94a3b8" />
      </mesh>
    </group>
  );
}
