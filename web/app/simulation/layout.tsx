import type { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'Simulation | Breathe Map',
}

export default function SimulationLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return children
}
