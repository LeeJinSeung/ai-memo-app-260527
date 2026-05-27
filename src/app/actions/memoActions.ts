'use server'

import { v4 as uuidv4 } from 'uuid'
import { createServerClient } from '@/utils/supabase/server'
import { rowToMemo, formDataToInsert, formDataToUpdate, summaryToUpdate } from '@/utils/supabase/mapper'
import type { Memo, MemoFormData } from '@/types/memo'

/** 전체 메모 목록 조회 (최신순) */
export async function getMemos(): Promise<Memo[]> {
  const supabase = createServerClient()
  const { data, error } = await supabase
    .from('memos')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) throw new Error(`메모 조회 실패: ${error.message}`)
  return (data ?? []).map(rowToMemo)
}

/** 단일 메모 조회 */
export async function getMemoById(id: string): Promise<Memo | null> {
  const supabase = createServerClient()
  const { data, error } = await supabase
    .from('memos')
    .select('*')
    .eq('id', id)
    .maybeSingle()

  if (error) throw new Error(`메모 조회 실패: ${error.message}`)
  return data ? rowToMemo(data) : null
}

/** 메모 생성 */
export async function createMemo(formData: MemoFormData): Promise<Memo> {
  const supabase = createServerClient()
  const id = uuidv4()
  const insert = formDataToInsert(formData, id)

  const { data, error } = await supabase
    .from('memos')
    .insert(insert)
    .select()
    .single()

  if (error) throw new Error(`메모 생성 실패: ${error.message}`)
  return rowToMemo(data)
}

/** 메모 수정 */
export async function updateMemo(id: string, formData: MemoFormData): Promise<Memo> {
  const supabase = createServerClient()
  const update = formDataToUpdate(formData)

  const { data, error } = await supabase
    .from('memos')
    .update(update)
    .eq('id', id)
    .select()
    .single()

  if (error) throw new Error(`메모 수정 실패: ${error.message}`)
  return rowToMemo(data)
}

/** 메모 삭제 */
export async function deleteMemo(id: string): Promise<void> {
  const supabase = createServerClient()
  const { error } = await supabase.from('memos').delete().eq('id', id)

  if (error) throw new Error(`메모 삭제 실패: ${error.message}`)
}

/** 메모 요약 업데이트 */
export async function updateMemoSummary(id: string, summary: string): Promise<Memo> {
  const supabase = createServerClient()
  const update = summaryToUpdate(summary)

  const { data, error } = await supabase
    .from('memos')
    .update(update)
    .eq('id', id)
    .select()
    .single()

  if (error) throw new Error(`요약 업데이트 실패: ${error.message}`)
  return rowToMemo(data)
}

/** 전체 메모 삭제 */
export async function deleteAllMemos(): Promise<void> {
  const supabase = createServerClient()
  const { error } = await supabase.from('memos').delete().neq('id', '')

  if (error) throw new Error(`전체 삭제 실패: ${error.message}`)
}
