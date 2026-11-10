import { ChevronLeft, GalleryHorizontal, Heart, Info, Move, Pointer, Scan, Share, Trash2, ZoomIn } from 'lucide-react'
import { Count, Phone, Stage, type Act } from '../stageshow/kit'
import './zoom.css'

// react-native-zoom-reanimated, how it feels to use: a photo viewer on a
// phone, every gesture the library handles done once on one photo. A list
// beside the phone names each feature as it happens and says why it matters:
//   1. Double tap: 2x right where the finger taps.
//   2. Focal-point pinch: two fingers spread over the tram's destination
//      board and the board stays under them.
//   3. Rubber band: the pinch goes past the 4x limit, resists, and springs
//      back to 4x when the fingers lift.
//   4. Momentum pan: a flick glides on and bounces off the photo's edge.
//   5. Gallery swipe: at the edge the same swipe carries on into the parent
//      FlatList and the next photo comes in, as in Apple Photos.
// The payoff holds, then a plain swipe back brings the first photo in at 1x
// (the library reset it when it left) and the loop starts again.
//
// Real strings: the five feature names and their lines, the closing line,
// the album title, the photo counter and the zoom readout. Inside the phone
// 1px is 1pt; the script works in stage px and converts with `k`.

type Ease = 'none' | 'tap' | 'spring' | 'glide' | 'bounce'

type S = {
  /** The feature in play, 1-based; 0 for none, past the last for all done */
  step: number
  /** The page the gallery shows: 0 is the tram, 1 the river */
  page: number
  /** The gallery track's offset while a finger drags it, in pt */
  drag: number
  /** The track eases to its page; off while a finger holds it */
  paging: boolean
  /** The tram photo's zoom: scale and translation in pt from centered */
  s: number
  tx: number
  ty: number
  ease: Ease
  /** The zoom readout (onZoomChange) */
  zoom: number
  /** The second finger of a pinch, in stage px; it stays where it lifted while it fades */
  f2: { x: number; y: number }
  two: boolean
}

const START: S = { step: 0, page: 0, drag: 0, paging: true, s: 1, tx: 0, ty: 0, ease: 'none', zoom: 1, f2: { x: 0, y: 0 }, two: false }

/** The screen, the viewport the photos zoom in, and the photo, in pt */
const W = 402
const VH = 330
const PH = W * 0.75
const GAP = 20
const MAX = 4

/** The destination board on the tram, in photo pt from the photo's center */
const BOARD = { x: (156 / 400) * W - W / 2, y: (150 / 300) * PH - PH / 2 }

const FEATURES = [
  { icon: Pointer, title: 'Double tap', line: 'Zooms to 2x right where you tap' },
  { icon: ZoomIn, title: 'Focal-point pinch', line: 'The spot under your fingers stays put' },
  { icon: Scan, title: 'Rubber band', line: 'Past the limit it resists, then springs back' },
  { icon: Move, title: 'Momentum pan', line: 'Flick to glide, bounce off the edges' },
  { icon: GalleryHorizontal, title: 'Gallery swipe', line: 'At the edge the swipe pages the FlatList' },
]
const LAST = FEATURES.length

const THUMBS: Art[] = ['facade', 'tiles', 'tram', 'river', 'coffee', 'lemon', 'night', 'sunset', 'tiles', 'facade', 'river', 'coffee']
const FIRST = 2

const bounds = (s: number) => ({ x: Math.max(0, (W * s - W) / 2), y: Math.max(0, (PH * s - VH) / 2) })
const clampT = (s: number, tx: number, ty: number) => {
  const b = bounds(s)
  return { tx: Math.max(-b.x, Math.min(b.x, tx)), ty: Math.max(-b.y, Math.min(b.y, ty)) }
}

/** Past a bound a drag moves a third as far, as the library's rubber band does */
const rubber = (v: number, b: number) => (v > b ? b + (v - b) * 0.35 : v < -b ? -b + (v + b) * 0.35 : v)

