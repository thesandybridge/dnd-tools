export function Spinner({ className = "" }: { className?: string }) {
  return (
    <svg
      className={`text-primary ${className}`}
      width="40"
      height="40"
      viewBox="0 0 40 40"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
    >
      <circle
        cx="20"
        cy="20"
        r="16"
        stroke="currentColor"
        strokeWidth="3"
        opacity="0.2"
      />
      <circle
        cx="20"
        cy="20"
        r="16"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeDasharray="80"
        strokeDashoffset="60"
      >
        <animateTransform
          attributeName="transform"
          type="rotate"
          from="0 20 20"
          to="360 20 20"
          dur="1s"
          repeatCount="indefinite"
        />
      </circle>
    </svg>
  )
}
