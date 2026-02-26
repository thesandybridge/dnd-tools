"use client"

import { useState, useEffect } from "react"
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

function convertCurrency(type, amount) {
  const rates = {
    CP: { price: 1, icon: <Copper /> },
    SP: { price: 10, icon: <Silver /> },
    EP: { price: 50, icon: <Electrum /> },
    GP: { price: 100, icon: <Gold /> },
    PP: { price: 1000, icon: <Platinum /> }
  }

  const conversionResults = []

  Object.entries(rates).forEach(([key, value]) => {
    if (key !== type) {
      const conversionAmount = ((rates[type].price / value.price) * amount).toFixed(2)
      conversionResults.push({
        amount: conversionAmount,
        currency: key,
        icon: value.icon
      })
    }
  })

  return conversionResults
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
  const [selectedCurrency, setSelectedCurrency] = useState('GP')
  const [conversionResult, setConversionResult] = useState([])
  const [copiedIndex, setCopiedIndex] = useState(null)

  const handleCopy = (amount, index) => {
    navigator.clipboard.writeText(amount)
      .then(() => {
        setCopiedIndex(index)
        setTimeout(() => setCopiedIndex(null), 2000)
      })
      .catch((err) => {
        console.error("Failed to copy: ", err)
      })
  }

  const handleBlur = (e) => {
    if (e.target.value === '') {
      setCurrency(0)
      e.target.value = '0'
    }
  }

  const handleCurrencyChange = (e) => {
    const newAmount = parseFloat(e.target.value) || 0
    setCurrency(newAmount)
  }

  const handleCurrencyTypeChange = (newType) => {
    setSelectedCurrency(newType)
  }

  const updateConversionResult = (type, amount) => {
    setConversionResult(convertCurrency(type, amount))
  }

  useEffect(() => {
    updateConversionResult(selectedCurrency, currency)
  }, [currency, selectedCurrency])

  const calculatorProps = {
    conversionResult,
    currency,
    handleCurrencyChange,
    handleCurrencyTypeChange,
    selectedCurrency,
    copiedIndex,
    handleCopy,
    handleBlur,
  }

  return (
    <View
      {...calculatorProps}
    />
  )
}

export default Calculator
