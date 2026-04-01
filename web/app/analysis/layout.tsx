import type { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'Reports | Breathe Map',
}

export default function AnalysisLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return children
}
