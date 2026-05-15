const express = require('express');
const { exec } = require('child_process');
const cors = require('cors');
const app = express();
const port = process.env.PORT || 3000;

app.use(cors());

app.get('/', (req, res) => {
    res.send('Cupid Player Backend is Online! 🎵');
});

app.get('/get-stream', (req, res) => {
    const videoId = req.query.id;
    const title = req.query.title;
    const artist = req.query.artist;
    
    if (!videoId && (!title || !artist)) {
        return res.status(400).json({ error: 'Missing search parameters' });
    }

    const query = videoId ? `https://www.youtube.com/watch?v=${videoId}` : `ytsearch1:"${title} ${artist}"`;

    // Optimized command for faster URL extraction
    const cmd = `yt-dlp -g -f "bestaudio" --no-playlist --no-warnings --quiet --no-check-certificate "${query}"`;

    exec(cmd, { timeout: 10000 }, (error, stdout, stderr) => {
        if (error) {
            console.error(`[Server Error] ${error.message}`);
            return res.status(500).json({ error: 'Failed to fetch stream URL' });
        }
        const url = stdout.split('\n')[0].trim();
        if (!url) {
            return res.status(404).json({ error: 'No stream URL found' });
        }
        res.json({ url });
    });
});

app.get('/health', (req, res) => {
    res.send('Cupid Server is healthy');
});

app.listen(port, () => {
    console.log(`Cupid Server running on port ${port}`);
});
