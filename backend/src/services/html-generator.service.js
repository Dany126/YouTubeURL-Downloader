import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';

const generatedDirectory = fileURLToPath(new URL('../../../generated/', import.meta.url));

export function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[character]);
}

function safeJsonString(value) {
  let escaped = '';
  for (const character of value) {
    const code = character.codePointAt(0);
    if (character === '"') escaped += '\\u0022';
    else if (character === '&') escaped += '\\u0026';
    else if (character === '<') escaped += '\\u003c';
    else if (character === '>') escaped += '\\u003e';
    else if (character === "'") escaped += '\\u0027';
    else if (character === '\\') escaped += '\\\\';
    else if (character === '\b') escaped += '\\b';
    else if (character === '\f') escaped += '\\f';
    else if (character === '\n') escaped += '\\n';
    else if (character === '\r') escaped += '\\r';
    else if (character === '\t') escaped += '\\t';
    else if (code < 0x20 || character === '\u2028' || character === '\u2029') escaped += `\\u${code.toString(16).padStart(4, '0')}`;
    else escaped += character;
  }
  return `"${escaped}"`;
}

function safeJson(value) {
  if (typeof value === 'string') return safeJsonString(value);
  if (Array.isArray(value)) return `[${value.map(safeJson).join(',')}]`;
  if (value && typeof value === 'object') return `{${Object.entries(value).map(([key, item]) => `${JSON.stringify(key)}:${safeJson(item)}`).join(',')}}`;
  return JSON.stringify(value);
}

function documentLanguage(language, presentation) {
  const candidate = String(language).trim().replaceAll('_', '-');
  const lang = /^[a-z]{2,3}(?:-[A-Za-z0-9]{2,8})*$/.test(candidate) ? candidate : 'en';
  const isArabic = /^ar(?:-|$)/i.test(lang) || /[\u0600-\u06FF]/.test(`${presentation.title} ${presentation.slides.map((slide) => slide.text).join(' ')}`);
  return { lang: isArabic ? (lang.toLowerCase().startsWith('ar') ? lang : 'ar') : lang, dir: isArabic ? 'rtl' : 'ltr' };
}

