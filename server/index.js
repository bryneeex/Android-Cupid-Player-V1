const express = require('express');
const cors = require('cors');
const app = express();
const port = process.env.PORT || 7860;

const PIPED_INSTANCES = [
    'https://pipedapi.kavin.rocks',
    'https://pipedapi.moomoo.me',
    'https://api-piped.mha.fi',
    'https://pipedapi.rivo.gg',
    'https://pipedapi.aeong.one'
];

app.use(cors());

app.get('/', (req, res) => {
    res.send('Cupid Player Backend is Online (Multi-Instance Mode) 🎵');
});

// Fungsi untuk mencoba fetch dari berbagai instance Piped
async function tryFetch(endpoint) {
    for (const instance of PIPED_INSTANCES) {
        try {
            console.log(`[Piped] Trying ${instance}${endpoint}`);
            const resp = await fetch(`${instance}${endpoint}`, { signal: AbortSignal.timeout(5000) });
            if (resp.ok) {
                const data = await resp.json();
                return data;
            }
        } catch (err) {
            console.error(`[Piped Error] ${instance} failed: ${err.message}`);
        }
    }
    return null;
}

app.get('/stream', async (req, res) => {
    const { id, title, artist } = req.query;
    let videoId = id;

    try {
        // 1. Jika tidak ada ID, cari ID-nya dulu
        if (!videoId) {
            const searchData = await tryFetch(`/search?q=${encodeURIComponent(title + ' ' + artist)}&filter=videos`);
            if (searchData && searchData.items && searchData.items.length > 0) {
                videoId = searchData.items[0].url.split('v=')[1];
            }
        }

        if (!videoId) return res.status(404).send("Video not found");

        // 2. Ambil data stream
        const streamData = await tryFetch(`/streams/${videoId}`);
        if (!streamData || !streamData.audioStreams) {
            return res.status(404).send("Stream data not available");
        }

        // 3. Cari audio terbaik
        const audioStream = streamData.audioStreams.sort((a, b) => b.bitrate - a.bitrate)[0];
        
        if (audioStream && audioStream.url) {
            console.log(`[Success] Streaming video ${videoId}`);
            res.redirect(audioStream.url);
        } else {
            res.status(404).send("Audio URL not found");
        }
    } catch (err) {
        console.error('[Global Error]', err.message);
        res.status(500).send("Backend Error");
    }
});

app.get('/health', (req, res) => {
    res.send('Cupid Server is healthy');
});

app.listen(port, () => {
    console.log(`Cupid Server running on port ${port} (Multi-Instance)`);
});
