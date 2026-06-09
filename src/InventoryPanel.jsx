import { useState } from 'react';

const inputStyle = { width: '100%', background: '#2a2a3e', border: '1px solid #444', color: 'white', padding: '6px', borderRadius: '4px', boxSizing: 'border-box', marginBottom: '4px' };
const labelStyle = { color: '#aaa', fontSize: '11px', display: 'block', marginBottom: '4px' };

const DEFAULT_ICONS = [
  { id: 'key', label: '🗝 Key' },
  { id: 'note', label: '📄 Note' },
  { id: 'map', label: '🗺 Map' },
  { id: 'bottle', label: '🧪 Bottle' },
  { id: 'gem', label: '💎 Gem' },
  { id: 'book', label: '📕 Book' },
  { id: 'knife', label: '🔪 Knife' },
  { id: 'photo', label: '📷 Photo' },
  { id: 'letter', label: '✉ Letter' },
  { id: 'coin', label: '🪙 Coin' },
  { id: 'tool', label: '🔧 Tool' },
  { id: 'custom', label: '🖼 Custom sprite' },
];

function toVariable(name) {
  return name.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
}

function ItemEditor({ item, onUpdate, onClose }) {
  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: '#1a1a2e', zIndex: 2000, display: 'flex', flexDirection: 'column' }}>
      <div style={{ background: '#2a3a4a', borderBottom: '2px solid #4a8abf', padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
          <div style={{ color: '#4a8abf', fontSize: '13px', letterSpacing: '2px', whiteSpace: 'nowrap' }}>ITEM</div>
          <input
            value={item.name || ''}
            onChange={e => onUpdate({ ...item, name: e.target.value, variable: toVariable(e.target.value) })}
            placeholder="Item name..."
            style={{ background: 'none', border: 'none', borderBottom: '1px solid #4a8abf', color: 'white', fontSize: '20px', fontWeight: 'bold', outline: 'none', flex: 1 }}
          />
        </div>
        <button onClick={onClose} style={{ background: '#4a8abf', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>
          ← Back
        </button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '24px', maxWidth: '600px', width: '100%', margin: '0 auto' }}>
        
        <div style={{ marginBottom: '20px' }}>
          <label style={labelStyle}>Icon / Sprite</label>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '8px' }}>
            {DEFAULT_ICONS.map(icon => (
              <div
                key={icon.id}
                onClick={() => onUpdate({ ...item, iconType: icon.id })}
                style={{
                  padding: '6px 10px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px',
                  border: `2px solid ${item.iconType === icon.id ? '#4a8abf' : '#444'}`,
                  background: item.iconType === icon.id ? '#1a2a3a' : '#2a2a3e',
                  color: 'white'
                }}
              >
                {icon.label}
              </div>
            ))}
          </div>
          {item.iconType === 'custom' && (
            <div>
              <label style={labelStyle}>Custom sprite filename</label>
              <input
                placeholder="item_sprite_name"
                value={item.customSprite || ''}
                onChange={e => onUpdate({ ...item, customSprite: e.target.value })}
                style={inputStyle}
              />
            </div>
          )}
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={labelStyle}>Description (shown in inventory)</label>
          <textarea
            placeholder="A rusty old key found in the garden..."
            value={item.description || ''}
            onChange={e => onUpdate({ ...item, description: e.target.value })}
            rows={3}
            style={{ ...inputStyle, resize: 'vertical' }}
          />
        </div>

        <div
          onClick={() => onUpdate({ ...item, journalEntry: !item.journalEntry })}
          style={{
            padding: '12px', borderRadius: '6px', cursor: 'pointer', marginBottom: '20px',
            border: `2px solid ${item.journalEntry ? '#9a4abf' : '#444'}`,
            background: item.journalEntry ? '#2a1a3a' : '#2a2a3e',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center'
          }}
        >
          <div>
            <div style={{ color: 'white', fontWeight: 'bold', fontSize: '13px' }}>📓 Add to journal when collected</div>
            <div style={{ color: '#aaa', fontSize: '11px' }}>This item will appear in the player's journal/clue log</div>
          </div>
          <div style={{
            width: '20px', height: '20px', borderRadius: '50%',
            background: item.journalEntry ? '#9a4abf' : '#444',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px'
          }}>
            {item.journalEntry ? '✓' : ''}
          </div>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={labelStyle}>Starting quantity (0 = not in inventory at start)</label>
          <input
            type="number" min="0"
            value={item.startQty ?? 0}
            onChange={e => onUpdate({ ...item, startQty: parseInt(e.target.value) })}
            style={inputStyle}
          />
        </div>

        <div style={{ background: '#2a1a3a', border: '1px solid #9a4abf33', borderRadius: '6px', padding: '10px' }}>
          <div style={{ color: '#cc99ff', fontSize: '11px' }}>
            This item will be available in location interaction blocks, condition checks, and schedulers automatically.
          </div>
        </div>
      </div>
    </div>
  );
}

