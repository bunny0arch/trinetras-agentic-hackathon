import { useEffect, useRef, useState } from "react";
import "./NightshiftGame.css";

type Mode = "menu" | "intro" | "play" | "pause" | "ending";
type Kind = "enemy" | "boss" | "pickup" | "door" | "redDoor";
type Entity = { id: number; kind: Kind; x: number; y: number; hp?: number; maxHp?: number; subtype?: string; alive?: boolean; room?: number };
type SaveState = { mode: Mode; player: Player; entities: Entity[]; kills: number; cured: number; rooms: number; startedAt: number; elapsed: number; message: string };
type Player = { x: number; y: number; hp: number; mag: number; reserve: number; kits: number; artifacts: number; keys: number; antidotes: number; companions: number; gun: boolean; bossDefeated: boolean };

const W = 1800, H = 1080, PLAYER_MAX = 200;
const START: Player = { x: 330, y: 540, hp: 200, mag: 0, reserve: 0, kits: 2, artifacts: 0, keys: 0, antidotes: 0, companions: 0, gun: false, bossDefeated: false };
const makeEntities = (): Entity[] => {
  const enemies: Entity[] = Array.from({ length: 18 }, (_, i) => ({ id: i, kind: "enemy", x: 720 + (i % 6) * 130, y: 240 + Math.floor(i / 6) * 190, hp: 2, maxHp: 2, alive: true, room: i % 5 }));
  return [...enemies,
    { id: 100, kind: "pickup", subtype: "gun", x: 470, y: 550 },
    { id: 101, kind: "pickup", subtype: "ammo", x: 585, y: 435 },
    { id: 102, kind: "pickup", subtype: "kit", x: 1010, y: 300 },
    { id: 103, kind: "pickup", subtype: "antidote", x: 1480, y: 790 },
    { id: 104, kind: "door", subtype: "locked", x: 1210, y: 540 },
    { id: 105, kind: "redDoor", subtype: "red", x: 1630, y: 540 },
    { id: 106, kind: "boss", subtype: "warden", x: 1650, y: 540, hp: 40, maxHp: 40, alive: true },
  ];
};

function clamp(n: number, min: number, max: number) { return Math.max(min, Math.min(max, n)); }
function dist(a: { x: number; y: number }, b: { x: number; y: number }) { return Math.hypot(a.x - b.x, a.y - b.y); }

