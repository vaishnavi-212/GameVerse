import React from 'react';
import { GameItem } from '../../types';
import { X, BookOpen, CheckCircle, Gamepad2, Lightbulb } from 'lucide-react';
import { sound } from '../../utils/audio';

interface InstructionsModalProps {
  game: GameItem;
  isOpen: boolean;
  onClose: () => void;
}

export const InstructionsModal: React.FC<InstructionsModalProps> = ({ game, isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-lg overflow-hidden bg-[#0e0e12] border border-white/10 rounded-3xl shadow-2xl p-6 sm:p-7 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600/15 text-indigo-400 border border-indigo-500/30 flex items-center justify-center">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg sm:text-xl font-bold text-white font-heading">{game.title} - How to Play</h3>
              <p className="text-xs text-white/40">Rules & Controls Guide</p>
            </div>
          </div>
          <button
            onClick={() => {
              sound.playClick();
              onClose();
            }}
            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/60 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="mt-4 space-y-4 overflow-y-auto pr-1 text-sm text-white/70">
          {/* Overview */}
          <div className="p-4 rounded-2xl bg-[#111115] border border-white/10">
            <p className="leading-relaxed text-white/90 text-xs sm:text-sm">{game.instructions.overview}</p>
          </div>

          {/* Rules */}
          <div>
            <h4 className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-indigo-400 mb-2.5 font-mono">
              <CheckCircle className="w-3.5 h-3.5" />
              Game Rules
            </h4>
            <ul className="space-y-2">
              {game.instructions.rules.map((rule, idx) => (
                <li key={idx} className="flex items-start gap-3 bg-[#111115] p-3 rounded-xl border border-white/5 text-xs sm:text-sm">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-indigo-600/20 text-indigo-300 flex items-center justify-center text-xs font-bold font-mono">
                    {idx + 1}
                  </span>
                  <span className="leading-snug text-white/80">{rule}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Controls */}
          <div>
            <h4 className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-emerald-400 mb-2.5 font-mono">
              <Gamepad2 className="w-3.5 h-3.5" />
              Controls & Interaction
            </h4>
            <ul className="space-y-2">
              {game.instructions.controls.map((control, idx) => (
                <li key={idx} className="flex items-start gap-2.5 bg-[#111115] p-2.5 rounded-xl border border-white/5 text-xs text-white/80">
                  <span className="text-emerald-400 font-bold">•</span>
                  <span>{control}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Tips */}
          {game.instructions.tips && game.instructions.tips.length > 0 && (
            <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-200">
              <h4 className="flex items-center gap-2 font-bold text-amber-400 mb-1 text-[10px] uppercase tracking-wider font-mono">
                <Lightbulb className="w-3.5 h-3.5" /> Pro Tip
              </h4>
              <p className="text-xs leading-relaxed text-amber-200/90">{game.instructions.tips.join(' ')}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="pt-4 mt-4 border-t border-white/5">
          <button
            onClick={() => {
              sound.playClick();
              onClose();
            }}
            className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl shadow-lg shadow-indigo-600/20 transition-all text-xs sm:text-sm cursor-pointer"
          >
            Got It, Let's Play!
          </button>
        </div>
      </div>
    </div>
  );
};
