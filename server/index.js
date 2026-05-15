const express = require('express');
const cors = require('cors');
const app = express();
const port = process.env.PORT || 7860;

app.use(cors());

app.get('/', (req, res) => {
    res.send('Cupid Player Backend is Online (Cobalt Engine) 🎵');
});

app.get('/stream', async (req, res) => {
    const { id, title, artist } = req.query;
    let videoId = id;

    try {
        // Jika tidak ada ID, kita tidak bisa lanjut ke Cobalt (Cobalt butuh URL pasti)
        if (!videoId) return res.status(400).send("Video ID is required for Cobalt engine");

        console.log(`[Cobalt] Requesting stream for ${videoId}`);

        const response = await fetch('https://api.cobalt.tools/api/json', {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                url: `https://www.youtube.com/watch?v=${videoId}`,
                downloadMode: 'audio',
                audioFormat: 'mp3',
                audioBitrate: '128'
            })
        });

        const data = await response.json();

        if (data.status === 'redirect' || data.status === 'stream' || data.url) {
            const streamUrl = data.url;
            console.log(`[Success] Redirecting to Cobalt stream`);
            res.redirect(streamUrl);
        } else {
            console.error('[Cobalt Error]', data);
            res.status(404).send("Cobalt could not find the stream");
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
    console.log(`Cupid Server running on port ${port} (Cobalt Engine)`);
});
