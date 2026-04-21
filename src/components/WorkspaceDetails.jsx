import React, { useState, useEffect, useRef } from 'react';
import { 
  X, Link as LinkIcon, Edit3, Trash2, ArrowLeft, Plus, Video, FileText, 
  Clock, BookOpen, Layers, MousePointer2, Maximize2, Hash, Play,
  HelpCircle, MoreVertical, Search, Download, ExternalLink, Quote, Minus
} from 'lucide-react';
import { 
  collection, addDoc, onSnapshot, deleteDoc, 
  doc, updateDoc, query, orderBy, serverTimestamp 
} from 'firebase/firestore';
import { 
  ref, uploadBytesResumable, getDownloadURL 
} from 'firebase/storage';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { db, storage } from '../firebase';
import StatusNotice from './StatusNotice';
import { Rnd } from 'react-rnd'; // For resizable widgets
import { saveLocalFile, getLocalFile } from '../utils/localVault';
import FocusEditor from './FocusEditor';
import './WorkspaceDetails.css';

const sanitizeUrl = (url) => {
  if (!url) return '';
  if (!/^https?:\/\//i.test(url)) {
    return `https://${url}`;
  }
  return url;
};

// MenuBar Component for TipTap
const MenuBar = ({ editor }) => {
  if (!editor) return null;

  const buttons = [
    { icon: <Edit3 size={14} />, action: () => editor.chain().focus().toggleBold().run(), active: editor.isActive('bold'), label: 'Bold' },
    { icon: <span className="font-serif italic">I</span>, action: () => editor.chain().focus().toggleItalic().run(), active: editor.isActive('italic'), label: 'Italic' },
    { icon: <BookOpen size={14} />, action: () => editor.chain().focus().toggleHeading({ level: 1 }).run(), active: editor.isActive('heading', { level: 1 }), label: 'H1' },
    { icon: <Layers size={14} />, action: () => editor.chain().focus().toggleHeading({ level: 2 }).run(), active: editor.isActive('heading', { level: 2 }), label: 'H2' },
    { icon: <Quote size={14} />, action: () => editor.chain().focus().toggleBlockquote().run(), active: editor.isActive('blockquote'), label: 'Quote' },
    { icon: <Minus size={14} />, action: () => editor.chain().focus().setHorizontalRule().run(), label: 'Horizontal Rule' },
    { icon: <Layers size={14} />, action: () => editor.chain().focus().toggleBulletList().run(), active: editor.isActive('bulletList'), label: 'Bullet' },
    { icon: <Hash size={14} />, action: () => editor.chain().focus().toggleOrderedList().run(), active: editor.isActive('orderedList'), label: 'Ordered' },
    { icon: <Play size={14} />, action: () => editor.chain().focus().toggleCodeBlock().run(), active: editor.isActive('codeBlock'), label: 'Code' },
  ];

  return (
    <div className="editor-menubar flex items-center gap-1 p-2 bg-secondary/5 border-b border-color">
      {buttons.map((btn, i) => (
        <button
          key={i}
          onClick={btn.action}
          className={`menu-btn ${btn.active ? 'active' : ''}`}
          title={btn.label}
        >
          {btn.icon}
        </button>
      ))}
      <div className="w-px h-4 bg-color mx-2"></div>
      <button onClick={() => editor.chain().focus().undo().run()} className="menu-btn"><ArrowLeft size={14}/></button>
      <button onClick={() => editor.chain().focus().redo().run()} className="menu-btn rotate-180"><ArrowLeft size={14}/></button>
    </div>
  );
};

