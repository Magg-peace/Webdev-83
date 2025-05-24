// js/carousel.js

let slideIndex = 1;
showSlides(slideIndex);

// Next/previous controls
function plusSlides(n) {
  showSlides(slideIndex += n);
}

// Thumbnail image controls (if you have dots/thumbnails)
function currentSlide(n) {
  showSlides(slideIndex = n);
}

function showSlides(n) {
  let i;
  let slides = document.getElementsByClassName("slide");
  // Ensure dots exist before trying to manipulate them
  let dots = document.getElementsByClassName("dot");

  if (slides.length === 0) { // Add a check if no slides are found
    console.warn("No slides found for the carousel.");
    return;
  }

  if (n > slides.length) {slideIndex = 1}
  if (n < 1) {slideIndex = slides.length}
  for (i = 0; i < slides.length; i++) {
    slides[i].style.display = "none";
  }
  for (i = 0; i < dots.length; i++) {
    dots[i].className = dots[i].className.replace(" active", "");
  }
  slides[slideIndex-1].style.display = "block";
  if (dots.length > 0) { // Only try to add active class if dots exist
    dots[slideIndex-1].className += " active";
  }
}

// Optional: Auto-slide
let autoSlideInterval = setInterval(() => {
    plusSlides(1);
}, 5000); // Change image every 5 seconds

// Pause auto-slide on hover for better user experience
const carouselContainer = document.querySelector('.carousel');
if (carouselContainer) {
    carouselContainer.addEventListener('mouseenter', () => {
        clearInterval(autoSlideInterval);
    });

    carouselContainer.addEventListener('mouseleave', () => {
        autoSlideInterval = setInterval(() => {
            plusSlides(1);
        }, 5000);
    });

    // Add event listeners for prev/next buttons if they exist
    const prevButton = document.querySelector('.prev'); // Assuming you add buttons with classes 'prev' and 'next'
    const nextButton = document.querySelector('.next');

    if (prevButton) {
        prevButton.addEventListener('click', () => plusSlides(-1));
    }
    if (nextButton) {
        nextButton.addEventListener('click', () => plusSlides(1));
    }

    // Add event listeners for dots if they exist and you want manual dot navigation
    const dotElements = document.querySelectorAll('.dot');
    dotElements.forEach((dot, index) => {
        dot.addEventListener('click', () => currentSlide(index + 1));
    });
}