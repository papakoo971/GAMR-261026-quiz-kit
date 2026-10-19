import React, { useEffect, useState } from 'react';
import OnePunchQuiz from './games/OnePunchQuiz.jsx';
import MarioQuiz from './games/MarioQuiz.jsx';
import BattleQuiz from './games/BattleQuiz.jsx';
import { GOOGLE_SCRIPT_URL, SITE_TITLE } from './config.js';

// 주소 뒤의 #onepunch, #mario, #battle 로 게임을 고릅니다.
const GAMES = [
  { id: 'onepunch', title: '원펀맨 퀴즈', type: 'O', desc: '10초 안에 정답을 골라 원펀치!', color: 'from-yellow-400 to-red-500', Component: OnePunchQuiz },
  { id: 'mario', title: '마리오 퀴즈', type: 'S', desc: '정답 블록을 머리로 쳐서 스테이지 클리어', color: 'from-red-500 to-blue-600', Component: MarioQuiz },
  { id: 'battle', title: '얼티밋 배틀', type: 'U', desc: '정답을 맞혀 상대의 HP를 깎는 1:1 대전', color: 'from-blue-500 to-purple-700', Component: BattleQuiz },
];

const readHash = () => window.location.hash.replace('#', '');

export default function App() {
  const [gameId, setGameId] = useState(readHash());

  useEffect(() => {
    const onHash = () => setGameId(readHash());
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  const game = GAMES.find(g => g.id === gameId);
  if (game) return <game.Component />;

  const notConfigured = !GOOGLE_SCRIPT_URL.startsWith('https://script.google.com/');

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col items-center justify-center p-4">
      <h1 className="text-3xl md:text-5xl font-black mb-2 text-center">{SITE_TITLE}</h1>
      <p className="text-gray-400 mb-8 text-center">플레이할 게임을 고르세요</p>

      {notConfigured && (
        <div className="mb-6 max-w-xl w-full rounded-lg border border-yellow-500 bg-yellow-500/10 p-4 text-yellow-200 text-sm">
          아직 구글 시트가 연결되지 않았습니다. <code className="font-mono">src/config.js</code>의
          <code className="font-mono"> GOOGLE_SCRIPT_URL</code>에 내 웹 앱 주소를 넣어 주세요.
        </div>
      )}

      <div className="grid gap-4 w-full max-w-xl">
        {GAMES.map(g => (
          <a
            key={g.id}
            href={`#${g.id}`}
            className={`block rounded-xl p-5 bg-gradient-to-r ${g.color} shadow-lg hover:scale-[1.02] transition-transform`}
          >
            <div className="text-xl font-bold">{g.title}</div>
            <div className="text-sm opacity-90">{g.desc}</div>
          </a>
        ))}
      </div>
    </div>
  );
}
