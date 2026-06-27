const axios = require('axios');
async function test() {
    const url = 'https://www.youtube.com/@spadegamers';
    const resp = await axios.get(url, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
    });
    const html = resp.data;
    const idMatch = html.match(/"externalId"\s*:\s*"(UC[\w-]{22})"/);
    const nameMatch = html.match(/"channelMetadataRenderer".*?"title"\s*:\s*"([^"]+)"/s);
    console.log('ID:', idMatch ? idMatch[1] : null);
    console.log('Name:', nameMatch ? nameMatch[1] : null);
}
test().catch(console.error);
