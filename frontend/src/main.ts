import './style.css';

type Point = { x: number; y: number };
type Stroke = { points: Point[]; width: number };
type RoomState = {
  kind: 'state'; code: string; role: 'host' | 'guest'; partner_connected: boolean;
  phase: number; total_turns: number; action: 'draw' | 'guess'; active_role: 'host' | 'guest';
  deadline: number | null; prompt: string; strokes: Stroke[]; snapshots: Stroke[][];
  guesses: string[]; finished: boolean;
};

const app = document.querySelector<HTMLDivElement>('#app')!;
const PRODUCT = 'Family Doodle Relay';
const LICENSE_KEY = 'sb_license:family-doodle-relay';
const LICENSE_CACHE = 'sb_license_check:family-doodle-relay';
let cleanup: (() => void) | undefined;
let demoVersion = 0;

function escapeHtml(value: string) {
  return value.replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]!));
}

function header() {
  return `<a class="skip" href="#main">Skip to main content</a>
  <div id="route-announcer" class="sr-only" aria-live="polite"></div>
  <header class="site-header"><a class="wordmark" href="/" data-link>Family Doodle Relay</a>
  <nav class="site-nav" aria-label="Main navigation"><a href="/demo" data-link>Demo</a><a class="hide-mobile" href="/#how">How it works</a><a href="/privacy" data-link>Privacy</a></nav></header>`;
}

function footer() {
  return `<footer class="site-footer"><div><strong>Family Doodle Relay</strong><br><span class="muted">Draw and guess with one trusted person.</span></div>
  <div class="footer-links"><a href="/privacy" data-link>Privacy</a><a href="/terms" data-link>Terms</a><a href="https://hello-factory.sociobot.in">Built by Param Factory <span aria-label="external link">↗</span></a><span>v1.0.0</span><span>Art generated for this product</span></div></footer>`;
}

function setMeta(title: string, description: string, canonicalPath: string) {
  document.title = title;
  document.querySelector<HTMLMetaElement>('meta[name="description"]')!.content = description;
  document.querySelector<HTMLLinkElement>('link[rel="canonical"]')!.href = `https://family-doodle-relay.sociobot.in${canonicalPath}`;
}