export default function WorkspaceDetails({ workspace, onBack, userId }) {
  const [tabs, setTabs] = useState([]);
  const [activeTabId, setActiveTabId] = useState('help');
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState(workspace?.name || '');
  const [showResourceDrawer, setShowResourceDrawer] = useState(false);
  const [resources, setResources] = useState([]);
  const [localUrls, setLocalUrls] = useState({}); // { resourceId: blobUrl }
  const [uploadMode, setUploadMode] = useState('local'); // 'local' or 'cloud'
  const [focusResource, setFocusResource] = useState(null); // Resource object currently in focus mode
  const [newResourceURL, setNewResourceURL] = useState('');
  const [newResourceType, setNewResourceType] = useState('link');
  const [error, setError] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef(null);
  const [isDraggingOver, setIsDraggingOver] = useState(false);

  // TipTap Instance
  const editor = useEditor({
    extensions: [StarterKit],
    content: '',
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      // Only sync if we have an active editor tab
      if (activeTabId && activeTabId !== 'help') {
        const activeTab = tabs.find(t => t.id === activeTabId);
        if (activeTab && activeTab.content !== html) {
          updateTab(activeTabId, { content: html });
        }
      }
    },
  });

  // Handle Tab Switch - Only set content when the ID changes
  useEffect(() => {
    if (editor && activeTabId && activeTabId !== 'help') {
      const activeTab = tabs.find(t => t.id === activeTabId);
      if (activeTab) {
        // Prevent setting content if it's already the same to avoid focus loss/loops
        if (editor.getHTML() !== activeTab.content) {
          editor.commands.setContent(activeTab.content || '', false);
        }
      }
    }
  }, [activeTabId, editor]); // Only depend on ID change

  // Sync Tabs from Firestore
  useEffect(() => {
    if (!workspace) return;
    const q = query(
      collection(db, `workspaces/${workspace.id}/tabs`),
      orderBy('createdAt', 'asc')
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const tabsData = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setTabs(tabsData);

      // If we are on a tab, and the remote content changed (e.g. from another device)
      // we might want to update the editor, but we must be careful of loops.
      // For now, we rely on the Tab Switch useEffect and onUpdate.
    });
    return () => unsubscribe();
  }, [workspace]);

  // Sync Resources
  useEffect(() => {
    if (!workspace) return;
    const q = query(collection(db, `workspaces/${workspace.id}/resources`), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setResources(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => unsubscribe();
  }, [workspace]);

  // Hydrate Local Resources
  useEffect(() => {
    const hydrateLocal = async () => {
      const newUrls = { ...localUrls };
      let changed = false;

      for (const res of resources) {
        if (res.storageType === 'local' && !newUrls[res.id]) {
          try {
            const blob = await getLocalFile(res.id);
            if (blob) {
              newUrls[res.id] = URL.createObjectURL(blob);
              changed = true;
            }
          } catch (err) {
            console.error("Hydration Failed for", res.id, err);
          }
        }
      }

      if (changed) {
        setLocalUrls(newUrls);
      }
    };

    if (resources.length > 0) {
      hydrateLocal();
    }
  }, [resources]);

  // Cleanup Blob URLs on unmount
  useEffect(() => {
    return () => {
      Object.values(localUrls).forEach(url => URL.revokeObjectURL(url));
    };
  }, []);

  const addTab = async (title = 'New Editor') => {
    try {
      const docRef = await addDoc(collection(db, `workspaces/${workspace.id}/tabs`), {
        title,
        content: '',
        widgets: [],
        createdAt: serverTimestamp()
      });
      setActiveTabId(docRef.id);
    } catch (err) {
      setError(err.message);
    }
  };

  const updateTab = async (id, data) => {
    try {
      await updateDoc(doc(db, `workspaces/${workspace.id}/tabs`, id), data);
    } catch (err) {
      setError(err.message);
    }
  };

  const deleteTab = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm("Close this tab?")) return;
    try {
      await deleteDoc(doc(db, `workspaces/${workspace.id}/tabs`, id));
      if (activeTabId === id) setActiveTabId('help');
    } catch (err) {
      setError(err.message);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file || !workspace) return;

    const inputElement = e.target;
    setError(null);

    // MODE: LOCAL (Big Brain Move - Instant & Free)
    if (uploadMode === 'local') {
      setIsUploading(true);
      try {
        // 1. Create a dummy Doc in Firestore first to get a real ID
        const docRef = await addDoc(collection(db, `workspaces/${workspace.id}/resources`), {
          title: file.name,
          type: 'pdf',
          storageType: 'local', // Key flag
          createdAt: serverTimestamp(),
          url: 'local' // Placeholder
        });

        // 2. Save actual file bytes to local IndexedDB using the Doc ID
        await saveLocalFile(docRef.id, file);

        const blobUrl = URL.createObjectURL(file);
        
        // 3. Update memory state for instant preview
        setLocalUrls(prev => ({
          ...prev,
          [docRef.id]: blobUrl
        }));

        // 4. BIG BRAIN AUTO-FOCUS: Immediately open the reader
        setFocusResource({
          id: docRef.id,
          title: file.name,
          type: 'pdf',
          storageType: 'local',
          url: blobUrl, // Use real blobUrl instead of 'local' string
          notes: ''
        });

        setIsUploading(false);
        setUploadProgress(0);
        inputElement.value = '';
      } catch (err) {
        console.error("Local Ingest Failed:", err);
        setError("Failed to save file locally: " + err.message);
        setIsUploading(false);
      }
      return;
    }

    // MODE: CLOUD (Regular Firebase Storage)
    setIsUploading(true);
    try {
      const storageRef = ref(storage, `workspaces/${workspace.id}/resources/${Date.now()}_${file.name}`);
      const uploadTask = uploadBytesResumable(storageRef, file);

      uploadTask.on('state_changed', 
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          setUploadProgress(progress);
        }, 
        (err) => {
          console.error("Firebase Storage Upload Error:", err);
          setError(`Upload failed: ${err.message}. Check your Firebase Storage rules.`);
          setIsUploading(false);
          setUploadProgress(0);
          inputElement.value = '';
        }, 
        async () => {
          try {
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            const resData = {
              url: downloadURL,
              type: 'pdf',
              storageType: 'cloud',
              title: file.name,
              createdAt: serverTimestamp(),
              notes: ''
            };
            const resDoc = await addDoc(collection(db, `workspaces/${workspace.id}/resources`), resData);
            
            // AUTO-FOCUS for Cloud Uploads too
            setFocusResource({ id: resDoc.id, ...resData });

            setIsUploading(false);
            setUploadProgress(0);
            inputElement.value = '';
          } catch (dbErr) {
            console.error("Firestore Registry Error:", dbErr);
            setError(`File uploaded, but registration failed: ${dbErr.message}`);
            setIsUploading(false);
            inputElement.value = '';
          }
        }
      );
    } catch (startErr) {
      console.error("Upload Initiation Error:", startErr);
      setError(`Could not start upload: ${startErr.message}`);
      setIsUploading(false);
      inputElement.value = '';
    }
  };

  const handleSaveNotes = async (resourceId, notes) => {
    try {
      await updateDoc(doc(db, `workspaces/${workspace.id}/resources`, resourceId), {
        notes,
        updatedAt: serverTimestamp()
      });
      // Update local state if needed
      setResources(prev => prev.map(r => r.id === resourceId ? { ...r, notes } : r));
    } catch (err) {
      setError("Failed to save notes: " + err.message);
    }
  };

  const addResource = async () => {
    if (!newResourceURL.trim()) return;
    try {
      const sanitized = sanitizeUrl(newResourceURL);
      await addDoc(collection(db, `workspaces/${workspace.id}/resources`), {
        url: sanitized,
        type: newResourceType,
        title: sanitized.split('/').pop() || 'Untitled Resource',
        createdAt: serverTimestamp()
      });
      setNewResourceURL('');
    } catch (err) {
      setError(err.message);
    }
  };

  const handleRenameWorkspace = async () => {
    if (!editedTitle.trim() || editedTitle === workspace.name) {
      setIsEditingTitle(false);
      return;
    }
    try {
      await updateDoc(doc(db, 'workspaces', workspace.id), { name: editedTitle });
      setIsEditingTitle(false);
    } catch (err) {
      setError(err.message);
    }
  };

  const activeTab = tabs.find(t => t.id === activeTabId);

  const addWidgetToTab = async (type, data = {}) => {
    if (!activeTab) return;
    const newWidget = {
      id: Math.random().toString(36).substr(2, 9),
      type,
      x: 50,
      y: 50,
      w: 300,
      h: 200,
      ...data
    };
    const updatedWidgets = [...(activeTab.widgets || []), newWidget];
    await updateTab(activeTab.id, { widgets: updatedWidgets });
  };

  const updateWidget = async (widgetId, newData) => {
    if (!activeTab) return;
    const updatedWidgets = activeTab.widgets.map(w => 
      w.id === widgetId ? { ...w, ...newData } : w
    );
    await updateTab(activeTab.id, { widgets: updatedWidgets });
  };

  const deleteWidget = async (widgetId) => {
    if (!activeTab) return;
    const updatedWidgets = activeTab.widgets.filter(w => w.id !== widgetId);
    await updateTab(activeTab.id, { widgets: updatedWidgets });
  };

  return (
    <div className="workspace-view flex-col h-full bg-surface">
      {/* Top Header */}
      <header className="workspace-header px-6 py-4 flex justify-between items-center bg-secondary/10 border-b border-color">
        <div className="flex items-center gap-6">
          <button className="icon-btn" onClick={onBack} title="Back to Hubs"><ArrowLeft size={18}/></button>
          <div className="h-4 w-px bg-color"></div>
          {isEditingTitle ? (
            <input 
              autoFocus
              className="workspace-title-input"
              value={editedTitle}
              onChange={e => setEditedTitle(e.target.value)}
              onBlur={handleRenameWorkspace}
              onKeyDown={e => e.key === 'Enter' && handleRenameWorkspace()}
            />
          ) : (
            <h1 className="text-xl font-black uppercase tracking-widest cursor-pointer hover:text-accent-ai transition-colors" onDoubleClick={() => setIsEditingTitle(true)}>
              {workspace.name}
            </h1>
          )}
        </div>

        <div className="flex items-center gap-3">
          <button className={`btn-resource-toggle ${showResourceDrawer ? 'active' : ''}`} onClick={() => setShowResourceDrawer(!showResourceDrawer)}>
            <Layers size={16} />
            <span>Vault</span>
          </button>
        </div>
      </header>

      {/* Chrome Tab Bar */}
      <nav className="chrome-tab-bar flex items-center bg-secondary/5 px-2 pt-2 border-b border-color overflow-x-auto">
        <button 
          onClick={() => setActiveTabId('help')}
          className={`chrome-tab ${activeTabId === 'help' ? 'active' : ''}`}
        >
          <HelpCircle size={14} />
          <span>Manual</span>
        </button>

        {tabs.map(tab => (
          <div key={tab.id} className="relative group">
            <button 
              onClick={() => setActiveTabId(tab.id)}
              className={`chrome-tab ${activeTabId === tab.id ? 'active' : ''}`}
            >
              <FileText size={14} />
              <span>{tab.title}</span>
              <X size={12} className="close-tab-icon" onClick={(e) => deleteTab(tab.id, e)} />
            </button>
          </div>
        ))}

        <button className="add-tab-btn" onClick={() => addTab()}>
          <Plus size={16} />
        </button>

        <div className="ml-auto pr-4 flex items-center gap-2">
           <button className="text-[10px] font-black uppercase tracking-widest text-muted hover:text-accent-ai transition-colors" onClick={() => addWidgetToTab('timer')}>+ Timer</button>
           <button className="text-[10px] font-black uppercase tracking-widest text-muted hover:text-accent-ai transition-colors" onClick={() => addWidgetToTab('counter')}>+ Counter</button>
        </div>
      </nav>

      <div className="workspace-main flex-1 relative overflow-hidden">
        {/* Content Area (100% Width) */}
        <main 
          className={`content-viewport w-full h-full overflow-y-auto relative ${isDraggingOver ? 'dragging-over' : ''}`} 
          onDragOver={e => {
            e.preventDefault();
            setIsDraggingOver(true);
          }}
          onDragLeave={() => setIsDraggingOver(false)}
          onDrop={async (e) => {
            e.preventDefault();
            setIsDraggingOver(false);
            const data = e.dataTransfer.getData('resource');
            if (data && activeTab) {
              const res = JSON.parse(data);
              const targetUrl = res.storageType === 'local' ? localUrls[res.id] : res.url;
              addWidgetToTab(res.type, { url: targetUrl, title: res.title, storageType: res.storageType });
            }
          }}
        >
          {activeTabId === 'help' ? (
            <div className="help-tab-content p-12 max-w-3xl mx-auto">
               <div className="help-card bento-card p-10">
                  <BookOpen size={48} className="text-accent-ai mb-6" />
                  <h2 className="text-3xl font-black mb-4">Command Manual</h2>
                  <p className="text-muted leading-relaxed mb-8">
                    Welcome to your advanced workspace. Here's how to master the system:
                  </p>
                  <ul className="help-list flex-col gap-6">
                    <li>
                      <div className="icon-help bg-blue-500/10 text-blue-500"><Layers size={18}/></div>
                      <div>
                        <strong>The Vault</strong>
                        <p className="text-xs text-muted mt-1">Add PDFs, YouTube links, and site links in the sidebar drawer.</p>
                      </div>
                    </li>
                    <li>
                      <div className="icon-help bg-purple-500/10 text-purple-500"><MousePointer2 size={18}/></div>
                      <div>
                        <strong>Drag & Inject</strong>
                        <p className="text-xs text-muted mt-1">Drag resources from the Vault directly into any editor tab to create a widget.</p>
                      </div>
                    </li>
                    <li>
                       <div className="icon-help bg-green-500/10 text-green-500"><Maximize2 size={18}/></div>
                       <div>
                        <strong>Resizable Widgets</strong>
                        <p className="text-xs text-muted mt-1">All injected resources can be moved and resized within the editor.</p>
                      </div>
                    </li>
                  </ul>
               </div>
            </div>
          ) : activeTab ? (
            <div className="editor-surface h-full relative flex-col overflow-hidden">
               <MenuBar editor={editor} />
               <div className="editor-scroller flex-1 overflow-y-auto relative">
                  <div className="document-container">
                     <EditorContent editor={editor} className="tiptap-editor-wrapper" />
                  </div>

                  {/* Widgets */}
                  {(activeTab.widgets || []).map(widget => (
                    <Rnd
                      key={widget.id}
                      size={{ width: widget.w, height: widget.h }}
                      position={{ x: widget.x, y: widget.y }}
                      onDragStop={(e, d) => updateWidget(widget.id, { x: d.x, y: d.y })}
                      onResizeStop={(e, direction, ref, delta, position) => {
                        updateWidget(widget.id, {
                          w: parseInt(ref.style.width),
                          h: parseInt(ref.style.height),
                          ...position
                        });
                      }}
                      bounds="parent"
                      dragHandleClassName="drag-handle"
                      className="widget-container"
                      handleComponent={{
                        bottomRight: <div className="widget-resize-handle" />
                      }}
                    >
                      <div className="widget-box bento-card h-full flex-col group">
                        <div className="widget-header p-2 border-b border-color flex justify-between items-center bg-secondary/5 drag-handle cursor-move">
                           <div className="flex items-center gap-2">
                              <Hash size={12} className="text-muted" />
                              <span className="text-[10px] font-black uppercase tracking-tighter truncate max-w-[150px]">{widget.title || widget.type}</span>
                           </div>
                           <button className="icon-btn-small opacity-0 group-hover:opacity-100" onClick={() => deleteWidget(widget.id)}><X size={10}/></button>
                        </div>
                        <div className="widget-content flex-1 overflow-hidden relative">
                           {widget.type === 'video' && (
                             <iframe 
                               src={`https://www.youtube.com/embed/${widget.url?.split('v=')[1] || widget.url?.split('/').pop()}`} 
                               className="w-full h-full border-none"
                               allowFullScreen
                             />
                           )}
                           {widget.type === 'pdf' && (
                             <iframe src={widget.url} className="w-full h-full border-none" />
                           )}
                           {widget.type === 'link' && (
                             <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center">
                                <ExternalLink size={24} className="mb-2 text-accent-ai" />
                                <a href={sanitizeUrl(widget.url)} target="_blank" rel="noreferrer" className="text-xs font-bold underline truncate w-full">{widget.url}</a>
                             </div>
                           )}
                           {widget.type === 'timer' && <TimerWidget />}
                           {widget.type === 'counter' && <CounterWidget value={widget.value || 0} onChange={(v) => updateWidget(widget.id, { value: v })} />}
                        </div>
                      </div>
                    </Rnd>
                  ))}
               </div>
            </div>
          ) : null}
        </main>

        {/* Resource Drawer (Assistant on Right) */}
        {showResourceDrawer && (
          <aside className="resource-drawer animate-slide-left">
            <div className="vault-ingest-container">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted">Vault Assistant</h3>
                  <div className="badge bg-accent-ai/10 text-accent-ai px-2 py-1 rounded text-[9px] font-black uppercase">Active</div>
                </div>
                <button className="icon-btn-small" onClick={() => setShowResourceDrawer(false)}>
                  <X size={14} />
                </button>
              </div>
              
              {/* Storage Mode Toggle */}
              <div className="storage-mode-selector mb-6">
                <button 
                  className={`storage-btn ${uploadMode === 'local' ? 'active' : ''}`}
                  onClick={() => setUploadMode('local')}
                  title="Zero-Cost Local Storage (This Device Only)"
                >
                  <MousePointer2 size={14} />
                  <span>Local</span>
                </button>
                <button 
                  className={`storage-btn ${uploadMode === 'cloud' ? 'active' : ''}`}
                  onClick={() => setUploadMode('cloud')}
                  title="Cloud Workspace Sync (All Devices)"
                >
                  <Layers size={14} />
                  <span>Cloud</span>
                </button>
              </div>

              <div className="resource-type-selector">
                <button className={`type-btn ${newResourceType === 'link' ? 'active' : ''}`} onClick={() => setNewResourceType('link')}>
                  <LinkIcon size={14} />
                </button>
                <button className={`type-btn ${newResourceType === 'video' ? 'active' : ''}`} onClick={() => setNewResourceType('video')}>
                  <Video size={14} />
                </button>
                <button className={`type-btn ${newResourceType === 'pdf' ? 'active' : ''}`} onClick={() => setNewResourceType('pdf')}>
                  <FileText size={14} />
                </button>
              </div>

              <div className="vault-input-group">
                {newResourceType === 'pdf' ? (
                  <div className="flex-col w-full gap-3">
                    <input 
                      type="file" 
                      accept=".pdf" 
                      className="hidden" 
                      ref={fileInputRef} 
                      onChange={handleFileUpload} 
                    />
                    <button 
                      className="vault-upload-trigger" 
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploading}
                    >
                      {isUploading ? (
                        <div className="flex items-center gap-3">
                          <div className="upload-spinner"></div>
                          <span>Uploading {Math.round(uploadProgress)}%</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-3">
                          <Download size={18} />
                          <span>Browse local PDF...</span>
                        </div>
                      )}
                    </button>
                    {isUploading && (
                      <div className="upload-progress-container">
                        <div className="upload-progress-bar" style={{ width: `${uploadProgress}%` }}></div>
                      </div>
                    )}
                  </div>
                ) : (
                  <>
                    <input 
                      className="resource-input" 
                      placeholder={`Paste ${newResourceType} URL...`}
                      value={newResourceURL}
                      onChange={e => setNewResourceURL(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && addResource()}
                    />
                    <button className="add-resource-btn" onClick={addResource}>
                      <Plus size={20}/>
                    </button>
                  </>
                )}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-6 pb-6 flex-col gap-3">
               {resources.map(res => (
                 <div 
                   key={res.id} 
                   className="resource-item"
                   draggable
             onClick={() => {
               const targetUrl = res.storageType === 'local' ? localUrls[res.id] : res.url;
               if (!targetUrl) {
                 setError("Local file not found on this device.");
                 return;
               }
               // If it's a PDF or Video, use Focus Mode for the "Simple Send & See" experience
               if (res.type === 'pdf' || res.type === 'video') {
                 setFocusResource({
                   ...res,
                   url: targetUrl
                 });
               } else {
                 window.open(sanitizeUrl(targetUrl), '_blank', 'noopener,noreferrer');
               }
             }}
                   title="Click to open or drag to editor"
                   onDragStart={(e) => {
                     e.dataTransfer.setData('resource', JSON.stringify(res));
                     e.currentTarget.style.opacity = '0.5';
                   }}
                   onDragEnd={(e) => {
                     e.currentTarget.style.opacity = '1';
                   }}
                 >
                    <div className="resource-icon-box">
                      {res.type === 'pdf' ? <FileText size={18} className="text-red-500" /> : res.type === 'video' ? <Video size={18} className="text-blue-500" /> : <LinkIcon size={18} className="text-yellow-500" />}
                    </div>
                    <div className="resource-meta">
                      <span className="resource-title">{res.title}</span>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="resource-badge">{res.type} Reference</span>
                        <span className={`storage-tag ${res.storageType}`}>
                          {res.storageType === 'local' ? 'Local-Only' : 'Cloud-Sync'}
                        </span>
                      </div>
                    </div>
                    <div className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity">
                      <Search size={14} className="text-muted" />
                    </div>
                 </div>
               ))}
               {resources.length === 0 && (
                 <div className="flex-col items-center justify-center py-20 opacity-20">
                   <Layers size={48} strokeWidth={1} />
                   <p className="text-[10px] font-black uppercase tracking-widest mt-4">Assistant Ready</p>
                 </div>
               )}
            </div>
          </aside>
        )}
      </div>
      <StatusNotice message={error} onClose={() => setError(null)} />

      {/* Focus Mode Overlay */}
      {focusResource && (
        <FocusEditor 
          resource={focusResource}
          onClose={() => setFocusResource(null)}
          onSave={handleSaveNotes}
        />
      )}
    </div>
  );
}

