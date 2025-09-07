const text = "Google Developer Group on Student<br>Dong-A University";
const typingText = document.getElementById("typing-text");

let i = 0;

function typing() {
  if (i < text.length) {
    if (text.substring(i, i + 4) === "<br>") {
      typingText.innerHTML += "<br>"; // 줄바꿈 태그는 그대로 추가
      i += 4;
    } else {
      typingText.innerHTML += text.charAt(i); // 일반 문자 추가
      i++;
    }
    setTimeout(typing, 60); // 타이핑 속도
  }
}

window.onload = typing;
