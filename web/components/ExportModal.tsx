'use client'

import { useState, useEffect } from 'react'
import { useCity } from '@/context/CityContext'
import { Zone, AQIEstimate, SummaryReport } from '@/lib/types'
import { Loader } from '@/components/loader'
import toast from 'react-hot-toast'

// ─── FONT CONFIG ─────────────────────────────────────────────────────────────
const FONT_DISPLAY = "'Google Sans', sans-serif"
const FONT_BODY = "'Google Sans', sans-serif"
// ─────────────────────────────────────────────────────────────────────────────

interface ExportModalProps {
    open: boolean
    onClose: () => void
}

type ExportFormat = 'csv' | 'pdf'

type PieSlice = {
    label: string
    value: number
    color: string
}

type PieLabel = 'Traffic' | 'Population' | 'Road' | 'Land Use'

const PIE_COLORS: Record<PieLabel, string> = {
    Traffic: '#34d399',
    Population: '#60a5fa',
    Road: '#fbbf24',
    'Land Use': '#f97316',
}

function titleCase(value: string | null | undefined) {
    if (!value) return 'N/A'
    return value.charAt(0).toUpperCase() + value.slice(1)
}

function getLandUseWeight(landUse: Zone['land_use_type']) {
    switch (landUse) {
        case 'green_space':
            return 10
        case 'residential':
            return 28
        case 'commercial':
            return 45
        case 'mixed':
            return 55
        case 'industrial':
            return 70
        default:
            return 30
    }
}

function getZonePieSlices(zone: SummaryReport['zones'][number]): PieSlice[] {
    const fallbackSlices: PieSlice[] = [
        { label: 'Traffic', value: Math.max(0, zone.traffic_density), color: PIE_COLORS.Traffic },
        { label: 'Population', value: Math.max(0, zone.population_density), color: PIE_COLORS.Population },
        { label: 'Road', value: Math.max(0, zone.road_length * 5), color: PIE_COLORS.Road },
        { label: 'Land Use', value: getLandUseWeight(zone.land_use_type), color: PIE_COLORS['Land Use'] },
    ]

    const contributions = zone.feature_contributions
    if (!contributions) return fallbackSlices

    const fromModel: PieSlice[] = [
        { label: 'Traffic', value: Math.abs(Number(contributions.traffic ?? 0)), color: PIE_COLORS.Traffic },
        { label: 'Population', value: Math.abs(Number(contributions.population ?? 0)), color: PIE_COLORS.Population },
        { label: 'Road', value: Math.abs(Number(contributions.road_network ?? 0)), color: PIE_COLORS.Road },
        { label: 'Land Use', value: Math.abs(Number(contributions.land_use ?? 0)), color: PIE_COLORS['Land Use'] },
    ]

    const total = fromModel.reduce((sum, slice) => sum + slice.value, 0)
    return total > 0 ? fromModel : fallbackSlices
}

function getCityPieSlices(report: SummaryReport): PieSlice[] {
    if (report.zones.length === 0) {
        return [
            { label: 'Traffic', value: 1, color: PIE_COLORS.Traffic },
            { label: 'Population', value: 1, color: PIE_COLORS.Population },
            { label: 'Road', value: 1, color: PIE_COLORS.Road },
            { label: 'Land Use', value: 1, color: PIE_COLORS['Land Use'] },
        ]
    }

    const totals = report.zones.reduce<Record<PieLabel, number>>(
        (acc, zone) => {
            const slices = getZonePieSlices(zone)
            for (const slice of slices) {
                acc[slice.label as PieLabel] += slice.value
            }
            return acc
        },
        { Traffic: 0, Population: 0, Road: 0, 'Land Use': 0 }
    )

    return [
        { label: 'Traffic', value: totals.Traffic, color: PIE_COLORS.Traffic },
        { label: 'Population', value: totals.Population, color: PIE_COLORS.Population },
        { label: 'Road', value: totals.Road, color: PIE_COLORS.Road },
        { label: 'Land Use', value: totals['Land Use'], color: PIE_COLORS['Land Use'] },
    ]
}

