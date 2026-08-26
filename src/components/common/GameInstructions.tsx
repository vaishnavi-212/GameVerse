import React, { useState } from 'react';
import { HelpCircle, X, Sparkles, Trophy, Gamepad2 } from 'lucide-react';

type GuideTheme = { emoji: string; motif: string; className: string; labels: [string, string, string] };

const INSTRUCTIONS: Record<string, { title: string; steps: string[]; tip: string; theme: GuideTheme }> = {
  snake: { title:'How to play Retro Snake', steps:['Use the arrow keys or on-screen controls to choose a direction.','Eat the glowing food to grow and increase your score.','Avoid the walls and your own body to keep the run alive.'], tip:'Plan one turn ahead—quick turns are fine, panic turns are not.', theme:{emoji:'🐍',motif:'🍎',className:'guide-snake',labels:['STEER','SNACK','SURVIVE']} },
  'game-2048': { title:'How to play 2048', steps:['Swipe or use arrow keys to slide every tile in one direction.','Matching numbers merge into a bigger tile.','Keep the board open and build toward the 2048 tile.'], tip:'Anchor your biggest number in one corner and protect that lane.', theme:{emoji:'🔢',motif:'✨',className:'guide-2048',labels:['SLIDE','MERGE','BUILD']} },
  tictactoe: { title:'How to play Tic-Tac-Toe', steps:['Click an empty square to place your mark.','Take turns and watch every row, column, and diagonal.','Make three matching marks in a line before your opponent does.'], tip:'A fork creates two winning threats at once.', theme:{emoji:'⭕',motif:'❌',className:'guide-tictactoe',labels:['PLACE','BLOCK','LINE UP']} },
  'connect-four': { title:'How to play Connect Four', steps:['Choose a column and drop your piece into it.','Build horizontal, vertical, or diagonal connections.','Connect four of your pieces first to win the round.'], tip:'Always check the move your opponent gets immediately after yours.', theme:{emoji:'🔴',motif:'🟡',className:'guide-connect',labels:['DROP','STACK','CONNECT 4']} },
  chess: { title:'How to play Chess', steps:['Select a piece, then choose one of its legal highlighted moves.','Use each piece according to standard chess movement rules.','Protect your king and checkmate the opponent to win.'], tip:'Develop your pieces early and do not leave your king exposed.', theme:{emoji:'♟️',motif:'♛',className:'guide-chess',labels:['MOVE','CONTROL','CHECKMATE']} },
  checkers: { title:'How to play Checkers', steps:['Select one of your pieces and choose a valid diagonal move.','Jump over opponents whenever a capture is available.','Reach the far side to king your piece and remove all opponents.'], tip:'Look twice for multi-jump chains before ending your turn.', theme:{emoji:'🔴',motif:'⚫',className:'guide-checkers',labels:['STEP','JUMP','KING']} },
  'memory-match': { title:'How to play Memory Match', steps:['Flip two cards to reveal the hidden pictures.','A matching pair stays open; a miss flips back after a moment.','Match every pair using as few moves as possible.'], tip:'Remember positions and patterns instead of chasing one card at a time.', theme:{emoji:'🃏',motif:'🧠',className:'guide-memory',labels:['FLIP','REMEMBER','MATCH']} },
  'whack-a-mole': { title:'How to play Whack-a-Mole', steps:['Watch the holes for a mole popping up.','Tap the mole before it disappears.','Keep your streak going until the timer ends.'], tip:'Fast is good. Random panic-clicking is not.', theme:{emoji:'🐹',motif:'🔨',className:'guide-mole',labels:['WATCH','WHACK','STREAK']} },
  'word-guess': { title:'How to play Word Guess', steps:['Type a five-letter word and submit your guess.','Use the colour feedback to learn which letters are correct or misplaced.','Solve the secret word before your guesses run out.'], tip:'Open with common vowels and high-frequency consonants.', theme:{emoji:'🔤',motif:'🟩',className:'guide-word',labels:['GUESS','READ CLUES','SOLVE']} },
  hangman: { title:'How to play Hangman', steps:['Pick letters you think belong in the hidden word.','Correct letters reveal positions; wrong letters cost lives.','Reveal the whole word before your lives run out.'], tip:'Start with common vowels, then use the word pattern.', theme:{emoji:'🪢',motif:'💡',className:'guide-hangman',labels:['PICK','REVEAL','SAVE LIVES']} },
  sudoku: { title:'How to play Sudoku', steps:['Select an empty cell and choose a number from 1 to 9.','Each row, column, and 3×3 box must contain no repeats.','Fill every cell correctly to complete the puzzle.'], tip:'Eliminate possibilities before guessing.', theme:{emoji:'🧩',motif:'9️⃣',className:'guide-sudoku',labels:['SELECT','ELIMINATE','COMPLETE']} },
  'rock-paper-scissors': { title:'How to play Rock Paper Scissors', steps:['Choose rock, paper, or scissors.','The AI chooses at the same time.','Rock beats scissors, scissors beat paper, and paper beats rock.'], tip:'No perfect strategy exists—enjoy the mind games.', theme:{emoji:'✊',motif:'✌️',className:'guide-rps',labels:['CHOOSE','REVEAL','WIN']} },
  'number-guess': { title:'How to play Number Guess', steps:['Enter a number within the displayed range.','Use the higher or lower clue after each guess.','Narrow the range until you find the secret number.'], tip:'Halving the remaining range is the fastest approach.', theme:{emoji:'🎯',motif:'🔢',className:'guide-number',labels:['PICK','NARROW','NAIL IT']} },
  ludo: { title:'How to play Ludo', steps:['Roll the dice to bring tokens out and move around the board.','Race your tokens toward their coloured home lane.','Get all four tokens home before the other players.'], tip:'Spread your tokens out so one capture does not ruin your whole race.', theme:{emoji:'🎲',motif:'🏁',className:'guide-ludo',labels:['ROLL','RACE','HOME']} },
  'snakes-and-ladders': { title:'How to play Snakes & Ladders', steps:['Roll the dice and move forward by that many tiles.','Climb ladders to jump ahead and avoid snake heads.','Reach tile 100 first to win the race.'], tip:'A ladder can change everything, so the race is never over early.', theme:{emoji:'🐍',motif:'🪜',className:'guide-snakes',labels:['ROLL','CLIMB','REACH 100']} },
  'trivia-quiz': { title:'How to play Trivia Quiz', steps:['Read the question and every answer option.','Choose the answer you believe is correct before time runs out.','Build your score across the full quiz.'], tip:'Trust your knowledge—overthinking often wastes the clock.', theme:{emoji:'🧠',motif:'🏆',className:'guide-trivia',labels:['READ','ANSWER','SCORE']} },
  'typing-test': { title:'How to play Typing Speed Rush', steps:['Start the round and type the displayed passage exactly.','Keep your accuracy high while building speed.','Finish the text before the timer ends to record your result.'], tip:'Accuracy first; speed naturally follows a clean rhythm.', theme:{emoji:'⌨️',motif:'⚡',className:'guide-typing',labels:['START','TYPE','SPRINT']} },
  'reaction-time': { title:'How to play Reflex & Aim Lab', steps:['Wait patiently while the screen is preparing.','When the panel turns green and says CLICK NOW, click immediately.','Complete every round and beat your average reaction time.'], tip:'Never click before green—an early click is a false start.', theme:{emoji:'⚡',motif:'🟢',className:'guide-reaction',labels:['WAIT','CLICK GREEN','BEAT YOUR TIME']} },
  'bubble-shooter': { title:'How to play Bubble Pop Galaxy', steps:['Aim with your pointer—the dotted guide shows the exact shot path.','Click once to launch the current bubble along that same path.','Join three or more matching colours to pop them and clear the board.'], tip:'Bank shots off the wall can reach bubbles hidden behind the front row.', theme:{emoji:'🫧',motif:'🎯',className:'guide-bubble',labels:['AIM','SHOOT','POP 3+']} },
  'target-hitter': { title:'How to play Target Hitter', steps:['Watch for the target to appear or move.','Click directly on the target as quickly and accurately as possible.','Keep hitting targets to build your score.'], tip:'Track the target itself, not the score counter.', theme:{emoji:'🏹',motif:'🎯',className:'guide-target',labels:['TRACK','AIM','HIT']} },
};

