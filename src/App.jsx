import React, { useState, useEffect, useRef } from 'react';
import {
  Gavel,
  Plus,
  Trash2,
  Play,
  Pause,
  Trophy,
  Settings,
  X,
  SkipForward,
  RotateCcw,
  Users,
  Crown,
  ChevronRight,
  BookOpen,
  Scale,
} from 'lucide-react';

// ============================================================================
// DEBATE TOPICS — Edit this list to add, remove, or change debate prompts.
// Just follow the format: "Your debate topic here",
// ============================================================================
const DEBATE_TOPICS = [
  'Who would be a better kisser: Donald Trump or Joe Biden?',
  'Pineapple belongs on pizza.',
  'Cereal is a soup.',
  'A hot dog is a sandwich.',
  'Blue bubbles are better than green bubbles.',
  'Cats are smarter than dogs.',
  'Socks with sandals should be socially acceptable.',
  'The toilet paper roll goes OVER, not under.',
  'Accountants are the bad boys of the business world.',
  'You can be friends with the opposite sex with no feelings developing.',
  'LeBron is better than Jordan.',
  'Reality TV is the highest form of art.',
  'Taylor Swift is overrated.',
  'Crocs are high fashion.',
  "Mondays aren't actually that bad.",
  'Water is wet.',
  'Ghosts are real.',
  'Pop music peaked in the 2000s.',
  "It's okay to wear pajamas in public.",
  'Cardio is better than lifting weights.',
  'Morning people are superior to night owls.',
  'The dress was blue and black. End of story.',
  'Fast food is better than fine dining.',
  'Gen Z ruined dating.',
  'Boomers had it easier.',
  "Texting 'k' is a declaration of war.",
  'Vacuuming is therapeutic.',
  'Dogs should be allowed in every restaurant.',
  'The Beatles are overrated.',
  'Romantic comedies are the best genre of film.',
  'Being 10 minutes late is basically on time.',
  'Ranch goes on everything.',
  'AI will eventually take over the world.',
  'Reading the book is always better than watching the movie.',
  'Everyone secretly loves Nickelback.',
  'Bigfoot exists.',
  'The moon landing was staged.',
  'Cilantro tastes like soap and should be banned.',
  'Group texts should require a permission slip.',
  'Working from home is better than the office.',
  'Christmas music should be played year-round.',
  'Coffee is better than tea.',
  'New York pizza beats Chicago pizza.',
  'Karaoke is a cry for help.',
  'Clowns are terrifying and should be outlawed.',
  'Being a flat-earther takes commitment and deserves respect.',
  'Dad jokes are the highest form of humor.',
  'Everyone should be required to take an improv class.',
  'Social media is the downfall of society.',
  "It's fine to wear white after Labor Day.",
];

// ============================================================================
// ADVANTAGE & DISADVANTAGE CARDS — Optional twists drawn each round
// ============================================================================
const ADVANTAGES = [
  'Bring in the legal team: pick another player to help you debate.',
  'Double your argument time.',
  'Your opponent must speak in a whisper.',
  'You get to start with a 10-second head start.',
  'You can demand a fact-check interruption from the group.',
];

const DISADVANTAGES = [
  'You have to argue while dancing.',
  'You must speak in a British accent the entire time.',
  "You can't use the word 'the'.",
  "You must end every sentence with 'your honor'.",
  'You have to argue in the voice of a cartoon character.',
  'You must hold a yoga pose the entire round.',
];

// ============================================================================