function renderBarCard(title: string, subtitle: string, slices: PieSlice[]) {
    const canvas = document.createElement('canvas')
    canvas.width = 540
    canvas.height = 320

    const ctx = canvas.getContext('2d')
    if (!ctx) return ''

    ctx.fillStyle = '#18181b'
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    ctx.strokeStyle = 'rgba(255,255,255,0.08)'
    ctx.lineWidth = 2
    ctx.strokeRect(1, 1, canvas.width - 2, canvas.height - 2)

    ctx.fillStyle = '#f4f4f5'
    ctx.font = 'bold 28px Helvetica'
    ctx.fillText(title, 24, 38)

    ctx.fillStyle = '#a1a1aa'
    ctx.font = '18px Helvetica'
    ctx.fillText(subtitle, 24, 68)

    const maxValue = Math.max(...slices.map((slice) => slice.value), 1)
    const barX = 32
    const barY = 110
    const barTrackWidth = 280
    const barHeight = 18
    const rowGap = 42

    ctx.fillStyle = '#71717a'
    ctx.font = '16px Helvetica'

    let legendY = barY
    for (const slice of slices) {
        const barWidth = Math.max(8, (slice.value / maxValue) * barTrackWidth)

        ctx.fillStyle = '#e4e4e7'
        ctx.font = '18px Helvetica'
        ctx.fillText(slice.label, barX, legendY - 10)

        ctx.fillStyle = '#27272a'
        ctx.fillRect(barX, legendY, barTrackWidth, barHeight)

        ctx.fillStyle = slice.color
        ctx.fillRect(barX, legendY, barWidth, barHeight)

        ctx.fillStyle = '#a1a1aa'
        ctx.font = '16px Helvetica'
        ctx.fillText(`${slice.value.toFixed(1)}`, 330, legendY + 14)
        legendY += rowGap
    }

    ctx.fillStyle = '#71717a'
    ctx.font = '15px Helvetica'
    ctx.fillText('Higher bars indicate stronger modeled contribution to AQI.', 24, 292)

    ctx.fillStyle = '#52525b'
    ctx.font = '13px Helvetica'
    const ticks = 4
    for (let i = 0; i <= ticks; i++) {
        const ratio = i / ticks
        const x = barX + ratio * barTrackWidth
        ctx.fillRect(x, barY - 2, 1, rowGap * slices.length - 18)
        ctx.fillText(`${Math.round(maxValue * ratio)}`, x - 6, 102)
    }

    return canvas.toDataURL('image/png')
}

