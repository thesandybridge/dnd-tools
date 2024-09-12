"use client"
import styles from "./calculator.module.css";
import { useState } from "react";

function convertCurrency(type, amount) {
  const rates = {
    CP: 1,
    SP: 10,
    EP: 50,
    GP: 100,
    PP: 1000
  }

  let resultString = ""
  Object.entries(rates).forEach(([key, value]) => {
    if (key !== type) {
      const conversionAmount = ((rates[type] / value) * amount).toFixed(2) // Keep two decimal places
      resultString += `[${conversionAmount} ${key}] `
    }
  })

  return resultString.trim()
}

const View = ({
  conversionResult,
  currency,
  handleCurrencyChange,
  handleCurrencyTypeChange,
  selectedCurrency,
}) => {
  return (
    <div className={styles.calculatorWrapper}>
      <h2>Currency Converter</h2>
      <div className={styles.calculator}>
        <label>
          <input
            type="number"
            value={currency}
            onChange={handleCurrencyChange}
          />
        </label>
        <select value={selectedCurrency} onChange={handleCurrencyTypeChange}>
          <option value="">Select Currency</option>
          <option value="CP">Copper</option>
          <option value="SP">Silver</option>
          <option value="EP">Electrum</option>
          <option value="GP">Gold</option>
          <option value="PP">Platinum</option>
        </select>
      </div>
      <div className="conversion">
        {conversionResult}
      </div>
    </div>
  )
}

const Calculator = () => {
  const [currency, setCurrency] = useState(0)
  const [selectedCurrency, setSelectedCurrency] = useState('GP')
  const [conversionResult, setConversionResult] = useState('')

  const handleCurrencyChange = (e) => {
    const newAmount = parseFloat(e.target.value) || 0
    setCurrency(newAmount)
    updateConversionResult(selectedCurrency, newAmount)
  }

  const handleCurrencyTypeChange = (e) => {
    const newType = e.target.value
    setSelectedCurrency(newType)
    updateConversionResult(newType, currency)
  }

  const updateConversionResult = (type, amount) => {
    setConversionResult(convertCurrency(type, amount))
  }

  const calculatorProps = {
    conversionResult,
    currency,
    handleCurrencyChange,
    handleCurrencyTypeChange,
    selectedCurrency,
  }

  return (
    <View
      {...calculatorProps}
    />
  )
}

export default Calculator
