'use client'

import { useEffect, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Memo, MEMO_CATEGORIES } from '@/types/memo'

interface MemoViewerProps {
  isOpen: boolean
  memo: Memo | null
  onClose: () => void
  onEdit: (memo: Memo) => void
  onDelete: (id: string) => void
  onSummaryUpdate: (id: string, summary: string) => void
}

export default function MemoViewer({
  isOpen,
  memo,
  onClose,
  onEdit,
  onDelete,
  onSummaryUpdate,
}: MemoViewerProps) {
  const [isSummarizing, setIsSummarizing] = useState(false)
  const [summaryError, setSummaryError] = useState<string | null>(null)

  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  useEffect(() => {
    setSummaryError(null)
    setIsSummarizing(false)
  }, [memo?.id])

  if (!isOpen || !memo) return null

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      personal: 'bg-blue-100 text-blue-800',
      work: 'bg-green-100 text-green-800',
      study: 'bg-purple-100 text-purple-800',
      idea: 'bg-yellow-100 text-yellow-800',
      other: 'bg-gray-100 text-gray-800',
    }
    return colors[category] ?? colors.other
  }

  const handleDelete = () => {
    if (window.confirm('정말로 이 메모를 삭제하시겠습니까?')) {
      onDelete(memo.id)
      onClose()
    }
  }

  const handleEdit = () => {
    onEdit(memo)
    onClose()
  }

  const handleSummarize = async () => {
    if (isSummarizing) return
    setIsSummarizing(true)
    setSummaryError(null)
    try {
      const res = await fetch('/api/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: memo.title, content: memo.content }),
      })
      const data = (await res.json().catch(() => ({}))) as {
        summary?: string
        error?: string
      }
      if (!res.ok || !data.summary) {
        throw new Error(data.error ?? '요약 생성에 실패했습니다.')
      }
      onSummaryUpdate(memo.id, data.summary)
    } catch (e) {
      setSummaryError(e instanceof Error ? e.message : '알 수 없는 오류가 발생했습니다.')
    } finally {
      setIsSummarizing(false)
    }
  }

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
      onClick={onClose}
      data-testid="memo-viewer-backdrop"
    >
      <div
        className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
        data-testid="memo-viewer-modal"
      >
        <div className="p-6">
          {/* 헤더 */}
          <div className="flex justify-between items-start mb-4">
            <div className="flex-1 pr-4">
              <h2
                className="text-2xl font-bold text-gray-900 mb-3"
                data-testid="memo-viewer-title"
              >
                {memo.title}
              </h2>
              <div className="flex items-center gap-2 flex-wrap">
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(memo.category)}`}
                >
                  {MEMO_CATEGORIES[memo.category as keyof typeof MEMO_CATEGORIES] ??
                    memo.category}
                </span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0"
              aria-label="닫기"
              data-testid="memo-viewer-close-btn"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* 날짜 정보 */}
          <div className="flex flex-col gap-1 text-xs text-gray-500 mb-5 pb-5 border-b border-gray-100">
            <span>작성일: {formatDate(memo.createdAt)}</span>
            {memo.createdAt !== memo.updatedAt && (
              <span>수정일: {formatDate(memo.updatedAt)}</span>
            )}
          </div>

          {/* 내용 */}
          <div
            className="prose prose-sm max-w-none mb-6"
            data-testid="memo-viewer-content"
          >
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {memo.content}
            </ReactMarkdown>
          </div>

          {/* AI 요약 */}
          <div
            className="mb-6 rounded-lg border border-indigo-100 bg-indigo-50/60 p-4"
            data-testid="memo-viewer-summary-section"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-indigo-600 text-white text-xs font-bold">
                  AI
                </span>
                <h3 className="text-sm font-semibold text-indigo-900">
                  메모 요약
                </h3>
              </div>
              <button
                onClick={handleSummarize}
                disabled={isSummarizing}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md border border-indigo-300 text-indigo-700 bg-white hover:bg-indigo-100 disabled:cursor-not-allowed disabled:opacity-60 transition-colors"
                data-testid="memo-viewer-summary-btn"
              >
                {isSummarizing ? (
                  <>
                    <svg
                      className="w-3.5 h-3.5 animate-spin"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                      />
                    </svg>
                    생성 중...
                  </>
                ) : memo.summary ? (
                  <>
                    <svg
                      className="w-3.5 h-3.5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 4v5h.582M20 20v-5h-.581M5.582 9A7.5 7.5 0 0118.418 6.582M18.418 15A7.5 7.5 0 015.582 17.418"
                      />
                    </svg>
                    다시 생성
                  </>
                ) : (
                  <>
                    <svg
                      className="w-3.5 h-3.5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                      />
                    </svg>
                    요약 생성
                  </>
                )}
              </button>
            </div>

            {isSummarizing && !memo.summary && (
              <p
                className="text-sm text-indigo-700"
                data-testid="memo-viewer-summary-loading"
              >
                LLM이 메모를 요약하고 있습니다...
              </p>
            )}

            {summaryError && (
              <p
                className="text-sm text-red-600 mt-1"
                data-testid="memo-viewer-summary-error"
              >
                {summaryError}
              </p>
            )}

            {memo.summary && !summaryError && (
              <>
                <p
                  className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap"
                  data-testid="memo-viewer-summary-content"
                >
                  {memo.summary}
                </p>
                {memo.summaryUpdatedAt && (
                  <p className="text-xs text-indigo-500 mt-2">
                    요약 생성: {formatDate(memo.summaryUpdatedAt)}
                  </p>
                )}
              </>
            )}

            {!memo.summary && !isSummarizing && !summaryError && (
              <p className="text-sm text-indigo-700/80">
                Gemini가 메모의 핵심 내용을 짧게 요약해 줍니다.
              </p>
            )}
          </div>

          {/* 태그 */}
          {memo.tags.length > 0 && (
            <div className="flex gap-2 flex-wrap mb-6">
              {memo.tags.map((tag, index) => (
                <span
                  key={index}
                  className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-md"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}

          {/* 액션 버튼 */}
          <div className="flex gap-3 pt-4 border-t border-gray-100">
            <button
              onClick={handleEdit}
              className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 border border-blue-300 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              data-testid="memo-viewer-edit-btn"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                />
              </svg>
              편집
            </button>
            <button
              onClick={handleDelete}
              className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 border border-red-300 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              data-testid="memo-viewer-delete-btn"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
              삭제
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
