import { cn, formatAQI, getAQIBadgeClass } from '@/lib/utils'

interface AQIBadgeProps {
  aqi: number
  className?: string
  showValue?: boolean
}

export function AQIBadge({ aqi, className, showValue = true }: AQIBadgeProps) {
  const badgeClass = getAQIBadgeClass(aqi)
  const label = formatAQI(aqi)

  return (
    <div className={cn('aqi-badge', badgeClass, className)}>
      <span className="font-semibold">{label}</span>
      {showValue && <span className="ml-2 text-xs opacity-80">{aqi}</span>}
    </div>
  )
}