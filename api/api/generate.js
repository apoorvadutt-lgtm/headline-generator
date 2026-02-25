export default async function handler(req, res) {
  // --- Allow Webflow to call this endpoint (CORS) ---
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { article, category, audience, emotion } = req.body || {};

    if (!article) {
      return res.status(400).json({ error: "Missing article text" });
    }

    // Keep article length reasonable to avoid timeouts
    const trimmedArticle = String(article).slice(0, 9000);

    const prompt = `
You are an editorial headline writer optimising for Google Discover.

Category: ${category || "Lifestyle"}
Audience: ${audience || "General Readers"}
Emotion: ${emotion || "Curiosity"}

Write 5 BBC-style editorial headlines.

Rules:
- Truthful to the article
- No clickbait
- No institutional language
- Strong entities early
- 45–85 characters
- All meaningfully different

Return ONLY valid JSON:
{"headlines":["...","...","...","...","..."]}

ARTICLE:
${trimmedArticle}
`.trim();

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

    const text = data?.output?.[0]?.content?.[0]?.text;

    if (!text) {
      return res.status(500).json({ error: "No response from model", raw: data });
    }

    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch (err) {
      return res.status(500).json({
        error: "Model did not return valid JSON",
        raw: text
      });
    }

    return res.status(200).json(parsed);

  } catch (error) {
    return res.status(500).json({
      error: "Server error",
      detail: String(error)
    });
  }
}
