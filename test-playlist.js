const axios = require('axios');
async function test() {
    const key = 'AIzaSyC4x2lHPZ6OHpkQ-4AAsaSAsu9yt38gEe0';
    const channelId = 'UC6PCC1GO0EhmIEVKUbq6Ogg';
    const playlistId = channelId.replace(/^UC/, 'UU');
    const url = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId=${playlistId}&maxResults=5&key=${key}`;
    const resp = await axios.get(url);
    console.log(resp.data.items.map(i => i.snippet.title));
}
test().catch(e => console.error(e.response ? e.response.data : e.message));
