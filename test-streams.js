const axios = require('axios');
async function test() {
    const url = 'https://www.youtube.com/@spadegamers/streams';
    const resp = await axios.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    const match = resp.data.match(/"videoId":"([^"]+)"/g);
    if (match) {
        console.log(match.slice(0, 5));
    }
}
test().catch(console.error);
