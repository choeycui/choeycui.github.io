const lifeCard = document.querySelector(".life-card");
const openLifeCard = document.querySelector(".life-flip-toggle");
const closeLifeCard = document.querySelector(".life-flip-close");
const lifeCardFront = document.querySelector(".life-card-front");
const lifeCardBack = document.querySelector(".life-card-back");

function setLifeCard(open) {
  if (!lifeCard || !openLifeCard) return;
  lifeCard.classList.toggle("is-flipped", open);
  openLifeCard.setAttribute("aria-expanded", String(open));
  lifeCardFront?.toggleAttribute("inert", open);
  lifeCardBack?.toggleAttribute("inert", !open);
}

openLifeCard?.addEventListener("click", () => setLifeCard(true));
closeLifeCard?.addEventListener("click", () => setLifeCard(false));

if (window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
  lifeCard?.addEventListener("mouseenter", () => setLifeCard(true));
  lifeCard?.addEventListener("mouseleave", () => setLifeCard(false));
}

lifeCard?.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    setLifeCard(false);
    openLifeCard?.focus();
  }
});

setLifeCard(false);
