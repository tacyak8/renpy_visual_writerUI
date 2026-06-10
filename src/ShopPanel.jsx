import { useState } from 'react';

const inputStyle = { width: '100%', background: '#2a2a3e', border: '1px solid #444', color: 'white', padding: '4px', borderRadius: '4px', boxSizing: 'border-box', marginBottom: '4px' };
const labelStyle = { color: '#aaa', fontSize: '11px', display: 'block', marginBottom: '2px' };
const selectStyle = { ...inputStyle, padding: '4px' };

// Shop sequences allow a deliberately limited block set — no choices, items,
// stats, or end-day blocks inside a shop's opening/closing.
const SHOP_BLOCK_TYPES = [
  { type: 'dialogue', label: '💬 Dialogue' },
  { type: 'sprite', label: '🧍 Sprite' },
  { type: 'bg', label: '🖼 BG Change' },
  { type: 'audio', label: '🔊 Audio' },
  { type: 'pause', label: '⏸ Pause' },
];

const ITEM_SLOT_COUNT = 10;

function normalizeItems(items) {
  const arr = Array.isArray(items) ? items.slice(0, ITEM_SLOT_COUNT) : [];
  while (arr.length < ITEM_SLOT_COUNT) arr.push(null);
  return arr;
}

function ShopBlock({ item, onUpdate, onRemove, gameData }) {
  const characters = gameData?.characters || [];
  const update = (changes) => onUpdate({ ...item, ...changes });

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

      {item.type === 'sprite' && (
        <div>
          <label style={labelStyle}>Show sprite</label>
          <input placeholder="merchant happy" value={item.sprite || ''} onChange={e => update({ sprite: e.target.value })} style={inputStyle} />
        </div>
      )}

      {item.type === 'bg' && (
        <div>
          <label style={labelStyle}>Change background to</label>
          <input placeholder="bg_image_name" value={item.bg || ''} onChange={e => update({ bg: e.target.value })} style={inputStyle} />
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

      {item.type === 'pause' && (
        <div>
          <label style={labelStyle}>Duration (seconds)</label>
          <input type="number" placeholder="2.0" step="0.5" min="0" value={item.duration || ''} onChange={e => update({ duration: e.target.value })} style={inputStyle} />
        </div>
      )}
    </div>
  );
}

function ShopBlockList({ blocks, onChange, gameData }) {
  const addItem = (type) => onChange([...blocks, { id: Date.now(), type }]);
  const removeItem = (id) => onChange(blocks.filter(b => b.id !== id));
  const updateItem = (id, updated) => onChange(blocks.map(b => b.id === id ? updated : b));

  return (
    <div>
      {blocks.map(item => (
        <ShopBlock
          key={item.id}
          item={item}
          onUpdate={(updated) => updateItem(item.id, updated)}
          onRemove={() => removeItem(item.id)}
          gameData={gameData}
        />
      ))}
      <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginTop: '6px' }}>
        {SHOP_BLOCK_TYPES.map(btn => (
          <button key={btn.type} onClick={() => addItem(btn.type)} style={{ fontSize: '10px', padding: '3px 6px', background: '#1a4a4a', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
            {btn.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function ItemSlotEditor({ slot, onChange, onClear, gameData }) {
  const definedItems = gameData?.items || [];
  const pointSystems = gameData?.pointSystems || [];
  const update = (changes) => onChange({ ...slot, ...changes });

  const selectItem = (variable) => {
    const def = definedItems.find(i => i.variable === variable);
    update({ itemVariable: variable, itemName: def ? def.name : variable });
  };

  return (
    <div style={{ background: '#1a2a2a', border: '1px solid #2a6a6a', borderRadius: '6px', padding: '10px', marginTop: '8px' }}>
      <label style={labelStyle}>Item</label>
      <select value={slot.itemVariable || ''} onChange={e => selectItem(e.target.value)} style={selectStyle}>
        <option value="">Select item...</option>
        {definedItems.map(i => <option key={i.id} value={i.variable}>{i.name}</option>)}
      </select>

      <div style={{ display: 'flex', gap: '8px' }}>
        <div style={{ flex: 1 }}>
          <label style={labelStyle}>Price</label>
          <input type="number" min="0" value={slot.price ?? 0} onChange={e => update({ price: parseInt(e.target.value) || 0 })} style={inputStyle} />
        </div>
        <div style={{ flex: 2 }}>
          <label style={labelStyle}>Point system to charge</label>
          <select value={slot.pointSystem || ''} onChange={e => update({ pointSystem: e.target.value })} style={selectStyle}>
            <option value="">Select point system...</option>
            {pointSystems.map(s => <option key={s.id} value={s.variable}>{s.name}</option>)}
          </select>
        </div>
      </div>

      <label style={labelStyle}>Buy sprite (optional — shown on purchase)</label>
      <input placeholder="merchant happy" value={slot.buySprite || ''} onChange={e => update({ buySprite: e.target.value })} style={inputStyle} />

      <label style={labelStyle}>No-sale sprite (optional — shown when player can't afford)</label>
      <input placeholder="merchant annoyed" value={slot.noSaleSprite || ''} onChange={e => update({ noSaleSprite: e.target.value })} style={inputStyle} />

      <label style={labelStyle}>Description (optional — shown in the menu)</label>
      <input placeholder="A rusty key" value={slot.description || ''} onChange={e => update({ description: e.target.value })} style={inputStyle} />

      <button onClick={onClear} style={{ fontSize: '10px', padding: '3px 8px', background: '#5a3a3a', color: '#ffaaaa', border: '1px solid #8a4a4a', borderRadius: '4px', cursor: 'pointer', marginTop: '4px' }}>
        🗑 Clear slot
      </button>
    </div>
  );
}

const sectionStyle = { background: '#2a2a3e', border: '1px solid #2a6a6a', borderRadius: '8px', padding: '14px', marginBottom: '14px' };
const sectionTitleStyle = { color: '#4abfbf', fontSize: '12px', fontWeight: 'bold', letterSpacing: '1px', marginBottom: '10px' };

export default function ShopPanel({ node, onClose, onUpdateData, gameData }) {
  const d = node.data || {};
  const [bg, setBg] = useState(d.bg || '');
  const [shopkeeperSprite, setShopkeeperSprite] = useState(d.shopkeeperSprite || '');
  const [openingBlocks, setOpeningBlocks] = useState(d.openingBlocks || []);
  const [closingBlocks, setClosingBlocks] = useState(d.closingBlocks || []);
  const [loopBack, setLoopBack] = useState(!!d.loopBack);
  const [items, setItems] = useState(normalizeItems(d.items));
  const [openSlot, setOpenSlot] = useState(null);

  // Every change persists to central node state immediately.
  const commitBg = (val) => { setBg(val); onUpdateData(node.id, { bg: val }); };
  const commitSprite = (val) => { setShopkeeperSprite(val); onUpdateData(node.id, { shopkeeperSprite: val }); };
  const commitOpening = (next) => { setOpeningBlocks(next); onUpdateData(node.id, { openingBlocks: next }); };
  const commitClosing = (next) => { setClosingBlocks(next); onUpdateData(node.id, { closingBlocks: next }); };
  const commitLoopBack = (val) => { setLoopBack(val); onUpdateData(node.id, { loopBack: val }); };
  const commitItems = (next) => { setItems(next); onUpdateData(node.id, { items: next }); };

  const updateSlot = (idx, slot) => commitItems(items.map((it, i) => i === idx ? slot : it));
  const clearSlot = (idx) => { commitItems(items.map((it, i) => i === idx ? null : it)); setOpenSlot(null); };
  const startSlot = (idx) => {
    if (!items[idx]) {
      updateSlot(idx, { id: Date.now(), itemVariable: '', itemName: '', price: 0, pointSystem: '', buySprite: '', noSaleSprite: '', description: '' });
    }
    setOpenSlot(openSlot === idx ? null : idx);
  };

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: '#1a1a2e', zIndex: 1000, display: 'flex', flexDirection: 'column' }}>
      <div style={{ background: '#1a4a4a', padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
          <div style={{ color: '#4abfbf', fontSize: '13px', letterSpacing: '2px', whiteSpace: 'nowrap' }}>🛒 SHOP</div>
          <input
            defaultValue={node.data.label}
            onBlur={e => onUpdateData(node.id, { label: e.target.value })}
            onKeyDown={e => e.key === 'Enter' && e.target.blur()}
            style={{ background: 'none', border: 'none', borderBottom: '1px solid #4abfbf', color: 'white', fontSize: '20px', fontWeight: 'bold', outline: 'none', flex: 1 }}
          />
        </div>
        <button onClick={onClose} style={{ background: '#4abfbf', color: '#1a1a2e', border: 'none', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>
          ← Back to Map
        </button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '20px', maxWidth: '760px', width: '100%', margin: '0 auto', boxSizing: 'border-box' }}>

        {/* Section 1 — Setup */}
        <div style={sectionStyle}>
          <div style={sectionTitleStyle}>SETUP</div>
          <label style={labelStyle}>Background image name</label>
          <input placeholder="bg shop_interior" value={bg} onChange={e => commitBg(e.target.value)} style={inputStyle} />
          <label style={labelStyle}>Shopkeeper sprite (optional)</label>
          <input placeholder="merchant neutral" value={shopkeeperSprite} onChange={e => commitSprite(e.target.value)} style={inputStyle} />
        </div>

        {/* Section 2 — Opening sequence */}
        <div style={sectionStyle}>
          <div style={sectionTitleStyle}>OPENING DIALOGUE / SETUP</div>
          <div style={{ color: '#777', fontSize: '11px', marginBottom: '8px' }}>Plays once when the player enters the shop, before the item menu appears.</div>
          <ShopBlockList blocks={openingBlocks} onChange={commitOpening} gameData={gameData} />
        </div>

        {/* Section 3 — Item grid */}
        <div style={sectionStyle}>
          <div style={sectionTitleStyle}>ITEMS FOR SALE ({items.filter(it => it && it.itemVariable).length}/{ITEM_SLOT_COUNT})</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '8px' }}>
            {items.map((slot, idx) => (
              <div
                key={idx}
                onClick={() => startSlot(idx)}
                style={{
                  minHeight: '70px', borderRadius: '6px', cursor: 'pointer',
                  border: `2px solid ${openSlot === idx ? '#4abfbf' : (slot && slot.itemVariable ? '#2a6a6a' : '#333')}`,
                  background: slot && slot.itemVariable ? '#1a3a3a' : '#22222e',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  padding: '6px', textAlign: 'center',
                }}
              >
                {slot && slot.itemVariable ? (
                  <>
                    <div style={{ color: 'white', fontSize: '11px', fontWeight: 'bold' }}>{slot.itemName || slot.itemVariable}</div>
                    <div style={{ color: '#4abfbf', fontSize: '10px' }}>{slot.price ?? 0} {slot.pointSystem || '?'}</div>
                  </>
                ) : (
                  <div style={{ color: '#666', fontSize: '20px' }}>+</div>
                )}
              </div>
            ))}
          </div>

          {openSlot != null && items[openSlot] && (
            <ItemSlotEditor
              slot={items[openSlot]}
              onChange={(slot) => updateSlot(openSlot, slot)}
              onClear={() => clearSlot(openSlot)}
              gameData={gameData}
            />
          )}
        </div>

        {/* Section 4 — Closing sequence */}
        <div style={sectionStyle}>
          <div style={sectionTitleStyle}>CLOSING DIALOGUE</div>
          <div style={{ color: '#777', fontSize: '11px', marginBottom: '8px' }}>Plays when the player chooses "Leave".</div>
          <ShopBlockList blocks={closingBlocks} onChange={commitClosing} gameData={gameData} />

          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'white', fontSize: '12px', marginTop: '12px', cursor: 'pointer' }}>
            <input type="checkbox" checked={loopBack} onChange={e => commitLoopBack(e.target.checked)} />
            Return to the shop menu after a purchase (player keeps shopping until they pick "Leave")
          </label>
        </div>

      </div>
    </div>
  );
}