async function script(a: Act<S>) {
  a.mark('start')
  await a.wait(900)

  // The viewport in stage px, and how many stage px make one pt
  const view = () => a.rect('viewport')
  const k = () => view().width / W
  /** A photo point (pt from the photo's center) at the photo's current zoom, in stage px */
  const onStage = (st: S, p: { x: number; y: number }) => {
    const v = view()
    return { x: v.x + (W / 2 + st.tx + st.s * p.x) * k(), y: v.y + (VH / 2 + st.ty + st.s * p.y) * k() }
  }
  /** A stage point as pt from the viewport's center */
  const toPt = (at: { x: number; y: number }) => {
    const v = view()
    return { x: (at.x - v.x) / k() - W / 2, y: (at.y - v.y) / k() - VH / 2 }
  }

  let st = { ...START }
  const put = (patch: Partial<S>) => {
    st = { ...st, ...patch }
    a.put(patch)
  }
  /** The readout counts with the photo, as onZoomChange reports each frame */
  const readout = async (from: number, to: number, ms: number) => {
    const steps = Math.max(1, Math.round(ms / 32))
    for (let i = 1; i <= steps; i++) {
      const t = i / steps
      const e = t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2
      a.put({ zoom: from + (to - from) * e })
      await a.wait(ms / steps)
    }
  }

  // 1. Double tap the tram: 2x, centered on the tap
  a.mark('double-tap')
  put({ step: 1 })
  const tap = onStage(st, { x: BOARD.x + 10, y: BOARD.y + 26 })
  await a.move(tap)
  await a.wait(150)
  await a.click(tap, { double: true })
  {
    const f = toPt(tap)
    const s = 2
    const t = clampT(s, f.x - ((f.x - st.tx) / st.s) * s, f.y - ((f.y - st.ty) / st.s) * s)
    put({ ease: 'tap', s, ...t })
    await readout(1, 2, 350)
  }
  await a.wait(900)

  // 2. Pinch on the destination board; 3. past 4x it gives, then springs back
  a.mark('pinch')
  put({ step: 2 })
  const focal = onStage(st, BOARD)
  const d0 = { x: -26, y: 18 }
  const reach = 2.5
  const from = { x: focal.x + d0.x, y: focal.y + d0.y }
  const to = { x: focal.x + d0.x * reach, y: focal.y + d0.y * reach }
  await a.move(from)
  await a.wait(120)
  const s0 = st.s
  const t0 = { x: st.tx, y: st.ty }
  const f = toPt(focal)
  const p = { x: (f.x - t0.x) / s0, y: (f.y - t0.y) / s0 }
  const len0 = Math.hypot(d0.x, d0.y)
  put({ ease: 'none', two: true, f2: { x: focal.x - d0.x, y: focal.y - d0.y } })
  await a.drag(
    to,
    (at) => {
      const raw = (s0 * Math.hypot(at.x - focal.x, at.y - focal.y)) / len0
      const s = raw <= MAX ? raw : MAX + (raw - MAX) * 0.35
      put({ s, tx: f.x - p.x * s, ty: f.y - p.y * s, zoom: s, f2: { x: 2 * focal.x - at.x, y: 2 * focal.y - at.y }, step: raw > MAX ? 3 : 2 })
    },
    { duration: 1300, path: (e, a0, b0) => ({ x: a0.x + (b0.x - a0.x) * e, y: a0.y + (b0.y - a0.y) * e }) },
  )
  {
    const over = st.s
    put({ two: false, ease: 'spring', s: MAX, ...clampT(MAX, f.x - p.x * MAX, f.y - p.y * MAX) })
    await readout(over, MAX, 420)
  }
  await a.wait(1000)

  // 4. A flick to the left: the photo glides on and bounces off its edge
  a.mark('pan')
  put({ step: 4 })
  const grab = { x: view().x + view().width * 0.66, y: view().y + view().height * 0.58 }
  const flick = { x: grab.x - 130, y: grab.y - 34 }
  await a.move(grab)
  await a.wait(150)
  {
    const b = bounds(st.s)
    const start = { x: st.tx, y: st.ty }
    put({ ease: 'none' })
    await a.drag(flick, (at) => {
      put({ tx: rubber(start.x + (at.x - grab.x) / k(), b.x), ty: rubber(start.y + (at.y - grab.y) / k(), b.y) })
    })
    // The throw carries it past the edge, which pulls it back
    put({ ease: 'glide', tx: -b.x - 22, ty: Math.max(-b.y, st.ty - 40) })
    await a.wait(560)
    put({ ease: 'bounce', tx: -b.x })
  }
  await a.wait(1000)

  // 5. At the edge the same swipe moves the gallery: the next photo comes in
  a.mark('gallery')
  put({ step: 5 })
  const hold = { x: view().x + view().width * 0.74, y: view().y + view().height * 0.5 }
  await a.move(hold)
  await a.wait(150)
  put({ paging: false })
  await a.drag({ x: hold.x - 150, y: hold.y - 6 }, (at) => put({ drag: Math.min(0, (at.x - hold.x) / k()) }), { duration: 420 })
  put({ paging: true, page: 1, drag: 0, zoom: 1 })
  await a.wait(500)
  // The photo it left resets to 1x, out of sight
  await a.snap({ s: 1, tx: 0, ty: 0, ease: 'none' })
  st = { ...st, s: 1, tx: 0, ty: 0, ease: 'none' }
  put({ step: LAST + 1 })
  await a.wait(2000)

  // A plain swipe back: the tram again, at 1x, and the list clears
  a.mark('reset')
  const back = { x: view().x + view().width * 0.3, y: view().y + view().height * 0.5 }
  await a.move(back)
  await a.wait(120)
  put({ step: 0, paging: false })
  await a.drag({ x: back.x + 130, y: back.y + 4 }, (at) => put({ drag: Math.max(0, (at.x - back.x) / k()) }))
  put({ paging: true, page: 0, drag: 0 })
  await a.move(a.layout === 'wide' ? { x: 660, y: 470 } : { x: 300, y: 500 })
  await a.wait(300)
  await a.snap(START)
}

