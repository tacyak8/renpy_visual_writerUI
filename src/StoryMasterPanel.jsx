import { useState } from 'react';

const inputStyle = { width: '100%', background: '#2a2a3e', border: '1px solid #444', color: 'white', padding: '6px', borderRadius: '4px', boxSizing: 'border-box', marginBottom: '4px' };
const labelStyle = { color: '#aaa', fontSize: '11px', display: 'block', marginBottom: '4px' };
const selectStyle = { ...inputStyle };

const STEPS = [
  { id: 'gametype', title: '🎮 Game Type' },
  { id: 'time', title: '⏰ Time System' },
  { id: 'definitions', title: '📋 Definitions' },
  { id: 'player', title: '🧑 Player Character' },
  { id: 'points', title: '🏆 Point Systems' },
  { id: 'progression', title: '📖 Progression' },
  { id: 'hud', title: '🖥 HUD' },
];

function toVariable(name) {
  return name.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
}

function HelpBox({ text }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ marginBottom: '12px' }}>
      <button
        onClick={() => setOpen(!open)}
        style={{ background: 'none', border: '1px solid #444', color: '#888', borderRadius: '4px', padding: '2px 8px', cursor: 'pointer', fontSize: '11px' }}
      >
        {open ? '✕ Close help' : '? Help'}
      </button>
      {open && (
        <div style={{ background: '#2a1a3a', border: '1px solid #9a4abf55', borderRadius: '6px', padding: '10px', marginTop: '6px', color: '#cc99ff', fontSize: '12px', lineHeight: '1.6' }}>
          {text}
        </div>
      )}
    </div>
  );
}

function StepGameType({ data, onChange }) {
  return (
    <div>
      <div style={{ color: 'white', fontSize: '16px', fontWeight: 'bold', marginBottom: '8px' }}>What kind of game are you making?</div>
      <HelpBox text="Location Based games let players move between rooms or areas and interact with characters and items they find there. Linear Story games play out like a visual novel — scenes happen in sequence with choices branching the path." />
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
        {[
          { value: 'location', label: '🗺 Location Based', desc: 'Players navigate between locations. Best for adventure games, mysteries, life sims.' },
          { value: 'linear', label: '📖 Linear Story', desc: 'Scenes play in sequence. Best for visual novels, cutscene-driven stories.' },
        ].map(opt => (
          <div
            key={opt.value}
            onClick={() => onChange({ gameType: opt.value })}
            style={{
              padding: '16px', borderRadius: '8px', cursor: 'pointer',
              border: `2px solid ${data.gameType === opt.value ? '#9a4abf' : '#444'}`,
              background: data.gameType === opt.value ? '#3a1a4a' : '#2a2a3e'
            }}
          >
            <div style={{ color: 'white', fontSize: '14px', fontWeight: 'bold', marginBottom: '4px' }}>{opt.label}</div>
            <div style={{ color: '#aaa', fontSize: '12px' }}>{opt.desc}</div>
          </div>
        ))}
      </div>
      <label style={labelStyle}>Project name</label>
      <input value={data.projectName || ''} onChange={e => onChange({ projectName: e.target.value })} placeholder="My Game" style={inputStyle} />
    </div>
  );
}

