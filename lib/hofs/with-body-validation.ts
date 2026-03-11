import { NextRequest, NextResponse } from 'next/server'
import { ZodSchema } from 'zod'
import { BadRequestError } from '../errors/http-error'

// body 挂在 __parsedBody 上，绕过 NextRequest.body 只读 getter
export type RequestWithBody<T> = NextRequest & { __parsedBody: T }
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type HandlerWithBody<T> = (req: RequestWithBody<T>, ctx: unknown) => Promise<any>

export function withBodyValidation<T>(schema: ZodSchema<T>) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (handler: HandlerWithBody<T>): HandlerWithBody<T> =>
    async (req: RequestWithBody<T>, ctx: unknown) => {
      let json: unknown
      try {
        json = await req.json()
      } catch {
        throw new BadRequestError('Invalid JSON body')
      }
      const result = schema.safeParse(json)
      if (!result.success) {
        throw new BadRequestError(result.error.errors[0]?.message || 'Validation failed')
      }
      req.__parsedBody = result.data
      return handler(req, ctx)
    }
}
