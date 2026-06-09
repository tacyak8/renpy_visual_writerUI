import { Handle, Position } from 'reactflow';

export default function TransitionNode({ data }) {
  const modeColors = {
    always: '#b0860a',
    once: '#2a7a8a',
    trigger: '#8a2a7a'
  };
  const mode = data.mode || 'always';
  const color = modeColors[mode];

  return (
    <div style={{
      background: '#2a2a2a',
      border: `2px solid ${color}`,
      borderRadius: '8px',
      minWidth: '160px',
      color: 'white',
      fontFamily: 'sans-serif',
      position: 'relative',
    }}>
      <div style={{
        background: color,
        padding: '6px 10px',
        borderRadius: '6px 6px 0 0',
        fontSize: '11px',
        letterSpacing: '2px',
        textAlign: 'center',
        color: '#1a1a2e'
      }}>
        TRANSITION
      </div>
      <div style={{ padding: '8px 10px', textAlign: 'center', fontWeight: 'bold', fontSize: '13px' }}>
        {data.label}
      </div>
      <div style={{ padding: '0 10px 8px', textAlign: 'center', fontSize: '10px', color: color }}>
        {mode === 'always' && '🔁 Always plays'}
        {mode === 'once' && '⭐ Plays once'}
        {mode === 'trigger' && `⚡ ${data.trigger || 'Trigger'}`}
      </div>

      <Handle type="target" position={Position.Left} id="in" style={{ top: '50%' }} />
      <Handle type="source" position={Position.Left} id="in-src" style={{ top: '50%', left: '-1px' }} />
      <Handle type="target" position={Position.Right} id="out-tgt" style={{ top: '50%' }} />
      <Handle type="source" position={Position.Right} id="out" style={{ top: '50%', right: '-1px' }} />
    </div>
  );
}