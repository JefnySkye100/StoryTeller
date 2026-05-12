import { GoogleGenAI, Type, Modality } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export interface StoryPage {
  text: string;
  imagePrompt: string;
  imageUrl?: string;
  isGeneratingImage?: boolean;
}

export interface Story {
  title: string;
  pages: StoryPage[];
}

export const generateStoryText = async (
  characterName: string,
  theme: string,
  setting: string,
  artStyle: string,
  numPages: number = 5
): Promise<Story> => {
  const prompt = `Write a children's story about ${characterName}. 
The theme is "${theme}" and it takes place in "${setting}".
CRITICAL INSTRUCTION: You MUST generate EXACTLY ${numPages} pages. The story must be paced to comfortably span ${numPages} pages. Do not output more or fewer pages than ${numPages}.

Return the story as a JSON with a "title", and a "pages" array containing EXACTLY ${numPages} items.
For each page, provide the narrative "text", and a detailed "imagePrompt".
The "imagePrompt" should reflect the events of that specific page and be styled as: "${artStyle}, high quality, beautiful children's book illustration".`;

  const response = await ai.models.generateContent({
    model: 'gemini-3.1-pro-preview',
    contents: prompt,
    config: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          title: {
            type: Type.STRING,
            description: 'The title of the story',
          },
          pages: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                text: {
                  type: Type.STRING,
                  description: 'The narrative text for this page of the story.',
                },
                imagePrompt: {
                  type: Type.STRING,
                  description: 'A detailed image generation prompt for the illustration of this page.',
                },
              },
              required: ['text', 'imagePrompt'],
            },
          },
        },
        required: ['title', 'pages'],
      },
    },
  });

  const jsonStr = response.text?.trim() || '{}';
  return JSON.parse(jsonStr) as Story;
};

export const generateStoryImage = async (imagePrompt: string): Promise<string> => {
  const response = await ai.models.generateContent({
    model: 'gemini-3.1-flash-image-preview',
    contents: {
      parts: [
        {
          text: imagePrompt,
        },
      ],
    },
    config: {
      imageConfig: {
        aspectRatio: '1:1',
        imageSize: '1K',
      },
    },
  });

  if (response.candidates && response.candidates[0]?.content?.parts) {
    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) {
        return `data:image/jpeg;base64,${part.inlineData.data}`;
      }
    }
  }
  
  throw new Error('Image generation failed: no inlineData found');
};

export const generateSpeech = async (text: string): Promise<string> => {
  const response = await ai.models.generateContent({
    model: "gemini-3.1-flash-tts-preview",
    contents: [{ parts: [{ text }] }],
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Aoede' },
          },
      },
    },
  });

  const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  if (!base64Audio) {
    throw new Error('Speech generation failed');
  }
  return base64Audio;
};

let currentAudioSource: AudioBufferSourceNode | null = null;
let currentAudioContext: AudioContext | null = null;

export const playBase64PCM = (base64Audio: string): () => void => {
  if (currentAudioSource) {
    currentAudioSource.stop();
  }

  const binaryString = atob(base64Audio);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  const buffer = bytes.buffer;

  if (!currentAudioContext) {
    currentAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
  }

  const audioBuffer = currentAudioContext.createBuffer(1, buffer.byteLength / 2, 24000);
  
  const channelData = audioBuffer.getChannelData(0);
  const dataView = new DataView(buffer);
  
  for (let i = 0; i < channelData.length; i++) {
    channelData[i] = dataView.getInt16(i * 2, true) / 32768.0;
  }
  
  currentAudioSource = currentAudioContext.createBufferSource();
  currentAudioSource.buffer = audioBuffer;
  currentAudioSource.connect(currentAudioContext.destination);
  currentAudioSource.start();

  return () => {
    if (currentAudioSource) {
      currentAudioSource.stop();
      currentAudioSource = null;
    }
  };
};