function StepTime({ data, onChange }) {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const toggleDay = (day) => {
    const current = data.activeDays || days;
    const updated = current.includes(day) ? current.filter(d => d !== day) : [...current, day];
    onChange({ activeDays: updated });
  };

  return (
    <div>
      <div style={{ color: 'white', fontSize: '16px', fontWeight: 'bold', marginBottom: '8px' }}>Time System</div>
      <HelpBox text="This controls how time passes in your game. Each location can have different content depending on the time of day. If you don't need time, select 'No time system' and locations will show the same content always." />

      <label style={labelStyle}>Time periods per day</label>
      <select value={data.timePeriods || 'four'} onChange={e => onChange({ timePeriods: e.target.value })} style={selectStyle}>
        <option value="none">No time system</option>
        <option value="four">Four periods (Morning / Afternoon / Evening / Night)</option>
        <option value="two">Two periods (Day / Night)</option>
        <option value="three">Three periods (Morning / Afternoon / Evening)</option>
      </select>

      {data.timePeriods !== 'none' && (
        <div style={{ marginTop: '16px' }}>
          <label style={labelStyle}>Active days of the week</label>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '16px' }}>
            {days.map(day => (
              <div key={day} onClick={() => toggleDay(day)} style={{
                padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px',
                border: `1px solid ${(data.activeDays || days).includes(day) ? '#9a4abf' : '#444'}`,
                background: (data.activeDays || days).includes(day) ? '#3a1a4a' : '#2a2a3e',
                color: 'white'
              }}>
                {day}
              </div>
            ))}
          </div>

          <label style={labelStyle}>Time advances when...</label>
          <select value={data.timeAdvance || 'actions'} onChange={e => onChange({ timeAdvance: e.target.value })} style={selectStyle}>
            <option value="actions">Player completes first-visit interactions</option>
            <option value="navigation">Player navigates between locations</option>
            <option value="trigger">Via Transition nodes / Trigger blocks only</option>
          </select>

          {data.timeAdvance === 'actions' && (
            <div style={{ marginTop: '8px' }}>
              <label style={labelStyle}>Number of first-visit interactions to advance time</label>
              <input type="number" min="1" max="10" value={data.actionsToAdvance || 2} onChange={e => onChange({ actionsToAdvance: parseInt(e.target.value) })} style={inputStyle} />
            </div>
          )}

          {data.timeAdvance === 'navigation' && (
            <div style={{ marginTop: '8px' }}>
              <label style={labelStyle}>Number of location moves to advance time</label>
              <input type="number" min="1" max="20" value={data.navigationThreshold || 3} onChange={e => onChange({ navigationThreshold: parseInt(e.target.value) })} style={inputStyle} />
            </div>
          )}

          {data.timeAdvance === 'trigger' && (
            <div style={{ marginTop: '8px', background: '#2a1a3a', border: '1px solid #9a4abf55', borderRadius: '6px', padding: '10px' }}>
              <div style={{ color: '#cc99ff', fontSize: '12px' }}>Time will only advance when a Transition node set to "Trigger" mode fires, or when a "Trigger Progression" block is completed inside a location interaction.</div>
            </div>
          )}

          <div style={{ marginTop: '16px' }}>
            <label style={labelStyle}>Game starts at (Day 1 opening location)</label>
            <input
              value={data.gameStartLocation || ''}
              onChange={e => onChange({ gameStartLocation: e.target.value })}
              placeholder="e.g. Front Door"
              style={inputStyle}
            />
            <div style={{ color: '#777', fontSize: '11px', marginTop: '2px' }}>
              Where the player lands at the very start of the game (Chapter 1, Day 1). Leave blank to use your chapter's first location.
            </div>
          </div>

          <div style={{ marginTop: '16px' }}>
            <label style={labelStyle}>Wake-up location (for End Day blocks)</label>
            <input
              value={data.dayStartLocation || ''}
              onChange={e => onChange({ dayStartLocation: e.target.value })}
              placeholder="e.g. Bedroom"
              style={inputStyle}
            />
            <div style={{ color: '#777', fontSize: '11px', marginTop: '2px' }}>
              Type a location's name (spelling matters, but capitalization and spacing don't). When an "End Day" block runs, the player wakes here the next morning. Leave blank to start each day at your first chapter's first location.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StepDefinitions({ data, onChange }) {
  const characters = data.characters || [];

  const addCharacter = () => onChange({ characters: [...characters, { id: Date.now(), name: '' }] });
  const updateCharacter = (id, name) => onChange({ characters: characters.map(c => c.id === id ? { ...c, name, variable: toVariable(name) } : c) });
  const removeCharacter = (id) => onChange({ characters: characters.filter(c => c.id !== id) });

  return (
    <div>
      <div style={{ color: 'white', fontSize: '16px', fontWeight: 'bold', marginBottom: '8px' }}>Definitions</div>
      <HelpBox text="Define the characters in your game here. Locations are handled automatically when you add Location nodes to the canvas. Character names defined here will be available to select in location interactions and schedulers." />

      <div style={{ marginBottom: '20px' }}>
        <div style={{ color: 'white', fontWeight: 'bold', marginBottom: '8px' }}>Characters</div>
        {characters.map(char => (
          <div key={char.id} style={{ display: 'flex', gap: '8px', marginBottom: '6px', alignItems: 'center' }}>
            <input placeholder="Character name (e.g. Alice)" value={char.name} onChange={e => updateCharacter(char.id, e.target.value)} style={{ ...inputStyle, marginBottom: 0, flex: 1 }} />
            <button onClick={() => removeCharacter(char.id)} style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer', fontSize: '14px' }}>✕</button>
          </div>
        ))}
        <button onClick={addCharacter} style={{ fontSize: '11px', padding: '4px 10px', background: '#3a1a4a', color: 'white', border: '1px dashed #9a4abf', borderRadius: '4px', cursor: 'pointer', marginTop: '4px' }}>
          + Add Character
        </button>
      </div>

      <div style={{ background: '#2a1a3a', border: '1px solid #9a4abf33', borderRadius: '6px', padding: '10px' }}>
        <div style={{ color: '#cc99ff', fontSize: '12px' }}>📍 Locations are added automatically when you create Location nodes on the canvas. No manual entry needed.</div>
      </div>
    </div>
  );
}

