import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Sparkles } from 'lucide-react';

interface StorySetupProps {
  onGenerate: (data: { characterName: string; theme: string; setting: string; artStyle: string; numPages: number }) => void;
  isGenerating: boolean;
}

export function StorySetup({ onGenerate, isGenerating }: StorySetupProps) {
  const [characterName, setCharacterName] = useState('Leo the Bear');
  const [theme, setTheme] = useState('Courage and Friendship');
  const [setting, setSetting] = useState('The Whispering Woods');
  const [artStyle, setArtStyle] = useState('Watercolor illustration, soft pastel colors');
  const [numPages, setNumPages] = useState(5);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!characterName || !theme || !setting || !artStyle) return;
    onGenerate({ characterName, theme, setting, artStyle, numPages });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="max-w-md mx-auto p-8 bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl"
    >
      <div className="text-center mb-8">
        <h1 className="text-xl font-semibold tracking-tight uppercase mb-2">Narrative Genesis</h1>
        <p className="text-xs text-zinc-500 uppercase tracking-widest font-bold">Describe the spark of your story...</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="text-[11px] uppercase tracking-[0.2em] text-zinc-500 font-bold mb-2 block" htmlFor="character">
            Protagonist
          </label>
          <input
            id="character"
            type="text"
            required
            value={characterName}
            onChange={(e) => setCharacterName(e.target.value)}
            className="w-full h-12 bg-zinc-950 border border-zinc-800 rounded-lg px-4 text-sm text-zinc-300 focus:outline-none focus:border-indigo-500 transition-colors placeholder:text-zinc-600"
            placeholder="e.g. Leo the Fox"
          />
        </div>

        <div>
          <label className="text-[11px] uppercase tracking-[0.2em] text-zinc-500 font-bold mb-2 block" htmlFor="setting">
            Setting
          </label>
          <input
            id="setting"
            type="text"
            required
            value={setting}
            onChange={(e) => setSetting(e.target.value)}
            className="w-full h-12 bg-zinc-950 border border-zinc-800 rounded-lg px-4 text-sm text-zinc-300 focus:outline-none focus:border-indigo-500 transition-colors placeholder:text-zinc-600"
            placeholder="e.g. The Whispering Woods"
          />
        </div>

        <div>
           <label className="text-[11px] uppercase tracking-[0.2em] text-zinc-500 font-bold mb-2 block" htmlFor="theme">
            Theme / Topic
          </label>
          <input
            id="theme"
            type="text"
            required
            value={theme}
            onChange={(e) => setTheme(e.target.value)}
            className="w-full h-12 bg-zinc-950 border border-zinc-800 rounded-lg px-4 text-sm text-zinc-300 focus:outline-none focus:border-indigo-500 transition-colors placeholder:text-zinc-600"
            placeholder="e.g. Bravery and Friendship"
          />
        </div>
        
        <div>
          <label className="text-[11px] uppercase tracking-[0.2em] text-zinc-500 font-bold mb-2 block" htmlFor="artStyle">
            Art Style
          </label>
          <input
            id="artStyle"
            type="text"
            required
            value={artStyle}
            onChange={(e) => setArtStyle(e.target.value)}
            className="w-full h-12 bg-zinc-950 border border-zinc-800 rounded-lg px-4 text-sm text-zinc-300 focus:outline-none focus:border-indigo-500 transition-colors placeholder:text-zinc-600"
            placeholder="e.g. Cinematic Oil, Neo-Victorian"
          />
        </div>

        <div>
          <label className="text-[11px] uppercase tracking-[0.2em] text-zinc-500 font-bold mb-2 block" htmlFor="numPages">
            Length
          </label>
          <div className="flex items-center gap-4 bg-zinc-950 border border-zinc-800 rounded-lg px-4 h-12 w-full text-zinc-300">
             <input
                id="numPages"
                type="range"
                min="3"
                max="10"
                value={numPages}
                onChange={(e) => setNumPages(parseInt(e.target.value))}
                className="flex-1 accent-indigo-500"
              />
              <span className="text-sm font-medium w-16 text-right">{numPages} Pages</span>
          </div>
        </div>

        <div className="pt-4">
          <button
            type="submit"
            disabled={isGenerating}
            className="w-full h-12 bg-indigo-600 hover:bg-indigo-500 rounded-xl font-semibold text-sm transition-all shadow-lg shadow-indigo-600/10 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed text-white"
          >
            {isGenerating ? (
              <span className="flex items-center gap-2">
                <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, ease: "linear", duration: 2 }}>
                  <Sparkles size={16} />
                </motion.div>
                Synthesizing Tale...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <span>Generate Story</span>
                <Sparkles size={16} />
              </span>
            )}
          </button>
        </div>
      </form>
    </motion.div>
  );
}
