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

document.addEventListener('DOMContentLoaded', loadIncludes);

window.addEventListener('load', () => {
  document.body.classList.add('page-ready');
});