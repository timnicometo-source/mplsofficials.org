const NEWS_BUILDER_STORAGE_KEY = "moa-news-builder-draft";

function sanitizeEditorHtml(html) {
  const wrapper = document.createElement("div");
  wrapper.innerHTML = html;

  const allowedTags = [
    "P",
    "BR",
    "STRONG",
    "B",
    "EM",
    "I",
    "UL",
    "OL",
    "LI",
    "H2",
    "H3",
    "A",
    "FONT"
  ];

  wrapper.querySelectorAll("*").forEach((node) => {
    if (!allowedTags.includes(node.tagName)) {
      const replacement = document.createElement("p");
      replacement.innerHTML = node.innerHTML;
      node.replaceWith(replacement);
      return;
    }

    [...node.attributes].forEach((attr) => {
      const attributeName = attr.name.toLowerCase();

      if (node.tagName === "A" && attributeName === "href") return;
      if (node.tagName === "FONT" && ["face", "size"].includes(attributeName)) return;

      node.removeAttribute(attr.name);
    });
  });

  wrapper.querySelectorAll("a").forEach((link) => {
    const href = link.getAttribute("href") || "";

    if (
      !href.startsWith("http") &&
      !href.startsWith("mailto:") &&
      !href.startsWith("/") &&
      !href.startsWith("#")
    ) {
      link.removeAttribute("href");
    } else {
      link.setAttribute("rel", "noopener");
    }
  });

  return wrapper.innerHTML.trim();
}

function buildArticleBodyHtml(editorHtml) {
  const sanitized = sanitizeEditorHtml(editorHtml);

  if (!sanitized) {
    return "          <p>Add article content here.</p>";
  }

  return sanitized
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => `          ${line}`)
    .join("\n");
}

function slugify(text) {
  const slug = String(text || "")
    .toLowerCase()
    .trim()
    .replace(/['’"]/g, "")
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return slug || "news-item";
}

function formatDisplayDate(dateString) {
  if (!dateString) return "";

  const date = new Date(dateString + "T12:00:00");

  if (Number.isNaN(date.getTime())) {
    return dateString;
  }

  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric"
  });
}

