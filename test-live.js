const axios = require('axios');
async function test() {
    const videoId = 'FE3OXegokIk';
    const resp = await axios.get('https://www.youtube.com/watch?v=' + videoId, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
    });
    const html = resp.data;
    const isLive = html.includes('"isLive":true') || html.includes('"isLiveContent":true');
    const isUpcoming = html.includes('"isUpcoming":true') || html.includes('"liveBroadcastDetails"');
    console.log('Live:', isLive);
    console.log('Upcoming:', isUpcoming);
}
test().catch(console.error);
