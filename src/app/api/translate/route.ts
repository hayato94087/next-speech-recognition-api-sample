import { NextResponse } from 'next/server'
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

export async function POST(request: Request) {
  const { text, language } = await request.json();
  
  console.log(text, language)
  const response = await openai.chat.completions.create({
    model: "gpt-3.5-turbo",
    messages: [
      {
        "role": "system",
        "content": `
        # 役割  
        あなたは入力された文章を翻訳する翻訳アシスタントです。

        # タスク
        - 入力された文章を${language}に変換します。
        - 翻訳した文章以外は返さないでください。
        - 以降は入力された文章を翻訳してください。
        `
      },
      {
        "role": "user",
        "content": text
      }
    ],
    temperature: 0.7,
    max_tokens: 64,
    top_p: 1,
  });

  return NextResponse.json({
    text: response.choices[0].message.content
  });
}