import { supabase } from './client'
import type { ServiceType } from './types'

/**
 * Get total conversation count for the current user
 */
export async function getUserConversationCount(serviceType?: ServiceType) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return 0

  const { data, error } = await supabase.rpc('get_user_conversation_count', {
    p_user_id: user.id,
    p_service_type: serviceType || null,
  } as any)

  if (error) {
    console.error('Error getting conversation count:', error)
    return 0
  }

  return data || 0
}

/**
 * Get today's conversation count for the current user
 */
export async function getTodayConversationCount() {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return 0

  const { data, error } = await supabase.rpc('get_today_conversation_count', {
    p_user_id: user.id,
  } as any)

  if (error) {
    console.error('Error getting today conversation count:', error)
    return 0
  }

  return data || 0
}

/**
 * Get user statistics
 */
export async function getUserStats() {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  // Note: user_stats table may not exist, using type cast
  const { data, error } = await (supabase as any)
    .from('user_stats')
    .select('*')
    .eq('user_id', user.id)
    .single()

  if (error) {
    console.error('Error getting user stats:', error)
    return null
  }

  return data
}

/**
 * Generate a unique session ID for conversations
 */
export function generateSessionId(): string {
  return `session_${Date.now()}_${Math.random().toString(36).substring(7)}`
}
