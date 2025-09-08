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

          // 중앙 → 좌상단 이동 + 축소 애니 끝난 직후
            const onDone = () => {
                typingEl.removeEventListener('transitionend', onDone);
                // ★ 여기서 고정 레이어에 얼림: 이후 타이핑 박스가 떠도 절대 안 밀림
                freezeAboutTitle(aboutSection, clones, typingEl);
                // ⬇️ 문장 전체를 타이핑으로 출력
                runAboutTypingSequence(aboutSection, unlockScroll);
            };
            typingEl.addEventListener('transitionend', onDone);
            // 안전장치(transitionend 못 받았을 때)
            setTimeout(() => runAboutTypingSequence(aboutSection, unlockScroll), moveDuration + 220);

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

// about: 키워드(색) + 흰 글자 전부 "타이핑"만으로 출력
// about: 4줄 설명을 "타이핑"으로만 표시 (글자 크기 동일)
function runAboutTypingSequence(mount, done) {
  // 혹시 이전 레이어가 남아있으면 정리
  const old = mount.querySelector('.kw-typebox');
  if (old) old.remove();

  const box = document.createElement('div');
  box.className = 'kw-typebox';
  mount.appendChild(box);

  // ── 라인/세그먼트 정의 ─────────────────────────────────────────────
  // 1줄: Google(로고 색) + 나머지 문장
  // 2줄: 대학 기반 커뮤니티
  // 3줄: 개발 / 네트워킹 (색)
  // 4줄: 프로젝트 / 함께 성장 (색)
  const LINES = [
    [
      { cls: 'kw-google g-g',  text: 'G' },
      { cls: 'kw-google g-o1', text: 'o' },
      { cls: 'kw-google g-o2', text: 'o' },
      { cls: 'kw-google g-g2', text: 'g' },
      { cls: 'kw-google g-l',  text: 'l' },
      { cls: 'kw-google g-e',  text: 'e' },
      { cls: 'kw-rest', text: ' Developers에서 제공하는 프로그램을 통해 운영되는' }
    ],
    [
      { cls: 'kw-rest', text: '대학교 기반의 개발자 커뮤니티 그룹입니다.' }
    ],
    [
      { cls: 'kw-key kw-dev', text: '개발' },
      { cls: 'kw-rest',       text: '에 관심있는 사람들이 모여 ' },
      { cls: 'kw-key kw-net', text: '네트워킹' },
      { cls: 'kw-rest',       text: '하며,' }
    ],
    [
      { cls: 'kw-rest',        text: '다양한 ' },
      { cls: 'kw-key kw-proj', text: '프로젝트' },
      { cls: 'kw-rest',        text: '에 참여해 모두가 ' },
      { cls: 'kw-key kw-grow', text: '함께 성장' },
      { cls: 'kw-rest',        text: '하는 공간입니다.' }
    ],
  ];
  // ───────────────────────────────────────────────────────────────────

  // 줄 DOM 준비
  const lineEls = LINES.map(() => {
    const el = document.createElement('div');
    el.className = 'kw-line';
    box.appendChild(el);
    return el;
  });

  // 깜빡이 커서
  const caret = document.createElement('span');
  caret.className = 'kw-caret';

  // 타이핑 속도
  const SPEED    = 34;   // 글자 간
  const SEG_GAP  = 80;   // 세그먼트(색/보통) 사이
  const LINE_GAP = 160;  // 줄 사이

  function typeInto(el, text, i = 0, cb) {
    if (i >= text.length) return cb && cb();
    el.textContent += text[i];
    setTimeout(() => typeInto(el, text, i + 1, cb), SPEED);
  }

  let li = 0;
  function nextLine() {
    if (li >= LINES.length) {
      caret.remove();
      if (typeof done === 'function') done();
      return;
    }
    const line = lineEls[li];
    const segs = LINES[li];

    // 한 줄 타이핑 시작
    let si = 0;
    function nextSeg() {
      if (si >= segs.length) {
        li++;
        return setTimeout(nextLine, LINE_GAP);
      }
      const seg = segs[si++];
      const span = document.createElement('span');
      span.className = seg.cls;
      line.appendChild(span);
      line.appendChild(caret);  // 커서를 항상 끝에 붙임
      typeInto(span, seg.text, 0, () => setTimeout(nextSeg, SEG_GAP));
    }
    nextSeg();
  }
  nextLine();
}

/************************************
 * 4) 실행 시점ㅋㅋ
 ************************************/
window.addEventListener('load', () => {
  document.documentElement.style.overflowY = 'auto';
  document.body.style.overflowY = 'auto';

  typing();

  const ready = (document.fonts && document.fonts.ready)
    ? document.fonts.ready
    : Promise.resolve();

  ready.then(startAboutAnimation);

  initBinaryElevatorBg();
});

