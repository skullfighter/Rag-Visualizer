'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, FileText, Trash2, CheckCircle2, AlertCircle, X } from 'lucide-react';
import { usePipelineStore } from '@/store/pipelineStore';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:8000';

interface DocInfo {
  filename: string;
  size_kb: number;
  chunks: number;
}

interface UploadState {
  status: 'idle' | 'uploading' | 'done' | 'error';
  filename: string;
  page: number;
  totalPages: number;
  chunksSoFar: number;
  chunksAdded: number;
  error: string;
}

const INITIAL_UPLOAD: UploadState = {
  status: 'idle',
  filename: '',
  page: 0,
  totalPages: 0,
  chunksSoFar: 0,
  chunksAdded: 0,
  error: '',
};

export default function DocumentManager() {
  const [docs, setDocs] = useState<DocInfo[]>([]);
  const [upload, setUpload] = useState<UploadState>(INITIAL_UPLOAD);
  const [dragging, setDragging] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { _startUpload, _addUploadChunk, _finishUpload } = usePipelineStore();

  const fetchDocs = useCallback(async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/documents`);
      if (res.ok) {
        const data = await res.json();
        setDocs(data.documents);
      }
    } catch {
      // Backend not running yet — fail silently
    }
  }, []);

  useEffect(() => { fetchDocs(); }, [fetchDocs]);

  async function handleUpload(file: File) {
    if (!file.name.toLowerCase().endsWith('.pdf')) {
      setUpload({ ...INITIAL_UPLOAD, status: 'error', error: 'Only PDF files are supported.' });
      return;
    }

    setUpload({ ...INITIAL_UPLOAD, status: 'uploading', filename: file.name });
    _startUpload(file.name);

    const formData = new FormData();
    formData.append('file', file);

    let response: Response;
    try {
      response = await fetch(`${BACKEND_URL}/documents/upload`, {
        method: 'POST',
        body: formData,
      });
    } catch {
      setUpload((u) => ({ ...u, status: 'error', error: 'Cannot reach backend.' }));
      _finishUpload();
      return;
    }

    if (!response.ok || !response.body) {
      const text = await response.text().catch(() => '');
      setUpload((u) => ({ ...u, status: 'error', error: text || `HTTP ${response.status}` }));
      _finishUpload();
      return;
    }

    // Read SSE progress stream
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      const parts = buffer.split('\n\n');
      buffer = parts.pop() ?? '';

      for (const part of parts) {
        const line = part.split('\n').find((l) => l.startsWith('data: '));
        if (!line) continue;
        try {
          const event = JSON.parse(line.slice(6));
          if (event.type === 'UPLOAD_PROGRESS') {
            setUpload((u) => ({
              ...u,
              page: event.page,
              totalPages: event.total_pages,
              chunksSoFar: event.chunks_so_far,
            }));
            // Always call so uploadPage/uploadTotalPages update even for
            // pages with no extractable text (images, blank pages).
            // The store action only pushes a card when chunk.text is non-empty.
            _addUploadChunk(
              {
                id: String(event.chunks_so_far),
                text: event.latest_chunk ?? '',
                source: event.latest_source ?? '',
                score: 1,
              },
              event.page,
              event.total_pages,
            );
          } else if (event.type === 'UPLOAD_COMPLETE') {
            setUpload((u) => ({
              ...u,
              status: 'done',
              chunksAdded: event.chunks_added,
            }));
            _finishUpload();
            fetchDocs();
          }
        } catch { /* ignore malformed */ }
      }
    }
  }

  async function handleDelete(filename: string) {
    setDeleting(filename);
    try {
      await fetch(`${BACKEND_URL}/documents/${encodeURIComponent(filename)}`, {
        method: 'DELETE',
      });
      fetchDocs();
    } catch { /* ignore */ } finally {
      setDeleting(null);
    }
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleUpload(file);
  }

  const progress = upload.totalPages > 0
    ? Math.round((upload.page / upload.totalPages) * 100)
    : 0;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/5 flex-shrink-0">
        <span className="text-xs font-semibold text-slate-300">Documents</span>
        {docs.length > 0 && (
          <span className="text-[10px] rounded-full px-1.5 py-0.5 bg-indigo-500/15 text-indigo-400 font-medium">
            {docs.length} file{docs.length !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-3">

        {/* Drop zone */}
        <motion.div
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          onClick={() => upload.status !== 'uploading' && fileInputRef.current?.click()}
          animate={{
            borderColor: dragging ? 'rgba(99,102,241,0.5)' : 'rgba(255,255,255,0.07)',
            background: dragging ? 'rgba(99,102,241,0.05)' : 'rgba(255,255,255,0.01)',
          }}
          className="rounded-xl border-2 border-dashed p-5 flex flex-col items-center gap-2 cursor-pointer transition-colors"
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleUpload(file);
              e.target.value = '';
            }}
          />

          <div className="w-8 h-8 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
            <Upload size={14} className="text-indigo-400" />
          </div>
          <p className="text-xs text-slate-400 text-center">
            Drop a PDF here or{' '}
            <span className="text-indigo-400">click to browse</span>
          </p>
          <p className="text-[10px] text-slate-600">PDF files only</p>
        </motion.div>

        {/* Upload progress / status */}
        <AnimatePresence mode="wait">
          {upload.status === 'uploading' && (
            <motion.div
              key="uploading"
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              className="rounded-xl border border-white/7 bg-white/[0.02] p-3 space-y-2"
            >
              <div className="flex items-center justify-between">
                <p className="text-[11px] text-slate-300 truncate max-w-[180px]">{upload.filename}</p>
                <span className="text-[10px] font-mono text-slate-500">
                  {upload.totalPages > 0 ? `p.${upload.page}/${upload.totalPages}` : 'starting…'}
                </span>
              </div>

              {/* Progress bar */}
              <div className="h-1 rounded-full bg-white/5 overflow-hidden">
                <motion.div
                  className="h-full rounded-full bg-indigo-500"
                  animate={{ width: `${progress}%` }}
                  transition={{ ease: 'easeOut' }}
                />
              </div>

              <div className="flex items-center justify-between">
                <span className="text-[10px] text-slate-500">
                  {upload.chunksSoFar} chunks embedded
                </span>
                <span className="text-[10px] text-indigo-400">{progress}%</span>
              </div>
            </motion.div>
          )}

          {upload.status === 'done' && (
            <motion.div
              key="done"
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3 flex items-center gap-2"
            >
              <CheckCircle2 size={13} className="text-emerald-400 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-[11px] text-emerald-300 truncate">{upload.filename}</p>
                <p className="text-[10px] text-slate-500">{upload.chunksAdded} chunks added to index</p>
              </div>
              <button onClick={() => setUpload(INITIAL_UPLOAD)} className="text-slate-600 hover:text-slate-400">
                <X size={12} />
              </button>
            </motion.div>
          )}

          {upload.status === 'error' && (
            <motion.div
              key="error"
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="rounded-xl border border-red-500/20 bg-red-500/5 p-3 flex items-center gap-2"
            >
              <AlertCircle size={13} className="text-red-400 flex-shrink-0" />
              <p className="flex-1 text-[11px] text-red-300">{upload.error}</p>
              <button onClick={() => setUpload(INITIAL_UPLOAD)} className="text-slate-600 hover:text-slate-400">
                <X size={12} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Document list */}
        {docs.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-[10px] uppercase tracking-widest text-slate-600 px-1">Indexed files</p>
            <AnimatePresence initial={false}>
              {docs.map((doc) => (
                <motion.div
                  key={doc.filename}
                  layout
                  initial={{ opacity: 0, x: 12 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -12 }}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl border border-white/5 bg-white/[0.02] group"
                >
                  <FileText size={12} className="text-slate-500 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] text-slate-300 truncate">{doc.filename}</p>
                    <p className="text-[10px] text-slate-600">
                      {doc.chunks} chunks · {doc.size_kb} KB
                    </p>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleDelete(doc.filename)}
                    disabled={deleting === doc.filename}
                    className="opacity-0 group-hover:opacity-100 text-slate-600 hover:text-red-400 transition-all disabled:opacity-30"
                  >
                    <Trash2 size={12} />
                  </motion.button>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}

        {docs.length === 0 && upload.status === 'idle' && (
          <p className="text-[11px] text-slate-600 text-center py-2">No documents indexed yet</p>
        )}
      </div>
    </div>
  );
}
