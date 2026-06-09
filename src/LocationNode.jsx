import { Handle, Position } from 'reactflow';

export default function LocationNode({ data }) {
  return (
    <div style={{
      background: '#2d4a7a',
      border: '2px solid #4a7abf',
      borderRadius: '8px',
      minWidth: '180px',
      color: 'white',
      fontFamily: 'sans-serif'
    }}>
      <div style={{
        background: '#4a7abf',
        padding: '6px 10px',
        borderRadius: '6px 6px 0 0',
        fontSize: '11px',
        letterSpacing: '2px',
        textAlign:'center'
      }}>
        LOCATION
      </div>
      <div style={{ padding: '10px', textAlign: 'center', fontWeight: 'bold' }}>
        {data.label}
      </div>

      <Handle type="source" position={Position.Top} id="north" style={{ left: '50%' }} />
      <Handle type="source" position={Position.Bottom} id="south" style={{ left: '50%' }} />
      <Handle type="source" position={Position.Left} id="west" style={{ top: '50%' }} />
      <Handle type="source" position={Position.Right} id="east" style={{ top: '50%' }} />
    </div>
  );
}