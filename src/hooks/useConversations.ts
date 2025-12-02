import { useEffect, useState } from 'react'
import { supabase } from '@/integrations/supabase/client'
import type { ConversationRow, ServiceType } from '@/integrations/supabase/types'

export function useConversations(serviceType?: ServiceType) {
  const [conversations, setConversations] = useState<ConversationRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    loadConversations()

    // Subscribe to changes
    const channel = supabase
      .channel('conversations-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'conversations',
        },
        () => {
          loadConversations()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [serviceType])

  const loadConversations = async () => {
    try {
      setLoading(true)
      let query = supabase
        .from('conversations')
        .select('*')
        .eq('status', 'active')
        .order('created_at', { ascending: false })

      if (serviceType) {
        query = query.eq('service_type', serviceType)
      }

      const { data, error: queryError } = await query

      if (queryError) throw queryError
      setConversations(data || [])
    } catch (err) {
      setError(err as Error)
      console.error('Error loading conversations:', err)
    } finally {
      setLoading(false)
    }
  }

  const createConversation = async (
    title: string,
    sessionId: string,
    serviceType: ServiceType
  ) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const { data, error } = await supabase
      .from('conversations')
      .insert({
        user_id: user.id,
        title,
        session_id: sessionId,
        service_type: serviceType,
        messages: [],
        status: 'active',
      } as any)
      .select()
      .single()

    if (error) throw error
    return data
  }

  const updateConversation = async (
    id: string,
    updates: Partial<ConversationRow>
  ) => {
    const { data, error } = await supabase
      .from('conversations')
      .update(updates as unknown as never)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  }

  const deleteConversation = async (id: string) => {
    // Soft delete
    const { error } = await supabase
      .from('conversations')
      .update({ status: 'deleted' } as unknown as never)
      .eq('id', id)

    if (error) throw error
  }

  return {
    conversations,
    loading,
    error,
    createConversation,
    updateConversation,
    deleteConversation,
    refresh: loadConversations,
  }
}