type Art = 'tram' | 'river' | 'tiles' | 'facade' | 'coffee' | 'lemon' | 'night' | 'sunset'

/** A photo, drawn: flat shapes in the colors of a Lisbon day. The tram has detail to zoom into. */
function Photo({ art, className }: { art: Art; className?: string }) {
  return (
    <svg className={className} viewBox="0 0 400 300" preserveAspectRatio="xMidYMid slice" aria-hidden>
      {art === 'tram' && <Tram />}
      {art === 'river' && (
        <>
          <defs>
            <linearGradient id="zr-dusk" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#7f9fd6" />
              <stop offset="0.6" stopColor="#f2a488" />
              <stop offset="1" stopColor="#ffd39a" />
            </linearGradient>
          </defs>
          <rect width="400" height="300" fill="url(#zr-dusk)" />
          <circle cx="292" cy="158" r="26" fill="#fff0c9" />
          <rect y="176" width="400" height="124" fill="#4f6fa3" />
          <path d="M0 176H400V186H0Z" fill="#6c86b4" />
          <path d="M0 132 70 128 110 140 170 134V176H0Z" fill="#6b5a7d" />
          <path d="M150 176V96H160V176ZM330 176V96H340V176Z" fill="#c2412d" />
          <path d="M40 150Q155 60 155 96 155 60 270 150 335 60 335 96 335 60 400 140" fill="none" stroke="#c2412d" strokeWidth="4" />
          <path d="M0 150H400" stroke="#c2412d" strokeWidth="6" />
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <path key={i} d={`M${40 + i * 70} ${214 + (i % 2) * 22}h34`} stroke="#9fb4d8" strokeWidth="3" strokeLinecap="round" />
          ))}
        </>
      )}
      {art === 'tiles' && (
        <>
          <rect width="400" height="300" fill="#f4f1ea" />
          {[0, 1, 2, 3].map((r) =>
            [0, 1, 2, 3, 4, 5].map((c) => (
              <g key={`${r}${c}`} transform={`translate(${c * 75 - 25} ${r * 75})`}>
                <circle cx="37.5" cy="37.5" r="21" fill="none" stroke="#2c5aa0" strokeWidth="7" />
                <circle cx="37.5" cy="37.5" r="7" fill="#2c5aa0" />
              </g>
            )),
          )}
        </>
      )}
      {art === 'facade' && (
        <>
          <rect width="400" height="300" fill="#f3b8b0" />
          <rect x="134" width="134" height="300" fill="#f7e0a1" />
          <rect x="268" width="132" height="300" fill="#a9d3c8" />
          {[40, 130, 220].map((y) => [30, 176, 310].map((x) => <rect key={`${x}${y}`} x={x} y={y} width="56" height="62" rx="28" fill="#fff" opacity="0.85" />))}
        </>
      )}
      {art === 'coffee' && (
        <>
          <rect width="400" height="300" fill="#d9b48f" />
          <circle cx="200" cy="150" r="96" fill="#f6efe6" />
          <circle cx="200" cy="150" r="70" fill="#6f4429" />
        </>
      )}
      {art === 'lemon' && (
        <>
          <rect width="400" height="300" fill="#f5dc5a" />
          <circle cx="150" cy="130" r="70" fill="#fff1a1" />
          <circle cx="260" cy="180" r="80" fill="#fbe56f" />
        </>
      )}
      {art === 'night' && (
        <>
          <rect width="400" height="300" fill="#1d2a48" />
          <path d="M0 230 120 200 240 216 400 186V300H0Z" fill="#111a2e" />
          <circle cx="300" cy="90" r="26" fill="#f4f0d8" />
        </>
      )}
      {art === 'sunset' && (
        <>
          <rect width="400" height="300" fill="#f08a7a" />
          <circle cx="200" cy="200" r="52" fill="#ffe2a6" />
          <path d="M0 210H40V180H72V200H104V164H136V194H176V216H224V174H248V150H264V174H296V198H336V168H368V192H400V300H0Z" fill="#4a3555" />
        </>
      )}
    </svg>
  )
}