function landing() {
  setMeta('Family Doodle Relay — Draw together remotely', 'Draw, guess, and add a detail with one trusted person in a private two-person room.', '/');
  app.innerHTML = `${header()}<main id="main" class="route-enter">
    <section class="hero"><div class="hero-copy"><p class="kicker">Private play · Edition № 1</p><h1 tabindex="-1">Draw together from two places</h1>
    <p class="lede">For a child and trusted adult who want a calm game between calls.</p>
    <div class="hero-actions"><a class="button primary" href="/demo" data-link>Try it with sample data</a><a class="button" href="/play" data-link>Make a private room</a><p class="after-action">A sample relay opens next. Nothing is saved.</p></div>
    <ul class="facts"><li>Two people only</li><li>Rooms close within four hours</li><li>$6 once, no subscription</li></ul></div>
    <figure class="hero-art"><picture><source media="(max-width: 700px)" srcset="/relay-hero-mobile.webp"><img src="/relay-hero.webp" width="1200" height="800" alt="Two hands pass a folded drawing of houses becoming a whale." fetchpriority="high"></picture><figcaption>Pass the line, not the screen.</figcaption></figure></section>
    <section class="join-strip"><div class="wrap"><form id="join-form" class="join-row"><label for="room-code">Have an invite code?<input id="room-code" name="code" inputmode="text" maxlength="14" autocomplete="off" aria-describedby="join-error"></label><button type="submit">Join the room</button><span id="join-error" class="field-error" role="alert"></span></form></div></section>
    <section class="section" aria-labelledby="preview-title"><div class="wrap"><div class="section-heading"><h2 id="preview-title">One drawing changes hands</h2><p>The timer keeps each turn short. The finished strip keeps every surprising turn together.</p></div>
    <div class="preview-paper"><aside class="preview-rail"><div class="edition">LIVE EDITION · 00:34</div><p class="kicker">Turn three of four</p><h3>Add one detail</h3><p>Sam guessed “a house at sea.” Add to the same drawing.</p></aside><div class="preview-drawing" aria-label="Sample drawing of a house and whale"><svg viewBox="0 0 600 320" role="img" aria-label="A loose line drawing of a house sailing on a whale"><path d="M90 210 Q150 110 230 210 L230 265 L90 265 Z M130 180v-42h58v72 M325 225q80-115 160 0q-25 43-80 35q-55 8-80-35 M470 206q45-20 53-67q-8 45 30 67 M356 226q-28 28-50 4" fill="none" stroke="#171714" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/><circle cx="453" cy="219" r="5" fill="#171714"/><path d="M420 176q8-30 20 0" fill="none" stroke="#9c2f24" stroke-width="6"/></svg></div></div></div></section>
    <section class="section" id="how" aria-labelledby="how-title"><div class="wrap"><div class="section-heading"><h2 id="how-title">How the relay works</h2><p>No account is needed. Share one private link with the person you know.</p></div><div class="steps"><article class="step"><span class="step-no">01</span><h3>Make a room</h3><p>Send its private invite to one person.</p></article><article class="step"><span class="step-no">02</span><h3>Take four turns</h3><p>Draw, guess, then add one surprising detail.</p></article><article class="step"><span class="step-no">03</span><h3>Save the strip</h3><p>Download the finished relay as a PNG image.</p></article></div></div></section>
    <section class="section" aria-labelledby="privacy-title"><div class="wrap privacy-grid"><div><p class="kicker">A small private room</p><h2 id="privacy-title">Only the relay belongs here</h2><p>Rooms disappear from the server within four hours. Downloaded strips stay on your device.</p></div><div><h3>What this does not have</h3><ul class="not-list"><li>Public rooms or strangers</li><li>Profiles or follower counts</li><li>Ads or behaviour tracking</li><li>Open text chat</li></ul></div></div></section>
    <section class="section" aria-labelledby="paid-title"><div class="wrap privacy-grid"><div><p class="kicker">Family edition</p><h2 id="paid-title">Keep longer relays in the family</h2><p class="price-line">$6 once</p><p>Eight-turn rooms are included. Core four-turn play and PNG downloads stay free.</p><a class="button primary" href="https://api.sociobot.in/api/v1/products/family-doodle-relay/checkout">Buy the family edition</a><p class="muted">One-time purchase. Sociobot is the merchant of record.</p></div>
    <div class="license-panel"><h3>Already bought it?</h3><form id="license-form"><label for="license">Paste your license<input id="license" name="license" autocomplete="off"></label><button type="submit">Restore the family edition</button><p id="license-status" role="status"></p></form><p><a href="/terms" data-link>Read purchase terms</a></p></div></div></section>
  </main>${footer()}`;
  bindLinks();
  document.querySelector<HTMLFormElement>('#join-form')!.addEventListener('submit', joinRoom);
  document.querySelector<HTMLFormElement>('#license-form')!.addEventListener('submit', restoreLicense);
  void handleLicense();
  focusHeading();
}

const sampleStrokes: Stroke[] = [
  {width:5,points:[{x:.12,y:.7},{x:.2,y:.35},{x:.34,y:.7},{x:.34,y:.82},{x:.12,y:.82},{x:.12,y:.7}]},
  {width:5,points:[{x:.42,y:.72},{x:.49,y:.48},{x:.63,y:.45},{x:.76,y:.7},{x:.7,y:.78},{x:.5,y:.79},{x:.42,y:.72}]},
  {width:5,points:[{x:.73,y:.65},{x:.84,y:.53},{x:.9,y:.42}]},
];

