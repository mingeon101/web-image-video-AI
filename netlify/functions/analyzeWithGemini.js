// 새 코드 👍
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });

// Netlify 환경 변수에서 API 키를 안전하게 불러옵니다.
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// 파일을 Google API가 요구하는 형식으로 변환하는 헬퍼 함수
function fileToGenerativePart(base64, mimeType) {
  return {
    inlineData: {
      data: base64,
      mimeType,
    },
  };
}

exports.handler = async function (event) {
  // POST 요청만 허용합니다.
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  try {
    // 프론트엔드에서 보낸 이미지(base64), 파일타입, 텍스트 조건을 받습니다.
    const { image, mimeType, prompt } = JSON.parse(event.body);

    if (!image || !mimeType || !prompt) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "이미지, MIME 타입, 프롬프트는 필수입니다." }),
      };
    }

    // 멀티모달 분석을 위해 gemini-pro-vision 모델을 사용합니다.
    const model = genAI.getGenerativeModel({ model: "gemini-pro-vision" });

    const imagePart = fileToGenerativePart(image, mimeType);

    // 이미지와 텍스트 프롬프트를 함께 API에 전달합니다.
    const result = await model.generateContent([prompt, imagePart]);
    const response = await result.response;
    const text = response.text();
    
    // 분석 결과를 JSON 형태로 프론트엔드에 반환합니다.
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

