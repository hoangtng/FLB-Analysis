import { useState } from "react";
import { useStore } from "../store/useStore";
import { useMutation } from "@tanstack/react-query";
import { sendAlert } from '../api/client';


export default function AlertModal() {
    const { alertModal, closeAlert, showToast } = useStore();
    
    const [message, setMessage] = useState('');
    const [codes, setCodes]  = useState('');

    const { mutate, isPending } = useMutation({
        mutationFn: sendAlert,
        onSuccess: () => {
            closeAlert(); 
            setMessage(''); 
            setCodes('');
            showToast(`✓ Alert sent to ${alertModal.team}`);
        },
        onError: (e) => showToast(e.message, 'error'),
    });

    if(!alertModal.open) return null;

    return (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center">
            <div className="bg-surface2 border border-border2 rounded-xl p-7 w-[420px]">
                <h2 className="font-display text-[16px] font-bold mb-1">Alert: {alertModal.team}</h2>
                <p className="text-xs text-muted2 mb-5">{alertModal.context}</p>

                <div className="mb-4">
                    <label className="mono-label mb-2 block">Message</label>
                    <textarea className="input-field resize-none" rows={4}
                    placeholder="Describe the delay pattern…"
                    value={message} onChange={e => setMessage(e.target.value)} />
                </div>

                <div className="mb-5">
                    <label className="mono-label mb-2 block">Delay Codes (optional)</label>
                    <input className="input-field" placeholder="e.g. A32A, A33A"
                    value={codes} onChange={e => setCodes(e.target.value)} />
                </div>

                <div className="flex gap-3">
                    <button className="btn-primary flex-1"
                    onClick={() => mutate({ team: alertModal.team, message, codes: codes.split(',').map(c => c.trim()).filter(Boolean) })}
                    disabled={isPending}>
                    {isPending ? 'Sending…' : 'Send Alert'}
                    </button>
                    <button className="btn-ghost" onClick={closeAlert}>Cancel</button>
                </div>
             </div>
        </div>
    );
}