/** The tram photo: a street in Alfama, tram 28 on its way to Prazeres */
function Tram() {
  return (
    <>
      <defs>
        <linearGradient id="zr-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#9fd2f0" />
          <stop offset="1" stopColor="#e3f3fb" />
        </linearGradient>
        <pattern id="zr-azulejo" width="12" height="12" patternUnits="userSpaceOnUse">
          <rect width="12" height="12" fill="#eef3fa" />
          <circle cx="6" cy="6" r="3.4" fill="none" stroke="#2f62ad" strokeWidth="1.3" />
          <circle cx="6" cy="6" r="1" fill="#2f62ad" />
        </pattern>
      </defs>
      <rect width="400" height="300" fill="url(#zr-sky)" />
      {/* Houses: a tiled one on the left, a yellow one on the right */}
      <rect x="-4" y="40" width="132" height="210" fill="url(#zr-azulejo)" />
      <path d="M-4 40H128V30H-4Z" fill="#c8664f" />
      {[60, 120, 180].map((y) =>
        [14, 72].map((x) => (
          <g key={`${x}${y}`}>
            <rect x={x} y={y} width="34" height="42" rx="3" fill="#33495f" />
            <rect x={x - 3} y={y + 40} width="40" height="5" fill="#e9e3d6" />
          </g>
        )),
      )}
      <rect x="282" y="56" width="130" height="194" fill="#f2cd6b" />
      <path d="M282 56H412V46H282Z" fill="#b5553f" />
      {[76, 136, 196].map((y) =>
        [298, 352].map((x) => (
          <g key={`${x}${y}`}>
            <rect x={x - 7} y={y} width="7" height="40" fill="#3f7d5a" />
            <rect x={x} y={y} width="30" height="40" rx="2" fill="#33495f" />
            <rect x={x + 30} y={y} width="7" height="40" fill="#3f7d5a" />
          </g>
        )),
      )}
      <rect x="128" y="96" width="154" height="154" fill="#e9d8c2" />
      {/* Street and rails */}
      <rect y="246" width="400" height="54" fill="#cdbba4" />
      <path d="M0 268H400M0 284H400" stroke="#9c8a74" strokeWidth="2" />
      {/* The overhead wire and the pole */}
      <path d="M0 74H400" stroke="#4a4a4a" strokeWidth="1.2" />
      <path d="M232 112 262 74" stroke="#3a3a3a" strokeWidth="2" />
      {/* Tram 28 */}
      <rect x="108" y="112" width="200" height="22" rx="8" fill="#f6f1e6" />
      <rect x="104" y="128" width="208" height="110" rx="10" fill="#f4c22b" />
      <rect x="104" y="204" width="208" height="12" fill="#e8e1d2" />
      <rect x="104" y="216" width="208" height="22" rx="4" fill="#d9a514" />
      {/* Destination board: "28 Prazeres" */}
      <rect x="120" y="140" width="72" height="20" rx="3" fill="#1d1f22" />
      <text x="126" y="154.5" fontFamily="-apple-system, system-ui, sans-serif" fontSize="11" fontWeight="700" fill="#ffcf3a">
        28
      </text>
      <text x="145" y="154" fontFamily="-apple-system, system-ui, sans-serif" fontSize="8.5" fontWeight="600" fill="#ffcf3a">
        Prazeres
      </text>
      {[206, 238, 270].map((x) => (
        <rect key={x} x={x} y="142" width="26" height="30" rx="3" fill="#33495f" />
      ))}
      <rect x="120" y="166" width="72" height="34" rx="3" fill="#33495f" />
      <rect x="116" y="176" width="2" height="24" fill="#33495f" />
      <text x="282" y="196" fontFamily="-apple-system, system-ui, sans-serif" fontSize="9" fontWeight="700" fill="#8a6a0c">
        CARRIS
      </text>
      <rect x="236" y="186" width="2" height="16" fill="#8a6a0c" opacity="0.5" />
      <circle cx="140" cy="240" r="10" fill="#2c2c2c" />
      <circle cx="276" cy="240" r="10" fill="#2c2c2c" />
      <circle cx="140" cy="240" r="3.5" fill="#777" />
      <circle cx="276" cy="240" r="3.5" fill="#777" />
      <circle cx="110" cy="196" r="4.5" fill="#fff6c9" />
    </>
  )
}

