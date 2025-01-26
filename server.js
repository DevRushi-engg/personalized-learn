const express = require('express');
const cors = require('cors');
const Groq = require('groq-sdk');
const path = require('path');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// Route to serve the frontend
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Initialize Groq client
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

// API endpoint to generate learning path
app.post('/generate-learning-path', async (req, res) => {
  const { goal, interests, skillLevel } = req.body;

  if (!goal || !interests || !skillLevel) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const prompt = `Create a personalized learning path for someone with the following details:
                    - Goal: ${goal}
                    - Interests: ${interests}
                    - Skill Level: ${skillLevel}
                    Provide a step-by-step plan with resources (e.g., links to articles, videos, or documentation).`;

    const chatCompletion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'llama-3.3-70b-versatile',
    });

    const learningPath = chatCompletion.choices[0].message.content;
    res.json({ learningPath });
  } catch (error) {
    console.error('Error generating learning path:', error);
    res.status(500).json({ error: 'Failed to generate learning path' });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});