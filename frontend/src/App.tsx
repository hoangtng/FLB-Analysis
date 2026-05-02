import Topbar from './components/Topbar';
import { useDropzone } from 'react-dropzone';
import { useCallback } from 'react';
import { uploadFile } from './api/client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useStore } from './store/useStore';

function UploadScreen() {
  const { setActiveUploadId, showToast } = useStore();
  const queryClient = useQueryClient();

  const { mutate: doUpload, isPending } = useMutation({
    mutationFn: uploadFile,
    onSuccess: (data) => {
      setActiveUploadId(data.uploadId);
      queryClient.invalidateQueries({ queryKey: ['uploads'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
      showToast(`✓ ${data.recordCount} delay events loaded`);
    },
    onError: (e) => showToast(e.message, 'error'),
  });

  const onDrop = useCallback((files: File[]) => { if (files[0]) doUpload(files[0]); }, [doUpload]);
  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop });

  return (
    <div className="flex flex-col items-center justify-center h-full gap-6">
      <div className="text-[64px] opacity-20">✈</div>
      <div className="font-display text-2xl font-bold text-muted2">No data loaded</div>
      <p className="text-sm text-muted">Upload your FLB Excel or CSV file to begin</p>
      <div {...getRootProps()} className={`mt-2 px-10 py-6 border-2 border-dashed rounded-xl cursor-pointer text-center transition-all
        ${isDragActive ? 'border-amber bg-amber/5 text-amber' : 'border-border2 text-muted2 hover:border-amber hover:text-amber'}`}>
        <input {...getInputProps()} />
        <p className="font-mono text-[11px] tracking-widest uppercase">
          {isPending ? 'Processing…' : 'Drop file or click to browse'}
        </p>
        <p className="text-xs text-muted mt-2">.xlsx or .csv</p>
      </div>
    </div>
  );
}

export default function App() {
  

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-bg">
      <Topbar />
      <div className="flex-1 overflow-hidden">
        <UploadScreen />
        
      </div>
      
    </div>
  );
}