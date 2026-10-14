import React, { useState } from 'react';
import { Bot, MessageCircleQuestion, Send, X } from 'lucide-react';

const FAQS = [
  {
    question: 'How do I book a tour package?',
    answer: 'Choose a package from Tour Packages, open View Details, select your travel date and number of guests, then complete the booking and payment steps.',
  },
  {
    question: 'What is the difference between Exclusive and Joiner tours?',
    answer: 'Exclusive tours are arranged for your private group. Joiner tours use a shared schedule where guests join other travelers and share the trip slots.',
  },
  {
    question: 'How do I book a Tuktrip?',
    answer: 'Open Tour Packages, select Tuktrip from the category filter, choose a route, and continue to View Details to start your booking.',
  },
  {
    question: 'Can I customize my trip?',
    answer: 'Yes. Open Customize Trip and select your destination, accommodation, activities, dates, and guest details before submitting your request.',
  },
  {
    question: 'Where can I check my booking status?',
    answer: 'Sign in and open My Profile. Your bookings and their current status are listed there.',
  },
  {
    question: 'How can I contact support?',
    answer: 'You can email support@rabastravel.com or call +63 917 123 4567 for assistance.',
  },
  {
    question: 'What payment methods are accepted?',
    answer: 'Bookings currently accept GCash and credit card payments. Follow the payment instructions shown during checkout.',
  },
  {
    question: 'Can I change my travel date?',
    answer: 'You can request a schedule change from your booking details in My Profile. Requests are subject to availability and approval.',
  },
  {
    question: 'How do I know if my booking is confirmed?',
    answer: 'A booking starts as Pending Verification. It becomes Booked after the admin reviews and confirms it. You can check the status in My Profile.',
  },
  {
    question: 'What happens if a Joiner tour is full?',
    answer: 'A Joiner tour cannot accept more guests once all available slots are taken. You can choose another schedule or package.',
  },
  {
    question: 'What is included in a tour package?',
    answer: 'Each package has its own inclusions, itinerary, duration, meeting location, and capacity. Open the package booking page to review the details before booking.',
  },
  {
    question: 'How do I book a car rental?',
    answer: 'Open Car Rentals, choose an available vehicle, select your pickup and return dates, enter the pickup location, and complete payment.',
  },
  {
    question: 'What are the car rental requirements?',
    answer: 'You need an account, valid pickup and return dates, a pickup location, and a payment reference or card details to submit a rental request.',
  },
  {
    question: 'Can I upload photos from my trip?',
    answer: 'Yes. Sign in, open Explore Map, and use Share Story. You must have a tour booking to share trip photos.',
  },
  {
    question: 'How do I reset my password?',
    answer: 'Open the Login page and choose Forgot Password. Follow the email verification steps to create a new password.',
  },
  {
    question: 'Where can I see the tour meeting location?',
    answer: 'The meeting location is shown in the package details and booking information before you submit your reservation.',
  },
  {
    question: 'Can I request a customized itinerary?',
    answer: 'Yes. Use Customize Trip to choose destinations, accommodations, activities, dates, and guest details for a personalized trip request.',
  },
  {
    question: 'How do I create an account?',
    answer: 'Select Sign Up on the Login page, enter your basic information, create a password, and complete the registration steps.',
  },
  {
    question: 'Do I need an account to make a booking?',
    answer: 'Yes. An account is required so you can submit bookings, receive updates, and view your reservation history.',
  },
  {
    question: 'How do I log in?',
    answer: 'Open the Login page and enter the email address and password registered to your RABAS account.',
  },
  {
    question: 'How do I log out?',
    answer: 'Open your account menu and select Log Out. Confirm the action when the confirmation message appears.',
  },
  {
    question: 'Can I update my profile information?',
    answer: 'Yes. Open My Profile, choose the edit option, update your information, and save your changes.',
  },
  {
    question: 'Can I cancel my booking?',
    answer: 'Cancellation availability depends on the booking status and applicable policy. Open the booking in My Profile and select the available cancellation option.',
  },
  {
    question: 'Will I get a refund if I cancel?',
    answer: 'Refund eligibility depends on the cancellation policy and booking status. Contact support if you need help reviewing your request.',
  },
  {
    question: 'What should I do if my payment failed?',
    answer: 'Check your payment details and try again. If the issue continues, save any payment reference or error message and contact support.',
  },
  {
    question: 'How long does booking confirmation take?',
    answer: 'Bookings are reviewed by the admin team. You can monitor the status in My Profile while confirmation is pending.',
  },
  {
    question: 'Can I book for another person?',
    answer: 'Yes. Enter the correct guest details during booking and make sure the information matches the person who will join the trip.',
  },
  {
    question: 'How many guests can join a tour?',
    answer: 'The maximum number depends on the package capacity. Check the guest capacity shown on the package details page before booking.',
  },
  {
    question: 'What is a Tuktrip?',
    answer: 'A Tuktrip is a local trip experience organized around a selected route or destination. Available details and schedules are shown on its package page.',
  },
  {
    question: 'What is an Exclusive Tour Package?',
    answer: 'An Exclusive Tour Package is a private trip arrangement for your group, with the itinerary and capacity shown in the package details.',
  },
  {
    question: 'What is a Joiner Tour Package?',
    answer: 'A Joiner Tour Package lets individual guests or smaller groups join a scheduled trip with other travelers. Availability depends on the remaining slots.',
  },
  {
    question: 'Are meals included in the tour?',
    answer: 'Meals are included only when listed in the package inclusions. Review the package details or ask support before booking.',
  },
  {
    question: 'What should I bring on a tour?',
    answer: 'Bring a valid ID, booking details, comfortable clothing, personal medication, needed toiletries, and any items recommended for the destination.',
  },
  {
    question: 'What happens during bad weather?',
    answer: 'The trip may be adjusted, rescheduled, or cancelled when conditions are unsafe. RABAS will provide updates through your booking details or contact information.',
  },
  {
    question: 'Where do I meet for the tour?',
    answer: 'Your meeting location is shown on the package and booking details. Check it before the scheduled departure and contact support if you need directions.',
  },
  {
    question: 'How early should I arrive?',
    answer: 'Arrive at the meeting location early enough for check-in and preparation. The exact recommended time may be included in your booking instructions.',
  },
  {
    question: 'Can I bring children on a tour?',
    answer: 'Children may join when allowed by the package and activity requirements. Check the package details and provide accurate guest information when booking.',
  },
  {
    question: 'Are pets allowed on tours?',
    answer: 'Pet policies vary by package, vehicle, and destination. Contact support before booking if you plan to bring a pet.',
  },
  {
    question: 'How do I find a package?',
    answer: 'Open Tour Packages and use the type filter to browse Exclusive, Joiner, or Tuktrip packages. You can also sort packages by newest or oldest.',
  },
  {
    question: 'Can I compare different packages?',
    answer: 'Yes. Review each package card and details page to compare price, duration, capacity, destination, inclusions, and meeting location.',
  },
  {
    question: 'How do I book a hotel or accommodation?',
    answer: 'Accommodation availability depends on the package or customized trip request. Review the listed inclusions or include your preference in Customize Trip.',
  },
  {
    question: 'Can I request airport pickup?',
    answer: 'Airport pickup may be available depending on the package or customization request. Include it in your trip request or contact support for assistance.',
  },
  {
    question: 'How do I contact the tour guide?',
    answer: 'Guide contact details or meeting instructions are provided through the confirmed booking when available. Contact support if you cannot find them.',
  },
  {
    question: 'Can I rent a car without a tour booking?',
    answer: 'Car rental availability depends on the vehicle and selected dates. Open Car Rentals to check available vehicles and booking requirements.',
  },
  {
    question: 'Can I choose a different car pickup location?',
    answer: 'Enter your preferred pickup location during the car rental booking. Availability may depend on the selected vehicle and rental schedule.',
  },
  {
    question: 'How do I report a problem with my booking?',
    answer: 'Contact support with your name, booking reference, and a short description of the issue. Include screenshots or payment references when helpful.',
  },
  {
    question: 'How do I leave feedback or a review?',
    answer: 'After your trip, open the completed booking in My Profile and use the review option when it becomes available.',
  },
  {
    question: 'Is my personal information safe?',
    answer: 'Your account information is used to manage bookings and provide services. Use a strong password and contact support if you notice unusual account activity.',
  },
  {
    question: 'What if I cannot find the answer I need?',
    answer: 'Please contact support@rabastravel.com or call +63 917 123 4567. Include your booking reference when asking about an existing reservation.',
  },
];

