const http = require("http");
const fs = require("fs");
const path = require("path");
const { URL } = require("url");

const rootDir = __dirname;
const storageDir = process.env.STORAGE_DIR ? path.resolve(process.env.STORAGE_DIR) : rootDir;
const dataDir = process.env.DATA_DIR ? path.resolve(process.env.DATA_DIR) : path.join(storageDir, "data");
const uploadsDir = process.env.UPLOADS_DIR ? path.resolve(process.env.UPLOADS_DIR) : path.join(storageDir, "uploads");
const notesFile = path.join(dataDir, "notes.json");
const usersFile = path.join(dataDir, "users.json");
const maxUploadBytes = 25 * 1024 * 1024;
const otpExpiryMs = 5 * 60 * 1000;
const port = Number(process.env.PORT || 3000);

fs.mkdirSync(dataDir, { recursive: true });
fs.mkdirSync(uploadsDir, { recursive: true });

function readNotes() {
  try {
    return JSON.parse(fs.readFileSync(notesFile, "utf8")).map(normalizeNote);
  } catch (error) {
    return [];
  }
}

function writeNotes(notes) {
  const tempFile = `${notesFile}.tmp`;
  fs.writeFileSync(tempFile, JSON.stringify(notes.map(normalizeNote), null, 2));
  fs.renameSync(tempFile, notesFile);
}

function readUsers() {
  try {
    return JSON.parse(fs.readFileSync(usersFile, "utf8"));
  } catch (error) {
    return {};
  }
}

function writeUsers(users) {
  const tempFile = `${usersFile}.tmp`;
  fs.writeFileSync(tempFile, JSON.stringify(users, null, 2));
  fs.renameSync(tempFile, usersFile);
}

function normalizeNote(note) {
  return {
    ...note,
    downloads: Number(note.downloads || 0),
    likedBy: Array.isArray(note.likedBy) ? note.likedBy : [],
    comments: Array.isArray(note.comments) ? note.comments : []
  };
}

function cleanText(value, fallback = "") {
  return String(value || fallback).trim().slice(0, 160);
}

function cleanEmail(value) {
  return String(value || "").trim().toLowerCase();
}

function publicUser(user) {
  return {
    name: user.name,
    email: user.email,
    branch: user.branch,
    verified: Boolean(user.verified)
  };
}

function findVerifiedUser(email) {
  const users = readUsers();
  const user = users[cleanEmail(email)];
  return user?.verified ? user : null;
}

function createOtp() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

function sendJson(res, statusCode, payload) {
  const body = JSON.stringify(payload);
  res.writeHead(statusCode, {
    "content-type": "application/json",
    "content-length": Buffer.byteLength(body)
  });
  res.end(body);
}

function sanitize(value) {
  return String(value || "")
    .replace(/[^a-z0-9.-]+/gi, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || "file";
}

function collectBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    req.on("data", chunk => {
      size += chunk.length;
      if (size > maxUploadBytes) {
        reject(new Error("PDF file is too large. Please upload a file under 25 MB."));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", reject);
  });
}

async function parseJsonBody(req) {
  const rawBody = await collectBody(req);
  if (!rawBody.length) return {};
  try {
    return JSON.parse(rawBody.toString("utf8"));
  } catch (error) {
    throw new Error("Invalid JSON request.");
  }
}

async function parseMultipart(req) {
  const contentType = req.headers["content-type"] || "";
  const boundaryMatch = contentType.match(/boundary=(?:"([^"]+)"|([^;]+))/i);
  if (!boundaryMatch) throw new Error("Invalid upload request.");

  const boundary = `--${boundaryMatch[1] || boundaryMatch[2]}`;
  const body = (await collectBody(req)).toString("latin1");
  const fields = {};
  const files = {};

  body.split(boundary).forEach(part => {
    if (!part || part === "--\r\n" || part === "--") return;
    const cleanPart = part.replace(/^\r\n/, "").replace(/\r\n--$/, "").replace(/\r\n$/, "");
    const headerEnd = cleanPart.indexOf("\r\n\r\n");
    if (headerEnd === -1) return;

    const headerText = cleanPart.slice(0, headerEnd);
    const bodyText = cleanPart.slice(headerEnd + 4);
    const nameMatch = headerText.match(/name="([^"]+)"/i);
    if (!nameMatch) return;

    const filenameMatch = headerText.match(/filename="([^"]*)"/i);
    const fieldName = nameMatch[1];
    if (filenameMatch) {
      files[fieldName] = {
        filename: filenameMatch[1],
        contentType: (headerText.match(/content-type:\s*([^\r\n]+)/i) || [])[1] || "",
        buffer: Buffer.from(bodyText, "latin1")
      };
    } else {
      fields[fieldName] = Buffer.from(bodyText, "latin1").toString("utf8").trim();
    }
  });

  return { fields, files };
}

