const slides = [...document.querySelectorAll('.slide')];
const currentPage = document.querySelector('#currentPage');
const progress = document.querySelector('#progress');
const continueHint = document.querySelector('#continueHint');
const toast = document.querySelector('#toast');
const opening = document.querySelector('#opening');
const backgroundMusic = document.querySelector('#backgroundMusic');
const chapterVideos = [...document.querySelectorAll('[data-video-page]')];
const soundToggle = document.querySelector('#soundToggle');
const soundLabel = document.querySelector('#soundLabel');
let current = 0;
let role = sessionStorage.getItem('mythoria-role') || '';
let locked = false;
let musicDisabled = false;
let openingClosed = false;

function closeOpening() {
  if (openingClosed) return;
  openingClosed = true;
  opening.classList.add('is-leaving');
  setTimeout(() => {
    opening.hidden = true;
  }, 600);
}

opening.addEventListener('click', closeOpening);
setTimeout(closeOpening, matchMedia('(prefers-reduced-motion: reduce)').matches ? 300 : 2200);

backgroundMusic.volume = 0.34;

function updateSoundControl() {
  const playing = !backgroundMusic.paused && !backgroundMusic.ended;
  soundToggle.setAttribute('aria-pressed', String(playing));
  soundToggle.setAttribute('aria-label', playing ? '关闭背景音乐' : '开启背景音乐');
  soundLabel.textContent = playing ? 'MUSIC ON' : 'MUSIC OFF';
}

async function playBackgroundMusic() {
  if (musicDisabled) return;
  try {
    await backgroundMusic.play();
    soundToggle.classList.remove('needs-gesture');
  } catch {
    soundToggle.classList.add('needs-gesture');
  }
  updateSoundControl();
}

function unlockMusicFromGesture(event) {
  if (musicDisabled || !backgroundMusic.paused || event.target.closest('#soundToggle')) return;
  playBackgroundMusic();
}

function removeMusicUnlockListeners() {
  document.removeEventListener('pointerdown', unlockMusicFromGesture, true);
  document.removeEventListener('touchstart', unlockMusicFromGesture, true);
  document.removeEventListener('click', unlockMusicFromGesture, true);
}

soundToggle.addEventListener('click', async (event) => {
  event.stopPropagation();
  if (backgroundMusic.paused) {
    musicDisabled = false;
    await playBackgroundMusic();
  } else {
    musicDisabled = true;
    backgroundMusic.pause();
    updateSoundControl();
  }
});

backgroundMusic.addEventListener('play', () => {
  updateSoundControl();
  soundToggle.classList.remove('needs-gesture');
  removeMusicUnlockListeners();
});
backgroundMusic.addEventListener('pause', updateSoundControl);
addEventListener('load', playBackgroundMusic, { once: true });
document.addEventListener('WeixinJSBridgeReady', playBackgroundMusic, { once: true });
document.addEventListener('pointerdown', unlockMusicFromGesture, true);
document.addEventListener('touchstart', unlockMusicFromGesture, true);
document.addEventListener('click', unlockMusicFromGesture, true);

function goTo(index) {
  const target = Math.max(0, Math.min(slides.length - 1, index));
  if (target === current || locked) return;
  locked = true;
  slides[current].classList.remove('is-active');
  slides[current].setAttribute('aria-hidden', 'true');
  current = target;
  slides[current].classList.add('is-active');
  slides[current].setAttribute('aria-hidden', 'false');
  currentPage.textContent = String(current + 1).padStart(2, '0');
  progress.style.width = `${((current + 1) / slides.length) * 100}%`;
  continueHint.hidden = current >= 5;
  document.body.classList.toggle('is-light', current === 3 || current === 6);
  chapterVideos.forEach((video) => {
    if (Number(video.dataset.videoPage) === current) {
      video.currentTime = 0;
      video.play().catch(() => {});
    } else {
      video.pause();
    }
  });
  if (current === 6) document.querySelector('#roleName').textContent = role || '调查员';
  setTimeout(() => { locked = false; }, 680);
}

function next() {
  if (current === 5) {
    showToast('请先选择一个调查身份');
    return;
  }
  goTo(current + 1);
}

slides.forEach((slide) => slide.addEventListener('click', (event) => {
  if (event.target.closest('button,a') || current >= 5) return;
  next();
}));

document.querySelectorAll('[data-role]').forEach((button) => button.addEventListener('click', () => {
  role = button.dataset.role;
  sessionStorage.setItem('mythoria-role', role);
  button.classList.add('chosen');
  showToast(`身份确认：${role}`);
  setTimeout(() => goTo(6), 420);
}));

document.querySelector('#copyAccount').addEventListener('click', async () => {
  const name = '上海国际青年当代艺术展SIYA';
  if (legacyCopy(name)) {
    showToast('公众号名称已复制，请打开微信搜索');
    return;
  }
  try {
    if (!navigator.clipboard?.writeText) throw new Error('Clipboard API unavailable');
    await navigator.clipboard.writeText(name);
    showToast('公众号名称已复制，请打开微信搜索');
  } catch {
    openCopyFallback();
  }
});

function legacyCopy(text) {
  const field = document.createElement('textarea');
  field.value = text;
  field.setAttribute('readonly', '');
  field.style.cssText = 'position:fixed;left:-9999px;top:0;font-size:16px;';
  document.body.appendChild(field);
  field.focus();
  field.select();
  field.setSelectionRange(0, field.value.length);
  let copied = false;
  try { copied = document.execCommand('copy'); } catch { copied = false; }
  field.remove();
  return copied;
}

function openCopyFallback() {
  const dialog = document.querySelector('#copyFallback');
  const field = document.querySelector('#manualAccount');
  dialog.hidden = false;
  field.focus();
  field.select();
  field.setSelectionRange(0, field.value.length);
}

function closeCopyFallback() {
  document.querySelector('#copyFallback').hidden = true;
  document.querySelector('#copyAccount').focus();
}

document.querySelector('#manualAccount').addEventListener('click', (event) => event.currentTarget.select());
document.querySelector('#closeCopyFallback').addEventListener('click', closeCopyFallback);

document.querySelector('#restart').addEventListener('click', () => goTo(0));

addEventListener('keydown', (event) => {
  if (!opening.hidden) {
    if (['Enter', ' ', 'Escape'].includes(event.key)) { event.preventDefault(); closeOpening(); }
    return;
  }
  if (['ArrowRight', ' ', 'Enter'].includes(event.key) && !event.target.closest('button')) { event.preventDefault(); next(); }
  if (event.key === 'ArrowLeft') goTo(current - 1);
});

let touchStartX = 0;
addEventListener('touchstart', (event) => { touchStartX = event.changedTouches[0].clientX; }, { passive: true });
addEventListener('touchend', (event) => {
  const distance = event.changedTouches[0].clientX - touchStartX;
  if (Math.abs(distance) < 60) return;
  distance < 0 ? next() : goTo(current - 1);
}, { passive: true });

let toastTimer;
function showToast(message) {
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 2300);
}

progress.style.width = `${100 / slides.length}%`;
