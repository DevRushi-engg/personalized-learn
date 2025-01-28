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
app.use(express.static(path.join(__dirname, 'public')));

// Routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Groq Client
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

// Resource Fetching Functions
const fetchSerperResults = async (query) => {
  try {
    const response = await fetch('https://google.serper.dev/search', {
      method: 'POST',
      headers: {
        'X-API-KEY': process.env.SERPER_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ q: query, gl: 'us', hl: 'en' }),
    });
    return await response.json();
  } catch (error) {
    console.error('Serper API Error:', error);
    return { organic: [] };
  }
};

const fetchYouTubeVideos = async (query) => {
  try {
    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${query}&key=${process.env.YOUTUBE_API_KEY}&maxResults=3&order=relevance&type=video`
    );
    return await response.json();
  } catch (error) {
    console.error('YouTube API Error:', error);
    return { items: [] };
  }
};

// Learning Path Generation
app.post('/generate-learning-path', async (req, res) => {
  const { goal, interests, skillLevel } = req.body;

  if (!goal || !interests || !skillLevel) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    // Generate initial learning path with placeholders
    const prompt = `Create a learning path about ${goal} for ${skillLevel} learners interested in ${interests}.
                    Include exactly 3-5 phases. For each key concept, add: {{RESOURCE:${interests}}} placeholder.`;

    const chatCompletion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'deepseek-r1-distill-llama-70b',
    });

    let learningPath = chatCompletion.choices[0].message.content;

    // Find all resource placeholders
    const resourceTags = [...new Set(learningPath.match(/{{RESOURCE:(.*?)}}/g))];
    
    // Replace placeholders with real resources
    for (const tag of resourceTags) {
      const query = tag.match(/{{RESOURCE:(.*?)}}/)[1];
      
      // Fetch resources from both APIs
      const [serperResults, youtubeResults] = await Promise.all([
        fetchSerperResults(query),
        fetchYouTubeVideos(query)
      ]);

      // Format resources
      const articles = serperResults.organic
        .slice(0, 3)
        .map(({ title, link }) => `📚 [${title}](${link})`);
      
      const videos = youtubeResults.items
        .slice(0, 2)
        .map(({ id, snippet }) => `🎥 [${snippet.title}](https://youtu.be/${id.videoId})`);

      learningPath = learningPath.replaceAll(
        tag,
        `**Recommended Resources:**\n${[...articles, ...videos].join('\n')}`
      );
    }

    res.json({ learningPath });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Failed to generate learning path' });
  }
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});