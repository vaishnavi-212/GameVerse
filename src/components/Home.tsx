import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AppSettings, GameCategory, GameItem, UserStats } from '../types';
import { IconHelper } from './common/IconHelper';
import { sound } from '../utils/audio';
import {
  Search, Volume2, VolumeX, Heart, Trophy, Gamepad2, Sparkles, Play,
  RotateCcw, X, Clock, Menu, ChevronRight, Dice5, Star, Flame,
  Leaf, Moon, Coffee, Zap, Users, Brain, Grid3X3, Send, ShieldCheck,
  Compass, Library, UserRound, ArrowRight, Shuffle, Timer, PartyPopper,
  Rocket, Cloud, Target, Puzzle, Crown, CheckCircle2, Filter, SlidersHorizontal,
  Gamepad, CircleHelp, Swords, Gem, Award, History
} from 'lucide-react';

interface HomeProps {
  games: GameItem[];
  stats: UserStats;
  settings: AppSettings;
  favorites: string[];
  onSelectGame: (game: GameItem) => void;
  onToggleFavorite: (gameId: string) => void;
  onToggleSound: () => void;
  onUpdateSettings: (newSettings: Partial<AppSettings>) => void;
  onResetStats: () => void;
}

type Page = 'home' | 'moody' | 'games' | 'discover' | 'space' | 'about' | 'request';

type Palette = { primary: string; secondary: string; accent: string; cream: string };

export const GAME_PALETTES: Record<string, Palette> = {
  snake: { primary:'#4CEB73', secondary:'#7B4DFF', accent:'#FFE55C', cream:'#FFF7E8' },
  'game-2048': { primary:'#B8F04A', secondary:'#FFF4B8', accent:'#FF8A3D', cream:'#FFF9E8' },
  tictactoe: { primary:'#FF4F8B', secondary:'#FFE45C', accent:'#67D8FF', cream:'#FFF8ED' },
  'connect-four': { primary:'#3E73FF', secondary:'#FFCE48', accent:'#FF5D62', cream:'#F7F5FF' },
  chess: { primary:'#8B65FF', secondary:'#57D5FF', accent:'#FFE05A', cream:'#FAF7FF' },
  checkers: { primary:'#FF695B', secondary:'#FFCC4D', accent:'#65D7B2', cream:'#FFF7ED' },
  'memory-match': { primary:'#63CFFF', secondary:'#B69BFF', accent:'#FF8C7A', cream:'#F7FBFF' },
  'whack-a-mole': { primary:'#FFB92E', secondary:'#FF6B63', accent:'#63D8B0', cream:'#FFF9E7' },
  'word-guess': { primary:'#55D17B', secondary:'#FFE169', accent:'#7D7AFF', cream:'#F7FFF6' },
  hangman: { primary:'#FF7C62', secondary:'#75D6FF', accent:'#FFE269', cream:'#FFF8F0' },
  sudoku: { primary:'#56D6C0', secondary:'#FFD95D', accent:'#7A86FF', cream:'#F5FFFC' },
  'rock-paper-scissors': { primary:'#FF5F76', secondary:'#5DD6FF', accent:'#FFD95D', cream:'#FFF8F3' },
  'number-guess': { primary:'#FF72B5', secondary:'#A98AFF', accent:'#FFE05A', cream:'#FFF8FC' },
  ludo: { primary:'#FF655D', secondary:'#54D3FF', accent:'#FFDB55', cream:'#FFF9F0' },
  'snakes-and-ladders': { primary:'#6CD26D', secondary:'#FF7C68', accent:'#FFD95B', cream:'#F9FFF4' },
  'trivia-quiz': { primary:'#9A79FF', secondary:'#FFCF58', accent:'#61D8FF', cream:'#FAF8FF' },
  'typing-test': { primary:'#5F8FFF', secondary:'#FF7E70', accent:'#FFE05B', cream:'#F7F9FF' },
  'reaction-time': { primary:'#FF9F43', secondary:'#FF5D70', accent:'#58D5FF', cream:'#FFF9F0' },
  'bubble-shooter': { primary:'#FF70A5', secondary:'#6FCFFF', accent:'#FFE05B', cream:'#FFF8FC' },
  'target-hitter': { primary:'#FF785E', secondary:'#6D82FF', accent:'#FFD957', cream:'#FFF8F1' },
};

const paletteFor = (id:string):Palette => GAME_PALETTES[id] || {primary:'#FF4F8B',secondary:'#67D8FF',accent:'#FFE45C',cream:'#FFF8ED'};
const pageFromHash = (): Page => {
  const raw = window.location.hash.replace('#/','').replace('#','');
  return (['home','moody','games','discover','space','about','request'].includes(raw) ? raw : 'home') as Page;
};
const playTimes = ['2 MIN','5 MIN','10 MIN','15+ MIN'];

