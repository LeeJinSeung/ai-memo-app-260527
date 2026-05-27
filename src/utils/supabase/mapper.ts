import type { Memo, MemoFormData } from '@/types/memo'
import type { MemoRow, MemoInsert, MemoUpdate } from '@/types/database'

/** DB 행(snake_case) → 앱 타입(camelCase) */
export const rowToMemo = (row: MemoRow): Memo => ({
  id: row.id,
  title: row.title,
  content: row.content,
  category: row.category,
  tags: row.tags ?? [],
  createdAt: row.created_at,
  updatedAt: row.updated_at,
  summary: row.summary ?? undefined,
  summaryUpdatedAt: row.summary_updated_at ?? undefined,
})

/** 앱 폼 데이터 → DB Insert 행 */
export const formDataToInsert = (formData: MemoFormData, id: string): MemoInsert => ({
  id,
  title: formData.title,
  content: formData.content,
  category: formData.category,
  tags: formData.tags,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
})

/** 앱 폼 데이터 → DB Update 행 */
export const formDataToUpdate = (formData: MemoFormData): MemoUpdate => ({
  title: formData.title,
  content: formData.content,
  category: formData.category,
  tags: formData.tags,
  updated_at: new Date().toISOString(),
})

/** 요약 업데이트 → DB Update 행 */
export const summaryToUpdate = (summary: string): MemoUpdate => ({
  summary,
  summary_updated_at: new Date().toISOString(),
})
