import { NodeResizer, useReactFlow } from 'reactflow';

// A canvas-only sticky note. Free text the user can type into; ignored entirely
// by the script generator. Self-saves its title/text straight to node data.
export default function NoteNode({ id, data, selected }) {
  const { setNodes } = useReactFlow();
  const color = data.color || '#f4d35e';

  const update = (changes) =>
    setNodes(ns => ns.map(n => (n.id === id ? { ...n, data: { ...n.data, ...changes } } : n)));
  const remove = () => setNodes(ns => ns.filter(n => n.id !== id));

  return (
    <div style={{
      width: '100%',
      height: '100%',
      background: color,
      color: '#1a1a2e',
      borderRadius: '6px',
      boxShadow: '0 2px 10px rgba(0,0,0,0.35)',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      border: selected ? '2px solid #1a1a2e' : '2px solid rgba(0,0,0,0.15)',
      boxSizing: 'border-box',
    }}>
      <NodeResizer color="#1a1a2e" isVisible={selected} minWidth={180} minHeight={120} />

      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '4px 6px', background: 'rgba(0,0,0,0.10)' }}>
        <span style={{ fontSize: '12px' }}>📝</span>
        <input
          className="nodrag"
          value={data.title || ''}
          onChange={e => update({ title: e.target.value })}
          placeholder="Note"
          style={{ flex: 1, background: 'transparent', border: 'none', fontWeight: 'bold', fontSize: '12px', color: '#1a1a2e', outline: 'none', minWidth: 0 }}
        />
        <button
          className="nodrag"
          onClick={remove}
          title="Delete note"
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#1a1a2e', fontSize: '12px', lineHeight: 1, padding: '0 2px' }}
        >
          ✕
        </button>
      </div>

      <textarea
        className="nodrag nowheel"
        value={data.text || ''}
        onChange={e => update({ text: e.target.value })}
        placeholder="Type a note..."
        style={{
          flex: 1,
          width: '100%',
          background: 'transparent',
          border: 'none',
          resize: 'none',
          padding: '8px',
          fontSize: '12px',
          lineHeight: '1.45',
          color: '#1a1a2e',
          outline: 'none',
          fontFamily: 'inherit',
          boxSizing: 'border-box',
        }}
      />
    </div>
  );
}