const moodData = [
  {id:'chill', label:'CHILL', text:'Take it easy.', icon:Coffee, match:['snake','memory-match','sudoku','bubble-shooter'], primary:'#7D72FF', secondary:'#B7F0FF', accent:'#FFE05A'},
  {id:'happy', label:'HAPPY', text:'Play something joyful.', icon:Sparkles, match:['bubble-shooter','rock-paper-scissors','whack-a-mole','ludo'], primary:'#FF5F8E', secondary:'#FFE05A', accent:'#65D8FF'},
  {id:'focused', label:'FOCUSED', text:'Get in the zone.', icon:Brain, match:['chess','sudoku','game-2048','typing-test'], primary:'#5CD6B7', secondary:'#7E7AFF', accent:'#FFE05A'},
  {id:'tired', label:'TIRED', text:'Keep it simple.', icon:Moon, match:['memory-match','word-guess','number-guess','tictactoe'], primary:'#9B84FF', secondary:'#FFC1D7', accent:'#FFE05A'},
  {id:'hyped', label:'HYPED', text:'Bring the energy.', icon:Flame, match:['reaction-time','snake','whack-a-mole','target-hitter'], primary:'#FF624E', secondary:'#FFAE39', accent:'#61D8FF'},
  {id:'competitive', label:'COMPETITIVE', text:'Bring your A-game.', icon:Swords, match:['connect-four','chess','checkers','tictactoe'], primary:'#FF5A77', secondary:'#6E78FF', accent:'#FFE15B'},
  {id:'curious', label:'CURIOUS', text:'Try something new.', icon:Compass, match:['trivia-quiz','snakes-and-ladders','word-guess','number-guess'], primary:'#57CFFF', secondary:'#A88BFF', accent:'#FFE05A'},
  {id:'bored', label:'BORED', text:'Fix that immediately.', icon:Zap, match:['snake','reaction-time','bubble-shooter','rock-paper-scissors'], primary:'#B9EF46', secondary:'#FF6E92', accent:'#6CCFFF'},
];

export const Home: React.FC<HomeProps> = (props) => {
  const [page, setPage] = useState<Page>(pageFromHash());
  const [mobile, setMobile] = useState(false);
  const [search, setSearch] = useState('');
  useEffect(() => { const sync=()=>setPage(pageFromHash()); window.addEventListener('hashchange',sync); return()=>window.removeEventListener('hashchange',sync); },[]);
  const navigate=(next:Page)=>{ window.location.hash=`/${next}`; setPage(next); setMobile(false); window.scrollTo({top:0,behavior:'smooth'}); };
  return <div className="gv-site">
    <SiteHeader page={page} navigate={navigate} mobile={mobile} setMobile={setMobile} search={search} setSearch={setSearch} {...props}/>
    {page==='home' && <HomePage {...props} navigate={navigate}/>} 
    {page==='moody' && <MoodyPage {...props}/>} 
    {page==='games' && <GamesPage {...props} search={search} setSearch={setSearch}/>} 
    {page==='discover' && <DiscoverPage {...props}/>} 
    {page==='space' && <SpacePage {...props}/>} 
    {page==='about' && <AboutPage/>} 
    {page==='request' && <RequestPage/>}
    <SiteFooter navigate={navigate}/>
  </div>;
};

const SiteHeader: React.FC<HomeProps & {page:Page;navigate:(p:Page)=>void;mobile:boolean;setMobile:(v:boolean)=>void;search:string;setSearch:(v:string)=>void}> = ({page,navigate,mobile,setMobile,search,setSearch,settings,onToggleSound}) => (
  <header className="gv-nav">
    <button className="gv-brand" onClick={()=>navigate('home')}><Gamepad2/><span>GAME<span>VERSE</span></span></button>
    <nav className="gv-navlinks">{([['home','HOME'],['moody','MOODY'],['games','ALL GAMES'],['discover','DISCOVER'],['space','MY SPACE'],['about','ABOUT'],['request','REQUEST']] as [Page,string][]).map(([id,label])=><button key={id} className={page===id?'active':''} onClick={()=>navigate(id)}>{label}</button>)}</nav>
    <div className="gv-nav-actions"><div className="gv-search"><Search size={18}/><input value={search} onChange={e=>setSearch(e.target.value)} onKeyDown={e=>{if(e.key==='Enter') navigate('games')}} placeholder="Search games..."/><button aria-label="Clear search" onClick={()=>setSearch('')}>{search&&<X size={15}/>}</button></div><button className="gv-iconbtn" onClick={onToggleSound} aria-label="Toggle sound">{settings.soundEnabled?<Volume2 size={20}/>:<VolumeX size={20}/>}</button><button className="gv-mobile-menu" onClick={()=>setMobile(!mobile)} aria-label="Open navigation"><Menu/></button></div>
    {mobile&&<div className="gv-mobile-panel">{([['home','HOME'],['moody','MOODY'],['games','ALL GAMES'],['discover','DISCOVER'],['space','MY SPACE'],['about','ABOUT'],['request','REQUEST']] as [Page,string][]).map(([id,label])=><button key={id} onClick={()=>navigate(id)}>{label}</button>)}</div>}
  </header>
);