function StepPlayer({ data, onChange }) {
  const playerMode = data.playerMode || 'none';

  return (
    <div>
      <div style={{ color: 'white', fontSize: '16px', fontWeight: 'bold', marginBottom: '8px' }}>Player Character</div>
      <HelpBox text="This controls how the player character is identified in your game. You can give the player a fixed name, let them choose their own at the start, or have no named player character at all." />

      <label style={labelStyle}>Player name setting</label>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '16px' }}>
        {[
          { value: 'none', label: '🚫 No player character', desc: 'No player name — narrator-driven story or player has no defined identity.' },
          { value: 'fixed', label: '🏷 Fixed name', desc: 'The player always has the name you set here. Good for story-driven games with a defined protagonist.' },
          { value: 'custom', label: '✏️ Player chooses', desc: 'A name input screen appears at the start of the game. The player types their own name.' },
        ].map(opt => (
          <div
            key={opt.value}
            onClick={() => onChange({ playerMode: opt.value })}
            style={{
              padding: '12px', borderRadius: '8px', cursor: 'pointer',
              border: `2px solid ${playerMode === opt.value ? '#9a4abf' : '#444'}`,
              background: playerMode === opt.value ? '#3a1a4a' : '#2a2a3e'
            }}
          >
            <div style={{ color: 'white', fontSize: '13px', fontWeight: 'bold', marginBottom: '4px' }}>{opt.label}</div>
            <div style={{ color: '#aaa', fontSize: '12px' }}>{opt.desc}</div>
          </div>
        ))}
      </div>

      {playerMode === 'fixed' && (
        <div>
          <label style={labelStyle}>Player display name</label>
          <input
            placeholder="e.g. Dr. Smith"
            value={data.playerName || ''}
            onChange={e => onChange({ playerName: e.target.value })}
            style={inputStyle}
          />
          <label style={labelStyle}>Variable name (used in script)</label>
          <input
            placeholder="e.g. player"
            value={data.playerVariable || 'player'}
            onChange={e => onChange({ playerVariable: e.target.value })}
            style={inputStyle}
          />
        </div>
      )}

      {playerMode === 'custom' && (
        <div>
          <label style={labelStyle}>Default name (shown as placeholder)</label>
          <input
            placeholder="e.g. Detective"
            value={data.playerDefault || ''}
            onChange={e => onChange({ playerDefault: e.target.value })}
            style={inputStyle}
          />
          <label style={labelStyle}>Name input prompt</label>
          <input
            placeholder="e.g. What is your name?"
            value={data.playerPrompt || 'What is your name?'}
            onChange={e => onChange({ playerPrompt: e.target.value })}
            style={inputStyle}
          />
          <label style={labelStyle}>Variable name (used in script)</label>
          <input
            placeholder="player"
            value={data.playerVariable || 'player'}
            onChange={e => onChange({ playerVariable: e.target.value })}
            style={inputStyle}
          />
        </div>
      )}
    </div>
  );
}