const DEFAULT_THEME: GuideTheme = { emoji:'🎮', motif:'✨', className:'guide-default', labels:['LEARN','PLAY','HAVE FUN'] };

export const GameInstructions: React.FC<{ gameId: string; gameName: string }> = ({ gameId, gameName }) => {
  const [open, setOpen] = useState(false);
  const info = INSTRUCTIONS[gameId] || {
    title:`How to play ${gameName}`,
    steps:['Follow the controls shown on the game screen.','Complete the game objective to score points or win.','Use restart anytime you want a fresh round.'],
    tip:'Explore the controls and have fun.',
    theme: DEFAULT_THEME,
  };
  const theme = info.theme || DEFAULT_THEME;

  return <>
    <button onClick={() => setOpen(true)} className="game-help-fab" aria-label="How to play"><HelpCircle size={20} /> <span>HOW TO PLAY</span></button>
    {open && <div className="game-instructions-overlay" role="dialog" aria-modal="true" aria-label={`How to play ${gameName}`}>
      <div className={`game-instructions-modal ${theme.className}`}>
        <button className="game-instructions-close" onClick={() => setOpen(false)} aria-label="Close instructions"><X size={22}/></button>
        <div className="game-instructions-hero">
          <div className="game-instructions-emoji" aria-hidden="true">{theme.emoji}</div>
          <div className="game-instructions-motif motif-a" aria-hidden="true">{theme.motif}</div>
          <div className="game-instructions-motif motif-b" aria-hidden="true">✦</div>
          <p className="game-instructions-kicker"><Sparkles size={14}/> GAME GUIDE</p>
          <h2>{info.title}</h2>
          <p className="game-instructions-subtitle">Three quick moves. Then you are ready to play.</p>
        </div>

        <div className="game-instructions-steps">
          {info.steps.map((step, i) => <article className="game-instruction-step" key={step}>
            <div className="game-instruction-number"><span>{i+1}</span><small>{theme.labels[i]}</small></div>
            <div className="game-instruction-copy"><span>{step}</span></div>
          </article>)}
        </div>

        <div className="game-instructions-tip">
          <div className="game-tip-icon"><Trophy size={20}/></div>
          <div><strong>PRO TIP</strong><span>{info.tip}</span></div>
        </div>
        <button className="game-instructions-play" onClick={() => setOpen(false)}><Gamepad2 size={19}/> GOT IT — LET'S PLAY!</button>
      </div>
    </div>}
  </>;
};