const HomePage: React.FC<HomeProps & {navigate:(p:Page)=>void}> = ({games,stats,favorites,onSelectGame,onToggleFavorite,navigate}) => {
  const featured=games.filter(g=>g.featured).slice(0,5);
  const recent=games.filter(g=>stats.lastPlayed[g.id]).sort((a,b)=>new Date(stats.lastPlayed[b.id]).getTime()-new Date(stats.lastPlayed[a.id]).getTime()).slice(0,3);
  const surprise=()=>{sound.playPop();onSelectGame(games[Math.floor(Math.random()*games.length)]);};
  return <main className="gv-main gv-page-home">
    <section className="gv-hero gv-comic-stage">
      <div className="gv-stage-doodle gv-doodle-star">✦</div><div className="gv-stage-doodle gv-doodle-cloud">☁</div><div className="gv-stage-doodle gv-doodle-bolt">⚡</div>
      <div className="gv-hero-copy"><p className="gv-eyebrow">OFFLINE-READY • NO ADS • JUST PLAY</p><h1><span className="gv-hero-line">PLAY WHAT THE</span><span className="gv-moment-line"><em>moment</em></span><span className="gv-hero-line gv-feels-line">FEELS LIKE.</span></h1><p>Tell us your vibe. We’ll find a game that fits the exact energy you’re carrying right now.</p><div className="gv-hero-actions"><button className="gv-cta gv-cta-pink" onClick={()=>navigate('moody')}>FIND MY GAME <ArrowRight/></button><button className="gv-cta gv-cta-yellow" onClick={surprise}>SURPRISE ME <Dice5/></button></div></div>
      <HeroOrbitalScene/>
    </section>

    <section className="gv-section"><SectionTitle eyebrow="FOR THIS MOMENT" title={<>QUICK <em>MOOD</em> ACCESS</>} action={<button className="gv-text-action" onClick={()=>navigate('moody')}>OPEN MOODY <ArrowRight/></button>}/><div className="gv-mood-strip">{moodData.slice(0,5).map(m=>{const I=m.icon;return <button key={m.id} onClick={()=>navigate('moody')} className="gv-mini-mood" style={{'--p':m.primary,'--s':m.secondary,'--a':m.accent} as React.CSSProperties}><I/><b>{m.label}</b><span>{m.text}</span></button>})}</div></section>

    <section className="gv-section"><SectionTitle eyebrow="HANDPICKED" title={<>RECOMMENDED <em>FOR YOU</em></>} action={<button className="gv-text-action" onClick={()=>navigate('games')}>SEE ALL <ArrowRight/></button>}/><div className="gv-game-grid gv-featured-grid">{featured.map((g,i)=><GameCard key={g.id} game={g} index={i+1} favorite={favorites.includes(g.id)} onFavorite={()=>onToggleFavorite(g.id)} onPlay={()=>onSelectGame(g)}/>)}</div></section>

    <section className="gv-home-split"><div className="gv-continue-panel"><p className="gv-eyebrow">KEEP THE STORY GOING</p><h2>CONTINUE<br/><em>PLAYING.</em></h2>{recent.length?<div className="gv-mini-stack">{recent.map(g=><MiniGameCard key={g.id} game={g} score={stats.highScores[g.id]||0} onPlay={()=>onSelectGame(g)}/>)}</div>:<div className="gv-empty compact"><Rocket/><b>Your next obsession is waiting.</b><span>Pick any game and your playstory starts here.</span><button onClick={()=>navigate('games')}>EXPLORE GAMES <ArrowRight/></button></div>}</div><div className="gv-feature-callout"><div className="gv-callout-sticker">TRENDING ✦</div><PartyPopper size={48}/><h2>ONE TAP.<br/>A WHOLE NEW<br/><em>ADVENTURE.</em></h2><button onClick={surprise}>RANDOM PICK <Shuffle/></button></div></section>
  </main>;
};

const MoodyPage: React.FC<HomeProps> = ({games,onSelectGame}) => {
  const [selected,setSelected]=useState('chill'); const [shuffle,setShuffle]=useState(0);
  const mood=moodData.find(m=>m.id===selected)!; const picks=mood.match.map(id=>games.find(g=>g.id===id)).filter(Boolean) as GameItem[];
  const surpriseMood=()=>{const next=moodData[Math.floor(Math.random()*moodData.length)];setSelected(next.id);setShuffle(s=>s+1);sound.playPop();};
  return <main className="gv-main gv-page-moody"><section className="gv-page-hero gv-moody-hero"><p className="gv-eyebrow">YOUR VIBE IS THE REMOTE CONTROL</p><h1>HOW ARE WE<br/><em>FEELING?</em></h1><p>Pick the energy. We’ll turn it into a game plan.</p><button className="gv-cta gv-cta-purple" onClick={surpriseMood}>SURPRISE MY MOOD <Shuffle/></button></section><section className="gv-mood-wall">{moodData.map(m=>{const I=m.icon;return <button key={m.id} className={`gv-mood-tile ${selected===m.id?'selected':''}`} onClick={()=>setSelected(m.id)} style={{'--p':m.primary,'--s':m.secondary,'--a':m.accent} as React.CSSProperties}><div><I/><strong>{m.label}</strong></div><span>{m.text}</span><ArrowRight/></button>})}</section><section className="gv-mood-result" key={shuffle} style={{'--p':mood.primary,'--s':mood.secondary,'--a':mood.accent} as React.CSSProperties}><div className="gv-result-copy"><p className="gv-eyebrow">MOOD MATCH FOUND</p><h2>{mood.label}<br/><em>energy detected.</em></h2><p>These games match your pace right now. Zero overthinking required.</p><button onClick={surpriseMood}>RESHUFFLE PICKS <Shuffle/></button></div><div className="gv-result-games">{picks.slice(0,4).map((g,i)=><button key={g.id} className="gv-result-game" onClick={()=>onSelectGame(g)}><span>{String(i+1).padStart(2,'0')}</span><IconHelper name={g.icon} className="w-8 h-8"/><b>{g.title}</b><small>{g.description}</small><i>PLAY <ArrowRight/></i></button>)}</div></section></main>;
};