function demo() {
  setMeta('Demo — Family Doodle Relay', 'Try a finished private drawing relay with sample data.', '/demo');
  const state: RoomState = {kind:'state',code:'SAMPLE-PRESS',role:'guest',partner_connected:true,phase:2,total_turns:4,action:'draw',active_role:'guest',deadline:Math.floor(Date.now()/1000)+45,prompt:'A tiny house takes a surprising trip',strokes:structuredClone(sampleStrokes),snapshots:[structuredClone(sampleStrokes.slice(0,1))],guesses:['A house at sea'],finished:false};
  renderRoom(state, true);
}

function demoBanner() {
  return `<div class="demo-banner"><strong>Demo — sample data, nothing is saved</strong><div><button id="reset-demo" type="button">Reset demo</button><a href="/" data-link>Start for real</a></div></div>`;
}

async function createRoom() {
  const button = document.querySelector<HTMLButtonElement>('#create-room');
  button?.setAttribute('disabled','');
  try {
    const paid = Boolean(validCachedLicense());
    const response = await fetch('/api/rooms', {method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({paid})});
    if (!response.ok) throw new Error('The room could not be made. Check your connection and try again.');
    const room = await response.json();
    localStorage.setItem(`relay:room:${room.code}`, JSON.stringify(room));
    navigate(`/room/${room.code}`);
  } catch (error) {
    const status = document.querySelector('#create-status');
    if (status) status.textContent = error instanceof Error ? error.message : 'The room could not be made. Try again.';
  } finally { button?.removeAttribute('disabled'); }
}

async function joinRoom(event: SubmitEvent) {
  event.preventDefault();
  const form = event.currentTarget as HTMLFormElement;
  const input = form.elements.namedItem('code') as HTMLInputElement;
  const error = document.querySelector('#join-error')!;
  error.textContent = '';
  const code = input.value.replace(/[^a-z0-9]/gi,'').toUpperCase();
  if (code.length !== 12) { input.setAttribute('aria-invalid','true'); error.textContent = 'The invite code has 12 letters and numbers. Check it and try again.'; return; }
  try {
    const response = await fetch('/api/rooms/join',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({code})});
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'The room did not open. Ask the host for a new code.');
    localStorage.setItem(`relay:room:${result.code}`, JSON.stringify(result));
    navigate(`/room/${result.code}`);
  } catch (reason) { input.setAttribute('aria-invalid','true'); error.textContent = reason instanceof Error ? reason.message : 'The room did not open. Try again.'; }
}

function homeRoomStart() {
  setMeta('Start a relay — Family Doodle Relay','Make a private drawing room for two people.','/play');
  app.innerHTML = `${header()}<main id="main" class="legal route-enter"><div class="narrow"><p class="kicker">Private room</p><h1 tabindex="-1">Make a drawing room</h1><p>One invite opens for one other person. The room closes within four hours.</p><button id="create-room" class="primary">Make a private room</button><p id="create-status" class="field-error" role="alert"></p><p><a href="/" data-link>Use an invite code instead</a></p></div></main>${footer()}`;
  bindLinks(); document.querySelector('#create-room')!.addEventListener('click', createRoom); focusHeading();
}

async function loadRoom(code: string) {
  const saved = localStorage.getItem(`relay:room:${code}`);
  if (!saved) { roomError('This room link is missing its private key. Open the link on the device that made or joined it.'); return; }
  const credentials = JSON.parse(saved);
  try {
    const response = await fetch(`/api/rooms/${encodeURIComponent(code)}?token=${encodeURIComponent(credentials.token)}`);
    const result = await response.json();
    if (!response.ok) throw new Error(result.error);
    renderRoom(result, false, credentials.token);
  } catch (error) { roomError(error instanceof Error ? error.message : 'The room did not open. Check the connection and try again.'); }
}

function roomError(message: string) {
  setMeta('Room unavailable — Family Doodle Relay','This private drawing room is unavailable.','/room');
  app.innerHTML = `${header()}<main id="main" class="legal"><div class="narrow"><h1 tabindex="-1">The room did not open</h1><p class="notice" role="alert">${escapeHtml(message)}</p><a class="button primary" href="/play" data-link>Make a new room</a></div></main>${footer()}`; bindLinks(); focusHeading();
}

