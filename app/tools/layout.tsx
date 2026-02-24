import Calculator from "./components/calculator/Calculator"
import { CurrencyProvider } from "./providers/CurrencyContext"

export default function ToolsLayout({ children }: { children: React.ReactNode }) {
  return (
    <CurrencyProvider>
      <div className="flex flex-col items-center p-4">
        <Calculator />
        <div className="max-w-[1200px] flex w-full justify-center">
          {children}
        </div>
      </div>
    </CurrencyProvider>
  )
}
