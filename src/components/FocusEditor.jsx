import React, { useState, useRef, useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Rnd } from 'react-rnd';
import { 
  Bold, Italic, Strikethrough, Heading1, Heading2, 
  Heading3, List, ListOrdered, Quote, Code, X, Save,
  ZoomIn, ZoomOut, MousePointer2, Move, Maximize2, Minimize2
} from 'lucide-react';
import './FocusEditor.css';

const MenuBar = ({ editor }) => {
  if (!editor) return null;

  return (
    <div className="editor-toolbar flex items-center gap-1 border-b border-color bg-surface p-2 sticky top-0 z-10 w-full overflow-x-auto">
      <button onClick={() => editor.chain().focus().toggleBold().run()} className={`icon-btn ${editor.isActive('bold') ? 'active-tool' : ''}`} title="Bold"><Bold size={16} /></button>
      <button onClick={() => editor.chain().focus().toggleItalic().run()} className={`icon-btn ${editor.isActive('italic') ? 'active-tool' : ''}`} title="Italic"><Italic size={16} /></button>
      <button onClick={() => editor.chain().focus().toggleStrike().run()} className={`icon-btn ${editor.isActive('strike') ? 'active-tool' : ''}`} title="Strikethrough"><Strikethrough size={16} /></button>
      <div className="w-px h-6 bg-color mx-2"></div>
      <button onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} className={`icon-btn ${editor.isActive('heading', { level: 1 }) ? 'active-tool' : ''}`} title="Heading 1"><Heading1 size={16} /></button>
      <button onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} className={`icon-btn ${editor.isActive('heading', { level: 2 }) ? 'active-tool' : ''}`} title="Heading 2"><Heading2 size={16} /></button>
      <button onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} className={`icon-btn ${editor.isActive('heading', { level: 3 }) ? 'active-tool' : ''}`} title="Heading 3"><Heading3 size={16} /></button>
      <div className="w-px h-6 bg-color mx-2"></div>
      <button onClick={() => editor.chain().focus().toggleBulletList().run()} className={`icon-btn ${editor.isActive('bulletList') ? 'active-tool' : ''}`} title="Bullet List"><List size={16} /></button>
      <button onClick={() => editor.chain().focus().toggleOrderedList().run()} className={`icon-btn ${editor.isActive('orderedList') ? 'active-tool' : ''}`} title="Ordered List"><ListOrdered size={16} /></button>
      <div className="w-px h-6 bg-color mx-2"></div>
      <button onClick={() => editor.chain().focus().toggleBlockquote().run()} className={`icon-btn ${editor.isActive('blockquote') ? 'active-tool' : ''}`} title="Blockquote"><Quote size={16} /></button>
      <button onClick={() => editor.chain().focus().toggleCodeBlock().run()} className={`icon-btn ${editor.isActive('codeBlock') ? 'active-tool' : ''}`} title="Code Block"><Code size={16} /></button>
    </div>
  );
};