export default function InventoryPanel({ onClose, gameData, onUpdateItems }) {
  const [editingId, setEditingId] = useState(null);
  const items = gameData.items || [];

  const addItem = () => {
    const newItem = { id: Date.now(), name: 'New Item', variable: 'new_item', iconType: 'key', description: '', journalEntry: false, startQty: 0 };
    const updated = [...items, newItem];
    onUpdateItems(updated);
    setEditingId(newItem.id);
  };

  const updateItem = (updated) => {
    onUpdateItems(items.map(i => i.id === updated.id ? updated : i));
  };

  const removeItem = (id) => {
    onUpdateItems(items.filter(i => i.id !== id));
  };

  const editing = items.find(i => i.id === editingId);

  if (editing) {
    return (
      <ItemEditor
        item={editing}
        onUpdate={updateItem}
        onClose={() => setEditingId(null)}
      />
    );
  }

  const getIcon = (item) => {
    const icon = DEFAULT_ICONS.find(i => i.id === item.iconType);
    return icon ? icon.label.split(' ')[0] : '📦';
  };

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: '#1a1a2e', zIndex: 1500, display: 'flex', flexDirection: 'column' }}>
      <div style={{ background: '#2a3a4a', borderBottom: '2px solid #4a8abf', padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ color: '#4a8abf', fontSize: '16px', fontWeight: 'bold', letterSpacing: '2px' }}>🎒 INVENTORY ITEMS</div>
        <button onClick={onClose} style={{ background: '#4a8abf', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>
          ← Back to Map
        </button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
        {items.length === 0 && (
          <div style={{ color: '#888', fontSize: '14px', textAlign: 'center', marginTop: '40px' }}>
            No items yet. Add items that players can collect, use, and trade throughout your game.
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '16px' }}>
          {items.map(item => (
            <div key={item.id} style={{ background: '#2a2a3e', border: '1px solid #4a8abf55', borderRadius: '8px', padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ fontSize: '24px' }}>{getIcon(item)}</div>
                <div>
                  <div style={{ color: 'white', fontWeight: 'bold', marginBottom: '2px' }}>{item.name}</div>
                  <div style={{ color: '#aaa', fontSize: '11px', display: 'flex', gap: '8px' }}>
                    {item.journalEntry && <span style={{ color: '#cc99ff' }}>📓 Journal</span>}
                    {item.startQty > 0 && <span>Starts with {item.startQty}</span>}
                    {item.description && <span>{item.description.slice(0, 40)}{item.description.length > 40 ? '...' : ''}</span>}
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={() => setEditingId(item.id)} style={{ background: '#2d4a7a', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}>Edit</button>
                <button onClick={() => removeItem(item.id)} style={{ background: 'none', border: '1px solid #5a3a3a', color: '#ff8888', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}>Remove</button>
              </div>
            </div>
          ))}
        </div>

        <button onClick={addItem} style={{ width: '100%', padding: '12px', background: '#1a2a3a', color: '#4a8abf', border: '1px dashed #4a8abf', borderRadius: '8px', cursor: 'pointer', fontSize: '14px' }}>
          + Add Item
        </button>
      </div>
    </div>
  );
}