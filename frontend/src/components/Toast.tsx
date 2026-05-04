import { useStore } from '../store/useStore';

export default function Toast() {
  const { toast } = useStore();
  if (!toast.visible) return null;
  return (
    <div className={`fixed bottom-5 right-5 z-50 px-4 py-3 rounded-lg border text-sm
      ${toast.type === 'error'
        ? 'bg-surface2 border-danger/40 text-danger'
        : 'bg-surface2 border-success/40 text-success'}`}>
      {toast.message}
    </div>
  );
}
