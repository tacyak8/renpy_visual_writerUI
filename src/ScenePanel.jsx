import { useState } from 'react';

const inputStyle = { width: '100%', background: '#2a2a3e', border: '1px solid #444', color: 'white', padding: '4px', borderRadius: '4px', boxSizing: 'border-box', marginBottom: '4px' };
const labelStyle = { color: '#aaa', fontSize: '11px', display: 'block', marginBottom: '2px' };
const selectStyle = { ...inputStyle, padding: '4px' };

const BLOCK_TYPES = [
  { type: 'dialogue', label: '💬 Dialogue' },
  { type: 'item', label: '🎒 Item' },
  { type: 'sprite', label: '🧍 Sprite' },
  { type: 'bg', label: '🖼 BG Change' },
  { type: 'stat', label: '📊 Stat' },
  { type: 'pause', label: '⏸ Pause' },
  { type: 'gif', label: '🎞 GIF/Video' },
  { type: 'audio', label: '🔊 Audio' },
];

function SceneBlock({ item, onRemove, onUpdate, gameData }) {
  const characters = gameData?.characters || [];
  const pointSystems = gameData?.pointSystems || [];
  const items = gameData?.items || [];
  const update = (changes) => onUpdate(changes);

  return (
    <div style={{ background: '#111827', borderRadius: '4px', padding: '6px', marginBottom: '6px', position: 'relative' }}>
      <button onClick={onRemove} style={{ position: 'absolute', top: '4px', right: '4px', background: 'none', border: 'none', color: '#888', cursor: 'pointer', fontSize: '12px' }}>✕</button>

      {item.type === 'dialogue' && (
        <div>
          <select value={item.speaker || 'narrator'} onChange={e => update({ speaker: e.target.value })} style={selectStyle}>
            <option value="narrator">Narrator</option>
            <option value="player">Player</option>
            {characters.map(c => <option key={c.id} value={c.variable}>{c.name}</option>)}
          </select>
          <input placeholder="Sprite name (optional)" value={item.sprite || ''} onChange={e => update({ sprite: e.target.value })} style={inputStyle} />
          <textarea placeholder="Dialogue text..." value={item.text || ''} onChange={e => update({ text: e.target.value })} rows={2} style={{ ...inputStyle, resize: 'vertical' }} />
        </div>
      )}
      {item.type === 'item' && (
        <div>
          <select value={item.action || 'give'} onChange={e => update({ action: e.target.value })} style={selectStyle}>
            <option value="give">Give Item to Player</option>
            <option value="take">Take Item from Player</option>
            <option value="reveal">Reveal Item in Location</option>
          </select>
          <label style={labelStyle}>Item</label>
          <select value={item.itemName || ''} onChange={e => update({ itemName: e.target.value })} style={selectStyle}>
            <option value="">Select item...</option>
            {items.map(i => <option key={i.id} value={i.variable}>{i.name}</option>)}
          </select>
          <label style={labelStyle}>Display image (optional)</label>
          <input placeholder="item_image_name" value={item.itemImage || ''} onChange={e => update({ itemImage: e.target.value })} style={inputStyle} />
          <label style={labelStyle}>Narrator text (optional)</label>
          <textarea placeholder="Narrator description..." value={item.narratorText || ''} onChange={e => update({ narratorText: e.target.value })} rows={2} style={{ ...inputStyle, resize: 'vertical' }} />
        </div>
      )}
      {item.type === 'sprite' && (
        <div>
          <label style={labelStyle}>Show sprite</label>
          <input placeholder="char_a_expression1" value={item.sprite || ''} onChange={e => update({ sprite: e.target.value })} style={inputStyle} />
        </div>
      )}
      {item.type === 'bg' && (
        <div>
          <label style={labelStyle}>Change background to</label>
          <input placeholder="bg_image_name" value={item.bg || ''} onChange={e => update({ bg: e.target.value })} style={inputStyle} />
        </div>
      )}
      {item.type === 'stat' && (
        <div>
          <label style={labelStyle}>Change stat</label>
          <select value={item.stat || ''} onChange={e => update({ stat: e.target.value })} style={selectStyle}>
            <option value="">Select stat...</option>
            {pointSystems.map(s => <option key={s.id} value={s.variable}>{s.name}</option>)}
          </select>
          <input placeholder="amount (e.g. +1 or -2)" value={item.amount || ''} onChange={e => update({ amount: e.target.value })} style={inputStyle} />
        </div>
      )}
      {item.type === 'pause' && (
        <div>
          <label style={labelStyle}>Duration (seconds)</label>
          <input type="number" placeholder="2.0" step="0.5" min="0" value={item.duration || ''} onChange={e => update({ duration: e.target.value })} style={inputStyle} />
        </div>
      )}
      {item.type === 'gif' && (
        <div>
          <input placeholder="GIF/video filename" value={item.filename || ''} onChange={e => update({ filename: e.target.value })} style={inputStyle} />
          <label style={labelStyle}>Display duration (seconds)</label>
          <input type="number" placeholder="3.0" step="0.5" min="0" value={item.duration || ''} onChange={e => update({ duration: e.target.value })} style={inputStyle} />
        </div>
      )}
      {item.type === 'audio' && (
        <div>
          <select value={item.audioType || 'music'} onChange={e => update({ audioType: e.target.value })} style={selectStyle}>
            <option value="music">Play Music</option>
            <option value="sfx">Play Sound Effect</option>
            <option value="stop">Stop Music</option>
          </select>
          <input placeholder="audio filename" value={item.filename || ''} onChange={e => update({ filename: e.target.value })} style={inputStyle} />
        </div>
      )}
    </div>
  );
}

