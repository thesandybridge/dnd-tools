"use client"

import { useReducer, useEffect, useCallback, useMemo, useRef } from "react"
import { ClipboardCheck } from "lucide-react"

import Gold from "./currency_svgs/Gold"
import Silver from "./currency_svgs/Silver"
import Copper from "./currency_svgs/Copper"
import Platinum from "./currency_svgs/Platinum"
import Electrum from "./currency_svgs/Electrum"
import { useCurrency } from "../../providers/CurrencyContext"
import { handleFocus, preventNonNumeric, convertToLabel } from "./helper"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { GlassPanel } from "@/app/components/ui/GlassPanel"

const CURRENCY_RATES = {
  CP: { price: 1, icon: <Copper /> },
  SP: { price: 10, icon: <Silver /> },
  EP: { price: 50, icon: <Electrum /> },
  GP: { price: 100, icon: <Gold /> },
  PP: { price: 1000, icon: <Platinum /> },
}

function computeConversions(type: string, amount: number) {
  return Object.entries(CURRENCY_RATES)
    .filter(([key]) => key !== type)
    .map(([key, value]) => ({
      amount: ((CURRENCY_RATES[type].price / value.price) * amount).toFixed(2),
      currency: key,
      icon: value.icon,
    }))
}

type State = {
  selectedCurrency: string
  copiedIndex: number | null
}

type Action =
  | { type: "SET_CURRENCY_TYPE"; payload: string }
  | { type: "SET_COPIED"; payload: number | null }

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "SET_CURRENCY_TYPE":
      return { ...state, selectedCurrency: action.payload }
    case "SET_COPIED":
      return { ...state, copiedIndex: action.payload }
    default:
      return state
  }
}

const View = ({
  conversionResult,
  currency,
  handleCurrencyChange,
  handleCurrencyTypeChange,
  selectedCurrency,
  copiedIndex,
  handleCopy,
  handleBlur,
}) => {
  return (
    <GlassPanel variant="subtle" className="p-3">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <Input
            type="number"
            value={currency}
            onChange={handleCurrencyChange}
            onBlur={handleBlur}
            onFocus={handleFocus}
            onKeyDown={preventNonNumeric}
            className="w-24 bg-white/[0.03] border-white/[0.06] text-right transition-all duration-200 focus:border-primary/40 focus:shadow-[0_0_8px_-3px] focus:shadow-primary/20"
          />
          <Select
            value={selectedCurrency}
            onValueChange={handleCurrencyTypeChange}
          >
            <SelectTrigger className="w-24 bg-white/[0.03] border-white/[0.06] transition-all duration-200 focus:border-primary/40 focus:shadow-[0_0_8px_-3px] focus:shadow-primary/20">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="CP">Copper</SelectItem>
              <SelectItem value="SP">Silver</SelectItem>
              <SelectItem value="EP">Electrum</SelectItem>
              <SelectItem value="GP">Gold</SelectItem>
              <SelectItem value="PP">Platinum</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          {conversionResult.map((result, index) => (
            <button
              key={index}
              onClick={() => handleCopy(result.amount, index)}
              className="flex items-center gap-1.5 text-sm hover:text-primary transition-colors"
              title={convertToLabel(result.currency)}
            >
              {copiedIndex === index ? (
                <ClipboardCheck className="w-4 h-4 text-primary" />
              ) : (
                <span className="[&_svg]:w-4 [&_svg]:h-4">{result.icon}</span>
              )}
              <span className="font-medium">{Number(result.amount).toLocaleString()}</span>
              <span className="text-muted-foreground text-xs">{result.currency}</span>
              {index < conversionResult.length - 1 && (
                <span className="text-muted-foreground/30 ml-1">&middot;</span>
              )}
            </button>
          ))}
        </div>
      </div>
    </GlassPanel>
  )
}

const Calculator = () => {
  const { currency, setCurrency } = useCurrency()
  const [state, dispatch] = useReducer(reducer, {
    selectedCurrency: "GP",
    copiedIndex: null,
  })
  const copyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    return () => {
      if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current)
    }
  }, [])

  const conversionResult = useMemo(
    () => computeConversions(state.selectedCurrency, currency),
    [state.selectedCurrency, currency]
  )

  const handleCopy = useCallback((amount: string, index: number) => {
    navigator.clipboard.writeText(amount)
      .then(() => {
        dispatch({ type: "SET_COPIED", payload: index })
        if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current)
        copyTimeoutRef.current = setTimeout(() => {
          dispatch({ type: "SET_COPIED", payload: null })
          copyTimeoutRef.current = null
        }, 2000)
      })
      .catch((err) => {
        console.error("Failed to copy: ", err)
      })
  }, [])

  const handleBlur = useCallback((e) => {
    if (e.target.value === '') {
      setCurrency(0)
      e.target.value = '0'
    }
  }, [setCurrency])

  const handleCurrencyChange = useCallback((e) => {
    const newAmount = parseFloat(e.target.value) || 0
    setCurrency(newAmount)
  }, [setCurrency])

  const handleCurrencyTypeChange = useCallback((newType: string) => {
    dispatch({ type: "SET_CURRENCY_TYPE", payload: newType })
  }, [])

  const calculatorProps = useMemo(() => ({
    conversionResult,
    currency,
    handleCurrencyChange,
    handleCurrencyTypeChange,
    selectedCurrency: state.selectedCurrency,
    copiedIndex: state.copiedIndex,
    handleCopy,
    handleBlur,
  }), [conversionResult, currency, handleCurrencyChange, handleCurrencyTypeChange, state.selectedCurrency, state.copiedIndex, handleCopy, handleBlur])

  return <View {...calculatorProps} />
}

export default Calculator
