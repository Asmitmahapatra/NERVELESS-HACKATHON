let currentSlideIndex = 0;
const slides = document.querySelectorAll(".alumni-card");
const track = document.getElementById("alumniCarousel");
const dots = document.querySelectorAll(".dot");
const totalSlides = slides.length / 2; // Account for duplicates

function updateCarousel() {
  const cardWidth = slides[0].offsetWidth + 32; // width + gap
  track.style.transform = `translateX(-${currentSlideIndex * cardWidth}px)`;

  dots.forEach((dot, index) => {
    dot.classList.toggle("active", index === currentSlideIndex);
  });
}

function moveCarousel(direction) {
  currentSlideIndex += direction;
  if (currentSlideIndex >= totalSlides) currentSlideIndex = 0;
  if (currentSlideIndex < 0) currentSlideIndex = totalSlides - 1;
  updateCarousel();
}

function currentSlide(index) {
  currentSlideIndex = index - 1;
  updateCarousel();
}

// Auto-slide
let autoSlide = setInterval(() => moveCarousel(1), 4000);

// Pause on hover
const container = document.querySelector(".alumni-carousel-container");
container.addEventListener("mouseenter", () => clearInterval(autoSlide));
container.addEventListener("mouseleave", () => {
  autoSlide = setInterval(() => moveCarousel(1), 4000);
});

updateCarousel();
// Add these enhanced animation triggers
document.querySelectorAll(".alumni-card").forEach((card, index) => {
  card.addEventListener("mouseenter", () => {
    card.style.animationPlayState = "paused";
  });

  card.addEventListener("mouseleave", () => {
    card.style.animationPlayState = "running";
  });
});

// Enhanced smooth scrolling with easing
function updateCarousel() {
  const cardWidth = slides[0].offsetWidth + 32;
  track.style.transform = `translateX(-${currentSlideIndex * cardWidth}px)`;
  track.style.transition = "transform 0.8s cubic-bezier(0.4, 0, 0.2, 1)";

  dots.forEach((dot, index) => {
    dot.classList.toggle("active", index === currentSlideIndex);
  });
}
