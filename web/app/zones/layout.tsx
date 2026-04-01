import type { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'Zones | Breathe Map',
}

export default function ZonesLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return children
}
