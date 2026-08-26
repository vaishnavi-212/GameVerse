import React, { useState, useEffect, useCallback } from 'react';
import { GameItem } from '../../types';
import { GameContainer } from '../common/GameContainer';
import { GameOverModal } from '../common/GameOverModal';
import { sound } from '../../utils/audio';
import { Lightbulb, Heart, PawPrint, Globe2, Cpu, Rocket, Sparkles, RotateCcw } from 'lucide-react';

interface HangmanGameProps { game: GameItem; highScore: number; onGameOver: (score:number,isWin:boolean)=>void; onBack:()=>void; soundEnabled:boolean; onToggleSound:()=>void; }

const CATEGORIES_DATA: Record<string,{words:string[];hints:Record<string,string>}>={
  Animals:{words:['DOLPHIN','GIRAFFE','KANGAROO','PENGUIN','CHEETAH','ELEPHANT','OCTOPUS','CHAMELEON'],hints:{DOLPHIN:'Highly intelligent marine mammal',GIRAFFE:'Tallest living land mammal',KANGAROO:'Australian hopping marsupial',PENGUIN:'Flightless aquatic bird in cold regions',CHEETAH:'Fastest land mammal on Earth',ELEPHANT:'Largest living terrestrial animal with trunk',OCTOPUS:'Eight-armed soft-bodied mollusk',CHAMELEON:'Lizard known for changing skin colors'}},
  Countries:{words:['BRAZIL','JAPAN','CANADA','GERMANY','AUSTRALIA','EGYPT','FRANCE','MEXICO'],hints:{BRAZIL:'Amazon rainforest and Carnival',JAPAN:'Land of the rising sun',CANADA:'Maple leaf flag in North America',GERMANY:'European country famous for Autobahn',AUSTRALIA:'Down Under with the Sydney Opera House',EGYPT:'Home of the ancient Giza pyramids',FRANCE:'Eiffel Tower and Parisian cafés',MEXICO:'Tacos and ancient Mayan ruins'}},
  Tech:{words:['PYTHON','ROBOTICS','INTERNET','QUANTUM','BROWSER','DATABASE','ALGORITHM','FIREWALL'],hints:{PYTHON:'Popular snake-named coding language',ROBOTICS:'Tech dealing with automated machines',INTERNET:'Global computer network',QUANTUM:'Computing based on subatomic physics',BROWSER:'Software used to surf the web',DATABASE:'Structured collection of stored data',ALGORITHM:'Step-by-step problem-solving sequence',FIREWALL:'Network security defense barrier'}},
  Space:{words:['ASTEROID','NEBULA','TELESCOPE','GALAXY','SATELLITE','SUPERNOVA','ECLIPSE','ASTRONAUT'],hints:{ASTEROID:'Rocky body orbiting the Sun',NEBULA:'Giant cloud of cosmic dust and gas',TELESCOPE:'Tool for viewing distant worlds',GALAXY:'Gravitationally bound system of stars',SATELLITE:'Object orbiting a planet',SUPERNOVA:'Explosive death of a massive star',ECLIPSE:'One celestial body obscures another',ASTRONAUT:'Space explorer in a pressurized suit'}}
};
const ALPHABET='ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
const categoryIcons:Record<string,React.ReactNode>={Animals:<PawPrint/>,Countries:<Globe2/>,Tech:<Cpu/>,Space:<Rocket/>};