function TimerWidget() {
  const [time, setTime] = useState(0);
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    let interval;
    if (isRunning) {
      interval = setInterval(() => setTime(t => t + 1), 1000);
    }
    return () => clearInterval(interval);
  }, [isRunning]);

  const format = (s) => {
    const m = Math.floor(s / 60);
    const rs = s % 60;
    return `${m.toString().padStart(2, '0')}:${rs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex-col items-center justify-center h-full gap-4">
      <div className="text-4xl font-black font-mono tracking-tighter">{format(time)}</div>
      <div className="flex gap-2">
        <button className="icon-btn bg-accent-ai text-white border-none p-2 rounded-full" onClick={() => setIsRunning(!isRunning)}>
          {isRunning ? <X size={16}/> : <Play size={16}/>}
        </button>
        <button className="icon-btn p-2 rounded-full" onClick={() => { setTime(0); setIsRunning(false); }}><Hash size={16}/></button>
      </div>
    </div>
  );
}

function CounterWidget({ value, onChange }) {
  return (
    <div className="flex-col items-center justify-center h-full gap-4">
      <div className="text-5xl font-black tracking-tighter">{value}</div>
      <div className="flex gap-4">
        <button className="btn-secondary px-6 font-black" onClick={() => onChange(value - 1)}>-</button>
        <button className="btn-primary px-6 font-black" onClick={() => onChange(value + 1)}>+</button>
      </div>
    </div>
  );
}
