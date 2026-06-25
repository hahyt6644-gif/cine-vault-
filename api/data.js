import fs from 'fs';
import path from 'path';

export default function handler(req, res) {
  // CORS Headers allowing bot and frontend access
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const filePath = path.join(process.cwd(), 'data.json');

  const readData = () => {
    try {
      return JSON.parse(fs.readFileSync(filePath, 'utf8'));
    } catch (error) {
      return { config: { telegramLink: "" }, movies: [] };
    }
  };

  // --- GET: Load everything for the frontend ---
  if (req.method === 'GET') {
    return res.status(200).json(readData());
  }

  // --- POST: Handle Admin/Bot commands ---
  if (req.method === 'POST') {
    const { secretKey, action, payload } = req.body;

    // Security check
    if (secretKey !== "SUPER_SECRET_BOT_KEY") {
      return res.status(401).json({ error: "Unauthorized access." });
    }

    let data = readData();

    // Command 1: Add Movie
    if (action === "addMovie") {
      const newMovie = { id: Date.now().toString(), ...payload };
      data.movies.unshift(newMovie);
    } 
    // Command 2: Delete Movie
    else if (action === "deleteMovie") {
      data.movies = data.movies.filter(m => m.id !== payload.id);
    } 
    // Command 3: Update Global Settings (Telegram Link)
    else if (action === "updateConfig") {
      data.config = { ...data.config, ...payload };
    } 
    else {
      return res.status(400).json({ error: "Invalid action." });
    }

    // Save back to data.json
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));

    return res.status(200).json({ success: true, data });
  }

  return res.status(405).json({ error: "Method not allowed" });
                                       }
      
