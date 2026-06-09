import { Handle, Position } from 'reactflow';

export default function SceneNode({ data }) {
  const choices = data.choices || [];
  const totalHandles = choices.length + 1;
  const spacing = 100 / (totalHandles + 1);

  return (
    <div style={{
      background: '#2d5a3a',
      border: '2px solid #4abf6a',
      borderRadius: '8px',
      minWidth: '200px',
      color: 'white',
      fontFamily: 'sans-serif',
      position: 'relative',
    }}>
      <div style={{
        background: '#4abf6a',
        padding: '6px 10px',
        borderRadius: '6px 6px 0 0',
        fontSize: '11px',
        letterSpacing: '2px',
        textAlign: 'center',
        color: '#1a1a2e'
      }}>
        SCENE
      </div>

      <div style={{ padding: '10px', textAlign: 'center', fontWeight: 'bold', fontSize: '14px' }}>
        {data.label}
      </div>

      {/* Input handle on left */}
      <Handle type="target" position={Position.Left} id="in" style={{ top: '50%' }} />

      {/* Default output - top right */}
      <div style={{
        position: 'absolute',
        right: '18px',
        top: `${spacing}%`,
        transform: 'translateY(-50%)',
        fontSize: '9px',
        color: '#aaffaa',
        whiteSpace: 'nowrap',
        pointerEvents: 'none'
      }}>
        continue
      </div>
      <Handle
        type="source"
        position={Position.Right}
        id="out_default"
        style={{ top: `${spacing}%` }}
      />

      {/* Choice outputs */}
      {choices.map((choice, i) => (
        <div key={i}>
          <div style={{
            position: 'absolute',
            right: '18px',
            top: `${spacing * (i + 2)}%`,
            transform: 'translateY(-50%)',
            fontSize: '9px',
            color: '#aaffaa',
            whiteSpace: 'nowrap',
            maxWidth: '120px',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            pointerEvents: 'none',
            textAlign: 'right'
          }}>
            {String.fromCharCode(65 + i)}
          </div>
          <Handle
            type="source"
            position={Position.Right}
            id={`out_choice_${i}`}
            style={{ top: `${spacing * (i + 2)}%` }}
          />
        </div>
      ))}

      {/* Spacer so node is tall enough for all handles */}
      <div style={{ height: `${Math.max(0, choices.length) * 24}px` }} />
    </div>
  );
}