export function generatePresentationHtml(presentation) {
  const { lang, dir } = documentLanguage(presentation.language, presentation);
  const title = escapeHtml(presentation.title);
  const payload = safeJson(presentation);
  return `<!DOCTYPE html>
<html lang="${escapeHtml(lang)}" dir="${dir}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
  <meta name="theme-color" content="#1e3c72">
  <title>${title} · LyricSlide</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@700;900&display=swap" rel="stylesheet">
  <style>
    :root{--background-start:#1e3c72;--background-end:#2a5298;--accent:#ffcc00;--title-color:#ffe600;--text-color:#fff;--glass:rgba(255,255,255,.15);--glass-border:rgba(255,255,255,.3);--shadow:rgba(0,0,0,.3);color-scheme:dark}
    *{box-sizing:border-box}html,body{margin:0;width:100%;height:100%;overflow:hidden}body{font-family:'Cairo',Tahoma,Arial,sans-serif;color:var(--text-color);background:linear-gradient(135deg,var(--background-start) 0%,var(--background-end) 100%)}
    .stage{position:relative;width:100vw;height:100vh;height:100dvh;display:grid;grid-template-rows:auto 1fr auto auto;overflow:hidden;isolation:isolate}.stage:before,.stage:after{content:"";position:absolute;z-index:-1;pointer-events:none;border-radius:50%}.stage:before{width:55vw;height:55vw;top:-33vw;inset-inline-end:-8vw;border:1px solid rgba(255,255,255,.09);box-shadow:0 0 0 50px rgba(255,255,255,.025),0 0 0 100px rgba(255,255,255,.02)}.stage:after{width:35vw;height:35vw;bottom:-25vw;inset-inline-start:-7vw;background:rgba(45,154,209,.16);filter:blur(80px)}
    .topbar{display:flex;align-items:center;justify-content:space-between;padding:clamp(14px,2vw,27px) clamp(18px,4vw,60px);font:600 12px Arial,sans-serif;color:rgba(255,255,255,.75)}.brand{letter-spacing:.04em}.brand b{color:var(--accent);font-size:20px}.song-name{max-width:55vw;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;opacity:.85}
    .slider-container{position:relative;display:flex;align-items:center;justify-content:center;min-height:0;width:100%;max-width:1100px;margin:auto;padding:20px;overflow:hidden}.slide{position:absolute;width:min(85%,750px);max-height:calc(100% - 36px);overflow:hidden;padding:clamp(30px,6vh,50px) clamp(24px,6vw,40px);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px;text-align:center;background:var(--glass);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);border:2px solid var(--glass-border);border-radius:30px;box-shadow:0 15px 35px var(--shadow);opacity:0;transform:scale(.8) translateY(30px);transition:opacity .6s,transform .6s cubic-bezier(.34,1.56,.64,1);pointer-events:none}.slide.active{opacity:1;transform:scale(1) translateY(0);pointer-events:auto}.section{color:var(--accent);font:700 10px Arial,sans-serif;letter-spacing:.2em;text-transform:uppercase}.slide h1{margin:0;color:var(--title-color);font:900 clamp(2rem,5vw,2.5rem)/1.35 'Cairo',Tahoma,Arial,sans-serif;text-shadow:2px 2px 10px rgba(0,0,0,.4)}.artist{margin:0;color:rgba(255,255,255,.85);font-size:clamp(1rem,2.4vw,1.3rem)}.lyrics{margin:0;max-height:min(58vh,580px);overflow:hidden;white-space:pre-line;font:900 clamp(1.5rem,4vw,2.2rem)/1.8 'Cairo',Tahoma,Arial,sans-serif;color:var(--text-color);text-align:center;text-shadow:1px 1px 5px rgba(0,0,0,.4);unicode-bidi:plaintext}
    .controls{position:relative;z-index:2;display:flex;justify-content:center;align-items:center;gap:clamp(18px,3vw,40px);width:100%;padding:15px 20px;background:rgba(0,0,0,.2);backdrop-filter:blur(5px);transition:opacity .35s,transform .35s}.nav{display:grid;place-items:center;flex:0 0 auto;width:65px;height:65px;padding:0;border:0;border-radius:50%;background:var(--accent);box-shadow:0 5px 15px rgba(0,0,0,.3);cursor:pointer;transition:transform .2s,background .2s}.nav:hover:not(:disabled){transform:scale(1.08);background:#ffdd33}.nav:active:not(:disabled){transform:scale(.95)}.nav:disabled{opacity:.45;cursor:default}.arrow{width:12px;height:12px;border-top:3px solid #253b57;border-right:3px solid #253b57}.previous{transform:rotate(45deg)}.next{transform:rotate(225deg)}.counter{min-width:90px;padding:8px 18px;border-radius:20px;background:rgba(0,0,0,.3);color:var(--accent);font:700 18px Arial,sans-serif;letter-spacing:1px;text-align:center;direction:ltr}.fullscreen{position:absolute;inset-inline-end:clamp(15px,4vw,55px);height:39px;padding:0 13px;border:1px solid rgba(255,255,255,.32);border-radius:20px;background:rgba(0,0,0,.13);color:white;font:600 11px Arial,sans-serif;cursor:pointer}.hint{margin:0;padding:0 10px 13px;text-align:center;color:rgba(255,255,255,.5);font:600 8px Arial,sans-serif;letter-spacing:.14em;transition:opacity .35s}.hint span{padding:0 6px;color:var(--accent)}.stage.controls-hidden .controls,.stage.controls-hidden .topbar,.stage.controls-hidden .hint{opacity:0;pointer-events:none}.stage.controls-hidden .controls{transform:translateY(20px)}button:focus-visible{outline:3px solid white;outline-offset:4px}
    @media(max-width:700px){.slide{width:94%;padding:29px 20px;border-radius:23px}.lyrics{font-size:clamp(1.35rem,6vw,2rem);line-height:1.65}.controls{gap:16px;padding:12px 10px}.nav{width:52px;height:52px}.counter{min-width:73px;padding:8px 12px;font-size:15px}.fullscreen{position:static;width:42px;height:42px;padding:0;font-size:18px}.fullscreen span{display:none}.song-name{display:none}.hint{font-size:7px}}
    @media(max-height:550px){.topbar{padding-block:8px}.slide{padding-block:20px;gap:7px}.lyrics{max-height:55vh;line-height:1.4}.controls{padding-block:8px}.nav{width:46px;height:46px}.hint{padding-bottom:6px}}
    @media(prefers-reduced-motion:reduce){.slide{transition:opacity .01ms}.nav{transition:none}}
  </style>
</head>
<body>
  <main class="stage" id="stage">
    <header class="topbar"><span class="brand"><b>♪</b> LyricSlide</span><span class="song-name" id="song-name"></span></header>
    <section class="slider-container" id="slider" aria-live="polite" aria-label="Song lyrics"></section>
    <nav class="controls" aria-label="Slide navigation">
      <button class="nav" id="previous" type="button" aria-label="Previous slide"><span class="arrow previous" aria-hidden="true"></span></button>
      <span class="counter" id="counter" aria-live="polite"></span>
      <button class="nav" id="next" type="button" aria-label="Next slide"><span class="arrow next" aria-hidden="true"></span></button>
      <button class="fullscreen" id="fullscreen" type="button" aria-label="Enter fullscreen">⛶ <span>Fullscreen</span></button>
    </nav>
    <p class="hint">← NEXT <span>·</span> PREVIOUS → <span>·</span> SPACE TO ADVANCE <span>·</span> F FULLSCREEN</p>
  </main>
  <script type="application/json" id="presentation-data">${payload}</script>
  <script>
    (()=>{
      const data=JSON.parse(document.getElementById('presentation-data').textContent);
      const root=document.getElementById('stage'), slider=document.getElementById('slider');
      let index=0,timer=0,startX=0;
      const textDirection=text=>/[\\u0600-\\u06FF\\u0750-\\u077F\\u08A0-\\u08FF]/.test(text)?'rtl':'ltr';
      function createSlides(){
        document.getElementById('song-name').textContent=data.title;
        slider.replaceChildren(...data.slides.map(item=>{
          const card=document.createElement('article');card.className='slide';card.setAttribute('aria-hidden','true');
          if(item.type==='title'){
            const title=document.createElement('h1');title.textContent=item.text;title.dir=textDirection(item.text);card.append(title);
            if(data.artist){const artist=document.createElement('p');artist.className='artist';artist.textContent=data.artist;artist.dir=textDirection(data.artist);card.append(artist)}
          }else{
            if(item.section){const section=document.createElement('span');section.className='section';section.textContent=item.section;card.append(section)}
            const lyrics=document.createElement('p');lyrics.className='lyrics';lyrics.textContent=item.text;lyrics.dir=textDirection(item.text);card.append(lyrics)
          }
          return card
        }));updateSlider()
      }
      function updateSlider(){const cards=[...slider.children];cards.forEach((card,i)=>{card.classList.toggle('active',i===index);card.setAttribute('aria-hidden',String(i!==index))});document.getElementById('counter').textContent=(index+1)+' / '+cards.length;document.getElementById('previous').disabled=index===0;document.getElementById('next').disabled=index===cards.length-1}
      function goToSlide(value){index=Math.max(0,Math.min(value,data.slides.length-1));updateSlider()}
      function nextSlide(){goToSlide(index+1)}function previousSlide(){goToSlide(index-1)}
      async function enterFullscreen(){try{if(!document.fullscreenElement&&document.documentElement.requestFullscreen)await document.documentElement.requestFullscreen()}catch{}}
      async function exitFullscreen(){try{if(document.fullscreenElement&&document.exitFullscreen)await document.exitFullscreen()}catch{}}
      function hideControls(){root.classList.add('controls-hidden')}function showControls(){root.classList.remove('controls-hidden');clearTimeout(timer);timer=setTimeout(hideControls,3000)}
      function handleKeyboard(event){if(event.target.matches('input,textarea,select,[contenteditable="true"]'))return;if(['ArrowRight','ArrowLeft',' ','Home','End','f','F','Escape'].includes(event.key))showControls();if(event.key==='ArrowRight'){event.preventDefault();previousSlide()}else if(event.key==='ArrowLeft'||event.key===' '){event.preventDefault();nextSlide()}else if(event.key==='Home')goToSlide(0);else if(event.key==='End')goToSlide(data.slides.length-1);else if(event.key.toLowerCase()==='f')enterFullscreen();else if(event.key==='Escape')exitFullscreen()}
      function handleSwipe(){slider.addEventListener('touchstart',event=>{startX=event.changedTouches[0].screenX},{passive:true});slider.addEventListener('touchend',event=>{const delta=event.changedTouches[0].screenX-startX;if(Math.abs(delta)>55){delta<0?nextSlide():previousSlide();showControls()}},{passive:true})}
      document.getElementById('previous').addEventListener('click',()=>{previousSlide();showControls()});document.getElementById('next').addEventListener('click',()=>{nextSlide();showControls()});document.getElementById('fullscreen').addEventListener('click',()=>document.fullscreenElement?exitFullscreen():enterFullscreen());
      document.addEventListener('keydown',handleKeyboard);document.addEventListener('mousemove',showControls,{passive:true});document.addEventListener('touchstart',showControls,{passive:true});document.addEventListener('fullscreenchange',()=>document.getElementById('fullscreen').setAttribute('aria-label',document.fullscreenElement?'Exit fullscreen':'Enter fullscreen'));
      handleSwipe();createSlides();showControls()
    })();
  </script>
</body>
</html>`;
}

function timestamp(date = new Date()) {
  const pad = (value) => String(value).padStart(2, '0');
  return `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}-${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}`;
}

export async function savePresentationHtml(presentation) {
  await mkdir(generatedDirectory, { recursive: true });
  const html = generatePresentationHtml(presentation);
  const base = `lyricslide-${timestamp()}`;
  for (let suffix = 1; suffix < 1000; suffix += 1) {
    const name = `${base}${suffix === 1 ? '' : `-${suffix}`}.html`;
    try {
      await writeFile(join(generatedDirectory, name), html, { flag: 'wx', mode: 0o600 });
      return { name, url: `/generated/${name}`, html };
    } catch (error) {
      if (error.code !== 'EEXIST') throw error;
    }
  }
  throw new Error('Could not allocate a unique presentation filename.');
}
