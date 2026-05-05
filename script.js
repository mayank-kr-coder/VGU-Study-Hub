const samplePdf = "data:application/pdf;base64,JVBERi0xLjQKMSAwIG9iago8PCAvVHlwZSAvQ2F0YWxvZyAvUGFnZXMgMiAwIFIgPj4KZW5kb2JqCjIgMCBvYmoKPDwgL1R5cGUgL1BhZ2VzIC9LaWRzIFszIDAgUl0gL0NvdW50IDEgPj4KZW5kb2JqCjMgMCBvYmoKPDwgL1R5cGUgL1BhZ2UgL1BhcmVudCAyIDAgUiAvTWVkaWFCb3ggWzAgMCA2MTIgNzkyXSAvUmVzb3VyY2VzIDw8IC9Gb250IDw8IC9GMSA0IDAgUiA+PiA+PiAvQ29udGVudHMgNSAwIFIgPj4KZW5kb2JqCjQgMCBvYmoKPDwgL1R5cGUgL0ZvbnQgL1N1YnR5cGUgL1R5cGUxIC9CYXNlRm9udCAvSGVsdmV0aWNhID4+CmVuZG9iago1IDAgb2JqCjw8IC9MZW5ndGggMTgzID4+CnN0cmVhbQpCVAovRjEgMjggVGYKNzIgNzAwIFRkCihZb3VyIENvbGxlZ2UgTm90ZXMgSHViKSBUagovRjEgMTYgVGYKMCAtNDggVGQKKFByZXZpZXcgc2FtcGxlOiBzdHVkZW50cyBjYW4gcmVhZCBub3RlcyBpbnNpZGUgdGhlIHdlYnNpdGUuKSBUagowIC0zMiBUZAooVXBsb2FkLCBmaWx0ZXIsIHNlYXJjaCwgYW5kIGRvd25sb2FkIG5vdGVzIGJ5IHNlbWVzdGVyLikuKSBUagpFVAplbmRzdHJlYW0KZW5kb2JqCnhyZWYKMCA2CjAwMDAwMDAwMDAgNjU1MzUgZiAKMDAwMDAwMDAwOSAwMDAwMCBuIAowMDAwMDAwMDU4IDAwMDAwIG4gCjAwMDAwMDAxMTUgMDAwMDAgbiAKMDAwMDAwMDI3NCAwMDAwMCBuIAowMDAwMDAwMzQ0IDAwMDAwIG4gCnRyYWlsZXIKPDwgL1Jvb3QgMSAwIFIgL1NpemUgNiA+PgpzdGFydHhyZWYKNjc3CiUlRU9G";

const oldSampleContributors = new Set(["Ananya Rao", "Rohan Mehta", "Maya Shah", "Arjun Nair", "Ishita Verma"]);
let sharedLibrary = false;

const state = {
  notes: [],
  user: JSON.parse(localStorage.getItem("collegeUser") || "null"),
  semester: "All",
  subject: "All",
  type: "All",
  search: "",
  sort: "popular",
  selectedId: null
};

const notesList = document.getElementById("notesList");
const searchInput = document.getElementById("searchInput");
const sortSelect = document.getElementById("sortSelect");
const typeFilter = document.getElementById("typeFilter");
const subjectFilter = document.getElementById("subjectFilter");
const semesterTabs = document.getElementById("semesterTabs");
const navButtons = document.querySelectorAll(".nav button");
const pdfFrame = document.getElementById("pdfFrame");
const viewerName = document.getElementById("viewerName");
const viewerMeta = document.getElementById("viewerMeta");
const openPdf = document.getElementById("openPdf");
const loginScreen = document.getElementById("loginScreen");
const appShell = document.getElementById("appShell");
const userLabel = document.getElementById("userLabel");
const userAvatar = document.getElementById("userAvatar");

function studentInitials(name) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map(part => part[0].toUpperCase())
    .join("") || "S";
}

