const express = require('express');
const { exec, spawn } = require('child_process');
const cors = require('cors');
const app = express();
const port = process.env.PORT || 3000;

app.use(cors());

app.get('/', (req, res) => {
    res.send('Cupid Player Backend is Online! 🎵');
});

// Endpoint baru untuk menyalurkan audio langsung (Proxy)
app.get('/stream', (req, res) => {
    const { id, title, artist } = req.query;
    const query = id ? `https://www.youtube.com/watch?v=${id}` : `ytsearch1:"${title} ${artist}"`;

    console.log(`[Streaming] ${query}`);
    
    res.setHeader('Content-Type', 'audio/mpeg');
    
    // Fetch audio from YouTube
    const yt = spawn('yt-dlp', [
        '-o', '-',
        '-f', 'bestaudio',
        '--no-playlist',
        '--no-warnings',
        query
    ]);

    // Transcode to MP3 in real-time for better compatibility
    const ffmpeg = spawn('ffmpeg', [
        '-i', 'pipe:0',
        '-f', 'mp3',
        '-acodec', 'libmp3lame',
        '-ab', '128k',
        'pipe:1'
    ]);

    yt.stdout.pipe(ffmpeg.stdin);
    ffmpeg.stdout.pipe(res);

    yt.stderr.on('data', (data) => {
        console.error(`[yt-dlp error] ${data}`);
    });

    ffmpeg.stderr.on('data', (data) => {
        // Logging ffmpeg stderr can be noisy, but useful for debugging
        // console.error(`[ffmpeg error] ${data}`);
    });

    req.on('close', () => {
        yt.kill();
        ffmpeg.kill();
    });
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
