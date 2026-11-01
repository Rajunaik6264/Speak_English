exports.handler = async function (event) {
  if (event.httpMethod !== "POST") return { statusCode: 405, body: "Use POST" };
  try {
    var prompt = String(JSON.parse(event.body || "{}").prompt || "");
    if (!prompt || prompt.length > 12000) return { statusCode: 400, body: JSON.stringify({ error: "bad prompt" }) };
    var key = process.env.GEMINI_API_KEY;
    if (!key) return { statusCode: 500, body: JSON.stringify({ error: "missing key" }) };
    var model = process.env.GEMINI_MODEL || "gemini-2.5-flash";
    var r = await fetch("https://generativelanguage.googleapis.com/v1beta/models/" + model + ":generateContent", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": key },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.7, maxOutputTokens: 1200, responseMimeType: "application/json" }
      })
    });
    var d = await r.json();
    var parts = (d.candidates && d.candidates[0] && d.candidates[0].content && d.candidates[0].content.parts) || [];
    var text = parts.map(function (p) { return p.text || ""; }).join("");
    return { statusCode: 200, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text: text }) };
  } catch (e) {
    return { statusCode: 500, body: JSON.stringify({ error: "failed" }) };
  }
};