function setCurrentUser(user) {
  state.user = user;
  localStorage.setItem("collegeUser", JSON.stringify(user));
  userLabel.textContent = `${user.name} / ${user.branch}`;
  userAvatar.textContent = studentInitials(user.name);
  document.getElementById("logoutBtn").textContent = "Logout";
  loginScreen.classList.add("hidden");
  appShell.classList.remove("hidden");
}

function browseAsGuest() {
  state.user = null;
  userLabel.textContent = "Browsing as student";
  userAvatar.textContent = "S";
  document.getElementById("logoutBtn").textContent = "Login";
  loginScreen.classList.add("hidden");
  appShell.classList.remove("hidden");
}

function showLogin() {
  loginScreen.classList.remove("hidden");
  appShell.classList.add("hidden");
}

function requireLogin() {
  if (state.user) {
    setCurrentUser(state.user);
    return;
  }
  showLogin();
}

function saveNotes() {
  if (!sharedLibrary) {
    localStorage.setItem("collegeNotes", JSON.stringify(state.notes));
  }
}

function normalizeSavedNotes() {
  state.notes = state.notes
    .filter(note => !oldSampleContributors.has(note.contributor))
    .map(normalizeNote);
  saveNotes();
}

function normalizeNote(note) {
  return {
    ...note,
    type: note.type === "PDF" ? "Notes" : note.type,
    downloads: Number(note.downloads || 0),
    likedBy: Array.isArray(note.likedBy) ? note.likedBy : [],
    comments: Array.isArray(note.comments) ? note.comments : []
  };
}

function escapeHtml(value) {
  return String(value || "").replace(/[&<>"']/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "\"": "&quot;",
    "'": "&#039;"
  }[char]));
}

async function apiRequest(path, options = {}) {
  const response = await fetch(path, options);
  const contentType = response.headers.get("content-type") || "";
  const payload = contentType.includes("application/json") ? await response.json() : null;
  if (!response.ok) {
    throw new Error(payload?.error || "Something went wrong. Please try again.");
  }
  return payload;
}

async function loadNotes() {
  try {
    const payload = await apiRequest("/api/notes");
    sharedLibrary = true;
    state.notes = (payload.notes || []).map(normalizeNote);
  } catch (error) {
    sharedLibrary = false;
    state.notes = JSON.parse(localStorage.getItem("collegeNotes") || "[]");
    normalizeSavedNotes();
  }
}

function showToast(message) {
  const toast = document.getElementById("toast");
  toast.textContent = message;
  toast.classList.add("show");
  window.setTimeout(() => toast.classList.remove("show"), 1800);
}

function isOwner(note) {
  if (!state.user) return false;
  if (note.uploaderEmail) return note.uploaderEmail === state.user.email;
  return note.contributor === state.user.name;
}

function isLiked(note) {
  return Boolean(state.user?.email && note.likedBy.includes(state.user.email.toLowerCase()));
}

function filteredNotes() {
  const search = state.search.trim().toLowerCase();
  return state.notes
    .filter(note => state.semester === "All" || note.semester === state.semester)
    .filter(note => state.subject === "All" || note.subject === state.subject)
    .filter(note => state.type === "All" || note.type === state.type)
    .filter(note => {
      const haystack = `${note.title} ${note.subject} ${note.contributor} S${note.semester}`.toLowerCase();
      return !search || haystack.includes(search);
    })
    .sort((a, b) => {
      if (state.sort === "newest") return new Date(b.createdAt) - new Date(a.createdAt);
      if (state.sort === "az") return a.subject.localeCompare(b.subject) || a.title.localeCompare(b.title);
      return (b.downloads + b.likedBy.length) - (a.downloads + a.likedBy.length);
    });
}

function renderSubjectFilter() {
  const subjects = ["All", ...new Set(state.notes.map(note => note.subject).sort())];
  subjectFilter.innerHTML = subjects.map(subject => `<option value="${subject}">${subject === "All" ? "All subjects" : subject}</option>`).join("");
  subjectFilter.value = state.subject;
}

function renderStats() {
  const top = buildLeaders()[0];
  document.getElementById("weeklyWinner").textContent = top ? `${top.name} is helping students this week.` : "Contributor highlights will start after student uploads.";
}

