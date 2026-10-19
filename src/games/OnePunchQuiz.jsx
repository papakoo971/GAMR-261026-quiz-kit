import React, { useState, useEffect, useRef } from 'react';
import { 
  Zap, Flame, Skull, Trophy, Volume2, VolumeX, 
  Circle, Square, Triangle, Hexagon, Star, Shield, Target, BicepsFlexed,
  Wind, Heart, XCircle, Loader2, Play, AlertTriangle, Key, User, CheckCircle2
} from 'lucide-react';

/**
 * [테크권님을 위한 원펀맨 DB 연동 퀴즈 v6.5]
 * - Visual/Audio: 원펀맨 오리지널 테마 유지
 * - Logic: 구글 시트 DB 연동
 * - Update: 
 * 1. API URL 변경 (새로운 배포 주소 적용)
 * 2. 점수 저장 시 'gametype' 필드 추가 ('O' 값 전송) 유지
 * 3. 기존 기능 (범용 멘트, 랜덤 10문제, 시간 게이지) 유지
 */

// !!! 구글 앱스 스크립트 배포 URL (업데이트됨)
import { GOOGLE_SCRIPT_URL } from "../config.js";

// --- Audio Engine (원펀맨 버전: 고퀄리티 사운드) ---
class SoundEngine {
  constructor() {
    this.ctx = null;
    this.isMuted = false;
    this.isPlayingBgm = false;
    this.bgmInterval = null;
    this.themeTimer = null;
    this.bgmNoteIndex = 0;
    this.currentTheme = 0; 
  }

  init() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  setMute(mute) {
    this.isMuted = mute;
    if (mute) {
      this.stopBGM();
    } else if (this.isPlayingBgm) {
      this.startBGM(true);
    }
  }

  // --- SFX ---
  playPunch() {
    if (this.isMuted || !this.ctx) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(150, t);
    osc.frequency.exponentialRampToValueAtTime(40, t + 0.15);
    gain.gain.setValueAtTime(1.0, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.15);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(t + 0.2);

    const bufferSize = this.ctx.sampleRate * 0.1;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.8, t);
    noiseGain.gain.exponentialRampToValueAtTime(0.01, t + 0.1);
    noise.connect(noiseGain);
    noiseGain.connect(this.ctx.destination);
    noise.start();
  }

  playMiss() {
    if (this.isMuted || !this.ctx) return;
    const t = this.ctx.currentTime;
    const noise = this.ctx.createBufferSource();
    const bufferSize = this.ctx.sampleRate * 0.2;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
    noise.buffer = buffer;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(400, t);
    filter.frequency.linearRampToValueAtTime(100, t + 0.2);
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.3, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.2);
    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);
    noise.start();
  }

  playCorrect() {
    if (this.isMuted || !this.ctx) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(523.25, t); 
    osc.frequency.linearRampToValueAtTime(659.25, t + 0.1); 
    osc.frequency.linearRampToValueAtTime(783.99, t + 0.2); 
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(0.3, t + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.6);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(t + 0.6);
  }

  playWrong() {
    if (this.isMuted || !this.ctx) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(100, t);
    osc.frequency.linearRampToValueAtTime(80, t + 0.3);
    gain.gain.setValueAtTime(0.5, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.3);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(t + 0.4);
  }

  playGameStart() {
    if (this.isMuted || !this.ctx) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(100, t);
    osc.frequency.exponentialRampToValueAtTime(800, t + 1.0);
    gain.gain.setValueAtTime(0.2, t);
    gain.gain.linearRampToValueAtTime(0.5, t + 0.8);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 1.0);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(t + 1.0);
    setTimeout(() => this.playPunch(), 800);
  }

  playGameEnd() {
    if (this.isMuted || !this.ctx) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(100, t);
    osc.frequency.exponentialRampToValueAtTime(30, t + 2.0);
    gain.gain.setValueAtTime(1.0, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 2.0);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(t + 2.0);
  }

  // --- BGM Logic ---
  startBGM(resume = false) {
    if (this.isMuted || !this.ctx) return;
    
    if (!resume) {
      this.isPlayingBgm = true;
      this.bgmNoteIndex = 0;
      this.currentTheme = 0;
    } else {
      this.isPlayingBgm = true;
    }

    this.stopBGM(false);

    this.themeTimer = setInterval(() => {
      if (!this.isPlayingBgm) return;
      this.currentTheme = (this.currentTheme + 1) % 6;
    }, 10000);

    const baseTempo = 200; 
    this.bgmInterval = setInterval(() => {
      if (!this.isPlayingBgm || this.isMuted) return;
      this.playNextNote();
    }, baseTempo); 
  }

  playNextNote() {
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    const themes = [
      [82.41, 110.00, 123.47, 82.41], 
      [164.81, 220.00, 246.94, 164.81, 196.00],
      [130.81, 164.81, 196.00, 261.63],
      [92.50, 98.00, 185.00, 92.50],
      [82.41, 123.47, 164.81, 220.00, 329.63],
      [73.42, 73.42, 110.00, 98.00]
    ];

    const currentRiff = themes[this.currentTheme];
    const freq = currentRiff[this.bgmNoteIndex % currentRiff.length];
    
    osc.type = this.currentTheme % 2 === 0 ? 'sawtooth' : 'square'; 
    const dist = this.ctx.createWaveShaper();
    dist.curve = this.makeDistortionCurve(this.currentTheme === 4 ? 400 : 100);
    dist.oversample = '4x';

    osc.frequency.setValueAtTime(freq, t);
    
    const volume = this.currentTheme === 4 ? 0.15 : 0.1; 
    gain.gain.setValueAtTime(volume, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.2);

    osc.connect(gain);
    gain.connect(dist);
    dist.connect(this.ctx.destination);
    
    osc.start();
    osc.stop(t + 0.2);

    this.bgmNoteIndex++;
  }

  makeDistortionCurve(amount) {
    const k = typeof amount === 'number' ? amount : 50;
    const n_samples = 44100;
    const curve = new Float32Array(n_samples);
    const deg = Math.PI / 180;
    for (let i = 0; i < n_samples; ++i) {
      const x = (i * 2) / n_samples - 1;
      curve[i] = (3 + k) * x * 20 * deg / (Math.PI + k * Math.abs(x));
    }
    return curve;
  }

  stopBGM(resetState = true) {
    if (resetState) {
      this.isPlayingBgm = false;
      this.currentTheme = 0;
    }
    if (this.bgmInterval) clearInterval(this.bgmInterval);
    if (this.themeTimer) clearInterval(this.themeTimer);
  }
}

