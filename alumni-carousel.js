(() => {
  function initCarousel() {
    const track = document.getElementById("alumniCarousel");
    if (!track) return;

    const slides = track.querySelectorAll(".alumni-card");
    if (!slides.length) return;

    const dots = document.querySelectorAll(".carousel-dots .dot");
    const totalSlides = Math.max(1, Math.floor(slides.length / 2)); // Account for duplicates
    let currentSlideIndex = 0;
    let autoSlide = null;

    function updateCarousel() {
      const cardWidth = slides[0].offsetWidth + 32;
      track.style.transform = `translateX(-${currentSlideIndex * cardWidth}px)`;
      track.style.transition = "transform 0.8s cubic-bezier(0.4, 0, 0.2, 1)";

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
      currentSlideIndex = Math.min(totalSlides - 1, Math.max(0, (index || 1) - 1));
      updateCarousel();
    }

    // expose for onclick handlers
    window.moveCarousel = moveCarousel;
    window.currentSlide = currentSlide;

    // Auto-slide
    autoSlide = setInterval(() => moveCarousel(1), 4000);

    // Pause on hover
    const container = document.querySelector(".alumni-carousel-container");
    if (container) {
      container.addEventListener("mouseenter", () => autoSlide && clearInterval(autoSlide));
      container.addEventListener("mouseleave", () => {
        autoSlide = setInterval(() => moveCarousel(1), 4000);
      });
    }

    // Pause card animation on hover (if any)
    slides.forEach((card) => {
      card.addEventListener("mouseenter", () => {
        card.style.animationPlayState = "paused";
      });
      card.addEventListener("mouseleave", () => {
        card.style.animationPlayState = "running";
      });
    });

    updateCarousel();
    window.addEventListener("resize", updateCarousel);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initCarousel);
  } else {
    initCarousel();
  }
})();
