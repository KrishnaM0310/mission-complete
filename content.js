const ROCKET_IDLE_GIF = "https://media4.giphy.com/media/v1.Y2lkPTc5MGI3NjExc3FjN2ZrZjNwNnp6bzFoMDBxY251aDB2dDZ1MXZiaXluODg0ZXV1bSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/l4KhQo2MESJkc6QbS/giphy.gif";
const ROCKET_FLY_GIF = "https://media4.giphy.com/media/v1.Y2lkPTc5MGI3NjExc3FjN2ZrZjNwNnp6bzFoMDBxY251aDB2dDZ1MXZiaXluODg0ZXV1bSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/l4KhQo2MESJkc6QbS/giphy.gif";

let activeRocket = null;

(function injectRocketCSS() {
  if (document.getElementById("rocketAnimationStyles")) return;
  const style = document.createElement("style");
  style.id = "rocketAnimationStyles";
  style.textContent = `
    @keyframes hoverRocket {
      0% { transform: translateY(0); }
      50% { transform: translateY(-10px); }
      100% { transform: translateY(0); }
    }
  `;
  document.head.appendChild(style);
})();

function rocketEnter() {
  if (activeRocket) {
    activeRocket.remove();
    activeRocket = null;
  }

  activeRocket = document.createElement("img");
  activeRocket.src = ROCKET_FLY_GIF;
  activeRocket.style.position = "fixed";
  activeRocket.style.top = "0px";
  activeRocket.style.right = "-150px";
  activeRocket.style.width = "150px";
  activeRocket.style.zIndex = "999999";
  activeRocket.style.transition = "top 1.5s ease-out, right 1.5s ease-out";

  document.body.appendChild(activeRocket);

  setTimeout(() => {
    activeRocket.style.top = "50px";
    activeRocket.style.right = "20px";
    activeRocket.addEventListener(
      "transitionend",
      () => {
        activeRocket.src = ROCKET_IDLE_GIF;
        activeRocket.style.animation = "hoverRocket 2s infinite";
      },
      { once: true }
    );
  }, 500);
}

function rocketExit() {
  if (!activeRocket) return;
  activeRocket.style.animation = "";
  activeRocket.src = ROCKET_FLY_GIF;
  activeRocket.style.transition = "right 1.5s ease-in, opacity 1.5s ease-in";
  activeRocket.style.right = "-200px";
  activeRocket.style.opacity = "0";

  activeRocket.addEventListener(
    "transitionend",
    () => {
      if (activeRocket && activeRocket.parentElement) {
        activeRocket.parentElement.removeChild(activeRocket);
        activeRocket = null;
      }
    },
    { once: true }
  );
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "rocketArrives") {
    rocketEnter();
    sendResponse({ status: "Rocket arrived on page" });
  } else if (message.action === "rocketDeparts") {
    rocketExit();
    sendResponse({ status: "Rocket departed the page" });
  }
});