function renderRoom(initial: RoomState, isDemo: boolean, token?: string) {
  let state = initial;
  let socket: WebSocket | undefined;
  let timerId = 0;
  let currentStroke: Stroke | null = null;
  setMeta(`${isDemo?'Demo':'Room'} — Family Doodle Relay`, 'Take a turn in a private two-person drawing relay.', isDemo?'/demo':`/room/${state.code}`);
  const shell = () => `${isDemo?demoBanner():''}${header()}<main id="main" class="room-page route-enter"><div class="wrap">
    <div class="room-masthead"><div><p class="kicker">The family drawing press</p><h1 tabindex="-1">${state.finished?'Your relay is finished':turnHeading(state)}</h1></div><div><span class="kicker">Private invite</span><div class="room-code">${formatCode(state.code)}</div></div></div>
    <div id="room-status" class="room-status ${state.partner_connected?'live-dot':''}" role="status">${statusText(state,isDemo)}</div><div class="turn-rule"></div>
    <div id="room-body"></div></div></main>${footer()}`;
  app.innerHTML = shell(); bindLinks(); focusHeading();

  const update = () => {
    const heading = document.querySelector('h1'); if (heading) heading.textContent = state.finished?'Your relay is finished':turnHeading(state);
    const status = document.querySelector('#room-status'); if (status) { status.className=`room-status ${state.partner_connected?'live-dot':''}`; status.textContent=statusText(state,isDemo); }
    const body = document.querySelector<HTMLDivElement>('#room-body')!;
    if (state.finished) { body.innerHTML = resultHtml(state); bindResultCanvases(state); document.querySelector('#download-strip')?.addEventListener('click',()=>downloadStrip(state)); document.querySelector('#new-room')?.addEventListener('click',createRoom); return; }
    const active = state.role === state.active_role && (isDemo || state.partner_connected);
    body.innerHTML = `<div class="turn-grid"><aside class="turn-rail"><span class="kicker">Turn ${Math.min(state.phase+1,state.total_turns)} of ${state.total_turns}</span><div class="timer" id="timer">00:45</div><h2>${state.action==='draw'?(state.phase===2?'Add one detail':'Draw the prompt'):'Name the drawing'}</h2><p>${state.action==='draw'?escapeHtml(state.prompt):'Write one short guess. Your partner sees it after you send it.'}</p>${state.guesses.length?`<p><strong>Last guess:</strong><br>${escapeHtml(state.guesses.at(-1)!)}</p>`:''}</aside>
      <section aria-label="Current turn">${state.action==='draw'?canvasHtml(active):guessHtml(active)}</section></div>
      ${state.role==='host'&&!isDemo?inviteHtml(state.code):''}`;
    if (state.action==='draw') bindCanvas(state, active, event => { if (isDemo) { applyDemoEvent(event); } else socket?.send(JSON.stringify(event)); }, () => currentStroke, value => currentStroke=value);
    else bindGuess(active, event => { if (isDemo) applyDemoEvent(event); else socket?.send(JSON.stringify(event)); });
    document.querySelector('#copy-invite')?.addEventListener('click', copyInvite);
    document.querySelector('#end-room')?.addEventListener('click',()=>{ if(confirm('End this room for both players? The drawing cannot be recovered.')) socket?.send(JSON.stringify({type:'end_room'})); });
    window.clearInterval(timerId); timerId=window.setInterval(updateTimer,250); updateTimer();
  };
  const updateTimer=()=>{ const timer=document.querySelector('#timer'); if(!timer||!state.deadline)return; const left=Math.max(0,state.deadline-Math.floor(Date.now()/1000)); timer.textContent=`00:${String(left).padStart(2,'0')}`; };
  const applyDemoEvent=(event:any)=>{
    if(event.type==='stroke'||event.type==='undo'||event.type==='clear') { /* canvas state already changed locally */ }
    if(event.type==='finish_turn'){ state.snapshots.push(structuredClone(state.strokes)); state.guesses.push('A whale carrying a tiny village'); state.phase=4; state.finished=true; }
    update();
  };
  if (isDemo) { document.querySelector('#reset-demo')?.addEventListener('click',()=>{ demoVersion++; demo(); }); update(); cleanup=()=>window.clearInterval(timerId); }
  else {
    const scheme=location.protocol==='https:'?'wss':'ws'; socket=new WebSocket(`${scheme}://${location.host}/ws/${state.code}?token=${encodeURIComponent(token!)}`);
    socket.addEventListener('message',event=>{ const next=JSON.parse(event.data); if(next.kind==='ended'){roomError('The host ended this room. Make a new room to play again.');return;} if(next.kind==='state'&&next.role===state.role){state=next;update();} });
    socket.addEventListener('close',()=>{ const status=document.querySelector('#room-status'); if(status&&!state.finished)status.textContent='The connection paused. Reload the page to reconnect.'; });
    socket.addEventListener('error',()=>{ const status=document.querySelector('#room-status'); if(status)status.textContent='The room lost its connection. Reload the page to reconnect.'; });
    update(); cleanup=()=>{socket?.close();window.clearInterval(timerId);};
  }
}