export default function ThatsDebatable() {
  const [screen, setScreen] = useState('home'); // home, setup, play, winner, settings
  const [players, setPlayers] = useState([]);
  const [newPlayerName, setNewPlayerName] = useState('');
  const [winsToWin, setWinsToWin] = useState(3);
  const [timerSeconds, setTimerSeconds] = useState(45);
  const [useTwists, setUseTwists] = useState(true);

  // Round state
  const [currentDebaters, setCurrentDebaters] = useState([null, null]);
  const [currentTopic, setCurrentTopic] = useState('');
  const [currentTwist, setCurrentTwist] = useState(null);
  const [activeDebater, setActiveDebater] = useState(0); // 0 or 1
  const [timeLeft, setTimeLeft] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [roundPhase, setRoundPhase] = useState('intro'); // intro, debater1, transition, debater2, vote
  const [gameWinner, setGameWinner] = useState(null);
  const [roundNumber, setRoundNumber] = useState(0);
  const [usedTopics, setUsedTopics] = useState([]);

  const timerRef = useRef(null);
  const audioCtxRef = useRef(null);

  // Sound effects using Web Audio API (no external files needed)
  const playSound = (type) => {
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext ||
          window.webkitAudioContext)();
      }
      const ctx = audioCtxRef.current;
      const now = ctx.currentTime;

      if (type === 'buzzer') {
        // Gavel bang / buzzer
        for (let i = 0; i < 3; i++) {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'square';
          osc.frequency.setValueAtTime(220, now + i * 0.15);
          osc.frequency.exponentialRampToValueAtTime(80, now + i * 0.15 + 0.1);
          gain.gain.setValueAtTime(0.3, now + i * 0.15);
          gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.15 + 0.12);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now + i * 0.15);
          osc.stop(now + i * 0.15 + 0.12);
        }
      } else if (type === 'tick') {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.value = 800;
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.05);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.05);
      } else if (type === 'fanfare') {
        const notes = [523, 659, 784, 1047];
        notes.forEach((freq, i) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.value = freq;
          gain.gain.setValueAtTime(0.2, now + i * 0.1);
          gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.1 + 0.3);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now + i * 0.1);
          osc.stop(now + i * 0.1 + 0.3);
        });
      }
    } catch (e) {
      // silently fail if audio doesn't work
    }
  };

  // Timer effect
  useEffect(() => {
    if (isTimerRunning && timeLeft > 0) {
      timerRef.current = setTimeout(() => {
        if (timeLeft <= 4 && timeLeft > 1) playSound('tick');
        setTimeLeft((t) => t - 1);
      }, 1000);
    } else if (isTimerRunning && timeLeft === 0) {
      setIsTimerRunning(false);
      playSound('buzzer');
      if (roundPhase === 'debater1') {
        setRoundPhase('transition');
      } else if (roundPhase === 'debater2') {
        setRoundPhase('vote');
      }
    }
    return () => clearTimeout(timerRef.current);
  }, [isTimerRunning, timeLeft, roundPhase]);

  const addPlayer = () => {
    const name = newPlayerName.trim();
    if (!name) return;
    if (players.some((p) => p.name.toLowerCase() === name.toLowerCase()))
      return;
    setPlayers([...players, { name, wins: 0, id: Date.now() }]);
    setNewPlayerName('');
  };

  const removePlayer = (id) => {
    setPlayers(players.filter((p) => p.id !== id));
  };

  const startGame = () => {
    if (players.length < 2) return;
    setPlayers(players.map((p) => ({ ...p, wins: 0 })));
    setRoundNumber(0);
    setUsedTopics([]);
    setGameWinner(null);
    startNewRound(players.map((p) => ({ ...p, wins: 0 })));
    setScreen('play');
  };

  const startNewRound = (playerList = players) => {
    // Pick two random players
    const shuffled = [...playerList].sort(() => Math.random() - 0.5);
    const debaters = [shuffled[0], shuffled[1]];

    // Pick a topic not yet used
    let availableTopics = DEBATE_TOPICS.filter((t) => !usedTopics.includes(t));
    if (availableTopics.length === 0) {
      setUsedTopics([]);
      availableTopics = DEBATE_TOPICS;
    }
    const topic =
      availableTopics[Math.floor(Math.random() * availableTopics.length)];
    setUsedTopics((prev) => [...prev, topic]);

    // Maybe pick a twist — biased toward balancing the game
    let twist = null;
    if (useTwists && Math.random() < 0.45) {
      const wins0 = debaters[0].wins;
      const wins1 = debaters[1].wins;
      const diff = wins0 - wins1; // positive = player 0 ahead, negative = player 1 ahead

      // Who gets the twist, and what kind?
      // If someone's ahead, lean toward giving them a disadvantage OR the underdog an advantage
      let targetPlayer, twistType;

      if (diff === 0) {
        // Tied — totally random
        targetPlayer = Math.random() < 0.5 ? 0 : 1;
        twistType = Math.random() < 0.5 ? 'advantage' : 'disadvantage';
      } else {
        const leader = diff > 0 ? 0 : 1;
        const underdog = diff > 0 ? 1 : 0;
        // Bias strength scales with how far ahead the leader is (capped)
        const gap = Math.min(Math.abs(diff), 3);
        // At gap=1: ~65% balancing; at gap=3: ~85% balancing
        const balancingChance = 0.55 + gap * 0.1;

        if (Math.random() < balancingChance) {
          // Balancing twist: disadvantage the leader OR advantage the underdog (50/50)
          if (Math.random() < 0.5) {
            targetPlayer = leader;
            twistType = 'disadvantage';
          } else {
            targetPlayer = underdog;
            twistType = 'advantage';
          }
        } else {
          // Chaos twist: the opposite (keeps it unpredictable)
          if (Math.random() < 0.5) {
            targetPlayer = underdog;
            twistType = 'disadvantage';
          } else {
            targetPlayer = leader;
            twistType = 'advantage';
          }
        }
      }

      const pool = twistType === 'advantage' ? ADVANTAGES : DISADVANTAGES;
      twist = {
        type: twistType,
        text: pool[Math.floor(Math.random() * pool.length)],
        forPlayer: targetPlayer,
      };
    }

    setCurrentDebaters(debaters);
    setCurrentTopic(topic);
    setCurrentTwist(twist);
    setActiveDebater(0);
    setTimeLeft(timerSeconds);
    setIsTimerRunning(false);
    setRoundPhase('intro');
    setRoundNumber((n) => n + 1);
  };

  const beginDebater = (index) => {
    setActiveDebater(index);
    setTimeLeft(timerSeconds);
    setIsTimerRunning(true);
    setRoundPhase(index === 0 ? 'debater1' : 'debater2');
  };

  const pauseTimer = () => setIsTimerRunning(false);
  const resumeTimer = () => setIsTimerRunning(true);

  const skipTimer = () => {
    setIsTimerRunning(false);
    setTimeLeft(0);
    playSound('buzzer');
    if (roundPhase === 'debater1') setRoundPhase('transition');
    else if (roundPhase === 'debater2') setRoundPhase('vote');
  };

  const selectWinner = (winnerIndex) => {
    const winner = currentDebaters[winnerIndex];
    const updated = players.map((p) =>
      p.id === winner.id ? { ...p, wins: p.wins + 1 } : p
    );
    setPlayers(updated);

    const winnerWins = updated.find((p) => p.id === winner.id).wins;
    if (winnerWins >= winsToWin) {
      setGameWinner({ ...winner, wins: winnerWins });
      playSound('fanfare');
      setScreen('winner');
    } else {
      startNewRound(updated);
    }
  };

  const resetGame = () => {
    setPlayers(players.map((p) => ({ ...p, wins: 0 })));
    setGameWinner(null);
    setScreen('setup');
  };

  const fullReset = () => {
    setPlayers([]);
    setGameWinner(null);
    setScreen('home');
  };

  // ============ SCREENS ============

  const JudgeIllustration = ({ size = 'w-32 h-32' }) => (
    <div className={`${size} relative flex items-center justify-center`}>
      <img src="/judge.png" alt="Judge" className="w-full h-full object-contain drop-shadow-2xl" />
    </div>
  );

  // ============ HOME SCREEN ============
  if (screen === 'home') {
    return (
      <div
        className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6 overflow-hidden relative"
        style={{ fontFamily: "'Cinzel', 'Playfair Display', Georgia, serif" }}
      >
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;900&family=IM+Fell+English+SC&family=IM+Fell+English:ital@0;1&family=Playfair+Display:wght@400;700;900&display=swap');
          @keyframes slam { 0%,100% { transform: rotate(-3deg) translateY(0); } 50% { transform: rotate(5deg) translateY(-8px); } }
          @keyframes shake { 0%,100% { transform: translateX(0); } 25% { transform: translateX(-3px); } 75% { transform: translateX(3px); } }
          @keyframes pulseRed { 0%,100% { box-shadow: 0 0 40px rgba(220,38,38,0.4); } 50% { box-shadow: 0 0 80px rgba(220,38,38,0.8); } }
          @keyframes fadeUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
          .judge-slam { animation: slam 3s ease-in-out infinite; transform-origin: bottom center; }
          .title-font { font-family: 'IM Fell English SC', 'IM Fell English', Georgia, serif; }
          .fade-up { animation: fadeUp 0.8s ease-out forwards; opacity: 0; }
          .grain::before { content: ''; position: absolute; inset: 0; background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9'/%3E%3C/filter%3E%3Crect width='100' height='100' filter='url(%23n)' opacity='0.15'/%3E%3C/svg%3E"); pointer-events: none; opacity: 0.3; }
        `}</style>

        {/* Background atmosphere */}
        <div className="absolute inset-0 bg-gradient-to-b from-black via-zinc-900 to-black"></div>
        <div className="absolute inset-0 grain"></div>
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-red-900/20 rounded-full blur-3xl"></div>

        <div className="relative z-10 flex flex-col items-center">
          <div
            className="judge-slam fade-up"
            style={{ animationDelay: '0.1s' }}
          >
            <JudgeIllustration size="w-48 h-48" />
          </div>

          <h1
            className="title-font text-7xl md:text-8xl text-white mt-4 text-center leading-[0.95] fade-up"
            style={{
              animationDelay: '0.3s',
              textShadow:
                '4px 4px 0 rgba(220,38,38,0.4), 0 0 60px rgba(255,255,255,0.15)',
              letterSpacing: '0.01em',
            }}
          >
            That's
            <br />
            Debatable
          </h1>

          <p
            className="mt-6 text-zinc-400 italic text-lg tracking-wider fade-up"
            style={{
              animationDelay: '0.5s',
              fontFamily: "'Playfair Display', serif",
            }}
          >
            Logic, Laughter & Ludicrous debates
          </p>

          <div
            className="mt-12 flex flex-col gap-4 w-full max-w-sm fade-up"
            style={{ animationDelay: '0.7s' }}
          >
            <button
              onClick={() => setScreen('setup')}
              className="group relative bg-red-700 hover:bg-red-600 text-white font-black text-xl py-5 px-8 rounded-sm tracking-widest uppercase border-2 border-red-500 transition-all hover:scale-105 active:scale-95"
              style={{
                animation: 'pulseRed 3s ease-in-out infinite',
                fontFamily: "'Cinzel', serif",
              }}
            >
              <span className="flex items-center justify-center gap-3">
                <Gavel className="w-6 h-6" />
                Order in the Court
              </span>
            </button>

            <button
              onClick={() => setScreen('rules')}
              className="bg-zinc-900 hover:bg-zinc-800 text-white text-sm tracking-widest uppercase py-4 border-2 border-zinc-700 hover:border-zinc-500 transition-all flex items-center justify-center gap-2"
            >
              <BookOpen className="w-4 h-4" /> How to Play
            </button>

            <button
              onClick={() => setScreen('settings')}
              className="text-zinc-400 hover:text-white text-sm tracking-widest uppercase py-3 transition-colors flex items-center justify-center gap-2"
            >
              <Settings className="w-4 h-4" /> Settings
            </button>
          </div>
        </div>

        <div className="absolute bottom-4 text-zinc-600 text-xs tracking-widest uppercase">
          A Good Company Game
        </div>
      </div>
    );
  }

  // ============ SETTINGS ============
  if (screen === 'settings') {
    return (
      <div
        className="min-h-screen bg-black text-white p-6"
        style={{ fontFamily: "'Cinzel', serif" }}
      >
        <style>{`@import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;900&family=IM+Fell+English+SC&family=IM+Fell+English:ital@0;1&display=swap'); .title-font { font-family: 'IM Fell English SC', 'IM Fell English', Georgia, serif; }`}</style>
        <div className="max-w-md mx-auto pt-8">
          <div className="flex items-center justify-between mb-8">
            <h2 className="title-font text-4xl">Settings</h2>
            <button
              onClick={() => setScreen('home')}
              className="p-2 hover:bg-zinc-800 rounded-full"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="space-y-6">
            <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-sm">
              <label className="text-sm uppercase tracking-widest text-zinc-400">
                Timer per Debater
              </label>
              <div className="flex items-center gap-3 mt-3">
                <input
                  type="range"
                  min="15"
                  max="120"
                  step="5"
                  value={timerSeconds}
                  onChange={(e) => setTimerSeconds(+e.target.value)}
                  className="flex-1 accent-red-600"
                />
                <span className="text-3xl font-black text-red-500 w-20 text-right">
                  {timerSeconds}s
                </span>
              </div>
            </div>

            <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-sm">
              <label className="text-sm uppercase tracking-widest text-zinc-400">
                Rounds to Win
              </label>
              <div className="flex items-center gap-3 mt-3">
                <input
                  type="range"
                  min="1"
                  max="10"
                  step="1"
                  value={winsToWin}
                  onChange={(e) => setWinsToWin(+e.target.value)}
                  className="flex-1 accent-red-600"
                />
                <span className="text-3xl font-black text-red-500 w-20 text-right">
                  {winsToWin}
                </span>
              </div>
            </div>

            <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-sm flex items-center justify-between">
              <div>
                <div className="text-sm uppercase tracking-widest text-zinc-400">
                  Advantage/Disadvantage Cards
                </div>
                <div className="text-xs text-zinc-500 mt-1">
                  Twists thrown into random rounds
                </div>
              </div>
              <button
                onClick={() => setUseTwists(!useTwists)}
                className={`w-14 h-8 rounded-full relative transition-colors ${
                  useTwists ? 'bg-red-600' : 'bg-zinc-700'
                }`}
              >
                <div
                  className={`absolute top-1 w-6 h-6 rounded-full bg-white transition-transform ${
                    useTwists ? 'translate-x-7' : 'translate-x-1'
                  }`}
                ></div>
              </button>
            </div>
          </div>

          <button
            onClick={() => setScreen('home')}
            className="mt-8 w-full bg-white text-black font-black py-4 uppercase tracking-widest hover:bg-zinc-200"
          >
            Save & Return
          </button>
        </div>
      </div>
    );
  }

  // ============ RULES / HOW TO PLAY ============
  if (screen === 'rules') {
    const rules = [
      {
        num: '1',
        title: 'Assemble the Court',
        body: 'Add every player who wants to debate on the setup screen. You need at least 2 players — the more the merrier.',
      },
      {
        num: '2',
        title: 'The App is the Judge',
        body: 'Each round, the app randomly selects two players from your roster and delivers a debate topic from the docket. No arguing with the judge — the judge is impartial (and also a computer).',
      },
      {
        num: '3',
        title: 'Pick Your Side',
        body: 'The first debater chooses whether to argue for (pro) or against (con) the topic. The second debater automatically takes the opposing side.',
      },
      {
        num: '4',
        title: 'Make Your Case',
        body: 'The first debater gets uninterrupted argument time (45 seconds by default — tweak it in Settings). When the buzzer hits, the floor passes to the second debater for the same amount of time.',
      },
      {
        num: '5',
        title: 'Advantage & Disadvantage Cards',
        body: "Some rounds come with a twist. Advantage cards help the debater they're assigned to (extra time, a teammate, etc.). Disadvantage cards make life harder (argue while dancing, speak in a British accent, etc.). The app favors handing disadvantages to whoever is winning and advantages to whoever is falling behind — to keep things close.",
      },
      {
        num: '6',
        title: 'Render the Verdict',
        body: 'After both debaters have argued, every other player acts as the jury and votes on who argued best. Tap the winner on the verdict screen.',
      },
      {
        num: '7',
        title: 'First to Win Claims the Gavel',
        body: `The winner of each round earns a point. The first player to reach the win target (${winsToWin} by default, adjustable in Settings) is crowned the Ultimate Debater.`,
      },
    ];

    return (
      <div
        className="min-h-screen bg-black text-white p-6 pb-24"
        style={{ fontFamily: "'Cinzel', serif" }}
      >
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;900&family=IM+Fell+English+SC&family=IM+Fell+English:ital@0;1&family=Playfair+Display:ital,wght@0,400;1,400&display=swap');
          .title-font { font-family: 'IM Fell English SC', 'IM Fell English', Georgia, serif; }
          .body-serif { font-family: 'Playfair Display', Georgia, serif; }
          @keyframes fadeSlide { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
          .rule-in { animation: fadeSlide 0.5s ease-out forwards; opacity: 0; }
        `}</style>

        <div className="max-w-xl mx-auto">
          <div className="flex items-center justify-between pt-4 mb-8">
            <button
              onClick={() => setScreen('home')}
              className="text-zinc-500 hover:text-white text-sm tracking-widest uppercase flex items-center gap-1"
            >
              ← Back
            </button>
            <button
              onClick={() => setScreen('home')}
              className="p-2 hover:bg-zinc-800 rounded-full"
              aria-label="Close"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Header */}
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center gap-3 text-red-500 text-xs tracking-[0.3em] uppercase mb-3">
              <Scale className="w-4 h-4" />
              <span>Official Rules</span>
              <Scale className="w-4 h-4" />
            </div>
            <h2
              className="title-font text-5xl md:text-6xl leading-none"
              style={{ textShadow: '3px 3px 0 rgba(220,38,38,0.4)' }}
            >
              How to Play
            </h2>
            <div className="flex items-center justify-center gap-2 mt-4 text-zinc-500 text-xs tracking-widest">
              <div className="h-px w-8 bg-zinc-700"></div>
              <span>Hear ye, hear ye</span>
              <div className="h-px w-8 bg-zinc-700"></div>
            </div>
          </div>

          {/* Objective card */}
          <div className="bg-gradient-to-br from-red-950/40 to-zinc-900 border-2 border-red-800/60 p-6 mb-8 relative">
            <div className="absolute top-2 left-3 text-red-500/60 text-[10px] tracking-[0.2em] uppercase">
              Objective
            </div>
            <div className="flex items-start gap-4 pt-3">
              <Gavel className="w-8 h-8 text-red-500 flex-shrink-0 mt-1" />
              <div>
                <div className="title-font text-2xl leading-tight">
                  Be the best debater.
                </div>
                <div className="body-serif italic text-zinc-400 mt-1">
                  Be convincing by any means necessary.
                </div>
              </div>
            </div>
          </div>

          {/* Rules list */}
          <div className="space-y-4">
            {rules.map((rule, i) => (
              <div
                key={rule.num}
                className="rule-in bg-zinc-900/60 border border-zinc-800 p-5 hover:border-red-900 transition-colors"
                style={{ animationDelay: `${i * 0.08}s` }}
              >
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-10 h-10 bg-red-700 border border-red-500 flex items-center justify-center font-black text-lg">
                    {rule.num}
                  </div>
                  <div className="flex-1">
                    <div className="title-font text-xl text-white leading-none mb-2">
                      {rule.title}
                    </div>
                    <div className="body-serif text-zinc-300 leading-relaxed text-[15px]">
                      {rule.body}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Tip card */}
          <div className="mt-8 border-l-4 border-red-600 bg-zinc-950 pl-4 py-3">
            <div className="text-red-500 text-[10px] tracking-[0.2em] uppercase mb-1">
              Pro Tip
            </div>
            <div className="body-serif italic text-zinc-300 text-sm">
              Facts are optional. Confidence is mandatory. When in doubt, bang
              the metaphorical gavel.
            </div>
          </div>

          {/* CTA */}
          <button
            onClick={() => setScreen('setup')}
            className="mt-10 w-full bg-red-700 hover:bg-red-600 font-black text-xl py-5 tracking-widest uppercase border-2 border-red-500 transition-all active:scale-95 flex items-center justify-center gap-3"
          >
            <Gavel className="w-6 h-6" /> I'm Ready — Let's Debate
          </button>
        </div>
      </div>
    );
  }

  // ============ SETUP SCREEN ============
  if (screen === 'setup') {
    return (
      <div
        className="min-h-screen bg-black text-white p-6"
        style={{ fontFamily: "'Cinzel', serif" }}
      >
        <style>{`@import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;900&family=IM+Fell+English+SC&family=IM+Fell+English:ital@0;1&display=swap'); .title-font { font-family: 'IM Fell English SC', 'IM Fell English', Georgia, serif; } @keyframes slideIn { from { opacity: 0; transform: translateX(-10px); } to { opacity: 1; transform: translateX(0); } } .slide-in { animation: slideIn 0.3s ease-out; }`}</style>

        <div className="max-w-md mx-auto pt-8">
          <button
            onClick={() => setScreen('home')}
            className="text-zinc-500 hover:text-white text-sm mb-6 tracking-widest uppercase"
          >
            ← Back
          </button>

          <h2 className="title-font text-5xl mb-2">The Defendants</h2>
          <p className="text-zinc-400 text-sm tracking-widest uppercase mb-8">
            Add your debaters
          </p>

          <div className="flex gap-2 mb-6">
            <input
              type="text"
              value={newPlayerName}
              onChange={(e) => setNewPlayerName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addPlayer()}
              placeholder="Enter player name..."
              className="flex-1 bg-zinc-900 border-2 border-zinc-800 focus:border-red-600 outline-none px-4 py-3 text-white placeholder-zinc-600"
              maxLength={20}
            />
            <button
              onClick={addPlayer}
              className="bg-red-700 hover:bg-red-600 px-5 border-2 border-red-500 transition-all active:scale-95"
              aria-label="Add player"
            >
              <Plus className="w-6 h-6" />
            </button>
          </div>

          <div className="space-y-2 mb-8 min-h-[120px]">
            {players.length === 0 && (
              <div className="text-center text-zinc-600 italic py-8 border-2 border-dashed border-zinc-800">
                No debaters yet. Add at least 2 to begin.
              </div>
            )}
            {players.map((p, i) => (
              <div
                key={p.id}
                className="slide-in flex items-center justify-between bg-zinc-900 border border-zinc-800 px-4 py-3 group hover:border-red-800 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-red-700 flex items-center justify-center font-black text-sm">
                    {i + 1}
                  </div>
                  <span className="font-semibold text-lg">{p.name}</span>
                </div>
                <button
                  onClick={() => removePlayer(p.id)}
                  className="text-zinc-600 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            ))}
          </div>

          <div className="bg-zinc-900/50 border border-zinc-800 p-4 mb-6 text-sm">
            <div className="flex items-center justify-between text-zinc-400">
              <span>Timer:</span>{' '}
              <span className="text-white font-bold">
                {timerSeconds}s per debater
              </span>
            </div>
            <div className="flex items-center justify-between text-zinc-400 mt-1">
              <span>First to win:</span>{' '}
              <span className="text-white font-bold">{winsToWin} rounds</span>
            </div>
          </div>

          <button
            onClick={startGame}
            disabled={players.length < 2}
            className="w-full bg-red-700 hover:bg-red-600 disabled:bg-zinc-800 disabled:text-zinc-600 text-white font-black text-xl py-5 tracking-widest uppercase border-2 border-red-500 disabled:border-zinc-700 transition-all active:scale-95 flex items-center justify-center gap-3"
          >
            <Gavel className="w-6 h-6" /> Begin Trial
          </button>
        </div>
      </div>
    );
  }

  // ============ PLAY SCREEN ============
  if (screen === 'play') {
    const [p1, p2] = currentDebaters;
    const currentPlayer = currentDebaters[activeDebater];
    const timerPercent = (timeLeft / timerSeconds) * 100;
    const isLowTime = timeLeft <= 10 && isTimerRunning;

    return (
      <div
        className="min-h-screen bg-black text-white flex flex-col"
        style={{ fontFamily: "'Cinzel', serif" }}
      >
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;900&family=IM+Fell+English+SC&family=IM+Fell+English:ital@0;1&display=swap');
          .title-font { font-family: 'IM Fell English SC', 'IM Fell English', Georgia, serif; }
          @keyframes slamIn { 0% { transform: scale(1.5) rotate(-10deg); opacity: 0; } 60% { transform: scale(0.95) rotate(2deg); } 100% { transform: scale(1) rotate(0); opacity: 1; } }
          @keyframes urgentPulse { 0%,100% { background-color: rgb(185, 28, 28); } 50% { background-color: rgb(239, 68, 68); } }
          .slam-in { animation: slamIn 0.6s cubic-bezier(0.34, 1.56, 0.64, 1); }
          .urgent { animation: urgentPulse 0.5s ease-in-out infinite; }
        `}</style>

        {/* Header scoreboard */}
        <div className="bg-zinc-950 border-b border-zinc-800 px-4 py-3 flex items-center justify-between text-xs">
          <div className="text-zinc-500 tracking-widest uppercase">
            Round {roundNumber}
          </div>
          <div className="flex gap-2 overflow-x-auto">
            {players.map((p) => (
              <div
                key={p.id}
                className="flex items-center gap-1 bg-zinc-900 px-2 py-1 whitespace-nowrap"
              >
                <span className="text-zinc-300">{p.name}</span>
                <span className="text-red-500 font-black">{p.wins}</span>
              </div>
            ))}
          </div>
          <div className="text-zinc-500 uppercase tracking-widest text-[10px]">
            To {winsToWin}
          </div>
        </div>

        <div className="flex-1 flex flex-col p-6 max-w-xl mx-auto w-full">
          {/* INTRO PHASE */}
          {roundPhase === 'intro' && (
            <div className="flex-1 flex flex-col justify-center slam-in">
              <div className="text-center mb-6">
                <div className="text-zinc-500 text-sm tracking-widest uppercase mb-2">
                  The Court Summons
                </div>
                <div className="flex items-center justify-center gap-3 text-3xl font-black">
                  <span className="text-white">{p1.name}</span>
                  <span className="text-red-600 text-xl">VS</span>
                  <span className="text-white">{p2.name}</span>
                </div>
              </div>

              <div className="bg-gradient-to-br from-zinc-900 to-black border-2 border-red-800/50 p-8 my-6 relative">
                <div className="absolute top-2 left-2 text-zinc-700 text-xs tracking-widest">
                  CASE #{String(roundNumber).padStart(3, '0')}
                </div>
                <div className="text-center mt-4">
                  <div className="title-font text-3xl md:text-4xl leading-tight">
                    "{currentTopic}"
                  </div>
                </div>
              </div>

              {currentTwist && (
                <div
                  className={`slam-in border-2 p-4 mb-6 ${
                    currentTwist.type === 'advantage'
                      ? 'bg-green-950/40 border-green-600'
                      : 'bg-red-950/40 border-red-600'
                  }`}
                >
                  <div
                    className={`text-xs tracking-widest uppercase font-black ${
                      currentTwist.type === 'advantage'
                        ? 'text-green-400'
                        : 'text-red-400'
                    }`}
                  >
                    {currentTwist.type === 'advantage'
                      ? '★ Advantage'
                      : '⚠ Disadvantage'}{' '}
                    — {currentDebaters[currentTwist.forPlayer].name}
                  </div>
                  <div className="mt-2 text-white">{currentTwist.text}</div>
                </div>
              )}

              <button
                onClick={() => beginDebater(0)}
                className="bg-red-700 hover:bg-red-600 font-black text-xl py-5 tracking-widest uppercase border-2 border-red-500 transition-all active:scale-95 flex items-center justify-center gap-3"
              >
                <Play className="w-6 h-6" /> Start — {p1.name}
              </button>
            </div>
          )}

          {/* TIMER PHASE (debater1 or debater2) */}
          {(roundPhase === 'debater1' || roundPhase === 'debater2') && (
            <div className="flex-1 flex flex-col justify-center">
              <div className="text-center mb-4">
                <div className="text-zinc-500 text-xs tracking-widest uppercase">
                  Now Arguing
                </div>
                <div className="title-font text-5xl mt-1 text-white">
                  {currentPlayer.name}
                </div>
                <div className="text-zinc-400 mt-3 italic text-sm">
                  "{currentTopic}"
                </div>
              </div>

              {currentTwist && currentTwist.forPlayer === activeDebater && (
                <div
                  className={`border p-3 mb-4 text-center text-sm ${
                    currentTwist.type === 'advantage'
                      ? 'bg-green-950/40 border-green-700 text-green-300'
                      : 'bg-red-950/40 border-red-700 text-red-300'
                  }`}
                >
                  <span className="font-black">
                    {currentTwist.type === 'advantage' ? '★ ' : '⚠ '}
                  </span>
                  {currentTwist.text}
                </div>
              )}

              {/* Big timer */}
              <div
                className={`relative aspect-square max-w-xs mx-auto w-full flex items-center justify-center my-6 ${
                  isLowTime ? 'urgent' : 'bg-zinc-900'
                } border-4 ${
                  isLowTime ? 'border-red-400' : 'border-zinc-700'
                } rounded-full`}
              >
                <svg className="absolute inset-0 w-full h-full -rotate-90">
                  <circle
                    cx="50%"
                    cy="50%"
                    r="48%"
                    fill="none"
                    stroke={isLowTime ? '#fca5a5' : '#dc2626'}
                    strokeWidth="8"
                    strokeDasharray={`${timerPercent * 3.01} 301`}
                    strokeLinecap="round"
                    className="transition-all duration-1000 ease-linear"
                  />
                </svg>
                <div className="text-center">
                  <div className="text-8xl font-black tabular-nums">
                    {timeLeft}
                  </div>
                  <div className="text-xs tracking-widest text-zinc-300 uppercase">
                    seconds
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                {isTimerRunning ? (
                  <button
                    onClick={pauseTimer}
                    className="flex-1 bg-zinc-800 border border-zinc-600 py-4 uppercase tracking-widest text-sm hover:bg-zinc-700 flex items-center justify-center gap-2"
                  >
                    <Pause className="w-4 h-4" /> Pause
                  </button>
                ) : (
                  <button
                    onClick={resumeTimer}
                    className="flex-1 bg-red-700 border border-red-500 py-4 uppercase tracking-widest text-sm hover:bg-red-600 flex items-center justify-center gap-2"
                  >
                    <Play className="w-4 h-4" /> Resume
                  </button>
                )}
                <button
                  onClick={skipTimer}
                  className="bg-zinc-900 border border-zinc-700 px-5 py-4 hover:bg-zinc-800"
                  aria-label="Skip"
                >
                  <SkipForward className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}

          {/* TRANSITION */}
          {roundPhase === 'transition' && (
            <div className="flex-1 flex flex-col justify-center slam-in">
              <div className="text-center mb-8">
                <div className="text-red-500 text-sm tracking-widest uppercase mb-2">
                  Objection! Time's Up
                </div>
                <div className="text-zinc-400">
                  {p1.name} has rested their case.
                </div>
              </div>

              <div className="border-2 border-zinc-800 p-6 mb-6 text-center">
                <div className="text-zinc-500 text-xs uppercase tracking-widest">
                  Next Up
                </div>
                <div className="title-font text-5xl mt-2">{p2.name}</div>
                <div className="text-zinc-400 italic text-sm mt-3">
                  "{currentTopic}"
                </div>
              </div>

              <button
                onClick={() => beginDebater(1)}
                className="bg-red-700 hover:bg-red-600 font-black text-xl py-5 tracking-widest uppercase border-2 border-red-500 transition-all active:scale-95 flex items-center justify-center gap-3"
              >
                <Play className="w-6 h-6" /> Start — {p2.name}
              </button>
            </div>
          )}

          {/* VOTE PHASE */}
          {roundPhase === 'vote' && (
            <div className="flex-1 flex flex-col justify-center slam-in">
              <div className="text-center mb-6">
                <div className="text-red-500 text-sm tracking-widest uppercase mb-1">
                  The Verdict
                </div>
                <div className="title-font text-4xl">Who argued best?</div>
              </div>

              <div className="space-y-3">
                {currentDebaters.map((p, i) => (
                  <button
                    key={p.id}
                    onClick={() => selectWinner(i)}
                    className="w-full bg-zinc-900 border-2 border-zinc-700 hover:border-red-500 hover:bg-zinc-800 p-6 transition-all active:scale-98 group"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <Gavel className="w-6 h-6 text-zinc-600 group-hover:text-red-500 transition-colors" />
                        <span className="text-2xl font-black">{p.name}</span>
                      </div>
                      <ChevronRight className="w-6 h-6 text-zinc-600 group-hover:text-red-500 transition-colors" />
                    </div>
                  </button>
                ))}
              </div>

              <div className="text-center mt-6 text-xs text-zinc-600 tracking-widest uppercase">
                The jury decides
              </div>
            </div>
          )}
        </div>

        <div className="border-t border-zinc-900 p-3 flex justify-center">
          <button
            onClick={fullReset}
            className="text-zinc-600 hover:text-red-500 text-xs tracking-widest uppercase flex items-center gap-2"
          >
            <X className="w-3 h-3" /> End Game
          </button>
        </div>
      </div>
    );
  }

  // ============ WINNER SCREEN ============
  if (screen === 'winner') {
    return (
      <div
        className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6 relative overflow-hidden"
        style={{ fontFamily: "'Cinzel', serif" }}
      >
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;900&family=IM+Fell+English+SC&family=IM+Fell+English:ital@0;1&display=swap');
          .title-font { font-family: 'IM Fell English SC', 'IM Fell English', Georgia, serif; }
          @keyframes crown { 0% { transform: translateY(-40px) scale(0.5); opacity: 0; } 100% { transform: translateY(0) scale(1); opacity: 1; } }
          @keyframes shine { 0%,100% { filter: drop-shadow(0 0 20px gold); } 50% { filter: drop-shadow(0 0 50px gold); } }
          @keyframes sparkle { 0%,100% { opacity: 0.3; } 50% { opacity: 1; } }
          .crown-in { animation: crown 1s cubic-bezier(0.34, 1.56, 0.64, 1); }
          .shine { animation: shine 2s ease-in-out infinite; }
          .sparkle { animation: sparkle 1.5s ease-in-out infinite; }
        `}</style>

        <div className="absolute inset-0 bg-gradient-radial from-red-900/30 via-black to-black"></div>

        {/* Sparkles */}
        {[...Array(12)].map((_, i) => (
          <div
            key={i}
            className="absolute text-yellow-400 sparkle text-2xl"
            style={{
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 2}s`,
            }}
          >
            ✦
          </div>
        ))}

        <div className="relative z-10 flex flex-col items-center text-center">
          <div className="crown-in shine">
            <Crown className="w-24 h-24 text-yellow-400" strokeWidth={1.5} />
          </div>

          <div className="text-red-500 text-sm tracking-[0.3em] uppercase mt-6">
            By Order of the Court
          </div>
          <div className="title-font text-3xl mt-2 text-zinc-300">
            The Ultimate Debater Is
          </div>

          <div
            className="title-font text-7xl md:text-8xl mt-4 mb-2"
            style={{ textShadow: '4px 4px 0 rgba(220,38,38,0.5)' }}
          >
            {gameWinner?.name}
          </div>

          <div className="text-xl text-zinc-400 italic">
            won with {gameWinner?.wins}{' '}
            {gameWinner?.wins === 1 ? 'round' : 'rounds'}
          </div>

          <div className="flex flex-col gap-3 mt-12 w-full max-w-xs">
            <button
              onClick={resetGame}
              className="bg-red-700 hover:bg-red-600 font-black py-4 tracking-widest uppercase border-2 border-red-500 transition-all active:scale-95 flex items-center justify-center gap-2"
            >
              <RotateCcw className="w-5 h-5" /> Rematch
            </button>
            <button
              onClick={fullReset}
              className="bg-zinc-900 hover:bg-zinc-800 font-black py-4 tracking-widest uppercase border-2 border-zinc-700 transition-all active:scale-95"
            >
              New Game
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
