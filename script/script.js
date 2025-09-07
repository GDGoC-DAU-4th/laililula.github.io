/************************************
 * 0) 스크롤 '하드' 잠금/해제 유틸로 교체
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

  // 화면 자체를 고정 (모바일 포함)
  document.body.style.position = 'fixed';
  document.body.style.top = `-${__lock.y}px`;
  document.body.style.left = '0';
  document.body.style.right = '0';
  document.body.style.width = '100%';
  document.body.style.touchAction = 'none';

  // 입력 이벤트 차단
  window.addEventListener('wheel', _preventDefault, { passive:false, capture:true });
  window.addEventListener('touchmove', _preventDefault, { passive:false, capture:true });
  window.addEventListener('keydown', _preventKeys, { passive:false, capture:true });

  // 다른 스크립트 가드용
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
 * 1) 타이핑 효과 (Hero)
 ************************************/
const text = "Google Developer Group on Campus<br>Dong-A University";
const typingText = document.getElementById("typing-text");

window.__animatingHero = true;   // ✅ 타이핑 시작 전에 잠금 ON
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
    window.__animatingHero = false;  // ✅ 타이핑 끝나면 잠금 OFF
  }
}

/************************************
 * 2) GDGoC 변환 애니메이션 (About)
 *    - 폰트 로드 후 시작
 *    - 애니 동안 스크롤 '하드' 잠금
 *    - About이 95% 이상 보일 때만 시작(초기 잠김 방지)
 ************************************/
function startAboutAnimation() {
  const box  = document.getElementById("gdgoc-box");
  const line = document.getElementById("gdgoc-text");
  if (!box || !line) return;

  const original = line.textContent.trim();
  const words    = original.split(/\s+/);
  line.textContent = "";

  const firsts = [];
  words.forEach(w => {
    const wrap  = document.createElement("span"); wrap.className = "word";
    const first = document.createElement("span"); first.className = "first"; first.textContent = w[0];
    const rest  = document.createElement("span"); rest.className  = "rest";  rest.textContent  = w.slice(1);
    wrap.append(first, rest); line.appendChild(wrap); firsts.push(first);
  });

  const rests = [...line.querySelectorAll(".rest")];

  let started = false; // ✅ 중복/조기 실행 방지
  const io = new IntersectionObserver((entries) => {
    const entry = entries[0];
    if (!entry.isIntersecting) return;

    // ✅ About이 거의 다 보일 때(95% 이상)만 시작
    if (entry.intersectionRatio < 0.95) return;
    if (started) return;
    started = true;

    // ✅ 애니 시작과 동시에 하드 잠금
    lockScroll();

    // 1) 나머지 글자 fade-out
    setTimeout(() => { rests.forEach(el => el.classList.add("hide")); }, 900);

    // 2) 중앙으로 모으기 → 3) 타이핑 → 4) 왼쪽 상단 이동 + 축소
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

        // 중앙 → 왼쪽 상단 이동 + 축소
        function moveToTopLeft(){
          const marginLeft  = 56;   // 왼쪽 여백
          const marginTop   = 96;   // 상단 여백
          const targetScale = 1.00; // 축소 비율
          const moveDuration= 900;
          const gap2 = 6, phraseGap2 = 12;

          const boxR = box.getBoundingClientRect();
          const widthsScaledTarget = rectsRaw.map(r => r.width * targetScale);
          const gdgocWidthTarget   = widthsScaledTarget.reduce((a,b)=>a+b,0) + gap2*(clones.length-1);

          const meas2 = document.createElement("span");
          meas2.style.cssText = `position:absolute;visibility:hidden;white-space:nowrap;font-weight:700;font-size:${baseFont*targetScale}px`;
          meas2.textContent = "는 무엇을 하는 곳인가요?";
          box.appendChild(meas2);
          const phraseWidthTarget = meas2.getBoundingClientRect().width;
          meas2.remove();

          const startXLeft = marginLeft;
          const topY       = marginTop;

          let acc2 = 0;
          clones.forEach((c, i) => {
            c.style.transition = `transform ${moveDuration}ms cubic-bezier(.22,.61,.36,1)`;

            const baseLeft   = parseFloat(c.style.left);
            const baseTop    = parseFloat(c.style.top);
            const baseWidth  = rectsRaw[i].width;
            const baseHeight = rectsRaw[i].height;
            const baseCenterX= boxR.left + baseLeft + baseWidth/2;
            const baseCenterY= boxR.top  + baseTop  + baseHeight/2;

            const targetCenterX = startXLeft + acc2 + widthsScaledTarget[i]/2;
            const targetCenterY = topY + (baseHeight * targetScale)/2;

            const dx = targetCenterX - baseCenterX;
            const dy = targetCenterY - baseCenterY;

            c.style.transform = `translate(${dx}px, ${dy}px) scale(${targetScale})`;
            acc2 += widthsScaledTarget[i] + gap2;
          });

          typingEl.style.transition =
            `left ${moveDuration}ms cubic-bezier(.22,.61,.36,1),
             top ${moveDuration}ms cubic-bezier(.22,.61,.36,1),
             font-size ${moveDuration}ms cubic-bezier(.22,.61,.36,1)`;

          typingEl.style.left     = (startXLeft + gdgocWidthTarget + phraseGap2 - boxR.left) + "px";
          typingEl.style.top      = (topY - boxR.top) + "px";
          typingEl.style.fontSize = (baseFont * targetScale) + "px";

          // ✅ 이동 끝나면 스크롤 해제
          const onDone = () => { typingEl.removeEventListener('transitionend', onDone); unlockScroll(); };
          typingEl.addEventListener('transitionend', onDone);
          setTimeout(unlockScroll, moveDuration + 200); // 안전장치
        }
      }, 1000);
    }, 1700);

    // 관찰은 1회만
    io.disconnect();
  }, { threshold: [0.0, 0.95], rootMargin: '0px 0px -5% 0px' });
  //  - threshold 0.95: 95% 이상 보여야 실행
  //  - rootMargin -5%: 아래쪽 여백 조금 빼서 더 안전
  io.observe(box);
}

/* 실행 시점: 폰트 로드 후 시작 */
window.addEventListener('load', () => {
  // 혹시 CSS에서 overflow 숨겨놨다면 스크롤 가능하도록 보정 (선택)
  document.documentElement.style.overflowY = 'auto';
  document.body.style.overflowY = 'auto';

  typing();

  const ready = (document.fonts && document.fonts.ready)
    ? document.fonts.ready
    : Promise.resolve();

  ready.then(startAboutAnimation);
});

// 안전장치 1: 탭 전환/백그라운드로 가면 잠금 해제
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    try { unlockScroll(); } catch(e) {}
  }
});

// 안전장치 2: 페이지 떠나기 직전 잠금 해제
window.addEventListener('beforeunload', () => {
  try { unlockScroll(); } catch(e) {}
});