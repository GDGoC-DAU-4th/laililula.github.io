const text = "개발자와 비개발자가 같이 성장하는 즐거움 with Google";
const typingText = document.getElementById("typing-text");

let i = 0;

function typing() {
  if (i < text.length) {
    typingText.innerHTML += text.charAt(i);
    i++;
    setTimeout(typing, 100); // 글자가 하나씩 찍히는 속도 (100ms)
  }
}

window.onload = typing;