// ── CSV Export ────────────────────────────────────────────────────────────────
function exportCSV(report: SummaryReport) {
    const headers = ['Zone Name', 'Land Use Type', 'Traffic Density (%)', 'Population Density (%)', 'Road Length (km)', 'Estimated AQI', 'AQI Category', 'Notes', 'Created At']

    const rows = report.zones.map((zone) => [
        zone.name,
        zone.land_use_type.replace('_', ' '),
        zone.traffic_density,
        zone.population_density,
        zone.road_length,
        zone.estimated_aqi ?? 'N/A',
        titleCase(zone.category),
        zone.notes || '',
        zone.created_at,
    ])

    const csvContent = [
        `# Breathe Map - Air Quality Report`,
        `# City: ${report.city.name}`,
        `# Date Range: ${report.filters.date_from || 'All'} to ${report.filters.date_to || 'All'}`,
        `# Generated: ${report.generated_at}`,
        `# Zone Count: ${report.overview.zone_count}`,
        `# Average AQI: ${report.overview.average_aqi}`,
        `# AQI Distribution: Good=${report.distribution.good}, Satisfactory=${report.distribution.satisfactory}, Moderate=${report.distribution.moderate}, Poor=${report.distribution.poor}, Severe=${report.distribution.severe}`,
        `# Simulation Runs: ${report.simulation_summary.total_runs}`,
        '',
        headers.join(','),
        ...rows.map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(',')),
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `breathe-map-report-${report.city.name.replace(/\s+/g, '-').toLowerCase()}-${new Date().toISOString().split('T')[0]}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
}

// ── PDF Export ────────────────────────────────────────────────────────────────
async function exportPDF(report: SummaryReport) {
    const { jsPDF } = await import('jspdf')
    const autoTable = (await import('jspdf-autotable')).default

    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })

    // Header bar
    doc.setFillColor(18, 18, 20)
    doc.rect(0, 0, 297, 297, 'F')

    // Title
    doc.setTextColor(244, 244, 245)
    doc.setFontSize(20)
    doc.setFont('helvetica', 'bold')
    doc.text('Breathe Map Air Quality Report', 14, 18)

    // Subtitle meta
    doc.setFontSize(9)
    doc.setTextColor(113, 113, 122)
    doc.setFont('helvetica', 'normal')
    doc.text(`City: ${report.city.name}`, 14, 26)
    doc.text(`Generated: ${new Date(report.generated_at).toLocaleString()}`, 14, 31)
    doc.text(`Total Zones: ${report.overview.zone_count}`, 14, 36)

    // Divider
    doc.setDrawColor(52, 211, 153)
    doc.setLineWidth(0.5)
    doc.line(14, 40, 283, 40)

    doc.setFontSize(8)
    doc.setTextColor(52, 211, 153); doc.text(`Good: ${report.distribution.good}`, 14, 47)
    doc.setTextColor(251, 191, 36); doc.text(`Satisfactory: ${report.distribution.satisfactory}`, 40, 47)
    doc.setTextColor(249, 115, 22); doc.text(`Moderate: ${report.distribution.moderate}`, 85, 47)
    doc.setTextColor(239, 68, 68); doc.text(`Poor: ${report.distribution.poor}`, 125, 47)
    doc.setTextColor(168, 85, 247); doc.text(`Severe: ${report.distribution.severe}`, 160, 47)
    doc.setTextColor(113, 113, 122); doc.text(`Avg AQI: ${report.overview.average_aqi}`, 195, 47)

    // Table
    const tableData = report.zones.map((zone) => [
        zone.name,
        zone.land_use_type.replace('_', ' '),
        `${zone.traffic_density}%`,
        `${zone.population_density}%`,
        `${zone.road_length} km`,
        zone.estimated_aqi ?? '—',
        titleCase(zone.category),
    ])

    autoTable(doc, {
        startY: 52,
        head: [['Zone Name', 'Land Use', 'Traffic', 'Population', 'Road Length', 'Est. AQI', 'Category']],
        body: tableData,
        styles: {
            fontSize: 8,
            cellPadding: 3,
            textColor: [228, 228, 231],
            fillColor: [24, 24, 27],
            lineColor: [39, 39, 42],
            lineWidth: 0.3,
        },
        headStyles: {
            fillColor: [39, 39, 42],
            textColor: [161, 161, 170],
            fontStyle: 'bold',
            fontSize: 7.5,
        },
        alternateRowStyles: { fillColor: [28, 28, 32] },
        columnStyles: {
            0: { cellWidth: 55 },
            5: { halign: 'center', fontStyle: 'bold' },
            6: { halign: 'center' },
        },
    })

    const chartCards = [
        {
            title: `${report.city.name} City Overview`,
            subtitle: `Avg AQI ${report.overview.average_aqi} | Zones ${report.overview.zone_count}`,
            slices: getCityPieSlices(report),
        },
        ...report.zones.map((zone) => ({
            title: zone.name,
            subtitle: `AQI ${zone.estimated_aqi ?? 'N/A'} | ${titleCase(zone.category)}`,
            slices: getZonePieSlices(zone),
        })),
    ]

    let chartY = ((doc as any).lastAutoTable?.finalY ?? 120) + 8
    if (chartY > 135) {
        doc.addPage()
        doc.setFillColor(18, 18, 20)
        doc.rect(0, 0, 297, 297, 'F')
        chartY = 18
    }

    doc.setFontSize(11)
    doc.setTextColor(244, 244, 245)
    doc.text('AQI Factor Bar Charts', 14, chartY)
    doc.setFontSize(8)
    doc.setTextColor(113, 113, 122)
    doc.text('Traffic, population, road, and land use contribution breakdowns as bar graphs.', 14, chartY + 5)
    chartY += 10

    const marginX = 14
    const gapX = 6
    const gapY = 6
    const cardW = 85
    const cardH = 52
    const cardsPerRow = 3
    const rowsPerPage = 2
    const cardsPerPage = cardsPerRow * rowsPerPage

    chartCards.forEach((card, index) => {
        const pageCardIndex = index % cardsPerPage
        const pageIndex = Math.floor(index / cardsPerPage)

        if (pageIndex > 0 && pageCardIndex === 0) {
            doc.addPage()
            doc.setFillColor(18, 18, 20)
            doc.rect(0, 0, 297, 297, 'F')
            chartY = 18

            doc.setFontSize(11)
            doc.setTextColor(244, 244, 245)
            doc.text('AQI Factor Bar Charts', 14, chartY)
            doc.setFontSize(8)
            doc.setTextColor(113, 113, 122)
            doc.text('Traffic, population, road, and land use contribution breakdowns as bar graphs.', 14, chartY + 5)
            chartY += 10
        }

        const col = pageCardIndex % cardsPerRow
        const row = Math.floor(pageCardIndex / cardsPerRow)
        const x = marginX + col * (cardW + gapX)
        const y = chartY + row * (cardH + gapY)

        const image = renderBarCard(card.title, card.subtitle, card.slices)
        if (image) {
            doc.addImage(image, 'PNG', x, y, cardW, cardH)
        }
    })

    const pageCount = (doc as any).internal.getNumberOfPages()
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i)
        doc.setFontSize(7)
        doc.setTextColor(82, 82, 91)
        doc.text('Educational simulation only. Not for regulatory use.', 14, 205)
        doc.text(`Page ${i} / ${pageCount}`, 270, 205)
    }

    doc.save(`breathe-map-report-${report.city.name.replace(/\s+/g, '-').toLowerCase()}-${new Date().toISOString().split('T')[0]}.pdf`)
}

// ── Checkbox item ────────────────────────────────────────────────────────────
function CheckItem({ checked, onChange, label }: { checked: boolean; onChange: () => void; label: string }) {
    return (
        <button
            type="button"
            onClick={onChange}
            className="flex items-center gap-2.5 w-full px-3 py-2 rounded-lg text-left transition-colors"
            style={{
                backgroundColor: checked ? 'rgba(52,211,153,0.08)' : 'rgba(39,39,42,0.4)',
                border: `1px solid ${checked ? 'rgba(52,211,153,0.25)' : 'rgba(63,63,70,0.5)'}`,
            }}
        >
            <div
                className="w-4 h-4 rounded-[4px] flex items-center justify-center flex-shrink-0 transition-colors"
                style={{ backgroundColor: checked ? '#34d399' : 'transparent', border: `2px solid ${checked ? '#34d399' : 'rgba(82,82,91,0.8)'}` }}
            >
                {checked && (
                    <svg width="9" height="9" fill="none" stroke="#0a0a0a" strokeWidth="2.5" viewBox="0 0 24 24">
                        <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                )}
            </div>
            <span className="text-sm text-zinc-300 truncate" style={{ fontFamily: FONT_BODY }}>{label}</span>
        </button>
    )
}

// ── Export Progress Overlay ───────────────────────────────────────────────────
function ProgressOverlay({ format }: { format: ExportFormat }) {
    return (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center rounded-2xl"
            style={{ background: 'rgba(18,18,20,0.92)', backdropFilter: 'blur(6px)' }}>
            <Loader variant="inline" label={`Generating ${format.toUpperCase()}…`} />
            <p className="text-sm font-semibold text-zinc-200 mt-3" style={{ fontFamily: FONT_DISPLAY }}>
                Generating {format.toUpperCase()}…
            </p>
            <p className="text-xs text-zinc-500 mt-1" style={{ fontFamily: FONT_BODY }}>
                Preparing your report, please wait
            </p>
        </div>
    )
}

// ── Main Export Modal ─────────────────────────────────────────────────────────
export function ExportModal({ open, onClose }: ExportModalProps) {
    const { cities, currentCityId } = useCity()

    const [selectedCityId, setSelectedCityId] = useState(currentCityId)
    const [zones, setZones] = useState<Zone[]>([])
    const [estimates, setEstimates] = useState<Map<string, AQIEstimate>>(new Map())
    const [selectedZoneIds, setSelectedZoneIds] = useState<Set<string>>(new Set())
    const [format, setFormat] = useState<ExportFormat>('csv')
    const [isLoadingZones, setIsLoadingZones] = useState(false)
    const [isExporting, setIsExporting] = useState(false)

    // Load zones when city changes
    useEffect(() => {
        if (!open || !selectedCityId) return
        setIsLoadingZones(true)
        void (async () => {
            try {
                const res = await fetch(`/api/zones?cityId=${selectedCityId}`, { cache: 'no-store' })
                const data = await res.json()
                const loadedZones: Zone[] = data.zones ?? []
                setZones(loadedZones)
                setEstimates(new Map(Object.entries(data.estimates ?? {}) as [string, AQIEstimate][]))
                setSelectedZoneIds(new Set(loadedZones.map((z) => z.id)))
            } catch { /* ignore */ }
            finally { setIsLoadingZones(false) }
        })()
    }, [open, selectedCityId])

    // Reset on open
    useEffect(() => {
        if (open) {
            setSelectedCityId(currentCityId)
            setFormat('csv'); setIsExporting(false)
        }
    }, [open, currentCityId])

    const toggleZone = (id: string) => {
        setSelectedZoneIds((prev) => {
            const next = new Set(prev)
            next.has(id) ? next.delete(id) : next.add(id)
            return next
        })
    }

    const toggleAll = () => {
        if (selectedZoneIds.size === zones.length) {
            setSelectedZoneIds(new Set())
        } else {
            setSelectedZoneIds(new Set(zones.map((z) => z.id)))
        }
    }

    const handleExport = async () => {
        const exportZones = zones.filter((z) => selectedZoneIds.has(z.id))

        if (exportZones.length === 0) {
            toast.error('No zones selected')
            return
        }

        setIsExporting(true)
        try {
            const params = new URLSearchParams({
                cityId: selectedCityId,
                zoneIds: exportZones.map((zone) => zone.id).join(','),
            })

            const response = await fetch(`/api/reports/summary?${params.toString()}`, { cache: 'no-store' })
            const report = await response.json()

            if (!response.ok) {
                throw new Error(report.error || 'Failed to generate report')
            }

            if (format === 'csv') {
                exportCSV(report as SummaryReport)
                toast.success(`CSV exported — ${exportZones.length} zone${exportZones.length > 1 ? 's' : ''}`)
            } else {
                await exportPDF(report as SummaryReport)
                toast.success(`PDF exported — ${exportZones.length} zone${exportZones.length > 1 ? 's' : ''}`)
            }
            onClose()
        } catch (err) {
            console.error(err)
            toast.error('Export failed. Please try again.')
        } finally {
            setIsExporting(false)
        }
    }

    if (!open) return null

    const allSelected = selectedZoneIds.size === zones.length && zones.length > 0
    const someSelected = selectedZoneIds.size > 0

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center px-4"
            style={{ backgroundColor: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)' }}
            onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
        >
            <div
                className="w-full max-w-lg rounded-2xl border overflow-hidden relative"
                style={{
                    background: '#18181b',
                    borderColor: 'rgba(255,255,255,0.1)',
                    boxShadow: '0 32px 80px rgba(0,0,0,0.8)',
                    animation: 'exportIn 0.25s cubic-bezier(0.16,1,0.3,1) both',
                    maxHeight: '90vh',
                    display: 'flex',
                    flexDirection: 'column',
                }}
            >
                <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Google+Sans:wght@400;500;600;700&display=swap');
          @keyframes exportIn {
            from { opacity: 0; transform: scale(0.93) translateY(16px); }
            to   { opacity: 1; transform: scale(1) translateY(0); }
          }
          .exp-input {
            width: 100%; background: rgba(39,39,42,0.5); border: 1px solid rgba(63,63,70,0.6);
            border-radius: 10px; padding: 9px 12px; color: #e4e4e7; font-size: 13px;
            outline: none; transition: border-color 0.2s, box-shadow 0.2s; font-family: ${FONT_BODY};
          }
          .exp-input:focus { border-color: rgba(52,211,153,0.4); box-shadow: 0 0 0 3px rgba(52,211,153,0.08); }
          .exp-input::placeholder { color: #52525b; }
          .exp-select { appearance: none; background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' fill='none' stroke='%2371717a' stroke-width='2' viewBox='0 0 24 24'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E"); background-repeat: no-repeat; background-position: right 12px center; padding-right: 32px; cursor: pointer; }
          .exp-select option { background: #1c1c1f; }
        `}</style>

                {isExporting && <ProgressOverlay format={format} />}

                {/* Header */}
                <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b flex-shrink-0" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                            style={{ background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.2)' }}>
                            <svg width="16" height="16" fill="none" stroke="#34d399" strokeWidth="2" viewBox="0 0 24 24">
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" strokeLinecap="round" />
                                <polyline points="7 10 12 15 17 10" strokeLinecap="round" strokeLinejoin="round" />
                                <line x1="12" y1="15" x2="12" y2="3" strokeLinecap="round" />
                            </svg>
                        </div>
                        <div>
                            <h2 className="text-base font-bold text-zinc-100" style={{ fontFamily: FONT_DISPLAY }}>Export Report</h2>
                            <p className="text-xs text-zinc-500 mt-0.5" style={{ fontFamily: FONT_BODY }}>Configure and download your data</p>
                        </div>
                    </div>
                    <button onClick={onClose}
                        className="w-8 h-8 flex items-center justify-center rounded-lg text-zinc-600 hover:text-zinc-300 hover:bg-zinc-800/60 transition-colors">
                        <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                            <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
                        </svg>
                    </button>
                </div>

                {/* Body */}
                <div className="px-6 py-5 space-y-5 overflow-y-auto flex-1">

                    {/* Format selector */}
                    <div>
                        <label className="block text-xs font-bold text-zinc-400 uppercase tracking-[0.12em] mb-2.5" style={{ fontFamily: FONT_DISPLAY }}>Format</label>
                        <div className="grid grid-cols-2 gap-2">
                            {(['csv', 'pdf'] as ExportFormat[]).map((f) => (
                                <button
                                    key={f}
                                    onClick={() => setFormat(f)}
                                    className="flex items-center justify-center gap-2.5 py-3 rounded-xl text-sm font-semibold transition-all"
                                    style={{
                                        backgroundColor: format === f ? 'rgba(52,211,153,0.1)' : 'rgba(39,39,42,0.4)',
                                        border: `1px solid ${format === f ? 'rgba(52,211,153,0.35)' : 'rgba(63,63,70,0.5)'}`,
                                        color: format === f ? '#34d399' : '#71717a',
                                        fontFamily: FONT_DISPLAY,
                                    }}
                                >
                                    {f === 'csv' ? (
                                        <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" strokeLinecap="round" />
                                            <polyline points="14 2 14 8 20 8" strokeLinecap="round" strokeLinejoin="round" />
                                            <line x1="16" y1="13" x2="8" y2="13" strokeLinecap="round" />
                                            <line x1="16" y1="17" x2="8" y2="17" strokeLinecap="round" />
                                            <polyline points="10 9 9 9 8 9" strokeLinecap="round" />
                                        </svg>
                                    ) : (
                                        <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" strokeLinecap="round" />
                                            <polyline points="14 2 14 8 20 8" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                    )}
                                    {f.toUpperCase()}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* City selector */}
                    <div>
                        <label className="block text-xs font-bold text-zinc-400 uppercase tracking-[0.12em] mb-2" style={{ fontFamily: FONT_DISPLAY }}>City</label>
                        <select
                            className="exp-input exp-select"
                            value={selectedCityId}
                            onChange={(e) => setSelectedCityId(e.target.value)}
                        >
                            {cities.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                    </div>


                    <div>
                        <div className="flex items-center justify-between mb-2.5">
                            <label className="text-xs font-bold text-zinc-400 uppercase tracking-[0.12em]" style={{ fontFamily: FONT_DISPLAY }}>
                                Zones
                            </label>
                            <button
                                onClick={toggleAll}
                                className="text-[11px] font-semibold text-emerald-500 hover:text-emerald-400 transition-colors"
                                style={{ fontFamily: FONT_DISPLAY }}
                            >
                                {allSelected ? 'Deselect all' : 'Select all'}
                            </button>
                        </div>

                        {isLoadingZones ? (
                            <div className="flex items-center gap-3 py-4 text-sm text-zinc-500" style={{ fontFamily: FONT_BODY }}>
                                <Loader variant="inline" />
                                Loading zones…
                            </div>
                        ) : zones.length === 0 ? (
                            <p className="text-sm text-zinc-600 py-4 text-center" style={{ fontFamily: FONT_BODY }}>
                                No zones found for this city.
                            </p>
                        ) : (
                            <div className="space-y-1.5 max-h-36 overflow-y-auto pr-0.5">
                                {zones.map((z) => (
                                    <CheckItem
                                        key={z.id}
                                        checked={selectedZoneIds.has(z.id)}
                                        onChange={() => toggleZone(z.id)}
                                        label={z.name}
                                    />
                                ))}
                            </div>
                        )}

                        {someSelected && (
                            <p className="text-[11px] text-zinc-600 mt-2" style={{ fontFamily: FONT_BODY }}>
                                {selectedZoneIds.size} of {zones.length} zones selected
                            </p>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="px-6 pb-5 pt-3 border-t flex-shrink-0 flex gap-2.5" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                    <button
                        onClick={onClose}
                        className="flex-1 py-2.5 border border-zinc-700/60 text-zinc-400 font-semibold rounded-xl text-sm hover:border-zinc-600 hover:text-zinc-300 transition-all"
                        style={{ fontFamily: FONT_DISPLAY }}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleExport}
                        disabled={isExporting || !someSelected}
                        className="flex-1 py-2.5 bg-emerald-500 text-zinc-950 font-semibold rounded-xl text-sm hover:bg-emerald-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        style={{ boxShadow: '0 0 14px rgba(52,211,153,0.2)', fontFamily: FONT_DISPLAY }}
                    >
                        {isExporting ? (
                            <>
                                <Loader variant="inline" />
                                Exporting…
                            </>
                        ) : (
                            `Export ${format.toUpperCase()}`
                        )}
                    </button>
                </div>
            </div>
        </div>
    )
}
