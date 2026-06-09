import { useState } from 'react';

const inputStyle = { width: '100%', background: '#2a2a3e', border: '1px solid #444', color: 'white', padding: '4px', borderRadius: '4px', boxSizing: 'border-box', marginBottom: '4px' };
const labelStyle = { color: '#aaa', fontSize: '11px', display: 'block', marginBottom: '2px' };
const selectStyle = { ...inputStyle, padding: '4px' };

const TIME_PERIODS = {
  four: ['Morning', 'Afternoon', 'Evening', 'Night'],
  three: ['Morning', 'Afternoon', 'Evening'],
  two: ['Day', 'Night'],
  none: [],
};

function toVariable(name) {
  return (name || '').toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
}

// ─── Migration ────────────────────────────────────────────────────────────────
// Old format: { "Mon_morning": "living_room" }
// New format: { "chapter_1": { "Mon_morning": "living_room" } }
// Detect by whether any key starts with "chapter_".
function migrateGrid(grid) {
  if (!grid || Object.keys(grid).length === 0) return {};
  const hasChapterKey = Object.keys(grid).some(k => k.startsWith('chapter_'));
  if (hasChapterKey) return grid;
  return { chapter_1: grid };
}

// ─── Chapter list helper ──────────────────────────────────────────────────────
function getChaptersList(nodes, progressionLabel) {
  const label = progressionLabel || 'Chapter';
  const groups = (nodes || [])
    .filter(n => n.type === 'group' && n.data?.kind !== 'region')
    .sort((a, b) => (a.data.groupNumber || 0) - (b.data.groupNumber || 0));
  if (groups.length === 0) {
    return [{ num: 1, label: `${label} 1 (default)` }];
  }
  return groups.map(g => ({ num: g.data.groupNumber || 1, label: g.data.label || `${label} ${g.data.groupNumber}` }));
}

// ─── Location grouping helper ─────────────────────────────────────────────────
// Groups the location list by which region group each location sits inside,
// so the cell dropdown has <optgroup> sections instead of a flat list.
function isInsideGroup(nodePos, group) {
  const gx = group.position.x, gy = group.position.y;
  const gw = group.style?.width || 400, gh = group.style?.height || 300;
  return nodePos.x >= gx && nodePos.x <= gx + gw && nodePos.y >= gy && nodePos.y <= gy + gh;
}

function groupLocationsByRegion(locations, nodes) {
  const regionGroups = (nodes || []).filter(n => n.type === 'group' && n.data?.kind === 'region');
  if (regionGroups.length === 0) return [{ label: null, locs: locations }];

  const buckets = {};
  const ungrouped = [];
  locations.forEach(loc => {
    const locNode = (nodes || []).find(n => n.id === loc.id);
    if (!locNode) { ungrouped.push(loc); return; }
    const region = regionGroups.find(g => isInsideGroup(locNode.position, g));
    if (region) {
      const rLabel = region.data.name || region.data.label || 'Region';
      if (!buckets[rLabel]) buckets[rLabel] = [];
      buckets[rLabel].push(loc);
    } else {
      ungrouped.push(loc);
    }
  });

  const result = [];
  if (ungrouped.length > 0) result.push({ label: null, locs: ungrouped });
  Object.entries(buckets).forEach(([rLabel, locs]) => result.push({ label: rLabel, locs }));
  return result;
}