export default function ScenePanel({ node, onClose, onUpdateChoices, onUpdateLabel, onUpdateData, gameData }) {
  const [blocks, setBlocks] = useState(node.data.blocks || []);
  const [choices, setChoices] = useState(
    (node.data.choices || []).map((c, i) => typeof c === 'string' ? { id: i, text: c } : c)
  );
  const [label, setLabel] = useState(node.data.label);

  // Single source of truth: every block change writes straight to node data.
  const commitBlocks = (next) => {
    setBlocks(next);
    onUpdateData(node.id, { blocks: next });
  };

  const addBlock = (type) => commitBlocks([...blocks, { id: Date.now(), type }]);
  const removeBlock = (id) => commitBlocks(blocks.filter(b => b.id !== id));
  const updateBlock = (id, changes) => commitBlocks(blocks.map(b => b.id === id ? { ...b, ...changes } : b));

  const addChoice = () => {
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const newChoice = { id: Date.now(), text: `Option ${letters[choices.length]}` };
    const updated = [...choices, newChoice];
    setChoices(updated);
    onUpdateChoices(node.id, updated);
  };

  const updateChoiceText = (id, text) => {
    const updated = choices.map(c => c.id === id ? { ...c, text } : c);
    setChoices(updated);
    onUpdateChoices(node.id, updated);
  };

  const removeChoice = (id) => {
    const updated = choices.filter(c => c.id !== id);
    setChoices(updated);
    onUpdateChoices(node.id, updated);
  };

  const handleLabelChange = (e) => {
    setLabel(e.target.value);
    onUpdateLabel(node.id, e.target.value);
  };

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: '#1a1a2e', zIndex: 1000, display: 'flex', flexDirection: 'column' }}>
      <div style={{ background: '#2d5a3a', padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
          <div style={{ color: '#4abf6a', fontSize: '13px', letterSpacing: '2px', whiteSpace: 'nowrap' }}>SCENE</div>
          <input
            value={label}
            onChange={handleLabelChange}
            style={{ background: 'none', border: 'none', borderBottom: '1px solid #4abf6a', color: 'white', fontSize: '20px', fontWeight: 'bold', outline: 'none', flex: 1 }}
          />
        </div>
        <button onClick={onClose} style={{ background: '#4abf6a', color: '#1a1a2e', border: 'none', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', whiteSpace: 'nowrap' }}>
          ← Back to Map
        </button>
      </div>

      <div style={{ display: 'flex', flex: 1, gap: '16px', padding: '16px', overflow: 'hidden' }}>

        {/* Main sequence */}
        <div style={{ flex: 2, background: '#2a2a3e', borderRadius: '8px', border: '2px solid #4abf6a', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ padding: '12px', borderBottom: '1px solid #3a3a5e' }}>
            <div style={{ color: 'white', fontWeight: 'bold', marginBottom: '4px' }}>Scene Sequence</div>
            <div style={{ color: '#aaa', fontSize: '11px' }}>Blocks play top to bottom. Wire the output handles on the node to continue the story.</div>
          </div>
          <div style={{ flex: 1, overflowY: 'auto', padding: '12px' }}>
            {blocks.map(block => (
              <SceneBlock key={block.id} item={block} onRemove={() => removeBlock(block.id)} onUpdate={(changes) => updateBlock(block.id, changes)} gameData={gameData} />
            ))}
          </div>
          <div style={{ padding: '12px', borderTop: '1px solid #3a3a5e' }}>
            <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
              {BLOCK_TYPES.map(btn => (
                <button key={btn.type} onClick={() => addBlock(btn.type)} style={{ fontSize: '10px', padding: '3px 6px', background: '#2d5a3a', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                  {btn.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Choice exits */}
        <div style={{ flex: 1, background: '#2a2a3e', borderRadius: '8px', border: '2px solid #4abf6a55', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ padding: '12px', borderBottom: '1px solid #3a3a5e' }}>
            <div style={{ color: 'white', fontWeight: 'bold', marginBottom: '4px' }}>Choice Exits</div>
            <div style={{ color: '#aaa', fontSize: '11px' }}>Each choice adds a labeled output handle. Leave empty for a single linear output.</div>
          </div>
          <div style={{ flex: 1, overflowY: 'auto', padding: '12px' }}>
            {choices.map((choice) => (
              <div key={choice.id} style={{ display: 'flex', gap: '6px', alignItems: 'center', marginBottom: '8px' }}>
                <input
                  value={choice.text}
                  onChange={e => updateChoiceText(choice.id, e.target.value)}
                  style={{ ...inputStyle, marginBottom: 0, flex: 1 }}
                />
                <button onClick={() => removeChoice(choice.id)} style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer', fontSize: '14px', flexShrink: 0 }}>✕</button>
              </div>
            ))}
          </div>
          <div style={{ padding: '12px', borderTop: '1px solid #3a3a5e' }}>
            <button onClick={addChoice} style={{ width: '100%', padding: '6px', background: '#2d5a3a', color: 'white', border: '1px dashed #4abf6a', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' }}>
              + Add Choice Exit
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}