function buildLeaders() {
  const leaders = new Map();
  state.notes.forEach(note => {
    const current = leaders.get(note.contributor) || { name: note.contributor, uploads: 0, downloads: 0 };
    current.uploads += 1;
    current.downloads += note.downloads;
    leaders.set(note.contributor, current);
  });
  return [...leaders.values()].sort((a, b) => b.downloads - a.downloads);
}

function renderLeaderboard() {
  const leaders = buildLeaders().slice(0, 5);
  if (!leaders.length) {
    document.getElementById("leaderboard").innerHTML = `<div class="empty">No contributors yet. The leaderboard will start after students upload useful material.</div>`;
    return;
  }
  document.getElementById("leaderboard").innerHTML = leaders.map((leader, index) => `
    <div class="leader">
      <div class="rank">${index + 1}</div>
      <div>
        <strong>${leader.name}</strong>
        <span>${leader.uploads} uploads</span>
      </div>
      <span class="pill">${leader.downloads}</span>
    </div>
  `).join("");
}

function renderNotes() {
  const notes = filteredNotes();
  if (!notes.length) {
    notesList.innerHTML = `<div class="empty">The library is fresh right now. Upload the first useful note, lab manual, or previous paper to help VGU students.</div>`;
    return;
  }

  notesList.innerHTML = notes.map(note => {
    const deleteButton = isOwner(note)
      ? `<button class="icon-btn danger-btn" type="button" title="Delete upload" data-action="delete" data-id="${note.id}">Del</button>`
      : "";
    const comments = note.comments.slice(0, 3).map(comment => `
      <div class="comment">
        <div>
          <strong>${escapeHtml(comment.author)}</strong>
          <span>${new Date(comment.createdAt).toLocaleDateString()}</span>
        </div>
        <p>${escapeHtml(comment.text)}</p>
      </div>
    `).join("");
    const moreComments = note.comments.length > 3
      ? `<div class="comment-more">${note.comments.length - 3} more comments</div>`
      : "";
    const likedClass = isLiked(note) ? "liked" : "";
    return `
    <article class="card">
      <div>
        <div class="status-row">
          <span class="pill">S${note.semester}</span>
          <span class="pill ${note.type.includes("Question") ? "question" : "student-badge"}">${escapeHtml(note.type)}</span>
          <span class="pill student-badge">Student Upload</span>
        </div>
        <h3>${escapeHtml(note.title)}</h3>
        <div class="meta">
          <span>${escapeHtml(note.subject)}</span>
          <span>Shared by ${escapeHtml(note.contributor)}</span>
          <span>${note.downloads} downloads</span>
          <span>${note.likedBy.length} likes</span>
          <span>${note.comments.length} comments</span>
          <span>${new Date(note.createdAt).toLocaleDateString()}</span>
        </div>
        <div class="engagement">
          <button class="like-btn ${likedClass}" type="button" data-action="like" data-id="${note.id}">
            ${isLiked(note) ? "Liked" : "Like"} (${note.likedBy.length})
          </button>
          <div class="comments">
            ${comments || `<div class="comment-empty">No comments yet.</div>`}
            ${moreComments}
            <form class="comment-form" data-id="${note.id}">
              <input class="control" name="comment" maxlength="400" placeholder="Write a helpful comment">
              <button class="secondary" type="submit">Comment</button>
            </form>
          </div>
        </div>
      </div>
      <div class="actions">
        <button class="icon-btn" type="button" title="Preview PDF" data-action="preview" data-id="${note.id}">Preview</button>
        <button class="icon-btn" type="button" title="Download PDF" data-action="download" data-id="${note.id}">Download</button>
        ${deleteButton}
      </div>
    </article>
  `;
  }).join("");
}

function selectNote(id) {
  const note = state.notes.find(item => item.id === id) || filteredNotes()[0];
  if (!note) {
    state.selectedId = null;
    viewerName.textContent = "No PDF selected";
    viewerMeta.textContent = "Upload a note or question paper to preview it here";
    pdfFrame.removeAttribute("src");
    return;
  }
  state.selectedId = note.id;
  viewerName.textContent = note.title;
  viewerMeta.textContent = `${note.subject} / Semester ${note.semester} / ${note.contributor}`;
  pdfFrame.src = note.url;
}

