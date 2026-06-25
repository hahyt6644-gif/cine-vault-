import fs from 'fs';
import path from 'path';

export default function handler(req, res) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  // VERCEL FIX: Vercel blocks writing to the root folder. We must use /tmp.
  const isVercel = process.env.VERCEL || fs.existsSync('/tmp');
  const originalPath = path.join(process.cwd(), 'data.json');
  const tempPath = '/tmp/data.json';
  const filePath = isVercel ? tempPath : originalPath;

  // Initialize the /tmp file with your original data if it doesn't exist yet
  if (isVercel && !fs.existsSync(tempPath)) {
    try {
      if (fs.existsSync(originalPath)) {
        fs.copyFileSync(originalPath, tempPath);
      } else {
        fs.writeFileSync(tempPath, JSON.stringify({ config: { telegramLink: "" }, movies: [] }));
      }
    } catch (e) {
      console.error("File initialization error", e);
    }
  }

  const readData = () => {
    try {
      return JSON.parse(fs.readFileSync(filePath, 'utf8'));
    } catch (error) {
      return { config: { telegramLink: "" }, movies: [] };
    }
  };

  // --- GET: Load Data ---
  if (req.method === 'GET') {
    return res.status(200).json(readData());
  }

  // --- POST: Admin Commands ---
  if (req.method === 'POST') {
    const { secretKey, action, payload } = req.body;

    if (secretKey !== "SUPER_SECRET_BOT_KEY") {
      return res.status(401).json({ error: "Unauthorized access." });
    }

    let data = readData();

    if (action === "addMovie") {
      const newMovie = { id: Date.now().toString(), ...payload };
      data.movies.unshift(newMovie);
    } else if (action === "deleteMovie") {
      data.movies = data.movies.filter(m => m.id !== payload.id);
    } else if (action === "updateConfig") {
      data.config = { ...data.config, ...payload };
    } else {
      return res.status(400).json({ error: "Invalid action." });
    }

    try {
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
      return res.status(200).json({ success: true, data });
    } catch (err) {
      return res.status(500).json({ error: "Vercel write error. Cannot save file." });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}