export default function NightshiftGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const raf = useRef<number | undefined>(undefined);
  const keys = useRef<Record<string, boolean>>({});
  const mouse = useRef({ x: 900, y: 540, down: false });
  const touch = useRef({ moveX: 0, moveY: 0, firing: false });
  const state = useRef<SaveState>({ mode: "menu", player: { ...START }, entities: makeEntities(), kills: 0, cured: 0, rooms: 0, startedAt: 0, elapsed: 0, message: "" });
  const [screen, setScreen] = useState<Mode>("menu");
  const [hud, setHud] = useState({ hp: 200, mag: 0, reserve: 0, kits: 2, artifacts: 0, keys: 0, antidotes: 0, companions: 0, kills: 0, cured: 0, rooms: 0, message: "" });

  const sync = () => { const s = state.current; setHud({ hp: Math.ceil(s.player.hp), mag: s.player.mag, reserve: s.player.reserve, kits: s.player.kits, artifacts: s.player.artifacts, keys: s.player.keys, antidotes: s.player.antidotes, companions: s.player.companions, kills: s.kills, cured: s.cured, rooms: s.rooms, message: s.message }); };
  const start = () => { state.current = { mode: "intro", player: { ...START }, entities: makeEntities(), kills: 0, cured: 0, rooms: 1, startedAt: performance.now(), elapsed: 0, message: "Find the weapon. The halls are listening." }; setScreen("intro"); sync(); setTimeout(() => { state.current.mode = "play"; setScreen("play"); }, 2600); };
  const save = () => { localStorage.setItem("nightshift-save", JSON.stringify(state.current)); state.current.message = "PROGRESS SAVED"; sync(); setTimeout(() => { state.current.message = ""; sync(); }, 1400); };
  const load = () => { const raw = localStorage.getItem("nightshift-save"); if (!raw) { state.current.message = "NO SAVE FOUND"; sync(); return; } state.current = JSON.parse(raw); state.current.mode = "play"; setScreen("play"); sync(); };
  const shoot = () => { const s = state.current; if (s.mode !== "play" || !s.player.gun || s.player.mag <= 0) return; s.player.mag--; const target = s.entities.filter(e => (e.kind === "enemy" || e.kind === "boss") && e.alive && dist(s.player, e) < 440).sort((a, b) => dist(s.player, a) - dist(s.player, b))[0]; if (target) { target.hp = (target.hp ?? 1) - 1; if ((target.hp ?? 0) <= 0) { target.alive = false; if (target.kind === "boss") { s.player.bossDefeated = true; s.mode = "ending"; s.elapsed = (performance.now() - s.startedAt) / 1000; setScreen("ending"); } else { s.kills++; s.player.artifacts += 2; s.message = "+2 METAL ARTIFACTS"; } } } sync(); };
  const reload = () => { const s = state.current; const need = 12 - s.player.mag; const take = Math.min(need, s.player.reserve); s.player.mag += take; s.player.reserve -= take; sync(); };
  const heal = () => { const s = state.current; if (s.player.kits > 0 && s.player.hp < PLAYER_MAX) { s.player.kits--; s.player.hp = Math.min(PLAYER_MAX, s.player.hp + 75); sync(); } };
  const interact = () => { const s = state.current; const near = s.entities.find(e => (e.kind === "pickup" || e.kind === "door" || e.kind === "redDoor") && dist(s.player, e) < 75); if (!near) return; if (near.kind === "pickup") { if (near.subtype === "gun") { s.player.gun = true; s.player.mag = 12; s.player.reserve = 18; s.message = "SIDEARM RECOVERED — 30 ROUNDS"; } if (near.subtype === "ammo") s.player.reserve += 12; if (near.subtype === "kit") s.player.kits++; if (near.subtype === "antidote") s.player.antidotes++; near.alive = false; } else if (near.kind === "door") { if (s.player.artifacts >= 4) { s.player.artifacts -= 4; near.kind = "pickup"; near.subtype = "opened"; near.x += 130; s.rooms++; s.message = "LOCK BROKEN — ROOM CONTENTS UNKNOWN"; } else s.message = "LOCKED — CRAFT A KEY (4 METAL)"; } else if (near.kind === "redDoor") { if (s.kills >= 40 && s.cured >= 2) { near.alive = false; s.message = "THE RED DOOR OPENS"; } else s.message = `RED DOOR — ${s.kills}/40 KILLS · ${s.cured}/2 CURED`; } sync(); };
  const cure = () => { const s = state.current; if (s.player.antidotes <= 0) return; const enemy = s.entities.find(e => e.kind === "enemy" && e.alive && dist(s.player, e) < 110); if (enemy) { enemy.alive = false; enemy.kind = "pickup"; enemy.subtype = "companion"; s.player.antidotes--; s.cured++; s.player.companions++; s.message = "HOSTILE CURED — COMPANION AWAKENED"; sync(); } };

  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return; const ctx = canvas.getContext("2d"); if (!ctx) return;
    const resize = () => { canvas.width = window.innerWidth * devicePixelRatio; canvas.height = window.innerHeight * devicePixelRatio; ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0); };
    resize(); window.addEventListener("resize", resize);
    const down = (e: KeyboardEvent) => { keys.current[e.key.toLowerCase()] = true; if (e.key.toLowerCase() === "r") reload(); if (e.key.toLowerCase() === "e") interact(); if (e.key.toLowerCase() === "q") cure(); if (e.key === "Escape" && state.current.mode === "play") { state.current.mode = "pause"; setScreen("pause"); } };
    const up = (e: KeyboardEvent) => { keys.current[e.key.toLowerCase()] = false; };
    const move = (e: MouseEvent) => { mouse.current.x = e.clientX; mouse.current.y = e.clientY; };
    const md = () => { mouse.current.down = true; shoot(); }; const mu = () => { mouse.current.down = false; };
    window.addEventListener("keydown", down); window.addEventListener("keyup", up); window.addEventListener("mousemove", move); window.addEventListener("mousedown", md); window.addEventListener("mouseup", mu);
    let last = performance.now(); let shotClock = 0;
    const frame = (now: number) => { const dt = Math.min(0.033, (now - last) / 1000); last = now; const s = state.current;
      if (s.mode === "play") { const vx = (keys.current.d ? 1 : 0) - (keys.current.a ? 1 : 0) + touch.current.moveX; const vy = (keys.current.s ? 1 : 0) - (keys.current.w ? 1 : 0) + touch.current.moveY; const len = Math.hypot(vx, vy) || 1; s.player.x = clamp(s.player.x + vx / len * 220 * dt, 100, W - 100); s.player.y = clamp(s.player.y + vy / len * 220 * dt, 120, H - 120); if (mouse.current.down || touch.current.firing) { shotClock += dt; if (shotClock > .22) { shoot(); shotClock = 0; } } else shotClock = .22;
        s.entities.forEach(e => { if ((e.kind === "enemy" || e.kind === "boss") && e.alive) { const d = dist(s.player, e); const speed = e.kind === "boss" ? 42 : 58; if (d < 560) { e.x += (s.player.x - e.x) / (d || 1) * speed * dt; e.y += (s.player.y - e.y) / (d || 1) * speed * dt; } if (d < 42) s.player.hp -= (e.kind === "boss" ? 16 : 20) * dt; } }); if (s.player.hp <= 0) { s.player.hp = PLAYER_MAX; s.player.x = 330; s.player.y = 540; s.message = "YOU WAKE IN THE DARK AGAIN"; } sync(); }
      draw(ctx); raf.current = requestAnimationFrame(frame); };
    raf.current = requestAnimationFrame(frame); return () => { cancelAnimationFrame(raf.current!); window.removeEventListener("resize", resize); window.removeEventListener("keydown", down); window.removeEventListener("keyup", up); window.removeEventListener("mousemove", move); window.removeEventListener("mousedown", md); window.removeEventListener("mouseup", mu); };
  }, []);

  const draw = (ctx: CanvasRenderingContext2D) => { const s = state.current; const cw = window.innerWidth, ch = window.innerHeight; ctx.clearRect(0, 0, cw, ch); ctx.fillStyle = "#071014"; ctx.fillRect(0, 0, cw, ch); if (s.mode === "menu") return; const scale = Math.min(cw / 1100, ch / 700); const ox = cw / 2 - s.player.x * scale, oy = ch / 2 - s.player.y * scale;
    ctx.save(); ctx.translate(ox, oy); ctx.scale(scale, scale); ctx.fillStyle = "#151d21"; ctx.fillRect(0, 0, W, H); ctx.globalAlpha = .4; const tex = document.createElement("canvas"); const t = tex.getContext("2d")!; t.fillStyle="#151d21"; t.fillRect(0,0,120,120); t.strokeStyle="#27353b"; for(let i=0;i<6;i++){t.beginPath();t.moveTo(i*24,0);t.lineTo(i*24,120);t.moveTo(0,i*24);t.lineTo(120,i*24);t.stroke();} const pattern=ctx.createPattern(tex,"repeat"); if(pattern){ctx.fillStyle=pattern;ctx.fillRect(0,0,W,H);} ctx.globalAlpha=1;
    ctx.fillStyle="#263339"; [[0,0,W,100],[0,H-100,W,100],[0,0,100,H],[W-100,0,100,H],[620,100,100,280],[620,700,100,280],[1180,100,100,280],[1180,700,100,280]].forEach(r=>ctx.fillRect(...r as [number,number,number,number]));
    ctx.fillStyle="#4a1118"; ctx.fillRect(1590,465,80,150); ctx.strokeStyle="#c22d32"; ctx.lineWidth=8; ctx.strokeRect(1590,465,80,150); ctx.fillStyle="#d94343"; ctx.font="bold 20px monospace"; ctx.fillText("RED",1608,450);
    s.entities.forEach(e => { if (e.alive === false) return; if (e.kind === "enemy") { ctx.fillStyle="#c33b4b"; ctx.beginPath();ctx.arc(e.x,e.y,22,0,Math.PI*2);ctx.fill();ctx.fillStyle="#210e14";ctx.beginPath();ctx.arc(e.x-7,e.y-3,4,0,Math.PI*2);ctx.arc(e.x+7,e.y-3,4,0,Math.PI*2);ctx.fill(); } if(e.kind === "boss"){ctx.fillStyle="#a6192d";ctx.beginPath();ctx.arc(e.x,e.y,52,0,Math.PI*2);ctx.fill();ctx.strokeStyle="#f26549";ctx.lineWidth=5;ctx.stroke();ctx.fillStyle="#fff0c4";ctx.font="bold 16px monospace";ctx.fillText(`WARDEN ${Math.max(0,e.hp??0)}/40`,e.x-55,e.y-66);} if(e.kind === "pickup"){ctx.fillStyle=e.subtype==="gun"?"#e8d18c":e.subtype==="antidote"?"#73e1d1":"#8fb2ba";ctx.fillRect(e.x-13,e.y-13,26,26);ctx.strokeStyle="#0b1215";ctx.strokeRect(e.x-13,e.y-13,26,26);} if(e.kind === "door"){ctx.fillStyle="#574a39";ctx.fillRect(e.x-22,e.y-50,44,100);} });
    ctx.fillStyle="#cfe4df";ctx.beginPath();ctx.arc(s.player.x,s.player.y,24,0,Math.PI*2);ctx.fill();ctx.strokeStyle="#68b7bd";ctx.lineWidth=3;ctx.stroke(); const aimx=ox+mouse.current.x, aimy=oy+mouse.current.y; ctx.strokeStyle="#d7b27a";ctx.lineWidth=8;ctx.beginPath();ctx.moveTo(s.player.x,s.player.y);ctx.lineTo(s.player.x+(aimx/scale-s.player.x)*.12,s.player.y+(aimy/scale-s.player.y)*.12);ctx.stroke();
    ctx.restore(); const vignette=ctx.createRadialGradient(cw/2,ch/2,Math.min(cw,ch)*.18,cw/2,ch/2,Math.max(cw,ch)*.72);vignette.addColorStop(0,"transparent");vignette.addColorStop(1,"rgba(0,0,0,.78)");ctx.fillStyle=vignette;ctx.fillRect(0,0,cw,ch); };

  const button = (label: string, action: () => void, cls="") => <button className={`horror-btn ${cls}`} onClick={action}>{label}</button>;
  return <main className="nightshift" onContextMenu={e => { e.preventDefault(); heal(); }}>
    <canvas ref={canvasRef} className="night-canvas" />
    {screen === "menu" && <section className="menu-screen"><img src="/game-logo.png" className="game-logo"/><p className="tagline">THE PATIENT WING NEVER CLOSED.</p><div className="menu-actions">{button("NEW GAME", start)}{button("LOAD GAME", load)}{button("OPTIONS", () => alert("Music: ON · Volume: 70%\nOptions persist in the next Android build."))}{button("QUIT", () => window.close())}</div><p className="menu-note">LANDSCAPE SURVIVAL SHOOTER · DESKTOP + TOUCH</p></section>}
    {screen === "intro" && <section className="intro-card"><p>“The lights went out at 02:17. Something in the walls answered.”</p><span>— RECOVER YOUR SIDEARM</span></section>}
    {(screen === "play" || screen === "pause") && <><div className="hud"><div className="hud-brand">NIGHTSHIFT <span>THE RED DOOR</span></div><div className="stat"><b>HP</b><i><em style={{width:`${hud.hp/2}%`}}/></i>{hud.hp}/200</div><div className="stat">AMMO {hud.mag}/{hud.reserve}</div><div className="stat">KITS {hud.kits}</div><div className="stat">METAL {hud.artifacts}</div><div className="stat">CURED {hud.cured}</div><button className="pause-btn" onClick={() => { state.current.mode=screen === "pause" ? "play" : "pause"; setScreen(state.current.mode); }}>Ⅱ</button></div><div className="message">{hud.message || (hud.mag === 0 && hud.reserve === 0 ? "FIND THE SIDEARM" : "")}</div><div className="touch-controls"><div className="joystick" onPointerMove={e => { const r=(e.currentTarget as HTMLElement).getBoundingClientRect(); touch.current.moveX=clamp((e.clientX-r.left-r.width/2)/(r.width/2),-1,1); touch.current.moveY=clamp((e.clientY-r.top-r.height/2)/(r.height/2),-1,1); }} onPointerUp={() => {touch.current.moveX=0;touch.current.moveY=0}}><span /></div><div className="action-stack"><button className="fire" onPointerDown={() => {touch.current.firing=true;shoot()}} onPointerUp={() => touch.current.firing=false}>FIRE</button><div><button onClick={reload}>RELOAD</button><button onClick={heal}>HEAL</button><button onClick={cure}>CURE</button></div></div></div><div className="hint">WASD / JOYSTICK · CLICK / FIRE · R RELOAD · RMB HEAL · E INTERACT · Q CURE</div>{screen === "pause" && <div className="pause-card"><h2>PAUSED</h2>{button("RESUME", () => {state.current.mode="play";setScreen("play")})}{button("SAVE", save)}{button("MAIN MENU", () => {state.current.mode="menu";setScreen("menu")})}</div>}</>}
    {screen === "ending" && <section className="ending-card"><p className="eyebrow">NIGHTSHIFT // INCIDENT CLOSED</p><h1>YOU'VE FINISHED<br/>THE GAME.</h1><div className="ending-stats"><span>CREATURES KILLED <b>{hud.kills}</b></span><span>CREATURES CURED <b>{hud.cured}</b></span><span>ROOMS EXPLORED <b>{hud.rooms}</b></span></div>{button("MAIN MENU", () => {state.current.mode="menu";setScreen("menu")})}{button("NEW GAME", start)}</section>}
  </main>;
}
