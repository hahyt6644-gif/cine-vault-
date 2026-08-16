import fs from 'fs';
import path from 'path';

export default function handler(req, res) {
  // CORS Headers for API access
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Path to your data.json file
  const filePath = path.join(process.cwd(), 'data.json');

  // Helper function to read the JSON file safely (expects structure: { config: {}, movies: [] })
  const readData = () => {
    try {
      const fileData = fs.readFileSync(filePath, 'utf8');
      const parsed = JSON.parse(fileData);
      // Handle legacy array format vs new object format
      if (Array.isArray(parsed)) {
        return { config: { telegramLink: '' }, movies: parsed };
      }
      return parsed;
    } catch (error) {
      return { config: { telegramLink: '' }, movies: [] };
    }
  };

  // Helper function to write data back safely
  const writeData = (data) => {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  };

  // --- GET: Fetch all configuration and movies ---
  if (req.method === 'GET') {
    const data = readData();
    return res.status(200).json(data);
  }

  // --- POST: Handle actions (addMovie, editMovie, deleteMovie, updateConfig) ---
  if (req.method === 'POST') {
    const { secretKey, action, payload } = req.body;

    // Security Check (Make sure this matches your frontend key or change to an environment variable)
    if (secretKey !== "SUPER_SECRET_BOT_KEY") {
      return res.status(401).json({ error: "Unauthorized. Wrong secret key." });
    }

    const data = readData();

    switch (action) {
      case 'updateConfig':
        data.config.telegramLink = payload.telegramLink;
        writeData(data);
        return res.status(200).json({ success: true, data });

      case 'addMovie': {
        const newMovie = {
          id: Date.now().toString(),
          title: payload.title,
          poster: payload.poster,
          watchLink: payload.watchLink || '',
          genre: payload.genre || '',
          badge: payload.badge || ''
        };
        data.movies.unshift(newMovie);
        writeData(data);
        return res.status(200).json({ success: true, data });
      }

      case 'editMovie': {
        const index = data.movies.findIndex(m => m.id === payload.id);
        if (index === -1) {
          return res.status(404).json({ error: "Movie not found." });
        }
        data.movies[index] = {
          id: payload.id,
          title: payload.title,
          poster: payload.poster,
          watchLink: payload.watchLink || '',
          genre: payload.genre || '',
          badge: payload.badge || ''
        };
        writeData(data);
        return res.status(200).json({ success: true, data });
      }

      case 'deleteMovie': {
        data.movies = data.movies.filter(m => m.id !== payload.id);
        writeData(data);
        return res.status(200).json({ success: true, data });
      }

      default:
        return res.status(400).json({ error: "Invalid action." });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}
