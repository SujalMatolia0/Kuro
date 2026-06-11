import React, { useState, useEffect, useMemo } from 'react';
import { useAppStore } from '../../store';
import { localVaultQueries } from '../../db/queries';
import { cloudVaultQueries } from '../../db/cloudQueries';
import { pushVaultFileToCloud } from '../../lib/sync';
import Fuse from 'fuse.js';
import { 
  Archive, Search, FileText, Download, Code, 
  Trash2, UploadCloud, ChevronRight, FileCode, CheckCircle2, 
  AlertCircle, Cloud, CloudUpload, RotateCw 
} from 'lucide-react';
import Modal from '../../components/Modal';
import EmptyState from '../../components/EmptyState';
import JSZip from 'jszip';

const CodeVault = () => {
  const { profile, activeWorkspace } = useAppStore();
  const [files, setFiles] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  
  // Viewer state
  const [viewFileId, setViewFileId] = useState<string | null>(null);
  const [fileContent, setFileContent] = useState<string | null>(null);
  const [isLoadingFile, setIsLoadingFile] = useState(false);
  
  // Upload modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [newFiletype, setNewFiletype] = useState('');
  const [newPlatform, setNewPlatform] = useState('OIC');
  const [newVersion, setNewVersion] = useState('v1.0.0');
  const [newDescription, setNewDescription] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadFiles();
  }, []);

  const loadFiles = async () => {
    setIsLoading(true);
    const data = await localVaultQueries.getAll();
    setFiles(data);
    setIsLoading(false);
  };

  const handleViewFile = async (id: string) => {
    setViewFileId(id);
    setIsLoadingFile(true);
    const fullFile = await localVaultQueries.getById(id);
    if (fullFile) {
      setFileContent(fullFile.content);
    }
    setIsLoadingFile(false);
  };

  const filteredFiles = useMemo(() => {
    if (!searchQuery) return files;
    const fuse = new Fuse(files, { keys: ['name', 'platform', 'filetype', 'description'], threshold: 0.3 });
    return fuse.search(searchQuery).map(result => result.item);
  }, [files, searchQuery]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 50 * 1024 * 1024) {
        alert('File is too large! Maximum 50MB allowed.');
        return;
      }
      setSelectedFile(file);
      setNewName(file.name);
      const ext = file.name.split('.').pop() || '';
      setNewFiletype(ext.toLowerCase());
    }
  };

  const handleUpload = async () => {
    if (!newName || !selectedFile) return;
    
    setIsUploading(true);
    try {
      let finalName = newName;
      let finalFiletype = newFiletype;

      // 1. Auto-Zip if not already a zip
      if (!selectedFile.name.toLowerCase().endsWith('.zip')) {
        const zip = new JSZip();
        zip.file(selectedFile.name, selectedFile);
        await zip.generateAsync({ type: 'blob' });
        finalName = `${newName}.zip`;
        finalFiletype = 'zip';
      }

      // 2. We store LOCALLY first. 
      // Note: We don't store the full binary in SQLite for large files generally, 
      // but we'll store the metadata and a placeholder for now.
      const created = await localVaultQueries.create({
        workspaceId: activeWorkspace?.id || 'global',
        name: finalName,
        content: '[Binary File Bundle - Local Archive]',
        filetype: finalFiletype,
        platform: newPlatform,
        description: newDescription,
        version_note: newVersion,
        storage_path: null // Not uploaded yet
      }, profile.email);
      
      if (created) {
        loadFiles();
        setIsModalOpen(false);
        resetForm();
      }
    } catch (err: any) {
      console.error("Local save failed:", err);
      alert(`ERROR: ${err.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  const handlePushSync = async (e: React.MouseEvent, fileId: string) => {
    e.stopPropagation();
    if (!profile.email) return;
    
    setIsLoading(true); // Re-use isLoading for sync state
    const result = await pushVaultFileToCloud(fileId, profile.email);
    if (result.success) {
      loadFiles();
    } else {
      alert("Cloud Sync Failed: " + result.error);
    }
    setIsLoading(false);
  };

  const resetForm = () => {
    setNewName('');
    setSelectedFile(null);
    setNewFiletype('');
    setNewPlatform('OIC');
    setNewVersion('v1.0.0');
    setNewDescription('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Permanently delete this item from the local vault?')) {
      await localVaultQueries.delete(id, profile.email);
      loadFiles();
      if (viewFileId === id) {
        setViewFileId(null);
        setFileContent(null);
      }
    }
  };

  const handleDownload = (e: React.MouseEvent, file: any) => {
    e.stopPropagation();
    
    if (file.storage_path) {
      // Direct access via Supabase public URL (standard pattern)
      const publicUrl = cloudVaultQueries.getPublicUrl(file.storage_path);
      window.open(publicUrl, '_blank');
    } else {
      // Legacy text-based download
      const blob = new Blob([file.content || ''], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  return (
    <div className="h-[calc(100vh-40px)] flex flex-col animate-in fade-in zoom-in-95 duration-500 pb-4 gap-6">
      <div className="flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <Archive className="text-accent-green" size={32} />
          <div>
            <h1 className="text-2xl font-black tracking-tighter text-accent-green uppercase">Code & File Vault</h1>
            <p className="text-xs text-text-muted">Cloud synced heavy-duty asset storage.</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-background-secondary border border-border rounded-full px-4 py-2">
            <Search size={14} className="text-text-muted" />
            <input
              placeholder="Search vault..."
              className="bg-transparent border-none text-xs font-bold focus:outline-none w-48 placeholder:uppercase"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="btn-secondary py-2 px-6 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest"
          >
            <UploadCloud size={16} />
            <span>Upload Asset</span>
          </button>
        </div>
      </div>

      {!viewFileId ? (
        <div className="grid grid-cols-1 @md:grid-cols-2 @lg:grid-cols-3 @xl:grid-cols-4 gap-4 overflow-y-auto scrollbar-thin pr-2">
           {isLoading ? (
             <div className="col-span-full py-12 flex flex-col items-center justify-center text-text-muted opacity-50 animate-pulse">
               <Archive size={48} className="mb-4" />
               <p className="text-sm font-bold uppercase tracking-widest">Accessing Supabase Cloud...</p>
             </div>
           ) : filteredFiles.length === 0 ? (
             <div className="col-span-full">
              <EmptyState 
                icon={Archive}
                title="Vault is Empty"
                description="Upload your first file to start building your secure asset library."
                action={{ label: '+ Upload Asset', onClick: () => setIsModalOpen(true) }}
              />
            </div>
           ) : (
             filteredFiles.map(file => (
               <div 
                 key={file.id}
                 onClick={() => handleViewFile(file.id!)}
                 className="card flex flex-col gap-4 cursor-pointer hover:border-accent-green hover:shadow-[0_0_15px_rgba(74,124,111,0.15)] group"
               >
                 <div className="flex items-start justify-between">
                   <div className="flex items-center gap-3">
                     <div className="p-2 bg-background-tertiary rounded-lg text-accent-green">
                       {file.filetype.includes('json') ? <Code size={20} /> : <FileText size={20} />}
                     </div>
                     <div>
                       <h3 className="text-sm font-bold truncate max-w-[150px]" title={file.name}>{file.name}</h3>
                       <p className="text-[10px] text-text-muted">{new Date(file.created_at || '').toLocaleDateString()}</p>
                     </div>
                   </div>
                    <div className="flex items-center gap-2">
                       {file.is_synced ? (
                         <Cloud size={14} className="text-accent-green" />
                       ) : (
                         <button 
                           onClick={(e) => handlePushSync(e, file.id!)}
                           className="p-1.5 bg-accent-green/10 text-accent-green rounded-lg hover:bg-accent-green/20 transition-colors"
                           title="Push to Cloud"
                         >
                           <CloudUpload size={14} />
                         </button>
                       )}
                       <button 
                         onClick={(e) => handleDelete(file.id!, e)}
                         className="text-text-muted hover:text-accent-red opacity-0 group-hover:opacity-100 transition-opacity p-1"
                       >
                         <Trash2 size={14} />
                       </button>
                    </div>
                  </div>
                 
                 <p className="text-xs text-text-primary/70 line-clamp-2 min-h-[32px]">
                   {file.description || 'No description provided.'}
                 </p>
                 
                 <div className="flex items-center justify-between border-t border-border pt-4 mt-auto">
                   <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest font-bold">
                     <span className="text-accent-green">{file.platform}</span>
                     <span className="text-text-muted">•</span>
                     <span className="text-text-muted">{file.version_note}</span>
                   </div>
                   <ChevronRight size={14} className="text-accent-green group-hover:translate-x-1 transition-transform" />
                 </div>
               </div>
             ))
           )}
        </div>
      ) : (
        // File Viewer
        <div className="flex-1 flex flex-col bg-background-secondary border border-border rounded-xl overflow-hidden animate-in fade-in slide-in-from-right-4">
          <div className="p-4 border-b border-border bg-background-tertiary flex items-center justify-between">
            <div className="flex items-center gap-4">
               <button 
                 onClick={() => { setViewFileId(null); setFileContent(null); }}
                 className="p-1 px-3 bg-background-primary hover:bg-border rounded text-xs font-bold text-text-muted uppercase transition-colors"
               >
                 ← Back
               </button>
               <div>
                 <h2 className="text-lg font-bold flex items-center gap-2">
                   {files.find(f => f.id === viewFileId)?.name}
                   <span className="text-[10px] px-2 py-0.5 rounded border border-border text-accent-green uppercase tracking-widest">
                     {files.find(f => f.id === viewFileId)?.version_note}
                   </span>
                 </h2>
               </div>
            </div>
            <button 
              onClick={(e) => handleDownload(e, files.find(f => f.id === viewFileId)!)}
              disabled={isLoadingFile}
              className="flex items-center gap-2 btn-secondary py-1.5 px-4 disabled:opacity-50"
            >
              <Download size={14} />
              <span className="text-xs">Download Raw</span>
            </button>
          </div>
          
          <div className="flex-1 bg-[#0d1117] p-6 overflow-y-auto font-mono text-sm whitespace-pre-wrap text-text-primary/90 scrollbar-thin flex flex-col items-center justify-center gap-4 text-center">
            {isLoadingFile ? (
              'Accessing cloud storage...'
            ) : files.find(f => f.id === viewFileId)?.storage_path ? (
              <>
                <FileCode size={48} className="text-accent-green opacity-40" />
                <div className="space-y-2">
                  <p className="font-bold text-text-primary tracking-tight">Binary File Bundle</p>
                  <p className="text-xs text-text-muted max-w-xs mx-auto">This file is stored as a compressed asset in Supabase. Download to view or use.</p>
                </div>
              </>
            ) : (
              fileContent
            )}
          </div>
        </div>
      )}

      {/* Upload Modal */}
      {isModalOpen && (
        <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="ADD TO LOCAL VAULT">
          <div className="space-y-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Filename (with extension)</label>
              <input 
                className="w-full bg-background-primary border border-border rounded-standard p-2 text-sm focus:border-accent-green focus:outline-none"
                placeholder="e.g. ERP_Integration_Map.xml"
                value={newName}
                onChange={e => {
                  setNewName(e.target.value);
                  const parts = e.target.value.split('.');
                  if (parts.length > 1) setNewFiletype(parts.pop() || 'txt');
                }}
              />
            </div>

            <div className="grid grid-cols-1 @sm:grid-cols-2 gap-4">
               <div className="space-y-1">
                <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Platform</label>
                <input 
                  className="w-full bg-background-primary border border-border rounded-standard p-2 text-sm focus:border-accent-green focus:outline-none"
                  placeholder="e.g. OIC, Fusion"
                  value={newPlatform}
                  onChange={e => setNewPlatform(e.target.value)}
                />
               </div>
               <div className="space-y-1">
                <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Version</label>
                <input 
                  className="w-full bg-background-primary border border-border rounded-standard p-2 text-sm focus:border-accent-green focus:outline-none"
                  placeholder="v1.0.0"
                  value={newVersion}
                  onChange={e => setNewVersion(e.target.value)}
                />
               </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Select File (Auto-Zip enabled)</label>
              <div 
                className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center gap-4 transition-all cursor-pointer ${
                  selectedFile ? 'border-accent-green bg-accent-green/5' : 'border-border hover:border-accent-green'
                }`}
                onClick={() => fileInputRef.current?.click()}
              >
                <input 
                  type="file" 
                  className="hidden" 
                  ref={fileInputRef} 
                  onChange={handleFileChange}
                />
                
                {selectedFile ? (
                  <>
                    <div className="p-3 bg-accent-green/20 rounded-full text-accent-green">
                      <CheckCircle2 size={24} />
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-bold text-accent-green">{selectedFile.name}</p>
                      <p className="text-[10px] text-text-muted uppercase tracking-widest">{(selectedFile.size / 1024).toFixed(1)} KB</p>
                    </div>
                  </>
                ) : (
                  <>
                    <UploadCloud size={32} className="text-text-muted" />
                    <div className="text-center">
                      <p className="text-sm font-bold uppercase tracking-tight">Click to browse</p>
                      <p className="text-[10px] text-text-muted mt-1 uppercase tracking-widest">Max 50MB per file</p>
                    </div>
                  </>
                )}
              </div>
            </div>

            {selectedFile && !selectedFile.name.toLowerCase().endsWith('.zip') && (
              <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg flex gap-3 items-center">
                <AlertCircle size={16} className="text-amber-500 shrink-0" />
                <p className="text-[10px] text-amber-500 font-bold uppercase tracking-wide leading-relaxed">
                  Notice: This file will be automatically compressed into a .zip bundle before upload.
                </p>
              </div>
            )}

            <button 
              onClick={handleUpload}
              disabled={!newName || !selectedFile || isUploading}
              className="w-full btn-secondary py-3 mt-4 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isUploading ? (
                <>
                  <RotateCw size={16} className="animate-spin" />
                  <span className="text-[10px] font-black uppercase tracking-widest">Archiving Assets...</span>
                </>
              ) : (
                <>
                  <Archive size={16} />
                  <span className="text-[10px] font-black uppercase tracking-widest">Finalize & Vault Locally</span>
                </>
              )}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default CodeVault;
