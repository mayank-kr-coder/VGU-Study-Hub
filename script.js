const samplePdf = "data:application/pdf;base64,JVBERi0xLjQKMSAwIG9iago8PCAvVHlwZSAvQ2F0YWxvZyAvUGFnZXMgMiAwIFIgPj4KZW5kb2JqCjIgMCBvYmoKPDwgL1R5cGUgL1BhZ2VzIC9LaWRzIFszIDAgUl0gL0NvdW50IDEgPj4KZW5kb2JqCjMgMCBvYmoKPDwgL1R5cGUgL1BhZ2UgL1BhcmVudCAyIDAgUiAvTWVkaWFCb3ggWzAgMCA2MTIgNzkyXSAvUmVzb3VyY2VzIDw8IC9Gb250IDw8IC9GMSA0IDAgUiA+PiA+PiAvQ29udGVudHMgNSAwIFIgPj4KZW5kb2JqCjQgMCBvYmoKPDwgL1R5cGUgL0ZvbnQgL1N1YnR5cGUgL1R5cGUxIC9CYXNlRm9udCAvSGVsdmV0aWNhID4+CmVuZG9iago1IDAgb2JqCjw8IC9MZW5ndGggMTgzID4+CnN0cmVhbQpCVAovRjEgMjggVGYKNzIgNzAwIFRkCihZb3VyIENvbGxlZ2UgTm90ZXMgSHViKSBUagovRjEgMTYgVGYKMCAtNDggVGQKKFByZXZpZXcgc2FtcGxlOiBzdHVkZW50cyBjYW4gcmVhZCBub3RlcyBpbnNpZGUgdGhlIHdlYnNpdGUuKSBUagowIC0zMiBUZAooVXBsb2FkLCBmaWx0ZXIsIHNlYXJjaCwgYW5kIGRvd25sb2FkIG5vdGVzIGJ5IHNlbWVzdGVyLikuKSBUagpFVAplbmRzdHJlYW0KZW5kb2JqCnhyZWYKMCA2CjAwMDAwMDAwMDAgNjU1MzUgZiAKMDAwMDAwMDAwOSAwMDAwMCBuIAowMDAwMDAwMDU4IDAwMDAwIG4gCjAwMDAwMDAxMTUgMDAwMDAgbiAKMDAwMDAwMDI3NCAwMDAwMCBuIAowMDAwMDAwMzQ0IDAwMDAwIG4gCnRyYWlsZXIKPDwgL1Jvb3QgMSAwIFIgL1NpemUgNiA+PgpzdGFydHhyZWYKNjc3CiUlRU9G";

const demoContributors = new Set(["Ananya Rao", "Rohan Mehta", "Maya Shah", "Arjun Nair", "Ishita Verma"]);

const state = {
  notes: JSON.parse(localStorage.getItem("collegeNotes") || "[]"),
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
  localStorage.setItem("collegeNotes", JSON.stringify(state.notes));
}

function normalizeSavedNotes() {
  state.notes = state.notes
    .filter(note => !demoContributors.has(note.contributor))
    .map(note => ({
      ...note,
      type: note.type === "PDF" ? "Notes" : note.type
    }));
  saveNotes();
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
      return b.downloads - a.downloads;
    });
}

function renderSubjectFilter() {
  const subjects = ["All", ...new Set(state.notes.map(note => note.subject).sort())];
  subjectFilter.innerHTML = subjects.map(subject => `<option value="${subject}">${subject === "All" ? "All subjects" : subject}</option>`).join("");
  subjectFilter.value = state.subject;
}

function renderStats() {
  const top = buildLeaders()[0];
  document.getElementById("weeklyWinner").textContent = top ? `${top.name} is helping students this week.` : "Real contributors will appear here after uploads.";
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
    document.getElementById("leaderboard").innerHTML = `<div class="empty">Leaderboard will start after students upload notes or question papers.</div>`;
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
    notesList.innerHTML = `<div class="empty">Library abhi fresh hai. Pehla useful note ya previous question paper upload karke juniors ki help karo.</div>`;
    return;
  }

  notesList.innerHTML = notes.map(note => {
    const deleteButton = isOwner(note)
      ? `<button class="icon-btn danger-btn" type="button" title="Delete upload" data-action="delete" data-id="${note.id}">Del</button>`
      : "";
    return `
    <article class="card">
      <div>
        <div class="status-row">
          <span class="pill">S${note.semester}</span>
          <span class="pill ${note.type.includes("Question") ? "question" : "verified"}">${note.type}</span>
          <span class="pill verified">Verified</span>
        </div>
        <h3>${note.title}</h3>
        <div class="meta">
          <span>${note.subject}</span>
          <span>Shared by ${note.contributor}</span>
          <span>${note.downloads} downloads</span>
          <span>${new Date(note.createdAt).toLocaleDateString()}</span>
        </div>
      </div>
      <div class="actions">
        <button class="icon-btn" type="button" title="Preview PDF" data-action="preview" data-id="${note.id}">P</button>
        <button class="icon-btn" type="button" title="Download PDF" data-action="download" data-id="${note.id}">D</button>
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

function downloadNote(id) {
  const note = state.notes.find(item => item.id === id);
  if (!note) return;
  note.downloads += 1;
  saveNotes();
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

function deleteNote(id) {
  const note = state.notes.find(item => item.id === id);
  if (!note) return;
  if (!isOwner(note)) {
    showToast("Sirf uploader apna upload delete kar sakta hai.");
    return;
  }
  const confirmed = window.confirm(`Delete "${note.title}" from the library?`);
  if (!confirmed) return;
  state.notes = state.notes.filter(item => item.id !== id);
  saveNotes();
  render();
  selectNote(state.notes[0]?.id);
  showToast("Upload deleted.");
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
});

function readPdfFile(file) {
  return new Promise((resolve, reject) => {
    if (!file) {
      resolve(samplePdf);
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
    showToast("Login karke upload karo. Browse/download ke liye login zaruri nahi hai.");
    return;
  }
  const title = document.getElementById("noteTitle").value.trim();
  const subject = document.getElementById("noteSubject").value.trim();
  const semester = document.getElementById("noteSemester").value;
  const type = document.getElementById("noteType").value;
  const file = document.getElementById("noteFile").files[0];
  if (!title || !subject || !semester) return;

  const url = await readPdfFile(file);
  const note = {
    id: `n${Date.now()}`,
    title,
    subject,
    semester,
    type,
    contributor: state.user?.name || "Student",
    uploaderEmail: state.user?.email || "",
    downloads: 0,
    createdAt: new Date().toISOString(),
    url
  };
  state.notes.unshift(note);
  state.subject = "All";
  saveNotes();
  event.target.reset();
  render();
  selectNote(note.id);
  showToast("Note uploaded to VGU Study Hub.");
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
  showToast("Library open hai. Upload ke liye login karna hoga.");
});

document.getElementById("logoutBtn").addEventListener("click", () => {
  localStorage.removeItem("collegeUser");
  state.user = null;
  showLogin();
});

normalizeSavedNotes();
render();
selectNote(state.notes[0]?.id);
requireLogin();
