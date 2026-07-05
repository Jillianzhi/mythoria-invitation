const slides = [...document.querySelectorAll('.slide')];
const currentPage = document.querySelector('#currentPage');
const progress = document.querySelector('#progress');
const prevButton = document.querySelector('#prev');
const nextButton = document.querySelector('#next');
const controls = document.querySelector('.controls');
const toast = document.querySelector('#toast');
let current = 0;
let role = sessionStorage.getItem('mythoria-role') || '';
let locked = false;

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
  prevButton.disabled = current === 0;
  nextButton.disabled = current === slides.length - 1 || current === 5;
  controls.hidden = current === slides.length - 1;
  document.body.classList.toggle('is-light', current === 3 || current === 6);
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

document.querySelectorAll('[data-next]').forEach((button) => button.addEventListener('click', (event) => {
  event.stopPropagation();
  next();
}));
prevButton.addEventListener('click', () => goTo(current - 1));
nextButton.addEventListener('click', next);

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
  const name = 'MYTHORIA 神闻纪';
  try {
    await navigator.clipboard.writeText(name);
    showToast('公众号名称已复制，请打开微信搜索');
  } catch {
    showToast(`请在微信搜索：${name}`);
  }
});

document.querySelector('#restart').addEventListener('click', () => goTo(0));

addEventListener('keydown', (event) => {
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

prevButton.disabled = true;
progress.style.width = `${100 / slides.length}%`;