// 안전장치: 탭 전환/이탈 시 잠금 해제
document.addEventListener('visibilitychange', () => {
  if (document.hidden) { try { unlockScroll(); } catch(e) {} }
});
window.addEventListener('beforeunload', () => {
  try { unlockScroll(); } catch(e) {}
});

/* ============================================================
 * About 섹션 배경: 0/1 엘리베이터 모션 (Canvas)
 * - 초경량 루프, DPR 대응, 가시영역에서만 동작
 * ============================================================ */
function initBinaryElevatorBg(){
  const about = document.getElementById('about');
  if (!about) return;

  // 1) 캔버스는 항상 가장 아래 레이어 (첫 자식)로
  const cvs = document.createElement('canvas');
  cvs.className = 'bin-canvas';
  about.prepend(cvs); // 👈 맨 앞에(뒤 레이어)가 되도록
  const ctx = cvs.getContext('2d');

  // 2) 크기/DPR 맞추기
  function fit(){
    const dpr = Math.min(window.devicePixelRatio || 1, 2); // 과도한 스케일 방지
    const w = about.clientWidth;
    const h = about.clientHeight;

    // CSS 크기
    cvs.style.width = w + 'px';
    cvs.style.height = h + 'px';

    // 실제 렌더 크기
    cvs.width  = Math.floor(w * dpr);
    cvs.height = Math.floor(h * dpr);

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);  // 좌표계를 CSS 픽셀로
  }
  fit();
  window.addEventListener('resize', fit);

  // 3) 아주 작은 0/1 비 내리기 (예시)
  const cols = [];
  function setupCols(){
    cols.length = 0;
    const cell = 16; // 글자 간격(px)
    const cw = about.clientWidth;
    const ch = about.clientHeight;
    const n = Math.ceil(cw / cell);
    for (let i=0;i<n;i++){
      cols.push({
        x: i * cell + 4,
        y: Math.random() * -ch,       // 위에서 시작
        speed: 40 + Math.random()*60, // px/s
      });
    }
  }
  setupCols();
  window.addEventListener('resize', setupCols);

  ctx.font = '12px monospace';
  ctx.fillStyle = 'rgba(255,255,255,.55)'; // 기본 그레이
  ctx.textBaseline = 'top';

  let last = performance.now();
  function tick(now){
    const dt = Math.min(0.05, (now - last)/1000); // 안정성
    last = now;

    // 배경 지우기
    ctx.clearRect(0,0,cvs.width, cvs.height);

    // 0/1 그리기
    const h = about.clientHeight;
    cols.forEach(c => {
      c.y += c.speed * dt;
      if (c.y > h + 32) c.y = -Math.random()*h * 0.5; // 화면 위로 리셋

      // 한 열에 여러 줄 찍기
      for (let k = -2; k < h/16 + 2; k++){
        const y = c.y + k*16;
        if (y < -16 || y > h+16) continue;
        const bit = (Math.random() < 0.5) ? '0' : '1';
        ctx.fillText(bit, c.x, y);
      }
    });

    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}
// 페이지 로드 시 호출
window.addEventListener('load', initBinaryElevatorBg);

// 좌상단으로 이동 끝난 GDGoC 글자(clones)와 질문(typingEl)을
// #about의 고정 레이어에 절대좌표로 고정해 이후 레이아웃 영향에서 분리
function freezeAboutTitle(aboutSection, clones, typingEl) {
  const aboutRect = aboutSection.getBoundingClientRect();

  // 고정 레이어(한 번만 생성)
  let fixed = aboutSection.querySelector('#about-fixed-title');
  if (!fixed) {
    fixed = document.createElement('div');
    fixed.id = 'about-fixed-title';
    Object.assign(fixed.style, {
      position: 'absolute',
      left: '0', top: '0', right: '0', bottom: '0',
      pointerEvents: 'none',
      zIndex: 4, // 타이핑 박스(3)보다 위
    });
    aboutSection.appendChild(fixed);
  }

  // 각 글자 clone을 현재 보이는 위치로 절대 고정
  clones.forEach(c => {
    const r = c.getBoundingClientRect();
    Object.assign(c.style, {
      transition: 'none',
      transform: 'none',
      position: 'absolute',
      left: (r.left - aboutRect.left) + 'px',
      top:  (r.top  - aboutRect.top)  + 'px',
    });
    fixed.appendChild(c);
  });

  // 질문 타이핑 요소도 동일하게 고정
  const rt = typingEl.getBoundingClientRect();
  Object.assign(typingEl.style, {
    transition: 'none',
    transform: 'none',
    position: 'absolute',
    left: (rt.left - aboutRect.left) + 'px',
    top:  (rt.top  - aboutRect.top)  + 'px',
  });
  fixed.appendChild(typingEl);

  // 가운데 있던 원래 박스는 숨겨서 레이아웃 영향 제거
  const box = document.getElementById('gdgoc-box');
  if (box) box.style.visibility = 'hidden';
}
