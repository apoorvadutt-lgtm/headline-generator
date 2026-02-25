export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { article, category, audience, emotion } = req.body;

  const prompt = `
You are an editorial headline writer optimising for Google Discover.

Category: ${category}
Audience: ${audience}
Emotion: ${emotion}

Write 5 strong, editorial, BBC-style headlines based on this article.

Rules:
- Truthful
- No clickbait
- No institutional language
- Strong entities early
- 45–85 characters
- All meaningfully different

Return JSON:
{"headlines":["...","...","...","...","..."]}

Article:
${article}
`;

  try {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-4.1-mini",
        input: prompt
      })
    });

    const data = await response.json();

    res.status(200).json(data.output[0].content[0].text);

  } catch (error) {
    res.status(500).json({ error: "OpenAI request failed" });
  }
}