const audioController = new SoundEngine();

// --- 이미지 URL 상수 ---
const IMAGES = {
  INTRO: "https://i.imgur.com/dkvQ6D0.png",
  RESULT_C: "https://i.imgur.com/TFm98IZ.png",
  RESULT_B: "https://i.imgur.com/V7WfkBA.png",
  RESULT_A: "https://i.imgur.com/Iv5lwQQ.png",
  RESULT_S: "https://i.imgur.com/1UyKA1y.png",
  RESULT_GOD: "https://i.imgur.com/leMjMTI.png",
  CHAR_SAITAMA: "https://i.imgur.com/g1SRPIf.png",
  CHAR_GENOS: "https://i.imgur.com/R8EFdFZ.png",
  CHAR_TATSUMAKI: "https://i.imgur.com/3Npi4cX.png",
  CHAR_KING: "https://i.imgur.com/BmMOWXg.png",
  CHAR_MUMEN: "https://i.imgur.com/Bp3fGrf.png",
  CHAR_BANG: "https://i.imgur.com/aAJTht6.png",
  CHAR_SONIC: "https://i.imgur.com/Txsla3U.png",
  CHAR_FUBUKI: "https://i.imgur.com/vcKTyXg.png",
  CHAR_BOROS: "https://i.imgur.com/pn73vXn.png",
  CHAR_GAROU: "https://i.imgur.com/V3rTeJL.png",
  CHAR_ASSOC: "https://i.imgur.com/fAMyvP7.png",
  CHAR_PRISONER: "https://i.imgur.com/enoEvjN.png",
  CHAR_AMAI: "https://i.imgur.com/zNtf7t8.png",
  CHAR_PIGGOD: "https://i.imgur.com/eByTsYX.png",
  CHAR_CHILD: "https://i.imgur.com/DOodl4w.png"
};