const GamesPage: React.FC<HomeProps & {search:string;setSearch:(v:string)=>void}> = ({games,stats,favorites,onSelectGame,onToggleFavorite,search,setSearch}) => {
  const [category,setCategory]=useState<GameCategory>('all'); const [difficulty,setDifficulty]=useState<'all'|'easy'|'medium'|'hard'>('all'); const [sort,setSort]=useState<'popular'|'name'>('popular');
  const visible=useMemo(()=>games.filter(g=>{
    const q=search.toLowerCase();
    return (!q||[g.title,g.category,g.description,...g.tags].join(' ').toLowerCase().includes(q))&&(category==='all'||g.category===category)&&(difficulty==='all'||g.difficulty===difficulty);
  }).sort((a,b)=>{
    if(sort==='name') return a.title.localeCompare(b.title);
    const countDiff=(stats.playCounts[b.id]||0)-(stats.playCounts[a.id]||0);
    if(countDiff!==0) return countDiff;
    const recentDiff=new Date(stats.lastPlayed[b.id]||0).getTime()-new Date(stats.lastPlayed[a.id]||0).getTime();
    if(recentDiff!==0) return recentDiff;
    return a.title.localeCompare(b.title);
  }),[games,stats.playCounts,stats.lastPlayed,search,category,difficulty,sort]);
  return <main className="gv-main gv-page-games"><section className="gv-page-hero gv-library-hero"><div><p className="gv-eyebrow">THE FULL COLLECTION</p><h1>EVERY GAME.<br/><em>EVERY MOOD.</em></h1><p>Twenty colourful little worlds. Pick one. Press play. Get lost.</p></div><div className="gv-big-search"><Search/><input autoFocus={false} value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search games, moods, categories..."/><button onClick={()=>setSearch('')}><X/></button></div></section><section className="gv-filter-deck"><div><span><Filter/> CATEGORY</span>{(['all','arcade','puzzle','strategy','board','word','quick','multiplayer'] as GameCategory[]).map(c=><button key={c} className={category===c?'active':''} onClick={()=>setCategory(c)}>{c==='all'?'ALL':c.toUpperCase()}</button>)}</div><div><span><SlidersHorizontal/> DIFFICULTY</span>{(['all','easy','medium','hard'] as const).map(d=><button key={d} className={difficulty===d?'active':''} onClick={()=>setDifficulty(d)}>{d.toUpperCase()}</button>)}</div><div className="gv-sort-row"><span>SORT</span><button onClick={()=>setSort(sort==='popular'?'name':'popular')}>{sort==='popular'?'POPULAR NOW':'A → Z'} <ChevronRight/></button></div></section><p className="gv-results-count">{visible.length} GAMES READY TO PLAY ✦</p><div className="gv-game-grid gv-library-grid">{visible.map((g,i)=><GameCard key={g.id} game={g} index={i+1} favorite={favorites.includes(g.id)} onFavorite={()=>onToggleFavorite(g.id)} onPlay={()=>onSelectGame(g)}/>)}</div>{!visible.length&&<div className="gv-empty"><Search/><h3>NO MATCH. YET.</h3><p>Try another word or filter. The game you want might be hiding in a different mood.</p></div>}</main>;
};

const GAME_TIME_BUCKET: Record<string,string> = {
  'reaction-time':'2 MIN','rock-paper-scissors':'2 MIN','number-guess':'2 MIN','whack-a-mole':'2 MIN','target-hitter':'2 MIN',
  'snake':'5 MIN','memory-match':'5 MIN','word-guess':'5 MIN','bubble-shooter':'5 MIN','tictactoe':'5 MIN','hangman':'5 MIN',
  'game-2048':'10 MIN','connect-four':'10 MIN','sudoku':'10 MIN','typing-test':'10 MIN','trivia-quiz':'10 MIN',
  'chess':'15+ MIN','checkers':'15+ MIN','ludo':'15+ MIN','snakes-and-ladders':'15+ MIN'
};

