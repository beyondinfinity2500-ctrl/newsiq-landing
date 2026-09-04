export function NiqMascot({ size = 52, className = '' }: { size?: number; className?: string }) {
  return (
    <div className={`niq-mascot ${className}`} style={{ width: size, height: size }} role="img" aria-label="Niq, the friendly NEWSiQ intelligence companion">
      <span className="niq-antenna" aria-hidden="true" />
      <span className="niq-face" aria-hidden="true">
        <span className="niq-eye niq-eye-left"><i /></span>
        <span className="niq-eye niq-eye-right"><i /></span>
        <span className="niq-cheek" />
      </span>
      <span className="niq-chest" aria-hidden="true">N</span>
    </div>
  )
}