function turnHeading(state: RoomState) { return state.role===state.active_role ? (state.action==='draw'?(state.phase===2?'Add one surprising detail':'Draw the first idea'):'Write your guess') : `Watch ${state.active_role==='host'?'the host':'your partner'} take a turn`; }
function statusText(state:RoomState,isDemo:boolean){ if(isDemo)return 'Sam is here · sample relay'; if(!state.partner_connected)return state.role==='host'?'Waiting for your partner to join':'Your partner is reconnecting'; return 'Both players are here'; }
function formatCode(code:string){ const clean=code.replace(/-/g,''); return clean.length===12?`${clean.slice(0,4)} ${clean.slice(4,8)} ${clean.slice(8)}`:code; }
function canvasHtml(active:boolean){return `<div class="canvas-wrap ${active?'':'readonly'}"><canvas id="draw-canvas" width="960" height="720" tabindex="0" aria-label="Shared drawing canvas${active?'. Use a pointer to draw, or choose Add a sample mark for keyboard use.':'. Your partner is drawing.'}"></canvas><div class="canvas-overlay" ${active?'hidden':''}><p>Your partner has the pencil.<br>New lines appear here.</p></div></div><div class="tools"><button id="sample-mark" ${active?'':'disabled'}>Add a sample mark</button><button id="undo" ${active?'':'disabled'}>Undo last line</button><button id="clear" ${active?'':'disabled'}>Clear drawing</button><button id="finish-turn" class="primary" ${active?'':'disabled'}>Finish this turn</button></div>`;}
function guessHtml(active:boolean){return `<div class="guess-box"><form id="guess-form"><label for="guess">Your guess<input id="guess" name="guess" maxlength="80" autocomplete="off" ${active?'':'disabled'}></label><button class="primary" type="submit" ${active?'':'disabled'}>Send your guess</button><p id="guess-help" role="status">${active?'One short guess moves the relay to the next turn.':'Your partner is writing a guess.'}</p></form></div>`;}
function inviteHtml(code:string){const url=`${location.origin}/join/${code}`;return `<aside class="invite-panel"><h2>Invite one person</h2><p>Send this private link to your child or trusted adult.</p><code class="invite-url">${escapeHtml(url)}</code><div class="tools"><button id="copy-invite">Copy the invite link</button><button id="end-room" class="danger">End this room</button></div></aside>`;}

