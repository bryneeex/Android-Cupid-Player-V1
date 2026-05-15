const getApiKey = () => {
  return localStorage.getItem('youtube_api_key') || import.meta.env.VITE_YOUTUBE_API_KEY;
};

const BASE_URL = 'https://www.googleapis.com/youtube/v3';

export async function searchYouTube(query) {
  const apiKey = getApiKey();
  if (!apiKey) throw new Error('YouTube API Key is missing');

  const url = `${BASE_URL}/search?part=snippet&q=${encodeURIComponent(query)}&type=video&videoCategoryId=10&maxResults=10&key=${apiKey}`;

  const res = await fetch(url);
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error?.message || 'Failed to search YouTube');
  }

  const data = await res.json();
  return data.items.map(item => ({
    title: item.snippet.title,
    artist: item.snippet.channelTitle,
    art: item.snippet.thumbnails.high?.url || item.snippet.thumbnails.default?.url,
    uri: `https://www.youtube.com/watch?v=${item.id.videoId}`,
    // For yt-dlp to work seamlessly with the current backend:
    id: item.id.videoId
  }));
}

export function setSavedApiKey(key) {
  if (key) {
    localStorage.setItem('youtube_api_key', key);
  } else {
    localStorage.removeItem('youtube_api_key');
  }
}

export function getSavedApiKey() {
  return localStorage.getItem('youtube_api_key') || '';
}
