// GET /api/usage (see docs/api-contract.md). All numbers are credits and may
// be decimals. `remaining` is `daily_allowance - used_today` and can go below 0.
export type Usage = {
    tier: 'free' | 'pro'
    daily_allowance: number
    used_today: number
    remaining: number
}
