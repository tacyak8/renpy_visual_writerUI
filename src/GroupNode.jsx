import { NodeResizer } from 'reactflow';

export default function GroupNode({ data, selected }) {
  const color = data.color || '#4a7abf';
  const isRegion = data.kind === 'region';

  return (
    <>
      {/* Drag any edge/corner to resize. Handles are always grabbable since the
          group box itself is click-through (so nodes underneath stay selectable). */}
      <NodeResizer
        color={color}
        isVisible={true}
        minWidth={160}
        minHeight={120}
        lineStyle={{ borderColor: color, opacity: 0.5 }}
        handleStyle={{ width: '9px', height: '9px', borderRadius: '2px', background: color, border: '1px solid #1a1a2e' }}
      />
      <div style={{
        width: '100%',
        height: '100%',
        border: isRegion ? `2px dotted ${color}` : `2px dashed ${color}`,
        borderRadius: '12px',
        background: isRegion ? `${color}08` : `${color}11`,
        pointerEvents: 'none',
        position: 'relative',
      }}>
        <div style={{
          position: 'absolute',
          top: '-14px',
          left: '16px',
          background: isRegion ? '#1a1a2e' : color,
          color: isRegion ? color : '#1a1a2e',
          border: isRegion ? `1px solid ${color}` : 'none',
          fontWeight: 'bold',
          fontSize: '12px',
          padding: '2px 10px',
          borderRadius: '10px',
          letterSpacing: '1px',
          pointerEvents: 'all',
          cursor: 'pointer',
          userSelect: 'none',
        }}>
          {isRegion ? `◇ ${data.label}` : data.label}
        </div>
      </div>
    </>
  );
}