function StepPoints({ data, onChange }) {
  const systems = data.pointSystems || [];

  const addSystem = () => onChange({ pointSystems: [...systems, { id: Date.now(), name: '', max: 100, color: '#ffcc44', hudDisplay: 'bar', hudIcon: '' }] });
  const updateSystem = (id, field, value) => onChange({
    pointSystems: systems.map(s => s.id === id ? { ...s, [field]: value, ...(field === 'name' ? { variable: toVariable(value) } : {}) } : s)
  });
  const removeSystem = (id) => onChange({ pointSystems: systems.filter(s => s.id !== id) });

  return (
    <div>
      <div style={{ color: 'white', fontSize: '16px', fontWeight: 'bold', marginBottom: '8px' }}>Point Systems</div>
      <HelpBox text="Point systems track player progress, relationships, or stats. For example: Loyalty, Suspicion, Clues Found. These can trigger chapter progression and show on the HUD. Leave this empty if your game doesn't need points." />

      {systems.map(sys => (
        <div key={sys.id} style={{ background: '#2a2a3e', border: '1px solid #444', borderRadius: '6px', padding: '10px', marginBottom: '8px', position: 'relative' }}>
          <button onClick={() => removeSystem(sys.id)} style={{ position: 'absolute', top: '8px', right: '8px', background: 'none', border: 'none', color: '#888', cursor: 'pointer' }}>✕</button>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-end' }}>
            <div style={{ flex: 2 }}>
              <label style={labelStyle}>Name</label>
              <input placeholder="e.g. Loyalty" value={sys.name} onChange={e => updateSystem(sys.id, 'name', e.target.value)} style={inputStyle} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Max value</label>
              <input type="number" value={sys.max} onChange={e => updateSystem(sys.id, 'max', e.target.value)} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>HUD color</label>
              <input type="color" value={sys.color || '#ffcc44'} onChange={e => updateSystem(sys.id, 'color', e.target.value)} style={{ width: '40px', height: '32px', padding: '2px', background: '#2a2a3e', border: '1px solid #444', borderRadius: '4px', cursor: 'pointer', boxSizing: 'border-box' }} />
            </div>
          </div>

          <div style={{ marginTop: '8px' }}>
            <label style={labelStyle}>HUD display style</label>
            <select value={sys.hudDisplay || 'bar'} onChange={e => updateSystem(sys.id, 'hudDisplay', e.target.value)} style={selectStyle}>
              <option value="bar">Progress bar</option>
              <option value="counter">Icon + number</option>
              <option value="number">Number only</option>
              <option value="pips">Pips (repeated icon)</option>
              <option value="hidden">Hidden (track only)</option>
            </select>

            {(sys.hudDisplay === 'counter' || sys.hudDisplay === 'pips') && (
              <div>
                <label style={labelStyle}>Icon image name</label>
                <input
                  placeholder="e.g. icon heart"
                  value={sys.hudIcon || ''}
                  onChange={e => updateSystem(sys.id, 'hudIcon', e.target.value)}
                  style={inputStyle}
                />
                <div style={{ color: '#777', fontSize: '10px' }}>
                  {sys.hudDisplay === 'pips'
                    ? 'Image shown N times up to max. Keep max ≤ 10 for readability.'
                    : 'Image shown next to the number counter.'}
                </div>
              </div>
            )}
          </div>
        </div>
      ))}

      <button onClick={addSystem} style={{ fontSize: '11px', padding: '4px 10px', background: '#3a1a4a', color: 'white', border: '1px dashed #9a4abf', borderRadius: '4px', cursor: 'pointer' }}>
        + Add Point System
      </button>
    </div>
  );
}

