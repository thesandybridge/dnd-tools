export default function Loading() {
  return (
    <div className="flex w-full justify-center h-dvh items-center">
      <svg className="stroke-primary" width="57" height="57" viewBox="0 0 57 57" xmlns="http://www.w3.org/2000/svg">
        <g fill="none" fillRule="evenodd">
          <g transform="translate(1 1)" strokeWidth="2">
            <circle cx="5" cy="50" r="5">
              <animate attributeName="cy" begin="0s" dur="2.2s" values="5055050" calcMode="linear" repeatCount="indefinite" />
              <animate attributeName="cx" begin="0s" dur="2.2s" values="527495" calcMode="linear" repeatCount="indefinite" />
            </circle>
            <circle cx="27" cy="5" r="5">
              <animate attributeName="cy" begin="0s" dur="2.2s" from="5" to="5" values="550505" calcMode="linear" repeatCount="indefinite" />
              <animate attributeName="cx" begin="0s" dur="2.2s" from="27" to="27" values="2749527" calcMode="linear" repeatCount="indefinite" />
            </circle>
            <circle cx="49" cy="50" r="5">
              <animate attributeName="cy" begin="0s" dur="2.2s" values="5050550" calcMode="linear" repeatCount="indefinite" />
              <animate attributeName="cx" from="49" to="49" begin="0s" dur="2.2s" values="4952749" calcMode="linear" repeatCount="indefinite" />
            </circle>
          </g>
        </g>
      </svg>
    </div>
  )
}
