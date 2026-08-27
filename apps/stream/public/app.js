const state = {
  posts: [],
  query: "",
  editingId: null,
  searchTimer: null,
};

const escapeMap = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#039;",
};

export function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (character) => escapeMap[character]);
}

export function tagsFromField(value) {
  return [...new Set(String(value).split(",").map((tag) => tag.trim().toLowerCase()).filter(Boolean))];
}

function relativeTime(value) {
  const timestamp = new Date(value).getTime();
  if (!Number.isFinite(timestamp)) return "Unknown time";

  const seconds = Math.round((timestamp - Date.now()) / 1000);
  const formatter = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
  const units = [
    ["year", 31_536_000],
    ["month", 2_592_000],
    ["week", 604_800],
    ["day", 86_400],
    ["hour", 3_600],
    ["minute", 60],
  ];

  for (const [unit, size] of units) {
    if (Math.abs(seconds) >= size) return formatter.format(Math.round(seconds / size), unit);
  }
  return "just now";
}

function icon(name) {
  const icons = {
    pin: '<path d="m12 17 0 5M5 3l14 0M7 3l1 8-3 3h14l-3-3 1-8"/>',
    edit: '<path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4Z"/>',
    idea: '<path d="M9 18h6M10 22h4M8.5 14.5A7 7 0 1 1 15.5 14.5c-.9.7-1.5 1.5-1.5 2.5h-4c0-1-.6-1.8-1.5-2.5Z"/>',
    trash: '<path d="M3 6h18M8 6V4h8v2M19 6l-1 15H6L5 6M10 11v6M14 11v6"/>',
  };
  return `<svg viewBox="0 0 24 24" aria-hidden="true">${icons[name]}</svg>`;
}

export function postMarkup(post) {
  const body = escapeHtml(post.body).replace(/\n/g, "<br>");
  const tags = post.tags
    .map((tag) => `<span class="post-tag">#${escapeHtml(tag)}</span>`)
    .join("");
  const badges = [
    post.pinned ? '<span class="post-badge pinned-badge">Pinned</span>' : "",
    post.status === "idea" ? '<span class="post-badge idea-badge">Idea</span>' : "",
  ].join("");

  return `
    <article class="post-card${post.pinned ? " is-pinned" : ""}" data-post-id="${post.id}">
      <header class="post-header">
        <div class="post-context">
          ${badges}
          <time datetime="${escapeHtml(post.createdAt)}" title="${escapeHtml(
            new Date(post.createdAt).toLocaleString(),
          )}">${relativeTime(post.createdAt)}</time>
        </div>
        <div class="post-actions" aria-label="Post actions">
          <button type="button" data-action="pin" title="${post.pinned ? "Unpin" : "Pin"}">
            ${icon("pin")}<span class="sr-only">${post.pinned ? "Unpin" : "Pin"}</span>
          </button>
          <button type="button" data-action="edit" title="Edit">
            ${icon("edit")}<span class="sr-only">Edit</span>
          </button>
          <button type="button" data-action="toggle-idea" title="Mark as ${
            post.status === "idea" ? "thought" : "idea"
          }">
            ${icon("idea")}<span class="sr-only">Mark as ${
              post.status === "idea" ? "thought" : "idea"
            }</span>
          </button>
          <button class="danger-action" type="button" data-action="delete" title="Delete">
            ${icon("trash")}<span class="sr-only">Delete</span>
          </button>
        </div>
      </header>
      <p class="post-body">${body}</p>
      ${tags ? `<footer class="post-tags">${tags}</footer>` : ""}
    </article>`;
}

function editMarkup(post) {
  return `
    <article class="post-card edit-card" data-post-id="${post.id}">
      <form class="edit-form">
        <label class="sr-only" for="edit-body-${post.id}">Edit thought</label>
        <textarea id="edit-body-${post.id}" name="body" maxlength="10000" rows="5" required>${escapeHtml(
          post.body,
        )}</textarea>
        <div class="edit-fields">
          <label class="tag-field" for="edit-tags-${post.id}">
            <span>#</span>
            <input id="edit-tags-${post.id}" name="tags" value="${escapeHtml(
              post.tags.join(", "),
            )}" placeholder="tags" />
          </label>
          <select name="status" aria-label="Entry type">
            <option value="thought"${post.status === "thought" ? " selected" : ""}>Thought</option>
            <option value="idea"${post.status === "idea" ? " selected" : ""}>Idea</option>
          </select>
        </div>
        <div class="edit-actions">
          <button class="text-button" type="button" data-action="cancel-edit">Cancel</button>
          <button class="primary-button" type="submit">Save changes</button>
        </div>
      </form>
    </article>`;
}

async function api(path, options = {}) {
  const response = await fetch(path, options);
  if (response.status === 204) return null;

  const result = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(result.error || "Request failed");
  return result;
}

function showToast(message, tone = "default") {
  const toast = document.querySelector("#toast");
  toast.textContent = message;
  toast.dataset.tone = tone;
  toast.classList.add("is-visible");
  window.clearTimeout(showToast.timeout);
  showToast.timeout = window.setTimeout(() => toast.classList.remove("is-visible"), 2400);
}

