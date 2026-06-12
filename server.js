// ============================================================
// AI 공감 다이어리 - Express 프록시 서버
// ============================================================
require("dotenv").config();

const express = require("express");
const path = require("path");

const app = express();

app.use(express.json({ limit: "20mb" }));
app.use(express.static(path.join(__dirname)));

app.post("/api/chat", async (req, res) => {
  try {
    const requestBody = {
      model: "deepseek/deepseek-chat",
      ...req.body,
    };

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://ai-diary-app.vercel.app",
        "X-Title": "ai-empathy-diary",
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return res.status(response.status).json({
        error: "OpenRouter API 호출 실패",
        status: response.status,
        detail: errorText,
      });
    }

    const data = await response.json();
    res.json(data);

  } catch (error) {
    res.status(500).json({
      error: "서버 내부 오류가 발생했습니다.",
      message: error.message,
    });
  }
});

// Vercel 서버리스용 exports
module.exports = app;

// 로컬 개발 시에만 listen
if (require.main === module) {
  const PORT = process.env.PORT || 3000;
  if (!process.env.OPENROUTER_API_KEY) {
    console.error("[경고] OPENROUTER_API_KEY가 설정되지 않았습니다.");
    process.exit(1);
  }
  app.listen(PORT, () => {
    console.log(`AI 공감 다이어리 서버 시작: http://localhost:${PORT}`);
  });
}
