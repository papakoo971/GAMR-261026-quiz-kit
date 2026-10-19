import React, { useState, useEffect, useRef, useCallback } from 'react';

/**
 * ------------------------------------------------------------------
 * CONFIG: API 및 게임 설정
 * ------------------------------------------------------------------
 */
import { GOOGLE_SCRIPT_URL } from "../config.js";
const GAME_TYPE = 'S'; 

// 유틸리티: 배열 섞기
const shuffleArray = (array) => {
  const newArr = [...array];
  for (let i = newArr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
  }
  return newArr;
};

// 데이터 정제 헬퍼 함수
const processRawData = (rawData) => {
  return shuffleArray(rawData).slice(0, 10).map(item => ({
      q: item.q,
      a: item.correctAnswer,
      options: item.options || []
  }));
};

// --- Audio Synthesizer (SFX & FULL BGM) ---
const audioCtx = typeof window !== 'undefined' ? new (window.AudioContext || window.webkitAudioContext)() : null;

const NOTES = {
  G3: 196.00, C4: 261.63, E4: 329.63, F4: 349.23, G4: 392.00, Gs4: 415.30, A4: 440.00, As4: 466.16, B4: 493.88,
  C5: 523.25, Cs5: 554.37, D5: 587.33, Dss5: 622.25, E5: 659.25, F5: 698.46, Fs5: 739.99, G5: 783.99, Gs5: 830.61, A5: 880.00, As5: 932.33, B5: 987.77, C6: 1046.50
};

const BGM_SEQUENCE = [
  { n: 'E5', d: 0.15 }, { n: 'E5', d: 0.15 }, { n: null, d: 0.15 }, { n: 'E5', d: 0.15 },
  { n: null, d: 0.15 }, { n: 'C5', d: 0.15 }, { n: 'E5', d: 0.3 },
  { n: 'G5', d: 0.3 }, { n: null, d: 0.3 }, { n: 'G4', d: 0.3 }, { n: null, d: 0.3 },
  { n: 'C5', d: 0.45 }, { n: 'G4', d: 0.45 }, { n: 'E4', d: 0.45 },
  { n: 'A4', d: 0.3 }, { n: 'B4', d: 0.3 }, { n: 'As4', d: 0.15 }, { n: 'A4', d: 0.3 },
  { n: 'G4', d: 0.2 }, { n: 'E5', d: 0.2 }, { n: 'G5', d: 0.2 }, { n: 'A5', d: 0.3 }, { n: 'F5', d: 0.15 }, { n: 'G5', d: 0.3 },
  { n: 'E5', d: 0.3 }, { n: 'C5', d: 0.15 }, { n: 'D5', d: 0.15 }, { n: 'B4', d: 0.3 }, { n: null, d: 0.3 },
  { n: 'C5', d: 0.45 }, { n: 'G4', d: 0.45 }, { n: 'E4', d: 0.45 },
  { n: 'A4', d: 0.3 }, { n: 'B4', d: 0.3 }, { n: 'As4', d: 0.15 }, { n: 'A4', d: 0.3 },
  { n: 'G4', d: 0.2 }, { n: 'E5', d: 0.2 }, { n: 'G5', d: 0.2 }, { n: 'A5', d: 0.3 }, { n: 'F5', d: 0.15 }, { n: 'G5', d: 0.3 },
  { n: 'E5', d: 0.3 }, { n: 'C5', d: 0.15 }, { n: 'D5', d: 0.15 }, { n: 'B4', d: 0.3 }, { n: null, d: 0.3 },
  { n: null, d: 0.3 },
  { n: 'G5', d: 0.15 }, { n: 'Fs5', d: 0.15 }, { n: 'F5', d: 0.15 }, { n: 'Dss5', d: 0.3 }, { n: 'E5', d: 0.3 },
  { n: null, d: 0.15 }, { n: 'Gs4', d: 0.15 }, { n: 'A4', d: 0.15 }, { n: 'C5', d: 0.15 }, { n: null, d: 0.15 }, { n: 'A4', d: 0.15 }, { n: 'C5', d: 0.15 }, { n: 'D5', d: 0.3 },
  { n: null, d: 0.3 },
  { n: 'G5', d: 0.15 }, { n: 'Fs5', d: 0.15 }, { n: 'F5', d: 0.15 }, { n: 'Dss5', d: 0.3 }, { n: 'E5', d: 0.3 },
  { n: null, d: 0.15 }, { n: 'C6', d: 0.15 }, { n: null, d: 0.15 }, { n: 'C6', d: 0.15 }, { n: 'C6', d: 0.3 }, { n: null, d: 0.3 },
  { n: null, d: 0.3 },
  { n: 'G5', d: 0.15 }, { n: 'Fs5', d: 0.15 }, { n: 'F5', d: 0.15 }, { n: 'Dss5', d: 0.3 }, { n: 'E5', d: 0.3 },
  { n: null, d: 0.15 }, { n: 'Gs4', d: 0.15 }, { n: 'A4', d: 0.15 }, { n: 'C5', d: 0.15 }, { n: null, d: 0.15 }, { n: 'A4', d: 0.15 }, { n: 'C5', d: 0.15 }, { n: 'D5', d: 0.3 },
  { n: null, d: 0.3 },
  { n: 'Dss5', d: 0.4 }, { n: null, d: 0.2 }, { n: 'D5', d: 0.4 }, { n: null, d: 0.2 }, { n: 'C5', d: 0.4 }, { n: null, d: 0.8 },
  { n: null, d: 0.5 } 
];

