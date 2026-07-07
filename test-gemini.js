require('dotenv').config();
const axios = require('axios');

async function test() {
    const apiKey = process.env.GEMINI_API_KEY;
    const history = [
        { role: 'model', parts: [{ text: 'Hello' }] },
        { role: 'user', parts: [{ text: 'Hi' }] }
    ];
    
    try {
        const res = await axios.post(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
            contents: history
        }, {
            headers: { 'Content-Type': 'application/json' },
            validateStatus: () => true
        });
        console.log("Status:", res.status);
        console.log(JSON.stringify(res.data, null, 2));
    } catch (err) {
        console.error(err.message);
    }
}
test();
