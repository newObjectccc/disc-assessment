import { NextRequest, NextResponse } from 'next/server'
import { HttpError } from '../errors/http-error'
import { ZodError } from 'zod'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AnyHandler = (req: any, ctx: unknown) => Promise<NextResponse | Response>

export function withErrorHandler(handler: AnyHandler): AnyHandler {
  return async (req: NextRequest, ctx: unknown) => {
    try {
      return await handler(req, ctx)
    } catch (error) {
      if (error instanceof HttpError) {
        return NextResponse.json({ error: error.message }, { status: error.status })
      }
      if (error instanceof ZodError) {
        return NextResponse.json({ error: error.errors[0]?.message || 'Validation error' }, { status: 400 })
      }
      console.error('[API Error]', error)
      return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
  }
}
