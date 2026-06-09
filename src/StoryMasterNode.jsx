export default function StoryMasterNode({ data }) {
  return (
    <div style={{
      background: '#3a1a4a',
      border: '2px solid #9a4abf',
      borderRadius: '8px',
      minWidth: '200px',
      color: 'white',
      fontFamily: 'sans-serif',
    }}>
      <div style={{
        background: '#9a4abf',
        padding: '6px 10px',
        borderRadius: '6px 6px 0 0',
        fontSize: '11px',
        letterSpacing: '2px',
        textAlign: 'center',
      }}>
        STORY MASTER
      </div>
      <div style={{ padding: '10px', textAlign: 'center' }}>
        <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>{data.projectName || 'New Project'}</div>
        <div style={{ fontSize: '11px', color: '#cc99ff' }}>{data.gameType === 'linear' ? '📖 Linear Story' : '🗺 Location Based'}</div>
        {data.configured && <div style={{ fontSize: '10px', color: '#aaa', marginTop: '4px' }}>✓ Configured</div>}
      </div>
    </div>
  );
}