import { useState } from 'react';

const timeColors = {
  Morning: '#f0a500',
  Afternoon: '#e07000',
  Evening: '#7040a0',
  Night: '#203060',
  Day: '#e0a000',
};

const BLOCK_TYPES = [
  { type: 'dialogue', label: '💬 Dialogue' },
  { type: 'choice', label: '🔀 Choice' },
  { type: 'question', label: '❓ Question' },
  { type: 'item', label: '🎒 Item' },
  { type: 'sprite', label: '🧍 Sprite' },
  { type: 'bg', label: '🖼 BG Change' },
  { type: 'stat', label: '📊 Stat' },
  { type: 'pause', label: '⏸ Pause' },
  { type: 'gif', label: '🎞 GIF/Video' },
  { type: 'audio', label: '🔊 Audio' },
  { type: 'endday', label: '💤 End Day' },
];

// ---------------------------------------------------------------------------
// Subpanel path navigation.
// A subpanel edits a nested blocks array identified by a PATH from the
// interaction's root blocks. Each path segment is either:
//   { blockId, optionId }  — an option's blocks inside a choice/question block
//   { blockId, field }     — a question block's correctBlocks / incorrectBlocks
// Reading and writing always go through the live interaction object, so nested
// subpanel edits can never be lost to stale local state.
// ---------------------------------------------------------------------------

function getBlocksAtPath(rootBlocks, path) {
  let blocks = rootBlocks || [];
  for (const seg of path) {
    const block = blocks.find(b => b.id === seg.blockId);
    if (!block) return [];
    if (seg.field) {
      blocks = block[seg.field] || [];
    } else {
      const opt = (block.options || []).find(o => o.id === seg.optionId);
      if (!opt) return [];
      blocks = opt.blocks || [];
    }
  }
  return blocks;
}

function setBlocksAtPath(rootBlocks, path, newBlocks) {
  if (path.length === 0) return newBlocks;
  const seg = path[0];
  const rest = path.slice(1);
  return (rootBlocks || []).map(b => {
    if (b.id !== seg.blockId) return b;
    if (seg.field) {
      return { ...b, [seg.field]: setBlocksAtPath(b[seg.field] || [], rest, newBlocks) };
    }
    return {
      ...b,
      options: (b.options || []).map(o =>
        o.id === seg.optionId ? { ...o, blocks: setBlocksAtPath(o.blocks || [], rest, newBlocks) } : o
      ),
    };
  });
}

const CONDITION_TYPES = [
  { value: 'flag', label: 'Flag is set' },
  { value: 'stat_above', label: 'Stat is above' },
  { value: 'stat_below', label: 'Stat is below' },
  { value: 'item', label: 'Item in inventory' },
  { value: 'day', label: 'Day is' },
];

const PRESENCE_CONDITIONS = [
  { value: 'none', label: 'No condition (always runs)' },
  { value: 'character_present', label: 'Character is present' },
  { value: 'character_absent', label: 'Character is not present' },
  { value: 'no_character', label: 'No character present' },
  { value: 'item_present', label: 'Item is present in location' },
];

const REPEAT_TYPES = [
  { value: 'always', label: 'Every time condition is met' },
  { value: 'first', label: 'First time only' },
  { value: 'nth', label: 'Nth time only' },
  { value: 'after_first', label: 'Every time after the first' },
];

const inputStyle = { width: '100%', background: '#2a2a3e', border: '1px solid #444', color: 'white', padding: '4px', borderRadius: '4px', boxSizing: 'border-box', marginBottom: '4px' };
const labelStyle = { color: '#aaa', fontSize: '11px', display: 'block', marginBottom: '2px' };
const selectStyle = { ...inputStyle, padding: '4px' };

function getPeriodsFromGameData(gameData) {
  switch (gameData?.timePeriods) {
    case 'two': return ['Day', 'Night'];
    case 'three': return ['Morning', 'Afternoon', 'Evening'];
    case 'none': return ['All Day'];
    case 'four':
    default: return ['Morning', 'Afternoon', 'Evening', 'Night'];
  }
}

