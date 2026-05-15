const express = require('express');
const cors = require('cors');
const app = express();
const port = process.env.PORT || 7860;

app.use(cors());

app.get('/', (req, res) => {
    res.send('Cupid Player Backend is Online! 🎵');
});

// Endpoint untuk menyalurkan audio via Piped API (Anti-Bot)
app.get('/stream', async (req, res) => {
    const { id, title, artist } = req.query;
    
    // Jika tidak ada ID, kita cari dulu ID-nya via Piped Search
    let videoId = id;
    
    try {
        if (!videoId) {
            const searchResp = await fetch(`https://pipedapi.kavin.rocks/search?q=${encodeURIComponent(title + ' ' + artist)}&filter=videos`);
            const searchData = await searchResp.json();
            if (searchData.items && searchData.items.length > 0) {
                videoId = searchData.items[0].url.split('v=')[1];
            }
        }

        if (!videoId) return res.status(404).send("Video not found");

        // Ambil stream audio dari Piped
        const streamResp = await fetch(`https://pipedapi.kavin.rocks/streams/${videoId}`);
        const streamData = await streamResp.json();
        
        // Cari stream audio murni
        const audioStream = streamData.audioStreams.sort((a, b) => b.bitrate - a.bitrate)[0];
        
        if (audioStream && audioStream.url) {
            console.log(`[Streaming] Redirecting to Piped Stream for ${videoId}`);
            res.redirect(audioStream.url);
        } else {
            res.status(404).send("Audio stream not found");
        }
    } catch (err) {
        console.error('[Error]', err.message);
        res.status(500).send("Server Error");
    }
});

app.get('/health', (req, res) => {
    res.send('Cupid Server is healthy');
});

app.listen(port, () => {
    console.log(`Cupid Server running on port ${port}`);
});