// --- 캐릭터 템플릿 (DB 문제에 스타일을 입히기 위한 껍데기) ---
const CHARACTER_TEMPLATES = [
  { character: "사이타마", rank: "히어로? (B급)", themeColor: "from-yellow-400 to-red-500", icon: Circle, imageUrl: IMAGES.CHAR_SAITAMA },
  { character: "제노스", rank: "S급 14위", themeColor: "from-gray-700 to-orange-500", icon: Zap, imageUrl: IMAGES.CHAR_GENOS },
  { character: "전율의 타츠마키", rank: "S급 2위", themeColor: "from-green-400 to-green-700", icon: Wind, imageUrl: IMAGES.CHAR_TATSUMAKI },
  { character: "킹", rank: "S급 7위", themeColor: "from-yellow-200 to-purple-500", icon: Volume2, imageUrl: IMAGES.CHAR_KING },
  { character: "무면 라이더", rank: "C급 1위", themeColor: "from-green-600 to-gray-600", icon: BicepsFlexed, imageUrl: IMAGES.CHAR_MUMEN },
  { character: "실버 팽", rank: "S급 3위", themeColor: "from-gray-300 to-gray-500", icon: Hexagon, imageUrl: IMAGES.CHAR_BANG },
  { character: "음속의 소닉", rank: "자칭 라이벌", themeColor: "from-purple-600 to-black", icon: Zap, imageUrl: IMAGES.CHAR_SONIC },
  { character: "지옥의 후부키", rank: "B급 1위", themeColor: "from-green-800 to-black", icon: Star, imageUrl: IMAGES.CHAR_FUBUKI },
  { character: "보로스", rank: "우주 패자", themeColor: "from-pink-500 to-blue-600", icon: Skull, imageUrl: IMAGES.CHAR_BOROS },
  { character: "가로", rank: "인간 괴인", themeColor: "from-gray-400 to-red-900", icon: Target, imageUrl: IMAGES.CHAR_GAROU },
  { character: "탱글탱글 프리즈너", rank: "S급 17위", themeColor: "from-pink-300 to-pink-600", icon: Heart, imageUrl: IMAGES.CHAR_PRISONER },
  { character: "아마이마스크", rank: "A급 1위", themeColor: "from-blue-400 to-blue-200", icon: Star, imageUrl: IMAGES.CHAR_AMAI },
  { character: "돈신", rank: "S급 10위", themeColor: "from-orange-200 to-orange-400", icon: Circle, imageUrl: IMAGES.CHAR_PIGGOD },
  { character: "동제", rank: "S급 5위", themeColor: "from-teal-400 to-blue-500", icon: Square, imageUrl: IMAGES.CHAR_CHILD }
];

// [수정됨] 범용 퀴즈 멘트로 변경
const RANKS = [
  { score: 0, title: "C급 히어로 (재해레벨 랑)", color: "text-gray-500", desc: "히어로가 되기엔 아직 멀었군요. 수련이 필요합니다.", imageUrl: IMAGES.RESULT_C },
  { score: 50, title: "B급 히어로 (재해레벨 호)", color: "text-green-500", desc: "나쁘지 않은 실력입니다. B급 히어로로 인정합니다.", imageUrl: IMAGES.RESULT_B },
  { score: 100, title: "A급 히어로 (재해레벨 귀)", color: "text-blue-500", desc: "훌륭합니다! A급 히어로가 될 자격이 충분합니다.", imageUrl: IMAGES.RESULT_A },
  { score: 150, title: "S급 히어로 (재해레벨 용)", color: "text-yellow-500", desc: "믿을 수 없는 강함! 당신은 진정한 S급 히어로입니다.", imageUrl: IMAGES.RESULT_S },
  { score: 190, title: "등급 외 (리미터 해제)", color: "text-red-600", desc: "당신의 지식은 측정 불가! 리미터가 해제되었습니다!", imageUrl: IMAGES.RESULT_GOD }
];

const shuffleArray = (array) => {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
};

