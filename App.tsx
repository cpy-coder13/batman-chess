
import React, { useMemo, useRef, useState } from 'react'
import { Chess } from 'chess.js'
import { Chessboard } from 'react-chessboard'
import { motion } from 'framer-motion'

const COLORS = {
  boardDark: '#2b2f3a',
  boardLight: '#f2efe7',
  heroes: '#111827',
  villains: '#f8fafc',
  heroAccent: '#fbbf24',
  villainAccent: '#8b5cf6',
  ok: '#10b981'
}

const HERO = { K:'Batman', Q:'Batwoman', R:'Bat-Tower', B:'Nightwing / Robin', N:'Batcycle', P:'Rookie' }
const VILLAIN = { K:'Joker', Q:'Harley', R:'Iceberg Tower', B:'Riddler / Two-Face', N:'Bane / Scarecrow', P:'Hench' }

function PieceSVG({ side, type }: { side: 'hero'|'villain'; type: string }) {
  const base = side === 'hero' ? COLORS.heroes : COLORS.villains
  const accent = side === 'hero' ? COLORS.heroAccent : COLORS.villainAccent
  const stroke = side === 'hero' ? COLORS.villains : COLORS.heroes
  switch(type){
    case 'K':
      return (<svg viewBox='0 0 64 64' className='w-full h-full'>
        <circle cx='32' cy='32' r='28' fill={base} stroke={stroke} strokeWidth='2'/>
        <path d='M18 18 L24 10 L28 18 L36 18 L40 10 L46 18' fill='none' stroke={accent} strokeWidth='3'/>
        <text x='32' y='40' textAnchor='middle' fontSize='16' fill={accent} fontWeight='700'>K</text>
      </svg>)
    case 'Q':
      return (<svg viewBox='0 0 64 64' className='w-full h-full'>
        <rect x='8' y='8' width='48' height='48' rx='12' fill={base} stroke={stroke} strokeWidth='2'/>
        <path d='M16 20 L24 14 L32 22 L40 14 L48 20' fill='none' stroke={accent} strokeWidth='3'/>
        <text x='32' y='42' textAnchor='middle' fontSize='16' fill={accent} fontWeight='700'>Q</text>
      </svg>)
    case 'R':
      return (<svg viewBox='0 0 64 64' className='w-full h-full'>
        <path d='M14 50 H50 V40 H44 V22 H20 V40 H14 Z' fill={base} stroke={stroke} strokeWidth='2'/>
        <path d='M20 22 H44 V16 H36 V12 H28 V16 H20 Z' fill={accent}/>
        <text x='32' y='58' textAnchor='middle' fontSize='12' fill={accent} fontWeight='700'>R</text>
      </svg>)
    case 'B':
      return (<svg viewBox='0 0 64 64' className='w-full h-full'>
        <path d='M32 10 C22 18,22 30,32 38 C42 30,42 18,32 10 Z' fill={base} stroke={stroke} strokeWidth='2'/>
        <circle cx='32' cy='20' r='3' fill={accent}/>
        <text x='32' y='52' textAnchor='middle' fontSize='12' fill={accent} fontWeight='700'>B</text>
      </svg>)
    case 'N':
      return (<svg viewBox='0 0 64 64' className='w-full h-full'>
        <path d='M20 50 H48 V44 L40 28 L30 22 L20 28 Z' fill={base} stroke={stroke} strokeWidth='2'/>
        <circle cx='34' cy='26' r='2' fill={accent}/>
        <text x='34' y='58' textAnchor='middle' fontSize='12' fill={accent} fontWeight='700'>N</text>
      </svg>)
    default:
      return (<svg viewBox='0 0 64 64' className='w-full h-full'>
        <circle cx='32' cy='20' r='8' fill={base} stroke={stroke} strokeWidth='2'/>
        <rect x='24' y='28' width='16' height='18' rx='4' fill={base} stroke={stroke} strokeWidth='2'/>
        <text x='32' y='56' textAnchor='middle' fontSize='12' fill={accent} fontWeight='700'>P</text>
      </svg>)
  }
}

function useChess(){
  const gameRef = useRef(new Chess())
  const [fen, setFen] = useState(gameRef.current.fen())
  const [orientation, setOrientation] = useState<'white'|'black'>('black')
  const [lastMove, setLastMove] = useState<[string,string]|null>(null)

  const reset = () => { gameRef.current = new Chess(); setFen(gameRef.current.fen()); setLastMove(null) }
  const undo = () => { gameRef.current.undo(); setFen(gameRef.current.fen()); setLastMove(null) }
  const onDrop = (source: string, target: string) => {
    const move = gameRef.current.move({ from: source, to: target, promotion: 'q' })
    if(move){ setFen(gameRef.current.fen()); setLastMove([source, target]); return true }
    return false
  }
  const legalSquaresFrom = (square: string) => gameRef.current.moves({ square, verbose: true }).map(m=>m.to)

  return { fen, orientation, setOrientation, onDrop, reset, undo, lastMove, legalSquaresFrom, game: gameRef.current }
}

