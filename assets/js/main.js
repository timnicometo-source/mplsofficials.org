async function loadIncludes() {
  const header = document.getElementById('site-header');
  const footer = document.getElementById('site-footer');

  try {
    if (header) {
      const response = await fetch('/includes/header.html');

      if (!response.ok) {
        throw new Error(`Header include failed: ${response.status}`);
      }

      header.innerHTML = await response.text();
      setActiveNavLink();
    }

    if (footer) {
      const response = await fetch('/includes/footer.html');

      if (!response.ok) {
        throw new Error(`Footer include failed: ${response.status}`);
      }

      footer.innerHTML = await response.text();
    }
  } catch (error) {
    console.error('Error loading site includes:', error);
  } finally {
    document.body.classList.add('page-ready');
  }
}

function setActiveNavLink() {
  const page = document.body.dataset.page;
  if (!page) return;

  document.querySelectorAll('.site-nav a').forEach((link) => {
    if (link.dataset.page === page) {
      link.classList.add('active');
    }
  });
}

function initSlideshows() {
  const slideshows = document.querySelectorAll('[data-slideshow]');

  slideshows.forEach((slideshow) => {
    const slides = Array.from(slideshow.querySelectorAll('.slide'));
    const dots = Array.from(slideshow.querySelectorAll('.dot'));
    const prevButton = slideshow.querySelector('.slideshow-arrow-prev');
    const nextButton = slideshow.querySelector('.slideshow-arrow-next');

    if (!slides.length) return;

    let currentIndex = slides.findIndex((slide) => slide.classList.contains('active'));

    if (currentIndex < 0) {
      currentIndex = 0;
    }

    let autoAdvance;

    function showSlide(index) {
      currentIndex = (index + slides.length) % slides.length;

      slides.forEach((slide, slideIndex) => {
        slide.classList.toggle('active', slideIndex === currentIndex);
      });

      dots.forEach((dot, dotIndex) => {
        dot.classList.toggle('active', dotIndex === currentIndex);
      });
    }

    function startAutoAdvance() {
      stopAutoAdvance();

      autoAdvance = window.setInterval(() => {
        showSlide(currentIndex + 1);
      }, 6000);
    }

    function stopAutoAdvance() {
      if (autoAdvance) {
        window.clearInterval(autoAdvance);
      }
    }

    if (prevButton) {
      prevButton.addEventListener('click', () => {
        showSlide(currentIndex - 1);
        startAutoAdvance();
      });
    }

    if (nextButton) {
      nextButton.addEventListener('click', () => {
        showSlide(currentIndex + 1);
        startAutoAdvance();
      });
    }

    dots.forEach((dot, dotIndex) => {
      dot.addEventListener('click', () => {
        showSlide(dotIndex);
        startAutoAdvance();
      });
    });

    slideshow.addEventListener('mouseenter', stopAutoAdvance);
    slideshow.addEventListener('mouseleave', startAutoAdvance);

    showSlide(currentIndex);
    startAutoAdvance();
  });
}

document.addEventListener('DOMContentLoaded', async function () {
  await loadIncludes();
  initSlideshows();
});

window.addEventListener('load', () => {
  document.body.classList.add('page-ready');
});