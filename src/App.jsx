import { useCallback, useState } from 'react';
import ReactFlow, { useNodesState, useEdgesState, addEdge, Background, Controls, MiniMap, BaseEdge, EdgeLabelRenderer, getBezierPath, useReactFlow } from 'reactflow';
import 'reactflow/dist/style.css';
import LocationNode from './LocationNode';
import SceneNode from './SceneNode';
import TransitionNode from './TransitionNode';
import StoryMasterNode from './StoryMasterNode';
import GroupNode from './GroupNode';
import NoteNode from './NoteNode';
import ShopNode from './ShopNode';
import LocationPanel from './LocationPanel';
import ScenePanel from './ScenePanel';
import TransitionPanel from './TransitionPanel';
import StoryMasterPanel from './StoryMasterPanel';
import SchedulerPanel from './SchedulerPanel';
import InventoryPanel from './InventoryPanel';
import ShopPanel from './ShopPanel';
import { generateScript } from './writer';

const nodeTypes = { location: LocationNode, scene: SceneNode, transition: TransitionNode, storymaster: StoryMasterNode, group: GroupNode, note: NoteNode, shop: ShopNode };

// Edge with a small ✕ button at its midpoint. A normal click just selects the
// edge (then Delete/Backspace removes it); the ✕ removes it instantly.
function DeletableEdge({ id, sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, markerEnd, style, selected }) {
  const { setEdges } = useReactFlow();
  const [edgePath, labelX, labelY] = getBezierPath({ sourceX, sourceY, sourcePosition, targetX, targetY, targetPosition });
  return (
    <>
      <BaseEdge id={id} path={edgePath} markerEnd={markerEnd} style={style} />
      <EdgeLabelRenderer>
        <div
          className="nodrag nopan"
          style={{ position: 'absolute', transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`, pointerEvents: 'all' }}
        >
          <button
            onClick={(e) => { e.stopPropagation(); setEdges(eds => eds.filter(ed => ed.id !== id)); }}
            title="Delete connection"
            style={{ width: '18px', height: '18px', lineHeight: '14px', padding: 0, borderRadius: '50%', border: '1px solid #888', background: '#1a1a2e', color: '#ff6b6b', cursor: 'pointer', fontSize: '11px', opacity: selected ? 1 : 0.55 }}
          >
            ✕
          </button>
        </div>
      </EdgeLabelRenderer>
    </>
  );
}

const edgeTypes = { deletable: DeletableEdge };

const storyMasterNode = {
  id: 'sm_1',
  type: 'storymaster',
  position: { x: 50, y: 50 },
  data: { label: 'Story Master', configured: false },
};

// Preloaded help notes — appear only on a brand-new project (they're part of the
// starting canvas, so once deleted or once a project is saved/loaded they're gone).
const helpNotes = [
  {
    id: 'help_scheduler',
    type: 'note',
    position: { x: 50, y: 260 },
    style: { width: 300, height: 210 },
    data: {
      color: '#ffe08a',
      title: 'How the Scheduler works',
      text: "Add a Scheduler node and pick a character. For each Day + Period cell, choose which location they're in.\n\nIn an interaction, set Presence to 'character present / absent' to gate content on the schedule.\n\nSchedules are per-chapter: open the scheduler and use the chapter tabs to fill in each phase separately. Chapters that share a schedule can be copied by filling them identically.",
    },
  },
  {
    id: 'help_inventory',
    type: 'note',
    position: { x: 370, y: 260 },
    style: { width: 300, height: 200 },
    data: {
      color: '#bde3b0',
      title: 'Building the item inventory',
      text: "Define items in the Inventory panel: name, starting quantity, icon, description, and whether it's a journal/clue entry.\n\nItems with a starting quantity above 0 are preloaded into the player's inventory.\n\nInside interactions, use an Item block to give / take / reveal an item. The inventory screen shows anything with a quantity above 0.",
    },
  },
  {
    id: 'help_images',
    type: 'note',
    position: { x: 690, y: 260 },
    style: { width: 320, height: 240 },
    data: {
      color: '#f6b8c1',
      title: 'Images: backgrounds & sprites',
      text: "Put image files in your game/images/ folder.\n• Backgrounds: JPG, PNG, or WebP.\n• Sprites: PNG or WebP (need transparency).\n\nRen'Py auto-names images from the filename: drops the extension, lowercases, and splits on spaces/underscores. Needs at least TWO words.\n\nalice_happy.png → reference as \"alice happy\" (first word = tag, rest = variants).\n\nIn BG / sprite fields, type with spaces: bg_kitchen.png → type \"bg kitchen\". Single-word names won't auto-define, and don't start a name with a number.",
    },
  },
  {
    id: 'help_groups',
    type: 'note',
    position: { x: 50, y: 490 },
    style: { width: 460, height: 220 },
    data: {
      color: '#c8d8f0',
      title: 'Chapter groups vs Region groups — read this!',
      text: "CHAPTERS and REGIONS are for two different kinds of games and are NOT compatible with each other in the same project yet.\n\n• CHAPTER groups: the same map repeats across phases/weeks. Progression is time- or points-based. The script generates a chapter_N label for each group.\n\n• REGION groups: a large map for RPG-style games. Locations are all connected in one space; you move region-to-region. There are no chapter labels — everything is one play-space.\n\nBuilding one game that mixes both (e.g. a repeating house + a static cave region) is a planned feature but not yet supported. The cave would only be reachable from Chapter 1.",
    },
  },
  {
    id: 'help_drag',
    type: 'note',
    position: { x: 530, y: 490 },
    style: { width: 340, height: 200 },
    data: {
      color: '#e8d0f0',
      title: 'Groups: drag & membership',
      text: "A location belongs to whichever chapter or region group box it physically sits inside at the time you generate the script.\n\nDragging a group box does NOT automatically move the nodes inside it (this is a known limitation). If you drag the group away from its nodes, those nodes will no longer be inside any chapter and will silently fall back to Chapter 1.\n\nTo move a group with its contents: select all the location nodes AND the group box together, then drag.",
    },
  },
];

const initialNodes = [storyMasterNode, ...helpNotes];
const initialEdges = [];

let nodeId = 3;
let groupId = 1;

const GROUP_COLORS = [
  '#4a7abf', '#4abf6a', '#bf4a4a', '#bf9a4a',
  '#9a4abf', '#4abfbf', '#bf4a9a', '#7abf4a',
];

// Reassign Chapter-kind groups to a clean 1..N (and recolor) so deleting any group
// closes the gap. Region groups carry only a display name and no number.
function renumberChapterGroups(nds, progressionLabel) {
  const chapters = nds
    .filter(n => n.type === 'group' && n.data.kind !== 'region')
    .sort((a, b) => (a.data.groupNumber || 0) - (b.data.groupNumber || 0));
  const numById = {};
  chapters.forEach((g, i) => { numById[g.id] = i + 1; });
  return nds.map(n => {
    if (n.type !== 'group') return n;
    if (n.data.kind === 'region') {
      return { ...n, data: { ...n.data, label: n.data.name || 'Region' } };
    }
    const k = numById[n.id];
    return { ...n, data: { ...n.data, groupNumber: k, label: `${progressionLabel} ${k}`, color: GROUP_COLORS[(k - 1) % GROUP_COLORS.length] } };
  });
}

const initialGameData = {
  projectName: '',
  gameType: 'location',
  timePeriods: 'four',
  activeDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
  timeAdvance: 'actions',
  actionsToAdvance: 2,
  navigationThreshold: 3,
  characters: [],
  locations: [],
  items: [],
  pointSystems: [],
  progressionLabel: 'Chapter',
  progressionTrigger: 'points',
  pointsToAdvance: 10,
  daysPerGroup: 7,
  gameOver: 'none',
  hudItems: { showDay: true, showPeriod: true, showPoints: true, showInventory: true, showJournal: false },
  locationData: {},
  schedulers: [],
};

const HELP_NODES = [
  { icon: '⭐', name: 'Story Master', desc: 'Global project setup — game type, time system, characters, point systems, progression rules, and HUD. Set this up first.' },
  { icon: '📍', name: 'Location', desc: 'A place the player can visit. Contains interactions organized by time of day. Connect locations together to build your map.' },
  { icon: '🎬', name: 'Scene', desc: 'A linear sequence of dialogue and actions. Can branch with choice exits that wire to other scenes.' },
  { icon: '⚡', name: 'Transition', desc: 'Plays between locations or at game events. Set to Always, Once, or Trigger mode.' },
  { icon: '📅', name: 'Schedulers', desc: 'Place characters or items at specific locations on specific days and times. One scheduler per character or item.' },
  { icon: '🎒', name: 'Inventory', desc: 'Define items players can collect, trade, and use. Items appear in interaction blocks and condition checks automatically.' },
  { icon: '📦', name: 'Groups', desc: 'Select nodes and right-click to group them into a chapter/phase. Groups are numbered automatically based on your Story Master settings.' },
];

function toVariable(name) {
  return name.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
}

function getBoundingBox(selectedNodes) {
  const padding = 40;
  const minX = Math.min(...selectedNodes.map(n => n.position.x)) - padding;
  const minY = Math.min(...selectedNodes.map(n => n.position.y)) - padding;
  const maxX = Math.max(...selectedNodes.map(n => n.position.x + (n.width || 180))) + padding;
  const maxY = Math.max(...selectedNodes.map(n => n.position.y + (n.height || 80))) + padding;
  return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
}

export default function App() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [openNode, setOpenNode] = useState(null);
  const [menu, setMenu] = useState(null);
  const [configured, setConfigured] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(true);
  const [gameData, setGameData] = useState(initialGameData);
  const [showScheduler, setShowScheduler] = useState(false);
  const [showInventory, setShowInventory] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [selectedNodes, setSelectedNodes] = useState([]);

  const updateGameData = useCallback((changes) => {
    setGameData(prev => ({ ...prev, ...changes }));
  }, []);

  const onConnect = useCallback((params) => setEdges((eds) => addEdge({ ...params, type: 'deletable' }, eds)), [setEdges]);

  const onNodeDoubleClick = useCallback((event, node) => {
    if (node.type === 'group') return;
    setOpenNode(node);
  }, []);

  const onPaneContextMenu = useCallback((event) => {
    event.preventDefault();
    if (!configured) return;
    setMenu({ x: event.clientX, y: event.clientY, hasSelection: selectedNodes.filter(n => n.type !== 'group').length > 0 });
  }, [configured, selectedNodes]);

  const groupSelectedNodes = useCallback(() => {
    const validSelected = selectedNodes.filter(n => n.type !== 'group' && n.type !== 'storymaster');
    if (validSelected.length === 0) return;

    const bbox = getBoundingBox(validSelected);
    const existingNums = nodes.filter(n => n.type === 'group' && n.data.kind !== 'region').map(n => n.data.groupNumber || 0);
    const gNum = (existingNums.length ? Math.max(...existingNums) : 0) + 1;
    const uid = groupId++; // node id stays globally unique even if numbers repeat
    const color = GROUP_COLORS[(gNum - 1) % GROUP_COLORS.length];
    const label = `${gameData.progressionLabel} ${gNum}`;

    const groupNode = {
      id: `group_${uid}`,
      type: 'group',
      position: { x: bbox.x, y: bbox.y },
      style: { width: bbox.width, height: bbox.height },
      data: { label, groupNumber: gNum, color, kind: 'chapter' },
      zIndex: -1,
    };

    setNodes(nds => renumberChapterGroups([groupNode, ...nds], gameData.progressionLabel));
    setMenu(null);
  }, [selectedNodes, gameData.progressionLabel, setNodes, nodes]);

  // Toggle a group between Chapter (drives progression) and Region (visual only).
  const setGroupKind = useCallback((groupNodeId, kind) => {
    setNodes(nds => renumberChapterGroups(
      nds.map(n => n.id === groupNodeId
        ? { ...n, data: { ...n.data, kind, ...(kind === 'region' ? { name: n.data.name || 'Region' } : {}) } }
        : n),
      gameData.progressionLabel
    ));
  }, [setNodes, gameData.progressionLabel]);

  const renameRegion = useCallback((groupNodeId) => {
    const g = nodes.find(n => n.id === groupNodeId);
    const next = window.prompt('Region name:', g?.data?.name || 'Region');
    if (next == null) return;
    setNodes(nds => nds.map(n => n.id === groupNodeId ? { ...n, data: { ...n.data, name: next, label: next } } : n));
  }, [nodes, setNodes]);

  const cloneGroup = useCallback((groupNode) => {
    const gNum = groupId++;
    const color = GROUP_COLORS[(gNum - 1) % GROUP_COLORS.length];
    const label = `${gameData.progressionLabel} ${gNum}`;
    const offset = 50;

    const newGroup = {
      ...groupNode,
      id: `group_${gNum}`,
      position: { x: groupNode.position.x + offset, y: groupNode.position.y + offset },
      data: { label, groupNumber: gNum, color },
    };

    const childNodes = nodes.filter(n => {
      if (!n.position) return false;
      const gx = groupNode.position.x;
      const gy = groupNode.position.y;
      const gw = groupNode.style?.width || 400;
      const gh = groupNode.style?.height || 300;
      return n.type !== 'group' && n.type !== 'storymaster' &&
        n.position.x >= gx && n.position.x <= gx + gw &&
        n.position.y >= gy && n.position.y <= gy + gh;
    });

    const clonedChildren = childNodes.map(n => ({
      ...n,
      id: `${nodeId++}`,
      position: { x: n.position.x + offset, y: n.position.y + offset },
      data: { ...n.data },
    }));

    setNodes(nds => [...nds, newGroup, ...clonedChildren]);
    setMenu(null);
  }, [nodes, gameData.progressionLabel, setNodes]);

  // Clone selected nodes with fresh ids. Critically, this also carries over the
  // hidden interaction data (gameData.locationData, keyed by node id), the edges
  // BETWEEN cloned nodes (so navigation paths survive), and locations entries.
  // Names are kept identical — the generated script disambiguates by node id —
  // so a duplicated map reads the same in-game.
  const cloneNodes = useCallback((toClone) => {
    const clonable = (toClone || []).filter(n => n.type !== 'group' && n.type !== 'storymaster');
    if (clonable.length === 0) return;

    const offset = 60;
    const idMap = {};
    const newNodes = clonable.map(n => {
      const newId = `${nodeId++}`;
      idMap[n.id] = newId;
      return {
        id: newId,
        type: n.type,
        position: { x: n.position.x + offset, y: n.position.y + offset },
        data: JSON.parse(JSON.stringify(n.data)),
      };
    });

    // Only clone edges whose BOTH endpoints are in the cloned set.
    const clonedEdges = edges
      .filter(e => idMap[e.source] && idMap[e.target])
      .map(e => ({
        ...e,
        source: idMap[e.source],
        target: idMap[e.target],
        id: `reactflow__edge-${idMap[e.source]}${e.sourceHandle || ''}-${idMap[e.target]}${e.targetHandle || ''}-c${nodeId}${Math.floor(Math.random() * 1000)}`,
        selected: false,
      }));

    setNodes(nds => [...nds, ...newNodes]);
    if (clonedEdges.length > 0) setEdges(eds => [...eds, ...clonedEdges]);

    setGameData(prev => {
      const newLocationData = { ...prev.locationData };
      const newLocations = [...prev.locations];
      clonable.forEach(n => {
        if (n.type !== 'location') return;
        const newId = idMap[n.id];
        if (prev.locationData[n.id]) {
          newLocationData[newId] = JSON.parse(JSON.stringify(prev.locationData[n.id]));
        }
        const src = prev.locations.find(l => l.id === n.id);
        const name = (src && src.name) || n.data.label || 'New Location';
        newLocations.push({ ...(src || {}), id: newId, name, variable: toVariable(name) });
      });
      return { ...prev, locationData: newLocationData, locations: newLocations };
    });

    setMenu(null);
  }, [edges, setNodes, setEdges]);

  const addNode = useCallback((type) => {
    const newId = `${nodeId++}`;
    const defaults = {
      location: { label: 'New Location' },
      scene: { label: 'New Scene', choices: [] },
      transition: { label: 'New Transition', mode: 'always', trigger: 'Game Start' },
      note: { title: 'Note', text: '', color: '#f4d35e' },
      shop: { label: 'New Shop', bg: '', shopkeeperSprite: '', openingBlocks: [], closingBlocks: [], loopBack: false, items: [] },
    };
    const newNode = {
      id: newId,
      type,
      position: { x: menu.x - 90, y: menu.y - 40 },
      data: defaults[type],
      ...(type === 'note' ? { style: { width: 240, height: 160 } } : {}),
    };
    setNodes(nds => [...nds, newNode]);

    if (type === 'location') {
      const newLoc = { id: newId, name: 'New Location', variable: 'new_location' };
      setGameData(prev => ({ ...prev, locations: [...prev.locations, newLoc] }));
    }

    setMenu(null);
  }, [menu, setNodes]);

  const onNodesDelete = useCallback((deleted) => {
    deleted.forEach(n => {
      if (n.type === 'location') {
        setGameData(prev => ({
          ...prev,
          locations: prev.locations.filter(l => l.id !== n.id),
          locationData: Object.fromEntries(Object.entries(prev.locationData).filter(([k]) => k !== n.id))
        }));
      }
    });
    // If any group was removed, renumber the remaining chapters so there are no gaps.
    if (deleted.some(n => n.type === 'group')) {
      const removed = new Set(deleted.map(d => d.id));
      setNodes(nds => renumberChapterGroups(nds.filter(n => !removed.has(n.id)), gameData.progressionLabel));
    }
  }, [setNodes, gameData.progressionLabel]);

  const updateNodeData = useCallback((nodeId, changes) => {
    setNodes(nds => nds.map(n => {
      if (n.id !== nodeId) return n;
      const updated = { ...n, data: { ...n.data, ...changes } };
      if (n.type === 'location' && changes.label) {
        setGameData(prev => ({
          ...prev,
          locations: prev.locations.map(l =>
            l.id === nodeId ? { ...l, name: changes.label, variable: toVariable(changes.label) } : l
          )
        }));
      }
      return updated;
    }));
  }, [setNodes]);

  const updateSceneChoices = useCallback((nodeId, choices) => {
    setNodes(nds => nds.map(n => n.id === nodeId ? { ...n, data: { ...n.data, choices } } : n));
  }, [setNodes]);

  const updateLocationData = useCallback((nodeId, data) => {
    setGameData(prev => ({
      ...prev,
      locationData: { ...prev.locationData, [nodeId]: data }
    }));
  }, []);

  const updateSceneLabel = useCallback((nodeId, label) => {
    updateNodeData(nodeId, { label });
  }, [updateNodeData]);

  const handleStoryMasterClose = useCallback(() => {
    setOpenNode(null);
    setConfigured(true);
    setShowOnboarding(false);
  }, []);

  const openStoryMaster = () => {
    setOpenNode(nodes.find(n => n.type === 'storymaster'));
    setShowOnboarding(false);
  };

  const syncedNodes = nodes.map(n => {
    if (n.type === 'storymaster') {
      return { ...n, data: { ...n.data, projectName: gameData.projectName, gameType: gameData.gameType, configured } };
    }
    if (n.type === 'group') {
      if (n.data.kind === 'region') {
        return { ...n, data: { ...n.data, label: n.data.name || 'Region' } };
      }
      return { ...n, data: { ...n.data, label: n.data.label.replace(/^\S+/, gameData.progressionLabel) } };
    }
    return n;
  });

const saveProject = useCallback(() => {
  const saveData = {
    nodes,
    edges,
    gameData,
    configured,
    groupIdCounter: groupId,
    nodeIdCounter: nodeId,
  };
  const blob = new Blob([JSON.stringify(saveData, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${gameData.projectName || 'rpywriter_project'}.json`;
  a.click();
  URL.revokeObjectURL(url);
}, [nodes, edges, gameData, configured]);

const loadProject = useCallback(() => {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.json';
  input.onchange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target.result);
        setNodes(data.nodes || initialNodes);
        setEdges((data.edges || []).map(e => ({ ...e, type: 'deletable' })));
        setGameData(data.gameData || initialGameData);
        setConfigured(data.configured || false);
        setShowOnboarding(false);
        if (data.groupIdCounter) groupId = data.groupIdCounter;
        if (data.nodeIdCounter) nodeId = data.nodeIdCounter;
      } catch (e) {
        alert('Failed to load project — invalid file.');
      }
    };
    reader.readAsText(file);
  };
  input.click();
}, [setNodes, setEdges]);

  return (
    <div style={{ width: '100vw', height: '100vh', background: '#1a1a2e' }} onClick={() => setMenu(null)}>

      {showOnboarding && !configured && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
          background: 'rgba(10,5,20,0.92)', zIndex: 2000,
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'
        }}>
          <div style={{ textAlign: 'center', maxWidth: '480px', padding: '40px' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>📖</div>
            <div style={{ color: 'white', fontSize: '28px', fontWeight: 'bold', marginBottom: '12px' }}>Welcome to RPY Writer</div>
            <div style={{ color: '#aaa', fontSize: '14px', marginBottom: '32px', lineHeight: '1.6' }}>
              Before you start building your game, let's set up your project in the Story Master. It only takes a minute and unlocks everything else.
            </div>
            <button onClick={openStoryMaster} style={{ background: '#9a4abf', color: 'white', border: 'none', padding: '14px 32px', borderRadius: '8px', cursor: 'pointer', fontSize: '16px', fontWeight: 'bold' }}>
              Set Up My Project →
            </button>
            <div onClick={() => { setShowOnboarding(false); setConfigured(true); }} style={{ color: '#666', fontSize: '12px', marginTop: '16px', cursor: 'pointer', textDecoration: 'underline' }}>
              Skip for now
            </div>
          </div>
        </div>
      )}

      {/* Top bar */}
      <div style={{
        position: 'fixed', top: 0, left: 0, right: 0, height: '44px',
        background: '#1a1a2e', borderBottom: '1px solid #333',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 16px', zIndex: 500, gap: '12px'
      }}>
        <div style={{ color: '#9a4abf', fontWeight: 'bold', fontSize: '14px', letterSpacing: '1px', whiteSpace: 'nowrap' }}>
          RPY WRITER {gameData.projectName ? `— ${gameData.projectName}` : ''}
        </div>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button onClick={() => setShowHelp(true)} style={{ background: 'none', color: '#aaa', border: '1px solid #444', padding: '4px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' }}>
            ? Help
          </button>
          <button onClick={saveProject} style={{ background: 'none', color: '#aaa', border: '1px solid #444', padding: '4px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' }}>
            💾 Save
          </button>
          <button onClick={loadProject} style={{ background: 'none', color: '#aaa', border: '1px solid #444', padding: '4px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' }}>
            📂 Load
          </button>
          <button onClick={() => setShowScheduler(true)} style={{ background: '#2a3a2a', color: '#4a8a4a', border: '1px solid #4a8a4a', padding: '4px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' }}>
            📅 Schedulers
          </button>
          <button onClick={() => setShowInventory(true)} style={{ background: '#1a2a3a', color: '#4a8abf', border: '1px solid #4a8abf', padding: '4px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' }}>
            🎒 Inventory
          </button>
          {selectedNodes.filter(n => n.type !== 'group' && n.type !== 'storymaster').length >= 1 && (
            <button onClick={() => cloneNodes(selectedNodes)} style={{ background: '#2a3a2a', color: '#4abf6a', border: '1px solid #4abf6a', padding: '4px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' }}>
              ⧉ Clone
            </button>
          )}
          {selectedNodes.filter(n => n.type !== 'group' && n.type !== 'storymaster').length > 1 && (
            <button onClick={groupSelectedNodes} style={{ background: '#3a2a1a', color: '#bf8a4a', border: '1px solid #bf8a4a', padding: '4px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' }}>
              📦 Group Selection
            </button>
          )}
          {selectedNodes.length === 1 && selectedNodes[0].type === 'group' && (() => {
            const g = nodes.find(n => n.id === selectedNodes[0].id) || selectedNodes[0];
            const isRegion = g.data.kind === 'region';
            return (
              <>
                <button onClick={() => setGroupKind(g.id, isRegion ? 'chapter' : 'region')} style={{ background: '#2a2a3e', color: isRegion ? '#bf8a4a' : '#7aaaff', border: `1px solid ${isRegion ? '#bf8a4a' : '#7aaaff'}`, padding: '4px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' }}>
                  {isRegion ? '→ Make Chapter' : '→ Make Region'}
                </button>
                {isRegion && (
                  <button onClick={() => renameRegion(g.id)} style={{ background: 'none', color: '#aaa', border: '1px solid #444', padding: '4px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' }}>
                    ✎ Rename
                  </button>
                )}
              </>
            );
          })()}
          <button onClick={() => {
            const script = generateScript(nodes, edges, gameData);
            const blob = new Blob([script], { type: 'text/plain' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
              a.href = url;
              a.download = `${gameData.projectName || 'script'}.rpy`;
              a.click();
           URL.revokeObjectURL(url);
          }} style={{ background: '#9a4abf', color: 'white', border: 'none', padding: '6px 16px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}>
           ▶ Generate Script
          </button>
        </div>
      </div>

      {showHelp && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.7)', zIndex: 3000, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setShowHelp(false)}>
          <div style={{ background: '#2a2a3e', border: '1px solid #444', borderRadius: '12px', padding: '24px', maxWidth: '500px', width: '90%' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ color: 'white', fontSize: '18px', fontWeight: 'bold' }}>Node Guide</div>
              <button onClick={() => setShowHelp(false)} style={{ background: 'none', border: 'none', color: '#aaa', cursor: 'pointer', fontSize: '18px' }}>✕</button>
            </div>
            <div style={{ color: '#aaa', fontSize: '12px', marginBottom: '16px' }}>Right-click the canvas to add nodes. Double-click a node to open it. Select multiple nodes and click "Group Selection" to create a chapter group.</div>
            {HELP_NODES.map(n => (
              <div key={n.name} style={{ marginBottom: '12px', padding: '10px', background: '#1a1a2e', borderRadius: '6px' }}>
                <div style={{ color: 'white', fontWeight: 'bold', marginBottom: '4px' }}>{n.icon} {n.name}</div>
                <div style={{ color: '#aaa', fontSize: '12px', lineHeight: '1.5' }}>{n.desc}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ paddingTop: '44px', width: '100%', height: '100%' }}>
        <ReactFlow
          nodes={syncedNodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeDoubleClick={onNodeDoubleClick}
          onPaneContextMenu={onPaneContextMenu}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          deleteKeyCode={['Delete', 'Backspace']}
          connectionMode="loose"
          onNodesDelete={onNodesDelete}
          onSelectionChange={({ nodes: selected }) => setSelectedNodes(selected)}
          fitView
        >
          <Background color="#444" gap={16} />
          <Controls />
          <MiniMap style={{ background: '#2a2a3e' }} />
        </ReactFlow>
      </div>

      {menu && (
        <div style={{ position: 'fixed', top: menu.y, left: menu.x, background: '#2a2a3e', border: '1px solid #444', borderRadius: '8px', overflow: 'hidden', zIndex: 1000, boxShadow: '0 4px 12px rgba(0,0,0,0.5)' }}>
          <div style={{ padding: '6px 0', minWidth: '180px' }}>
            <div style={{ padding: '4px 12px', color: '#888', fontSize: '10px', letterSpacing: '1px' }}>ADD NODE</div>
            {[
              { type: 'location', label: '📍 Location' },
              { type: 'scene', label: '🎬 Scene' },
              { type: 'transition', label: '⚡ Transition' },
              { type: 'shop', label: '🛒 Shop' },
              { type: 'note', label: '📝 Note' },
            ].map(item => (
              <div key={item.type} onClick={() => addNode(item.type)} style={{ padding: '8px 16px', color: 'white', cursor: 'pointer', fontSize: '13px' }}
                onMouseEnter={e => e.currentTarget.style.background = '#3a3a5e'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                {item.label}
              </div>
            ))}
            {menu.hasSelection && (
              <>
                <div style={{ borderTop: '1px solid #333', margin: '4px 0' }} />
                <div onClick={() => cloneNodes(selectedNodes)} style={{ padding: '8px 16px', color: '#4abf6a', cursor: 'pointer', fontSize: '13px' }}
                  onMouseEnter={e => e.currentTarget.style.background = '#3a3a5e'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  ⧉ Clone Selection
                </div>
                <div onClick={groupSelectedNodes} style={{ padding: '8px 16px', color: '#bf8a4a', cursor: 'pointer', fontSize: '13px' }}
                  onMouseEnter={e => e.currentTarget.style.background = '#3a3a5e'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  📦 Group Selection
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {showScheduler && (
        <SchedulerPanel onClose={() => setShowScheduler(false)} gameData={gameData} schedulers={gameData.schedulers || []} onUpdateSchedulers={(schedulers) => updateGameData({ schedulers })} nodes={nodes} />
      )}

      {showInventory && (
        <InventoryPanel onClose={() => setShowInventory(false)} gameData={gameData} onUpdateItems={(items) => updateGameData({ items })} />
      )}

      {openNode?.type === 'location' && (
        <LocationPanel node={openNode} onClose={() => setOpenNode(null)} gameData={gameData} onUpdateLabel={updateNodeData} locationData={gameData.locationData[openNode.id] || {}} onUpdateLocationData={(data) => updateLocationData(openNode.id, data)} />
      )}
      {openNode?.type === 'scene' && (
        <ScenePanel node={openNode} onClose={() => setOpenNode(null)} onUpdateChoices={updateSceneChoices} onUpdateLabel={updateSceneLabel} onUpdateData={updateNodeData} gameData={gameData} />
      )}
      {openNode?.type === 'transition' && (
        <TransitionPanel node={openNode} onClose={() => setOpenNode(null)} onUpdateData={updateNodeData} gameData={gameData} />
      )}
      {openNode?.type === 'shop' && (
        <ShopPanel node={openNode} onClose={() => setOpenNode(null)} onUpdateData={updateNodeData} gameData={gameData} />
      )}
      {openNode?.type === 'storymaster' && (
        <StoryMasterPanel node={openNode} onClose={handleStoryMasterClose} gameData={gameData} updateGameData={updateGameData} isFirstTime={!configured} />
      )}
    </div>
  );
}