import React, { useContext, useEffect, useState } from 'react';
import { Bot, MessageSquare, Send } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../contexts/AuthContext';
import { inquiryService } from '../../services/api';

const FAQS = [
  ['How do I book a tour package?', 'Choose a package from Tour Packages, open View Details, select your date and guests, then complete the booking steps.'],
  ['Can I customize my trip?', 'Open Customize Trip and choose your destination, accommodation, activities, dates, and guest details.'],
  ['Where can I check my booking status?', 'Sign in and open My Profile to see your bookings and their current status.'],
  ['How do I book a car rental?', 'Open Car Rentals, choose a vehicle, select your dates and pickup location, then submit your rental request.'],
  ['Can I change my travel date?', 'You can request a schedule change from your booking details. Changes depend on availability and approval.'],
];

const SupportChat = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [inquiries, setInquiries] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [selected, setSelected] = useState(null);
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [faqReply, setFaqReply] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  const loadInquiries = async (preferredId = selectedId) => {
    if (!user) return;
    setLoading(true);
    try {
      const data = await inquiryService.getAll();
      setInquiries(data || []);
      const nextId = preferredId && data?.some((item) => String(item.inquiry_id) === String(preferredId)) ? preferredId : data?.[0]?.inquiry_id;
      setSelectedId(nextId || null);
      const details = nextId ? await inquiryService.getById(nextId) : null;
      setSelected(details?.inquiry ? details : details ? { inquiry: details, messages: details.messages || [] } : null);
    } catch (requestError) {
      setError(requestError.message || 'Unable to load your conversations.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadInquiries(); }, [user]);

  const selectInquiry = async (id) => {
    setSelectedId(id);
    try {
      const details = await inquiryService.getById(id);
      setSelected(details?.inquiry ? details : { inquiry: details, messages: details.messages || [] });
    } catch (requestError) { setError(requestError.message || 'Unable to open this conversation.'); }
  };

  const sendNewInquiry = async (event) => {
    event.preventDefault();
    if (!user) { navigate('/login'); return; }
    if (!subject.trim() || !message.trim() || sending) return;
    setSending(true);
    try {
      const result = await inquiryService.create(subject.trim(), message.trim());
      setSubject(''); setMessage(''); await loadInquiries(result.inquiryId);
    } catch (requestError) { setError(requestError.message || 'Unable to send your inquiry.'); }
    finally { setSending(false); }
  };

  const sendReply = async (event) => {
    event.preventDefault();
    if (!selectedId || !message.trim() || sending) return;
    setSending(true);
    try { await inquiryService.sendMessage(selectedId, message.trim()); setMessage(''); await loadInquiries(selectedId); }
    catch (requestError) { setError(requestError.message || 'Unable to send your message.'); }
    finally { setSending(false); }
  };

  return (
    <div className="min-h-[calc(100vh-5rem)] bg-[#fcfbf9] px-4 py-8 sm:px-8 lg:px-12">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6"><h1 className="text-3xl font-bold text-[#2d2a24] sm:text-4xl">How can we help?</h1><p className="mt-2 max-w-2xl text-[#756d63]">Ask a question, browse quick answers, or continue a conversation with the RABAS support team.</p></div>
        {error && <div className="mb-4 rounded-xl border border-[#e5b9aa] bg-[#fff6f3] px-4 py-3 text-sm text-[#9b3f27]">{error}</div>}

        <div className="grid gap-5 lg:grid-cols-[300px_1fr]">
          <aside className="space-y-5">
            <section className="rounded-2xl border border-[#e0dbd0] bg-white p-4 shadow-sm"><div className="mb-3 flex items-center gap-2"><Bot className="h-5 w-5 text-[#603524]" /><h2 className="font-bold text-[#2d2a24]">Quick answers</h2></div><div className="space-y-2">{FAQS.map(([question, answer]) => <button type="button" key={question} onClick={() => setFaqReply(answer)} className="w-full rounded-xl border border-[#eee9df] px-3 py-3 text-left text-sm font-semibold text-[#4a453b] hover:border-[#cdb6a7] hover:bg-[#fcf7f3]">{question}</button>)}</div>{faqReply && <div className="mt-3 rounded-xl bg-[#f7f1ed] p-3 text-sm leading-relaxed text-[#604638]">{faqReply}</div>}</section>
            {user && <section className="rounded-2xl border border-[#e0dbd0] bg-white p-4 shadow-sm"><div className="mb-3 flex items-center gap-2"><MessageSquare className="h-5 w-5 text-[#603524]" /><h2 className="font-bold text-[#2d2a24]">My conversations</h2></div>{loading ? <p className="text-sm text-[#756d63]">Loading...</p> : inquiries.length === 0 ? <p className="text-sm text-[#756d63]">No conversations yet.</p> : inquiries.map((item) => <button type="button" key={item.inquiry_id} onClick={() => selectInquiry(item.inquiry_id)} className={`mb-1 w-full rounded-lg px-3 py-2 text-left ${String(selectedId) === String(item.inquiry_id) ? 'bg-[#f7f1ed]' : 'hover:bg-[#fcf7f3]'}`}><p className="truncate text-sm font-semibold text-[#2d2a24]">{item.subject}</p><p className="mt-1 text-xs text-[#8a8275]">{item.status}</p></button>)}</section>}
          </aside>

          <main className="flex min-h-[610px] flex-col overflow-hidden rounded-2xl border border-[#e0dbd0] bg-white shadow-sm">
            <header className="flex items-center justify-between bg-[#603524] px-5 py-3 text-white"><div><p className="font-bold">RABAS Support</p><p className="text-xs text-white/70">{selected ? `Conversation · ${selected.inquiry.status}` : 'Usually replies within one business day'}</p></div><MessageSquare className="h-5 w-5 text-white/80" /></header>
            {selected ? <><div className="border-b border-[#eee9df] px-5 py-4"><h2 className="font-bold text-[#2d2a24]">{selected.inquiry.subject}</h2><p className="mt-1 text-xs text-[#8a8275]">Your conversation with the RABAS team</p></div><div className="flex-1 space-y-4 overflow-y-auto bg-[#fcfbf9] p-5">{selected.messages?.map((item) => <div key={item.message_id} className={`flex ${item.sender_role === 'Customer' ? 'justify-end' : 'justify-start'}`}><div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${item.sender_role === 'Customer' ? 'rounded-br-sm bg-[#603524] text-white' : 'rounded-bl-sm border border-[#e0dbd0] bg-white text-[#4a453b]'}`}><p className="mb-1 text-[10px] font-bold uppercase opacity-65">{item.sender_role === 'Customer' ? 'You' : 'RABAS Support'}</p>{item.message}</div></div>)}</div><form onSubmit={sendReply} className="flex gap-3 border-t border-[#eee9df] p-4"><textarea value={message} onChange={(event) => setMessage(event.target.value)} rows={2} placeholder="Write a message..." className="min-w-0 flex-1 resize-none rounded-xl border border-[#d6cfc2] px-4 py-3 text-sm outline-none focus:border-[#603524]" /><button type="submit" disabled={sending || !message.trim()} className="self-end rounded-xl bg-[#603524] px-4 py-3 text-sm font-bold text-white disabled:opacity-50"><Send className="h-4 w-4" /></button></form></> : <><div className="flex flex-1 flex-col items-center justify-center px-6 text-center"><div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#f7f1ed]"><MessageSquare className="h-7 w-7 text-[#603524]" /></div><h2 className="text-xl font-bold text-[#2d2a24]">Start a new inquiry</h2><p className="mt-2 max-w-md text-sm text-[#756d63]">Tell us what you need help with and our team will continue the conversation here.</p>{!user && <button type="button" onClick={() => navigate('/login')} className="mt-4 rounded-xl bg-[#603524] px-5 py-3 text-sm font-bold text-white">Sign in to contact support</button>}</div>{user && <form onSubmit={sendNewInquiry} className="space-y-3 border-t border-[#eee9df] p-5"><input value={subject} onChange={(event) => setSubject(event.target.value)} placeholder="What do you need help with?" maxLength={180} className="w-full rounded-xl border border-[#d6cfc2] px-4 py-3 text-sm outline-none focus:border-[#603524]" /><div className="flex gap-3"><textarea value={message} onChange={(event) => setMessage(event.target.value)} rows={3} placeholder="Write your message..." className="min-w-0 flex-1 resize-none rounded-xl border border-[#d6cfc2] px-4 py-3 text-sm outline-none focus:border-[#603524]" /><button type="submit" disabled={sending || !subject.trim() || !message.trim()} className="self-end rounded-xl bg-[#603524] px-4 py-3 text-sm font-bold text-white disabled:opacity-50"><Send className="h-4 w-4" /></button></div></form>}</>}
          </main>
        </div>
      </div>
    </div>
  );
};

export default SupportChat;
