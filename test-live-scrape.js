const axios = require('axios');
async function test() {
    const url = 'https://www.youtube.com/channel/UC6PCC1GO0EhmIEVKUbq6Ogg/live';
    try {
        const resp = await axios.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
        const html = resp.data;
        const match = html.match(/"videoId":"([^"]+)"/);
        console.log('Video ID:', match ? match[1] : 'None');
    } catch(e) {
        console.log(e.message);
    }
}
test();