function getTodayString() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function escapeHtml(text) {
  return String(text || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function normalizeImagePath(path) {
  let cleaned = String(path || "").trim();

  if (!cleaned) return "";

  if (cleaned.startsWith("http://") || cleaned.startsWith("https://")) {
    return cleaned;
  }

  cleaned = cleaned.replace(/^\.?\/*/, "");

  if (!cleaned.startsWith("assets/images/news/")) {
    const fileName = cleaned.split("/").pop();
    cleaned = `assets/images/news/${fileName}`;
  }

  return cleaned;
}

function setImagePathFromFileInput(fileInput, textInput) {
  const file = fileInput.files && fileInput.files[0];

  if (!file || !textInput) return;

  textInput.value = `assets/images/news/${file.name}`;
  saveBuilderDraft();
}

function buildArticleUrl(slug) {
  return `news/${slug}.html`;
}

function buildArchiveJsonEntry({
  title,
  slug,
  publishDate,
  publishDateDisplay,
  newsType,
  description,
  image,
  featured
}) {
  return {
    title,
    slug,
    url: buildArticleUrl(slug),
    publishDate,
    publishDateDisplay,
    newsType,
    description,
    image,
    featured
  };
}

function buildArticleHtml(data) {
  const articleBodyHtml = buildArticleBodyHtml(data.articleBody);

  const heroImageBlock = data.image
    ? `
          <figure class="news-article-hero-media">
            <img src="../${data.image}" alt="${escapeHtml(data.title)}" class="news-article-hero-image">
          </figure>`
    : "";

  const inlineImageBlock = data.inlineImage
    ? `
          <figure class="news-article-inline-media">
            <img src="../${data.inlineImage}" alt="${escapeHtml(data.inlineImageAlt || data.title)}" class="news-article-inline-image">
          </figure>`
    : "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>MOA News | ${escapeHtml(data.title)}</title>
  <meta name="description" content="${escapeHtml(data.description)}">
  <link rel="stylesheet" href="../assets/css/style.css">
</head>
<body data-page="news">
  <div id="site-header"></div>

  <main class="inner-page">
    <section class="page-hero page-hero-compact">
      <div class="container">
        <p class="section-label">${escapeHtml(data.eyebrow || "MOA News")}</p>
        <h1>${escapeHtml(data.title)}</h1>
        <p>${escapeHtml(data.subheading || data.description)}</p>
      </div>
    </section>

    <section class="page-section">
      <div class="container">
        <div class="news-article-back">
          <a href="../news/index.html" class="button button-outline">← Back to News Archive</a>
        </div>

        <article class="news-article">
          <div class="news-article-meta">
            <span class="news-article-type">${escapeHtml(data.newsType)}</span>
            <span class="news-article-date">${escapeHtml(data.publishDateDisplay)}</span>
          </div>
${heroImageBlock}

          <div class="news-article-body">
${articleBodyHtml}
${inlineImageBlock}
          </div>

          <div class="news-article-footer">
            <a href="../news/index.html" class="card-link">Back to News Archive →</a>
          </div>
        </article>
      </div>
    </section>
  </main>

  <div id="site-footer"></div>
  <script src="../assets/js/main.js"></script>
</body>
</html>`;
}

function getDraftFromFields() {
  const articleBodyEditor = document.getElementById("articleBodyEditor");

  return {
    title: document.getElementById("title")?.value || "",
    publishDate: document.getElementById("publishDate")?.value || "",
    newsType: document.getElementById("newsType")?.value || "General News",
    description: document.getElementById("description")?.value || "",
    heroImage: document.getElementById("heroImage")?.value || "",
    featured: document.getElementById("featured")?.value || "true",
    eyebrow: document.getElementById("eyebrow")?.value || "",
    subheading: document.getElementById("subheading")?.value || "",
    inlineImage: document.getElementById("inlineImage")?.value || "",
    inlineImageAlt: document.getElementById("inlineImageAlt")?.value || "",
    articleBodyHtml: articleBodyEditor ? articleBodyEditor.innerHTML : ""
  };
}

function saveBuilderDraft() {
  const draft = getDraftFromFields();
  localStorage.setItem(NEWS_BUILDER_STORAGE_KEY, JSON.stringify(draft));
}

function loadBuilderDraft() {
  const saved = localStorage.getItem(NEWS_BUILDER_STORAGE_KEY);

  if (!saved) {
    const publishDate = document.getElementById("publishDate");
    const featured = document.getElementById("featured");
    const eyebrow = document.getElementById("eyebrow");

    if (publishDate) publishDate.value = getTodayString();
    if (featured) featured.value = "true";
    if (eyebrow) eyebrow.value = "MOA News";

    return;
  }

  try {
    const draft = JSON.parse(saved);

    const fields = {
      title: document.getElementById("title"),
      publishDate: document.getElementById("publishDate"),
      newsType: document.getElementById("newsType"),
      description: document.getElementById("description"),
      heroImage: document.getElementById("heroImage"),
      featured: document.getElementById("featured"),
      eyebrow: document.getElementById("eyebrow"),
      subheading: document.getElementById("subheading"),
      inlineImage: document.getElementById("inlineImage"),
      inlineImageAlt: document.getElementById("inlineImageAlt")
    };

    if (fields.title) fields.title.value = draft.title || "";
    if (fields.publishDate) fields.publishDate.value = draft.publishDate || getTodayString();
    if (fields.newsType) fields.newsType.value = draft.newsType || "General News";
    if (fields.description) fields.description.value = draft.description || "";
    if (fields.heroImage) fields.heroImage.value = draft.heroImage || "";
    if (fields.featured) fields.featured.value = draft.featured || "true";
    if (fields.eyebrow) fields.eyebrow.value = draft.eyebrow || "MOA News";
    if (fields.subheading) fields.subheading.value = draft.subheading || "";
    if (fields.inlineImage) fields.inlineImage.value = draft.inlineImage || "";
    if (fields.inlineImageAlt) fields.inlineImageAlt.value = draft.inlineImageAlt || "";

    const articleBodyEditor = document.getElementById("articleBodyEditor");
    const hiddenArticleBody = document.getElementById("articleBody");

    if (articleBodyEditor) {
      articleBodyEditor.innerHTML = draft.articleBodyHtml || "";
    }

    if (hiddenArticleBody) {
      hiddenArticleBody.value = draft.articleBodyHtml || "";
    }
  } catch (error) {
    console.error("Unable to load saved news builder draft:", error);
  }
}

function clearBuilderDraft() {
  localStorage.removeItem(NEWS_BUILDER_STORAGE_KEY);
}

function syncEditorToHiddenField() {
  const editor = document.getElementById("articleBodyEditor");
  const hiddenArticleBody = document.getElementById("articleBody");

  if (editor && hiddenArticleBody) {
    hiddenArticleBody.value = editor.innerHTML;
  }
}

function generateOutputs() {
  const title = document.getElementById("title").value.trim();
  const publishDate = document.getElementById("publishDate").value;
  const newsType = document.getElementById("newsType").value;
  const description = document.getElementById("description").value.trim();
  const featured = document.getElementById("featured").value === "true";
  const eyebrow = document.getElementById("eyebrow").value.trim();
  const subheading = document.getElementById("subheading").value.trim();
  const articleBodyEditor = document.getElementById("articleBodyEditor");
  const articleBody = articleBodyEditor ? articleBodyEditor.innerHTML.trim() : "";

  const heroImageInput = document.getElementById("heroImage").value.trim();
  const inlineImageInput = document.getElementById("inlineImage").value.trim();
  const inlineImageAlt = document.getElementById("inlineImageAlt").value.trim();

  if (!title) {
    window.alert("Please enter an article title.");
    return;
  }

  if (!publishDate) {
    window.alert("Please choose a publish date.");
    return;
  }

  if (!description) {
    window.alert("Please enter a short description / archive excerpt.");
    return;
  }

  const slug = slugify(title);
  const publishDateDisplay = formatDisplayDate(publishDate);
  const image = normalizeImagePath(heroImageInput);
  const inlineImage = inlineImageInput ? normalizeImagePath(inlineImageInput) : "";

  const archiveEntry = buildArchiveJsonEntry({
    title,
    slug,
    publishDate,
    publishDateDisplay,
    newsType,
    description,
    image,
    featured
  });

  const articleData = {
    ...archiveEntry,
    eyebrow,
    subheading,
    articleBody,
    inlineImage,
    inlineImageAlt
  };

  const fileInfoOutput = document.getElementById("fileInfoOutput");
  const jsonOutput = document.getElementById("jsonOutput");
  const htmlOutput = document.getElementById("htmlOutput");

  if (fileInfoOutput) {
    fileInfoOutput.value =
`Create this file:
${slug}.html

Save it here:
/news/${slug}.html

JSON image path:
${image || "No hero image selected"}

Article URL:
${archiveEntry.url}

Optional additional image:
${inlineImage || "None"}`;
  }

  if (jsonOutput) {
    jsonOutput.value = JSON.stringify(archiveEntry, null, 2);
  }

  if (htmlOutput) {
    htmlOutput.value = buildArticleHtml(articleData);
  }

  saveBuilderDraft();
}

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("newsBuilderForm");
  const editor = document.getElementById("articleBodyEditor");
  const hiddenArticleBody = document.getElementById("articleBody");
  const addLinkBtn = document.getElementById("addLinkBtn");
  const startNewArticleBtn = document.getElementById("startNewArticleBtn");

  const browseHeroImageBtn = document.getElementById("browseHeroImageBtn");
  const heroImageFile = document.getElementById("heroImageFile");
  const heroImage = document.getElementById("heroImage");

  const browseInlineImageBtn = document.getElementById("browseInlineImageBtn");
  const inlineImageFile = document.getElementById("inlineImageFile");
  const inlineImage = document.getElementById("inlineImage");

  const fontFamilySelect = document.getElementById("fontFamilySelect");
  const fontSizeSelect = document.getElementById("fontSizeSelect");

  loadBuilderDraft();

  const autosaveFields = [
    "title",
    "publishDate",
    "newsType",
    "description",
    "heroImage",
    "featured",
    "eyebrow",
    "subheading",
    "inlineImage",
    "inlineImageAlt"
  ];

  autosaveFields.forEach((id) => {
    const field = document.getElementById(id);
    if (!field) return;

    field.addEventListener("input", saveBuilderDraft);
    field.addEventListener("change", saveBuilderDraft);
  });

  if (browseHeroImageBtn && heroImageFile) {
    browseHeroImageBtn.addEventListener("click", () => {
      heroImageFile.click();
    });
  }

  if (heroImageFile && heroImage) {
    heroImageFile.addEventListener("change", () => {
      setImagePathFromFileInput(heroImageFile, heroImage);
    });
  }

  if (browseInlineImageBtn && inlineImageFile) {
    browseInlineImageBtn.addEventListener("click", () => {
      inlineImageFile.click();
    });
  }

  if (inlineImageFile && inlineImage) {
    inlineImageFile.addEventListener("change", () => {
      setImagePathFromFileInput(inlineImageFile, inlineImage);
    });
  }

  document.querySelectorAll(".editor-btn[data-command]").forEach((button) => {
    button.addEventListener("click", () => {
      const command = button.getAttribute("data-command");
      const value = button.getAttribute("data-value") || null;

      if (command === "formatBlock" && value) {
        document.execCommand("formatBlock", false, value);
      } else {
        document.execCommand(command, false, value);
      }

      syncEditorToHiddenField();
      saveBuilderDraft();
      editor?.focus();
    });
  });

  if (fontFamilySelect) {
    fontFamilySelect.addEventListener("change", () => {
      if (!fontFamilySelect.value) return;

      document.execCommand("fontName", false, fontFamilySelect.value);
      fontFamilySelect.value = "";
      syncEditorToHiddenField();
      saveBuilderDraft();
      editor?.focus();
    });
  }

  if (fontSizeSelect) {
    fontSizeSelect.addEventListener("change", () => {
      if (!fontSizeSelect.value) return;

      document.execCommand("fontSize", false, fontSizeSelect.value);
      fontSizeSelect.value = "";
      syncEditorToHiddenField();
      saveBuilderDraft();
      editor?.focus();
    });
  }

  if (addLinkBtn) {
    addLinkBtn.addEventListener("click", () => {
      const url = window.prompt("Enter the full URL or internal path:");

      if (!url) return;

      document.execCommand("createLink", false, url);
      syncEditorToHiddenField();
      saveBuilderDraft();
      editor?.focus();
    });
  }

  if (editor && hiddenArticleBody) {
    editor.addEventListener("input", () => {
      hiddenArticleBody.value = editor.innerHTML;
      saveBuilderDraft();
    });

    editor.addEventListener("blur", saveBuilderDraft);
  }

  if (form) {
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      generateOutputs();
    });
  }

  document.querySelectorAll("[data-copy-target]").forEach((button) => {
    button.addEventListener("click", async () => {
      const targetId = button.getAttribute("data-copy-target");
      const target = document.getElementById(targetId);

      if (!target) return;

      try {
        await navigator.clipboard.writeText(target.value);
        const originalText = button.textContent;
        button.textContent = "Copied";

        setTimeout(() => {
          button.textContent = originalText;
        }, 1200);
      } catch (error) {
        console.error("Copy failed:", error);
      }
    });
  });

  if (startNewArticleBtn) {
    startNewArticleBtn.addEventListener("click", () => {
      const confirmed = window.confirm("Start a new article? This will clear the current saved draft.");

      if (!confirmed) return;

      clearBuilderDraft();
      window.location.reload();
    });
  }
});