const axios = require('axios');
async function test() {
    const videoId = 'FE3OXegokIk';
    const resp = await axios.get('https://www.youtube.com/watch?v=' + videoId, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
    });
    const html = resp.data;
    console.log('isLive:', html.includes('"isLive":true'));
    console.log('isLiveContent:', html.includes('"isLiveContent":true'));
    console.log('isUpcoming literal:', html.includes('"isUpcoming":true'));
    console.log('liveBroadcastDetails:', html.includes('"liveBroadcastDetails"'));
}
test().catch(console.error);
