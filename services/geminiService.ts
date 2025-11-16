import { GoogleGenAI, Type } from "@google/genai";

// ملاحظة: يُفترض أن مفتاح API مُعد مسبقًا في بيئة التشغيل
// const apiKey = process.env.API_KEY;
// if (!apiKey) {
//   throw new Error("API_KEY environment variable not set");
// }
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const codeGenerationSchema = {
  type: Type.OBJECT,
  properties: {
    html: {
      type: Type.STRING,
      description: "كود HTML الكامل، بما في ذلك doctype, html, head, و body. يجب أن يكون متوافقًا مع HTML5.",
    },
    css: {
      type: Type.STRING,
      description: "كود CSS لتنسيق الـ HTML. يجب أن يكون كاملاً ومنسقًا بشكل جيد.",
    },
    javascript: {
      type: Type.STRING,
      description: "كود JavaScript لإضافة التفاعلية. يجب أن يكون فعالًا وخاليًا من الأخطاء.",
    },
  },
  required: ["html", "css", "javascript"],
};

export async function generateCodeFromPrompt(prompt: string): Promise<{ html: string; css: string; javascript: string } | null> {
  const fullPrompt = `
    بصفتك خبيرًا في تطوير الواجهات الأمامية، قم بإنشاء مشروع ويب بسيط بناءً على الطلب التالي.
    الطلب: "${prompt}"
    
    يجب أن تلتزم بالقواعد التالية:
    1.  أنشئ كود HTML5 كامل وصحيح في الحقل 'html'.
    2.  أنشئ كود CSS حديث ومتجاوب في الحقل 'css'.
    3.  أنشئ كود JavaScript فعال وخالٍ من الأخطاء في الحقل 'javascript'.
    4.  تأكد من أن الكود بالكامل متوافق ويعمل معًا بشكل جيد.
    5.  يجب أن تكون الاستجابة بصيغة JSON فقط.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: fullPrompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: codeGenerationSchema,
      },
    });

    const text = response.text.trim();
    
    // Sometimes the model might wrap the JSON in markdown, let's clean it.
    const cleanedText = text.replace(/^```json\n/, '').replace(/\n```$/, '');

    const parsed = JSON.parse(cleanedText);
    
    if (parsed && typeof parsed.html === 'string' && typeof parsed.css === 'string' && typeof parsed.javascript === 'string') {
        return parsed;
    }
    return null;

  } catch (error) {
    console.error("Error calling Gemini API:", error);
    throw new Error("حدث خطأ أثناء التواصل مع الذكاء الاصطناعي.");
  }
}
