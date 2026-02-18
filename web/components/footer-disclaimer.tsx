export function FooterDisclaimer() {
  return (
    <footer
      className="w-full border-t mt-12"
      style={{
        borderColor: 'rgba(39,39,42,0.5)',
        backgroundColor: 'rgba(9,9,11,0.8)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        fontFamily: "'DM Sans', sans-serif",
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-5">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">

          {/* Brand */}
          <div className="flex items-center gap-2">
            <div
              className="w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, #059669, #34d399)' }}
            >
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                <circle cx="12" cy="12" r="10"/>
                <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
              </svg>
            </div>
            <span
              className="text-xs font-medium"
              style={{ color: '#52525b' }}
            >
              © 2026 TBA
            </span>
          </div>

          {/* Disclaimer */}
          <p
            className="text-[11px] text-center sm:text-right max-w-md leading-relaxed"
            style={{ color: '#3f3f46' }}
          >
            Educational simulation only.
          </p>

        </div>
      </div>
    </footer>
  )
}