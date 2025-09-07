// scroll.js — 기존 로직 유지 + 애니 중 잠금 + 중간 멈춤 방지
const sections = document.querySelectorAll(".section");
let currentIndex = 0;
let isScrolling = false;

// ✅ 전역 잠금 감지 (Hero 타이핑/About 애니/lockScroll 고정)
function isGlobalLocked() {
  return window.__animatingHero === true ||
         window.__animatingAbout === true ||
         getComputedStyle(document.body).position === "fixed";
}

// ✅ 인덱스 안전 보정
function clamp(i) {
  return Math.max(0, Math.min(sections.length - 1, i));
}

function scrollToSection(index) {
  index = clamp(index);
  isScrolling = true;

  // 헤더 높이 보정이 필요 없으면 그대로 사용
  sections[index].scrollIntoView({ behavior: "smooth", block: "start" });

  // 스무스 이동 중 추가 입력이 기본 스크롤을 일으키지 않도록
  // 잠시 모든 휠 입력을 막는다.
  const tempBlock = (e) => e.preventDefault();
  window.addEventListener("wheel", tempBlock, { passive: false });

  // 애니가 넉넉히 끝난 뒤 휠 해제
  setTimeout(() => {
    window.removeEventListener("wheel", tempBlock);
    isScrolling = false;
    currentIndex = index; // 최종 인덱스 동기화
  }, 1100); // (네 기존 1000ms보다 살짝 여유)
}

window.addEventListener("wheel", (e) => {
  // ✅ 애니 중엔 완전 차단
  if (isGlobalLocked()) { e.preventDefault(); return; }

  // ✅ 우리 스크롤이 진행 중이면 기본 스크롤도 차단
  if (isScrolling) { e.preventDefault(); return; }

  // ✅ 이동 시작 시 항상 기본 스크롤을 막고 우리가 제어
  e.preventDefault();

  if (e.deltaY > 0) {
    currentIndex++;
    scrollToSection(currentIndex);
  } else {
    currentIndex--;
    scrollToSection(currentIndex);
  }
}, { passive: false });

// (선택) 키보드도 중간 멈춤 방지
window.addEventListener("keydown", (e) => {
  if (isGlobalLocked()) { e.preventDefault(); return; }
  if (isScrolling) { e.preventDefault(); return; }

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

// (선택) 첫 로드 시 현재 섹션 인덱스 동기화
window.addEventListener("load", () => {
  // 화면 중앙과 가장 가까운 섹션으로 동기화
  const mid = window.scrollY + window.innerHeight / 2;
  let best = 0, bestDist = Infinity;
  sections.forEach((sec, i) => {
    const d = Math.abs(sec.offsetTop - mid);
    if (d < bestDist) { bestDist = d; best = i; }
  });
  currentIndex = best;
});
