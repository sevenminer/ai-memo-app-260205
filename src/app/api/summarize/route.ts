import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenAI } from '@google/genai'

export async function POST(request: NextRequest) {
  try {
    const { content } = await request.json()

    if (!content || typeof content !== 'string') {
      return NextResponse.json(
        { error: '메모 내용이 필요합니다.' },
        { status: 400 }
      )
    }

    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      return NextResponse.json(
        { error: 'GEMINI_API_KEY 환경 변수가 설정되지 않았습니다.' },
        { status: 500 }
      )
    }

    const ai = new GoogleGenAI({ apiKey })
    const modelName = 'gemini-2.5-flash-lite'

    const prompt = `다음 메모를 간결하고 명확하게 요약해주세요. 핵심 내용만 3-5줄로 정리해주세요.\n\n${content}`

    const response = await ai.models.generateContent({
      model: modelName,
      contents: prompt,
    })

    // 응답에서 텍스트 추출 (response.text 또는 candidates 구조 지원)
    let summary: string | null = null
    if (response.text) {
      summary = response.text
    } else if (
      response.candidates &&
      response.candidates[0]?.content?.parts?.[0]?.text
    ) {
      summary = response.candidates[0].content.parts[0].text
    }

    if (!summary) {
      return NextResponse.json(
        { error: '요약 생성에 실패했습니다.' },
        { status: 500 }
      )
    }

    return NextResponse.json({ summary })
  } catch (error) {
    console.error('요약 생성 오류:', error)
    return NextResponse.json(
      { error: '요약 생성 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
