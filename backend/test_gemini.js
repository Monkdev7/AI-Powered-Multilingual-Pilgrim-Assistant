const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

async function run() {
    const apiKey = process.env.GEMINI_API_KEY;
    console.log('Using API key length:', apiKey ? apiKey.length : 0);
    console.log('Key prefix:', apiKey ? apiKey.substring(0, 7) : 'none');
    if (!apiKey) {
        console.error('No GEMINI_API_KEY found in .env');
        return;
    }
    const genAI = new GoogleGenerativeAI(apiKey);
    try {
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
        const result = await model.generateContent('Hello');
        console.log('Success! Response:', result.response.text());
    } catch (err) {
        console.error('Error with gemini-1.5-flash:', err);
    }
}

run();