function renderFeed() {
  const feed = document.querySelector("#feed");
  const status = document.querySelector("#feed-status");

  if (state.posts.length === 0) {
    feed.innerHTML = "";
    status.hidden = false;
    status.innerHTML = state.query
      ? `No notes match <strong>“${escapeHtml(state.query)}”</strong>.`
      : "Your first thought will land here.";
    return;
  }

  status.hidden = true;
  feed.innerHTML = state.posts
    .map((post) => (state.editingId === post.id ? editMarkup(post) : postMarkup(post)))
    .join("");

  if (state.editingId !== null) {
    document.querySelector(`#edit-body-${state.editingId}`)?.focus();
  }
}

async function loadPosts() {
  const status = document.querySelector("#feed-status");
  status.hidden = false;
  status.textContent = "Loading your stream…";

  try {
    const parameters = new URLSearchParams();
    if (state.query) parameters.set("q", state.query);
    const result = await api(`/api/posts${parameters.size ? `?${parameters}` : ""}`);
    state.posts = result.posts;
    state.editingId = null;
    renderFeed();
  } catch (error) {
    status.hidden = false;
    status.textContent = error.message;
    showToast(error.message, "error");
  }
}

async function createPost(form) {
  const submitButton = form.querySelector('button[type="submit"]');
  const body = form.elements.body.value;
  const tags = tagsFromField(form.elements.tags.value);
  const status = new FormData(form).get("status");

  submitButton.disabled = true;
  try {
    const post = await api("/api/posts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body, tags, status }),
    });
    form.reset();
    document.querySelector('input[name="status"][value="thought"]').checked = true;
    document.querySelector("#character-count").textContent = "0 / 10,000";
    state.posts = [post, ...state.posts.filter((entry) => entry.id !== post.id)];
    renderFeed();
    showToast("Saved to your stream");
  } catch (error) {
    showToast(error.message, "error");
  } finally {
    submitButton.disabled = false;
  }
}

async function updatePost(id, changes, successMessage) {
  try {
    const post = await api(`/api/posts/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(changes),
    });
    const index = state.posts.findIndex((entry) => entry.id === id);
    if (index !== -1) state.posts[index] = post;
    state.editingId = null;
    state.posts.sort(
      (left, right) => Number(right.pinned) - Number(left.pinned) || right.id - left.id,
    );
    renderFeed();
    showToast(successMessage);
  } catch (error) {
    showToast(error.message, "error");
  }
}

async function handleFeedAction(button, card) {
  const id = Number(card.dataset.postId);
  const post = state.posts.find((entry) => entry.id === id);
  if (!post) return;

  switch (button.dataset.action) {
    case "pin":
      await updatePost(id, { pinned: !post.pinned }, post.pinned ? "Unpinned" : "Pinned");
      break;
    case "toggle-idea":
      await updatePost(
        id,
        { status: post.status === "idea" ? "thought" : "idea" },
        post.status === "idea" ? "Marked as a thought" : "Marked as an idea",
      );
      break;
    case "edit":
      state.editingId = id;
      renderFeed();
      break;
    case "cancel-edit":
      state.editingId = null;
      renderFeed();
      break;
    case "delete":
      if (!window.confirm("Delete this thought? This cannot be undone.")) return;
      try {
        await api(`/api/posts/${id}`, { method: "DELETE" });
        state.posts = state.posts.filter((entry) => entry.id !== id);
        renderFeed();
        showToast("Deleted");
      } catch (error) {
        showToast(error.message, "error");
      }
      break;
  }
}

function init() {
  const composer = document.querySelector("#composer-form");
  const body = document.querySelector("#composer-body");
  const count = document.querySelector("#character-count");
  const search = document.querySelector("#search-input");
  const feed = document.querySelector("#feed");

  composer.addEventListener("submit", (event) => {
    event.preventDefault();
    createPost(composer);
  });

  body.addEventListener("input", () => {
    count.textContent = `${body.value.length.toLocaleString()} / 10,000`;
  });

  body.addEventListener("keydown", (event) => {
    if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
      event.preventDefault();
      composer.requestSubmit();
    }
  });

  search.addEventListener("input", () => {
    window.clearTimeout(state.searchTimer);
    state.searchTimer = window.setTimeout(() => {
      state.query = search.value.trim();
      loadPosts();
    }, 220);
  });

  feed.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-action]");
    const card = button?.closest("[data-post-id]");
    if (button && card) handleFeedAction(button, card);
  });

  feed.addEventListener("submit", (event) => {
    if (!event.target.matches(".edit-form")) return;
    event.preventDefault();
    const form = event.target;
    const card = form.closest("[data-post-id]");
    updatePost(
      Number(card.dataset.postId),
      {
        body: form.elements.body.value,
        tags: tagsFromField(form.elements.tags.value),
        status: form.elements.status.value,
      },
      "Changes saved",
    );
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && state.editingId !== null) {
      state.editingId = null;
      renderFeed();
    }
  });

  loadPosts();
}

if (typeof document !== "undefined") {
  document.addEventListener("DOMContentLoaded", init);
}
