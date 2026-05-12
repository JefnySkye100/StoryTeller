import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, ChevronRight, Edit2, Check, Image as ImageIcon, Loader2 } from 'lucide-react';
import { Story } from '../lib/gemini';

interface StoryReaderProps {
  story: Story;
  currentPage: number;
  onPageChange: (pageIndex: number) => void;
  onUpdateText: (pageIndex: number, newText: string) => void;
  onRegenerateImage: (pageIndex: number) => void;
}

export function StoryReader({ story, currentPage, onPageChange, onUpdateText, onRegenerateImage }: StoryReaderProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState('');

  const page = story.pages[currentPage];

  useEffect(() => {
    setIsEditing(false);
  }, [currentPage]);

  const handleNext = () => {
    if (currentPage < story.pages.length - 1) onPageChange(currentPage + 1);
  };

  const handlePrev = () => {
    if (currentPage > 0) onPageChange(currentPage - 1);
  };

  const startEditing = () => {
    setEditText(page.text);
    setIsEditing(true);
  };

  const saveEdit = () => {
    onUpdateText(currentPage, editText);
    setIsEditing(false);
  };

  return (
    <div className="max-w-5xl mx-auto flex flex-col pt-4">
      {/* Book Container */}
      <div className="flex flex-col md:flex-row items-center justify-center w-full max-w-4xl mx-auto">
        
        {/* Left Side: Image */}
        <div 
          onClick={(e) => {
            if ((e.target as HTMLElement).closest('button')) return;
            if (currentPage > 0) handlePrev();
          }}
          className={`w-full md:w-[400px] aspect-[4/5] bg-zinc-800 md:rounded-l-2xl shadow-[0_25px_50px_-12px_rgba(0,0,0,1)] overflow-hidden border border-zinc-700 md:border-r-0 relative flex items-center justify-center z-10 group ${currentPage > 0 ? 'cursor-pointer' : ''}`}
        >
          {page.imageUrl ? (
            <motion.img 
              key={`img-${currentPage}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
              src={page.imageUrl} 
              alt="Story illustration" 
              className="w-full h-full object-cover relative z-0"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center p-12">
              <div className="w-full h-full border border-zinc-700/50 rounded flex items-center justify-center bg-zinc-900/50">
                <div className="text-zinc-600 flex flex-col items-center">
                 {page.isGeneratingImage ? (
                    <>
                      <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, ease: 'linear', duration: 1 }}>
                        <Loader2 size={32} className="mb-4 opacity-40" />
                      </motion.div>
                      <span className="text-[11px] uppercase tracking-widest opacity-40 italic">Rendering Visualization...</span>
                    </>
                 ) : (
                    <>
                      <ImageIcon size={32} className="mb-4 opacity-20" />
                      <button 
                        onClick={() => onRegenerateImage(currentPage)}
                        className="px-4 py-2 border border-zinc-700 rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-zinc-800 transition-colors text-zinc-400"
                      >
                        Generate Image
                      </button>
                    </>
                 )}
                </div>
              </div>
            </div>
          )}
          
          <button 
            onClick={() => onRegenerateImage(currentPage)} 
            className="absolute top-4 left-4 z-30 bg-zinc-900/80 backdrop-blur-sm p-2 rounded-lg border border-zinc-700 shadow-sm opacity-0 group-hover:opacity-100 focus:opacity-100 hover:bg-zinc-800 transition-opacity text-zinc-300"
            title="Regenerate Image"
            disabled={page.isGeneratingImage}
          >
            {page.isGeneratingImage ? <Loader2 size={16} className="animate-spin" /> : <ImageIcon size={16} />}
          </button>
        </div>

        {/* Right Side: Text */}
        <div 
          onClick={(e) => {
            if ((e.target as HTMLElement).closest('button') || (e.target as HTMLElement).tagName === 'TEXTAREA') return;
            if (currentPage < story.pages.length - 1 && !isEditing) handleNext();
          }}
          className={`w-full md:w-[400px] aspect-[4/5] bg-zinc-50 text-zinc-900 md:rounded-r-2xl shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)] p-10 md:p-12 flex flex-col relative z-0 ${currentPage < story.pages.length - 1 && !isEditing ? 'cursor-pointer' : ''}`}
        >
          <AnimatePresence mode="wait">
            {isEditing ? (
              <motion.div 
                key="edit"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="w-full flex-1 flex flex-col"
              >
                  <textarea
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  className="w-full flex-1 p-0 bg-transparent border-0 focus:outline-none focus:ring-0 font-serif text-lg leading-relaxed text-zinc-700 resize-none selection:bg-indigo-200"
                />
                <div className="flex justify-end gap-2 mt-4 shrink-0">
                  <button onClick={() => setIsEditing(false)} className="px-4 py-2 text-xs font-bold uppercase tracking-widest text-zinc-500 hover:text-zinc-900 transition-colors">
                    Cancel
                  </button>
                  <button onClick={saveEdit} className="px-4 py-2 text-xs font-bold uppercase tracking-widest bg-indigo-600 text-white rounded-lg flex items-center gap-2 hover:bg-indigo-500 transition-colors">
                    <Check size={14} /> Save
                  </button>
                </div>
              </motion.div>
            ) : (
               <motion.div
                  key={`text-${currentPage}`}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.4 }}
                  className="w-full flex-1 flex flex-col group relative"
               >
                 <button 
                    onClick={startEditing}
                    className="absolute -top-4 -right-4 p-2 text-zinc-400 hover:text-indigo-600 rounded-lg opacity-0 group-hover:opacity-100 transition-all z-10"
                    title="Edit text"
                  >
                    <Edit2 size={16} />
                  </button>
                 <p className="font-serif text-lg leading-relaxed text-zinc-700 whitespace-pre-wrap flex-1">
                    {page.text}
                 </p>
               </motion.div>
            )}
          </AnimatePresence>

          {/* Page Indicator */}
          <div className="mt-8 flex justify-center shrink-0">
            <span className="font-serif text-sm text-zinc-400 italic">
              Page {currentPage + 1}
            </span>
          </div>
        </div>
      </div>

      {/* Navigation Controls */}
      <div className="h-20 flex items-center justify-between px-10 md:px-20 mt-8 w-full max-w-4xl mx-auto">
        <button
          onClick={handlePrev}
          disabled={currentPage === 0}
          className="flex items-center gap-2 text-zinc-500 hover:text-zinc-300 disabled:opacity-30 disabled:hover:text-zinc-500 transition-colors group"
        >
          <div className="w-8 h-8 rounded-full border border-zinc-800 flex items-center justify-center group-hover:border-zinc-600 transition-colors">
            <ChevronLeft size={16} />
          </div>
          <span className="text-xs uppercase tracking-widest font-bold hidden md:inline">Previous Chapter</span>
        </button>
        
        <div className="flex gap-2 items-center">
          {story.pages.map((_, i) => (
             <button 
               key={i} 
               onClick={() => onPageChange(i)}
               className={`w-2 h-2 rounded-full transition-all ${
                 i === currentPage ? 'bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.5)]' : 'bg-zinc-800 cursor-pointer hover:bg-zinc-600'
               }`} 
             />
          ))}
        </div>
        
        <button
          onClick={handleNext}
          disabled={currentPage === story.pages.length - 1}
          className="flex items-center gap-2 text-zinc-500 hover:text-zinc-300 disabled:opacity-30 disabled:hover:text-zinc-500 transition-colors group"
        >
          <span className="text-xs uppercase tracking-widest font-bold hidden md:inline">Next Chapter</span>
          <div className="w-8 h-8 rounded-full border border-zinc-800 flex items-center justify-center group-hover:border-zinc-600 transition-colors">
            <ChevronRight size={16} />
          </div>
        </button>
      </div>
    </div>
  );
}