const playSound = (type) => {
  if (!audioCtx) return;
  const now = audioCtx.currentTime;

  if (type === 'stage_clear') {
      const notes = [
        {f: 392.00, t: 0.0, d: 0.08}, {f: 523.25, t: 0.08, d: 0.08}, {f: 659.25, t: 0.16, d: 0.08},
        {f: 783.99, t: 0.24, d: 0.08}, {f: 1046.50, t: 0.32, d: 0.08}, {f: 1318.51, t: 0.40, d: 0.08},
        {f: 1567.98, t: 0.48, d: 0.08}, {f: 1318.51, t: 0.56, d: 0.4},
        {f: 830.61, t: 1.1, d: 0.1}, {f: 932.33, t: 1.25, d: 0.1}, {f: 987.77, t: 1.4, d: 0.1}, {f: 1046.50, t: 1.6, d: 0.6}
      ];
      notes.forEach(n => {
        const osc = audioCtx.createOscillator(); const gain = audioCtx.createGain();
        osc.type = 'square'; osc.frequency.value = n.f;
        osc.connect(gain); gain.connect(audioCtx.destination);
        osc.start(now + n.t);
        gain.gain.setValueAtTime(0.1, now + n.t);
        gain.gain.exponentialRampToValueAtTime(0.01, now + n.t + n.d);
        osc.stop(now + n.t + n.d);
      });
      return;
  }

  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.connect(gain);
  gain.connect(audioCtx.destination);

  switch (type) {
    case 'jump':
      osc.type = 'square'; osc.frequency.setValueAtTime(150, now); osc.frequency.linearRampToValueAtTime(300, now + 0.1);
      gain.gain.setValueAtTime(0.1, now); gain.gain.linearRampToValueAtTime(0, now + 0.1);
      osc.start(now); osc.stop(now + 0.1); break;
    case 'coin':
      osc.type = 'sine'; osc.frequency.setValueAtTime(900, now); osc.frequency.setValueAtTime(1200, now + 0.1);
      gain.gain.setValueAtTime(0.1, now); gain.gain.linearRampToValueAtTime(0, now + 0.3);
      osc.start(now); osc.stop(now + 0.3); break;
    case 'bump': 
      osc.type = 'sawtooth'; osc.frequency.setValueAtTime(50, now); osc.frequency.linearRampToValueAtTime(30, now + 0.1);
      gain.gain.setValueAtTime(0.1, now); gain.gain.linearRampToValueAtTime(0, now + 0.1);
      osc.start(now); osc.stop(now + 0.1); break;
    case 'stomp': 
      osc.type = 'sawtooth'; osc.frequency.setValueAtTime(100, now); osc.frequency.exponentialRampToValueAtTime(20, now + 0.1);
      gain.gain.setValueAtTime(0.1, now); gain.gain.linearRampToValueAtTime(0, now + 0.1);
      osc.start(now); osc.stop(now + 0.1); break;
    case 'pipe':
      osc.type = 'square'; osc.frequency.setValueAtTime(150, now); osc.frequency.linearRampToValueAtTime(50, now + 0.4); 
      gain.gain.setValueAtTime(0.1, now); gain.gain.linearRampToValueAtTime(0, now + 0.4);
      osc.start(now); osc.stop(now + 0.4); break;
    case 'gameover':
      osc.type = 'triangle'; osc.frequency.setValueAtTime(300, now); osc.frequency.linearRampToValueAtTime(100, now + 2);
      gain.gain.setValueAtTime(0.2, now); gain.gain.linearRampToValueAtTime(0, now + 2);
      osc.start(now); osc.stop(now + 2); break;
    default: break;
  }
};

const MarioSprite = ({ frame, facing, isJumping, isDead }) => {
  const color = isDead ? "#555" : "#E52521"; const overalls = "#0046AD"; const skin = "#FED5A5"; const hair = "#6B4423";
  if (isDead) {
    return (
       <svg width="32" height="32" viewBox="0 0 16 16">
         <rect x="4" y="10" width="8" height="2" fill={overalls} /><rect x="2" y="8" width="12" height="2" fill={overalls} />
         <rect x="5" y="4" width="6" height="4" fill={color} /><rect x="5" y="2" width="6" height="2" fill={skin} />
         <rect x="3" y="10" width="2" height="2" fill={skin} /><rect x="11" y="10" width="2" height="2" fill={skin} />
       </svg>
    )
  }
  const transform = facing === 'left' ? 'scale(-1, 1) translate(-16, 0)' : '';
  return (
    <svg width="32" height="32" viewBox="0 0 16 16" style={{ overflow: 'visible' }}>
      <g transform={transform}>
        <rect x="3" y="0" width="10" height="2" fill={color} /><rect x="8" y="0" width="5" height="1" fill={color} />
        <rect x="3" y="2" width="7" height="3" fill={skin} /><rect x="3" y="2" width="2" height="1" fill={hair} />
        <rect x="4" y="3" width="1" height="1" fill={hair} /><rect x="8" y="3" width="1" height="1" fill="#000" /> 
        <rect x="9" y="4" width="2" height="1" fill="#000" /><rect x="10" y="3" width="1" height="1" fill={skin} /> 
        <rect x="4" y="5" width="6" height="4" fill={overalls} /><rect x="2" y="6" width="3" height="2" fill={color} /> 
        <rect x="9" y="6" width="3" height="2" fill={color} /> 
        {isJumping ? (
           <><rect x="2" y="10" width="4" height="3" fill={overalls} /><rect x="9" y="8" width="4" height="3" fill={overalls} /></>
        ) : frame === 0 ? (
           <><rect x="3" y="9" width="3" height="3" fill={overalls} /><rect x="8" y="9" width="3" height="3" fill={overalls} />
           <rect x="2" y="12" width="3" height="2" fill={hair} /><rect x="9" y="12" width="3" height="2" fill={hair} /></>
        ) : (
           <><rect x="4" y="9" width="2" height="3" fill={overalls} /><rect x="7" y="9" width="5" height="2" fill={overalls} />
           <rect x="3" y="12" width="3" height="2" fill={hair} /><rect x="8" y="11" width="3" height="2" fill={hair} /></>
        )}
      </g>
    </svg>
  );
};