async function downloadNote(id) {
  const note = state.notes.find(item => item.id === id);
  if (!note) return;
  if (sharedLibrary) {
    try {
      const payload = await apiRequest(`/api/notes/${encodeURIComponent(id)}/download`, { method: "POST" });
      note.downloads = payload.downloads;
    } catch (error) {
      showToast(error.message);
      return;
    }
  } else {
    note.downloads += 1;
    saveNotes();
  }
  render();
  selectNote(note.id);

  const link = document.createElement("a");
  link.href = note.url;
  link.download = `${note.subject}-S${note.semester}-${note.title.replace(/[^a-z0-9]+/gi, "-")}.pdf`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  showToast("Download started and leaderboard updated.");
}

async function deleteNote(id) {
  const note = state.notes.find(item => item.id === id);
  if (!note) return;
  if (!isOwner(note)) {
    showToast("Only the original uploader can delete this material.");
    return;
  }
  const confirmed = window.confirm(`Delete "${note.title}" from the library?`);
  if (!confirmed) return;
  if (sharedLibrary) {
    try {
      await apiRequest(`/api/notes/${encodeURIComponent(id)}?email=${encodeURIComponent(state.user?.email || "")}`, {
        method: "DELETE"
      });
    } catch (error) {
      showToast(error.message);
      return;
    }
  }
  state.notes = state.notes.filter(item => item.id !== id);
  saveNotes();
  render();
  selectNote(state.notes[0]?.id);
  showToast("Upload deleted.");
}

async function toggleLike(id) {
  const note = state.notes.find(item => item.id === id);
  if (!note) return;
  if (!state.user) {
    showLogin();
    showToast("Please login to like material.");
    return;
  }

  if (sharedLibrary) {
    try {
      const payload = await apiRequest(`/api/notes/${encodeURIComponent(id)}/like`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          email: state.user.email,
          name: state.user.name
        })
      });
      Object.assign(note, normalizeNote(payload.note));
    } catch (error) {
      showToast(error.message);
      return;
    }
  } else {
    const email = state.user.email.toLowerCase();
    note.likedBy = note.likedBy.includes(email)
      ? note.likedBy.filter(item => item !== email)
      : [...note.likedBy, email];
    saveNotes();
  }

  render();
  selectNote(note.id);
}

async function addComment(id, text) {
  const note = state.notes.find(item => item.id === id);
  if (!note) return;
  if (!state.user) {
    showLogin();
    showToast("Please login to comment.");
    return;
  }
  const commentText = text.trim();
  if (!commentText) {
    showToast("Please write a comment first.");
    return;
  }

  if (sharedLibrary) {
    try {
      const payload = await apiRequest(`/api/notes/${encodeURIComponent(id)}/comments`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          author: state.user.name,
          email: state.user.email,
          text: commentText
        })
      });
      Object.assign(note, normalizeNote(payload.note));
    } catch (error) {
      showToast(error.message);
      return;
    }
  } else {
    note.comments.unshift({
      id: `c${Date.now()}`,
      author: state.user.name,
      email: state.user.email.toLowerCase(),
      text: commentText,
      createdAt: new Date().toISOString()
    });
    saveNotes();
  }

  render();
  selectNote(note.id);
  showToast("Comment added.");
}

function render() {
  renderSubjectFilter();
  renderStats();
  renderLeaderboard();
  renderNotes();
}

semesterTabs.addEventListener("click", event => {
  const button = event.target.closest("button[data-semester]");
  if (!button) return;
  state.semester = button.dataset.semester;
  semesterTabs.querySelectorAll("button").forEach(item => item.classList.toggle("active", item === button));
  renderNotes();
});

searchInput.addEventListener("input", event => {
  state.search = event.target.value;
  renderNotes();
});

sortSelect.addEventListener("change", event => {
  state.sort = event.target.value;
  renderNotes();
});

