import { useRef, useMemo, useState, useEffect } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";

const BIN_COLORS = {
  Pass: new THREE.Color("#10b981"),
  "Fail-Low": new THREE.Color("#ef4444"),
  "Fail-High": new THREE.Color("#f59e0b"),
};
const DEFAULT_COLOR = new THREE.Color("#64748b");

function WaferInstancedMesh({ waferData, setHoverInfo }) {
  const meshRef = useRef();

  const { instances, radius } = useMemo(() => {
    const gridX = waferData.die_size.x;
    const gridY = waferData.die_size.y;
    const radius = Math.min(gridX, gridY) / 2;
    
    // Calculate logical center
    const cx = gridX / 2;
    const cy = gridY / 2;

    const dataInstances = [];

    Object.entries(waferData.bins).forEach(([key, bin], i) => {
      const [x, y] = key.split(',').map(Number);
      
      // Calculate position relative to center so the wafer is centered at 0,0,0
      const posX = x - cx + 0.5;
      const posZ = y - cy + 0.5;
      
      // Height proportional to value. 
      // Map 0-100 to 0.2-8 units of 3D height.
      const height = Math.max(0.2, (bin.value / 100) * 8);
      const posY = height / 2; // Center of the box so bottom touches Y=0

      dataInstances.push({
        id: i,
        key,
        position: [posX, posY, posZ],
        scale: [0.85, height, 0.85], // 15% gap between dies
        color: BIN_COLORS[bin.binCategory] || DEFAULT_COLOR,
        userData: { x, y, value: bin.value, binCategory: bin.binCategory }
      });
    });

    return { instances: dataInstances, radius };
  }, [waferData]);

  // Apply matrix and colors to InstancedMesh
  useEffect(() => {
    if (!meshRef.current) return;
    const dummy = new THREE.Object3D();
    instances.forEach((inst, i) => {
      dummy.position.set(...inst.position);
      dummy.scale.set(...inst.scale);
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
      meshRef.current.setColorAt(i, inst.color);
    });
    meshRef.current.instanceMatrix.needsUpdate = true;
    if (meshRef.current.instanceColor) {
      meshRef.current.instanceColor.needsUpdate = true;
    }
  }, [instances]);

  const handlePointerMove = (e) => {
    e.stopPropagation();
    const instanceId = e.instanceId;
    if (instanceId !== undefined && instances[instanceId]) {
      setHoverInfo({
        ...instances[instanceId].userData,
        // Map 3D pointer to 2D screen coordinate for the tooltip
        clientX: e.clientX,
        clientY: e.clientY
      });
    }
  };

  const handlePointerOut = () => {
    setHoverInfo(null);
  };

  return (
    <group>
      <instancedMesh 
        ref={meshRef} 
        args={[null, null, instances.length]}
        onPointerMove={handlePointerMove}
        onPointerOut={handlePointerOut}
        castShadow
        receiveShadow
      >
        <boxGeometry args={[1, 1, 1]} />
        {/* Slightly shiny material for the bars */}
        <meshStandardMaterial roughness={0.3} metalness={0.2} />
      </instancedMesh>
      
      {/* Physical Wafer Base */}
      <mesh position={[0, -0.5, 0]} receiveShadow>
        <cylinderGeometry args={[radius + 1, radius + 1, 1, 64]} />
        <meshStandardMaterial color="#1a1d24" roughness={0.9} metalness={0.1} />
      </mesh>
      
      {/* Outer Rim Ring */}
      <mesh position={[0, -0.4, 0]} receiveShadow>
        <torusGeometry args={[radius + 1, 0.2, 16, 100]} />
        <meshStandardMaterial color="#2d333b" roughness={0.5} metalness={0.8} />
      </mesh>
    </group>
  );
}

export default function Wafer3D({ waferData }) {
  const [hoverInfo, setHoverInfo] = useState(null);

  // We determine a suitable camera distance based on wafer size
  const camDistance = Math.max(waferData.die_size.x, waferData.die_size.y) * 1.1;

  return (
    <div style={{ position: "relative", width: "100%", height: "100%", minHeight: "400px" }}>
      <Canvas 
        camera={{ position: [0, camDistance * 0.7, camDistance], fov: 45 }}
        style={{ width: "100%", height: "100%", background: "transparent", cursor: hoverInfo ? 'pointer' : 'grab' }}
        gl={{ antialias: true }}
        shadows
      >
        <ambientLight intensity={0.6} />
        <directionalLight 
          position={[20, 30, 20]} 
          intensity={1.2} 
          castShadow 
          shadow-mapSize-width={2048} 
          shadow-mapSize-height={2048}
        />
        <directionalLight position={[-10, 10, -10]} intensity={0.4} />
        
        <WaferInstancedMesh waferData={waferData} setHoverInfo={setHoverInfo} />
        
        <OrbitControls 
          enablePan={true}
          enableZoom={true}
          enableRotate={true}
          maxPolarAngle={Math.PI / 2 - 0.05} // Prevent camera from going completely under the wafer
          minDistance={10}
          maxDistance={200}
        />
      </Canvas>

      {/* Tooltip rendered in HTML overlay */}
      {hoverInfo && (
        <div
          className="wafer-tooltip"
          style={{
            left: hoverInfo.clientX + 15,
            top: hoverInfo.clientY + 15,
            border: `1px solid ${
              hoverInfo.binCategory === 'Pass' ? '#10b981' : 
              hoverInfo.binCategory === 'Fail-Low' ? '#ef4444' : '#f59e0b'
            }`,
            zIndex: 1000
          }}
        >
          <div style={{ fontWeight: 600, marginBottom: 4 }}>
            Die ({hoverInfo.x}, {hoverInfo.y})
          </div>
          <div>Value: <b>{hoverInfo.value}</b></div>
          <div>
            Bin:{" "}
            <span style={{ 
              fontWeight: 600,
              color: 
                hoverInfo.binCategory === 'Pass' ? '#10b981' : 
                hoverInfo.binCategory === 'Fail-Low' ? '#ef4444' : '#f59e0b'
            }}>
              {hoverInfo.binCategory}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
