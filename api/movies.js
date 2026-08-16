import fs from 'fs';
import path from 'path';

export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const filePath = path.join(process.cwd(), 'data.json');

  const readData = () => {
    try {
      if (!fs.existsSync(filePath)) {
        return { config: { telegramLink: '' }, movies: [] };
      }
      const fileData = fs.readFileSync(filePath, 'utf8');
      const parsed = JSON.parse(fileData);
      if (Array.isArray(parsed)) {
        return { config: { telegramLink: '' }, movies: parsed };
      }
      return parsed;
    } catch (error) {
      return { config: { telegramLink: '' }, movies: [] };
    }
  };

  const writeData = (data) => {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  };

  if (req.method === 'GET') {
    const data = readData();
    return res.status(200).json(data);
  }

  if (req.method === 'POST') {
    const { secretKey, action, payload } = req.body || {};

    if (secretKey !== "SUPER_SECRET_BOT_KEY") {
      return res.status(401).json({ error: "Unauthorized. Wrong secret key." });
    }

    const data = readData();
    if (!data.movies) data.movies = [];
    if (!data.config) data.config = { telegramLink: '' };

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
        const index = data.movies.findIndex(m => m.id === String(payload.id));
        if (index === -1) {
          return res.status(404).json({ error: "Movie not found." });
        }
        data.movies[index] = {
          id: String(payload.id),
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
        data.movies = data.movies.filter(m => m.id !== String(payload.id));
        writeData(data);
        return res.status(200).json({ success: true, data });
      }

      default:
        return res.status(400).json({ error: "Invalid action." });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}