function ConditionBuilder({ condition, onChange, gameData }) {
  const pointSystems = gameData?.pointSystems || [];
  const days = gameData?.activeDays || ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const condType = condition?.type || 'none';

  return (
    <div>
      <select
        value={condType}
        onChange={e => {
          if (e.target.value === 'none') {
            onChange(null);
          } else {
            onChange({ ...condition, type: e.target.value, value: '', value2: '' });
          }
        }}
        style={selectStyle}
      >
        <option value="none">— No additional condition —</option>
        {CONDITION_TYPES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
      </select>

      {condType !== 'none' && condType === 'flag' && (
        <input placeholder="flag_name" value={condition?.value || ''} onChange={e => onChange({ ...condition, value: e.target.value })} style={inputStyle} />
      )}

      {condType !== 'none' && (condType === 'stat_above' || condType === 'stat_below') && (
        <div style={{ display: 'flex', gap: '4px' }}>
          <select value={condition?.value || ''} onChange={e => onChange({ ...condition, value: e.target.value })} style={{ ...selectStyle, flex: 2 }}>
            <option value="">Select stat...</option>
            {pointSystems.map(s => <option key={s.id} value={s.variable}>{s.name}</option>)}
          </select>
          <input type="number" placeholder="amount" value={condition?.value2 || ''} onChange={e => onChange({ ...condition, value2: e.target.value })} style={{ ...inputStyle, flex: 1, marginBottom: 0 }} />
        </div>
      )}

      {condType !== 'none' && condType === 'item' && (
        <select value={condition?.value || ''} onChange={e => onChange({ ...condition, value: e.target.value })} style={selectStyle}>
          <option value="">Select item...</option>
          {(gameData?.items || []).map(i => <option key={i.id} value={i.variable}>{i.name}</option>)}
        </select>
      )}

      {condType !== 'none' && condType === 'day' && (
        <select value={condition?.value || ''} onChange={e => onChange({ ...condition, value: e.target.value })} style={selectStyle}>
          <option value="">Select day...</option>
          {days.map(d => <option key={d} value={d}>{d}</option>)}
        </select>
      )}
    </div>
  );
}

function SingleBlock({ item, onUpdate, depth, onOpenSubpanel, onRemove, gameData }) {
  const characters = gameData?.characters || [];
  const pointSystems = gameData?.pointSystems || [];
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

      {item.type === 'choice' && (
        <ChoiceBlock item={item} onUpdate={onUpdate} depth={depth} onOpenSubpanel={onOpenSubpanel} gameData={gameData} />
      )}

      {item.type === 'question' && (
        <QuestionBlock item={item} onUpdate={onUpdate} depth={depth} onOpenSubpanel={onOpenSubpanel} gameData={gameData} />
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
            {(gameData?.items || []).map(i => <option key={i.id} value={i.variable}>{i.name}</option>)}
          </select>
          <label style={labelStyle}>Display image (optional)</label>
          <input placeholder="item_image_name" value={item.itemImage || ''} onChange={e => update({ itemImage: e.target.value })} style={inputStyle} />
          <label style={labelStyle}>Narrator text (optional)</label>
          <textarea placeholder="Narrator description..." value={item.narratorText || ''} onChange={e => update({ narratorText: e.target.value })} rows={2} style={{ ...inputStyle, resize: 'vertical' }} />
        </div>
      )}

      {item.type === 'bg' && (
        <div>
          <label style={labelStyle}>Change background to</label>
          <input placeholder="bg_image_name" value={item.bg || ''} onChange={e => update({ bg: e.target.value })} style={inputStyle} />
        </div>
      )}

      {item.type === 'sprite' && (
        <div>
          <label style={labelStyle}>Show sprite</label>
          <input placeholder="char_a_expression1" value={item.sprite || ''} onChange={e => update({ sprite: e.target.value })} style={inputStyle} />
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

      {item.type === 'endday' && (
        <div>
          <div style={{ color: '#7aaaff', fontSize: '11px', fontWeight: 'bold', marginBottom: '4px' }}>💤 End Day</div>
          <label style={labelStyle}>Close-out button text</label>
          <input placeholder="Go to sleep" value={item.closeoutText || ''} onChange={e => update({ closeoutText: e.target.value })} style={inputStyle} />
          <label style={labelStyle}>Go-back button text</label>
          <input placeholder="Not yet" value={item.backText || ''} onChange={e => update({ backText: e.target.value })} style={inputStyle} />
          <div style={{ color: '#777', fontSize: '10px', marginTop: '2px' }}>
            Ends the day and wakes the player at the wake-up location (set in Story Master). Put this last in the interaction — anything after it won't run.
          </div>
        </div>
      )}
    </div>
  );
}

function ChoiceBlock({ item, onUpdate, depth, onOpenSubpanel, gameData }) {
  const options = item.options || [
    { id: 'opt_a', label: 'Option A', text: '', blocks: [] },
    { id: 'opt_b', label: 'Option B', text: '', blocks: [] },
  ];

  const updateOptions = (newOptions) => onUpdate({ ...item, options: newOptions });
  const addOption = () => {
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    updateOptions([...options, { id: `opt_${Date.now()}`, label: `Option ${letters[options.length]}`, text: '', blocks: [] }]);
  };
  const removeOption = (id) => updateOptions(options.filter(o => o.id !== id));
  const updateText = (id, text) => updateOptions(options.map(o => o.id === id ? { ...o, text } : o));

  const openConsequences = (opt) => {
    // Materialize default options into node state before opening, so the
    // subpanel's path write-back has a real options array to navigate.
    if (!item.options) updateOptions(options);
    onOpenSubpanel({
      label: opt.text ? `${opt.label}: ${opt.text}` : opt.label,
      depth,
      segment: { blockId: item.id, optionId: opt.id },
    });
  };

  return (
    <div>
      <label style={labelStyle}>Player choices</label>
      {options.map(opt => (
        <div key={opt.id} style={{ marginBottom: '6px', background: '#1a1a2e', borderRadius: '4px', padding: '6px' }}>
          <div style={{ display: 'flex', gap: '4px', alignItems: 'center', marginBottom: '4px' }}>
            <span style={{ color: '#aaa', fontSize: '11px', minWidth: '60px' }}>{opt.label}</span>
            <input value={opt.text || ''} onChange={e => updateText(opt.id, e.target.value)} placeholder={`${opt.label} text...`} style={{ ...inputStyle, marginBottom: 0, flex: 1 }} />
            <button onClick={() => removeOption(opt.id)} style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer', fontSize: '12px' }}>✕</button>
          </div>
          {depth < 3 && (
            <button onClick={() => openConsequences(opt)} style={{ fontSize: '10px', padding: '3px 8px', background: '#3a5a3a', color: '#aaffaa', border: '1px solid #4a8a4a', borderRadius: '4px', cursor: 'pointer', width: '100%' }}>
              📋 Edit {opt.label} consequences ({(opt.blocks || []).length}) →
            </button>
          )}
          {depth >= 3 && <div style={{ fontSize: '10px', color: '#888', fontStyle: 'italic', textAlign: 'center' }}>Max depth reached</div>}
        </div>
      ))}
      <button onClick={addOption} style={{ fontSize: '10px', background: '#2d4a7a', color: 'white', border: 'none', borderRadius: '4px', padding: '3px 8px', cursor: 'pointer' }}>+ Add Option</button>
    </div>
  );
}

const ANSWER_MODES = [
  { value: 'typed', label: 'Player types an answer' },
  { value: 'multiple', label: 'Multiple choice' },
  { value: 'truefalse', label: 'True / False' },
];

function QuestionBlock({ item, onUpdate, depth, onOpenSubpanel, gameData }) {
  const answerMode = item.answerMode || 'typed';
  const options = item.options || [
    { id: 'opt_a', label: 'Option A', text: '', isCorrect: false, blocks: [] },
    { id: 'opt_b', label: 'Option B', text: '', isCorrect: false, blocks: [] },
  ];

  const update = (changes) => onUpdate({ ...item, ...changes });
  const updateOptions = (newOptions) => onUpdate({ ...item, options: newOptions });

  const setMode = (mode) => {
    if (mode === 'truefalse') {
      // Pre-populate True/False, one marked correct. Preserve any existing
      // consequence blocks on the first two options.
      onUpdate({
        ...item,
        answerMode: mode,
        options: [
          { id: 'opt_true', label: 'Option A', text: 'True', isCorrect: true, blocks: options[0]?.blocks || [] },
          { id: 'opt_false', label: 'Option B', text: 'False', isCorrect: false, blocks: options[1]?.blocks || [] },
        ],
      });
    } else if (mode === 'multiple') {
      onUpdate({ ...item, answerMode: mode, options });
    } else {
      onUpdate({ ...item, answerMode: mode });
    }
  };

  const setCorrect = (id, checked) => {
    if (answerMode === 'truefalse') {
      // Exactly one correct answer in true/false.
      updateOptions(options.map(o => ({ ...o, isCorrect: o.id === id })));
    } else {
      updateOptions(options.map(o => o.id === id ? { ...o, isCorrect: checked } : o));
    }
  };

  const addOption = () => {
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    updateOptions([...options, { id: `opt_${Date.now()}`, label: `Option ${letters[options.length] || options.length}`, text: '', isCorrect: false, blocks: [] }]);
  };
  const removeOption = (id) => updateOptions(options.filter(o => o.id !== id));
  const updateText = (id, text) => updateOptions(options.map(o => o.id === id ? { ...o, text } : o));

  // Typed mode: synthetic "options" pointing at correctBlocks / incorrectBlocks.
  const openTypedConsequences = (field) => {
    onOpenSubpanel({
      label: field === 'correctBlocks' ? 'Correct answer' : 'Incorrect answer',
      depth,
      segment: { blockId: item.id, field },
    });
  };

  const openOptionConsequences = (opt) => {
    if (!item.options) updateOptions(options);
    onOpenSubpanel({
      label: opt.text ? `${opt.label}: ${opt.text}` : opt.label,
      depth,
      segment: { blockId: item.id, optionId: opt.id },
    });
  };

  return (
    <div>
      <div style={{ color: '#7aaaff', fontSize: '11px', fontWeight: 'bold', marginBottom: '4px' }}>❓ Question</div>
      <label style={labelStyle}>Question shown to the player</label>
      <textarea placeholder="What was inscribed above the tomb door?" value={item.questionText || ''} onChange={e => update({ questionText: e.target.value })} rows={2} style={{ ...inputStyle, resize: 'vertical' }} />

      <label style={labelStyle}>Answer mode</label>
      <select value={answerMode} onChange={e => setMode(e.target.value)} style={selectStyle}>
        {ANSWER_MODES.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
      </select>

      {answerMode === 'typed' && (
        <div>
          <label style={labelStyle}>Correct answer (case-insensitive)</label>
          <input placeholder="e.g. anubis" value={item.correctAnswer || ''} onChange={e => update({ correctAnswer: e.target.value })} style={inputStyle} />
          {depth < 3 ? (
            <div style={{ display: 'flex', gap: '4px' }}>
              <button onClick={() => openTypedConsequences('correctBlocks')} style={{ flex: 1, fontSize: '10px', padding: '3px 8px', background: '#3a5a3a', color: '#aaffaa', border: '1px solid #4a8a4a', borderRadius: '4px', cursor: 'pointer' }}>
                ✓ Edit correct consequences ({(item.correctBlocks || []).length}) →
              </button>
              <button onClick={() => openTypedConsequences('incorrectBlocks')} style={{ flex: 1, fontSize: '10px', padding: '3px 8px', background: '#5a3a3a', color: '#ffaaaa', border: '1px solid #8a4a4a', borderRadius: '4px', cursor: 'pointer' }}>
                ✗ Edit incorrect consequences ({(item.incorrectBlocks || []).length}) →
              </button>
            </div>
          ) : (
            <div style={{ fontSize: '10px', color: '#888', fontStyle: 'italic', textAlign: 'center' }}>Max depth reached</div>
          )}
        </div>
      )}

      {(answerMode === 'multiple' || answerMode === 'truefalse') && (
        <div>
          <label style={labelStyle}>Answers</label>
          {options.map(opt => (
            <div key={opt.id} style={{ marginBottom: '6px', background: '#1a1a2e', borderRadius: '4px', padding: '6px' }}>
              <div style={{ display: 'flex', gap: '4px', alignItems: 'center', marginBottom: '4px' }}>
                <span style={{ color: '#aaa', fontSize: '11px', minWidth: '60px' }}>{opt.label}</span>
                <input value={opt.text || ''} onChange={e => updateText(opt.id, e.target.value)} placeholder={`${opt.label} text...`} style={{ ...inputStyle, marginBottom: 0, flex: 1 }} />
                <label style={{ display: 'flex', alignItems: 'center', gap: '3px', color: opt.isCorrect ? '#aaffaa' : '#888', fontSize: '10px', whiteSpace: 'nowrap', cursor: 'pointer' }}>
                  <input type="checkbox" checked={!!opt.isCorrect} onChange={e => setCorrect(opt.id, e.target.checked)} />
                  correct
                </label>
                {answerMode === 'multiple' && (
                  <button onClick={() => removeOption(opt.id)} style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer', fontSize: '12px' }}>✕</button>
                )}
              </div>
              {depth < 3 && (
                <button onClick={() => openOptionConsequences(opt)} style={{ fontSize: '10px', padding: '3px 8px', background: '#3a5a3a', color: '#aaffaa', border: '1px solid #4a8a4a', borderRadius: '4px', cursor: 'pointer', width: '100%' }}>
                  📋 Edit {opt.label} consequences ({(opt.blocks || []).length}) →
                </button>
              )}
              {depth >= 3 && <div style={{ fontSize: '10px', color: '#888', fontStyle: 'italic', textAlign: 'center' }}>Max depth reached</div>}
            </div>
          ))}
          {answerMode === 'multiple' && (
            <button onClick={addOption} style={{ fontSize: '10px', background: '#2d4a7a', color: 'white', border: 'none', borderRadius: '4px', padding: '3px 8px', cursor: 'pointer' }}>+ Add Option</button>
          )}
        </div>
      )}
    </div>
  );
}

function BlockList({ blocks, onChange, depth, onOpenSubpanel, gameData }) {
  const addItem = (type) => onChange([...blocks, { id: Date.now(), type }]);
  const removeItem = (id) => onChange(blocks.filter(b => b.id !== id));
  const updateItem = (id, updated) => onChange(blocks.map(b => b.id === id ? updated : b));

  return (
    <div>
      {blocks.map(item => (
        <SingleBlock
          key={item.id}
          item={item}
          onUpdate={(updated) => updateItem(item.id, updated)}
          depth={depth}
          onOpenSubpanel={onOpenSubpanel}
          onRemove={() => removeItem(item.id)}
          gameData={gameData}
        />
      ))}
      <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginTop: '6px' }}>
        {BLOCK_TYPES.map(btn => (
          <button key={btn.type} onClick={() => addItem(btn.type)} style={{ fontSize: '10px', padding: '3px 6px', background: '#2d4a7a', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
            {btn.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function ChoiceSubpanel({ stack, blocks, onUpdateBlocks, onBack, onOpenSubpanel, gameData }) {
  const current = stack[stack.length - 1];

  return (
    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: '#1a1a2e', zIndex: 100, display: 'flex', flexDirection: 'column' }}>
      <div style={{ background: '#3a2a5a', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
        <button onClick={onBack} style={{ background: '#4a3a7a', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' }}>← Back</button>
        <div style={{ color: '#aaa', fontSize: '12px' }}>
          {stack.map((s, i) => (
            <span key={i}>{i > 0 && ' → '}<span style={{ color: i === stack.length - 1 ? 'white' : '#aaa' }}>{s.label}</span></span>
          ))}
        </div>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
        <div style={{ color: '#aaffaa', fontSize: '13px', marginBottom: '12px', fontWeight: 'bold' }}>Consequences for: {current.label}</div>
        <BlockList
          blocks={blocks}
          onChange={onUpdateBlocks}
          depth={current.depth + 1}
          onOpenSubpanel={(entry) => onOpenSubpanel([...stack, { label: entry.label, depth: entry.depth, path: [...current.path, entry.segment] }])}
          gameData={gameData}
        />
      </div>
    </div>
  );
}

function InteractionEditor({ interaction, onUpdate, color, gameData }) {
  const [subpanelStack, setSubpanelStack] = useState(null);
  const blocks = interaction.blocks || [];
  const characters = gameData?.characters || [];
  const items = gameData?.items || [];

  const updateBlocks = (newBlocks) => onUpdate({ ...interaction, blocks: newBlocks });
  const updateField = (changes) => onUpdate({ ...interaction, ...changes });

  return (
    <div style={{ padding: '8px', position: 'relative', minHeight: '60px' }}>

      <div style={{ background: '#1a1a2e', borderRadius: '4px', padding: '8px', marginBottom: '6px', border: '1px solid #333' }}>
        <label style={{ ...labelStyle, color: '#7aaaff', fontWeight: 'bold' }}>Who needs to be present?</label>
        <select
          value={interaction.presenceCondition || 'none'}
          onChange={e => updateField({ presenceCondition: e.target.value, presenceTarget: '' })}
          style={selectStyle}
        >
          {PRESENCE_CONDITIONS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
        </select>

        {(interaction.presenceCondition === 'character_present' || interaction.presenceCondition === 'character_absent') && (
          <select value={interaction.presenceTarget || ''} onChange={e => updateField({ presenceTarget: e.target.value })} style={selectStyle}>
            <option value="">Select character...</option>
            {characters.map(c => <option key={c.id} value={c.variable}>{c.name}</option>)}
          </select>
        )}

        {interaction.presenceCondition === 'item_present' && (
          <select value={interaction.presenceTarget || ''} onChange={e => updateField({ presenceTarget: e.target.value })} style={selectStyle}>
            <option value="">Select item...</option>
            {items.map(i => <option key={i.id} value={i.variable}>{i.name}</option>)}
          </select>
        )}
      </div>

      <div style={{ background: '#1a1a2e', borderRadius: '4px', padding: '8px', marginBottom: '6px', border: '1px solid #333' }}>
        <label style={{ ...labelStyle, color: '#7aaaff', fontWeight: 'bold' }}>When does this trigger?</label>
        <select
          value={interaction.repeatType || 'always'}
          onChange={e => updateField({ repeatType: e.target.value })}
          style={selectStyle}
        >
          {REPEAT_TYPES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
        </select>

        {interaction.repeatType === 'nth' && (
          <div style={{ marginTop: '4px' }}>
            <label style={labelStyle}>Which visit number?</label>
            <input type="number" min="2" placeholder="2" value={interaction.visitNumber || ''} onChange={e => updateField({ visitNumber: e.target.value })} style={inputStyle} />
          </div>
        )}
      </div>

      <div style={{ background: '#1a1a2e', borderRadius: '4px', padding: '8px', marginBottom: '6px', border: '1px solid #333' }}>
        <label style={{ ...labelStyle, color: '#7aaaff', fontWeight: 'bold' }}>Additional condition (optional)</label>
        <ConditionBuilder
          condition={interaction.condition}
          onChange={(condition) => updateField({ condition })}
          gameData={gameData}
        />
      </div>

      <BlockList
        blocks={blocks}
        onChange={updateBlocks}
        depth={1}
        onOpenSubpanel={(entry) => setSubpanelStack([{ label: entry.label, depth: entry.depth, path: [entry.segment] }])}
        gameData={gameData}
      />

      {subpanelStack && subpanelStack.length > 0 && (() => {
        const top = subpanelStack[subpanelStack.length - 1];
        return (
          <ChoiceSubpanel
            stack={subpanelStack}
            blocks={getBlocksAtPath(interaction.blocks || [], top.path)}
            onUpdateBlocks={(newBlocks) => onUpdate({ ...interaction, blocks: setBlocksAtPath(interaction.blocks || [], top.path, newBlocks) })}
            onBack={() => subpanelStack.length > 1 ? setSubpanelStack(subpanelStack.slice(0, -1)) : setSubpanelStack(null)}
            onOpenSubpanel={(newStack) => setSubpanelStack(newStack)}
            gameData={gameData}
          />
        );
      })()}
    </div>
  );
}

function TimeColumn({ period, color, data, onUpdate, gameData }) {
  const interactions = data.interactions || [];
  const bg = data.bg || '';

  const updateBg = (val) => onUpdate({ ...data, bg: val });

  const addInteraction = () => {
    const newInteraction = {
      id: Date.now(),
      collapsed: false,
      blocks: [],
      presenceCondition: 'none',
      presenceTarget: '',
      repeatType: 'always',
      visitNumber: '',
      condition: null,
    };
    onUpdate({ ...data, interactions: [...interactions, newInteraction] });
  };

  const removeInteraction = (id) => {
    onUpdate({ ...data, interactions: interactions.filter(i => i.id !== id) });
  };

  const toggleCollapse = (id) => {
    onUpdate({ ...data, interactions: interactions.map(i => i.id === id ? { ...i, collapsed: !i.collapsed } : i) });
  };

  const updateInteraction = (id, updated) => {
    onUpdate({ ...data, interactions: interactions.map(i => i.id === id ? updated : i) });
  };

  const getInteractionLabel = (interaction) => {
    const presence = PRESENCE_CONDITIONS.find(p => p.value === (interaction.presenceCondition || 'none'))?.label || 'No condition';
    const repeat = REPEAT_TYPES.find(r => r.value === (interaction.repeatType || 'always'))?.label || 'Every time';
    const target = interaction.presenceTarget ? ` (${interaction.presenceTarget})` : '';
    return `${repeat} · ${presence}${target}`;
  };

  return (
    <div style={{ flex: 1, minWidth: '260px', background: '#2a2a3e', borderRadius: '8px', border: `2px solid ${color}`, display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      <div style={{ padding: '12px 12px 0 12px' }}>
        <div style={{ color: 'white', fontWeight: 'bold', textAlign: 'center', marginBottom: '8px', letterSpacing: '1px' }}>{period}</div>
        <div style={{ marginBottom: '10px' }}>
          <label style={labelStyle}>Background image</label>
          <input placeholder={`bg_${period.toLowerCase()}`} value={bg} onChange={e => updateBg(e.target.value)} style={{ ...inputStyle, background: '#1a1a2e' }} />
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '0 12px' }}>
        {interactions.map(interaction => (
          <div key={interaction.id} style={{ marginBottom: '10px', border: `1px solid ${color}55`, borderRadius: '6px', overflow: 'hidden', position: 'relative' }}>
            <div style={{ background: color + '22', padding: '6px 10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: 'white', fontSize: '11px', fontWeight: 'bold', flex: 1, marginRight: '6px' }}>
                {getInteractionLabel(interaction)}
              </span>
              <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                <button onClick={() => toggleCollapse(interaction.id)} style={{ background: 'none', border: 'none', color: '#aaa', cursor: 'pointer', fontSize: '11px' }}>
                  {interaction.collapsed ? '▼' : '▲'}
                </button>
                <button onClick={() => removeInteraction(interaction.id)} style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer', fontSize: '11px' }}>✕</button>
              </div>
            </div>
            {!interaction.collapsed && (
              <InteractionEditor
                interaction={interaction}
                onUpdate={(updated) => updateInteraction(interaction.id, updated)}
                color={color}
                gameData={gameData}
              />
            )}
          </div>
        ))}
      </div>

      <div style={{ padding: '8px 12px 12px 12px' }}>
        <button
          onClick={addInteraction}
          style={{ width: '100%', padding: '6px', background: '#2d4a7a', color: 'white', border: `1px dashed ${color}`, borderRadius: '6px', cursor: 'pointer', fontSize: '12px' }}
        >
          + Add Interaction
        </button>
      </div>
    </div>
  );
}

export default function LocationPanel({ node, onClose, onUpdateLabel, gameData, locationData, onUpdateLocationData }) {
  const periods = getPeriodsFromGameData(gameData);

  const getPeriodData = (period) => locationData[period] || { bg: '', interactions: [] };

  const updatePeriod = (period, data) => {
    onUpdateLocationData({ ...locationData, [period]: data });
  };

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: '#1a1a2e', zIndex: 1000, display: 'flex', flexDirection: 'column' }}>
      <div style={{ background: '#2d4a7a', padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
          <div style={{ color: '#4a7abf', fontSize: '13px', letterSpacing: '2px', whiteSpace: 'nowrap' }}>LOCATION</div>
          <input
            defaultValue={node.data.label}
            onBlur={e => onUpdateLabel(node.id, { label: e.target.value })}
            onKeyDown={e => e.key === 'Enter' && e.target.blur()}
            style={{ background: 'none', border: 'none', borderBottom: '1px solid #4a7abf', color: 'white', fontSize: '20px', fontWeight: 'bold', outline: 'none', flex: 1 }}
          />
        </div>
        <button onClick={onClose} style={{ background: '#4a7abf', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer' }}>
          ← Back to Map
        </button>
      </div>

      <div style={{ display: 'flex', flex: 1, gap: '12px', padding: '16px', overflowX: 'auto', overflowY: 'hidden' }}>
        {periods.map(period => (
          <TimeColumn
            key={period}
            period={period}
            color={timeColors[period] || '#4a7abf'}
            data={getPeriodData(period)}
            onUpdate={(data) => updatePeriod(period, data)}
            gameData={gameData}
          />
        ))}
      </div>
    </div>
  );
}