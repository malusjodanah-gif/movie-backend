const express = require("express");
const cors = require("cors");
const { Pool } = require("pg");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

// PostgreSQL connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL, // e.g. from Railway/Render
});

// Create tables if not exist
(async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS collections (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS movies (
      id SERIAL PRIMARY KEY,
      tmdb_id INT NOT NULL,
      title TEXT,
      year TEXT,
      genre TEXT,
      collection_id INT REFERENCES collections(id),
      review TEXT
    );
  `);
})();

// Routes
app.post("/collections", async (req, res) => {
  const { name } = req.body;
  const result = await pool.query("INSERT INTO collections (name) VALUES ($1) RETURNING *", [name]);
  res.json(result.rows[0]);
});

app.get("/collections", async (req, res) => {
  const result = await pool.query("SELECT * FROM collections");
  res.json(result.rows);
});

app.post("/collections/:id/movies", async (req, res) => {
  const { id } = req.params;
  const { tmdb_id, title, year, genre } = req.body;
  const result = await pool.query(
    "INSERT INTO movies (tmdb_id, title, year, genre, collection_id) VALUES ($1,$2,$3,$4,$5) RETURNING *",
    [tmdb_id, title, year, genre, id]
  );
  res.json(result.rows[0]);
});

app.post("/movies/:id/review", async (req, res) => {
  const { id } = req.params;
  const { review } = req.body;
  const result = await pool.query("UPDATE movies SET review=$1 WHERE id=$2 RETURNING *", [review, id]);
  res.json(result.rows[0]);
});

app.get("/recommendations/:collectionId", async (req, res) => {
  // For simplicity, return movies in collection (later: call TMDb for similar)
  const { collectionId } = req.params;
  const result = await pool.query("SELECT * FROM movies WHERE collection_id=$1", [collectionId]);
  res.json(result.rows);
});

app.listen(5000, () => console.log("Backend running on port 5000"));