function StepProgression({ data, onChange }) {
  const progressionLabel = data.progressionLabel || 'Chapter';
  const pointSystems = data.pointSystems || [];
  const selectedSystems = data.progressionPointSystems || [];

  const togglePointSystem = (id) => {
    const updated = selectedSystems.includes(id) ? selectedSystems.filter(s => s !== id) : [...selectedSystems, id];
    onChange({ progressionPointSystems: updated });
  };

  return (
    <div>
      <div style={{ color: 'white', fontSize: '16px', fontWeight: 'bold', marginBottom: '8px' }}>Progression</div>
      <HelpBox text="Progression controls how your story moves forward. When the player meets the requirement, the game advances to the next group on your canvas. Groups are numbered automatically — you choose what to call them here." />

      <div style={{ marginBottom: '16px' }}>
        <label style={labelStyle}>What do you call your story groups?</label>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {['Chapter', 'Phase', 'Week', 'Act', 'Part', 'Day'].map(label => (
            <div key={label} onClick={() => onChange({ progressionLabel: label })} style={{
              padding: '6px 14px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px',
              border: `1px solid ${progressionLabel === label ? '#9a4abf' : '#444'}`,
              background: progressionLabel === label ? '#3a1a4a' : '#2a2a3e',
              color: 'white'
            }}>
              {label}
            </div>
          ))}
        </div>
      </div>

      <label style={labelStyle}>Progression is triggered by...</label>
      <select value={data.progressionTrigger || 'points'} onChange={e => onChange({ progressionTrigger: e.target.value })} style={selectStyle}>
        <option value="points">Reaching a point threshold</option>
        <option value="task">Completing a specific task</option>
        <option value="time">Time passage (days elapsed)</option>
        <option value="trigger">Via Transition nodes / Trigger blocks only</option>
      </select>

      {data.progressionTrigger === 'points' && (
        <div style={{ marginTop: '12px' }}>
          <label style={labelStyle}>Which point systems trigger progression? (select all that apply)</label>
          {pointSystems.length === 0 && <div style={{ color: '#888', fontSize: '12px', fontStyle: 'italic', marginBottom: '8px' }}>No point systems defined — go back and add one</div>}
          {pointSystems.map(s => (
            <div key={s.id} onClick={() => togglePointSystem(s.id)} style={{
              padding: '8px 12px', borderRadius: '6px', cursor: 'pointer', marginBottom: '6px',
              border: `2px solid ${selectedSystems.includes(s.id) ? '#9a4abf' : '#444'}`,
              background: selectedSystems.includes(s.id) ? '#3a1a4a' : '#2a2a3e',
              color: 'white', fontSize: '13px',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center'
            }}>
              <span>{s.name || 'Unnamed'}</span>
              <span style={{ fontSize: '11px', color: '#aaa' }}>max: {s.max}</span>
            </div>
          ))}
          <label style={{ ...labelStyle, marginTop: '8px' }}>Points required to advance</label>
          <input type="number" value={data.pointsToAdvance || 10} onChange={e => onChange({ pointsToAdvance: parseInt(e.target.value) })} style={inputStyle} />
        </div>
      )}

      {data.progressionTrigger === 'time' && (
        <div style={{ marginTop: '12px' }}>
          <label style={labelStyle}>Days per group</label>
          <input type="number" min="1" value={data.daysPerGroup || 7} onChange={e => onChange({ daysPerGroup: parseInt(e.target.value) })} style={inputStyle} />
        </div>
      )}

      {data.progressionTrigger === 'trigger' && (
        <div style={{ marginTop: '12px', background: '#2a1a3a', border: '1px solid #9a4abf55', borderRadius: '6px', padding: '10px' }}>
          <div style={{ color: '#cc99ff', fontSize: '12px' }}>Progression will only advance when a Transition node fires or a "Trigger Progression" block is completed inside a location interaction.</div>
        </div>
      )}

      <div style={{ marginTop: '16px' }}>
        <label style={labelStyle}>Game over condition (optional)</label>
        <select value={data.gameOver || 'none'} onChange={e => onChange({ gameOver: e.target.value })} style={selectStyle}>
          <option value="none">No game over</option>
          <option value="points">Points drop to zero</option>
          <option value="time">Time runs out</option>
          <option value="task">Specific task failed</option>
        </select>
      </div>
    </div>
  );
}

