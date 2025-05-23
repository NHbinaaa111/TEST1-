import { useState, useEffect } from 'react';
import { Quote } from '@/lib/types';
import { getRandomQuote, getDailyQuote } from '@/lib/quotes';

interface QuoteCardProps {
  initialQuote?: Quote;
}

export default function QuoteCard({ initialQuote }: QuoteCardProps) {
  const [quote, setQuote] = useState<Quote>(initialQuote || getDailyQuote());

  const handleNewQuote = () => {
    setQuote(getRandomQuote());
  };

  // If no initial quote is provided, use the daily quote
  useEffect(() => {
    if (!initialQuote) {
      setQuote(getDailyQuote());
    }
  }, [initialQuote]);

  return (
    <div className="bg-[#252525] p-6 rounded-lg border border-[#1E1E1E] flex flex-col justify-between h-full">
      <h3 className="font-semibold text-lg mb-4">Daily Motivation</h3>
      
      <div className="flex-grow">
        <blockquote className="text-lg italic border-l-4 border-[#00EEFF] pl-4 py-2 mb-4">
          <p id="quote-text">{quote.text}</p>
        </blockquote>
        <p className="text-right text-sm text-[#E0E0E0] opacity-80">- <span id="quote-author">{quote.author}</span></p>
      </div>
      
      <button 
        id="new-quote-btn" 
        className="mt-4 w-full py-2 rounded-md border border-[#00EEFF] text-[#00EEFF] hover:bg-[#00EEFF] hover:bg-opacity-10 transition-all duration-300"
        onClick={handleNewQuote}
      >
        New Quote
      </button>
    </div>
  );
}