const GoombaSprite = ({ frame, isDead }) => {
  const body = "#8B4513"; const skin = "#FED5A5"; const black = "#000000";
  if (isDead) {
    return (<svg width="32" height="16" viewBox="0 0 16 8"><rect x="2" y="2" width="12" height="6" fill={body} /><rect x="4" y="4" width="8" height="2" fill={skin} /></svg>);
  }
  return (
    <svg width="32" height="32" viewBox="0 0 16 16">
      <rect x="4" y="4" width="8" height="8" fill={body} /><rect x="3" y="5" width="1" height="5" fill={body} />
      <rect x="12" y="5" width="1" height="5" fill={body} /><rect x="5" y="6" width="2" height="3" fill="#fff" />
      <rect x="6" y="7" width="1" height="2" fill={black} /><rect x="9" y="6" width="2" height="3" fill="#fff" />
      <rect x="9" y="7" width="1" height="2" fill={black} /><rect x="6" y="10" width="4" height="1" fill={skin} />
      {frame === 0 ? (<><rect x="2" y="12" width="4" height="2" fill={black} /><rect x="11" y="12" width="4" height="2" fill={black} /></>) : 
                     (<><rect x="1" y="12" width="4" height="2" fill={black} /><rect x="10" y="12" width="4" height="2" fill={black} /></>)}
    </svg>
  );
};

const BlockSprite = ({ type, frame }) => {
  if (type === 'BRICK') {
    return (
      <div style={{ width: '32px', height: '32px', background: '#D87536', border: '2px solid #9C4A1A', boxSizing: 'border-box', position: 'relative' }}>
        <div style={{ position: 'absolute', top: 4, left: 0, width: '100%', height: 2, background: '#000', opacity: 0.2 }}></div>
        <div style={{ position: 'absolute', top: 16, left: 0, width: '100%', height: 2, background: '#000', opacity: 0.2 }}></div>
        <div style={{ position: 'absolute', top: 0, left: 14, width: 2, height: 16, background: '#000', opacity: 0.2 }}></div>
        <div style={{ position: 'absolute', top: 16, left: 6, width: 2, height: 16, background: '#000', opacity: 0.2 }}></div>
        <div style={{ position: 'absolute', top: 16, left: 22, width: 2, height: 16, background: '#000', opacity: 0.2 }}></div>
      </div>
    );
  }
  if (type === 'Q') {
    const color = frame % 2 === 0 ? '#FFD700' : '#EAC100';
    return (
      <div style={{ width: '32px', height: '32px', background: color, border: '2px solid #B8860B', boxSizing: 'border-box', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'inset 2px 2px 0 #FFF, inset -2px -2px 0 #DAA520' }}>
        <span style={{ fontFamily: '"Press Start 2P", cursive', fontSize: '20px', color: '#000', marginTop: '2px' }}>?</span>
        <div style={{ position: 'absolute', top: 2, right: 2, width: 2, height: 2, background: '#000', opacity: 0.5}}></div>
        <div style={{ position: 'absolute', bottom: 2, left: 2, width: 2, height: 2, background: '#000', opacity: 0.5}}></div>
      </div>
    );
  }
  if (type === 'EMPTY') {
    return (
      <div style={{ width: '32px', height: '32px', background: '#6B4423', border: '2px solid #3d2613', boxSizing: 'border-box' }}>
         <div style={{ width: '100%', height: '100%', border: '2px solid #8B4513' }}></div>
      </div>
    );
  }
  return null;
};

/**
 * ------------------------------------------------------------------
 * GAME ENGINE & COMPONENTS
 * ------------------------------------------------------------------
 */