function bindCanvas(state:RoomState,active:boolean,send:(event:any)=>void,getCurrent:()=>Stroke|null,setCurrent:(s:Stroke|null)=>void){
  const canvas=document.querySelector<HTMLCanvasElement>('#draw-canvas')!; const context=canvas.getContext('2d')!;
  const paint=()=>{context.fillStyle='#fffdf7';context.fillRect(0,0,canvas.width,canvas.height);context.strokeStyle='#171714';context.lineCap='round';context.lineJoin='round';for(const stroke of state.strokes){context.lineWidth=stroke.width;context.beginPath();stroke.points.forEach((p,i)=>(i?context.lineTo(p.x*canvas.width,p.y*canvas.height):context.moveTo(p.x*canvas.width,p.y*canvas.height)));context.stroke();}}; paint();
  const point=(event:PointerEvent)=>{const rect=canvas.getBoundingClientRect();return{x:(event.clientX-rect.left)/rect.width,y:(event.clientY-rect.top)/rect.height};};
  canvas.addEventListener('pointerdown',e=>{if(!active)return;canvas.setPointerCapture(e.pointerId);setCurrent({width:5,points:[point(e)]});});
  canvas.addEventListener('pointermove',e=>{const stroke=getCurrent();if(!stroke)return;stroke.points.push(point(e));state.strokes.push(stroke);paint();state.strokes.pop();});
  canvas.addEventListener('pointerup',()=>{const stroke=getCurrent();if(stroke&&stroke.points.length>1){state.strokes.push(stroke);send({type:'stroke',stroke});paint();}setCurrent(null);});
  document.querySelector('#sample-mark')?.addEventListener('click',()=>{const y=.25+((state.strokes.length%4)*.12);const stroke={width:5,points:[{x:.25,y},{x:.32,y:y-.08},{x:.39,y},{x:.46,y:y-.08}]};state.strokes.push(stroke);send({type:'stroke',stroke});paint();});
  document.querySelector('#undo')?.addEventListener('click',()=>{state.strokes.pop();send({type:'undo'});paint();});
  document.querySelector('#clear')?.addEventListener('click',()=>{if(confirm('Clear every line from this drawing?')){state.strokes=[];send({type:'clear'});paint();}});
  document.querySelector('#finish-turn')?.addEventListener('click',()=>send({type:'finish_turn'}));
}

function bindGuess(active:boolean,send:(event:any)=>void){if(!active)return;document.querySelector<HTMLFormElement>('#guess-form')?.addEventListener('submit',event=>{event.preventDefault();const input=(event.currentTarget.elements.namedItem('guess') as HTMLInputElement);const guess=input.value.trim();if(!guess){document.querySelector('#guess-help')!.textContent='Write a guess before sending it.';input.focus();return;}send({type:'submit_guess',guess});});}
async function copyInvite(){const value=document.querySelector('.invite-url')!.textContent!;try{await navigator.clipboard.writeText(value);document.querySelector('#copy-invite')!.textContent='Invite link copied';}catch{const selection=window.getSelection();const range=document.createRange();range.selectNodeContents(document.querySelector('.invite-url')!);selection?.removeAllRanges();selection?.addRange(range);document.querySelector('#copy-invite')!.textContent='Link selected. Copy it now.';}}

