import { MongoClient } from 'mongodb';

// Your MongoDB connection string
const uri = "mongodb+srv://amitprojects545_db_user:XtPmY6eQTFcpHcaz@cluster0.0k08xds.mongodb.net/?appName=Cluster0";

// Global connection caching for Vercel Serverless optimization
let client;
let clientPromise;

if (!global._mongoClientPromise) {
  client = new MongoClient(uri);
  global._mongoClientPromise = client.connect();
}
clientPromise = global._mongoClientPromise;

export default async function handler(req, res) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const mongoClient = await clientPromise;
    // Creates a database named 'cinehub'
    const db = mongoClient.db('cinehub'); 
    const moviesCollection = db.collection('movies');
    const configCollection = db.collection('config');

    // --- GET: Load Data for Website ---
    if (req.method === 'GET') {
      // Fetch newest movies first
      const movies = await moviesCollection.find({}).sort({ _id: -1 }).toArray();
      
      // Fetch global config (Telegram link)
      let config = await configCollection.findOne({ _id: 'global_config' });
      if (!config) config = { telegramLink: "" }; 

      return res.status(200).json({ config, movies });
    }

    // --- POST: Admin/Bot Commands ---
    if (req.method === 'POST') {
      const { secretKey, action, payload } = req.body;

      if (secretKey !== "SUPER_SECRET_BOT_KEY") {
        return res.status(401).json({ error: "Unauthorized access." });
      }

      // Command 1: Add Movie
      if (action === "addMovie") {
        const newMovie = { id: Date.now().toString(), ...payload };
        await moviesCollection.insertOne(newMovie);
        
        // Return updated list to Admin Panel
        const updatedMovies = await moviesCollection.find({}).sort({ _id: -1 }).toArray();
        return res.status(200).json({ success: true, data: { movies: updatedMovies } });
      } 
      
      // Command 2: Delete Movie
      else if (action === "deleteMovie") {
        await moviesCollection.deleteOne({ id: payload.id });
        
        const updatedMovies = await moviesCollection.find({}).sort({ _id: -1 }).toArray();
        return res.status(200).json({ success: true, data: { movies: updatedMovies } });
      } 
      
      // Command 3: Update Global Settings
      else if (action === "updateConfig") {
        await configCollection.updateOne(
          { _id: 'global_config' },
          { $set: payload },
          { upsert: true } // Creates it if it doesn't exist
        );
        return res.status(200).json({ success: true });
      } 
      
      else {
        return res.status(400).json({ error: "Invalid action." });
      }
    }

    return res.status(405).json({ error: "Method not allowed" });

  } catch (error) {
    console.error("Database Error:", error);
    return res.status(500).json({ error: "Failed to connect to database" });
  }
}