export default function App(){
  const { fen, orientation, setOrientation, onDrop, reset, undo, lastMove, game } = useChess()

  const customPieces = useMemo(()=>{
    const pieces: Record<string, (props:any)=>JSX.Element> = {}
    const types = ['K','Q','R','B','N','P'] as const
    types.forEach(t=>{
      pieces['b'+t] = (props:any)=>(<div className='w-full h-full p-1' title={`${HERO[t]} (Black)`} {...props}><PieceSVG side='hero' type={t}/></div>)
      pieces['w'+t] = (props:any)=>(<div className='w-full h-full p-1' title={`${VILLAIN[t]} (White)`} {...props}><PieceSVG side='villain' type={t}/></div>)
    })
    return pieces
  }, [])

  const customBoardStyle: React.CSSProperties = { borderRadius: '1rem', boxShadow: '0 10px 25px rgba(0,0,0,0.35)' }

  const customSquareStyles: Record<string, React.CSSProperties> = {}
  if (lastMove){ const [f,t] = lastMove; customSquareStyles[f] = { boxShadow:`inset 0 0 0 4px ${COLORS.ok}` }; customSquareStyles[t] = { boxShadow:`inset 0 0 0 4px ${COLORS.ok}` } }

  const status = (()=>{
    if (game.isCheckmate()) return 'Checkmate!'
    if (game.isDraw()) return 'Draw'
    if (game.isCheck()) return 'Check'
    return game.turn() === 'w' ? 'Villains to move' : 'Heroes to move'
  })()

  return (
    <div className='min-h-screen w-full bg-gradient-to-b from-neutral-900 via-neutral-900 to-neutral-800 text-white p-6'>
      <div className='max-w-6xl mx-auto grid lg:grid-cols-3 gap-6 items-start'>
        <div className='lg:col-span-2 bg-neutral-900/60 border border-neutral-700 rounded-2xl p-4'>
          <motion.div initial={{opacity:0,y:8}} animate={{opacity:1,y:0}}>
            <div className='flex items-center justify-between mb-4'>
              <h1 className='text-2xl font-bold flex items-center gap-2'><span className='text-yellow-400'>🦇</span>Batman Chess</h1>
              <div className='flex gap-2'>
                <button className='px-3 py-2 rounded-lg bg-neutral-800 border border-neutral-700' onClick={()=>setOrientation(orientation==='white'?'black':'white')}>Flip</button>
                <button className='px-3 py-2 rounded-lg bg-neutral-800 border border-neutral-700' onClick={undo}>Undo</button>
                <button className='px-3 py-2 rounded-lg bg-yellow-500 text-black hover:bg-yellow-400' onClick={reset}>Reset</button>
              </div>
            </div>

            <Chessboard
              id='batman-chess'
              position={fen}
              onPieceDrop={onDrop}
              boardOrientation={orientation}
              customPieces={customPieces}
              customBoardStyle={customBoardStyle}
              customSquareStyles={customSquareStyles}
              customDarkSquareStyle={{ backgroundColor: COLORS.boardDark }}
              customLightSquareStyle={{ backgroundColor: COLORS.boardLight }}
              animationDuration={200}
              arePremovesAllowed={true}
              showBoardNotation={true}
            />

            <div className='mt-4 text-sm text-neutral-300'>{status}</div>
          </motion.div>
        </div>

        <div className='space-y-4'>
          <div className='bg-neutral-900/60 border border-neutral-700 rounded-2xl p-4'>
            <h2 className='font-semibold mb-2'>Piece Legend</h2>
            <div className='grid grid-cols-2 gap-3 text-sm'>
              <div>
                <div className='font-semibold text-yellow-400 mb-1'>Heroes (Black)</div>
                <ul className='space-y-1 opacity-90'>
                  <li>K – Batman</li><li>Q – Batwoman</li><li>R – Bat‑Towers</li>
                  <li>B – Nightwing / Robin</li><li>N – Batcycle Knights</li><li>P – Rookie Patrol</li>
                </ul>
              </div>
              <div>
                <div className='font-semibold text-purple-300 mb-1'>Villains (White)</div>
                <ul className='space-y-1 opacity-90'>
                  <li>K – Joker</li><li>Q – Harley Quinn</li><li>R – Iceberg Towers</li>
                  <li>B – Riddler / Two‑Face</li><li>N – Bane / Scarecrow</li><li>P – Henchmen</li>
                </ul>
              </div>
            </div>
          </div>

          <div className='bg-neutral-900/60 border border-neutral-700 rounded-2xl p-4 text-sm'>
            <h2 className='font-semibold'>How to Play</h2>
            <ol className='list-decimal list-inside space-y-1 opacity-90'>
              <li>Heroes start at the bottom. Drag pieces to move.</li>
              <li>Legal moves are enforced automatically. Promotions become a Queen.</li>
              <li>Use <b>Flip</b> for the other side, <b>Undo</b> to revert, and <b>Reset</b> to start over.</li>
            </ol>
          </div>
        </div>
      </div>
      <footer className='mt-8 text-center text-xs text-neutral-400'>
        Built with <code>react-chessboard</code> + <code>chess.js</code>. Custom SVG set for a Gotham vibe.
      </footer>
    </div>
  )
}