const DiscoverPage: React.FC<HomeProps> = ({games,onSelectGame}) => {
  const [pick,setPick]=useState<GameItem>(()=>games[0]);
  const [time,setTime]=useState<string>('ALL');
  const [difficulty,setDifficulty]=useState<string>('ALL');
  const [mood,setMood]=useState<string>('ALL');
  const [spin,setSpin]=useState(0);

  const candidates=useMemo(()=>games.filter(game=>{
    const timeMatch=time==='ALL'||GAME_TIME_BUCKET[game.id]===time;
    const difficultyMatch=difficulty==='ALL'||game.difficulty.toUpperCase()===difficulty;
    const moodMatch=mood==='ALL'||!!moodData.find(m=>m.label===mood)?.match.includes(game.id);
    return timeMatch&&difficultyMatch&&moodMatch;
  }),[games,time,difficulty,mood]);

  useEffect(()=>{
    if(candidates.length && !candidates.some(g=>g.id===pick.id)) setPick(candidates[0]);
  },[candidates,pick.id]);

  const reshuffle=()=>{
    const pool=candidates.length?candidates:games;
    if(!pool.length) return;
    const alternatives=pool.filter(g=>g.id!==pick.id);
    const source=alternatives.length?alternatives:pool;
    setPick(source[Math.floor(Math.random()*source.length)]);
    setSpin(n=>n+1);
    sound.playPop();
  };

  const clearFilters=()=>{setTime('ALL');setDifficulty('ALL');setMood('ALL');sound.playTap();};

  return <main className="gv-main gv-page-discover">
    <section className="gv-page-hero gv-discover-hero"><p className="gv-eyebrow">A DIFFERENT WAY TO CHOOSE</p><h1>DISCOVER BY<br/><em>FEELING.</em></h1><p>No endless scrolling. Start with the time, difficulty or mood you actually have.</p></section>
    <section className="gv-discover-grid">
      <DiscoverBlock icon={<Clock/>} title="PLAY BY TIME" items={['ALL',...playTimes]} active={time} onChoose={setTime}/>
      <DiscoverBlock icon={<Brain/>} title="PLAY BY DIFFICULTY" items={['ALL','EASY','MEDIUM','HARD']} active={difficulty} onChoose={setDifficulty}/>
      <DiscoverBlock icon={<Sparkles/>} title="PLAY BY MOOD" items={['ALL',...moodData.map(m=>m.label)]} active={mood} onChoose={setMood}/>
    </section>
    <div className="gv-discover-status"><span>{candidates.length} REAL GAME{candidates.length===1?'':'S'} MATCH YOUR PICKS</span>{(time!=='ALL'||difficulty!=='ALL'||mood!=='ALL')&&<button onClick={clearFilters}>CLEAR FILTERS <X size={15}/></button>}</div>
    <section className="gv-random-stage">
      <div className="gv-random-copy"><div className="gv-callout-sticker">NO THINKING REQUIRED</div><p className="gv-eyebrow">RANDOM PICK</p><h2>LET FATE<br/><em>CHOOSE.</em></h2><p>Every surprise comes from the games that actually match your filters. No fake picks. No dead ends.</p><button className="gv-cta gv-cta-pink" onClick={reshuffle}>SURPRISE ME <Shuffle/></button></div>
      <article key={spin} className="gv-random-card gv-random-card-in" style={{'--p':paletteFor(pick.id).primary,'--s':paletteFor(pick.id).secondary,'--a':paletteFor(pick.id).accent} as React.CSSProperties}>
        <div className="gv-random-art"><div className="gv-random-orbit gv-orbit-one"/><div className="gv-random-orbit gv-orbit-two"/><IconHelper name={pick.icon} className="w-20 h-20"/><span>{pick.badge||'QUICK PLAY'}</span></div>
        <div className="gv-random-details"><div className="gv-random-meta"><span>{pick.category.toUpperCase()}</span><span>{pick.difficulty.toUpperCase()}</span><span>{GAME_TIME_BUCKET[pick.id]||'QUICK PLAY'}</span></div><h3>{pick.title}</h3><small>{pick.description}</small><button onClick={()=>onSelectGame(pick)}>PLAY THIS ONE <ArrowRight/></button></div>
      </article>
    </section>
  </main>;
};

const SpacePage: React.FC<HomeProps> = ({games,stats,favorites,onSelectGame,onResetStats}) => {
  const recent=games.filter(g=>stats.lastPlayed[g.id]).sort((a,b)=>new Date(stats.lastPlayed[b.id]).getTime()-new Date(stats.lastPlayed[a.id]).getTime()).slice(0,4); const fav=games.filter(g=>favorites.includes(g.id)); const maxScore=Math.max(0,...(Object.values(stats.highScores) as number[]));
  const rankedMostPlayed=games.filter(g=>(stats.playCounts[g.id]||0)>0).sort((a,b)=>{const count=(stats.playCounts[b.id]||0)-(stats.playCounts[a.id]||0);if(count!==0)return count;return new Date(stats.lastPlayed[b.id]||0).getTime()-new Date(stats.lastPlayed[a.id]||0).getTime();});
  const mostGame=rankedMostPlayed[0];
  return <main className="gv-main gv-page-space"><section className="gv-page-hero gv-space-hero"><div><p className="gv-eyebrow">YOUR LITTLE CORNER OF GAMEVERSE</p><h1>MY <em>PLAYSPACE.</em></h1><p>Everything stays on this device. Your scores, streaks, favourites and glorious one-more-round decisions.</p></div><div className="gv-space-avatar">🎮<span>LOCAL PLAYER</span></div></section><section className="gv-stat-rainbow"><StatCard icon={<Gamepad/>} label="GAMES PLAYED" value={String(stats.gamesPlayed).padStart(2,'0')} note="Every tap counts."/><StatCard icon={<Trophy/>} label="HIGH SCORE" value={String(maxScore)} note="Your best is saved."/><StatCard icon={<Flame/>} label="TOTAL WINS" value={String(stats.totalWins)} note="Keep that streak warm."/><StatCard icon={<Heart/>} label="FAVOURITES" value={String(favorites.length)} note="The ones you keep coming back to."/></section><section className="gv-space-grid"><div className="gv-space-panel"><SectionTitle eyebrow="RECENT" title={<>CONTINUE <em>PLAYING</em></>}/>{recent.length?<div className="gv-mini-stack">{recent.map(g=><MiniGameCard key={g.id} game={g} score={stats.highScores[g.id]||0} onPlay={()=>onSelectGame(g)}/>)}</div>:<div className="gv-empty compact"><History/><b>No history yet.</b><span>Go make a little gaming history.</span></div>}</div><GameGalaxy games={games} onSelectGame={onSelectGame}/></section><section className="gv-favourites-shelf"><SectionTitle eyebrow="THE KEEPERS" title={<>FAVOURITE <em>GAMES</em></>}/>{fav.length?<div className="gv-game-grid gv-featured-grid">{fav.slice(0,6).map((g,i)=><GameCard key={g.id} game={g} index={i+1} favorite onFavorite={()=>{}} onPlay={()=>onSelectGame(g)}/>)}</div>:<div className="gv-empty"><Heart/><h3>NOTHING SAVED YET.</h3><p>Tap the heart on any game you love. We’ll keep it right here.</p></div>}</section><section className="gv-most-played"><div><p className="gv-eyebrow">MOST PLAYED • REAL LOCAL DATA</p><h2>{mostGame?mostGame.title:'NO PLAY DATA YET'}<br/><em>{mostGame?`${stats.playCounts[mostGame.id]} real play${stats.playCounts[mostGame.id]===1?'':'s'} on this device.`:'Play any game to start your ranking.'}</em></h2></div><button className="gv-danger-soft" onClick={onResetStats}>RESET LOCAL STATS <RotateCcw/></button></section></main>;
};

