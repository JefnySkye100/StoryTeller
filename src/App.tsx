import React, { useState, useEffect, useRef } from 'react';
import { StorySetup } from './components/StorySetup';
import { StoryReader } from './components/StoryReader';
import { Story, generateStoryText, generateStoryImage, generateSpeech, playBase64PCM } from './lib/gemini';
import { BookOpen, Sparkles, Mic, Download, Layers, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

type AppState = 'setup' | 'reading';

export default function App() {
  const [appState, setAppState] = useState<AppState>('setup');
  const [story, setStory] = useState<Story | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);
  const stopAudioRef = useRef<(() => void) | null>(null);
  const [error, setError] = useState<string | null>(null);
  const storyContainerRef = useRef<HTMLDivElement>(null);

  const handleGenerateText = async (data: { characterName: string; theme: string; setting: string; artStyle: string; numPages: number }) => {
    setIsGenerating(true);
    setError(null);
    try {
      const generatedStory = await generateStoryText(data.characterName, data.theme, data.setting, data.artStyle, data.numPages);
      // Mark all pages as not having an image initially
      const storyWithImageState = {
        ...generatedStory,
        pages: generatedStory.pages.map(p => ({ ...p, imageUrl: undefined, isGeneratingImage: false }))
      };
      setStory(storyWithImageState);
      setCurrentPage(0);
      setAppState('reading');
    } catch (err) {
      console.error(err);
      setError("Failed to weave the story. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleUpdateText = (pageIndex: number, newText: string) => {
    if (!story) return;
    const newPages = [...story.pages];
    newPages[pageIndex] = { ...newPages[pageIndex], text: newText };
    setStory({ ...story, pages: newPages });
  };

  const handleRegenerateImage = async (pageIndex: number) => {
    if (!story) return;
    
    // Set isGeneratingImage to true
    setStory(prev => {
      if (!prev) return prev;
      const newPages = [...prev.pages];
      newPages[pageIndex] = { ...newPages[pageIndex], isGeneratingImage: true };
      return { ...prev, pages: newPages };
    });

    try {
      const imageUrl = await generateStoryImage(story.pages[pageIndex].imagePrompt);
      setStory(prev => {
        if (!prev) return prev;
        const newPages = [...prev.pages];
        newPages[pageIndex] = { ...newPages[pageIndex], imageUrl, isGeneratingImage: false };
        return { ...prev, pages: newPages };
      });
    } catch (err) {
      console.error("Failed to generate image", err);
      // Revert generating state
      setStory(prev => {
        if (!prev) return prev;
        const newPages = [...prev.pages];
        newPages[pageIndex] = { ...newPages[pageIndex], isGeneratingImage: false };
        return { ...prev, pages: newPages };
      });
    }
  };

  // Sequentially generate images for pages that don't have them
  useEffect(() => {
    if (appState !== 'reading' || !story) return;

    const generateNextMissingImage = async () => {
      const missingIndex = story.pages.findIndex(p => !p.imageUrl && !p.isGeneratingImage);
      if (missingIndex !== -1) {
        await handleRegenerateImage(missingIndex);
      }
    };
    
    // We run it if there's any missing image that is not currently being generated.
    // The effect will re-trigger when `story` updates, processing the next one.
    const missingIndex = story.pages.findIndex(p => !p.imageUrl && !p.isGeneratingImage);
    if (missingIndex !== -1) {
      generateNextMissingImage();
    }
  }, [story, appState]);

  const handleVoiceOver = async () => {
    if (!story) return;
    
    if (isPlayingAudio) {
      if (stopAudioRef.current) stopAudioRef.current();
      setIsPlayingAudio(false);
      return;
    }

    try {
      setIsGeneratingAudio(true);
      setError(null);
      const text = story.pages[currentPage].text;
      const audioBase64 = await generateSpeech(text);
      const stop = playBase64PCM(audioBase64);
      stopAudioRef.current = () => {
        stop();
        setIsPlayingAudio(false);
      };
      setIsPlayingAudio(true);
    } catch (err) {
      console.error(err);
      setError("Failed to generate voice over. Please try again.");
    } finally {
      setIsGeneratingAudio(false);
    }
  };

  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownload = async () => {
    if (!story) return;
    setIsDownloading(true);
    try {
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'px',
        format: [800, 500]
      });

      for (let i = 0; i < story.pages.length; i++) {
        const pageEl = document.getElementById(`pdf-page-${i}`);
        if (!pageEl) continue;
        const canvas = await html2canvas(pageEl, { scale: 2, useCORS: true });
        const imgData = canvas.toDataURL('image/png');
        if (i > 0) pdf.addPage([800, 500], 'landscape');
        pdf.addImage(imgData, 'PNG', 0, 0, 800, 500);
      }
      
      pdf.save(`${story.title.replace(/\s+/g, '_')}.pdf`);
    } catch (err) {
      console.error("Failed to generate PDF", err);
      setError("Failed to download PDF.");
    } finally {
      setIsDownloading(false);
    }
  };

  // Stop audio on page change
  useEffect(() => {
    if (stopAudioRef.current) {
      stopAudioRef.current();
      setIsPlayingAudio(false);
      stopAudioRef.current = null;
    }
  }, [currentPage]);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 p-6 md:p-12 font-sans selection:bg-indigo-500/30 selection:text-indigo-200">
      {/* Header */}
      <header className="max-w-6xl mx-auto flex items-center justify-between mb-12">
        <div className="flex items-center gap-3 text-zinc-100 select-none">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <BookOpen size={18} strokeWidth={2} className="text-white" />
          </div>
          <span className="font-semibold text-xl tracking-tight uppercase">StoryWeaver <span className="text-zinc-500 font-light underline underline-offset-4 decoration-indigo-500">AI</span></span>
        </div>
        
        {appState === 'reading' && story && (
          <div className="flex items-center gap-6">
            <div className="text-sm font-medium uppercase tracking-wider text-zinc-500 flex items-center gap-2">
              <Layers size={16} /> 
              <span className="hidden md:inline">Page</span>
              <input 
                type="number" 
                min={1} 
                max={story.pages.length} 
                value={currentPage + 1}
                onChange={(e) => {
                  const p = parseInt(e.target.value);
                  if (!isNaN(p) && p >= 1 && p <= story.pages.length) {
                    setCurrentPage(p - 1);
                  }
                }}
                className="w-12 bg-zinc-900 border border-zinc-700 text-center rounded text-zinc-300 h-7 focus:outline-none focus:border-indigo-500 appearance-none"
              /> 
              <span className="opacity-50">/ {story.pages.length}</span>
            </div>
            <button 
               onClick={handleVoiceOver}
               disabled={isGeneratingAudio}
               className={`text-sm font-medium uppercase tracking-wider transition-colors flex items-center gap-2 ${isPlayingAudio ? 'text-indigo-400 hover:text-indigo-300' : 'text-zinc-500 hover:text-zinc-300'}`}>
              {isGeneratingAudio ? <Loader2 size={16} className="animate-spin" /> : <Mic size={16} />} 
              {isPlayingAudio ? 'Stop Voice' : 'Voice Over'}
            </button>
            <button 
              onClick={handleDownload} 
              disabled={isDownloading}
              className="text-sm font-medium uppercase tracking-wider text-zinc-500 hover:text-zinc-300 disabled:opacity-50 transition-colors flex items-center gap-2">
              {isDownloading ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />} 
              {isDownloading ? 'Exporting...' : 'Download PDF'}
            </button>
            <button 
              onClick={() => {
                if (stopAudioRef.current) stopAudioRef.current();
                setAppState('setup');
              }}
              className="text-sm font-medium uppercase tracking-wider text-indigo-400 hover:text-indigo-300 transition-colors flex items-center gap-2"
            >
              <Sparkles size={16} /> New Story
            </button>
          </div>
        )}
      </header>

      <main className="max-w-6xl mx-auto relative">
        {/* Hidden PDF container */}
        {appState === 'reading' && story && (
          <div id="pdf-rendering-container" style={{ position: 'fixed', top: '-10000px', left: '-10000px', width: '800px' }}>
            {story.pages.map((page, idx) => (
              <div key={idx} id={`pdf-page-${idx}`} className="flex flex-row w-[800px] h-[500px] bg-zinc-900 border border-zinc-700 font-serif">
                <div className="w-[400px] h-[500px] bg-zinc-800 relative flex items-center justify-center">
                   {page.imageUrl ? (
                     <img src={page.imageUrl} alt="Story illustration" className="w-[400px] h-[500px] object-cover" crossOrigin="anonymous" />
                   ) : (
                     <div className="text-zinc-600 italic text-sm">Image pending...</div>
                   )}
                </div>
                <div className="w-[400px] h-[500px] bg-zinc-50 p-10 flex flex-col relative z-0 text-zinc-900">
                  <p className="font-serif text-[18px] leading-relaxed text-zinc-800 whitespace-pre-wrap">{page.text}</p>
                  <div className="mt-auto flex justify-center">
                    <span className="font-serif text-[14px] text-zinc-400 italic">Page {idx + 1}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <AnimatePresence mode="wait">
          {error && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }} 
              animate={{ opacity: 1, height: 'auto' }} 
              exit={{ opacity: 0, height: 0 }}
              className="bg-red-900/30 text-red-400 p-4 rounded-xl mb-6 text-center border border-red-900/50"
            >
              {error}
            </motion.div>
          )}

          {appState === 'setup' && (
            <motion.div key="setup" exit={{ opacity: 0, scale: 0.95 }} transition={{ duration: 0.3 }}>
              <StorySetup onGenerate={handleGenerateText} isGenerating={isGenerating} />
            </motion.div>
          )}

          {appState === 'reading' && story && (
            <motion.div key="reader" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5, delay: 0.2 }} className="flex flex-col items-center">
              <h2 className="font-serif text-3xl mb-8 leading-tight italic text-zinc-100">{story.title}</h2>
              <div ref={storyContainerRef} className="w-full">
                <StoryReader 
                  story={story} 
                  currentPage={currentPage}
                  onPageChange={setCurrentPage}
                  onUpdateText={handleUpdateText} 
                  onRegenerateImage={handleRegenerateImage} 
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
