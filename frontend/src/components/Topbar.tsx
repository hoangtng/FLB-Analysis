import { useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useDropzone } from 'react-dropzone';
import { useStore } from '../store/useStore';
import { uploadFile } from '../api/client';
import { UploadCloud } from 'lucide-react';
import clsx from 'clsx';

export default function Topbar() {
  const { mode, setMode, setActiveUploadId } = useStore();
  const queryClient = useQueryClient();

  const { mutate: doUpload, isPending } = useMutation({
    mutationFn: uploadFile,
    onSuccess: (data) => {
      setActiveUploadId(data.uploadId);
      queryClient.invalidateQueries({ queryKey: ['uploads'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
      queryClient.invalidateQueries({ queryKey: ['delays'] });
    },
    onError: (e) => (e.message, 'error'),
  });

  const onDrop = useCallback((files: File[]) => { if (files[0]) doUpload(files[0]); }, [doUpload]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'text/csv': ['.csv'],
    },
    multiple: false,
  });

  return (
    <header className="flex items-center justify-between px-6 h-[52px] border-b border-border bg-surface shrink-0 gap-4">
      <div className="font-display text-[15px] font-extrabold tracking-[0.06em]">
        FLB <span className="text-amber">OPS</span> CENTER
      </div>

      {/* Mode toggle */}
      <div className="flex items-center gap-1 bg-surface2 border border-border rounded-lg p-1">
        {(['ops', 'leadership'] as const).map(m => (
          <button key={m} onClick={() => setMode(m)}
            className={clsx(
              'font-mono text-[10px] tracking-[0.08em] uppercase px-4 py-1.5 rounded-md transition-all',
              mode === m ? 'bg-amber text-black font-semibold' : 'text-muted hover:text-white'
            )}>
            {m === 'ops' ? 'Ops View' : 'Leadership'}
          </button>
        ))}
      </div>

      {/* Upload button */}
      <div {...getRootProps()} className={clsx(
        'flex items-center gap-2 px-4 py-1.5 rounded-md border cursor-pointer transition-all',
        isDragActive ? 'border-amber bg-amber/10 text-amber' : 'border-border2 bg-surface2 text-muted2 hover:border-amber hover:text-amber',
        isPending && 'opacity-50 pointer-events-none'
      )}>
        <input {...getInputProps()} />
        {isPending
          ? <div className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" />
          : <UploadCloud size={13} />}
        <span className="font-mono text-[10px] tracking-[0.08em] uppercase whitespace-nowrap">
          {isPending ? 'Processing…' : 'Upload Data'}
        </span>
      </div>
    </header>
  );
}