import { useState, useRef, useCallback, Dispatch, SetStateAction } from 'react';
// Fix: 'LiveSession' is not an exported member of '@google/genai'.
// It is inferred from the return type of `ai.live.connect` instead.
import { GoogleGenAI, LiveServerMessage, Modality, type Blob } from '@google/genai';
// Fix: Removed unused 'encode' import.
import { decode, decodeAudioData, createBlob } from '../utils/audio';
import { ConversationStatus, type TranscriptionEntry } from '../types';

// Fix: Define the LiveSession type by inferring it from the return type of `ai.live.connect`.
// This provides strong typing without needing the type to be explicitly exported from the library.
type LiveSession = Awaited<ReturnType<InstanceType<typeof GoogleGenAI>['live']['connect']>>;

const useGeminiLive = (setTranscriptionHistory: Dispatch<SetStateAction<TranscriptionEntry[]>>) => {
  const [status, setStatus] = useState<ConversationStatus>(ConversationStatus.IDLE);
  const [error, setError] = useState<string | null>(null);
  const [currentTranscription, setCurrentTranscription] = useState({ user: '', model: '' });

  const sessionPromiseRef = useRef<Promise<LiveSession> | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const outputAudioContextRef = useRef<AudioContext | null>(null);
  const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
  const mediaStreamSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const playingAudioSourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const speechEndTimerRef = useRef<number | null>(null);
  
  const currentInputTranscriptionRef = useRef('');
  const currentOutputTranscriptionRef = useRef('');

  const clearSpeechEndTimer = useCallback(() => {
    if (speechEndTimerRef.current) {
      clearTimeout(speechEndTimerRef.current);
      speechEndTimerRef.current = null;
    }
  }, []);

  const cleanup = useCallback(() => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }
    if (scriptProcessorRef.current) {
      scriptProcessorRef.current.disconnect();
      scriptProcessorRef.current = null;
    }
    if (mediaStreamSourceRef.current) {
      mediaStreamSourceRef.current.disconnect();
      mediaStreamSourceRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
     if (outputAudioContextRef.current && outputAudioContextRef.current.state !== 'closed') {
      outputAudioContextRef.current.close();
      outputAudioContextRef.current = null;
    }
    playingAudioSourcesRef.current.forEach(source => source.stop());
    playingAudioSourcesRef.current.clear();
    nextStartTimeRef.current = 0;
    sessionPromiseRef.current = null;
    clearSpeechEndTimer();
    // Don't reset status here if it's an error, let the UI show the error state.
    if (status !== ConversationStatus.ERROR) {
      setStatus(ConversationStatus.IDLE);
    }
    setCurrentTranscription({ user: '', model: '' });
    currentInputTranscriptionRef.current = '';
    currentOutputTranscriptionRef.current = '';
  }, [status, clearSpeechEndTimer]);

  const closeSession = useCallback(async () => {
    if (sessionPromiseRef.current) {
      try {
        const session = await sessionPromiseRef.current;
        session.close();
      } catch (e) {
        console.error("Error closing session:", e);
      }
    }
    setStatus(ConversationStatus.IDLE);
    setError(null);
    cleanup();
  }, [cleanup]);

  const startSession = useCallback(async (userName: string, isQuizMode: boolean) => {
    if (!navigator.onLine) {
      setError("तुम्ही ऑफलाइन आहात. कृपया तुमचे इंटरनेट कनेक्शन तपासा.");
      setStatus(ConversationStatus.ERROR);
      return;
    }
    
    setStatus(ConversationStatus.CONNECTING);
    setError(null);
    setCurrentTranscription({ user: '', model: '' });

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;

      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      // Fix: Add type assertion to handle webkitAudioContext for broader browser compatibility.
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      // Fix: Add type assertion to handle webkitAudioContext for broader browser compatibility.
      outputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      
      const offTopicInstruction = 'जर कोणी विद्यार्थी व्याकरण किंवा शिक्षणाव्यतिरीक्त इतर कोणताही विषय काढेल, तर त्यांना नम्रपणे सांगा: "मी आपला व्याकरण सहाय्यक आहे. मला तुमचे शिक्षक अनिल माने यांनी तयार केले आहे. कृपया इतर विषयावर आपण प्रश्न विचारू नका. शिक्षण व मराठी व्याकरण यावर मी आपणास नक्की मदत करेन!"';
      
      const genderAndAddressInstruction = `तुमच्याशी बोलणाऱ्या विद्यार्थ्याचे नाव '${userName}' आहे. या नावावरून त्याचे लिंग (पुरुष/स्त्री) ओळखा आणि त्यानुसार संभाषण करा. विद्यार्थ्याला नेहमी 'तू' या एकेरी संबोधनाने बोला, जेणेकरून त्याला आपलेपणा वाटेल. उदा. 'अरे ${userName}, तू कसा आहेस?' किंवा 'व्वा ${userName}, तू खूप हुशार आहेस!'. जर उत्तर चुकले, तर लिंगानुसार 'अरेरे, तू थोडा चुकलास' किंवा 'अगं, तू थोडी चुकलीस' असे म्हणा. तुमची भाषा अत्यंत सोपी, प्रेमळ आणि उत्साहवर्धक असावी. सर्व संवाद फक्त मराठीतच हवा.`;

      const conversationSystemInstruction = `तुम्ही यशवंतराव चव्हाण विद्यालयाचे मराठी व्याकरण सहाय्यक आहात. ${genderAndAddressInstruction} तुमचे पहिले काम संभाषण सुरू करणे आहे. संभाषण सुरू झाल्यावर, तुझे पहिले वाक्य असेल: 'स्वागत आहे ${userName}! मी आहे आपला मराठी व्याकरण सहाय्यक. मला आपले शिक्षक श्री. अनिल माने यांनी तयार केले आहे. विचारा आपला प्रश्न!'. यानंतर विद्यार्थ्याच्या प्रश्नांची वाट पाहा. ${offTopicInstruction}`;
      
      const quizSystemInstruction = `तुम्ही यशवंतराव चव्हाण विद्यालयाचे एक विद्यार्थीप्रिय मराठी व्याकरण शिक्षक आहात. तुम्ही विद्यार्थ्यांची एक प्रश्नमंजुषा (quiz) घेत आहात. ${genderAndAddressInstruction} तुझे पहिले काम प्रश्नमंजुषा सुरू करणे आहे. सुरू झाल्यावर, तुझे पहिले वाक्य असेल: 'स्वागत आहे ${userName}! मी आहे आपला मराठी व्याकरण सहाय्यक. मला आपले शिक्षक श्री. अनिल माने यांनी तयार केले आहे. प्रश्नमंजुषेसाठी तयार आहात का?'. यानंतर विद्यार्थ्याच्या उत्तराची वाट पाहा. एका वेळी फक्त एकच प्रश्न विचारा. ${offTopicInstruction}`;

      const systemInstruction = isQuizMode ? quizSystemInstruction : conversationSystemInstruction;

      sessionPromiseRef.current = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        config: {
          responseModalities: [Modality.AUDIO],
          inputAudioTranscription: {},
          outputAudioTranscription: {},
          systemInstruction: systemInstruction,
        },
        callbacks: {
          onopen: () => {
            setStatus(ConversationStatus.LISTENING);
            if (!audioContextRef.current) return;
            mediaStreamSourceRef.current = audioContextRef.current.createMediaStreamSource(stream);
            scriptProcessorRef.current = audioContextRef.current.createScriptProcessor(4096, 1, 1);
            
            scriptProcessorRef.current.onaudioprocess = (audioProcessingEvent) => {
              const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
              // Fix: Update createBlob call to match the simplified function signature and remove conditional check to align with Gemini API guidelines.
              const pcmBlob: Blob = createBlob(inputData);
              sessionPromiseRef.current?.then((session) => {
                session.sendRealtimeInput({ media: pcmBlob });
              });
            };
            mediaStreamSourceRef.current.connect(scriptProcessorRef.current);
            scriptProcessorRef.current.connect(audioContextRef.current.destination);

            // This silent message triggers the AI's initial greeting.
            // The user doesn't see this, but it makes the AI speak first.
            sessionPromiseRef.current?.then((session) => {
                session.sendRealtimeInput({ text: 'Start' });
            });
          },
          onmessage: async (message: LiveServerMessage) => {
             if (message.serverContent?.inputTranscription) {
                clearSpeechEndTimer();
                speechEndTimerRef.current = window.setTimeout(() => {
                  if (currentInputTranscriptionRef.current.trim().length > 0) {
                    setStatus(ConversationStatus.THINKING);
                  }
                }, 1200); // 1.2s of silence indicates end of speech.

                const text = message.serverContent.inputTranscription.text;
                currentInputTranscriptionRef.current += text;
                setCurrentTranscription(prev => ({ ...prev, user: currentInputTranscriptionRef.current }));
             }

             if (message.serverContent?.outputTranscription) {
                clearSpeechEndTimer();
                const text = message.serverContent.outputTranscription.text;
                currentOutputTranscriptionRef.current += text;
                setCurrentTranscription(prev => ({...prev, model: currentOutputTranscriptionRef.current }));
                setStatus(ConversationStatus.SPEAKING);
             }
             
             if (message.serverContent?.turnComplete) {
                clearSpeechEndTimer();
                const fullInput = currentInputTranscriptionRef.current;
                const fullOutput = currentOutputTranscriptionRef.current;
                // Don't add the initial "Start" trigger to history
                if(fullInput.trim() && fullInput.trim().toLowerCase() !== 'start') {
                    setTranscriptionHistory(prev => [...prev, {speaker: 'user', text: fullInput}]);
                }
                if(fullOutput.trim()){
                    setTranscriptionHistory(prev => [...prev, {speaker: 'model', text: fullOutput}]);
                }
                currentInputTranscriptionRef.current = '';
                currentOutputTranscriptionRef.current = '';
                setCurrentTranscription({ user: '', model: '' });
                setStatus(ConversationStatus.LISTENING);
             }

            // Fix: Add handling for 'interrupted' messages to stop audio playback immediately as per Gemini API guidelines.
            const interrupted = message.serverContent?.interrupted;
            if (interrupted) {
              clearSpeechEndTimer();
              for (const source of playingAudioSourcesRef.current) {
                source.stop();
                playingAudioSourcesRef.current.delete(source);
              }
              nextStartTimeRef.current = 0;
            }

            const audioData = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
            if (audioData && outputAudioContextRef.current) {
                const audioBuffer = await decodeAudioData(decode(audioData), outputAudioContextRef.current, 24000, 1);
                const source = outputAudioContextRef.current.createBufferSource();
                source.buffer = audioBuffer;
                source.connect(outputAudioContextRef.current.destination);
                
                const currentTime = outputAudioContextRef.current.currentTime;
                nextStartTimeRef.current = Math.max(nextStartTimeRef.current, currentTime);

                source.start(nextStartTimeRef.current);
                nextStartTimeRef.current += audioBuffer.duration;
                playingAudioSourcesRef.current.add(source);
                source.onended = () => {
                    playingAudioSourcesRef.current.delete(source);
                };
            }
          },
          onclose: () => {
            setStatus(ConversationStatus.IDLE);
            cleanup();
          },
          onerror: (e: ErrorEvent) => {
            console.error("Session error:", e);
            if (!navigator.onLine) {
                setError("तुम्ही ऑफलाइन आहात. कृपया तुमचे इंटरनेट कनेक्शन तपासा.");
            } else {
                let userMessage = "कनेक्शनमध्ये अडचण येत आहे. कृपया तुमचे इंटरनेट व्यवस्थित चालू आहे का ते तपासा आणि थोड्या वेळाने पुन्हा प्रयत्न करा.";
                if (e.message) {
                    const message = e.message.toLowerCase();
                    if (message.includes('network error')) {
                         userMessage = "नेटवर्कमध्ये समस्या आहे. कृपया तुमचे इंटरनेट कनेक्शन, फायरवॉल किंवा प्रॉक्सी सेटिंग तपासा. API की चुकीची असल्यासही ही समस्या येऊ शकते.";
                    } else if (message.includes('service is currently unavailable')) {
                        userMessage = "सेवा तात्पुरती अनुपलब्ध आहे. कृपया थोड्या वेळाने पुन्हा प्रयत्न करा.";
                    } else if (message.includes('invalid argument')) {
                        userMessage = "चुकीची विनंती पाठवली गेली. कृपया पुन्हा प्रयत्न करा.";
                    } else if (message.includes('api key not valid')) {
                        userMessage = "तुमची API की चुकीची आहे. कृपया योग्य की वापरून पुन्हा प्रयत्न करा.";
                    }
                }
                setError(userMessage);
            }
            setStatus(ConversationStatus.ERROR);
            cleanup();
          },
        },
      });
    } catch (error) {
      console.error("Failed to start session:", error);
      let errorMessage = "संभाषण सुरू करता आले नाही.";
      if (error instanceof Error) {
        if (error.name === 'NotAllowedError') {
          errorMessage = "मायक्रोफोन वापरण्याची परवानगी आवश्यक आहे.";
        } else if (error.message.toLowerCase().includes('api key not valid')) {
          errorMessage = "तुमची API की चुकीची आहे. कृपया योग्य की वापरून पुन्हा प्रयत्न करा.";
        }
      }
      setError(errorMessage);
      setStatus(ConversationStatus.ERROR);
      cleanup();
    }
  }, [cleanup, setTranscriptionHistory, clearSpeechEndTimer]);

  return { status, error, startSession, closeSession, currentTranscription };
};

export default useGeminiLive;