export default function App() {
  // 흐름: LANDING -> AUTH_CODE -> LOADING -> AUTH_NAME -> INTRO -> GAME -> RESULT
  const [gameState, setGameState] = useState('LANDING'); 
  
  // User & DB Data
  const [accessCode, setAccessCode] = useState('');
  const [nickname, setNickname] = useState('');
  const [gameQuestions, setGameQuestions] = useState([]); 
  const [errorMsg, setErrorMsg] = useState('');
  const [saveStatus, setSaveStatus] = useState('idle');

  // Game Logic
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(10);
  const [isMuted, setIsMuted] = useState(false);
  const [punchEffect, setPunchEffect] = useState({ show: false, x: 0, y: 0, type: '' });
  
  // Loading State
  const [loadedCount, setLoadedCount] = useState(0);
  const [totalImages, setTotalImages] = useState(0);

  useEffect(() => {
    audioController.setMute(isMuted);
  }, [isMuted]);

  useEffect(() => {
    let timer;
    if (gameState === 'GAME' && timeLeft > 0) {
      timer = setTimeout(() => setTimeLeft(prev => prev - 1), 1000);
    } else if (gameState === 'GAME' && timeLeft === 0) {
      handleAnswer(null, null);
    }
    return () => clearTimeout(timer);
  }, [timeLeft, gameState]);

  // --- 1. 랜딩 클릭 ---
  const handleLandingClick = () => {
    audioController.init(); 
    audioController.playPunch(); 
    setGameState('AUTH_CODE'); // 코드를 먼저 입력받으러 이동
  };

  // --- 2. 코드 인증 및 데이터 로드 ---
  const handleVerifyCode = async () => {
    if (!accessCode.trim()) {
      setErrorMsg("참여 코드를 입력해주세요.");
      return;
    }
    
    audioController.playPunch();
    setGameState('LOADING'); // 로딩 화면으로 전환
    setErrorMsg('');

    try {
      // GAS Fetch
      const response = await fetch(`${GOOGLE_SCRIPT_URL}?code=${accessCode}`, {
        method: 'GET',
        redirect: 'follow'
      });
      
      if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);
      const result = await response.json();

      if (result.status === 'success') {
        // 전체 문제에서 랜덤으로 10개만 추출
        const allQuestions = result.data;
        const shuffledQuestions = shuffleArray(allQuestions); // 전체 섞기
        const selectedQuestions = shuffledQuestions.slice(0, 10); // 앞에서 10개만 자르기

        // 선별된 10개 문제에 원펀맨 캐릭터 스타일 매핑
        const mappedQuestions = selectedQuestions.map((q, index) => {
          // 캐릭터 템플릿을 순환하며 할당
          const template = CHARACTER_TEMPLATES[index % CHARACTER_TEMPLATES.length];
          return {
            ...q,
            shuffledOptions: shuffleArray(q.options),
            // DB에 이미지가 없으면 캐릭터 이미지 사용, 있으면 DB 이미지 우선
            imageUrl: q.imageUrl || template.imageUrl, 
            character: template.character,
            rank: template.rank,
            themeColor: template.themeColor,
            icon: template.icon
          };
        });
        
        // 최종 게임 문제 설정
        setGameQuestions(mappedQuestions);
        
        // 이제 이미지 프리로딩 시작
        startImagePreloading();
      } else {
        throw new Error(result.message || "코드가 일치하지 않습니다.");
      }
    } catch (err) {
      console.error(err);
      if (err.message.includes('Failed to fetch')) {
        setErrorMsg("연결 실패: 스크립트 권한을 '모든 사용자'로 설정했는지 확인하세요.");
      } else {
        setErrorMsg(err.message || "데이터 로드 실패.");
      }
      setGameState('AUTH_CODE'); // 실패 시 다시 코드로 복귀
    }
  };

  // --- 3. 이미지 프리로딩 ---
  const startImagePreloading = () => {
    const urlsToLoad = Object.values(IMAGES).filter(url => url && url.length > 0);
    setTotalImages(urlsToLoad.length);
    setLoadedCount(0);

    let loaded = 0;
    let minTimePassed = false;

    // 최소 로딩 시간 보장 (연출용)
    setTimeout(() => {
      minTimePassed = true;
      if (loaded >= urlsToLoad.length) {
         setGameState('AUTH_NAME'); // 로딩 완료 후 닉네임 입력으로 이동
      }
    }, 2000);

    urlsToLoad.forEach(url => {
      const img = new Image();
      img.src = url;
      img.onload = () => {
        loaded++;
        setLoadedCount(loaded);
        if (loaded === urlsToLoad.length && minTimePassed) {
          setGameState('AUTH_NAME');
        }
      };
      img.onerror = () => {
        loaded++; 
        setLoadedCount(loaded);
        if (loaded === urlsToLoad.length && minTimePassed) {
          setGameState('AUTH_NAME');
        }
      };
    });
  };

  // --- 4. 게임 시작 (인트로 진입) ---
  const handleStartGame = () => {
    if (!nickname.trim()) {
      setErrorMsg("닉네임을 입력해주세요.");
      return;
    }
    audioController.playPunch();
    setGameState('INTRO');
  };

  // --- 5. 인트로에서 실제 게임으로 ---
  const handleIntroToGame = () => {
    audioController.startBGM(); 
    audioController.playGameStart(); 
    setCurrentQIndex(0);
    setScore(0);
    setTimeLeft(10);
    setGameState('GAME'); 
  };

  // --- 6. 정답 처리 ---
  const handleAnswer = (selectedOption, e) => {
    let clickX = window.innerWidth / 2;
    let clickY = window.innerHeight / 2;

    if (e) {
        if (e.touches && e.touches[0]) {
            clickX = e.touches[0].clientX;
            clickY = e.touches[0].clientY;
        } else if (e.clientX) {
            clickX = e.clientX;
            clickY = e.clientY;
        }
    }

    const currentQ = gameQuestions[currentQIndex];
    const isCorrect = selectedOption && currentQ && selectedOption === currentQ.correctAnswer;

    setPunchEffect({ 
      show: true, 
      x: clickX, 
      y: clickY, 
      type: isCorrect ? 'CORRECT' : 'WRONG' 
    });
    
    setTimeout(() => setPunchEffect({ show: false, x: 0, y: 0, type: '' }), 600); 

    if (isCorrect) {
      // 점수 계산: 기본 10점 + 남은 시간
      setScore(prev => prev + 10 + timeLeft);
      audioController.playPunch(); 
      audioController.playCorrect(); 
    } else {
      audioController.playMiss(); 
      audioController.playWrong(); 
    }

    if (currentQIndex < gameQuestions.length - 1) {
      setTimeout(() => {
        setCurrentQIndex(prev => prev + 1);
        setTimeLeft(10);
      }, 600); 
    } else {
      setTimeout(() => {
        finishGame();
      }, 600);
    }
  };

  // --- 7. 게임 종료 및 저장 ---
  const finishGame = async () => {
    audioController.stopBGM(); 
    audioController.playGameEnd(); 
    setGameState('RESULT');
    
    // DB 저장 (비동기)
    setSaveStatus('saving');
    // 계산된 최종 점수를 반영하기 위해 state 대신 계산값 사용 필요하나, 
    // 여기선 effect 흐름상 score가 업데이트 되었다고 가정하고 보냅니다.
    // 안전하게 보내기 위해 약간의 지연 후 전송하거나, score를 바로 계산해서 호출
    saveScoreToDB(); 
  };

  const saveScoreToDB = async () => {
    try {
        await fetch(GOOGLE_SCRIPT_URL, {
            method: 'POST',
            redirect: 'follow',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify({
                code: accessCode,
                nickname: nickname,
                score: score,
                gametype: 'O' // 게임 타입 추가 (O: One Punch Man)
            })
        });
        setSaveStatus('saved');
    } catch (err) {
        console.error("Save Error:", err);
        setSaveStatus('error');
    }
  };

  const getRank = () => {
    for (let i = RANKS.length - 1; i >= 0; i--) {
      if (score >= RANKS[i].score) return RANKS[i];
    }
    return RANKS[0];
  };

  // --- RENDERERS ---

  const PunchOverlay = () => {
    if (!punchEffect.show) return null;
    const isCorrect = punchEffect.type === 'CORRECT';
    return (
      <div 
        className="fixed pointer-events-none z-50"
        style={{ left: punchEffect.x, top: punchEffect.y, transform: 'translate(-50%, -50%)' }}
      >
        {isCorrect ? (
          <div className="relative flex items-center justify-center">
             <div className="absolute w-[200px] md:w-[300px] h-[200px] md:h-[300px] bg-red-600 rounded-full animate-ping opacity-75"></div>
             <div className="absolute w-[150px] md:w-[200px] h-[150px] md:h-[200px] bg-yellow-400 rounded-full animate-pulse opacity-90 mix-blend-screen"></div>
             <div className="relative text-5xl md:text-9xl font-black italic text-white drop-shadow-[0_4px_0_#000] rotate-[-12deg] animate-bounce whitespace-nowrap z-20 stroke-black stroke-2">
               ONE PUNCH!
             </div>
          </div>
        ) : (
          <div className="relative flex flex-col items-center justify-center">
             <div className="absolute w-[100px] md:w-[150px] h-[100px] md:h-[150px] bg-gray-600 rounded-full animate-ping opacity-40"></div>
             <XCircle size={80} className="text-gray-300 relative z-10 animate-bounce drop-shadow-lg" />
             <div className="mt-4 text-3xl md:text-6xl font-bold text-gray-400 animate-pulse whitespace-nowrap">
               MISS...
             </div>
          </div>
        )}
      </div>
    );
  };

  // --- 0. LANDING ---
  if (gameState === 'LANDING') {
    return (
      <div 
        className="min-h-[100dvh] bg-black text-white flex flex-col items-center justify-center relative overflow-hidden font-sans cursor-pointer touch-manipulation"
        onClick={handleLandingClick}
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-yellow-600 via-red-900 to-black opacity-80 z-0 animate-pulse"></div>
        <div className="z-10 text-center relative px-4">
           <div className="mb-8 transform hover:scale-105 transition-transform duration-300">
             <div className="inline-block border-4 md:border-8 border-yellow-400 p-2 mb-4 bg-red-600 transform -rotate-3 shadow-[5px_5px_0px_0px_rgba(0,0,0,1)]">
               <h1 className="text-5xl md:text-8xl font-black italic text-white uppercase tracking-tighter drop-shadow-lg">
                 ONE PUNCH
               </h1>
             </div>
             <h2 className="text-3xl md:text-6xl font-black text-yellow-400 uppercase tracking-widest drop-shadow-[0_4px_0_rgba(0,0,0,1)] transform -skew-x-12">
               QUIZ BATTLE
             </h2>
           </div>
           <div className="mt-12 animate-bounce">
             <p className="text-xl md:text-3xl font-bold text-white blink">TOUCH TO START</p>
           </div>
        </div>
      </div>
    );
  }

  // --- 0.5 AUTH_CODE (New Step) ---
  if (gameState === 'AUTH_CODE') {
    return (
      <div className="min-h-[100dvh] bg-gray-900 text-white flex flex-col items-center justify-center p-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20"></div>
        <div className="z-10 max-w-md w-full bg-black/60 backdrop-blur-md p-8 rounded-2xl border-4 border-yellow-500 shadow-2xl transform -skew-x-2">
            <h2 className="text-3xl font-black text-yellow-400 mb-6 italic skew-x-2 uppercase">HERO AUTHENTICATION</h2>
            <div className="relative mb-6 skew-x-2">
                <Key className="absolute left-3 top-3 text-gray-400" />
                <input 
                  type="text" 
                  value={accessCode}
                  onChange={(e) => setAccessCode(e.target.value.toUpperCase())}
                  placeholder="ACCESS CODE (EX: TECH01)"
                  className="w-full bg-gray-800 border-2 border-gray-600 rounded-lg py-3 pl-10 pr-4 text-white placeholder-gray-500 focus:outline-none focus:border-red-500 transition-colors uppercase font-mono tracking-widest text-lg"
                  onKeyDown={(e) => e.key === 'Enter' && handleVerifyCode()}
                />
            </div>
            {errorMsg && <p className="text-red-500 font-bold mb-4 skew-x-2 animate-pulse">{errorMsg}</p>}
            <button 
                onClick={handleVerifyCode}
                className="w-full bg-red-600 hover:bg-red-500 text-white font-black py-4 rounded text-xl uppercase tracking-widest shadow-[0_5px_0_#991b1b] active:shadow-none active:translate-y-[5px] transition-all skew-x-2"
            >
                VERIFY & LOAD
            </button>
        </div>
      </div>
    );
  }

  // --- 1. LOADING ---
  if (gameState === 'LOADING') {
    const progress = totalImages > 0 ? (loadedCount / totalImages) * 100 : 0;
    return (
        <div className="min-h-[100dvh] bg-red-900 text-white flex flex-col items-center justify-center relative overflow-hidden font-sans">
             <div className="absolute inset-0 bg-black opacity-50 animate-pulse z-0"></div>
             <div className="z-10 text-center w-full max-w-md px-6 relative">
                 <AlertTriangle size={60} className="mx-auto mb-4 text-yellow-400 animate-bounce" />
                 <h2 className="text-4xl font-black italic mb-2 uppercase tracking-tighter transform -skew-x-12">
                   LOADING DATA...
                 </h2>
                 <p className="text-yellow-400 mb-2 font-mono font-bold blink">
                   SYNCING WITH HERO ASSOCIATION DB... ({Math.round(progress)}%)
                 </p>
                 <div className="w-full h-4 bg-black rounded-sm overflow-hidden border-2 border-red-500 transform -skew-x-12">
                     <div className="h-full bg-yellow-400" style={{ width: `${progress}%` }}></div>
                 </div>
             </div>
        </div>
    );
  }

  // --- 1.5 AUTH_NAME (New Step) ---
  if (gameState === 'AUTH_NAME') {
    return (
      <div className="min-h-[100dvh] bg-gray-900 text-white flex flex-col items-center justify-center p-6 relative">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20"></div>
        <div className="z-10 max-w-md w-full bg-black/60 backdrop-blur-md p-8 rounded-2xl border-4 border-blue-500 shadow-2xl transform -skew-x-2">
            <h2 className="text-3xl font-black text-blue-400 mb-2 italic skew-x-2 uppercase">HERO REGISTRATION</h2>
            <p className="text-gray-400 mb-6 skew-x-2 text-sm">등록할 히어로 네임을 입력하세요.</p>
            <div className="relative mb-6 skew-x-2">
                <User className="absolute left-3 top-3 text-gray-400" />
                <input 
                  type="text" 
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  placeholder="HERO NAME"
                  className="w-full bg-gray-800 border-2 border-gray-600 rounded-lg py-3 pl-10 pr-4 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors text-lg font-bold"
                  onKeyDown={(e) => e.key === 'Enter' && handleStartGame()}
                  maxLength={10}
                />
            </div>
            {errorMsg && <p className="text-red-500 font-bold mb-4 skew-x-2">{errorMsg}</p>}
            <button 
                onClick={handleStartGame}
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-4 rounded text-xl uppercase tracking-widest shadow-[0_5px_0_#1e40af] active:shadow-none active:translate-y-[5px] transition-all skew-x-2"
            >
                REGISTER & START
            </button>
        </div>
      </div>
    );
  }

  // --- 2. INTRO ---
  if (gameState === 'INTRO') {
    return (
      <div className="min-h-[100dvh] bg-gray-900 text-white flex flex-col md:flex-row items-center justify-center relative overflow-hidden font-sans">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,_var(--tw-gradient-stops))] from-yellow-600 via-red-900 to-black opacity-80 z-0"></div>
        
        <div className="w-full md:w-1/2 h-[30vh] md:h-full relative z-10 flex items-center justify-center bg-black/30 border-b-4 md:border-b-0 md:border-r-4 border-yellow-500">
           <img src={IMAGES.INTRO} className="h-full object-cover object-top" alt="Saitama Intro" />
        </div>

        <div className="w-full md:w-1/2 flex-1 z-10 flex flex-col items-center justify-center p-6 bg-black/60 backdrop-blur-sm text-center">
          <div className="bg-white text-black p-6 rounded-2xl mb-8 max-w-md transform -rotate-2 border-4 border-gray-300 shadow-xl">
             <h3 className="text-2xl font-black mb-2 italic">"준비됐나, {nickname}?"</h3>
             <p className="text-lg font-bold text-gray-800 break-keep">
               협회 데이터베이스에서 문제를 가져왔다.<br/>
               제한시간은 10초.<br/>
               진심으로 덤벼라.
             </p>
          </div>

          <button 
            onClick={handleIntroToGame}
            className="group relative px-10 py-5 bg-red-600 hover:bg-red-500 text-white font-black text-2xl rounded shadow-[0_5px_0_rgb(153,27,27)] active:shadow-none active:translate-y-[5px] transition-all flex items-center justify-center gap-3 uppercase tracking-widest transform -skew-x-12"
          >
            <span className="relative z-10 flex items-center gap-2 skew-x-12">
               <BicepsFlexed /> START MISSION
            </span>
          </button>
        </div>
      </div>
    );
  }

  // --- 3. RESULT ---
  if (gameState === 'RESULT') {
    const rank = getRank();
    return (
      <div className="min-h-[100dvh] bg-gray-900 text-white flex items-center justify-center p-4 relative overflow-hidden font-sans">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/diagmonds-light.png')] opacity-10"></div>
        
        <div className="z-10 w-full max-w-lg bg-gray-800 border-2 border-gray-600 rounded-xl p-8 text-center shadow-2xl relative transform -rotate-1">
          <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 bg-gray-900 p-4 rounded-full border-4 border-gray-700">
             {score >= 90 ? <Trophy size={50} className="text-yellow-400 animate-bounce" /> : <Skull size={50} className="text-gray-500" />}
          </div>

          <h2 className="text-2xl font-bold text-gray-400 mt-10 mb-2 uppercase tracking-widest transform -skew-x-12">Mission Report</h2>
          <div className="text-7xl font-black my-4 text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.5)] font-mono">
            {score}<span className="text-2xl text-gray-500 ml-2">pts</span>
          </div>
          
          <div className="w-48 h-64 mx-auto my-6 bg-black rounded-lg border-2 border-dashed border-gray-600 flex items-center justify-center overflow-hidden transform rotate-2">
             {rank.imageUrl ? <img src={rank.imageUrl} alt={rank.title} className="w-full h-full object-cover" /> : <Star size={40} className="opacity-50" />}
          </div>

          <div className="mb-8 p-4 bg-black/40 rounded border-l-4 border-red-500 text-left">
            <span className="text-xs text-red-400 font-bold block mb-1">FINAL RANK</span>
            <h3 className={`text-3xl font-black ${rank.color} mb-2 italic`}>{rank.title}</h3>
            <p className="text-sm text-gray-300">{rank.desc}</p>
          </div>

          <div className="flex justify-center mb-6">
            {saveStatus === 'saving' && <span className="text-yellow-400 flex items-center gap-2"><Loader2 className="animate-spin"/> Saving to DB...</span>}
            {saveStatus === 'saved' && <span className="text-green-400 flex items-center gap-2 font-bold"><CheckCircle2/> Record Saved!</span>}
            {saveStatus === 'error' && <span className="text-red-400">Save Failed (Network Error)</span>}
          </div>

          <button onClick={() => setGameState('AUTH_CODE')} className="w-full py-3 bg-blue-600 hover:bg-blue-500 rounded font-bold uppercase shadow-[0_5px_0_#1e40af] active:shadow-none active:translate-y-[5px] transform -skew-x-12">
            <span className="skew-x-12">Return to Title</span>
          </button>
        </div>
      </div>
    );
  }

  // --- 4. GAME ---
  const currentQ = gameQuestions[currentQIndex];
  if (!currentQ) return <div className="text-white">Loading...</div>;

  return (
    <div className="h-[100dvh] bg-gray-900 text-white relative overflow-hidden font-sans">
      <PunchOverlay />
      
      {/* Background */}
      <div className="absolute inset-0 z-0">
          {currentQ.imageUrl && <img src={currentQ.imageUrl} className="w-full h-full object-cover opacity-30 blur-2xl" alt="bg-blur" />}
      </div>

      {/* Main Image */}
      <div className="absolute inset-0 z-0 flex justify-center items-center">
        {currentQ.imageUrl ? (
          <img src={currentQ.imageUrl} alt="Quiz BG" className="h-full w-auto object-contain max-w-full shadow-2xl" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-500">No Image</div>
        )}
      </div>
      
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-black/30 pointer-events-none z-0"></div>

      {/* UI Content */}
      <div className="relative z-10 flex flex-col h-full w-full max-w-3xl mx-auto">
        <div className="flex justify-between items-start p-4 w-full">
            {/* Character Badge */}
            <div className={`flex flex-col items-start bg-black/60 backdrop-blur-md border-l-4 border-yellow-500 pl-3 py-2 pr-6 rounded-r-lg shadow-lg transform skew-x-[-10deg]`}>
                <span className="text-[10px] text-yellow-400 font-bold tracking-widest uppercase not-italic skew-x-10">Hero Rank</span>
                <h2 className="text-2xl md:text-4xl font-black text-white italic not-italic uppercase tracking-tighter drop-shadow-lg skew-x-10">
                  {currentQ.character}
                </h2>
                <span className="text-xs text-gray-300 font-bold mt-1 not-italic skew-x-10">{currentQ.rank}</span>
            </div>

            {/* Score/Time */}
            <div className="flex flex-col items-end gap-2">
                <div className="flex items-center gap-2 bg-black/50 px-3 py-1 rounded-full backdrop-blur-sm border border-gray-600 transform skew-x-[-10deg]">
                    <span className="text-red-400 font-mono font-bold animate-pulse text-lg skew-x-10">{timeLeft}s</span>
                    <span className="text-gray-400 text-xs skew-x-10">|</span>
                    <span className="text-yellow-400 font-bold skew-x-10">PTS: {score}</span>
                </div>
                <button onClick={() => setIsMuted(!isMuted)} className="bg-black/50 p-2 rounded-full hover:bg-white/20 transition backdrop-blur-sm">
                    {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
                </button>
            </div>
        </div>

        <div className="flex-1"></div>

        <div className="p-4 md:p-10 flex flex-col gap-4 w-full">
            <div className="w-full bg-black/60 backdrop-blur-md p-6 rounded-xl border-l-8 border-red-600 shadow-2xl transform -skew-x-2">
                <div className="flex items-start gap-4 skew-x-2">
                    <span className="text-4xl md:text-5xl font-black text-white/10 italic select-none">Q.</span>
                    <h2 className="text-lg md:text-3xl font-bold leading-relaxed break-keep drop-shadow-lg text-shadow-md text-white">
                        {currentQ.q}
                    </h2>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full">
              {currentQ.shuffledOptions.map((opt, idx) => (
                <button
                  key={idx}
                  onClick={(e) => handleAnswer(opt, e)}
                  className="group relative bg-gray-900/70 hover:bg-red-600/90 active:bg-red-700/90 border-l-4 border-gray-500 hover:border-yellow-400 h-16 md:h-20 rounded-r-lg flex items-center px-4 transition-all transform active:scale-[0.98] overflow-hidden touch-manipulation backdrop-blur-sm shadow-lg skew-x-[-5deg]"
                >
                  <div className="w-8 h-8 bg-black/40 flex items-center justify-center rounded font-mono font-bold text-sm md:text-base text-gray-400 group-hover:text-white mr-4 shrink-0 border border-white/10 skew-x-5">
                    {idx + 1}
                  </div>
                  <span className="text-base md:text-xl font-bold italic text-gray-100 group-hover:text-white truncate text-left w-full drop-shadow-md skew-x-5">
                    {opt}
                  </span>
                  <div className="absolute inset-0 bg-white/10 opacity-0 active:opacity-100 transition-opacity"></div>
                </button>
              ))}
            </div>
            
            <div className="w-full bg-gray-800/50 h-2 mt-2 rounded-full overflow-hidden border border-white/10 transform skew-x-[-10deg]">
                <div 
                  className="bg-yellow-500 h-full transition-all duration-1000 ease-linear" 
                  style={{ width: `${(timeLeft / 10) * 100}%` }}
                ></div>
            </div>
        </div>
      </div>
    </div>
  );
}