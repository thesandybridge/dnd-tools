"use client"

import { useState, useEffect } from "react"
import { ClipboardCheck } from "lucide-react"

import Gold from "./currency_svgs/Gold"
import Silver from "./currency_svgs/Silver"
import Copper from "./currency_svgs/Copper"
import Platinum from "./currency_svgs/Platinum"
import Electrum from "./currency_svgs/Electrum"
import { useCurrency } from "../../providers/CurrencyContext"
import { handleFocus, convertToLabel } from "./helper"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { GlassPanel } from "@/app/components/ui/GlassPanel"

const currencyIcons = {
  CP: <Copper />,
  SP: <Silver />,
  EP: <Electrum />,
  GP: <Gold />,
  PP: <Platinum />,
}

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
    <GlassPanel className="p-6">
      <h2 className="text-center mb-4">Currency Converter</h2>
      <div className="flex gap-3 items-end">
        <div className="flex-1">
          <Input
            type="number"
            value={currency}
            onChange={handleCurrencyChange}
            onBlur={handleBlur}
            onFocus={handleFocus}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="currency-select">Select Currency</Label>
          <Select
            value={selectedCurrency}
            onValueChange={handleCurrencyTypeChange}
          >
            <SelectTrigger id="currency-select">
              <SelectValue placeholder="Select Currency" />
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
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
        <GlassPanel
          variant="subtle"
          corona
          className="flex relative gap-2 p-3 items-center cursor-pointer"
          onClick={() => handleCopy(String(currency), -1)}
          title={convertToLabel(selectedCurrency)}
        >
          {currencyIcons[selectedCurrency]}
          <div className="flex gap-1 items-center">
            <span className="font-medium">{Number(currency).toLocaleString()}</span>
            <span className="text-muted-foreground text-sm">{selectedCurrency}</span>
          </div>
          {copiedIndex === -1 && (
            <ClipboardCheck
              className="absolute top-0 right-0 translate-x-1/2 -translate-y-1/2 text-primary"
            />
          )}
        </GlassPanel>
        {conversionResult.map((result, index) => (
          <GlassPanel
            key={index}
            variant="subtle"
            coronaHover
            className="flex relative gap-2 p-3 items-center cursor-pointer"
            onClick={() => handleCopy(result.amount, index)}
            title={convertToLabel(result.currency)}
          >
            {result.icon}
            <div className="flex gap-1 items-center">
              <span className="font-medium">{parseInt(result.amount).toLocaleString()}</span>
              <span className="text-muted-foreground text-sm">{result.currency}</span>
            </div>
            {copiedIndex === index && (
              <ClipboardCheck
                className="absolute top-0 right-0 translate-x-1/2 -translate-y-1/2 text-primary"
              />
            )}
          </GlassPanel>
        ))}
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
