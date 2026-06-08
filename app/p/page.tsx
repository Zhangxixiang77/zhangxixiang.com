'use client';

import { useState } from 'react';

const ANSWERS = ['zhangzhi', '张治'];

export default function PPPage() {
  const [input, setInput] = useState('');
  const [unlocked, setUnlocked] = useState(false);
  const [error, setError] = useState(false);

  function handleUnlock() {
    if (ANSWERS.includes(input.trim().toLowerCase())) {
      setUnlocked(true);
      setError(false);
    } else {
      setError(true);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') handleUnlock();
  }

  if (unlocked) {
    return (
      <iframe
        src="/preview.html?lang=zh"
        className="fixed inset-0 h-full w-full border-0"
        title="AI Learning Companion"
        allowFullScreen
      />
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#081C1C] px-5">
      <div className="w-full max-w-sm text-center">
        {/* brand mark */}
        <div className="mb-10 font-serif text-[13px] tracking-[0.2em] text-[#C9A961] uppercase">
          AI Learning Companion · Product Deck
        </div>

        <h1 className="mb-3 font-serif text-[22px] text-white">
          Who is Director of the Lab of AI for Education at ECNU?<br />
          {/* <span className="text-white/70">谁是华东师范大学智能教育实验室主任？</span> */}
        </h1>
        <p className="mb-10 text-[14px] italic text-white/50">
          Please answer to access
        </p>

        <div className="relative">
          <input
            type="text"
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              setError(false);
            }}
            onKeyDown={handleKeyDown}
            placeholder="华东师范大学智能教育实验室主任？"
            className="w-full rounded-full border border-white/20 bg-white/10 px-6 py-4 text-center text-[16px] text-white placeholder-white/30 outline-none transition-colors focus:border-[#C9A961]"
          />
          {error && (
            <p className="mt-3 text-[12px] text-red-400">wrong answer — try again</p>
          )}
        </div>

        <button
          onClick={handleUnlock}
          className="mt-6 rounded-full bg-[#C9A961] px-8 py-3 text-[13px] font-bold tracking-[0.1em] text-[#081C1C] transition-opacity hover:opacity-80"
        >
          ENTER
        </button>
      </div>
    </div>
  );
}
