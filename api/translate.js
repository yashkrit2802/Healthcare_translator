import { GoogleGenerativeAI } from "@google/generative-ai";

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { text, sourceLang, targetLang } = req.body;

  if (!text || !sourceLang || !targetLang) {
    return res.status(400).json({ error: 'Missing required parameters.' });
  }
  
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    console.error('API Key not found in environment variables.');
    return res.status(500).json({ error: 'Server configuration error: API key missing.' });
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-preview-05-20" });

  const systemPrompt = `You are an expert medical translator. Translate the following text from ${sourceLang} to ${targetLang}. Focus on medical accuracy and clarity.`;
  const userQuery = `Translate this text: "${text}"`;

  const requestPayload = {
    contents: [{ parts: [{ text: userQuery }] }],
    tools: [{ "google_search": {} }],
    systemInstruction: {
        parts: [{ text: systemPrompt }]
    }
  };

  try {
    const result = await model.generateContent(requestPayload);
    const translatedText = result.response.candidates?.[0]?.content?.parts?.[0]?.text;

    if (translatedText) {
      res.status(200).json({ translatedText: translatedText });
    } else {
      res.status(500).json({ error: 'Translation response was empty.' });
    }
  } catch (error) {
    console.error('Error calling Gemini API:', error);
    res.status(500).json({ error: 'Failed to translate text.' });
  }
}
