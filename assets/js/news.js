const NEWS_DATA_URL = "/assets/data/news.json";

document.addEventListener("DOMContentLoaded", () => {
  initFeaturedNews();
  initNewsArchive();
});

async function fetchNewsItems() {
  try {
    const response = await fetch(NEWS_DATA_URL);

    if (!response.ok) {
      throw new Error(`News data failed to load: ${response.status}`);
    }

    const items = await response.json();

    if (!Array.isArray(items)) {
      throw new Error("News data must be an array.");
    }

    return items
      .filter((item) => item && item.title && item.publishDate)
      .sort((a, b) => new Date(b.publishDate) - new Date(a.publishDate));
  } catch (error) {
    console.error("Unable to load news:", error);
    return [];
  }
}

async function initFeaturedNews() {
  const container = document.querySelector("[data-featured-news]");

  if (!container) return;

  const newsItems = await fetchNewsItems();
  const featuredItems = newsItems
    .filter((item) => item.featured === true)
    .slice(0, 3);

  if (!featuredItems.length) {
    container.innerHTML = `
      <article class="news-empty">
        <h3>No featured news yet</h3>
        <p>Check back soon for MOA updates.</p>
      </article>
    `;
    return;
  }

  container.innerHTML = featuredItems.map(createNewsCard).join("");
}

async function initNewsArchive() {
  const container = document.querySelector("[data-news-archive]");

  if (!container) return;

  const newsItems = await fetchNewsItems();

  if (!newsItems.length) {
    container.innerHTML = `
      <article class="news-empty">
        <h3>No news has been posted yet</h3>
        <p>Once news items are added, they will appear here.</p>
      </article>
    `;
    return;
  }

  container.innerHTML = newsItems.map(createNewsCard).join("");
}

function createNewsCard(item) {
  const title = escapeHtml(item.title);
  const description = escapeHtml(item.description || "");
  const newsType = escapeHtml(item.newsType || "MOA News");
  const date = escapeHtml(item.publishDateDisplay || formatNewsDate(item.publishDate));
  const url = normalizeNewsUrl(item.url || "");
  const image = item.image ? normalizeImagePath(item.image) : "";

  const imageMarkup = image
    ? `<img src="${image}" alt="${title}">`
    : `<div class="news-card-placeholder">${newsType}</div>`;

  return `
    <article class="news-card">
      <a class="news-card-media" href="${url}">
        ${imageMarkup}
      </a>

      <div class="news-card-content">
        <div class="news-card-meta">
          <span>${newsType}</span>
          <time datetime="${escapeHtml(item.publishDate)}">${date}</time>
        </div>

        <h3>${title}</h3>
        <p>${description}</p>

        <a class="card-link" href="${url}">Read more →</a>
      </div>
    </article>
  `;
}

function normalizeImagePath(path) {
  if (!path) return "";

  if (path.startsWith("http://") || path.startsWith("https://") || path.startsWith("/")) {
    return path;
  }

  return `/${path}`;
}

function normalizeNewsUrl(url) {
  if (!url) return "/news/";

  if (url.startsWith("http://") || url.startsWith("https://") || url.startsWith("/")) {
    return url;
  }

  return `/${url}`;
}

function formatNewsDate(dateString) {
  const date = new Date(`${dateString}T12:00:00`);

  if (Number.isNaN(date.getTime())) {
    return dateString;
  }

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric"
  });
}

function escapeHtml(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}