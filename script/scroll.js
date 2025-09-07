/* =========================================================================
   (A) 하드 스크롤 쉴드
   - 애니메이션(Hero/About) 또는 우리 스무스 이동(isScrolling) 중에
     모든 휠/터치/키 입력을 최상단에서 가로채어 무효화
   ========================================================================= */
(() => {
  let shield = null;
  let onWheel = null, onTouchMove = null, onKey = null;

  function showShield() {
    if (shield) return;
    shield = document.createElement('div');
    Object.assign(shield.style, {
      position: 'fixed', left: 0, top: 0, right: 0, bottom: 0,
      zIndex: '999999', background: 'transparent',
      pointerEvents: 'auto', touchAction: 'none'
    });

    onWheel = (e) => e.preventDefault();
    onTouchMove = (e) => e.preventDefault();
    onKey = (e) => {
      const keys = ['ArrowUp','ArrowDown','PageUp','PageDown','Home','End',' '];
      if (keys.includes(e.key)) e.preventDefault();
    };

    shield.addEventListener('wheel', onWheel, { passive: false });
    shield.addEventListener('touchmove', onTouchMove, { passive: false });
    window.addEventListener('keydown', onKey, { capture: true });

    document.body.appendChild(shield);
    document.documentElement.style.overscrollBehavior = 'none';
  }

  function hideShield() {
    if (!shield) return;
    shield.removeEventListener('wheel', onWheel);
    shield.removeEventListener('touchmove', onTouchMove);
    window.removeEventListener('keydown', onKey, { capture: true });
    shield.remove();
    shield = null;
    document.documentElement.style.overscrollBehavior = '';
  }

  function needShield() {
    return window.__animatingHero === true ||
           window.__animatingAbout === true ||
           window.__pageIsScrolling === true ||     // ← 우리 스무스 이동 중
           getComputedStyle(document.body).position === 'fixed'; // lockScroll() 상태
  }

  function tick() {
    if (needShield()) showShield();
    else hideShield();
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
})();

/* =========================================================================
   (B) 기존 스크롤 모션 유지 + 중간 멈춤 방지 + 깃허브에서도 하드 차단
   ========================================================================= */
const sections = document.querySelectorAll(".section");
let currentIndex = 0;
let isScrolling = false;

// ✅ 전역 잠금 감지 (Hero 타이핑 / About 애니 / lockScroll 고정)
function isGlobalLocked() {
  return window.__animatingHero === true ||
         window.__animatingAbout === true ||
         getComputedStyle(document.body).position === "fixed";
}

// ✅ isScrolling ↔ 전역 플래그 동기화 (쉴드가 이걸 보고 켜짐)
function setScrolling(v) {
  isScrolling = v;
  window.__pageIsScrolling = v;
}

// 인덱스 보정
function clamp(i) {
  return Math.max(0, Math.min(sections.length - 1, i));
}

function scrollToSection(index) {
  index = clamp(index);
  setScrolling(true);

  // 네가 쓰던 모션 그대로
  sections[index].scrollIntoView({ behavior: "smooth", block: "start" });

  // 스무스 이동 중에 기본 스크롤이 끼어들지 않도록 약간 여유를 두고 해제
  setTimeout(() => {
    setScrolling(false);
    currentIndex = index; // 최종 인덱스 동기화
  }, 1100);
}

/* ---------- 최상단 가드: 애니/이동 중 모든 입력 차단 (깃허브 대응) ---------- */
// wheel / touchmove는 반드시 passive:false + capture:true
function guardWheelTouch(e) {
  if (isGlobalLocked() || isScrolling) {
    e.preventDefault();
  }
}
window.addEventListener("wheel",        guardWheelTouch, { passive: false, capture: true });
document.addEventListener("wheel",      guardWheelTouch, { passive: false, capture: true });
document.body.addEventListener("wheel", guardWheelTouch, { passive: false, capture: true });
window.addEventListener("touchmove",    guardWheelTouch, { passive: false, capture: true });

function guardKeys(e) {
  if (!(isGlobalLocked() || isScrolling)) return;
  const keys = ["ArrowUp","ArrowDown","PageUp","PageDown","Home","End"," "];
  if (keys.includes(e.key)) e.preventDefault();
}
window.addEventListener("keydown", guardKeys, { capture: true });

// 앵커(#about 등) 클릭도 애니/이동 중엔 막기
document.addEventListener("click", (e) => {
  if (!(isGlobalLocked() || isScrolling)) return;
  const a = e.target.closest('a[href^="#"]');
  if (a) e.preventDefault();
}, { capture: true });

/* ----------------------------- 실제 휠/키/터치 ----------------------------- */
// 휠 입력 → 한 섹션씩
window.addEventListener("wheel", (e) => {
  if (isGlobalLocked() || isScrolling) { e.preventDefault(); return; }
  e.preventDefault(); // 우리가 제어

  if (e.deltaY > 0) {
    currentIndex++;
    scrollToSection(currentIndex);
  } else {
    currentIndex--;
    scrollToSection(currentIndex);
  }
}, { passive: false });

// 키보드(옵션): 한 섹션씩
window.addEventListener("keydown", (e) => {
  if (isGlobalLocked() || isScrolling) { e.preventDefault(); return; }

  if (["ArrowDown","PageDown"," "].includes(e.key)) {
    e.preventDefault();
    currentIndex++;
    scrollToSection(currentIndex);
  } else if (["ArrowUp","PageUp"].includes(e.key)) {
    e.preventDefault();
    currentIndex--;
    scrollToSection(currentIndex);
  }
});

// 터치(옵션): 간단 스와이프
let touchStartY = null;
window.addEventListener("touchstart", (e) => {
  if (isGlobalLocked()) return;
  touchStartY = e.touches[0].clientY;
}, { passive: true });

window.addEventListener("touchend", (e) => {
  if (isGlobalLocked() || isScrolling || touchStartY == null) return;
  const dy = touchStartY - e.changedTouches[0].clientY;
  touchStartY = null;
  if (Math.abs(dy) < 50) return; // 임계값
  if (dy > 0) { currentIndex++; } else { currentIndex--; }
  scrollToSection(currentIndex);
}, { passive: true });

/* ------------------------- 초기 인덱스 동기화(안전) ------------------------ */
window.addEventListener("load", () => {
  const mid = window.scrollY + window.innerHeight / 2;
  let best = 0, bestDist = Infinity;
  sections.forEach((sec, i) => {
    const d = Math.abs(sec.offsetTop - mid);
    if (d < bestDist) { bestDist = d; best = i; }
  });
  currentIndex = best;
});
