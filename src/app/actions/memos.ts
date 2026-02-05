'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { Memo, MemoFormData } from '@/types/memo'

export async function getMemos(): Promise<Memo[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('memos')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching memos:', error)
    throw new Error('메모를 불러오는데 실패했습니다.')
  }

  // 데이터베이스 스키마를 Memo 인터페이스로 변환
  return (data || []).map((row) => ({
    id: row.id,
    title: row.title,
    content: row.content,
    category: row.category,
    tags: row.tags || [],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }))
}

export async function getMemoById(id: string): Promise<Memo | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('memos')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    console.error('Error fetching memo:', error)
    return null
  }

  if (!data) return null

  return {
    id: data.id,
    title: data.title,
    content: data.content,
    category: data.category,
    tags: data.tags || [],
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  }
}

export async function createMemo(formData: MemoFormData): Promise<Memo> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('memos')
    .insert({
      title: formData.title,
      content: formData.content,
      category: formData.category,
      tags: formData.tags || [],
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating memo:', error)
    throw new Error('메모 생성에 실패했습니다.')
  }

  const memo: Memo = {
    id: data.id,
    title: data.title,
    content: data.content,
    category: data.category,
    tags: data.tags || [],
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  }

  revalidatePath('/')
  return memo
}

export async function updateMemo(
  id: string,
  formData: MemoFormData
): Promise<Memo> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('memos')
    .update({
      title: formData.title,
      content: formData.content,
      category: formData.category,
      tags: formData.tags || [],
    })
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('Error updating memo:', error)
    throw new Error('메모 수정에 실패했습니다.')
  }

  const memo: Memo = {
    id: data.id,
    title: data.title,
    content: data.content,
    category: data.category,
    tags: data.tags || [],
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  }

  revalidatePath('/')
  return memo
}

export async function deleteMemo(id: string): Promise<void> {
  const supabase = await createClient()

  const { error } = await supabase.from('memos').delete().eq('id', id)

  if (error) {
    console.error('Error deleting memo:', error)
    throw new Error('메모 삭제에 실패했습니다.')
  }

  revalidatePath('/')
}

export async function searchMemos(query: string): Promise<Memo[]> {
  const supabase = await createClient()

  const searchPattern = `%${query}%`

  const { data, error } = await supabase
    .from('memos')
    .select('*')
    .or(`title.ilike.${searchPattern},content.ilike.${searchPattern}`)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error searching memos:', error)
    throw new Error('메모 검색에 실패했습니다.')
  }

  // 태그 검색은 클라이언트 측에서 필터링
  const filteredData = (data || []).filter((row) => {
    const tags = row.tags || []
    return (
      row.title.toLowerCase().includes(query.toLowerCase()) ||
      row.content.toLowerCase().includes(query.toLowerCase()) ||
      tags.some((tag: string) =>
        tag.toLowerCase().includes(query.toLowerCase())
      )
    )
  })

  return filteredData.map((row) => ({
    id: row.id,
    title: row.title,
    content: row.content,
    category: row.category,
    tags: row.tags || [],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }))
}

export async function getMemosByCategory(category: string): Promise<Memo[]> {
  const supabase = await createClient()

  const query = supabase
    .from('memos')
    .select('*')
    .order('created_at', { ascending: false })

  if (category !== 'all') {
    query.eq('category', category)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching memos by category:', error)
    throw new Error('메모를 불러오는데 실패했습니다.')
  }

  return (data || []).map((row) => ({
    id: row.id,
    title: row.title,
    content: row.content,
    category: row.category,
    tags: row.tags || [],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }))
}