export default function App() {
  // [FIX] 쾌적한 조작감을 위한 물리 상수 조정
  const GRAVITY = 0.6; // 중력 증가 (더 빠르게 떨어짐)
  const FRICTION = 0.85; 
  const MOVE_ACCEL = 1.5; 
  const MAX_SPEED = 8;    
  const JUMP_FORCE = -12; // 점프력 조정 (중력 증가에 맞춰 조정)
  const GROUND_Y = 500;
  
  // Game Flow State
  const [screen, setScreen] = useState('LANDING');
  
  // Auth & Data State
  const [accessCode, setAccessCode] = useState('');
  const [nickname, setNickname] = useState('');
  const [dbStatus, setDbStatus] = useState({ loading: false, error: null });
  const [quizList, setQuizList] = useState([]);
  
  // Game Play State
  const [level, setLevel] = useState(1);
  const [score, setScore] = useState(0);
  const [coins, setCoins] = useState(0);
  const [hearts, setHearts] = useState(3);
  const [timeLeft, setTimeLeft] = useState(120);
  const [quizIdx, setQuizIdx] = useState(0);
  const [feedback, setFeedback] = useState(null);
  const [showPipe, setShowPipe] = useState(false);

  // Refs
  const marioRef = useRef({ x: 100, y: 300, vx: 0, vy: 0, width: 32, height: 32, grounded: false, facing: 'right', animFrame: 0, state: 'IDLE', invincible: 0, enteringPipe: false });
  const entitiesRef = useRef([]);
  const particlesRef = useRef([]);
  const keysRef = useRef({});
  const requestRef = useRef();
  const frameCountRef = useRef(0);
  const gameStateRef = useRef({ screen: 'LANDING', feedback: null, showPipe: false });
  const quizListRef = useRef([]);
  const quizIdxRef = useRef(0);
  const submittedRef = useRef(false); 

  // Audio Refs
  const bgmTimeoutRef = useRef(null);
  const bgmIndexRef = useRef(0);

  // --- BGM Logic ---
  const playBGM = useCallback(() => {
    if (gameStateRef.current.screen !== 'GAME') return;
    const noteData = BGM_SEQUENCE[bgmIndexRef.current];
    let nextIndex = bgmIndexRef.current + 1;
    if (nextIndex >= BGM_SEQUENCE.length) nextIndex = 11; 
    bgmIndexRef.current = nextIndex;

    if (noteData.n && audioCtx) {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'square'; osc.frequency.value = NOTES[noteData.n];
      osc.connect(gain); gain.connect(audioCtx.destination);
      osc.start();
      gain.gain.setValueAtTime(0.05, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + noteData.d * 0.9);
      osc.stop(audioCtx.currentTime + noteData.d);
    }
    bgmTimeoutRef.current = setTimeout(playBGM, noteData.d * 1000);
  }, []);

  const stopBGM = useCallback(() => {
    if (bgmTimeoutRef.current) clearTimeout(bgmTimeoutRef.current);
  }, []);

  // --- Effects ---
  useEffect(() => {
    const link = document.createElement('link');
    link.href = 'https://fonts.googleapis.com/css2?family=Press+Start+2P&family=DungGeunMo&display=swap';
    link.rel = 'stylesheet';
    document.head.appendChild(link);
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      cancelAnimationFrame(requestRef.current);
      stopBGM();
    };
  }, [stopBGM]);

  useEffect(() => {
      gameStateRef.current = { screen, feedback, showPipe };
      if (screen === 'GAME') {
          if (!bgmTimeoutRef.current) {
              bgmIndexRef.current = 0;
              playBGM();
          }
      } else {
          stopBGM();
          bgmTimeoutRef.current = null;
      }
  }, [screen, feedback, showPipe, playBGM, stopBGM]);

  useEffect(() => {
    if ((screen === 'CLEAR' || screen === 'GAMEOVER') && !submittedRef.current) {
        submittedRef.current = true;
        const totalScore = score + (coins * 50) + (hearts * 200) + timeLeft;
        submitResult(totalScore);
    }
  }, [screen, score, coins, hearts, timeLeft]);

  useEffect(() => { quizListRef.current = quizList; }, [quizList]);
  useEffect(() => { quizIdxRef.current = quizIdx; }, [quizIdx]);

  // --- Input Handlers ---
  const handleKeyDown = (e) => { 
      keysRef.current[e.code] = true; 
      const curScreen = gameStateRef.current.screen;

      if (e.code === 'Enter') {
          if (curScreen === 'LANDING') setScreen('AUTH_CODE');
          else if (curScreen === 'AUTH_CODE') fetchQuizData();
          else if (curScreen === 'AUTH_NAME') startGame();
          else if (curScreen === 'GAMEOVER' || curScreen === 'CLEAR') {
            setScreen('LANDING'); 
            setAccessCode(''); setNickname('');
          }
      }
      if (e.code === 'Space' && curScreen === 'LANDING') {
          e.preventDefault(); setScreen('AUTH_CODE');
      }
  };
  const handleKeyUp = (e) => { keysRef.current[e.code] = false; };

  // --- API Functions ---
  const fetchQuizData = async () => {
      if (!accessCode) {
          setDbStatus({ loading: false, error: "참여 코드를 입력해주세요." });
          return;
      }

      setScreen('LOADING');
      setDbStatus({ loading: true, error: null });

      try {
          const response = await fetch(`${GOOGLE_SCRIPT_URL}?type=get&code=${accessCode}`);
          const data = await response.json();

          if (data.status === 'success' && data.data && data.data.length > 0) {
              const selectedData = processRawData(data.data);
              
              if (selectedData.length < 1) throw new Error('퀴즈 데이터가 부족합니다.');
              
              const gameQuizzes = selectedData.map(item => {
                  const options = shuffleArray(item.options);
                  const ansIdx = options.indexOf(item.a) + 1;
                  return {
                      q: item.q,
                      options: options,
                      ans: ansIdx,
                      exp: `정답: ${item.a}`
                  };
              });
              
              setQuizList(gameQuizzes);
              setDbStatus({ loading: false, error: null });
              setScreen('AUTH_NAME');
          } else if (data.status === 'error') {
              throw new Error(data.message);
          } else {
              throw new Error('데이터를 불러올 수 없습니다.');
          }
      } catch (err) {
          console.error("API Fetch Failed:", err);
          setDbStatus({ loading: false, error: err.message || "연결 실패. 코드를 확인하거나 관리자에게 문의하세요." });
          setScreen('AUTH_CODE'); 
      }
  };

  const submitResult = async (finalScore) => {
      try {
          const payload = {
              code: accessCode,
              nickname: nickname,
              score: finalScore, 
              gametype: GAME_TYPE
          };
          
          await fetch(GOOGLE_SCRIPT_URL, {
              method: 'POST',
              mode: 'no-cors', 
              headers: { 'Content-Type': 'text/plain;charset=utf-8' },
              body: JSON.stringify(payload)
          });
          console.log("Result submitted. Score:", finalScore);
      } catch (e) {
          console.error("Submission failed", e);
      }
  };

  // --- Game Logic ---
  const initLevel = (qIndex) => {
    marioRef.current = { x: 50, y: GROUND_Y - 32, vx: 0, vy: 0, width: 32, height: 32, grounded: true, facing: 'right', animFrame: 0, state: 'IDLE', invincible: 0, enteringPipe: false };

    const newEntities = [];
    const startX = 250; const gap = 100;
    for (let i = 0; i < 4; i++) {
      newEntities.push({ id: `qblock-${i}`, type: 'BLOCK', subtype: 'Q', x: startX + (i * gap), y: 350, width: 32, height: 32, value: i, active: true, bumpY: 0 });
    }
    for (let i = 0; i < 25; i++) {
        newEntities.push({ id: `g-${i}`, type: 'BLOCK', subtype: 'GROUND', x: i * 32, y: GROUND_Y + 32, width: 32, height: 32 });
        newEntities.push({ id: `g2-${i}`, type: 'BLOCK', subtype: 'GROUND', x: i * 32, y: GROUND_Y + 64, width: 32, height: 32 });
    }
    newEntities.push({ id: 'pipe', type: 'PIPE', x: 700, y: GROUND_Y - 16, width: 64, height: 64 });
    entitiesRef.current = newEntities;
    particlesRef.current = [];
    setFeedback(null); setShowPipe(false);
  };

  const startGame = () => {
    if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
    setScore(0); setCoins(0); setHearts(3); setQuizIdx(0); setLevel(1); setTimeLeft(120);
    submittedRef.current = false;
    initLevel(0);
    setScreen('GAME');
    cancelAnimationFrame(requestRef.current);
    requestRef.current = requestAnimationFrame(gameLoop);
  };

  const nextLevel = () => {
    const currentIdx = quizIdxRef.current;
    if (currentIdx + 1 >= 10) { 
        setScreen('CLEAR');
        playSound('stage_clear');
        return;
    }
    const nextIdx = currentIdx + 1;
    setQuizIdx(nextIdx);
    setLevel(prev => prev + 1);
    initLevel(nextIdx);
  };

  const gameLoop = () => {
    if (frameCountRef.current % 60 === 0 && gameStateRef.current.screen === 'GAME' && !gameStateRef.current.feedback && !marioRef.current.enteringPipe) {
        setTimeLeft(t => {
            if (t <= 1) {
                setScreen('GAMEOVER'); playSound('gameover'); return 0;
            }
            return t - 1;
        });
    }
    
    if (gameStateRef.current.screen === 'GAME') {
        updatePhysics();
        setTick(prev => prev + 1); 
    }
    
    frameCountRef.current++;
    requestRef.current = requestAnimationFrame(gameLoop);
  };

  const updatePhysics = () => {
    const mario = marioRef.current;
    const { feedback, showPipe } = gameStateRef.current;

    if (particlesRef.current.length > 0) {
        particlesRef.current.forEach(p => {
            p.x += 0; 
            p.y += p.vy;
            p.vy += GRAVITY; 
            p.life -= 1;
        });
        particlesRef.current = particlesRef.current.filter(p => p.life > 0);
    }

    if (mario.enteringPipe) {
        mario.y += 2; // [FIX] 파이프 통과 속도 2배 증가 (1 -> 2)
        if (mario.y > GROUND_Y + 32) nextLevel();
        return;
    }

    if (gameStateRef.current.screen === 'GAME') {
        if (keysRef.current['ArrowRight']) { 
            mario.vx += MOVE_ACCEL; 
            if (mario.vx > MAX_SPEED) mario.vx = MAX_SPEED;
            mario.facing = 'right'; 
        } else if (keysRef.current['ArrowLeft']) { 
            mario.vx -= MOVE_ACCEL; 
            if (mario.vx < -MAX_SPEED) mario.vx = -MAX_SPEED;
            mario.facing = 'left'; 
        }
        
        if ((keysRef.current['Space'] || keysRef.current['ArrowUp']) && mario.grounded) {
          mario.vy = JUMP_FORCE; mario.grounded = false; playSound('jump');
        }

        if (showPipe) {
             const pipe = entitiesRef.current.find(e => e.type === 'PIPE');
             if (pipe && Math.abs((mario.x + 16) - (pipe.x + 32)) < 20 && Math.abs(mario.y + 32 - pipe.y) < 5) {
                 mario.enteringPipe = true; playSound('pipe');
             }
        }
    }

    mario.vx *= FRICTION; mario.vy += GRAVITY; mario.x += mario.vx; mario.y += mario.vy;
    if (mario.x < 0) mario.x = 0; if (mario.x > 768) mario.x = 768;
    mario.grounded = false;
    if (mario.y >= GROUND_Y - mario.height) { mario.y = GROUND_Y - mario.height; mario.vy = 0; mario.grounded = true; }
    if (mario.invincible > 0) mario.invincible--;

    entitiesRef.current.forEach(entity => {
      if (mario.x < entity.x + entity.width && mario.x + mario.width > entity.x && mario.y < entity.y + entity.height && mario.y + mario.height > entity.y) {
        if (entity.type === 'BLOCK') {
            const dx = (mario.x + mario.width/2) - (entity.x + entity.width/2);
            const dy = (mario.y + mario.height/2) - (entity.y + entity.height/2);
            const width = (mario.width + entity.width) / 2; const height = (mario.height + entity.height) / 2;
            const crossWidth = width * dy; const crossHeight = height * dx;

            if (Math.abs(dx) <= width && Math.abs(dy) <= height) {
                if (crossWidth > crossHeight) {
                    if (crossWidth > -crossHeight) { 
                        mario.y = entity.y + entity.height; mario.vy = 0;
                        if (entity.subtype === 'Q' && entity.active && !feedback) hitBlock(entity);
                        else playSound('bump');
                    } else { mario.x = entity.x - mario.width; mario.vx = 0; }
                } else {
                    if (crossWidth > -crossHeight) { mario.x = entity.x + entity.width; mario.vx = 0; }
                    else { if (mario.vy > 0) { mario.y = entity.y - mario.height; mario.vy = 0; mario.grounded = true; } }
                }
            }
        }
        if (entity.type === 'GOOMBA' && !entity.dead && mario.invincible === 0) {
             // [FIX] 굼바 밟기 판정 대폭 완화 (마리오의 중심이 굼바의 중심보다 위에 있으면 성공)
             // 마리오가 떨어지는 중이거나(vy > 0) 아주 조금이라도 위에서 접촉 시 인정
             if (mario.vy > 0 && mario.y + mario.height * 0.5 < entity.y + entity.height * 0.5) {
                 entity.dead = true; mario.vy = -5; setScore(s => s + 50); playSound('stomp');
                 setTimeout(() => { entitiesRef.current = entitiesRef.current.filter(e => e !== entity); }, 500);
             } else {
                 mario.invincible = 120; 
                 setHearts(h => {
                     const next = h - 1;
                     if (next <= 0) { setScreen('GAMEOVER'); playSound('gameover'); }
                     else playSound('bump'); 
                     return next;
                 });
             }
        }
      }
      if (entity.type === 'GOOMBA' && !entity.dead) {
          entity.x += entity.vx;
          if (entity.x < 0 || entity.x > 780) entity.vx *= -1;
          entity.frame = Math.floor(frameCountRef.current / 15) % 2;
      }
      if (entity.bumpY > 0) entity.bumpY -= 1;
    });
  };

  const hitBlock = (block) => {
    block.active = false; block.subtype = 'EMPTY'; block.bumpY = 10;
    const ansIdx = block.value; 
    const currentQuiz = quizListRef.current[quizIdxRef.current];
    
    if (ansIdx + 1 === currentQuiz.ans) {
        playSound('coin'); setScore(s => s + 100); setCoins(c => c + 1);
        setFeedback({ type: 'CORRECT', msg: currentQuiz.exp }); setShowPipe(true);
        particlesRef.current.push({ type: 'COIN', x: block.x + 8, y: block.y - 32, vy: -5, life: 30 });
        entitiesRef.current.forEach(e => { if (e.type === 'BLOCK' && e.subtype === 'Q' && e !== block) { e.active = false; e.subtype = 'EMPTY'; e.y = -1000; }});
    } else {
        playSound('bump'); setFeedback({ type: 'WRONG', msg: currentQuiz.exp }); setShowPipe(true); 
        setTimeout(() => {
            if (gameStateRef.current.screen !== 'GAME') return;
            entitiesRef.current.push({ id: `goomba-${Date.now()}`, type: 'GOOMBA', x: block.x, y: GROUND_Y - 32, width: 32, height: 32, vx: -1, frame: 0, dead: false });
            playSound('bump');
        }, 1000);
        entitiesRef.current.forEach(e => { if (e.type === 'BLOCK' && e.subtype === 'Q' && e !== block) { e.active = false; e.subtype = 'EMPTY'; e.y = -1000; }});
    }
  };

  const [tick, setTick] = useState(0);
  
  return (
    <div className="flex flex-col items-center justify-center w-full min-h-screen bg-gray-900 font-sans select-none">
      <style>{`
        body { margin: 0; background: #111; }
        .nes-font { font-family: 'Press Start 2P', monospace; }
        .pixel-font { font-family: 'DungGeunMo', monospace; }
        .game-container { position: relative; width: 800px; height: 600px; background-color: #5C94FC; overflow: hidden; box-shadow: 0 0 20px rgba(0,0,0,0.5); image-rendering: pixelated; }
        .sky-cloud { position: absolute; background: #fff; border-radius: 20px; opacity: 0.8; }
        @keyframes blink { 0% { opacity: 1; } 50% { opacity: 0; } 100% { opacity: 1; } }
        .blink { animation: blink 1s infinite; }
        input { font-family: 'DungGeunMo', monospace; }
      `}</style>

      <div className="game-container">
        
        {/* --- LANDING SCREEN --- */}
        {screen === 'LANDING' && (
          <div className="w-full h-full flex flex-col items-center justify-center bg-[#5C94FC]">
            <div className="mb-10 text-center">
              <h1 className="nes-font text-6xl text-[#E52521] drop-shadow-[4px_4px_0_#000] mb-4">SUPER MARIO</h1>
              <h2 className="pixel-font text-4xl text-white drop-shadow-[2px_2px_0_#000]">퀴즈</h2>
            </div>
            <div className="mt-10 animate-bounce">
              <button onClick={() => setScreen('AUTH_CODE')} className="nes-font text-2xl text-white blink hover:text-[#FFD700]">PRESS START</button>
            </div>
            <div className="absolute bottom-0 w-full h-16 bg-[#D87536] border-t-4 border-[#9C4A1A]"></div>
            <MarioSprite frame={0} facing="right" />
          </div>
        )}

        {/* --- AUTH: CODE --- */}
        {screen === 'AUTH_CODE' && (
             <div className="w-full h-full flex flex-col items-center justify-center bg-black">
                 <h2 className="nes-font text-2xl text-white mb-8">ACCESS CODE</h2>
                 <input 
                    type="text" 
                    value={accessCode} 
                    onChange={e => setAccessCode(e.target.value)} 
                    placeholder="참여 코드 입력"
                    className="p-4 text-2xl text-center bg-gray-800 text-white border-4 border-white outline-none w-1/2 mb-4"
                 />
                 <button onClick={fetchQuizData} className="nes-font text-white border-2 border-white p-4 hover:bg-white hover:text-black">CONNECT</button>
                 {dbStatus.error && <p className="mt-4 text-red-500 pixel-font">{dbStatus.error}</p>}
                 <div className="mt-8">
                     <BlockSprite type="Q" frame={0} />
                 </div>
             </div>
        )}

        {/* --- LOADING --- */}
        {screen === 'LOADING' && (
             <div className="w-full h-full flex flex-col items-center justify-center bg-black">
                 <h2 className="nes-font text-2xl text-white mb-8 blink">LOADING DATA...</h2>
                 <MarioSprite frame={1} facing="right" isJumping={true} />
             </div>
        )}

        {/* --- AUTH: NAME --- */}
        {screen === 'AUTH_NAME' && (
             <div className="w-full h-full flex flex-col items-center justify-center bg-black">
                 <h2 className="nes-font text-2xl text-white mb-8">NICKNAME</h2>
                 <input 
                    type="text" 
                    value={nickname} 
                    onChange={e => setNickname(e.target.value)} 
                    placeholder="닉네임 입력"
                    className="p-4 text-2xl text-center bg-gray-800 text-white border-4 border-white outline-none w-1/2 mb-4"
                 />
                 <button onClick={startGame} className="nes-font text-white border-2 border-white p-4 hover:bg-white hover:text-black">START GAME</button>
             </div>
        )}

        {/* --- GAME SCREEN --- */}
        {screen === 'GAME' && quizList[quizIdx] && (
          <>
            <div className="absolute top-0 left-0 w-full p-4 flex justify-between items-start nes-font text-white text-xl z-20 drop-shadow-md">
                <div className="flex flex-col">
                    <span>MARIO</span><span>{score.toString().padStart(6, '0')}</span>
                </div>
                <div className="flex flex-col items-center">
                    <span>WORLD</span><span>1-{level}</span>
                </div>
                <div className="flex flex-col items-center">
                    <span>TIME</span><span>{timeLeft}</span>
                </div>
            </div>
            <div className="absolute top-16 left-4 flex gap-2 z-20 text-white nes-font text-lg">
               <span>❤ {hearts}</span>
               <span className="ml-4 text-[#FFD700]">🪙 x {coins.toString().padStart(2, '0')}</span>
            </div>

            <div className="sky-cloud w-32 h-12 top-20 left-20"></div>
            <div className="sky-cloud w-24 h-10 top-40 right-40"></div>

            <div className="absolute top-24 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-80 border-4 border-white p-4 rounded text-white text-center w-3/4 z-10">
                <p className="text-yellow-400 mb-2 nes-font">QUESTION {quizIdx + 1}/10</p>
                <p className="pixel-font text-2xl leading-relaxed whitespace-pre-line">{quizList[quizIdx].q}</p>
            </div>

            {feedback && (
                <div className="absolute top-56 left-1/2 transform -translate-x-1/2 bg-blue-900 border-4 border-white p-4 w-3/4 text-center z-30 shadow-lg">
                    <p className={`pixel-font text-3xl mb-2 ${feedback.type === 'CORRECT' ? 'text-green-400' : 'text-red-400'}`}>
                        {feedback.type === 'CORRECT' ? '정답입니다! ⭕' : '오답입니다! ❌'}
                    </p>
                    <p className="pixel-font text-xl text-white whitespace-pre-line">{feedback.msg}</p>
                    {showPipe && <p className="mt-2 text-yellow-300 nes-font blink">GO TO PIPE &rarr;</p>}
                </div>
            )}

            <div className="absolute w-full h-full">
                {entitiesRef.current.map(ent => {
                    if (ent.type === 'BLOCK') {
                        return (
                            <div key={ent.id} style={{ position: 'absolute', left: ent.x, top: ent.y - (ent.bumpY || 0), width: ent.width, height: ent.height }}>
                                <BlockSprite type={ent.subtype} frame={Math.floor(frameCountRef.current / 30)} />
                                {ent.subtype === 'Q' && <div className="absolute -bottom-8 w-full text-center text-white nes-font font-bold drop-shadow-md">{ent.value + 1}</div>}
                                {ent.subtype === 'Q' && <div className="absolute -top-8 w-24 left-1/2 -translate-x-1/2 text-center text-white pixel-font text-sm bg-black bg-opacity-50 rounded px-1">{quizList[quizIdx].options[ent.value]}</div>}
                            </div>
                        );
                    }
                    if (ent.type === 'GOOMBA') return (<div key={ent.id} style={{ position: 'absolute', left: ent.x, top: ent.y, width: ent.width, height: ent.height, transition: ent.dead ? 'opacity 0.2s' : 'none', opacity: ent.dead ? 0 : 1 }}><GoombaSprite frame={ent.frame} isDead={ent.dead} /></div>);
                    if (ent.type === 'PIPE') return (<div key={ent.id} style={{ position: 'absolute', left: ent.x, top: ent.y, width: ent.width, height: ent.height, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>{showPipe && <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 text-[#FF0000] nes-font text-sm blink font-bold flex flex-col items-center z-20 pointer-events-none"><span>HERE</span><span>↓</span></div>}<div style={{ width: 64, height: 32, background: '#00A800', border: '4px solid #000', boxSizing: 'border-box' }}></div><div style={{ width: 56, height: 32, background: '#00A800', border: '4px solid #000', borderTop: 'none', boxSizing: 'border-box' }}></div></div>);
                    return null;
                })}
                {particlesRef.current.map((p, i) => (<div key={i} style={{ position: 'absolute', left: p.x, top: p.y, width: 16, height: 16, background: '#FFD700', borderRadius: '50%', border: '2px solid #DAA520' }}><div className="w-full h-full flex items-center justify-center text-[10px] font-bold">$</div></div>))}
                <div style={{ position: 'absolute', left: marioRef.current.x, top: marioRef.current.y, width: 32, height: 32, opacity: marioRef.current.invincible % 4 < 2 ? 1 : 0.5, zIndex: 100 }}>
                    <MarioSprite frame={Math.floor(marioRef.current.x / 10) % 2} facing={marioRef.current.facing} isJumping={!marioRef.current.grounded} isDead={false} />
                </div>
            </div>
            
            <div className="absolute bottom-0 w-full h-[100px] bg-[#D87536] border-t-4 border-[#9C4A1A] z-0" style={{backgroundImage: 'linear-gradient(45deg, #C06020 25%, transparent 25%, transparent 75%, #C06020 75%, #C06020), linear-gradient(45deg, #C06020 25%, transparent 25%, transparent 75%, #C06020 75%, #C06020)', backgroundSize: '16px 16px', backgroundPosition: '0 0, 8px 8px'}}></div>
            
            {/* TIME BAR */}
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 w-3/4 h-6 border-2 border-white bg-black z-20">
                <div style={{ width: `${(timeLeft / 120) * 100}%`, height: '100%', background: timeLeft < 30 ? '#E52521' : '#FFD700', transition: 'width 1s linear' }}></div>
                <span className="absolute top-0 left-2 text-xs text-white nes-font" style={{ lineHeight: '24px' }}>TIME</span>
            </div>
          </>
        )}

        {/* --- GAME OVER --- */}
        {screen === 'GAMEOVER' && (
             <div className="w-full h-full flex flex-col items-center justify-center bg-black">
                 <h1 className="nes-font text-5xl text-white mb-8">GAME OVER</h1>
                 <p className="nes-font text-2xl text-red-500 mb-4">FINAL SCORE: {score}</p>
                 <div className="mb-12 text-center text-gray-400 pixel-font">
                    <p>더 노력하여 퀴즈왕에 도전하세요!</p>
                 </div>
                 <button onClick={() => { setScreen('LANDING'); setAccessCode(''); setNickname(''); }} className="nes-font text-white border-2 border-white p-4 hover:bg-white hover:text-black">HOME</button>
             </div>
        )}

        {/* --- CLEAR SCREEN --- */}
        {screen === 'CLEAR' && (
             <div className="w-full h-full flex flex-col items-center justify-center bg-[#5C94FC]">
                 <div className="bg-black bg-opacity-50 p-8 rounded-lg text-center border-4 border-white">
                    <h1 className="nes-font text-3xl text-yellow-400 mb-8">CONGRATULATIONS!</h1>
                    <div className="pixel-font text-white text-xl text-left space-y-4 font-bold">
                        <p>정답 : {score/100} x 100 = {score}</p>
                        <p>동전 : {coins} x 50 = {coins * 50}</p>
                        <p>하트 : {hearts} x 200 = {hearts * 200}</p>
                        <p>남은 시간 : {timeLeft} x 1 = {timeLeft}</p>
                        <div className="border-t-2 border-white my-2"></div>
                        <p className="text-2xl text-yellow-300">TOTAL SCORE = {score + coins*50 + hearts*200 + timeLeft}</p>
                    </div>
                    <div className="mt-8 pixel-font text-green-300">대단한 지식을 가지고 계시군요!</div>
                    <button onClick={() => { setScreen('LANDING'); setAccessCode(''); setNickname(''); }} className="mt-8 nes-font text-white border-2 border-white p-2 hover:bg-white hover:text-black">HOME</button>
                 </div>
                 <div className="absolute top-10 left-10 text-4xl animate-bounce">🎆</div>
                 <div className="absolute top-20 right-20 text-4xl animate-bounce">✨</div>
             </div>
        )}

      </div>
      <div className="mt-4 text-gray-400 text-sm pixel-font text-center">
         <p>이동: ← → | 점프: 스페이스바/↑ | 파이프 입장: 파이프 위로 점프!</p>
         <p>DB 연동 버전 (Type: {GAME_TYPE})</p>
      </div>
    </div>
  );
}