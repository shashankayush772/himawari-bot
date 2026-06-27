const axios = require('axios');
async function test() {
    const url = 'https://www.youtube.com/@spadegamers';
    const resp = await axios.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    const match = resp.data.match(/"channelMetadataRenderer":(\{.*?\})/);
    if (match) {
        console.log(match[1].substring(0, 500));
    }
}
test().catch(console.error);
