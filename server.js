// ============================================================
// AI 공감 다이어리 - Express 프록시 서버
// ============================================================
// 역할: 브라우저에서 직접 OpenRouter API 키가 노출되지 않도록
//       API 호출을 서버 측에서 대신 처리하는 프록시 서버입니다.
// ============================================================

// 환경변수 로드 (.env 파일에서 OPENROUTER_API_KEY, PORT 읽기)
require("dotenv").config();

const express = require("express");
const path = require("path");

const app = express();

// ============================================================
// [시스템 프롬프트 설계 문서]
//
// 프론트엔드에서 다이어리 항목을 전송할 때 아래 구조를 사용합니다:
//
// System prompt:
//   "당신은 따뜻하고 공감 능력이 뛰어난 AI 다이어리 친구입니다.
//    사용자가 하루 있었던 일을 한 줄로 쓰면, 다음 세 가지를 JSON 형식으로 응답하세요:
//    1. emotion: 주요 감정 (기쁨/슬픔/분노/불안/피로/설렘/감사/외로움 중 하나)
//    2. empathy: 공감 메시지 (2~3문장, 따뜻하고 진심 어린 어조)
//    3. comfort: 위로/응원 메시지 (1~2문장, 힘이 되는 말)
//    반드시 JSON만 응답하세요.
//    예: {\"emotion\": \"피로\", \"empathy\": \"...\", \"comfort\": \"...\"}"
//
// User message:
//   사용자가 입력한 오늘 하루 일기 텍스트 (한 줄)
//
// 응답 형식 (JSON):
//   {
//     "emotion": "피로",
//     "empathy": "오늘 하루 정말 많이 지치셨겠어요. ...",
//     "comfort": "내일은 조금 더 나은 하루가 될 거예요."
//   }
// ============================================================

// ============================================================
// 미들웨어 설정
// ============================================================

// JSON 요청 본문 파싱 (최대 20mb - 이미지 등 대용량 데이터 대비)
app.use(express.json({ limit: "20mb" }));

// 정적 파일 서빙 (wk4 디렉토리 내 HTML, CSS, JS 파일 제공)
app.use(express.static(path.join(__dirname)));

// ============================================================
// POST /api/chat - OpenRouter API 프록시 엔드포인트
// ============================================================
// 브라우저 → 이 서버 → OpenRouter API 순서로 요청을 중계합니다.
// API 키는 서버의 환경변수에만 존재하므로 브라우저에 노출되지 않습니다.
// ============================================================
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
        "HTTP-Referer": "http://localhost:3000",
        "X-Title": "ai-empathy-diary",
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[오류] OpenRouter API 응답 실패:", response.status, errorText);
      return res.status(response.status).json({
        error: "OpenRouter API 호출 실패",
        status: response.status,
        detail: errorText,
      });
    }

    const data = await response.json();
    res.json(data);

  } catch (error) {
    console.error("[오류] /api/chat 처리 중 예외 발생:", error.message);
    res.status(500).json({
      error: "서버 내부 오류가 발생했습니다.",
      message: error.message,
    });
  }
});

// ============================================================
// 서버 시작
// ============================================================
const PORT = process.env.PORT || 3000;

if (!process.env.OPENROUTER_API_KEY) {
  console.error("=====================================");
  console.error("[경고] OPENROUTER_API_KEY가 설정되지 않았습니다.");
  console.error(".env 파일에 OPENROUTER_API_KEY를 입력하세요.");
  console.error("=====================================");
  process.exit(1);
}

app.listen(PORT, () => {
  console.log("=====================================");
  console.log(` AI 공감 다이어리 서버가 시작되었습니다.`);
  console.log(` 주소: http://localhost:${PORT}`);
  console.log(` API 키: 설정됨 (${process.env.OPENROUTER_API_KEY.slice(0, 8)}...)`);
  console.log("=====================================");
});