function resultHtml(state:RoomState){return `<section class="result-strip"><p class="kicker">The final edition</p><h2>From one line to a family story</h2><div class="result-panels">${state.snapshots.slice(-2).map((_,i)=>`<canvas class="result-canvas" data-index="${Math.max(0,state.snapshots.length-2)+i}" width="640" height="480" aria-label="Drawing from relay turn ${i+1}"></canvas>`).join('')}</div>${state.guesses.map(g=>`<p class="result-quote">“${escapeHtml(g)}”</p>`).join('')}<div class="tools"><button class="primary" id="download-strip">Download the PNG strip</button><button id="new-room">Make another room</button></div><p class="muted">The download is made on this device.</p></section>`;}
function drawStrokes(canvas:HTMLCanvasElement,strokes:Stroke[]){const context=canvas.getContext('2d')!;context.fillStyle='#fffdf7';context.fillRect(0,0,canvas.width,canvas.height);context.strokeStyle='#171714';context.lineCap='round';context.lineJoin='round';strokes.forEach(stroke=>{context.lineWidth=stroke.width;context.beginPath();stroke.points.forEach((p,i)=>(i?context.lineTo(p.x*canvas.width,p.y*canvas.height):context.moveTo(p.x*canvas.width,p.y*canvas.height)));context.stroke();});}
function bindResultCanvases(state:RoomState){document.querySelectorAll<HTMLCanvasElement>('.result-canvas').forEach(canvas=>drawStrokes(canvas,state.snapshots[Number(canvas.dataset.index)]||state.strokes));}
function downloadStrip(state:RoomState){const canvas=document.createElement('canvas');canvas.width=1200;canvas.height=700;const context=canvas.getContext('2d')!;context.fillStyle='#f5f0e5';context.fillRect(0,0,1200,700);context.fillStyle='#171714';context.font='bold 58px Georgia';context.fillText('Our Family Doodle Relay',60,80);context.font='18px Arial';context.fillText(`Edition ${new Date().toISOString().slice(0,10)} · ${state.total_turns} turns`,60,118);const frames=state.snapshots.length?state.snapshots.slice(-2):[state.strokes];frames.forEach((strokes,index)=>{const temp=document.createElement('canvas');temp.width=500;temp.height=380;drawStrokes(temp,strokes);context.drawImage(temp,60+index*550,155,500,380);context.strokeRect(60+index*550,155,500,380);});context.font='italic 26px Georgia';context.fillText(`“${(state.guesses.at(-1)||'Our surprising drawing').slice(0,68)}”`,60,600);context.font='16px Arial';context.fillText('Made with Family Doodle Relay',60,650);const link=document.createElement('a');link.download='family-doodle-relay.png';link.href=canvas.toDataURL('image/png');link.click();}

function legalPage(kind:'privacy'|'terms'){
  const privacy=kind==='privacy';setMeta(`${privacy?'Privacy':'Terms'} — Family Doodle Relay`,privacy?'How private rooms and license checks handle data.':'Terms for using Family Doodle Relay.','/'+kind);
  app.innerHTML=`${header()}<main id="main" class="legal route-enter"><article class="narrow"><p class="kicker">Last updated 28 August 2026</p><h1 tabindex="-1">${privacy?'Privacy in plain words':'Terms for family play'}</h1>${privacy?`<p>We made this game for a child and one trusted adult. It does not need a profile.</p><h2>What a room holds</h2><p>The server holds the room code, drawing lines, and guesses in memory. It removes the room within four hours. Restarting the server removes it sooner.</p><h2>What stays on your device</h2><p>Your private room key and optional license stay in browser storage. A PNG strip is created and downloaded on your device.</p><h2>Who receives data</h2><p>We do not use ads or behaviour tracking. A license check sends the license token to Sociobot. Sociobot and Dodo handle purchase records as merchant of record.</p><h2>Children</h2><p>We do not ask for names, ages, email addresses, or child profiles. An adult should share the private invite only with someone they trust.</p><h2>Contact</h2><p>For privacy requests, email <a href="mailto:privacy@sociobot.in">privacy@sociobot.in</a>.</p>`:`<p>Use this service only with a person you know. A host may end a room at any time.</p><h2>Use of the game</h2><p>Do not share illegal, abusive, or identifying material. You are responsible for the drawings and guesses you add.</p><h2>Room availability</h2><p>Rooms are temporary. We may remove a room to protect the service or its users. Download a strip before leaving if you want to keep it.</p><h2>One-time purchase</h2><p>The $6 family edition adds eight-turn rooms. Sociobot and Dodo are the merchant of record. Refunds are handled by the merchant and revoke the license.</p><h2>No warranty</h2><p>The service is provided as available. These terms do not remove rights that consumer law gives you.</p><h2>Contact</h2><p>For terms or purchase questions, email <a href="mailto:support@sociobot.in">support@sociobot.in</a>.</p>`}</article></main>${footer()}`;bindLinks();focusHeading();
}

