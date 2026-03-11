import type { Metadata, Viewport } from 'next'

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export const metadata: Metadata = {
  title: 'DISC 性格色彩测评',
  description: '了解你的性格色彩，发现真实的自己',
}

export default function H5Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      <div className="mx-auto max-w-md min-h-screen flex flex-col">
        {children}
      </div>
    </div>
  )
}
