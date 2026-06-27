const axios = require('axios');
async function test() {
    const key = 'AIzaSyC4x2lHPZ6OHpkQ-4AAsaSAsu9yt38gEe0';
    const videoId = 'FE3OXegokIk';
    const url = `https://www.googleapis.com/youtube/v3/videos?part=snippet,liveStreamingDetails&id=${videoId}&key=${key}`;
    const resp = await axios.get(url);
    console.log(JSON.stringify(resp.data, null, 2));
}
test().catch(e => console.error(e.response ? e.response.data : e.message));
