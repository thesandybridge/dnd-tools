import Calculator from "./components/calculator/Calculator"
import { CurrencyProvider } from "./providers/CurrencyContext"

export default function ToolsLayout({ children }: { children: React.ReactNode }) {
  return (
    <CurrencyProvider>
      <div className="flex flex-col gap-6 p-4 md:p-8 max-w-6xl mx-auto w-full">
        <Calculator />
        {children}
      </div>
    </CurrencyProvider>
  )
}
