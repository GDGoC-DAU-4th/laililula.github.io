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
window.addEventListener("load", typing);


/************************************
 * 2) GDGoC 변환 애니메이션 (About)
 ************************************/
// 중앙 완성 → 왼쪽 상단으로 이동(여백 포함) + 글자 크기 축소
document.addEventListener("DOMContentLoaded", () => {
  const box  = document.getElementById("gdgoc-box");
  const line = document.getElementById("gdgoc-text");
  if (!box || !line) return;

  // 1) 문장을 단어 단위로 구조화
  const original = line.textContent.trim();             // "Google Developer Group on Campus"
  const words    = original.split(/\s+/);                // ["Google","Developer","Group","on","Campus"]
  line.textContent = "";

  const firsts = [];
  words.forEach(w => {
    const wrap  = document.createElement("span");
    wrap.className = "word";

    const first = document.createElement("span");
    first.className = "first";
    first.textContent = w[0];

    const rest  = document.createElement("span");
    rest.className = "rest";
    rest.textContent = w.slice(1);

    wrap.append(first, rest);
    line.appendChild(wrap);
    firsts.push(first);
  });

  const rests = [...line.querySelectorAll(".rest")];

  const io = new IntersectionObserver((entries) => {
    if (!entries[0].isIntersecting) return;

    // Step 1: 나머지 글자 fade-out
    setTimeout(() => {
      rests.forEach(el => el.classList.add("hide"));
    }, 900);

    // Step 2: 앞글자 5개를 "최종 문장 전체가 뷰포트 중앙"이 되도록 모음
    setTimeout(() => {
      const phrase = "는 무엇을 하는 곳인가요?";
      const scale  = 1.35;  // 중앙에서의 GDGoC 확대 비율
      const gap    = 6;     // GDGoC 글자 간격
      const phraseGap = 12; // GDGoC와 문장 사이 여백

      // 복제 생성 + 현재 위치로 배치
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

      // 크기 계산
      const rectsRaw      = clones.map(c => c.getBoundingClientRect());
      const widthsScaled  = rectsRaw.map(r => r.width * scale);
      const gdgocWidth    = widthsScaled.reduce((a,b)=>a+b,0) + gap*(clones.length-1);

      // 타이핑 폭 측정(스케일 적용)
      const baseFont = parseFloat(getComputedStyle(firsts[0]).fontSize) || 24;
      const meas = document.createElement("span");
      meas.style.cssText =
        `position:absolute;visibility:hidden;white-space:nowrap;font-weight:700;font-size:${baseFont*scale}px`;
      meas.textContent = phrase;
      box.appendChild(meas);
      const phraseWidth = meas.getBoundingClientRect().width;
      meas.remove();

      // 화면 중앙 배치
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

      // 중앙 고정 + 타이핑 시작
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

        // 타이핑 실행
        const typeSpeed = 70;
        let k = 0;
        (function typeNext(){
          if (k < phrase.length) {
            typingEl.textContent += phrase[k++];
            setTimeout(typeNext, typeSpeed);
          } else {
            // 중앙에서 완성된 뒤 → 왼쪽 상단으로 이동(여백 포함) + 글자 크기 축소
            setTimeout(moveToTopLeft, 500);
          }
        })();

        // ===== 왼쪽 상단으로 이동(여백 포함) + 축소 =====
        function moveToTopLeft(){
          // 원하는 여백/속도/목표 스케일
          const marginLeft  = 56;   // 왼쪽 여백
          const marginTop   = 96;   // 상단 여백(네비+간격)
          const targetScale = 1.00; // 왼쪽 상단에서의 GDGoC 스케일(작아짐)
          const moveDuration= 900;  // 이동 시간(ms)
          const gap2        = 6;
          const phraseGap2  = 12;

          // 재계산(목표 스케일 기준 폭)
          const boxR = box.getBoundingClientRect();
          const widthsScaledTarget = rectsRaw.map(r => r.width * targetScale);
          const gdgocWidthTarget   = widthsScaledTarget.reduce((a,b)=>a+b,0) + gap2*(clones.length-1);

          // 타이핑 문장 폭도 목표 스케일로 재측정
          const meas2 = document.createElement("span");
          meas2.style.cssText =
            `position:absolute;visibility:hidden;white-space:nowrap;font-weight:700;font-size:${baseFont*targetScale}px`;
          meas2.textContent = phrase;
          box.appendChild(meas2);
          const phraseWidthTarget = meas2.getBoundingClientRect().width;
          meas2.remove();

          // 왼쪽 상단 목표(뷰포트 좌표)
          const startXLeft = marginLeft; // 전체 문장의 왼쪽 x
          const topY       = marginTop;  // 전체 문장의 윗 y

          // 클론들 이동(변환 애니메이션 재활성화)
          let acc2 = 0;
          clones.forEach((c, i) => {
            c.style.transition = `transform ${moveDuration}ms cubic-bezier(.22,.61,.36,1)`;

            // base(변환 전) 중심 좌표 (뷰포트) — transform 기준은 '원본 위치'
            const baseLeft   = parseFloat(c.style.left);
            const baseTop    = parseFloat(c.style.top);
            const baseWidth  = rectsRaw[i].width;
            const baseHeight = rectsRaw[i].height;
            const baseCenterX= boxR.left + baseLeft + baseWidth/2;
            const baseCenterY= boxR.top  + baseTop  + baseHeight/2;

            // 목표 중심 좌표(뷰포트)
            const targetCenterX = startXLeft + acc2 + widthsScaledTarget[i]/2;
            const targetCenterY = topY + (baseHeight * targetScale)/2;

            const dx = targetCenterX - baseCenterX;
            const dy = targetCenterY - baseCenterY;

            c.style.transform = `translate(${dx}px, ${dy}px) scale(${targetScale})`;
            acc2 += widthsScaledTarget[i] + gap2;
          });

          // 타이핑 엘리먼트도 위치/크기 애니메이션
          typingEl.style.transition =
            `left ${moveDuration}ms cubic-bezier(.22,.61,.36,1),
             top ${moveDuration}ms cubic-bezier(.22,.61,.36,1),
             font-size ${moveDuration}ms cubic-bezier(.22,.61,.36,1)`;

          typingEl.style.left     = (startXLeft + gdgocWidthTarget + phraseGap2 - boxR.left) + "px";
          typingEl.style.top      = (topY - boxR.top) + "px";
          typingEl.style.fontSize = (baseFont * targetScale) + "px";
        }
        // ===== 이동 끝 =====

      }, 1000); // 중앙으로 모이는 트랜지션 시간과 동일
    }, 1700);

    io.disconnect(); // 한 번만 실행
  }, { threshold: 0.55 });

  io.observe(box);
});
