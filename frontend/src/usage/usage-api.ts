import api from '@/lib/api'
import type { Usage } from './types'

// Today's credits for the whole account (all conversations together).
export async function getUsage(): Promise<Usage> {
    const { data } = await api.get<Usage>('/api/usage')
    return data
}
