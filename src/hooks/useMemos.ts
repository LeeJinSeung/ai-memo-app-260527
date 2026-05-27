'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { Memo, MemoFormData } from '@/types/memo'
import {
  getMemos,
  createMemo as createMemoAction,
  updateMemo as updateMemoAction,
  deleteMemo as deleteMemoAction,
  updateMemoSummary as updateMemoSummaryAction,
  deleteAllMemos,
} from '@/app/actions/memoActions'

export const useMemos = () => {
  const [memos, setMemos] = useState<Memo[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')

  // 메모 로드
  useEffect(() => {
    setLoading(true)
    getMemos()
      .then(setMemos)
      .catch((error: unknown) => console.error('Failed to load memos:', error))
      .finally(() => setLoading(false))
  }, [])

  // 메모 생성
  const createMemo = useCallback(async (formData: MemoFormData): Promise<Memo> => {
    const newMemo = await createMemoAction(formData)
    setMemos(prev => [newMemo, ...prev])
    return newMemo
  }, [])

  // 메모 업데이트
  const updateMemo = useCallback(async (id: string, formData: MemoFormData): Promise<void> => {
    const updatedMemo = await updateMemoAction(id, formData)
    setMemos(prev => prev.map(memo => (memo.id === id ? updatedMemo : memo)))
  }, [])

  // 메모 삭제
  const deleteMemo = useCallback(async (id: string): Promise<void> => {
    await deleteMemoAction(id)
    setMemos(prev => prev.filter(memo => memo.id !== id))
  }, [])

  // 메모 요약 갱신 (LLM 결과 캐싱)
  const updateMemoSummary = useCallback(async (id: string, summary: string): Promise<void> => {
    const updatedMemo = await updateMemoSummaryAction(id, summary)
    setMemos(prev => prev.map(memo => (memo.id === id ? updatedMemo : memo)))
  }, [])

  // 메모 검색
  const searchMemos = useCallback((query: string): void => {
    setSearchQuery(query)
  }, [])

  // 카테고리 필터링
  const filterByCategory = useCallback((category: string): void => {
    setSelectedCategory(category)
  }, [])

  // 특정 메모 가져오기
  const getMemoById = useCallback(
    (id: string): Memo | undefined => {
      return memos.find(memo => memo.id === id)
    },
    [memos]
  )

  // 필터링된 메모 목록
  const filteredMemos = useMemo(() => {
    let filtered = memos

    if (selectedCategory !== 'all') {
      filtered = filtered.filter(memo => memo.category === selectedCategory)
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        memo =>
          memo.title.toLowerCase().includes(query) ||
          memo.content.toLowerCase().includes(query) ||
          memo.tags.some(tag => tag.toLowerCase().includes(query))
      )
    }

    return filtered
  }, [memos, selectedCategory, searchQuery])

  // 모든 메모 삭제
  const clearAllMemos = useCallback(async (): Promise<void> => {
    await deleteAllMemos()
    setMemos([])
    setSearchQuery('')
    setSelectedCategory('all')
  }, [])

  // 통계 정보
  const stats = useMemo(() => {
    const categoryCounts = memos.reduce(
      (acc, memo) => {
        acc[memo.category] = (acc[memo.category] || 0) + 1
        return acc
      },
      {} as Record<string, number>
    )

    return {
      total: memos.length,
      byCategory: categoryCounts,
      filtered: filteredMemos.length,
    }
  }, [memos, filteredMemos])

  return {
    // 상태
    memos: filteredMemos,
    allMemos: memos,
    loading,
    searchQuery,
    selectedCategory,
    stats,

    // 메모 CRUD
    createMemo,
    updateMemo,
    updateMemoSummary,
    deleteMemo,
    getMemoById,

    // 필터링 & 검색
    searchMemos,
    filterByCategory,

    // 유틸리티
    clearAllMemos,
  }
}
