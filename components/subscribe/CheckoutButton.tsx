"use client"

import { useState } from 'react'

export function CheckoutButton({ productId, label = 'Start secure checkout' }: { productId: string; label?: string }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleCheckout() {
    setLoading(true)
    setError('')
    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId }),
      })
      const result = await response.json()
      if (!response.ok || !result.url) throw new Error(result.error ?? 'Checkout unavailable')
      window.location.href = result.url
    } catch (checkoutError) {
      setError(checkoutError instanceof Error ? checkoutError.message : 'Checkout unavailable')
      setLoading(false)
    }
  }

  return <div>
    <button type="button" onClick={handleCheckout} disabled={loading} className="w-full rounded-md bg-primary px-4 py-3 text-xs font-bold text-primary-foreground transition-transform hover:-translate-y-0.5 disabled:cursor-wait disabled:opacity-60">{loading ? 'Opening secure checkout…' : label}</button>
    {error && <p className="mt-2 text-center text-xs text-destructive" role="alert">{error}</p>}
  </div>
}
