import fs from 'fs';
import path from 'path';

export default function handler(req, res) {
  // CORS Headers for API access
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Path to your data.json file
  const filePath = path.join(process.cwd(), 'data.json');

  // Helper function to read the JSON file safely
  const readData = () => {
    try {
      const fileData = fs.readFileSync(filePath, 'utf8');
      return JSON.parse(fileData);
    } catch (error) {
      return [];
    }
  };

  // --- GET: Fetch all movies ---
  if (req.method === 'GET') {
    const movies = readData();
    return res.status(200).json(movies);
  }

  // --- POST: Add a new movie ---
  if (req.method === 'POST') {
    const { title, poster, watchLink, genre, badge, secretKey } = req.body;

    // Security Check
    if (secretKey !== "YOUR_SECRET_PASSWORD") {
      return res.status(401).json({ error: "Unauthorized. Wrong secret key." });
    }

    const movies = readData();
    const newMovie = {
      id: Date.now().toString(),
      title,
      poster,
      watchLink,
      genre,
      badge
    };

    movies.unshift(newMovie); // Add to the top of the list
    fs.writeFileSync(filePath, JSON.stringify(movies, null, 2)); // Save to data.json

    return res.status(201).json({ success: true, movie: newMovie });
  }

  // --- DELETE: Remove a movie ---
  if (req.method === 'DELETE') {
    const { id, secretKey } = req.body;

    if (secretKey !== "YOUR_SECRET_PASSWORD") {
      return res.status(401).json({ error: "Unauthorized. Wrong secret key." });
    }

    let movies = readData();
    movies = movies.filter(m => m.id !== id);
    
    fs.writeFileSync(filePath, JSON.stringify(movies, null, 2));

    return res.status(200).json({ success: true, message: "Movie deleted" });
  }

  return res.status(405).json({ error: "Method not allowed" });
      }
      
