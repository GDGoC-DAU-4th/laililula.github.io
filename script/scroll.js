// scroll.js — 기존 스크롤 모션 유지 + 애니 중 하드 차단(캡처 단계)
const sections = document.querySelectorAll(".section");
let currentIndex = 0;
let isScrolling = false;

// ✅ 전역 잠금 감지 (Hero 타이핑/About 애니/lockScroll 고정)
function isGlobalLocked() {
  return window.__animatingHero === true ||
         window.__animatingAbout === true ||
         getComputedStyle(document.body).position === "fixed";
}

/* ----------------- 하드 가드: 애니/이동 중 모든 입력 차단 ----------------- */
// wheel / touchmove는 반드시 passive:false + capture:true
function guardWheelTouch(e) {
  if (isGlobalLocked() || isScrolling) {
    e.preventDefault();   // 기본 스크롤 차단
  }
}
window.addEventListener("wheel",      guardWheelTouch, { passive: false, capture: true });
document.addEventListener("wheel",    guardWheelTouch, { passive: false, capture: true });
document.body.addEventListener("wheel", guardWheelTouch, { passive: false, capture: true });
window.addEventListener("touchmove",  guardWheelTouch, { passive: false, capture: true });

function guardKeys(e) {
  if (!(isGlobalLocked() || isScrolling)) return;
  const keys = ["ArrowUp","ArrowDown","PageUp","PageDown","Home","End"," "];
  if (keys.includes(e.key)) e.preventDefault(); // 키 스크롤 차단
}
window.addEventListener("keydown", guardKeys, { capture: true });

// 앵커(#about 등) 클릭도 애니/이동 중엔 막기
document.addEventListener("click", (e) => {
  if (!(isGlobalLocked() || isScrolling)) return;
  const a = e.target.closest('a[href^="#"]');
  if (a) e.preventDefault();
}, { capture: true });
/* ------------------------------------------------------------------------ */

function clamp(i) {
  return Math.max(0, Math.min(sections.length - 1, i));
}

function scrollToSection(index) {
  index = clamp(index);
  isScrolling = true;

  // 네가 쓰던 모션 그대로 유지
  sections[index].scrollIntoView({ behavior: "smooth", block: "start" });

  // 애니 끝나기 전 추가 입력이 들어와도 흔들리지 않도록 약간 더 여유
  setTimeout(() => {
    isScrolling = false;
    currentIndex = index; // 최종 인덱스 동기화
  }, 1100);
}

// 휠 입력 → 한 섹션씩
window.addEventListener("wheel", (e) => {
  if (isGlobalLocked()) { e.preventDefault(); return; }
  if (isScrolling)      { e.preventDefault(); return; }

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
  if (isGlobalLocked()) { e.preventDefault(); return; }
  if (isScrolling)      { e.preventDefault(); return; }

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

// 초기 인덱스 동기화(중간 로드 대비)
window.addEventListener("load", () => {
  const mid = window.scrollY + window.innerHeight / 2;
  let best = 0, bestDist = Infinity;
  sections.forEach((sec, i) => {
    const d = Math.abs(sec.offsetTop - mid);
    if (d < bestDist) { bestDist = d; best = i; }
  });
  currentIndex = best;
});