const AboutPage=()=> <main className="gv-main gv-page-about"><section className="gv-about-hero"><div className="gv-about-bubble">NO ADS<br/>NO ACCOUNT<br/>JUST PLAY.</div><p className="gv-eyebrow">WHY GAMEVERSE EXISTS</p><h1>GAMES SHOULD<br/>MATCH THE <em>moment.</em></h1><p className="gv-lede">Sometimes you want strategy. Sometimes you have exactly two minutes and one functioning brain cell. GameVerse is built around that truth.</p></section><section className="gv-philosophy-cards"><Philosophy n="01" icon={<Zap/>} title="PLAY FAST" text="No signup wall between you and the fun."/><Philosophy n="02" icon={<ShieldCheck/>} title="KEEP IT YOURS" text="Progress lives locally on your device."/><Philosophy n="03" icon={<Cloud/>} title="STAY OFFLINE" text="The core experience keeps working when the signal disappears."/><Philosophy n="04" icon={<Heart/>} title="NO ADS" text="No interruptions. No attention traps. Just the game."/></section><section className="gv-about-story"><div className="gv-story-art"><div className="gv-story-joystick">🕹️</div><span>✦</span><span>☁</span></div><div><p className="gv-eyebrow">THE BIG IDEA</p><h2>LESS CHOOSING.<br/>MORE <em>PLAYING.</em></h2><p>We’re making a colourful little universe where a game can meet you where you already are. Chill, competitive, tired, curious, wildly bored — there’s room for every version of your day.</p></div></section></main>;

// Fixed delivery destination used internally by the request action.
const REQUEST_RECIPIENT = 'gmrfoundationhubli@gmail.com';