function Features({ step }: { step: number }) {
  return (
    <ol className="zr-features">
      {FEATURES.map((f, i) => {
        const n = i + 1
        const state = step === n ? 'on' : step > n ? 'done' : 'next'
        const Glyph = f.icon
        return (
          <li key={f.title} className="zr-feature" data-state={state}>
            <span className="zr-feature__tile">
              <Glyph size={18} strokeWidth={2} />
            </span>
            <span className="zr-feature__words">
              <span className="zr-feature__title">{f.title}</span>
              <span className="zr-feature__line">{f.line}</span>
            </span>
          </li>
        )
      })}
      <li className="zr-more">All on the UI thread with Reanimated worklets. Plus a hook API, min and max scale, zoom callbacks and Gesture Handler v2 and v3.</li>
    </ol>
  )
}

/** Compact: the feature in play, as a caption over the top of the stage. */
function Caption({ step }: { step: number }) {
  // At rest it names the first feature, the one about to happen
  const n = Math.max(1, Math.min(step, LAST))
  return (
    <div className="zr-caption" data-show="">
      {FEATURES.map((f, i) => {
        const Glyph = f.icon
        return (
          <span key={f.title} className="zr-caption__item" data-on={n === i + 1 || undefined}>
            <Glyph size={16} strokeWidth={2.2} />
            {f.title}
          </span>
        )
      })}
    </div>
  )
}

/** The filmstrip under the photo: the current photo wider, centered */
function Strip({ index }: { index: number }) {
  const wide = 54
  const thin = 30
  const gap = 2
  const center = index * (thin + gap) + wide / 2
  return (
    <div className="zr-strip">
      <div className="zr-strip__track" style={{ transform: `translateX(${W / 2 - center}px)` }}>
        {THUMBS.map((art, i) => (
          <span key={i} className="zr-thumb" data-on={i === index || undefined}>
            <Photo art={art} className="zr-thumb__img" />
          </span>
        ))}
      </div>
    </div>
  )
}

const poster: S = { ...START, step: 3, s: MAX, tx: -BOARD.x * MAX + 40, ty: -BOARD.y * MAX + 30, zoom: MAX }

export default function ZoomDemo({ theme = 'light' }: { theme?: 'light' | 'dark' }) {
  return (
    <Stage<S>
      width={760}
      height={540}
      compact={{ below: 600, width: 358, height: 560 }}
      initial={START}
      poster={poster}
      script={script}
      play="loop"
      theme={theme}
      cursor={{ at: { wide: { x: 660, y: 470 }, compact: { x: 300, y: 500 } }, style: 'touch' }}
      className="zr"
    >
      {(s, _rect, layout) => {
        const index = FIRST + s.page
        return (
          <>
            {layout === 'wide' ? <Features step={s.step} /> : <Caption step={s.step} />}
            <Phone width={layout === 'wide' ? 340 : 326} className="zr-phone" dark={theme === 'dark'}>
              <div className="zr-screen">
                <div className="zr-nav">
                  <span className="zr-round">
                    <ChevronLeft size={24} strokeWidth={2.4} />
                  </span>
                  <span className="zr-title">
                    <span className="zr-title__name">Lisbon</span>
                    <span className="zr-title__count">
                      <Count value={index + 1} duration={420} /> of {THUMBS.length}
                    </span>
                  </span>
                  <span className="zr-zoom">{s.zoom.toFixed(1)}x</span>
                </div>
                <div className="zr-viewport" data-target="viewport">
                  <div
                    className="zr-track"
                    data-paging={s.paging || undefined}
                    style={{ transform: `translateX(${-s.page * (W + GAP) + s.drag}px)` }}
                  >
                    <div className="zr-page">
                      <div className="zr-zoomable" data-snap data-ease={s.ease} style={{ transform: `translate(${s.tx}px, ${s.ty}px) scale(${s.s})` }}>
                        <Photo art="tram" className="zr-photo" />
                      </div>
                    </div>
                    <div className="zr-page">
                      <div className="zr-zoomable">
                        <Photo art="river" className="zr-photo" />
                      </div>
                    </div>
                  </div>
                </div>
                <Strip index={index} />
                <div className="zr-tools" aria-hidden>
                  <Share size={24} strokeWidth={1.9} />
                  <Heart size={24} strokeWidth={1.9} />
                  <Info size={24} strokeWidth={1.9} />
                  <Trash2 size={24} strokeWidth={1.9} />
                </div>
              </div>
            </Phone>
            <span className="zr-finger" data-on={s.two || undefined} style={{ left: s.f2.x, top: s.f2.y }} aria-hidden />
          </>
        )
      }}
    </Stage>
  )
}
