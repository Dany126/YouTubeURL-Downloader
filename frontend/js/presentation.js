let presentationData = null;
let currentIndex = 0;
let controlsTimer = null;
let touchStartX = 0;
const $ = (id) => document.getElementById(id);

export function detectTextDirection(text) {
  return /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF]/.test(text) ? 'rtl' : 'ltr';
}

export function createSlide(slideData) {
  const card = document.createElement('article');
  card.className = 'slide-card';
  card.setAttribute('aria-label', slideData.type === 'title' ? 'Title slide' : 'Lyrics slide');
  if (slideData.type === 'title') {
    const label = document.createElement('span'); label.className = 'slide-label'; label.textContent = 'SING TOGETHER';
    const title = document.createElement('h1'); title.textContent = slideData.text; title.dir = detectTextDirection(slideData.text);
    card.append(label, title);
  } else {
    if (slideData.section) { const label = document.createElement('span'); label.className = 'slide-label'; label.textContent = slideData.section; card.append(label); }
    const lyrics = document.createElement('p'); lyrics.className = 'slide-lyrics'; lyrics.textContent = slideData.text; lyrics.dir = detectTextDirection(slideData.text); card.append(lyrics);
  }
  return card;
}

export function renderPresentation(data) {
  presentationData = data; currentIndex = 0;
  const container = $('slider-container'); container.replaceChildren(...data.slides.map(createSlide));
  $('presentation-title').textContent = data.title;
  $('landing').hidden = true; $('presentation').hidden = false;
  updateSlider(); showControls();
}

export function updateSlider() {
  const cards = [...$('slider-container').children];
  cards.forEach((card, index) => { card.classList.toggle('active', index === currentIndex); card.setAttribute('aria-hidden', String(index !== currentIndex)); });
  $('slide-counter').textContent = `${currentIndex + 1} / ${cards.length}`;
  $('previous-slide').disabled = currentIndex === 0; $('next-slide').disabled = currentIndex === cards.length - 1;
}

export function goToSlide(index) { if (!presentationData) return; currentIndex = Math.max(0, Math.min(index, presentationData.slides.length - 1)); updateSlider(); }
export function changeSlide(direction) { goToSlide(currentIndex + direction); }
export function nextSlide() { changeSlide(1); }
export function previousSlide() { changeSlide(-1); }
export async function enterFullscreen() { try { if (!document.fullscreenElement && document.documentElement.requestFullscreen) await document.documentElement.requestFullscreen(); } catch { /* Fullscreen can be unavailable in embedded browsers. */ } }
export async function exitFullscreen() { try { if (document.fullscreenElement && document.exitFullscreen) await document.exitFullscreen(); } catch { /* Browser handles Escape as a fallback. */ } }
export function showControls() { $('presentation').classList.remove('controls-hidden'); clearTimeout(controlsTimer); controlsTimer = setTimeout(hideControls, 3000); }
export function hideControls() { if (!$('presentation').hidden) $('presentation').classList.add('controls-hidden'); }
export function handleKeyboard(event) {
  if ($('presentation').hidden || event.target.matches('input,textarea,select,[contenteditable="true"]')) return;
  if (['ArrowRight', 'ArrowLeft', ' ', 'Home', 'End', 'f', 'F'].includes(event.key)) showControls();
  if (event.key === 'ArrowRight') { event.preventDefault(); previousSlide(); }
  if (event.key === 'ArrowLeft' || event.key === ' ') { event.preventDefault(); nextSlide(); }
  if (event.key === 'Home') goToSlide(0);
  if (event.key === 'End') goToSlide((presentationData?.slides.length || 1) - 1);
  if (event.key.toLowerCase() === 'f') enterFullscreen();
  if (event.key === 'Escape') exitFullscreen();
}
export function handleSwipe() {
  const element = $('slider-container');
  element.addEventListener('touchstart', (event) => { touchStartX = event.changedTouches[0].screenX; }, { passive: true });
  element.addEventListener('touchend', (event) => { const delta = event.changedTouches[0].screenX - touchStartX; if (Math.abs(delta) > 55) delta < 0 ? nextSlide() : previousSlide(); showControls(); }, { passive: true });
}

export function initPresentationControls() {
  $('previous-slide').addEventListener('click', previousSlide); $('next-slide').addEventListener('click', nextSlide);
  $('fullscreen-button').addEventListener('click', () => document.fullscreenElement ? exitFullscreen() : enterFullscreen());
  $('exit-presentation').addEventListener('click', () => { exitFullscreen(); $('presentation').hidden = true; $('landing').hidden = false; clearTimeout(controlsTimer); });
  document.addEventListener('keydown', handleKeyboard);
  document.addEventListener('mousemove', () => { if (!$('presentation').hidden) showControls(); }, { passive: true });
  document.addEventListener('touchstart', () => { if (!$('presentation').hidden) showControls(); }, { passive: true });
  document.addEventListener('fullscreenchange', () => { $('fullscreen-button').setAttribute('aria-label', document.fullscreenElement ? 'Exit fullscreen' : 'Enter fullscreen'); });
  handleSwipe();
}
