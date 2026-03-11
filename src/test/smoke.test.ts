import { describe, it, expect } from 'vitest'
import { cn } from '@/lib/utils'

describe('smoke test', () => {
  it('cn() mergt classnames correct', () => {
    expect(cn('foo', 'bar')).toBe('foo bar')
    expect(cn('px-2', 'px-4')).toBe('px-4')
  })
})
