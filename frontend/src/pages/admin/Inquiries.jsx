import React, { useEffect, useState } from 'react';
import { MessageSquare, RefreshCw, Send } from 'lucide-react';
import { inquiryService } from '../../services/api';

const STATUSES = ['Open', 'In Progress', 'Resolved', 'Closed'];

const Inquiries = () => {
  const [inquiries, setInquiries] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [selected, setSelected] = useState(null);
  const [reply, setReply] = useState('');
  const [status, setStatus] = useState('Open');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const loadInquiries = async (preferredId = selectedId) => {
    setLoading(true);
    setError('');
    try {
      const data = await inquiryService.getAll();
      setInquiries(data || []);
      const nextId = preferredId && data?.some((item) => String(item.inquiry_id) === String(preferredId))
        ? preferredId
        : data?.[0]?.inquiry_id;
      setSelectedId(nextId || null);
      if (nextId) {
        const details = await inquiryService.getById(nextId);
        setSelected(details);
        setStatus(details.inquiry.status);
      } else {
        setSelected(null);
      }
    } catch (requestError) {
      setError(requestError.message || 'Unable to load customer inquiries.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadInquiries(); }, []);

  const selectInquiry = async (id) => {
    setSelectedId(id);
    try {
      const details = await inquiryService.getById(id);
      setSelected(details);
      setStatus(details.inquiry.status);
    } catch (requestError) {
      setError(requestError.message || 'Unable to load this inquiry.');
    }
  };

  const sendReply = async (event) => {
    event.preventDefault();
    if (!reply.trim() || saving || !selectedId) return;
    setSaving(true);
    try {
      await inquiryService.sendMessage(selectedId, reply.trim());
      setReply('');
      await loadInquiries(selectedId);
    } catch (requestError) {
      setError(requestError.message || 'Unable to send the reply.');
    } finally {
      setSaving(false);
    }
  };

  const saveStatus = async () => {
    if (!selectedId || saving) return;
    setSaving(true);
    try {
      await inquiryService.updateStatus(selectedId, status);
      await loadInquiries(selectedId);
    } catch (requestError) {
      setError(requestError.message || 'Unable to update the inquiry status.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5 p-4 sm:p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#2d2a24]">Customer Inquiries</h1>
          <p className="mt-1 text-sm text-[#756d63]">Respond to questions from the live chat support widget.</p>
        </div>
        <button type="button" onClick={() => loadInquiries()} className="inline-flex items-center gap-2 rounded-lg border border-[#d6cfc2] bg-white px-3 py-2 text-sm font-semibold text-[#603524] hover:bg-[#f7f1ed]">
          <RefreshCw className="h-4 w-4" /> Refresh
        </button>
      </div>

      {error && <div className="rounded-lg border border-[#e5b9aa] bg-[#fff6f3] px-4 py-3 text-sm text-[#9b3f27]">{error}</div>}

      <div className="grid min-h-[560px] gap-4 lg:grid-cols-[320px_1fr]">
        <section className="overflow-hidden rounded-xl border border-[#e0dbd0] bg-white">
          <div className="border-b border-[#eee9df] px-4 py-3 font-bold text-[#2d2a24]">Inbox ({inquiries.length})</div>
          <div className="max-h-[510px] overflow-y-auto">
            {loading ? <p className="p-4 text-sm text-[#756d63]">Loading inquiries...</p> : inquiries.length === 0 ? <div className="p-6 text-center text-sm text-[#756d63]"><MessageSquare className="mx-auto mb-2 h-8 w-8 text-[#b9afa2]" />No customer inquiries yet.</div> : inquiries.map((item) => (
              <button type="button" key={item.inquiry_id} onClick={() => selectInquiry(item.inquiry_id)} className={`w-full border-b border-[#f0ece5] px-4 py-3 text-left hover:bg-[#fcf8f4] ${String(selectedId) === String(item.inquiry_id) ? 'bg-[#f7f1ed]' : ''}`}>
                <div className="flex items-start justify-between gap-2"><span className="truncate text-sm font-bold text-[#2d2a24]">{item.subject}</span><span className="text-[10px] font-bold uppercase text-[#8a8275]">{item.status}</span></div>
                <p className="mt-1 truncate text-xs text-[#756d63]">{item.customer_name || item.customer_email}</p>
                <p className="mt-1 text-[11px] text-[#a0978b]">{item.message_count || 0} message{Number(item.message_count) === 1 ? '' : 's'}</p>
              </button>
            ))}
          </div>
        </section>

        <section className="flex min-h-[560px] flex-col rounded-xl border border-[#e0dbd0] bg-white">
          {!selected ? <div className="flex flex-1 items-center justify-center p-6 text-sm text-[#756d63]">Select an inquiry to view the conversation.</div> : <>
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#eee9df] px-5 py-4">
              <div><h2 className="font-bold text-[#2d2a24]">{selected.inquiry.subject}</h2><p className="text-xs text-[#756d63]">{selected.inquiry.customer_name || selected.inquiry.customer_email}</p></div>
              <div className="flex items-center gap-2"><select value={status} onChange={(event) => setStatus(event.target.value)} className="rounded-lg border border-[#d6cfc2] px-2 py-2 text-xs"><option>{STATUSES[0]}</option><option>{STATUSES[1]}</option><option>{STATUSES[2]}</option><option>{STATUSES[3]}</option></select><button type="button" onClick={saveStatus} disabled={saving} className="rounded-lg bg-[#603524] px-3 py-2 text-xs font-bold text-white disabled:opacity-50">Save status</button></div>
            </div>
            <div className="flex-1 space-y-3 overflow-y-auto bg-[#fcfbf9] p-5">
              {(selected.messages || []).map((message) => <div key={message.message_id} className={`flex ${message.sender_role === 'Customer' ? 'justify-start' : 'justify-end'}`}><div className={`max-w-[78%] rounded-xl px-4 py-3 text-sm ${message.sender_role === 'Customer' ? 'border border-[#e0dbd0] bg-white text-[#4a453b]' : 'bg-[#603524] text-white'}`}><p className="mb-1 text-[10px] font-bold uppercase opacity-70">{message.sender_role === 'Customer' ? 'Customer' : 'Staff'}</p>{message.message}</div></div>)}
            </div>
            <form onSubmit={sendReply} className="flex gap-2 border-t border-[#eee9df] p-4"><textarea value={reply} onChange={(event) => setReply(event.target.value)} rows={2} placeholder="Write a reply..." className="min-w-0 flex-1 resize-none rounded-lg border border-[#d6cfc2] px-3 py-2 text-sm outline-none focus:border-[#603524]" /><button type="submit" disabled={saving || !reply.trim()} className="inline-flex items-center gap-2 self-end rounded-lg bg-[#603524] px-4 py-2 text-sm font-bold text-white disabled:opacity-50"><Send className="h-4 w-4" /> Reply</button></form>
          </>}
        </section>
      </div>
    </div>
  );
};

export default Inquiries;
