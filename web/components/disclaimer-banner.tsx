export function DisclaimerBanner() {
  return (
    <div className="w-full bg-amber-900/20 border-b border-amber-700/30 px-4 py-3">
      <p className="text-sm text-amber-200 max-w-4xl mx-auto">
        <span className="font-semibold">⚠️ Educational Simulation:</span> All AQI values, correlations, and predictions
        are estimates based on mock data. This is not a real-time monitoring system. Real air quality assessment
        requires calibrated sensors and authoritative data sources.
      </p>
    </div>
  )
}