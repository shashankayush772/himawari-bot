const axios = require('axios');
async function test() {
    const url = 'https://www.youtube.com/channel/UC-lHJZR3Gqxm24_Vd_AJ5Yw/live';
    try {
        const resp = await axios.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
        const html = resp.data;
        const match = html.match(/"videoId":"([^"]+)"/);
        console.log('Video ID:', match ? match[1] : 'None');
        console.log('isLive:', html.includes('"isLive":true') || html.includes('"isLiveContent":true') ? 'True' : 'False');
    } catch(e) {
        console.log(e.message);
    }
}
test();
