import { Handle, Position } from 'reactflow';

export default function ShopNode({ data, selected }) {
  return (
    <div style={{
      background: '#1a3a3a',
      border: `2px solid ${selected ? '#4abfbf' : '#2a6a6a'}`,
      borderRadius: '8px',
      padding: '10px 16px',
      minWidth: '150px',
      color: 'white',
      textAlign: 'center',
      fontFamily: 'sans-serif',
    }}>
      <div style={{ fontSize: '20px' }}>🛒</div>
      <div style={{ fontWeight: 'bold', fontSize: '13px' }}>{data.label || 'Shop'}</div>

      {/* reactflow has no Position.North/South — Top/Bottom/Left/Right are the real enum values. */}
      <Handle type="source" position={Position.Top} id="north" style={{ left: '50%', background: '#4abfbf' }} />
      <Handle type="source" position={Position.Bottom} id="south" style={{ left: '50%', background: '#4abfbf' }} />
      <Handle type="source" position={Position.Right} id="east" style={{ top: '50%', background: '#4abfbf' }} />
      <Handle type="source" position={Position.Left} id="west" style={{ top: '50%', background: '#4abfbf' }} />
    </div>
  );
}