typeFilter.addEventListener("change", event => {
  state.type = event.target.value;
  navButtons.forEach(item => item.classList.toggle("active", item.dataset.nav === state.type || (state.type === "All" && item.dataset.nav === "All")));
  renderNotes();
});

navButtons.forEach(button => {
  button.addEventListener("click", () => {
    navButtons.forEach(item => item.classList.toggle("active", item === button));
    if (button.dataset.nav === "Rewards") {
      document.getElementById("leaderboard").scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    state.type = button.dataset.nav;
    typeFilter.value = state.type;
    renderNotes();
  });
});

subjectFilter.addEventListener("change", event => {
  state.subject = event.target.value;
  renderNotes();
});

notesList.addEventListener("click", event => {
  const button = event.target.closest("button[data-action]");
  if (!button) return;
  if (button.dataset.action === "preview") selectNote(button.dataset.id);
  if (button.dataset.action === "download") downloadNote(button.dataset.id);
  if (button.dataset.action === "delete") deleteNote(button.dataset.id);
  if (button.dataset.action === "like") toggleLike(button.dataset.id);
});

notesList.addEventListener("submit", event => {
  const form = event.target.closest(".comment-form");
  if (!form) return;
  event.preventDefault();
  const input = form.elements.comment;
  addComment(form.dataset.id, input.value);
});

function readPdfFile(file) {
  return new Promise((resolve, reject) => {
    if (!file) {
      reject(new Error("Please select a PDF file before uploading."));
      return;
    }
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

document.getElementById("uploadForm").addEventListener("submit", async event => {
  event.preventDefault();
  if (!state.user) {
    showLogin();
    showToast("Please login to upload. Browsing and downloads are open.");
    return;
  }
  const title = document.getElementById("noteTitle").value.trim();
  const subject = document.getElementById("noteSubject").value.trim();
  const semester = document.getElementById("noteSemester").value;
  const type = document.getElementById("noteType").value;
  const file = document.getElementById("noteFile").files[0];
  if (!title || !subject || !semester) return;

  let note;
  if (sharedLibrary) {
    const formData = new FormData();
    formData.append("title", title);
    formData.append("subject", subject);
    formData.append("semester", semester);
    formData.append("type", type);
    formData.append("contributor", state.user?.name || "Student");
    formData.append("uploaderEmail", state.user?.email || "");
    formData.append("file", file);
    try {
      const payload = await apiRequest("/api/notes", {
        method: "POST",
        body: formData
      });
      note = payload.note;
    } catch (error) {
      showToast(error.message);
      return;
    }
  } else {
    let url;
    try {
      url = await readPdfFile(file);
    } catch (error) {
      showToast(error.message);
      return;
    }
    note = {
      id: `n${Date.now()}`,
      title,
      subject,
      semester,
      type,
      contributor: state.user?.name || "Student",
      uploaderEmail: state.user?.email || "",
      downloads: 0,
      likedBy: [],
      comments: [],
      createdAt: new Date().toISOString(),
      url
    };
  }
  state.notes.unshift(normalizeNote(note));
  state.subject = "All";
  saveNotes();
  event.target.reset();
  render();
  selectNote(note.id);
  showToast("Material uploaded to VGU Study Hub.");
});

openPdf.addEventListener("click", () => {
  const note = state.notes.find(item => item.id === state.selectedId);
  if (note) window.open(note.url, "_blank");
});

document.getElementById("loginForm").addEventListener("submit", event => {
  event.preventDefault();
  const name = document.getElementById("studentName").value.trim();
  const email = document.getElementById("studentEmail").value.trim();
  const branch = document.getElementById("studentBranch").value;
  if (!name || !email || !branch) return;
  setCurrentUser({ name, email, branch });
  showToast("Logged in successfully.");
});

document.getElementById("browseGuest").addEventListener("click", () => {
  browseAsGuest();
  showToast("Library opened. Login is needed only for uploading.");
});

document.getElementById("logoutBtn").addEventListener("click", () => {
  localStorage.removeItem("collegeUser");
  state.user = null;
  showLogin();
});

async function init() {
  await loadNotes();
  render();
  selectNote(state.notes[0]?.id);
  requireLogin();
}

init();
