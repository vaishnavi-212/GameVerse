import React, { useState, useEffect, useCallback } from 'react';
import { GameItem } from '../../types';
import { GameContainer } from '../common/GameContainer';
import { GameOverModal } from '../common/GameOverModal';
import { sound } from '../../utils/audio';
import { Timer, Flame, Sparkles, HelpCircle } from 'lucide-react';

interface TriviaGameProps {
  game: GameItem;
  highScore: number;
  onGameOver: (score: number, isWin: boolean) => void;
  onBack: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
}

interface Question {
  category: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

const QUESTIONS_POOL: Question[] = [
  {
    category: 'Science',
    question: 'Which gas is the most abundant in Earth’s atmosphere?',
    options: ['Oxygen', 'Nitrogen', 'Carbon Dioxide', 'Hydrogen'],
    correctIndex: 1,
    explanation: 'Nitrogen makes up roughly 78% of Earth’s atmosphere.',
  },
  {
    category: 'Technology',
    question: 'Who is recognized as the world’s first computer programmer?',
    options: ['Ada Lovelace', 'Alan Turing', 'Grace Hopper', 'Charles Babbage'],
    correctIndex: 0,
    explanation: 'Ada Lovelace wrote the first algorithm for Charles Babbage’s mechanical computer in 1843.',
  },
  {
    category: 'Space',
    question: 'Which planet in our Solar System has the most moons?',
    options: ['Jupiter', 'Saturn', 'Mars', 'Neptune'],
    correctIndex: 1,
    explanation: 'Saturn leads the Solar System with 146 confirmed moons.',
  },
  {
    category: 'Geography',
    question: 'What is the longest river in the world?',
    options: ['Amazon River', 'Nile River', 'Yangtze River', 'Mississippi River'],
    correctIndex: 1,
    explanation: 'The Nile River stretches approximately 6,650 kilometers (4,132 miles).',
  },
  {
    category: 'History',
    question: 'In which year did the Apollo 11 mission land humans on the Moon?',
    options: ['1965', '1969', '1972', '1975'],
    correctIndex: 1,
    explanation: 'Neil Armstrong and Buzz Aldrin set foot on the lunar surface on July 20, 1969.',
  },
  {
    category: 'Nature',
    question: 'What is the largest living mammal on planet Earth?',
    options: ['African Elephant', 'Blue Whale', 'Colossal Squid', 'Giraffe'],
    correctIndex: 1,
    explanation: 'The Blue Whale can reach lengths of 30 meters and weigh up to 200 tonnes.',
  },
  {
    category: 'Technology',
    question: 'What does "HTTP" stand for in web browsing?',
    options: [
      'HyperText Transfer Protocol',
      'High Tech Telecommunication Path',
      'Home Terminal Text Protocol',
      'Hyperlink Transmission Tool',
    ],
    correctIndex: 0,
    explanation: 'HTTP is the foundational protocol used by the World Wide Web.',
  },
  {
    category: 'Gaming',
    question: 'In which year was the classic game "Tetris" created?',
    options: ['1980', '1984', '1989', '1992'],
    correctIndex: 1,
    explanation: 'Alexey Pajitnov designed and programmed Tetris in June 1984 in Moscow.',
  },
  {
    category: 'Science',
    question: 'What is the chemical symbol for Gold?',
    options: ['Ag', 'Au', 'Gd', 'Go'],
    correctIndex: 1,
    explanation: 'Au originates from the Latin word for gold, "Aurum".',
  },
  {
    category: 'Geography',
    question: 'Which country has the greatest number of natural lakes?',
    options: ['Russia', 'United States', 'Canada', 'Finland'],
    correctIndex: 2,
    explanation: 'Canada holds over 60% of all the natural lakes on Earth.',
  },
];

export const TriviaQuizGame: React.FC<TriviaGameProps> = ({
  game,
  highScore,
  onGameOver,
  onBack,
  soundEnabled,
  onToggleSound,
}) => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [score, setScore] = useState<number>(0);
  const [streak, setStreak] = useState<number>(0);
  const [timeLeft, setTimeLeft] = useState<number>(15);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [eliminatedOptions, setEliminatedOptions] = useState<number[]>([]);
  const [hasUsedFiftyFifty, setHasUsedFiftyFifty] = useState<boolean>(false);
  const [isAnswered, setIsAnswered] = useState<boolean>(false);
  const [isGameOverModalOpen, setIsGameOverModalOpen] = useState<boolean>(false);

  const initGame = useCallback(() => {
    const shuffled = [...QUESTIONS_POOL].sort(() => Math.random() - 0.5);
    setQuestions(shuffled);
    setCurrentIndex(0);
    setScore(0);
    setStreak(0);
    setTimeLeft(15);
    setSelectedAnswer(null);
    setEliminatedOptions([]);
    setHasUsedFiftyFifty(false);
    setIsAnswered(false);
    setIsGameOverModalOpen(false);
  }, []);

  useEffect(() => {
    initGame();
  }, [initGame]);