export default function FocusEditor({ resource, onClose, onSave }) {
  const [zoom, setZoom] = useState(1);
  const [pdfScale, setPdfScale] = useState(1); // Restore lost state
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [zIndices, setZIndices] = useState({ resource: 10, editor: 20 });
  const [isInteracting, setIsInteracting] = useState(false); // Restore lost state
  
  const viewportRef = useRef(null);
  const lastMousePos = useRef({ x: 0, y: 0 });
  const isDraggingCanvas = useRef(false);

  // DEFENSIVE HOOK: Safety first to prevent white-screen crashes
  const editor = useEditor({
    extensions: [StarterKit],
    content: resource?.notes || '<p></p>',
  });

  const handleSave = () => {
    if (editor) onSave(resource.id, editor.getHTML());
  };

  const focusWindow = (win) => {
    if (win === 'resource') setZIndices({ resource: 30, editor: 10 });
    else setZIndices({ resource: 10, editor: 30 });
  };

  const startInteracting = () => setIsInteracting(true);
  const stopInteracting = () => setIsInteracting(false);

  // Canvas Panning
  const handleMouseDown = (e) => {
    if (e.target === viewportRef.current) {
      isDraggingCanvas.current = true;
      lastMousePos.current = { x: e.clientX, y: e.clientY };
    }
  };

  const handleMouseMove = (e) => {
    if (isDraggingCanvas.current) {
      const dx = e.clientX - lastMousePos.current.x;
      const dy = e.clientY - lastMousePos.current.y;
      setPan(prev => ({ x: prev.x + dx, y: prev.y + dy }));
      lastMousePos.current = { x: e.clientX, y: e.clientY };
    }
  };

  const handleMouseUp = () => {
    isDraggingCanvas.current = false;
  };

  // Zoom with Wheel
  const handleWheel = (e) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
      setZoom(prev => Math.min(Math.max(0.4, prev * zoomFactor), 2.5));
    }
  };

  useEffect(() => {
    const viewport = viewportRef.current;
    if (viewport) {
      viewport.addEventListener('wheel', handleWheel, { passive: false });
      return () => viewport.removeEventListener('wheel', handleWheel);
    }
  }, []);

  const getValidatedEmbedUrl = (url) => {
    try {
      if (url.includes('youtube.com') || url.includes('youtu.be')) {
        const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))((\w|-){11})/);
        return match && match[1] ? `https://www.youtube.com/embed/${match[1]}?autoplay=0` : 'INVALID_YOUTUBE';
      }
      return url;
    } catch { return url; }
  };

  const sanitizeUrl = (url) => {
    if (!url) return '';
    if (!/^https?:\/\//i.test(url)) {
      return `https://${url}`;
    }
    return url;
  };

  const renderResource = () => {
    const targetUrl = resource.url && resource.url.startsWith('blob:') ? resource.url : sanitizeUrl(resource.url);
    const shieldClass = isInteracting ? 'pointer-events-none opacity-50' : 'pointer-events-auto';

    if (resource.type === 'video') {
      const embedUrl = getValidatedEmbedUrl(targetUrl);
      if (embedUrl === 'INVALID_YOUTUBE') return <div className="p-8 text-center text-danger bg-surface w-full h-full">Invalid YouTube URL.</div>;
      return <iframe className={`w-full h-full border-none transition-opacity ${shieldClass}`} src={embedUrl} allowFullScreen></iframe>;
    } else if (resource.type === 'pdf') {
      return (
        <div className={`w-full h-full relative overflow-hidden bg-black ${shieldClass}`}>
          <iframe 
            className="w-full h-full border-none transition-transform origin-top-left" 
            src={targetUrl} 
            type="application/pdf"
            style={{ 
              transform: `scale(${pdfScale})`, 
              width: `${100 / pdfScale}%`, 
              height: `${100 / pdfScale}%` 
            }}
          />
        </div>
      );
    } else if (resource.type === 'text' && resource.url.toLowerCase().endsWith('.pdf')) {
      return (
        <div className={`w-full h-full relative overflow-hidden bg-black ${shieldClass}`}>
          <iframe 
            className="w-full h-full border-none transition-transform origin-top-left" 
            src={targetUrl} 
            type="application/pdf"
            style={{ 
              transform: `scale(${pdfScale})`, 
              width: `${100 / pdfScale}%`, 
              height: `${100 / pdfScale}%` 
            }}
          />
        </div>
      );
    } else {
      return (
        <div className="flex-col w-full h-full justify-center items-center p-12 text-center pointer-events-auto bg-surface">
          <h2 className="mb-4">{resource.title}</h2>
          <a href={targetUrl} target="_blank" rel="noreferrer" className="btn-primary">Open Source</a>
        </div>
      );
    }
  };

  return (
    <div className="focus-editor-overlay flex-col">
      <div className="focus-editor-header flex justify-between items-center bg-surface-container-highest px-6 py-4 border-b border-color z-[101]">
        <div className="flex items-center gap-4">
          <button className="icon-btn border-none" onClick={onClose} title="Exit"><X size={20} /></button>
          <h2 className="text-primary m-0 tracking-widest uppercase">FOCUS: {resource.title || 'Untitled Document'}</h2>
        </div>
        
        {/* Spatial Controls */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-surface p-1 rounded border border-color">
            <span className="text-[10px] font-black uppercase px-2 text-muted">Canvas</span>
            <button className="icon-btn" onClick={() => setZoom(z => Math.min(2.5, z + 0.1))}><ZoomIn size={14}/></button>
            <span className="font-mono text-xs w-10 text-center text-accent">{Math.round(zoom * 100)}%</span>
            <button className="icon-btn" onClick={() => setZoom(z => Math.max(0.4, z - 0.1))}><ZoomOut size={14}/></button>
          </div>

          <div className="flex items-center gap-2 bg-surface p-1 rounded border border-color">
            <span className="text-[10px] font-black uppercase px-2 text-muted">PDF Scale</span>
            <button className="icon-btn" onClick={() => setPdfScale(s => Math.min(3, s + 0.1))}><Maximize2 size={14}/></button>
            <span className="font-mono text-xs w-10 text-center text-accent">{Math.round(pdfScale * 100)}%</span>
            <button className="icon-btn" onClick={() => setPdfScale(s => Math.max(0.2, s - 0.1))}><Minimize2 size={14}/></button>
          </div>
        </div>

        <button className="btn-primary flex items-center gap-2" onClick={handleSave}>
          <Save size={16} /> Save Notes
        </button>
      </div>

      <div 
        className="focus-spatial-viewport relative flex-1 overflow-hidden"
        ref={viewportRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <div className="spatial-grid-overlay absolute inset-0 pointer-events-none"></div>

        <div 
          className="spatial-canvas"
          style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})` }}
        >
          {/* WINDOW 1: RESOURCE (LEFT) */}
          <Rnd
            default={{ x: 40, y: 40, width: 800, height: 600 }}
            minWidth={300}
            minHeight={200}
            bounds="parent"
            scale={zoom}
            className="spatial-window"
            dragHandleClassName="window-header"
            style={{ zIndex: zIndices.resource }}
            onMouseDown={() => focusWindow('resource')}
            onDragStart={startInteracting}
            onDragStop={stopInteracting}
            onResizeStart={startInteracting}
            onResizeStop={stopInteracting}
          >
            <div className="window-header">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-red-500"></div>
                <span className="window-title">Resource Node</span>
              </div>
            </div>
            <div className="window-content bg-black">
              {renderResource()}
            </div>
          </Rnd>

          {/* WINDOW 2: EDITOR (RIGHT) */}
          <Rnd
            default={{ x: 880, y: 40, width: 600, height: 800 }}
            minWidth={480}
            minHeight={300}
            bounds="parent"
            scale={zoom}
            className="spatial-window"
            dragHandleClassName="window-header"
            style={{ zIndex: zIndices.editor }}
            onMouseDown={() => focusWindow('editor')}
            onDragStart={startInteracting}
            onDragStop={stopInteracting}
            onResizeStart={startInteracting}
            onResizeStop={stopInteracting}
          >
            <div className="window-header">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                <span className="window-title">Note Editor Tab</span>
              </div>
            </div>
            <div className="window-content bg-surface flex-col">
              <MenuBar editor={editor} />
              <div className="tiptap-container flex-1 overflow-y-auto w-full p-8">
                <EditorContent editor={editor} className="tiptap-content w-full h-full text-box" />
              </div>
            </div>
          </Rnd>
        </div>
      </div>
    </div>
  );
}
