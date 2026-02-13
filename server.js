const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
// Load environment variables from the .env file
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// 1. PostgreSQL Connection Setup using Environment Variables
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_DATABASE, // Ensure this matches the key in your .env
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

// 2. Test Connection
pool.connect((err, client, release) => {
  if (err) {
    return console.error('❌ DATABASE CONNECTION ERROR:', err.stack);
  }
  console.log('✅ DATABASE CONNECTED SUCCESSFULLY');
  release();
});

// 3. The Main Feedback Route
app.post('/api/feedback', async (req, res) => {
  console.log("📥 Received new feedback request:", req.body);
  
  const { name, phone, email, rating, feedback_areas, comments } = req.body;

  try {
    const queryText = `
      INSERT INTO airport_feedback (name, phone, email, rating, feedback_areas, comments) 
      VALUES ($1, $2, $3, $4, $5, $6) 
      RETURNING *`;
    
    const values = [name, phone, email, rating, feedback_areas, comments];
    
    const result = await pool.query(queryText, values);
    
    console.log("🚀 Data saved successfully ID:", result.rows[0].id);
    
    res.status(201).json({
      message: "Feedback submitted successfully",
      data: result.rows[0]
    });

  } catch (err) {
    console.error("❌ SQL Error:", err.message);
    res.status(500).json({ error: "Failed to save feedback to database" });
  }
});

// 4. Start Server
// Use the PORT from .env, or default to 5000 if not specified
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`📡 Backend Server active on http://localhost:${PORT}`);
});