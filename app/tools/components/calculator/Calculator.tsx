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
    <div className="flex flex-col items-center">
      <h2>Currency Converter</h2>
      <div className="flex gap-4 p-4 justify-center flex-wrap">
        <Input
          type="number"
          value={currency}
          onChange={handleCurrencyChange}
          onBlur={handleBlur}
          onFocus={handleFocus}
        />
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
      <div className="flex p-4 gap-4 justify-between w-full flex-wrap">
        {conversionResult.map((result, index) => (
          <div
            key={index}
            className="flex relative gap-2 p-2 rounded-lg border border-border flex-1 basis-[calc(25%-2rem)] w-full cursor-pointer hover:border-primary"
            onClick={() => handleCopy(result.amount, index)}
          >
            {result.icon}
            <div className="flex gap-1 shrink items-center" title={convertToLabel(result.currency)}>
              <span>{parseInt(result.amount).toLocaleString()}</span>
              <span>{result.currency}</span>
            </div>
            {copiedIndex === index && (
              <ClipboardCheck
                className="absolute top-0 right-0 translate-x-1/2 -translate-y-1/2 text-primary"
              />
            )}
          </div>
        ))}
      </div>
    </div>
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
