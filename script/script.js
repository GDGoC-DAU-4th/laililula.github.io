/************************************
 * 0) 스크롤 하드 잠금/해제 (애니 중 입력 봉인)
 ************************************/
let __lock = { active:false, y:0 };
function _preventDefault(e){ e.preventDefault(); }
function _preventKeys(e){
  const keys = ['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space','PageUp','PageDown','Home','End'];
  if (keys.includes(e.code) || keys.includes(e.key)) e.preventDefault();
}
function lockScroll(){
  if (__lock.active) return;
  __lock.active = true;
  __lock.y = window.scrollY || document.documentElement.scrollTop || 0;

  document.body.style.position = 'fixed';
  document.body.style.top = `-${__lock.y}px`;
  document.body.style.left = '0';
  document.body.style.right = '0';
  document.body.style.width = '100%';
  document.body.style.touchAction = 'none';

  window.addEventListener('wheel', _preventDefault, { passive:false, capture:true });
  window.addEventListener('touchmove', _preventDefault, { passive:false, capture:true });
  window.addEventListener('keydown', _preventKeys, { passive:false, capture:true });

  window.__animatingAbout = true;
}
function unlockScroll(){
  if (!__lock.active) return;

  window.removeEventListener('wheel', _preventDefault, true);
  window.removeEventListener('touchmove', _preventDefault, true);
  window.removeEventListener('keydown', _preventKeys, true);

  document.body.style.position = '';
  document.body.style.top = '';
  document.body.style.left = '';
  document.body.style.right = '';
  document.body.style.width = '';
  document.body.style.touchAction = '';

  window.scrollTo(0, __lock.y);

  __lock.active = false;
  window.__animatingAbout = false;
}

/************************************
 * 1) Hero 타이핑 (진행 중엔 입력 잠금 플래그)
 ************************************/
const text = "Google Developer Group on Campus<br>Dong-A University";
const typingText = document.getElementById("typing-text");

window.__animatingHero = true;
let i = 0;
function typing() {
  if (i < text.length) {
    if (text.substring(i, i + 4) === "<br>") {
      typingText.innerHTML += "<br>";
      i += 4;
    } else {
      typingText.innerHTML += text.charAt(i);
      i++;
    }
    setTimeout(typing, 60);
  } else {
    window.__animatingHero = false;
  }
}

/************************************
 * 2) "Hero → Projects" 바로 점프 시, About 애니 1회 스킵 플래그
 ************************************/
(function setSkipOnceOnHeroToProjectsClick(){
  const sections = Array.from(document.querySelectorAll('.section'));
  const hero     = document.querySelector('.hero');

  function nearestIndex() {
    const mid = window.scrollY + window.innerHeight / 2;
    let best = 0, bestDist = Infinity;
    sections.forEach((sec, i) => {
      const d = Math.abs(sec.offsetTop - mid);
      if (d < bestDist) { bestDist = d; best = i; }
    });
    return best;
  }

  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href="#projects"]');
    if (!a) return;
    const idx = nearestIndex();
    if (sections[idx] === hero) {
      // Hero 화면에 있을 때 "한 번만" 스킵
      window.__skipAboutOnce = true;
    }
  }, true);
})();

/************************************
 * 3) GDGoC 변환 애니메이션 (About)
 *    - Hero→Projects 바로 점프 시 1회 스킵
 *    - 그 외엔 언제 가든 실행 (단, 한 번만)
 ************************************/
