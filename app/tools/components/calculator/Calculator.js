"use client"

import { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faClipboardCheck } from "@fortawesome/free-solid-svg-icons"

import styles from "./calculator.module.css";
import Gold from "./currency_svgs/Gold";
import Silver from "./currency_svgs/Silver";
import Copper from "./currency_svgs/Copper";
import Platinum from "./currency_svgs/Platinum";
import Electrum from "./currency_svgs/Electrum";
import { useCurrency } from "../../context/CurrencyContext";

function convertCurrency(type, amount) {
  const rates = {
    CP: { price: 1, icon: <Copper /> },
    SP: { price: 10, icon: <Silver /> },
    EP: { price: 50, icon: <Electrum /> },
    GP: { price: 100, icon: <Gold /> },
    PP: { price: 1000, icon: <Platinum /> }
  }

  const conversionResults = [];

  Object.entries(rates).forEach(([key, value]) => {
    if (key !== type) {
      const conversionAmount = ((rates[type].price / value.price) * amount).toFixed(2);
      conversionResults.push({
        amount: conversionAmount.toLocaleString('en-US'),
        currency: key,
        icon: value.icon
      });
    }
  });

  return conversionResults;
}

const View = ({
  conversionResult,
  currency,
  handleCurrencyChange,
  handleCurrencyTypeChange,
  selectedCurrency,
  copiedIndex,
  handleCopy,
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
      <div className={styles.conversion}>
        {conversionResult.map((result, index) => (
          <div
            key={index}
            className={styles.conversionItem}
            onClick={() => handleCopy(result.amount, index)}
          >
            {result.icon}
            <div className={styles.conversionText}>
              <span>{result.amount}</span>
              <span>{result.currency}</span>
            </div>
            {copiedIndex === index && (
              <FontAwesomeIcon
                icon={faClipboardCheck}
                className={styles.copiedIcon} // Add appropriate styling
              />
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

const Calculator = () => {
  const { currency, setCurrency } = useCurrency();
  const [selectedCurrency, setSelectedCurrency] = useState('GP')
  const [conversionResult, setConversionResult] = useState([])
  const [copiedIndex, setCopiedIndex] = useState(null);

  const handleCopy = (amount, index) => {
    navigator.clipboard.writeText(amount)
      .then(() => {
        setCopiedIndex(index);
        setTimeout(() => setCopiedIndex(null), 2000);
      })
      .catch((err) => {
        console.error("Failed to copy: ", err);
      });
  };

  const handleCurrencyChange = (e) => {
    const newAmount = parseFloat(e.target.value) || 0
    setCurrency(newAmount)
  }

  const handleCurrencyTypeChange = (e) => {
    const newType = e.target.value
    setSelectedCurrency(newType)
  }

  const updateConversionResult = (type, amount) => {
    setConversionResult(convertCurrency(type, amount))
  }

  useEffect(() => {
    updateConversionResult(selectedCurrency, currency);
  }, [currency, selectedCurrency]);

  const calculatorProps = {
    conversionResult,
    currency,
    handleCurrencyChange,
    handleCurrencyTypeChange,
    selectedCurrency,
    copiedIndex,
    handleCopy,
  }

  return (
    <View
      {...calculatorProps}
    />
  )
}

export default Calculator