function serveStatic(req, res, pathname) {
  const requestedPath = pathname === "/" ? "/index.html" : pathname;
  if (requestedPath.startsWith("/uploads/")) {
    const uploadPath = path.normalize(path.join(uploadsDir, requestedPath.replace(/^\/uploads\//, "")));
    if (!uploadPath.startsWith(uploadsDir)) {
      sendJson(res, 403, { error: "Forbidden" });
      return;
    }
    serveFile(res, uploadPath);
    return;
  }

  const filePath = path.normalize(path.join(rootDir, requestedPath));
  if (!filePath.startsWith(rootDir)) {
    sendJson(res, 403, { error: "Forbidden" });
    return;
  }

  serveFile(res, filePath);
}

function serveFile(res, filePath) {
  fs.readFile(filePath, (error, content) => {
    if (error) {
      sendJson(res, 404, { error: "Not found" });
      return;
    }
    const ext = path.extname(filePath).toLowerCase();
    const mimeTypes = {
      ".html": "text/html; charset=utf-8",
      ".css": "text/css; charset=utf-8",
      ".js": "application/javascript; charset=utf-8",
      ".pdf": "application/pdf"
    };
    res.writeHead(200, { "content-type": mimeTypes[ext] || "application/octet-stream" });
    res.end(content);
  });
}

async function handleApi(req, res, url) {
  const notes = readNotes();

  if (req.method === "POST" && url.pathname === "/api/auth/request-otp") {
    try {
      const body = await parseJsonBody(req);
      const name = cleanText(body.name);
      const email = cleanEmail(body.email);
      const branch = cleanText(body.branch);
      if (!name || !email || !branch) {
        sendJson(res, 400, { error: "Please enter name, email, and branch." });
        return;
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        sendJson(res, 400, { error: "Please enter a valid email address." });
        return;
      }

      const users = readUsers();
      const otp = createOtp();
      users[email] = {
        ...(users[email] || {}),
        name,
        email,
        branch,
        pendingOtp: otp,
        otpExpiresAt: Date.now() + otpExpiryMs,
        verified: Boolean(users[email]?.verified),
        updatedAt: new Date().toISOString()
      };
      writeUsers(users);
      console.log(`OTP for ${email}: ${otp}`);
      sendJson(res, 200, {
        message: "OTP generated. Check the server console.",
        devOtp: otp,
        expiresInSeconds: Math.floor(otpExpiryMs / 1000)
      });
    } catch (error) {
      sendJson(res, 400, { error: error.message });
    }
    return;
  }

  if (req.method === "POST" && url.pathname === "/api/auth/verify-otp") {
    try {
      const body = await parseJsonBody(req);
      const email = cleanEmail(body.email);
      const otp = cleanText(body.otp);
      const users = readUsers();
      const user = users[email];
      if (!user || !user.pendingOtp) {
        sendJson(res, 400, { error: "Please request an OTP first." });
        return;
      }
      if (Date.now() > Number(user.otpExpiresAt || 0)) {
        sendJson(res, 400, { error: "OTP expired. Please request a new OTP." });
        return;
      }
      if (user.pendingOtp !== otp) {
        sendJson(res, 400, { error: "Invalid OTP. Please try again." });
        return;
      }

      user.verified = true;
      user.pendingOtp = "";
      user.otpExpiresAt = 0;
      user.verifiedAt = new Date().toISOString();
      users[email] = user;
      writeUsers(users);
      sendJson(res, 200, { user: publicUser(user) });
    } catch (error) {
      sendJson(res, 400, { error: error.message });
    }
    return;
  }

  if (req.method === "GET" && url.pathname === "/api/notes") {
    sendJson(res, 200, { notes, storage: "server" });
    return;
  }

  if (req.method === "POST" && url.pathname === "/api/notes/import") {
    try {
      const body = await parseJsonBody(req);
      const incomingNotes = Array.isArray(body.notes) ? body.notes : [];
      const imported = [];

      incomingNotes.forEach(item => {
        const sourceId = cleanText(item.id);
        const alreadyImported = notes.some(note => note.sourceId && note.sourceId === sourceId);
        const dataUrl = String(item.url || "");
        const dataMatch = dataUrl.match(/^data:application\/pdf;base64,([a-z0-9+/=]+)$/i);
        if (!sourceId || alreadyImported || !dataMatch) return;

        const fileBuffer = Buffer.from(dataMatch[1], "base64");
        if (!fileBuffer.length || fileBuffer.length > maxUploadBytes) return;

        const id = `n${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
        const title = cleanText(item.title, "Imported notes");
        const filename = `${id}-${sanitize(title)}.pdf`;
        fs.writeFileSync(path.join(uploadsDir, filename), fileBuffer);

        const note = normalizeNote({
          id,
          sourceId,
          title,
          subject: cleanText(item.subject, "General"),
          semester: cleanText(item.semester, "1"),
          type: cleanText(item.type, "Notes"),
          contributor: cleanText(item.contributor, "Student"),
          uploaderEmail: cleanText(item.uploaderEmail).toLowerCase(),
          downloads: Number(item.downloads || 0),
          likedBy: Array.isArray(item.likedBy) ? item.likedBy : [],
          comments: Array.isArray(item.comments) ? item.comments : [],
          createdAt: item.createdAt || new Date().toISOString(),
          url: `/uploads/${filename}`
        });
        notes.unshift(note);
        imported.push(note);
      });

      if (imported.length) writeNotes(notes);
      sendJson(res, 200, { imported, notes });
    } catch (error) {
      sendJson(res, 400, { error: error.message });
    }
    return;
  }

  if (req.method === "POST" && url.pathname === "/api/notes") {
    try {
      const { fields, files } = await parseMultipart(req);
      const file = files.file;
      const uploader = findVerifiedUser(fields.uploaderEmail);
      if (!uploader) {
        sendJson(res, 403, { error: "Please verify your login with OTP before uploading notes." });
        return;
      }
      if (!fields.title || !fields.subject || !fields.semester || !fields.type) {
        sendJson(res, 400, { error: "Please fill all upload details." });
        return;
      }
      if (!file || !file.filename.toLowerCase().endsWith(".pdf")) {
        sendJson(res, 400, { error: "Please upload a PDF file only." });
        return;
      }

      const id = `n${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
      const filename = `${id}-${sanitize(fields.title)}.pdf`;
      fs.writeFileSync(path.join(uploadsDir, filename), file.buffer);

      const note = {
        id,
        title: fields.title,
        subject: fields.subject,
        semester: fields.semester,
        type: fields.type,
        contributor: uploader.name,
        uploaderEmail: uploader.email,
        downloads: 0,
        likedBy: [],
        comments: [],
        createdAt: new Date().toISOString(),
        url: `/uploads/${filename}`
      };
      notes.unshift(note);
      writeNotes(notes);
      sendJson(res, 201, { note });
    } catch (error) {
      sendJson(res, 400, { error: error.message });
    }
    return;
  }

  const downloadMatch = url.pathname.match(/^\/api\/notes\/([^/]+)\/download$/);
  if (req.method === "POST" && downloadMatch) {
    const note = notes.find(item => item.id === decodeURIComponent(downloadMatch[1]));
    if (!note) {
      sendJson(res, 404, { error: "Note not found." });
      return;
    }
    note.downloads += 1;
    writeNotes(notes);
    sendJson(res, 200, { downloads: note.downloads });
    return;
  }

  const likeMatch = url.pathname.match(/^\/api\/notes\/([^/]+)\/like$/);
  if (req.method === "POST" && likeMatch) {
    try {
      const note = notes.find(item => item.id === decodeURIComponent(likeMatch[1]));
      if (!note) {
        sendJson(res, 404, { error: "Note not found." });
        return;
      }
      const body = await parseJsonBody(req);
      const email = String(body.email || "").trim().toLowerCase();
      if (!email) {
        sendJson(res, 400, { error: "Please login to like material." });
        return;
      }
      note.likedBy = note.likedBy.includes(email)
        ? note.likedBy.filter(item => item !== email)
        : [...note.likedBy, email];
      writeNotes(notes);
      sendJson(res, 200, { note });
    } catch (error) {
      sendJson(res, 400, { error: error.message });
    }
    return;
  }

  const commentMatch = url.pathname.match(/^\/api\/notes\/([^/]+)\/comments$/);
  if (req.method === "POST" && commentMatch) {
    try {
      const note = notes.find(item => item.id === decodeURIComponent(commentMatch[1]));
      if (!note) {
        sendJson(res, 404, { error: "Note not found." });
        return;
      }
      const body = await parseJsonBody(req);
      const text = String(body.text || "").trim();
      const author = String(body.author || "Student").trim().slice(0, 80);
      const email = String(body.email || "").trim().toLowerCase();
      if (!email) {
        sendJson(res, 400, { error: "Please login to comment." });
        return;
      }
      if (!text) {
        sendJson(res, 400, { error: "Please write a comment first." });
        return;
      }
      if (text.length > 400) {
        sendJson(res, 400, { error: "Comment should be under 400 characters." });
        return;
      }
      const comment = {
        id: `c${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
        author,
        email,
        text,
        createdAt: new Date().toISOString()
      };
      note.comments.unshift(comment);
      writeNotes(notes);
      sendJson(res, 201, { note, comment });
    } catch (error) {
      sendJson(res, 400, { error: error.message });
    }
    return;
  }

  const deleteMatch = url.pathname.match(/^\/api\/notes\/([^/]+)$/);
  if (req.method === "DELETE" && deleteMatch) {
    const id = decodeURIComponent(deleteMatch[1]);
    const note = notes.find(item => item.id === id);
    if (!note) {
      sendJson(res, 404, { error: "Note not found." });
      return;
    }
    const email = url.searchParams.get("email") || "";
    if (note.uploaderEmail && note.uploaderEmail !== email) {
      sendJson(res, 403, { error: "Only the original uploader can delete this material." });
      return;
    }
    const nextNotes = notes.filter(item => item.id !== id);
    writeNotes(nextNotes);
    if (note.url?.startsWith("/uploads/")) {
      fs.rm(path.join(uploadsDir, path.basename(note.url)), { force: true }, () => {});
    }
    sendJson(res, 200, { ok: true });
    return;
  }

  sendJson(res, 404, { error: "API route not found." });
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  if (url.pathname.startsWith("/api/")) {
    handleApi(req, res, url);
    return;
  }
  serveStatic(req, res, decodeURIComponent(url.pathname));
});

server.listen(port, () => {
  console.log(`VGU Study Hub running at http://localhost:${port}`);
});