const RequestPage=()=> {
  const [name,setName]=useState('');
  const [category,setCategory]=useState('');
  const [reason,setReason]=useState('');
  const [notes,setNotes]=useState('');
  const [sent,setSent]=useState(false);

  const submit=(e:React.FormEvent)=>{
    e.preventDefault();
    if(!name.trim() || !reason.trim()) return;

    const subject = `GameVerse game request: ${name.trim()}`;
    const body = [
      'NEW GAMEVERSE GAME REQUEST',
      '',
      `Game name: ${name.trim()}`,
      `Category: ${category || 'Not specified'}`,
      '',
      'Why this game should be added:',
      reason.trim(),
      '',
      'Optional notes:',
      notes.trim() || 'None',
      '',
      'Sent from the GameVerse request page.'
    ].join('\n');

    // Delivery destination stays internal; the interface never displays it.
    setSent(true);
    window.setTimeout(()=>{
      window.location.href = `mailto:${REQUEST_RECIPIENT}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    }, 80);
  };

  const reset=()=>{setSent(false);setName('');setCategory('');setReason('');setNotes('')};

  return <main className="gv-main gv-page-request"><section className="gv-request-layout"><div className="gv-request-copy"><p className="gv-eyebrow">HELP US BUILD THE SHELF</p><h1>WHAT SHOULD<br/>WE PLAY <em>NEXT?</em></h1><p>Got a game you wish existed here? Drop it in the request box and we'll handle the hand-off from there.</p><div className="gv-request-doodles"><span>🎲</span><span>🧩</span><span>🚀</span></div></div><form className="gv-request-form" onSubmit={submit}>{sent?<div className="gv-sent-state"><CheckCircle2/><h2>REQUEST<br/><em>READY TO SEND!</em></h2><p>Your email app is opening with your game request ready. Just hit <strong>Send</strong> to complete it.</p><button type="button" onClick={reset}>SEND ANOTHER <Send/></button></div>:<><div className="gv-request-privacy"><ShieldCheck size={16}/><span>YOUR REQUEST DETAILS STAY BETWEEN YOU AND THE GAMEVERSE TEAM.</span></div><label>GAME NAME<input required value={name} onChange={e=>setName(e.target.value)} placeholder="e.g. UNO, Tetris, Fruit Ninja..."/></label><label>GAME CATEGORY<select value={category} onChange={e=>setCategory(e.target.value)}><option value="">Choose a category</option><option>ARCADE</option><option>PUZZLE</option><option>STRATEGY</option><option>MEMORY</option><option>CLASSIC</option><option>CASUAL</option></select></label><label>WHY DO YOU WANT THIS GAME?<textarea required value={reason} onChange={e=>setReason(e.target.value)} placeholder="Tell us why this one deserves a spot..."/></label><label>OPTIONAL NOTES<textarea value={notes} onChange={e=>setNotes(e.target.value)} placeholder="Modes, features, memories, chaos... anything."/></label><button type="submit" className="gv-cta gv-cta-yellow">SEND MY REQUEST <Send/></button></>}</form></section></main>};

const SectionTitle:React.FC<{eyebrow:string;title:React.ReactNode;action?:React.ReactNode}>=({eyebrow,title,action})=><div className="gv-section-head"><div><p className="gv-eyebrow">{eyebrow}</p><h2>{title}</h2></div>{action}</div>;
const GAME_ART_FILES:Record<string,string>={
  // Bright, cartoon-style artwork for the most visible cards. The rest keep their game-specific illustrations.
  snake:'snake.svg', 'game-2048':'game-2048.svg', tictactoe:'tictactoe.svg', 'connect-four':'connect-four.svg', chess:'chess.svg', checkers:'checkers.svg', 'memory-match':'memory-match.svg', 'whack-a-mole':'whack-a-mole.svg', 'word-guess':'word-guess.svg', hangman:'hangman.svg', sudoku:'sudoku.svg', 'rock-paper-scissors':'rock-paper-scissors.svg', 'number-guess':'number-guess.svg', ludo:'ludo.svg', 'snakes-and-ladders':'snakes-and-ladders.svg', 'trivia-quiz':'trivia-quiz.svg', 'typing-test':'typing-test.svg', 'reaction-time':'reaction-time.svg', 'bubble-shooter':'bubble-shooter.svg', 'target-hitter':'target-hitter.svg'
};
const GameArt:React.FC<{id:string;title:string}>=({id,title})=>{const file=GAME_ART_FILES[id];return <div className="gv-game-illustration gv-game-image-illustration">{file?<img src={`/game-art/${file}`} alt={`${title} game artwork`} loading="eager" decoding="async" draggable={false}/>:<span className="ga-main">🎮</span>}</div>};
const HeroOrbitalScene: React.FC = () => {
  const sceneRef=useRef<HTMLDivElement>(null);
  const [tilt,setTilt]=useState({x:0,y:0});
  const onMove=(e:React.MouseEvent<HTMLDivElement>)=>{const el=sceneRef.current;if(!el)return;const r=el.getBoundingClientRect();setTilt({x:((e.clientY-r.top)/r.height-.5)*-3,y:((e.clientX-r.left)/r.width-.5)*4});};
  const cards=[
    {className:'gv-motion-pink m1', kicker:'THINK • SOLVE', title:'LOGICAL GAMES', mark:'↝'},
    {className:'gv-motion-blue m2', kicker:'FOCUS • REMEMBER', title:'MIND GAMES', mark:'✦'},
    {className:'gv-motion-yellow m3', kicker:'FAST • FUN', title:'QUICK GAMES', mark:'↗'},
    {className:'gv-motion-green m4', kicker:'PLAY • RELAX', title:'CLASSIC GAMES', mark:'○'},
  ];
  return <div className="gv-hero-motion-wrap"><div ref={sceneRef} className="gv-motion-square" onMouseMove={onMove} onMouseLeave={()=>setTilt({x:0,y:0})} style={{'--tilt-x':`${tilt.x}deg`,'--tilt-y':`${tilt.y}deg`} as React.CSSProperties}>
    <div className="gv-motion-ring ring-one"/><div className="gv-motion-ring ring-two"/>
    <div className="gv-motion-center">PLAY<br/><em>MORE.</em></div>
    <div className="gv-motion-orbit" aria-label="Four colourful games orbiting the Play More button">
      {cards.map(card=><div key={card.title} className={`gv-motion-card ${card.className}`}><span className="gv-motion-kicker">{card.kicker}</span><strong>{card.title}</strong><b aria-hidden="true">{card.mark}</b></div>)}
    </div>
    <div className="gv-motion-dot d1"/><div className="gv-motion-dot d2"/><div className="gv-motion-dot d3"/>
  </div></div>;
};

const GameGalaxy:React.FC<{games:GameItem[];onSelectGame:(game:GameItem)=>void}>=({games,onSelectGame})=>{
  // UI-only rotation: this never touches Firebase/database calls or game progress.
  const pickFour=(pool:GameItem[],avoid:string[]=[]):GameItem[]=>{
    const preferred=pool.filter(g=>!avoid.includes(g.id));
    const source=preferred.length>=4?preferred:pool;
    const shuffled=[...source].sort(()=>Math.random()-.5);
    const unique:GameItem[]=[];
    for(const game of shuffled){if(!unique.some(item=>item.id===game.id)) unique.push(game);if(unique.length===Math.min(4,pool.length)) break;}
    return unique;
  };
  const [orbitGames,setOrbitGames]=useState<GameItem[]>([]);
  // UI-only: populate as soon as the game list is available. This does not touch
  // Firebase/database calls, scores, sync state, or game functionality.
  useEffect(()=>{
    setOrbitGames(pickFour(games));
  },[games]);
  // Keep the orbit varied without ever changing application data.
  useEffect(()=>{
    if(games.length<2)return;
    const timer=window.setInterval(()=>setOrbitGames(current=>pickFour(games,current.map(g=>g.id))),12000);
    return()=>window.clearInterval(timer);
  },[games]);
  const surprise=()=>{const list=orbitGames.length?orbitGames:games;onSelectGame(list[Math.floor(Math.random()*list.length)]);};
  return <section className="gv-game-galaxy">
    <div className="gv-galaxy-heading"><p className="gv-eyebrow">YOUR NEXT PLAYGROUND</p><h2>WHAT ARE YOU<br/><em>PLAYING NEXT?</em></h2></div>
    <div className="gv-galaxy-stage" aria-label="Four games orbiting the next play button"><div className="gv-galaxy-ring ring-a"/><div className="gv-galaxy-ring ring-b"/><div className="gv-galaxy-core"><Gamepad2/><span>NEXT<br/><em>PLAY.</em></span></div><div className="gv-galaxy-orbit">{orbitGames.map((game,i)=><button key={game.id} className={`gv-galaxy-game g${i+1}`} onClick={()=>onSelectGame(game)} style={{'--p':paletteFor(game.id).primary,'--s':paletteFor(game.id).secondary,'--a':paletteFor(game.id).accent} as React.CSSProperties}><div><GameArt id={game.id} title={game.title}/></div><strong>{game.title}</strong><small>{game.difficulty.toUpperCase()} • PLAY</small></button>)}</div><span className="gv-galaxy-spark s1">✦</span><span className="gv-galaxy-spark s2">✦</span><span className="gv-galaxy-spark s3">✦</span></div>
    <div className="gv-galaxy-actions"><p>Four little worlds are in orbit. Catch one—or let fate pick.</p><button className="gv-cta gv-cta-pink" onClick={surprise}>SURPRISE ME <Shuffle/></button></div>
  </section>;
};

const GameCard:React.FC<{game:GameItem;index:number;favorite:boolean;onFavorite:()=>void;onPlay:()=>void}>=({game,index,favorite,onFavorite,onPlay})=>{const p=paletteFor(game.id);const activate=()=>{sound.playPop();onPlay();};return <article className="gv-game-card" tabIndex={0} role="button" aria-label={`Play ${game.title}`} onClick={activate} onKeyDown={e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();activate();}}} style={{'--p':p.primary,'--s':p.secondary,'--a':p.accent,'--cream':p.cream} as React.CSSProperties}><div className="gv-game-art"><div className="gv-art-shape s1"></div><div className="gv-art-shape s2"></div><GameArt id={game.id} title={game.title}/><span className="gv-game-number">{String(index).padStart(2,'0')}</span><span className="gv-game-badge">{game.badge||'QUICK PLAY'}</span><button className={`gv-heart ${favorite?'liked':''}`} onClick={e=>{e.stopPropagation();onFavorite();}} aria-label={`Favourite ${game.title}`}><Heart size={18} fill={favorite?'currentColor':'none'}/></button></div><div className="gv-game-info"><div className="gv-tag-row"><span>{game.category.toUpperCase()}</span><span>{game.difficulty.toUpperCase()}</span><span>{game.players.includes('1-2')?'VS':'SOLO'}</span></div><h3>{game.title}</h3><p>{game.description}</p><div className="gv-card-footer"><small>BEST SCORE: 0</small><button onClick={e=>{e.stopPropagation();activate();}}>PLAY NOW <ArrowRight size={16}/></button></div></div></article>};
const MiniGameCard:React.FC<{game:GameItem;score:number;onPlay:()=>void}>=({game,score,onPlay})=>{const p=paletteFor(game.id);return <button onClick={onPlay} className="gv-mini-card" style={{'--p':p.primary,'--s':p.secondary,'--a':p.accent} as React.CSSProperties}><IconHelper name={game.icon} className="w-7 h-7"/><div><strong>{game.title}</strong><span>BEST: {score} • {game.difficulty.toUpperCase()}</span></div><Play size={18}/></button>};
const DiscoverBlock:React.FC<{icon:React.ReactNode;title:string;items:string[];active:string;onChoose:(value:string)=>void}>=({icon,title,items,active,onChoose})=><article className="gv-discover-block"><div>{icon}<h3>{title}</h3></div><div className="gv-discover-pills">{items.map(i=><button key={i} type="button" aria-pressed={active===i} className={active===i?'active':''} onClick={()=>{onChoose(i);sound.playTap();}}>{i}</button>)}</div></article>;
const StatCard:React.FC<{icon:React.ReactNode;label:string;value:string;note:string}>=({icon,label,value,note})=><article className="gv-stat-card"><div>{icon}<span>{label}</span></div><strong>{value}</strong><small>{note}</small></article>;
const BadgeVaultCard:React.FC<{unlocked:boolean;icon:React.ReactNode;title:string;text:string;color:string}>=({unlocked,icon,title,text,color})=><article className={`gv-vault-badge ${unlocked?'unlocked':'locked'} gv-vault-${color}`}><div className="gv-vault-badge-icon">{icon}</div><div><strong>{title}</strong><span>{text}</span></div><div className="gv-vault-status">{unlocked?<CheckCircle2/>:<span>LOCKED</span>}</div></article>;
const Achievement:React.FC<{unlocked:boolean;icon:React.ReactNode;title:string}>=({unlocked,icon,title})=><div className={`gv-achievement ${unlocked?'unlocked':''}`}>{icon}<span>{title}</span>{unlocked?<CheckCircle2/>:<CircleHelp/>}</div>;
const Philosophy:React.FC<{n:string;icon:React.ReactNode;title:string;text:string}>=({n,icon,title,text})=><article><b>{n}</b><div>{icon}</div><h3>{title}</h3><p>{text}</p></article>;
const SiteFooter:React.FC<{navigate:(p:Page)=>void}>=({navigate})=><footer className="gv-footer"><div className="gv-footer-cloud">☁</div><p>Play what the <em>moment</em> feels like.</p><span>OFFLINE-READY • NO ADS • NO ACCOUNT • JUST PLAY</span><button onClick={()=>navigate('home')}>BACK TO TOP <ArrowRight/></button></footer>;
