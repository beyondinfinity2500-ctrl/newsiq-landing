import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { getProduct } from '../../../lib/products'

export async function POST(request: Request) {
  try {
    const { productId } = (await request.json()) as { productId?: string }
    const product = productId ? getProduct(productId) : undefined

    if (!product) {
      return NextResponse.json({ error: 'Invalid subscription plan.' }, { status: 400 })
    }

    if (!process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json({ error: 'Stripe is not configured yet.' }, { status: 503 })
    }

    const origin = request.headers.get('origin') ?? 'https://newsiq.top'
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      line_items: [{
        price_data: {
          currency: 'usd',
          product_data: { name: `NEWSiQ ${product.name}`, description: product.description },
          unit_amount: product.priceInCents,
          recurring: { interval: product.interval },
        },
        quantity: 1,
      }],
      success_url: `${origin}/subscribe?success=true&plan=${product.id}`,
      cancel_url: `${origin}/subscribe?canceled=true`,
      metadata: { productId: product.id, access: product.access },
      integration_identifier: `newsiq_${Math.random().toString(36).slice(2, 10)}`,
    })

    return NextResponse.json({ url: session.url })
  } catch {
    return NextResponse.json({ error: 'Unable to start checkout.' }, { status: 500 })
  }
}