const getAnswer = (question) => {
  const normalized = question.toLowerCase();
  const match = FAQS.find((faq) => {
    const keywords = faq.question.toLowerCase().split(/\s+/).filter((word) => word.length > 4);
    return keywords.filter((keyword) => normalized.includes(keyword)).length >= 2;
  });

  return match?.answer || 'I can help with tour bookings, Exclusive tours, Joiner tours, Tuktrips, customized trips, booking status, and support. Try asking about one of those topics.';
};

const FaqChatbot = () => {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'bot', text: 'Hi! I can help answer common questions about bookings, tours, Tuktrips, and customized trips.' },
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const handleQuestion = (faq) => {
    const answer = faq.answer;
    setMessages((current) => [
      ...current,
      { role: 'user', text: faq.question },
    ]);
    setIsTyping(true);
    window.setTimeout(() => {
      setMessages((current) => [...current, { role: 'bot', text: answer }]);
      setIsTyping(false);
    }, 650);
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const question = input.trim();
    if (!question || isTyping) return;
    setInput('');
    handleQuestion({ question, answer: getAnswer(question) });
  };

  return (
    <div className="fixed bottom-5 right-5 z-[60] flex flex-col items-end gap-3">
      {open && (
        <div className="w-[min(360px,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-[#e0dbd0] bg-white shadow-[0_14px_40px_rgba(45,42,36,0.2)]">
          <div className="flex items-center justify-between bg-[#603524] px-4 py-3 text-white">
            <div className="flex items-center gap-2">
              <Bot className="h-5 w-5" />
              <div>
                <p className="text-sm font-bold">RABAS FAQ Assistant</p>
                <p className="text-[10px] text-white/70">Choose a question below</p>
              </div>
            </div>
            <button onClick={() => setOpen(false)} className="rounded-full p-1 text-white/80 hover:bg-white/10 hover:text-white" aria-label="Close FAQ assistant">
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="max-h-64 space-y-2 overflow-y-auto bg-[#fcfbf9] p-3">
            {messages.map((message, index) => (
              <div key={`${message.role}-${index}`} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[88%] rounded-xl px-3 py-2 text-xs leading-relaxed ${message.role === 'user' ? 'rounded-br-sm bg-[#603524] text-white' : 'rounded-bl-sm border border-[#e0dbd0] bg-white text-[#4a453b]'}`}>
                  {message.text}
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="flex justify-start">
                <div className="rounded-xl rounded-bl-sm border border-[#e0dbd0] bg-white px-3 py-2 text-xs text-[#8a8275]">
                  <span className="mr-1 inline-block animate-bounce">●</span>
                  <span className="mr-1 inline-block animate-bounce [animation-delay:120ms]">●</span>
                  <span className="inline-block animate-bounce [animation-delay:240ms]">●</span>
                </div>
              </div>
            )}
          </div>

          <div className="border-t border-[#eae5db] bg-white p-3">
            <form onSubmit={handleSubmit} className="flex items-center gap-2">
              <input value={input} onChange={(event) => setInput(event.target.value)} placeholder="Type your question..." className="min-w-0 flex-1 rounded-lg border border-[#d6cfc2] px-3 py-2 text-xs text-[#2d2a24] outline-none focus:border-[#603524]" aria-label="Ask a question" />
              <button type="submit" disabled={!input.trim() || isTyping} className="rounded-lg bg-[#603524] p-2 text-white hover:bg-[#4a281b] disabled:cursor-not-allowed disabled:opacity-40" aria-label="Send question">
                <Send className="h-4 w-4" />
              </button>
            </form>
            <p className="mb-2 mt-3 text-[10px] font-bold uppercase tracking-wider text-[#8a8275]">Suggested questions</p>
            <div className="flex max-h-24 flex-wrap gap-1.5 overflow-y-auto">
              {FAQS.map((faq) => (
                <button key={faq.question} onClick={() => handleQuestion(faq)} className="rounded-lg border border-[#d6cfc2] px-3 py-2 text-left text-[11px] font-semibold text-[#4a453b] transition-colors hover:border-[#603524] hover:bg-[#f7f1ed]">
                  {faq.question}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <button onClick={() => setOpen((value) => !value)} className="flex h-14 w-14 items-center justify-center rounded-full bg-[#603524] text-white shadow-[0_8px_20px_rgba(96,53,36,0.35)] transition-transform hover:scale-105" aria-label="Open frequently asked questions">
        {open ? <X className="h-6 w-6" /> : <MessageCircleQuestion className="h-7 w-7" />}
      </button>
    </div>
  );
};

export default FaqChatbot;
