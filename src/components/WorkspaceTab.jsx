import React from 'react';
import { Rnd } from 'react-rnd';
import { X, Maximize2, Minimize2, Video, FileText, Palette, Clock, Hash, Link as LinkIcon, Image as ImageIcon, List } from 'lucide-react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';

// Inner component for Note Editor to handle its own TipTap lifecycle
const NoteEditor = ({ content, onUpdate }) => {
  const editor = useEditor({
    extensions: [StarterKit],
    content: content || '<p>Type your notes here...</p>',
    onUpdate: ({ editor }) => {
      onUpdate(editor.getHTML());
    }
  });

  if (!editor) return null;

  return (
    <div className="flex-col h-full overflow-hidden">
      <div className="editor-toolbar flex items-center gap-0.5 border-b border-color bg-surface p-0.5 sticky top-0 z-10 w-full">
        <button onClick={() => editor.chain().focus().toggleBold().run()} className={`icon-btn p-1 ${editor.isActive('bold') ? 'bg-accent/10 text-accent' : 'border-none'}`}><Hash size={12} /></button>
        <button onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} className={`icon-btn p-1 ${editor.isActive('heading', { level: 1 }) ? 'bg-accent/10 text-accent' : 'border-none'}`}><span className="text-[9px] font-bold">H1</span></button>
        <button onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} className={`icon-btn p-1 ${editor.isActive('heading', { level: 2 }) ? 'bg-accent/10 text-accent' : 'border-none'}`}><span className="text-[9px] font-bold">H2</span></button>
        <button onClick={() => editor.chain().focus().toggleBulletList().run()} className={`icon-btn p-1 ${editor.isActive('bulletList') ? 'bg-accent/10 text-accent' : 'border-none'}`}><List size={12} /></button>
        <div className="w-px h-3 bg-color mx-0.5"></div>
        <button onClick={() => editor.chain().focus().toggleCodeBlock().run()} className={`icon-btn p-1 ${editor.isActive('codeBlock') ? 'bg-accent/10 text-accent' : 'border-none'}`}><Clock size={12} /></button>
      </div>
      <div className="flex-1 overflow-y-auto p-4 cursor-text">
        <EditorContent editor={editor} className="tiptap-content text-sm" />
      </div>
    </div>
  );
};

// Simple Counter Widget
const CounterWidget = ({ value = 0, onUpdate }) => (
  <div className="flex h-full items-center justify-center gap-4">
    <button className="icon-btn border" onClick={() => onUpdate(value - 1)}>-</button>
    <span className="text-3xl font-black font-mono">{value}</span>
    <button className="icon-btn border" onClick={() => onUpdate(value + 1)}>+</button>
  </div>
);

// Simple Timer Widget
const TimerWidget = () => {
  const [seconds, setSeconds] = React.useState(1500); // 25 mins
  const [isActive, setIsActive] = React.useState(false);

  React.useEffect(() => {
    let interval = null;
    if (isActive && seconds > 0) {
      interval = setInterval(() => setSeconds(s => s - 1), 1000);
    } else if (seconds === 0) {
      setIsActive(false);
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isActive, seconds]);

  const formatTime = (s) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;

  return (
    <div className="flex-col h-full items-center justify-center">
      <span className="text-4xl font-black font-mono tracking-tighter mb-4">{formatTime(seconds)}</span>
      <div className="flex gap-2">
        <button className="btn-primary text-[10px] py-1 px-3" onClick={() => setIsActive(!isActive)}>
          {isActive ? 'Pause' : 'Start'}
        </button>
        <button className="btn-secondary text-[10px] py-1 px-3" onClick={() => { setSeconds(1500); setIsActive(false); }}>Reset</button>
      </div>
    </div>
  );
};

export default function WorkspaceTab({ tab, onUpdate, onDelete, onFocus, zoom = 1 }) {
  const renderContent = () => {
    switch (tab.type) {
      case 'video':
        return <iframe className="w-full h-full border-none" src={tab.url} allowFullScreen></iframe>;
      case 'pdf':
      case 'image':
        return <iframe className="w-full h-full border-none" src={tab.url}></iframe>;
      case 'link':
        return (
          <div className="flex-col h-full items-center justify-center p-8 text-center bg-surface-container-low">
            <div className="w-16 h-16 rounded-2xl bg-accent/10 text-accent flex items-center justify-center mb-4">
              <LinkIcon size={32} />
            </div>
            <h4 className="font-bold text-sm mb-2">{tab.title}</h4>
            <p className="text-[10px] text-muted mb-6 truncate max-w-full italic">{tab.url}</p>
            <a 
              href={tab.url} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="btn-primary text-[10px] px-6 py-2 no-underline"
            >
              Open External Link
            </a>
          </div>
        );
      case 'notes':
        return <NoteEditor content={tab.content} onUpdate={(val) => onUpdate({ content: val })} />;
      case 'counter':
        return <CounterWidget value={tab.content} onUpdate={(val) => onUpdate({ content: val })} />;
      case 'timer':
        return <TimerWidget />;
      default:
        return <div className="p-4 text-center">Incompatible Tab Content</div>;
    }
  };

  const getIcon = () => {
    switch (tab.type) {
      case 'video': return <Video size={14} />;
      case 'pdf': return <FileText size={14} />;
      case 'notes': return <LinkIcon size={14} />;
      case 'link': return <LinkIcon size={14} />;
      case 'counter': return <Hash size={14} />;
      case 'timer': return <Clock size={14} />;
      default: return <Palette size={14} />;
    }
  };

  return (
    <Rnd
      size={{ width: tab.w || 400, height: tab.h || 300 }}
      position={{ x: tab.x || 100, y: tab.y || 100 }}
      onDragStop={(e, d) => onUpdate({ x: d.x, y: d.y })}
      onResizeStop={(e, direction, ref, delta, position) => {
        onUpdate({
          w: ref.offsetWidth,
          h: ref.offsetHeight,
          ...position
        });
      }}
      minHeight={150}
      bounds="parent"
      scale={zoom}
      className={`spatial-window bento-card p-0 overflow-hidden flex-col ${tab.isActive ? 'border-accent shadow-2xl ring-1 ring-accent/20' : 'opacity-95 shadow-lg'}`}
      style={{ zIndex: tab.zIndex || 10 }}
      onMouseDown={onFocus}
      dragHandleClassName="window-header"
    >
      <div className="window-header flex justify-between items-center bg-surface-container-highest border-b border-color px-3 py-2 cursor-move">
        <div className="flex items-center gap-2 overflow-hidden">
          <span className="text-accent">{getIcon()}</span>
          <span className="window-title truncate">{tab.title || 'Untitled Node'}</span>
        </div>
        <div className="flex items-center gap-1">
          <button className="icon-btn p-1 border-none hover:text-danger transition-colors" onClick={(e) => { e.stopPropagation(); onDelete(); }}>
            <X size={14} />
          </button>
        </div>
      </div>
      <div className="window-content flex-1 relative bg-white dark:bg-black">
        {renderContent()}
      </div>
    </Rnd>
  );
}
