import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenAI } from '@google/genai'

export const runtime = 'nodejs'

const MODEL_NAME = 'gemini-2.5-flash-lite'

interface SummarizeRequestBody {
  title?: string
  content?: string
}

interface GeminiApiError extends Error {
  status?: number | string
}

export async function POST(request: NextRequest) {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    return NextResponse.json(
      {
        error:
          'GEMINI_API_KEY 환경 변수가 설정되어 있지 않습니다. .env.local 파일을 확인해 주세요.',
      },
      { status: 500 }
    )
  }

  let body: SummarizeRequestBody
  try {
    body = (await request.json()) as SummarizeRequestBody
  } catch {
    return NextResponse.json(
      { error: '요청 본문이 올바른 JSON이 아닙니다.' },
      { status: 400 }
    )
  }

  const title = body.title?.trim() ?? ''
  const content = body.content?.trim() ?? ''

  if (!content) {
    return NextResponse.json(
      { error: '요약할 메모 내용이 비어 있습니다.' },
      { status: 400 }
    )
  }

  const prompt = [
    '다음 메모를 한국어로 2~3문장으로 핵심만 간결하게 요약해 주세요.',
    '불필요한 머리말("요약:" 등) 없이 본문만 작성하세요.',
    '',
    title ? `제목: ${title}` : null,
    '본문:',
    content,
  ]
    .filter(Boolean)
    .join('\n')

  try {
    const ai = new GoogleGenAI({ apiKey })
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
    })

    const summary = response.text?.trim()
    if (!summary) {
      return NextResponse.json(
        { error: 'LLM이 빈 응답을 반환했습니다. 잠시 후 다시 시도해 주세요.' },
        { status: 502 }
      )
    }

    return NextResponse.json({ summary })
  } catch (error) {
    const err = error as GeminiApiError
    console.error('Gemini API error:', err)
    const status =
      typeof err.status === 'number' && err.status >= 400 && err.status < 600
        ? err.status
        : 502
    return NextResponse.json(
      {
        error:
          err.message ?? 'LLM 호출 중 알 수 없는 오류가 발생했습니다.',
      },
      { status }
    )
  }
}
