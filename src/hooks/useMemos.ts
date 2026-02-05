'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { Memo, MemoFormData } from '@/types/memo'
import {
  getMemos,
  createMemo as createMemoAction,
  updateMemo as updateMemoAction,
  deleteMemo as deleteMemoAction,
  getMemoById as getMemoByIdAction,
} from '@/app/actions/memos'
import { seedSampleData } from '@/app/actions/seed'

export const useMemos = () => {
  const [memos, setMemos] = useState<Memo[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')

  // 메모 로드
  useEffect(() => {
    const loadMemos = async () => {
      setLoading(true)
      try {
        // 기존 데이터가 없을 때만 샘플 데이터 시딩
        await seedSampleData()
        const loadedMemos = await getMemos()
        setMemos(loadedMemos)
      } catch (error) {
        console.error('Failed to load memos:', error)
      } finally {
        setLoading(false)
      }
    }

    loadMemos()
  }, [])

  // 메모 생성
  const createMemo = useCallback(
    async (formData: MemoFormData): Promise<Memo> => {
      try {
        const newMemo = await createMemoAction(formData)
        setMemos(prev => [newMemo, ...prev])
        return newMemo
      } catch (error) {
        console.error('Failed to create memo:', error)
        throw error
      }
    },
    []
  )

  // 메모 업데이트
  const updateMemo = useCallback(
    async (id: string, formData: MemoFormData): Promise<void> => {
      try {
        const updatedMemo = await updateMemoAction(id, formData)
        setMemos(prev =>
          prev.map(memo => (memo.id === id ? updatedMemo : memo))
        )
      } catch (error) {
        console.error('Failed to update memo:', error)
        throw error
      }
    },
    []
  )

  // 메모 삭제
  const deleteMemo = useCallback(async (id: string): Promise<void> => {
    try {
      await deleteMemoAction(id)
      setMemos(prev => prev.filter(memo => memo.id !== id))
    } catch (error) {
      console.error('Failed to delete memo:', error)
      throw error
    }
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
    async (id: string): Promise<Memo | undefined> => {
      // 먼저 로컬 상태에서 찾기
      const localMemo = memos.find(memo => memo.id === id)
      if (localMemo) return localMemo

      // 없으면 서버에서 가져오기
      try {
        const memo = await getMemoByIdAction(id)
        if (memo) {
          setMemos(prev => {
            const exists = prev.find(m => m.id === id)
            if (exists) return prev
            return [memo, ...prev]
          })
        }
        return memo || undefined
      } catch (error) {
        console.error('Failed to get memo:', error)
        return undefined
      }
    },
    [memos]
  )

  // 필터링된 메모 목록
  const filteredMemos = useMemo(() => {
    let filtered = memos

    // 카테고리 필터링
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(memo => memo.category === selectedCategory)
    }

    // 검색 필터링
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
    try {
      // 모든 메모를 순차적으로 삭제
      const deletePromises = memos.map(memo => deleteMemoAction(memo.id))
      await Promise.all(deletePromises)
      setMemos([])
      setSearchQuery('')
      setSelectedCategory('all')
    } catch (error) {
      console.error('Failed to clear all memos:', error)
      throw error
    }
  }, [memos])

  // 통계 정보
  const stats = useMemo(() => {
    const totalMemos = memos.length
    const categoryCounts = memos.reduce(
      (acc, memo) => {
        acc[memo.category] = (acc[memo.category] || 0) + 1
        return acc
      },
      {} as Record<string, number>
    )

    return {
      total: totalMemos,
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
    deleteMemo,
    getMemoById,

    // 필터링 & 검색
    searchMemos,
    filterByCategory,

    // 유틸리티
    clearAllMemos,
  }
}
