const { GoogleGenerativeAI } = require("@google/generative-ai");

// Netlify 환경 변수에서 API 키를 가져옵니다.
const apiKey = process.env.GEMINI_API_KEY;

// 💥 중요: API 키가 존재하는지 확인하는 방어 코드 추가
if (!apiKey) {
  // 이 메시지가 Netlify 로그에 표시됩니다.
  console.error("GEMINI_API_KEY 환경 변수가 설정되지 않았습니다.");
  // 클라이언트에게 에러를 반환합니다.
  return {
    statusCode: 500,
    body: JSON.stringify({ error: "서버 설정 오류: API 키가 누락되었습니다." }),
  };
}

// API 키가 존재할 경우에만 클라이언트를 초기화합니다.
const genAI = new GoogleGenerativeAI(apiKey);

// 파일을 Google API가 요구하는 형식으로 변환하는 헬퍼 함수
function fileToGenerativePart(base64, mimeType) {
  return {
    inlineData: { data: base64, mimeType },
  };
}

exports.handler = async function (event) {
  // POST 요청만 허용합니다.
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  try {
    const { image, mimeType, prompt } = JSON.parse(event.body);

    if (!image || !mimeType || !prompt) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "이미지, MIME 타입, 프롬프트는 필수입니다." }),
      };
    }
    
    // gemini-1.5-flash-latest 모델을 사용합니다.
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });
    const imagePart = fileToGenerativePart(image, mimeType);

    const result = await model.generateContent([prompt, imagePart]);
    const response = await result.response;
    const text = response.text();
    
    return {
      statusCode: 200,
      body: JSON.stringify({ result: text }),
    };
  } catch (error) {
    console.error("Gemini API 호출 오류:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Gemini API 호출 중 서버에서 오류가 발생했습니다." }),
    };
  }
};

