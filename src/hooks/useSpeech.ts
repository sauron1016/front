/**
 * Web Speech API hook (Chrome/Edge) - Arabic speech-to-text for AI edit prompts
 */

import { useCallback, useEffect, useRef, useState } from 'react';

/* eslint-disable @typescript-eslint/no-explicit-any */
export function useSpeech(lang = 'ar-TN') {
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const recRef = useRef<any>(null);
  const finalRef = useRef('');
  const onFinalRef = useRef<((text: string) => void) | null>(null);

  const supported =
    typeof window !== 'undefined' &&
    !!((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);

  const start = useCallback(
    (onFinal?: (text: string) => void) => {
      if (!supported || listening) return;
      onFinalRef.current = onFinal ?? null;
      const Ctor = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const rec: any = new Ctor();
      rec.lang = lang;
      rec.interimResults = true;
      rec.continuous = true;

      finalRef.current = '';
      setTranscript('');

      rec.onresult = (e: any) => {
        let interim = '';
        for (let i = e.resultIndex; i < e.results.length; i++) {
          const r = e.results[i];
          if (r.isFinal) {
            finalRef.current += r[0].transcript + ' ';
          } else {
            interim += r[0].transcript;
          }
        }
        setTranscript((finalRef.current + interim).trim());
      };
      rec.onerror = () => setListening(false);
      rec.onend = () => {
        setListening(false);
        const text = finalRef.current.trim();
        if (text && onFinalRef.current) onFinalRef.current(text);
      };

      recRef.current = rec;
      try {
        rec.start();
        setListening(true);
      } catch {
        setListening(false);
      }
    },
    [lang, listening, supported]
  );

  const stop = useCallback(() => {
    try {
      recRef.current?.stop?.();
    } catch { /* noop */ }
    setListening(false);
  }, []);

  useEffect(() => () => { try { recRef.current?.stop?.(); } catch { /* noop */ } }, []);

  return { supported, listening, transcript, start, stop };
}
