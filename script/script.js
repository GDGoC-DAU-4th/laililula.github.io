/************************************
 * 1) 타이핑 효과 (Hero)
 ************************************/
const text = "Google Developer Group on Campus<br>Dong-A University";
const typingText = document.getElementById("typing-text");

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
  }
}

/************************************
 * 2) GDGoC 변환 애니메이션 (About)
 *    - 폰트 로드 후에 시작하도록 분리
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
    wrap.append(first, rest);
    line.appendChild(wrap);
    firsts.push(first);
  });

  const rests = [...line.querySelectorAll(".rest")];

  const io = new IntersectionObserver((entries) => {
    if (!entries[0].isIntersecting) return;

    // 1) 나머지 글자 fade-out
    setTimeout(() => { rests.forEach(el => el.classList.add("hide")); }, 900);

    // 2) 중앙으로 모으기 → 3) 타이핑 → 4) 왼쪽 상단으로 이동 + 축소
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
          const marginLeft  = 56;   // 여백: 왼쪽
          const marginTop   = 96;   // 여백: 상단
          const targetScale = 1.00; // 축소 비율
          const moveDuration= 900;
          const gap2 = 6, phraseGap2 = 12;

          const boxR = box.getBoundingClientRect();
          const widthsScaledTarget = rectsRaw.map(r => r.width * targetScale);
          const gdgocWidthTarget   = widthsScaledTarget.reduce((a,b)=>a+b,0) + gap2*(clones.length-1);

          const meas2 = document.createElement("span");
          meas2.style.cssText = `position:absolute;visibility:hidden;white-space:nowrap;font-weight:700;font-size:${baseFont*targetScale}px`;
          meas2.textContent = phrase;
          box.appendChild(meas2);
          const phraseWidthTarget = meas2.getBoundingClientRect().width;
          meas2.remove();

          const startXLeft = marginLeft; // 전체 문장의 왼쪽 x (뷰포트)
          const topY       = marginTop;  // 전체 문장의 윗 y   (뷰포트)

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
        }
      }, 1000);
    }, 1700);

    io.disconnect(); // 한 번만
  }, { threshold: 0.55 });

  io.observe(box);
}

/* === 실행 시점 제어 ===
   1) Hero 타이핑은 window load 때 시작
   2) About 애니메이션은 "폰트 로드 완료 후" 시작(중요!)  */
window.addEventListener('load', () => {
  typing();

  const ready = (document.fonts && document.fonts.ready)
    ? document.fonts.ready
    : Promise.resolve();

  ready.then(startAboutAnimation);
});