function StepHUD({ data, onChange }) {
  const hudItems = data.hudItems || { showDay: true, showPeriod: true, showChapter: true, showPoints: true, showInventory: true, showJournal: false };
  const toggle = (key) => onChange({ hudItems: { ...hudItems, [key]: !hudItems[key] } });

  const items = [
    { key: 'showDay', label: 'Current day', desc: 'Shows Monday, Tuesday etc.' },
    { key: 'showPeriod', label: 'Time period', desc: 'Shows Morning, Afternoon etc.' },
    { key: 'showChapter', label: 'Current chapter/phase', desc: 'Shows which chapter/phase the player is in' },
    { key: 'showPoints', label: 'Point trackers', desc: 'Shows your defined point systems' },
    { key: 'showInventory', label: 'Inventory button', desc: 'Pullup inventory screen' },
    { key: 'showJournal', label: 'Journal / Clue log', desc: 'Shows collected clues and flagged items' },
  ];

  return (
    <div>
      <div style={{ color: 'white', fontSize: '16px', fontWeight: 'bold', marginBottom: '8px' }}>HUD Settings</div>
      <HelpBox text="The HUD is the information displayed on screen while the player is in the game. Check the items you want visible. These can always be changed later by reopening the Story Master." />
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {items.map(item => (
          <div key={item.key} onClick={() => toggle(item.key)} style={{
            padding: '12px', borderRadius: '6px', cursor: 'pointer',
            border: `2px solid ${hudItems[item.key] ? '#9a4abf' : '#444'}`,
            background: hudItems[item.key] ? '#3a1a4a' : '#2a2a3e',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center'
          }}>
            <div>
              <div style={{ color: 'white', fontSize: '13px', fontWeight: 'bold' }}>{item.label}</div>
              <div style={{ color: '#aaa', fontSize: '11px' }}>{item.desc}</div>
            </div>
            <div style={{
              width: '20px', height: '20px', borderRadius: '50%',
              background: hudItems[item.key] ? '#9a4abf' : '#444',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px'
            }}>
              {hudItems[item.key] ? '✓' : ''}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function StoryMasterPanel({ node, onClose, gameData, updateGameData, isFirstTime }) {
  const [step, setStep] = useState(0);

  const onChange = (changes) => updateGameData(changes);

  const canAdvance = () => {
    if (step === 0) return gameData.gameType && gameData.projectName?.trim().length > 0;
    return true;
  };

  const steps = [
    <StepGameType data={gameData} onChange={onChange} />,
    <StepTime data={gameData} onChange={onChange} />,
    <StepDefinitions data={gameData} onChange={onChange} />,
    <StepPlayer data={gameData} onChange={onChange} />,
    <StepPoints data={gameData} onChange={onChange} />,
    <StepProgression data={gameData} onChange={onChange} />,
    <StepHUD data={gameData} onChange={onChange} />,
  ];

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: '#1a1a2e', zIndex: 1000, display: 'flex', flexDirection: 'column' }}>
      <div style={{ background: '#3a1a4a', borderBottom: '2px solid #9a4abf', padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ color: '#cc99ff', fontSize: '13px', letterSpacing: '2px' }}>STORY MASTER — {gameData.projectName || 'New Project'}</div>
        {!isFirstTime && (
          <button onClick={onClose} style={{ background: '#9a4abf', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>
            ← Back to Map
          </button>
        )}
      </div>

      <div style={{ background: '#2a1a3a', padding: '12px 24px', display: 'flex', gap: '8px', overflowX: 'auto' }}>
        {STEPS.map((s, i) => (
          <div
            key={s.id}
            onClick={() => !isFirstTime && setStep(i)}
            style={{
              padding: '6px 12px', borderRadius: '20px', fontSize: '12px', whiteSpace: 'nowrap',
              cursor: isFirstTime ? 'default' : 'pointer',
              background: i === step ? '#9a4abf' : i < step ? '#4a2a6a' : '#2a2a3e',
              color: i === step ? 'white' : i < step ? '#cc99ff' : '#666',
              border: `1px solid ${i === step ? '#9a4abf' : '#444'}`
            }}
          >
            {i < step ? '✓ ' : ''}{s.title}
          </div>
        ))}
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '32px', maxWidth: '700px', width: '100%', margin: '0 auto' }}>
        {steps[step]}
      </div>

      <div style={{ background: '#2a1a3a', padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <button
          onClick={() => setStep(s => Math.max(0, s - 1))}
          disabled={step === 0}
          style={{ background: step === 0 ? '#333' : '#4a2a6a', color: step === 0 ? '#666' : 'white', border: 'none', padding: '8px 20px', borderRadius: '6px', cursor: step === 0 ? 'default' : 'pointer' }}
        >
          ← Back
        </button>
        <div style={{ color: '#aaa', fontSize: '12px' }}>{step + 1} of {STEPS.length}</div>
        {step < STEPS.length - 1 ? (
          <button
            onClick={() => canAdvance() && setStep(s => s + 1)}
            style={{ background: canAdvance() ? '#9a4abf' : '#444', color: 'white', border: 'none', padding: '8px 20px', borderRadius: '6px', cursor: canAdvance() ? 'pointer' : 'default' }}
          >
            Next →
          </button>
        ) : (
          <button
            onClick={onClose}
            style={{ background: '#9a4abf', color: 'white', border: 'none', padding: '8px 20px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
          >
            ✓ Done
          </button>
        )}
      </div>
    </div>
  );
}