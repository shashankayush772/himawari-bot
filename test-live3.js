const axios = require('axios');
async function test() {
    const videoId = 'FE3OXegokIk';
    const resp = await axios.get('https://www.youtube.com/watch?v=' + videoId, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
    });
    const html = resp.data;
    console.log('isLiveNow property:', html.includes('"isLiveNow":true'));
    console.log('isLive:', html.includes('"isLive":true'));
    console.log('isLiveContent:', html.includes('"isLiveContent":true'));
    const viewMatch = html.match(/"viewCount"\s*:\s*"(\d+)"/);
    console.log('viewCount exists:', viewMatch ? viewMatch[1] : null);
    const concurrentMatch = html.match(/"concurrentViewers"\s*:\s*\{"runs"\s*:\s*\[\{"text"\s*:\s*"([\d,]+)"\}/);
    console.log('concurrentViewers exists:', concurrentMatch ? concurrentMatch[1] : null);
}
test().catch(console.error);