export const HangmanGame:React.FC<HangmanGameProps>=({game,highScore,onGameOver,onBack,soundEnabled,onToggleSound})=>{
 const [selectedCategory,setSelectedCategory]=useState('Animals'); const [targetWord,setTargetWord]=useState('DOLPHIN'); const [guessedLetters,setGuessedLetters]=useState<string[]>([]); const [hintShown,setHintShown]=useState(false); const [modal,setModal]=useState(false);
 const initGame=useCallback((category=selectedCategory)=>{const data=CATEGORIES_DATA[category];setTargetWord(data.words[Math.floor(Math.random()*data.words.length)]);setGuessedLetters([]);setHintShown(false);setModal(false)},[selectedCategory]);
 useEffect(()=>{initGame(selectedCategory)},[selectedCategory,initGame]);
 const wrongGuesses=guessedLetters.filter(l=>!targetWord.includes(l)).length; const isWon=targetWord.split('').every(l=>guessedLetters.includes(l)); const isLost=wrongGuesses>=6;
 useEffect(()=>{if(isWon){sound.playWin();setModal(true);onGameOver(Math.max(50,200-wrongGuesses*25-(hintShown?40:0)),true)}else if(isLost){sound.playGameOver();setModal(true);onGameOver(20,false)}},[isWon,isLost,onGameOver,wrongGuesses,hintShown]);
 const guessLetter=useCallback((letter:string)=>{if(guessedLetters.includes(letter)||isWon||isLost)return;sound.playTap();setGuessedLetters(prev=>[...prev,letter]);targetWord.includes(letter)?sound.playCorrect():sound.playError()},[guessedLetters,isWon,isLost,targetWord]);
 useEffect(()=>{const onKey=(e:KeyboardEvent)=>{const key=e.key.toUpperCase();if(ALPHABET.includes(key))guessLetter(key)};window.addEventListener('keydown',onKey);return()=>window.removeEventListener('keydown',onKey)},[guessLetter]);
 const currentHint=CATEGORIES_DATA[selectedCategory].hints[targetWord]||'No hint available';
 return <GameContainer game={game} highScore={highScore} onBack={onBack} onRestart={()=>initGame(selectedCategory)} soundEnabled={soundEnabled} onToggleSound={onToggleSound}
  extraHeaderControls={<div className="hangman-category-tabs">{Object.keys(CATEGORIES_DATA).map(cat=><button key={cat} onClick={()=>{setSelectedCategory(cat);initGame(cat)}} className={selectedCategory===cat?'is-active':''}>{categoryIcons[cat]}<span>{cat}</span></button>)}</div>}>
  <div className="hangman-stage select-none">
    <section className="hangman-hero-card">
      <div className="hangman-gallows-wrap">
        <div className="hangman-rope-shine"/>
        <svg viewBox="0 0 140 130" className="hangman-gallows" aria-label="Hangman progress">
          <line x1="14" y1="118" x2="66" y2="118"/><line x1="40" y1="118" x2="40" y2="16"/><line x1="40" y1="16" x2="101" y2="16"/><line x1="101" y1="16" x2="101" y2="36" className="rope"/>
          {wrongGuesses>=1&&<circle className="hang-part pop-1" cx="101" cy="48" r="11"/>}{wrongGuesses>=2&&<line className="hang-part pop-2" x1="101" y1="59" x2="101" y2="88"/>}{wrongGuesses>=3&&<line className="hang-part pop-3" x1="101" y1="67" x2="83" y2="78"/>}{wrongGuesses>=4&&<line className="hang-part pop-4" x1="101" y1="67" x2="119" y2="78"/>}{wrongGuesses>=5&&<line className="hang-part pop-5" x1="101" y1="88" x2="86" y2="111"/>}{wrongGuesses>=6&&<line className="hang-part pop-6" x1="101" y1="88" x2="116" y2="111"/>}
        </svg>
        <div className={`hangman-lives ${wrongGuesses>=4?'danger':''}`}><Heart size={14} fill="currentColor"/> <b>{6-wrongGuesses}</b> lives left</div>
      </div>
      <div className="hangman-word-area">
        <div className="hangman-category-badge">{categoryIcons[selectedCategory]}<span>Category</span><strong>{selectedCategory}</strong></div>
        <div className="hangman-progress"><span>Word progress</span><div><i style={{width:`${(guessedLetters.filter(l=>targetWord.includes(l)).length/targetWord.length)*100}%`}}/></div><b>{guessedLetters.filter(l=>targetWord.includes(l)).length}/{targetWord.length}</b></div>
        <div className="hangman-word-slots">{targetWord.split('').map((letter,idx)=><div key={idx} className={`hang-slot ${guessedLetters.includes(letter)||isLost?'revealed':''}`}>{guessedLetters.includes(letter)||isLost?letter:<span>?</span>}</div>)}</div>
      </div>
    </section>
    <section className={`hangman-clue ${hintShown?'shown':''}`}><div className="clue-icon"><Lightbulb/></div><div><small>{hintShown?'CLUE REVEALED':'NEED A CLUE?'}</small><p>{hintShown?currentHint:'Use one hint to reveal a helpful clue.'}</p></div>{!hintShown?<button onClick={()=>{sound.playPop();setHintShown(true)}}>Reveal hint <Sparkles size={15}/></button>:<button className="hint-used" disabled>Hint used</button>}</section>
    <div className="hangman-keyboard">{ALPHABET.map(letter=>{const used=guessedLetters.includes(letter),correct=used&&targetWord.includes(letter),wrong=used&&!targetWord.includes(letter);return <button key={letter} onClick={()=>guessLetter(letter)} disabled={used||isWon||isLost} className={correct?'correct':wrong?'wrong':''}>{letter}</button>})}</div>
    <div className="hangman-bottom-note"><span>Tip: you can use your keyboard too</span><button onClick={()=>initGame(selectedCategory)}><RotateCcw size={15}/> New word</button></div>
  </div>
  <GameOverModal isOpen={modal} isWin={isWon} score={isWon?Math.max(50,200-wrongGuesses*25-(hintShown?40:0)):20} highScore={highScore} title={isWon?'Word cracked!':'Out of lives!'} message={isWon?`You solved ${targetWord} with ${6-wrongGuesses} lives left.`:`The word was ${targetWord}. You'll get it next round.`} stats={[{label:'Category',value:selectedCategory},{label:'Wrong guesses',value:String(wrongGuesses)}]} onPlayAgain={()=>initGame(selectedCategory)} onHome={onBack}/>
 </GameContainer>
}
