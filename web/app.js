// app.js - VulnShop (intentionally vulnerable)
const express = require('express');
const mysql = require('mysql');
const fs = require('fs');
const fileUpload = require('express-fileupload');
const path = require('path');
const hbs = require('express-handlebars');
const axios = require('axios');
const jwt = require('jsonwebtoken');
const serialize = require('node-serialize');
const crypto = require('crypto');
const { exec } = require('child_process');
const logPath = "/var/log/web/access.log";
// make sure logs exist
const logDir = '/var/log/web';
const logFile = '/var/log/web/access.log';
if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true });
if (!fs.existsSync(logFile)) fs.writeFileSync(logFile, ''); 

const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(fileUpload());

// --- USER AGENT LOGGING MIDDLEWARE (working version) ---
// GLOBAL LOGGER: logs ALL requests including 404 + User-Agent
app.use((req, res, next) => {
  const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
  const ua = req.headers['user-agent'] || "Unknown-UA";

  const entry = `${new Date().toISOString()} ${req.method} ${req.url} `
              + `from ${ip} UA:"${ua}"\n`;

  try {
    fs.appendFileSync('/var/log/web/access.log', entry);
  } catch (e) {
    console.error('log write failed', e.message);
  }

  next();
});


// Handlebars setup
app.engine('handlebars', hbs.engine());
app.set('view engine', 'handlebars');
app.set('views', './views');



// in-memory storage for stored XSS/messages
let messages = [];

// DB connection (optional - if DB not ready routes still work)
const db_config = {
  host: process.env.MYSQL_HOST || 'db',
  user: process.env.MYSQL_USER || 'root',
  password: process.env.MYSQL_PASSWORD || 'example',
  database: process.env.MYSQL_DB || 'appdb',
  multipleStatements: true
};

let db;

function handleDisconnect() {
  db = mysql.createConnection(db_config);

  db.connect(err => {
    if (err) {
      console.error("MySQL connection failed, retrying...", err.code);
      setTimeout(handleDisconnect, 2000);
      return;
    }
    console.log("MySQL connected.");
  });

  db.on("error", err => {
    console.error("MySQL ERROR:", err.code);

    if (
      err.code === "PROTOCOL_CONNECTION_LOST" ||
      err.code === "PROTOCOL_ENQUEUE_AFTER_FATAL_ERROR" ||
      err.code === "ECONNRESET" ||
      err.code === "PROTOCOL_ENQUEUE_AFTER_QUIT"
    ) {
      console.log("Reconnecting MySQL...");
      return handleDisconnect();
    }

    throw err;
  });
}

handleDisconnect();

// Simple sample fallback data if DB not available
const fallbackProducts = [
  { id: 1, name: 'apple', price: 10 },
  { id: 2, name: 'banana', price: 5 },
  { id: 3, name: 'secret_flag', price: 9999 }
];
const fallbackUsers = [
  { id: 1, username: 'admin', password: 'adminpass' },
  { id: 2, username: 'alice', password: 'alicepass' }
];



// GLOBAL LOGGER: logs ALL requests including 404
app.use((req, res, next) => {
  const realIp = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
  const entry = `${new Date().toISOString()} ${req.method} ${req.url} from ${realIp}\n`;
  try { fs.appendFileSync(logFile, entry); } catch (e) { console.error('log write failed', e.message); }
  next();
});

// Serve static files (assets)
app.use('/static', express.static(path.join(__dirname, 'static')));

app.get("/admin", (req, res) => {
  res.send("<h1>Admin page missing</h1>");
});


// Minimal layout routes (UI)
app.get('/', (req, res) => res.render('home'));



app.get('/login', (req, res) => res.render('login'));
app.post('/login', (req, res) => {
  const { username = '', password = '' } = req.body;
  // vulnerable SQL (no sanitization)
  const sql = `SELECT * FROM users WHERE username='${username}' AND password='${password}'`;
  db.query(sql, (err, rows) => {
    if (!err && rows && rows.length > 0) {
      res.send(`<h3>Welcome ${username}</h3><p><a href="/admin">Admin</a></p>`);
    } else {
      // fallback check if DB down
      const u = fallbackUsers.find(x => x.username === username && x.password === password);
      if (u) return res.send(`<h3>Welcome ${username}</h3><p><a href="/admin">Admin</a></p>`);
      res.send('<h3>Invalid login</h3>');
    }
  });
});

// BRUTE-FORCE friendly login (no rate-limit)
app.post('/bf-login', (req, res) => {
  const { username, password } = req.body;
  if (username === 'admin' && password === 'admin') return res.send('Logged in!');
  return res.send('Invalid');
});

// Products listing (SQLi)
app.get("/product", (req, res) => {
    const id = req.query.id || 1;

    //  Super vulnerable
    const query = `SELECT * FROM products WHERE id = ${id}`;

    db.query(query, (err, results) => {
        if (err) {
            return res.send("Error: " + err);
        }
        res.json(results);
    });
});


// Search (SQLi + potential XSS)
app.get("/search", (req, res) => {
    const q = req.query.q || "";

    // VULNERABLE BY DESIGN (string concatenation)
    const query = `SELECT id, name, price FROM products WHERE name LIKE '%${q}%'`;

    db.query(query, (err, results) => {
        if (err) {
            return res.send("Database error: " + err);
        }
        res.send(results);
    });
});


