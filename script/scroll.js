const sections = document.querySelectorAll(".section");
let currentIndex = 0;
let isScrolling = false;

function scrollToSection(index) {
  if (index < 0 || index >= sections.length) return;
  isScrolling = true;
  sections[index].scrollIntoView({ behavior: "smooth" });
  setTimeout(() => { isScrolling = false; }, 1000); // 1초 동안 스크롤 잠금
}

window.addEventListener("wheel", (e) => {
  if (isScrolling) return;
  if (e.deltaY > 0) {
    // 휠 ↓
    currentIndex++;
    scrollToSection(currentIndex);
  } else {
    // 휠 ↑
    currentIndex--;
    scrollToSection(currentIndex);
  }
});
