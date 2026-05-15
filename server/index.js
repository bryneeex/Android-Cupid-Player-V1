const express = require('express');
const cors = require('cors');
const app = express();
const port = process.env.PORT || 7860;

const INVIDIOUS_INSTANCES = [
    'https://inv.tux.pizza',
    'https://invidious.flokinet.to',
    'https://yewtu.be',
    'https://inv.vern.cc',
    'https://invidious.nerdvpn.de'
];

app.use(cors());

app.get('/', (req, res) => {
    res.send('Cupid Player Backend (Invidious Mode) 🎵');
});

async function tryInvidious(videoId) {
    for (const instance of INVIDIOUS_INSTANCES) {
        try {
            console.log(`[Invidious] Trying ${instance}`);
            const resp = await fetch(`${instance}/api/v1/videos/${videoId}`, { signal: AbortSignal.timeout(5000) });
            if (resp.ok) {
                const data = await resp.json();
                if (data.formatStreams && data.formatStreams.length > 0) {
                    // Ambil stream dengan kualitas audio terbaik atau mpeg4
                    const stream = data.formatStreams.find(s => s.container === 'm4a') || data.formatStreams[0];
                    return stream.url;
                }
            }
        } catch (err) {
            console.error(`[Invidious Error] ${instance} failed: ${err.message}`);
        }
    }
    return null;
}

app.get('/stream', async (req, res) => {
    const { id, title, artist } = req.query;
    let videoId = id;

    try {
        if (!videoId) {
            // Search logic if ID is missing
            const searchInstance = INVIDIOUS_INSTANCES[0];
            const searchResp = await fetch(`${searchInstance}/api/v1/search?q=${encodeURIComponent(title + ' ' + artist)}&type=video`);
            const searchData = await searchResp.json();
            if (searchData && searchData.length > 0) {
                videoId = searchData[0].videoId;
            }
        }

        if (!videoId) return res.status(404).send("Video not found");

        const streamUrl = await tryInvidious(videoId);
        
        if (streamUrl) {
            console.log(`[Success] Streaming ${videoId}`);
            res.redirect(streamUrl);
        } else {
            res.status(404).send("All Invidious instances failed to provide a stream");
        }
    } catch (err) {
        console.error('[Global Error]', err.message);
        res.status(500).send("Backend Error");
    }
});

app.listen(port, () => {
    console.log(`Cupid Server running on port ${port} (Invidious Mode)`);
});