// UPLOAD (unrestricted file upload)
app.get('/upload', (req, res) => res.render('upload'));
app.post('/upload', (req, res) => {
  if (!req.files || !req.files.file) return res.send('No file uploaded');
  const file = req.files.file;
  const uploadPath = path.join('/tmp', file.name);
  file.mv(uploadPath, err => {
    if (err) return res.send('Upload error');
    // leave executable possibility for RCE demo
    fs.chmodSync(uploadPath, 0o755);
    res.send(`File uploaded to ${uploadPath} - try executing it as root (lab).`);
  });
});

// PROFILE (IDOR)
app.get('/profile', (req, res) => {
  const id = req.query.id || 1;
  db.query(`SELECT * FROM users WHERE id=${id}`, (err, rows) => {
    const user = (!err && rows && rows[0]) ? rows[0] : fallbackUsers.find(u => u.id == id);
    res.render('profile', { user: JSON.stringify(user) });
  });
});

// ADMIN panel - intentionally no auth
app.get('/admin', (req, res) => res.render('admin'));

// PATH TRAVERSAL -> /read?file=/etc/passwd (dangerous)
app.get('/read', (req, res) => {
  const file = req.query.file;
  try {
    const content = fs.readFileSync(file, 'utf8');
    res.send(`<pre>${content}</pre>`);
  } catch (e) {
    res.send('Unable to read file');
  }
});

// COMMAND INJECTION -> /ping?host=example.com
app.get('/ping', (req, res) => {
  const host = req.query.host || '127.0.0.1';
  exec(`ping -c 1 ${host}`, (err, stdout) => {
    if (err) return res.send('Ping failed');
    res.send(`<pre>${stdout}</pre>`);
  });
});

// SSRF -> /fetch?url=http://localhost:9200
app.get('/fetch', async (req, res) => {
  const url = req.query.url;
  try {
    const r = await axios.get(url, { timeout: 3000 });
    res.send(`<pre>${typeof r.data === 'string' ? r.data : JSON.stringify(r.data, null, 2)}</pre>`);
  } catch (e) {
    res.send('Fetch failed');
  }
});

// STORED XSS
app.post('/msg', (req, res) => {
  const msg = req.body.msg || '';
  messages.push(msg);
  res.send('Saved!');
});
app.get('/msg', (req, res) => {
  const html = messages.map(m => `<p>${m}</p>`).join('');
  res.send(`<h3>Messages</h3>${html}`);
});

// WEAK JWT endpoints (accepts none algorithm)
app.get('/jwt/login', (req, res) => {
  const token = jwt.sign({ user: 'admin' }, "secretkey", { algorithm: 'HS256' });
  res.send({ token });
});
app.get('/jwt/verify', (req, res) => {
  const token = req.query.token;
  try {
    const decoded = jwt.verify(token, "secretkey", { algorithms: ['HS256', 'none'] });
    res.send(decoded);
  } catch (e) {
    res.send('Invalid token');
  }
});

// COOKIE/HEADER ACCESS BYPASS example
app.get('/super-admin', (req, res) => {
  const isAdmin = req.headers['x-admin'];
  if (isAdmin === '1') return res.send('<h1>Super Admin</h1>');
  res.send('You are not admin');
});

// HARDCODED API KEY disclosure
app.get('/apikey', (req, res) => {
  res.send('API_KEY=12345-SECRET-HARDCODED-KEY');
});

// DIRECTORY LISTING of filesystem (dangerous)
app.use('/files', express.static('/'));

// DEBUG endpoint (leaks env & secrets)
app.get('/debug', (req, res) => {
  res.send({
    env: { NODE_ENV: process.env.NODE_ENV || 'dev' },
    secret_example: process.env.SECRET || 'no-secret-set',
    cwd: process.cwd()
  });
});

// WEAK password reset token (predictable)
app.get('/reset', (req, res) => {
  const user = req.query.user || 'admin';
  const token = crypto.createHash('md5').update(user).digest('hex');
  res.send(`Reset link: /reset/verify?token=${token}`);
});
app.get('/reset/verify', (req, res) => {
  res.send(`Token: ${req.query.token}`);
});

// UNSAFE DESERIALIZATION
app.post('/deserialize', (req, res) => {
  const payload = req.body.payload || '';
  try {
    const obj = serialize.unserialize(payload); // intentionally unsafe
    res.send('OK');
  } catch (e) {
    res.send('Bad payload');
  }
});

// LOCAL FILE WRITE from POST (can be used for persistence/RCE)
app.post('/write', (req, res) => {
  const name = req.body.name || 'out.txt';
  const data = req.body.data || '';
  fs.writeFileSync(`/tmp/${path.basename(name)}`, data);
  res.send('Written');
});

// OPEN REDIRECT
app.get('/go', (req, res) => {
  const to = req.query.url || 'https://example.com';
  res.redirect(to);
});

// SENSITIVE HEADER example
app.get('/headers', (req, res) => {
  res.set('X-Secret-Token', 'THIS-IS-A-SECRET');
  res.send('Headers added');
});

// Simple 404 page (everything not matched)
app.use((req, res) => {
  res.status(404).send('<h3>404 Not Found</h3>');
});

app.use((err, req, res, next) => {
  console.error("ERROR:", err.message);
  res.status(500).send("Internal Server Error");
});

// Start server
const PORT = 3000;
app.listen(PORT, () => console.log(`VulnShop listening on ${PORT}`));