function notFound(){setMeta('Page not found — Family Doodle Relay','Return to Family Doodle Relay and make a private drawing room.',location.pathname);app.innerHTML=`${header()}<main id="main" class="legal"><div class="narrow"><p class="kicker">Lost edition · 404</p><h1 tabindex="-1">This page missed the relay</h1><p>The address does not match a room or page.</p><a class="button primary" href="/" data-link>Return to the front page</a></div></main>${footer()}`;bindLinks();focusHeading();}

function cachedLicense(){try{return JSON.parse(localStorage.getItem(LICENSE_CACHE)||'null');}catch{return null;}}
function hasFreshLicenseCheck(){const cached=cachedLicense();return Boolean(cached&&Date.now()-cached.checked<86400000);}
function validCachedLicense(){const cached=cachedLicense();return Boolean(cached?.valid&&Date.now()-cached.checked<86400000);}
async function handleLicense(){const params=new URLSearchParams(location.search);const received=params.get('license');if(received){localStorage.setItem(LICENSE_KEY,received);history.replaceState({},'',location.pathname);await verifyLicense(received);}else{const token=localStorage.getItem(LICENSE_KEY);if(token&&!hasFreshLicenseCheck())await verifyLicense(token);}}
async function verifyLicense(token:string){const status=document.querySelector('#license-status');if(status)status.textContent='Checking the license…';try{const response=await fetch(`https://api.sociobot.in/api/v1/products/family-doodle-relay/verify?license=${encodeURIComponent(token)}`);const result=await response.json();localStorage.setItem(LICENSE_CACHE,JSON.stringify({valid:Boolean(result.valid),checked:Date.now()}));if(status)status.textContent=result.valid?'Family edition is ready on this device.':'This license is not active. Check the token or buy the family edition.';}catch{if(status)status.textContent='The license check is offline. Free play still works.';}}
async function restoreLicense(event:SubmitEvent){event.preventDefault();const form=event.currentTarget as HTMLFormElement;const token=(form.elements.namedItem('license') as HTMLInputElement).value.trim();if(!token){document.querySelector('#license-status')!.textContent='Paste the license from your receipt first.';return;}localStorage.setItem(LICENSE_KEY,token);await verifyLicense(token);}

function bindLinks(){document.querySelectorAll<HTMLAnchorElement>('a[data-link]').forEach(link=>link.addEventListener('click',event=>{if(event.metaKey||event.ctrlKey||event.shiftKey)return;event.preventDefault();navigate(link.pathname+link.search+link.hash);}));}
function navigate(path:string){cleanup?.();cleanup=undefined;history.pushState({},'',path);route();}
function focusHeading(){requestAnimationFrame(()=>{const heading=document.querySelector<HTMLElement>('h1');heading?.focus();const announcer=document.querySelector('#route-announcer');if(announcer&&heading)announcer.textContent=heading.textContent||'';});}
function route(){const path=location.pathname;window.scrollTo(0,0);if(path==='/')landing();else if(path==='/demo')demo();else if(path==='/play')homeRoomStart();else if(path==='/privacy'||path==='/terms')legalPage(path.slice(1) as 'privacy'|'terms');else if(path.startsWith('/join/')){const code=path.split('/').pop()!;history.replaceState({},'','/');landing();const input=document.querySelector<HTMLInputElement>('#room-code')!;input.value=code;input.focus();}else if(/^\/room\/[A-Z0-9]+$/i.test(path))void loadRoom(path.split('/').pop()!.toUpperCase());else notFound();}
window.addEventListener('popstate',()=>{cleanup?.();route();});
route();
if ('serviceWorker' in navigator) window.addEventListener('load', () => { void navigator.serviceWorker.register('/sw.js'); });