// ─── Scheduler Grid ───────────────────────────────────────────────────────────
function SchedulerGrid({ scheduler, chapterGrid, onUpdateChapterGrid, gameData, nodes }) {
  const days = gameData?.activeDays || ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const periods = TIME_PERIODS[gameData?.timePeriods || 'four'];
  const locations = gameData?.locations || [];
  const locationBuckets = groupLocationsByRegion(locations, nodes);

  const cellKey = (day, period) => `${day}_${toVariable(period)}`;
  const setCell = (day, period, value) => {
    onUpdateChapterGrid({ ...chapterGrid, [cellKey(day, period)]: value });
  };

  const selectAll = () => {
    const newGrid = {};
    days.forEach(day => periods.forEach(period => { newGrid[cellKey(day, period)] = 'all'; }));
    onUpdateChapterGrid(newGrid);
  };

  const randomSingle = () => {
    if (locations.length === 0) return;
    const loc = locations[Math.floor(Math.random() * locations.length)];
    const locVar = loc.variable || toVariable(loc.name);
    const newGrid = {};
    days.forEach(day => periods.forEach(period => { newGrid[cellKey(day, period)] = locVar; }));
    onUpdateChapterGrid(newGrid);
  };

  const randomMultiple = () => {
    if (locations.length === 0) return;
    const newGrid = {};
    days.forEach(day => periods.forEach(period => {
      const loc = locations[Math.floor(Math.random() * locations.length)];
      newGrid[cellKey(day, period)] = loc.variable || toVariable(loc.name);
    }));
    onUpdateChapterGrid(newGrid);
  };

  const clearAll = () => onUpdateChapterGrid({});

  if (periods.length === 0) {
    return <div style={{ color: '#888', fontSize: '12px', fontStyle: 'italic' }}>No time system defined — set one up in Story Master first.</div>;
  }

  return (
    <div>
      <div style={{ display: 'flex', gap: '8px', marginBottom: '12px', flexWrap: 'wrap' }}>
        <button onClick={selectAll} style={{ background: '#2a3a2a', color: '#4a8a4a', border: '1px solid #4a8a4a', padding: '4px 10px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}>All locations</button>
        <button onClick={randomSingle} style={{ background: '#2a2a3e', color: '#7a8abf', border: '1px solid #7a8abf', padding: '4px 10px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}>Random (same)</button>
        <button onClick={randomMultiple} style={{ background: '#2a2a3e', color: '#7a8abf', border: '1px solid #7a8abf', padding: '4px 10px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}>Random (varied)</button>
        <button onClick={clearAll} style={{ background: '#2a1a1a', color: '#8a4a4a', border: '1px solid #8a4a4a', padding: '4px 10px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}>Clear all</button>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ borderCollapse: 'collapse', minWidth: '100%' }}>
          <thead>
            <tr>
              <th style={{ padding: '8px 12px', color: '#aaa', fontSize: '12px', textAlign: 'left', borderBottom: '1px solid #333' }}>Day</th>
              {periods.map(p => (
                <th key={p} style={{ padding: '8px 12px', color: '#aaa', fontSize: '12px', textAlign: 'left', borderBottom: '1px solid #333', minWidth: '140px' }}>{p}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {days.map(day => (
              <tr key={day}>
                <td style={{ padding: '6px 12px', color: '#fff', fontSize: '13px', fontWeight: 'bold', borderBottom: '1px solid #222' }}>{day}</td>
                {periods.map(period => {
                  const key = cellKey(day, period);
                  const val = chapterGrid[key] || '';
                  return (
                    <td key={period} style={{ padding: '4px 8px', borderBottom: '1px solid #222' }}>
                      <select
                        value={val}
                        onChange={e => setCell(day, period, e.target.value)}
                        style={{ ...selectStyle, marginBottom: 0, background: val ? '#1a3a1a' : '#2a2a3e', borderColor: val ? '#4a8a4a' : '#444' }}
                      >
                        <option value="">— none —</option>
                        {scheduler.type === 'character' && <option value="all">All locations</option>}
                        {locationBuckets.map(bucket => {
                          const opts = bucket.locs.map(loc => {
                            const locVar = loc.variable || toVariable(loc.name);
                            return <option key={loc.id} value={locVar}>{loc.name}</option>;
                          });
                          return bucket.label
                            ? <optgroup key={bucket.label} label={`◇ ${bucket.label}`}>{opts}</optgroup>
                            : opts;
                        })}
                      </select>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Scheduler Editor (full-screen detail view) ───────────────────────────────
function SchedulerEditor({ scheduler, onUpdate, onClose, gameData, nodes }) {
  const chapters = getChaptersList(nodes, gameData?.progressionLabel);
  const [activeChapterNum, setActiveChapterNum] = useState(chapters[0]?.num || 1);
  const characters = gameData?.characters || [];

  // Normalize the grid to the per-chapter format on first use.
  const normalizedGrid = migrateGrid(scheduler.grid || {});
  const chapterKey = `chapter_${activeChapterNum}`;
  const chapterGrid = normalizedGrid[chapterKey] || {};

  const updateChapterGrid = (newChapterGrid) => {
    const updatedGrid = { ...normalizedGrid, [chapterKey]: newChapterGrid };
    onUpdate({ ...scheduler, grid: updatedGrid });
  };

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: '#1a1a2e', zIndex: 2000, display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ background: '#2a3a2a', borderBottom: '2px solid #4a8a4a', padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
          <div style={{ color: '#4a8a4a', fontSize: '13px', letterSpacing: '2px', whiteSpace: 'nowrap' }}>SCHEDULER</div>
          <input
            value={scheduler.name || ''}
            onChange={e => onUpdate({ ...scheduler, name: e.target.value })}
            placeholder="Scheduler name..."
            style={{ background: 'none', border: 'none', borderBottom: '1px solid #4a8a4a', color: 'white', fontSize: '20px', fontWeight: 'bold', outline: 'none', flex: 1 }}
          />
        </div>
        <button onClick={onClose} style={{ background: '#4a8a4a', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>
          ← Back
        </button>
      </div>

      {/* Type + character/item selector */}
      <div style={{ padding: '16px 24px', background: '#2a2a3e', borderBottom: '1px solid #333', display: 'flex', gap: '16px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
        <div>
          <label style={labelStyle}>Schedule type</label>
          <select value={scheduler.type || 'character'} onChange={e => onUpdate({ ...scheduler, type: e.target.value, targetId: '' })} style={{ ...selectStyle, width: 'auto', marginBottom: 0 }}>
            <option value="character">Character</option>
            <option value="item">Item</option>
          </select>
        </div>
        {scheduler.type === 'character' && (
          <div>
            <label style={labelStyle}>Which character?</label>
            <select
              value={scheduler.targetId !== undefined ? String(scheduler.targetId) : ''}
              onChange={e => onUpdate({ ...scheduler, targetId: e.target.value })}
              style={{ ...selectStyle, width: 'auto', marginBottom: 0 }}
            >
              <option value="">Select character...</option>
              {characters.map(c => <option key={String(c.id)} value={String(c.id)}>{c.name}</option>)}
            </select>
          </div>
        )}
        {scheduler.type === 'item' && (
          <div>
            <label style={labelStyle}>Item name</label>
            <input value={scheduler.itemName || ''} onChange={e => onUpdate({ ...scheduler, itemName: e.target.value })} placeholder="e.g. Ancient Key" style={{ ...selectStyle, width: 'auto', marginBottom: 0 }} />
          </div>
        )}
      </div>

      {/* Chapter tabs — only shown when there are 2+ chapters */}
      {chapters.length > 1 && (
        <div style={{ display: 'flex', gap: '4px', padding: '12px 24px 0', background: '#1a1a2e', borderBottom: '1px solid #333', overflowX: 'auto' }}>
          {chapters.map(ch => (
            <button
              key={ch.num}
              onClick={() => setActiveChapterNum(ch.num)}
              style={{
                padding: '6px 16px', borderRadius: '6px 6px 0 0', border: '1px solid #444', borderBottom: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: 'bold', whiteSpace: 'nowrap',
                background: activeChapterNum === ch.num ? '#2a2a3e' : '#111827',
                color: activeChapterNum === ch.num ? '#4a8a4a' : '#888',
                borderColor: activeChapterNum === ch.num ? '#4a8a4a' : '#333',
              }}
            >
              {ch.label}
            </button>
          ))}
        </div>
      )}

      {/* Grid */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
        {chapters.length === 1 && (
          <div style={{ color: '#888', fontSize: '12px', marginBottom: '12px' }}>
            No chapter groups found — showing a single schedule that applies throughout the game. Add chapter groups on the canvas to set up per-chapter schedules.
          </div>
        )}
        <SchedulerGrid
          scheduler={scheduler}
          chapterGrid={chapterGrid}
          onUpdateChapterGrid={updateChapterGrid}
          gameData={gameData}
          nodes={nodes}
        />
      </div>
    </div>
  );
}

// ─── Default export: scheduler list ──────────────────────────────────────────
export default function SchedulerPanel({ onClose, gameData, schedulers, onUpdateSchedulers, nodes }) {
  const [editingId, setEditingId] = useState(null);

  const addScheduler = () => {
    const newScheduler = { id: Date.now(), name: 'New Scheduler', type: 'character', targetId: '', grid: {} };
    onUpdateSchedulers([...schedulers, newScheduler]);
    setEditingId(newScheduler.id);
  };

  const updateScheduler = (updated) => onUpdateSchedulers(schedulers.map(s => s.id === updated.id ? updated : s));
  const removeScheduler = (id) => onUpdateSchedulers(schedulers.filter(s => s.id !== id));
  const editing = schedulers.find(s => s.id === editingId);

  if (editing) {
    return <SchedulerEditor scheduler={editing} onUpdate={updateScheduler} onClose={() => setEditingId(null)} gameData={gameData} nodes={nodes} />;
  }

  const characters = gameData?.characters || [];
  const getTargetName = (s) => {
    if (s.type === 'character') {
      const char = characters.find(c => String(c.id) === String(s.targetId));
      return char ? char.name : 'No character selected';
    }
    return s.itemName || 'No item named';
  };

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: '#1a1a2e', zIndex: 1500, display: 'flex', flexDirection: 'column' }}>
      <div style={{ background: '#2a3a2a', borderBottom: '2px solid #4a8a4a', padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ color: '#4a8a4a', fontSize: '16px', fontWeight: 'bold', letterSpacing: '2px' }}>📅 SCHEDULERS</div>
        <button onClick={onClose} style={{ background: '#4a8a4a', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>← Back to Map</button>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
        {schedulers.length === 0 && (
          <div style={{ color: '#888', fontSize: '14px', textAlign: 'center', marginTop: '40px' }}>
            No schedulers yet. Add one to place characters or items in specific locations at specific times.
          </div>
        )}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '16px' }}>
          {schedulers.map(s => (
            <div key={s.id} style={{ background: '#2a2a3e', border: '1px solid #4a8a4a55', borderRadius: '8px', padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ color: 'white', fontWeight: 'bold', marginBottom: '2px' }}>{s.name}</div>
                <div style={{ color: '#aaa', fontSize: '12px' }}>{s.type === 'character' ? '🧍' : '🎒'} {getTargetName(s)}</div>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={() => setEditingId(s.id)} style={{ background: '#2d4a7a', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}>Edit</button>
                <button onClick={() => removeScheduler(s.id)} style={{ background: 'none', border: '1px solid #5a3a3a', color: '#ff8888', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}>Remove</button>
              </div>
            </div>
          ))}
        </div>
        <button onClick={addScheduler} style={{ width: '100%', padding: '12px', background: '#2a3a2a', color: '#4a8a4a', border: '1px dashed #4a8a4a', borderRadius: '8px', cursor: 'pointer', fontSize: '14px' }}>
          + Add Scheduler
        </button>
      </div>
    </div>
  );
}
