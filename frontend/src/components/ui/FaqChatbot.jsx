import React from 'react';
import { MessageCircleQuestion } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const FaqChatbot = () => {
  const navigate = useNavigate();
  return (
    <div className="fixed bottom-5 right-5 z-[60]">
      <button type="button" onClick={() => navigate('/support/chat')} className="flex h-14 w-14 items-center justify-center rounded-full bg-[#603524] text-white shadow-[0_8px_20px_rgba(96,53,36,0.35)] transition-transform hover:scale-105" aria-label="Open customer support chat" title="Open customer support chat">
        <MessageCircleQuestion className="h-7 w-7" />
      </button>
    </div>
  );
};

export default FaqChatbot;