  // Timer loop
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (!isAnswered && !isGameOverModalOpen && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft((t) => t - 1);
      }, 1000);
    } else if (timeLeft === 0 && !isAnswered) {
      handleAnswer(-1); // Timeout
    }
    return () => clearInterval(timer);
  }, [isAnswered, isGameOverModalOpen, timeLeft]);

  const handleAnswer = (index: number) => {
    if (isAnswered) return;

    setIsAnswered(true);
    setSelectedAnswer(index);

    const currentQ = questions[currentIndex];
    const isCorrect = index === currentQ?.correctIndex;

    if (isCorrect) {
      sound.playWin();
      const points = 100 + timeLeft * 10 + streak * 25;
      setScore((s) => s + points);
      setStreak((st) => st + 1);
    } else {
      sound.playError();
      setStreak(0);
    }

    setTimeout(() => {
      if (currentIndex + 1 < questions.length) {
        setCurrentIndex((i) => i + 1);
        setTimeLeft(15);
        setSelectedAnswer(null);
        setEliminatedOptions([]);
        setIsAnswered(false);
      } else {
        setIsGameOverModalOpen(true);
        onGameOver(score, score >= 600);
      }
    }, 1800);
  };

  const useFiftyFifty = () => {
    if (hasUsedFiftyFifty || isAnswered) return;
    sound.playPop();
    setHasUsedFiftyFifty(true);

    const currentQ = questions[currentIndex];
    const wrongIndices = currentQ.options
      .map((_, i) => i)
      .filter((i) => i !== currentQ.correctIndex);

    // Pick 2 wrong indices to eliminate
    const toEliminate = wrongIndices.sort(() => Math.random() - 0.5).slice(0, 2);
    setEliminatedOptions(toEliminate);
  };

  const currentQ = questions[currentIndex];
  if (!currentQ) return null;

  return (
    <GameContainer
      game={game}
      score={score}
      highScore={highScore}
      onBack={onBack}
      onRestart={initGame}
      soundEnabled={soundEnabled}
      onToggleSound={onToggleSound}
    >
      <div className="flex flex-col items-center gap-4 w-full max-w-lg select-none">
        {/* Status bar */}
        <div className="grid grid-cols-3 gap-2 w-full p-2.5 bg-slate-900 border border-slate-800 rounded-2xl text-center">
          <div className="flex items-center justify-center gap-1.5 p-1.5 rounded-xl bg-slate-950/40">
            <span className="text-xs font-bold text-slate-400">
              Q: {currentIndex + 1}/{questions.length}
            </span>
          </div>
          <div className="flex items-center justify-center gap-1.5 p-1.5 rounded-xl bg-slate-950/40">
            <Timer className="w-4 h-4 text-amber-400" />
            <span className={`text-sm font-mono font-bold ${timeLeft <= 5 ? 'text-rose-400 animate-pulse' : 'text-white'}`}>
              {timeLeft}s
            </span>
          </div>
          <div className="flex items-center justify-center gap-1.5 p-1.5 rounded-xl bg-slate-950/40">
            <Flame className="w-4 h-4 text-orange-400" />
            <span className="text-xs font-bold text-orange-300">{streak}x Streak</span>
          </div>
        </div>

        {/* Question Card */}
        <div className="w-full p-5 sm:p-6 bg-slate-900 border-2 border-slate-800 rounded-3xl shadow-2xl flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="px-2.5 py-0.5 rounded-full bg-violet-500/20 text-violet-300 text-xs font-bold border border-violet-500/30 uppercase">
              {currentQ.category}
            </span>

            <button
              onClick={useFiftyFifty}
              disabled={hasUsedFiftyFifty || isAnswered}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                !hasUsedFiftyFifty && !isAnswered
                  ? 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border-amber-500/40'
                  : 'bg-slate-800 text-slate-500 border-slate-700 cursor-not-allowed'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" /> 50:50 Lifeline
            </button>
          </div>

          <h3 className="text-lg sm:text-xl font-bold text-white leading-relaxed">
            {currentQ.question}
          </h3>
        </div>

        {/* Options */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full">
          {currentQ.options.map((opt, idx) => {
            const isEliminated = eliminatedOptions.includes(idx);
            const isSelected = selectedAnswer === idx;
            const isCorrect = idx === currentQ.correctIndex;

            let btnClass = 'bg-slate-900 border-slate-800 hover:bg-slate-800 text-slate-100';
            if (isAnswered) {
              if (isCorrect) {
                btnClass = 'bg-emerald-600 border-emerald-500 text-white shadow-lg shadow-emerald-500/30';
              } else if (isSelected) {
                btnClass = 'bg-rose-600 border-rose-500 text-white';
              } else {
                btnClass = 'bg-slate-950/60 border-slate-800 text-slate-500 opacity-60';
              }
            } else if (isEliminated) {
              btnClass = 'bg-slate-950/40 border-slate-900 text-slate-700 cursor-not-allowed opacity-30';
            }

            return (
              <button
                key={idx}
                onClick={() => handleAnswer(idx)}
                disabled={isAnswered || isEliminated}
                className={`p-4 rounded-2xl border-2 flex items-center gap-3 transition-all text-left font-semibold text-sm cursor-pointer active:scale-98 ${btnClass}`}
              >
                <span className="w-6 h-6 rounded-full bg-slate-800 text-slate-400 flex items-center justify-center text-xs font-mono font-bold">
                  {String.fromCharCode(65 + idx)}
                </span>
                <span className="flex-1 leading-snug">{opt}</span>
              </button>
            );
          })}
        </div>

        {/* Explanation footnote */}
        {isAnswered && (
          <div className="w-full p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300 leading-relaxed animate-fade-in flex items-start gap-2">
            <HelpCircle className="w-4 h-4 text-violet-400 flex-shrink-0 mt-0.5" />
            <span>{currentQ.explanation}</span>
          </div>
        )}
      </div>

      <GameOverModal
        isOpen={isGameOverModalOpen}
        isWin={score >= 600}
        score={score}
        highScore={highScore}
        title={score >= 600 ? 'Trivia Grandmaster!' : 'Quiz Finished!'}
        message={`You answered with a final score of ${score} points!`}
        customStats={[
          { label: 'Max Streak', value: `${streak}x` },
          { label: 'Total Questions', value: questions.length },
        ]}
        onPlayAgain={initGame}
        onHome={onBack}
      />
    </GameContainer>
  );
};