function startAboutAnimation() {
  const box  = document.getElementById("gdgoc-box");
  const line = document.getElementById("gdgoc-text");
  const aboutSection = document.getElementById("about") || (box ? box.closest('.section') : null);
  if (!box || !line || !aboutSection) return;

  const header = document.querySelector('.navbar');
  const headerH = () => (header ? header.offsetHeight : 0);

  // 문장 → (앞글자 + 나머지) 구조화
  const original = line.textContent.trim();
  const words    = original.split(/\s+/);
  line.textContent = "";

  const firsts = [];
  words.forEach(w => {
    const wrap  = document.createElement("span"); wrap.className = "word";
    const first = document.createElement("span"); first.className = "first"; first.textContent = w[0];
    const rest  = document.createElement("span"); rest.className  = "rest";  rest.textContent  = w.slice(1);
    wrap.append(first, rest);
    line.appendChild(wrap);
    firsts.push(first);
  });
  const rests = [...line.querySelectorAll(".rest")];

  // 실제 애니 본체
  function runAboutAnimation() {
    lockScroll();

    // 1) 나머지 글자 fade-out
    setTimeout(() => {
      rests.forEach(el => el.classList.add("hide"));
    }, 900);

    // 2) 중앙으로 모음 → 3) 오른쪽 타이핑 → 4) 좌상단 축소 이동
    setTimeout(() => {
      const phrase = "는 무엇을 하는 곳인가요?";
      const scale  = 1.35, gap = 6, phraseGap = 12;

      const boxRect = box.getBoundingClientRect();
      const clones = firsts.map(f => {
        const r = f.getBoundingClientRect();
        const c = document.createElement("span");
        c.className = "floating-letter";
        c.textContent = f.textContent;
        c.style.left = (r.left - boxRect.left) + "px";
        c.style.top  = (r.top  - boxRect.top)  + "px";
        c.style.fontSize = getComputedStyle(f).fontSize;
        box.appendChild(c);
        f.style.visibility = "hidden";
        return c;
      });

      const rectsRaw      = clones.map(c => c.getBoundingClientRect());
      const widthsScaled  = rectsRaw.map(r => r.width * scale);
      const gdgocWidth    = widthsScaled.reduce((a,b)=>a+b,0) + gap*(clones.length-1);

      const baseFont = parseFloat(getComputedStyle(firsts[0]).fontSize) || 24;

      // 타이핑 폭 미리 측정
      const meas = document.createElement("span");
      meas.style.cssText = `position:absolute;visibility:hidden;white-space:nowrap;font-weight:700;font-size:${baseFont*scale}px`;
      meas.textContent = phrase;
      box.appendChild(meas);
      const phraseWidth = meas.getBoundingClientRect().width;
      meas.remove();

      const totalWidth     = gdgocWidth + phraseGap + phraseWidth;
      const viewportStartX = (window.innerWidth  - totalWidth) / 2;
      const viewportCenterY=  window.innerHeight / 2;

      let acc = 0;
      clones.forEach((c, i) => {
        const cur = c.getBoundingClientRect();
        const curCenterX = cur.left + cur.width/2;
        const curCenterY = cur.top  + cur.height/2;

        const targetCenterX = viewportStartX + acc + widthsScaled[i]/2;
        const dx = targetCenterX - curCenterX;
        const dy = viewportCenterY - curCenterY;

        c.style.transform = `translate(${dx}px, ${dy}px) scale(${scale})`;
        acc += widthsScaled[i] + gap;
      });

      setTimeout(() => {
        clones.forEach(c => { c.style.transition = "none"; });

        // 오른쪽에 타이핑
        const typingEl = document.createElement("span");
        typingEl.id = "gdgoc-typing";
        typingEl.style.fontSize = (baseFont * scale) + "px";

        const leftInViewport = viewportStartX + gdgocWidth + phraseGap;
        const topInViewport  = viewportCenterY - (rectsRaw[0].height * scale) / 2;

        typingEl.style.left = (leftInViewport - boxRect.left) + "px";
        typingEl.style.top  = (topInViewport  - boxRect.top ) + "px";
        box.appendChild(typingEl);

        const typeSpeed = 70;
        let k = 0;
        (function typeNext(){
          if (k < phrase.length) {
            typingEl.textContent += phrase[k++];
            setTimeout(typeNext, typeSpeed);
          } else {
            setTimeout(moveToTopLeft, 500);
          }
        })();

        // 중앙 → 좌상단 이동 + 축소
        function moveToTopLeft(){
          const marginLeft  = 56;
          const marginTop   = 96;
          const targetScale = 1.00;
          const moveDuration= 900;
          const gap2 = 6, phraseGap2 = 12;

          const boxR = box.getBoundingClientRect();
          const widthsScaledTarget = rectsRaw.map(r => r.width * targetScale);
          const gdgocWidthTarget   = widthsScaledTarget.reduce((a,b)=>a+b,0) + gap2*(clones.length-1);

          // GDGoC 이동
          let acc2 = 0;
          clones.forEach((c, i) => {
            c.style.transition = `transform ${moveDuration}ms cubic-bezier(.22,.61,.36,1)`;
            const baseLeft   = parseFloat(c.style.left);
            const baseTop    = parseFloat(c.style.top);
            const baseWidth  = rectsRaw[i].width;
            const baseHeight = rectsRaw[i].height;
            const baseCenterX= boxR.left + baseLeft + baseWidth/2;
            const baseCenterY= boxR.top  + baseTop  + baseHeight/2;

            const targetCenterX = marginLeft + acc2 + widthsScaledTarget[i]/2;
            const targetCenterY = marginTop   + (baseHeight * targetScale)/2;

            const dx = targetCenterX - baseCenterX;
            const dy = targetCenterY - baseCenterY;
            c.style.transform = `translate(${dx}px, ${dy}px) scale(${targetScale})`;
            acc2 += widthsScaledTarget[i] + gap2;
          });

          // 타이핑 이동/축소
          typingEl.style.transition =
            `left ${moveDuration}ms cubic-bezier(.22,.61,.36,1),
             top ${moveDuration}ms cubic-bezier(.22,.61,.36,1),
             font-size ${moveDuration}ms cubic-bezier(.22,.61,.36,1)`;
          typingEl.style.left     = (marginLeft + gdgocWidthTarget + phraseGap2 - boxR.left) + "px";
          typingEl.style.top      = (marginTop  - boxR.top) + "px";
          typingEl.style.fontSize = (baseFont * targetScale) + "px";

          const onDone = () => { typingEl.removeEventListener('transitionend', onDone); unlockScroll(); };
          typingEl.addEventListener('transitionend', onDone);
          setTimeout(unlockScroll, moveDuration + 200); // 안전장치
        }
      }, 1000);
    }, 1700);
  }

  // === “한 번만” 실행 컨트롤 ===
  let started = false;

  // About 섹션이 충분히 들어오면 실행.
  // (Hero→Projects 스킵 플래그가 true면 '이번 1회만' 건너뜀)
  const io = new IntersectionObserver((entries) => {
    if (started) return;

    const entry = entries[0];
    if (!entry.isIntersecting) return;

    // 헤더 반영: rootMargin에서 헤더만큼 빼줌 (옵저버 옵션에서 처리)
    if (entry.intersectionRatio < 0.65) return;

    // ★ 여기서만 “1회 스킵” 소비
    if (window.__skipAboutOnce) {
      window.__skipAboutOnce = false; // 이번만 스킵하고 즉시 해제
      return;                         // 다음 진입 때 실행됨
    }

    started = true;
    runAboutAnimation();
    io.disconnect(); // 애니는 한 번만
  }, {
    threshold: [0.65],
    root: null,
    rootMargin: `-${headerH()}px 0px 0px 0px`
  });

  io.observe(aboutSection);
}

/************************************
 * 4) 실행 시점
 ************************************/
window.addEventListener('load', () => {
  document.documentElement.style.overflowY = 'auto';
  document.body.style.overflowY = 'auto';

  typing();

  const ready = (document.fonts && document.fonts.ready)
    ? document.fonts.ready
    : Promise.resolve();

  ready.then(startAboutAnimation);
});

// 안전장치: 탭 전환/이탈 시 잠금 해제
document.addEventListener('visibilitychange', () => {
  if (document.hidden) { try { unlockScroll(); } catch(e) {} }
});
window.addEventListener('beforeunload', () => {
  try { unlockScroll(); } catch(e) {}
});
