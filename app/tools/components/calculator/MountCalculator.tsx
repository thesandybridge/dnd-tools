"use client"

import { motion, AnimatePresence } from "framer-motion"
import styles from "./calculator.module.css"
import { useState, useEffect, useCallback } from "react"
import itemsData from './items.json'
import {
  convertToDnDCurrency,
  formatDuration,
  handleFocus,
} from "./helper"
import Banner from "../Banner"
import { useCurrency } from "../../providers/CurrencyContext"

const View = ({
  totalCost,
  totalDays,
  selectedItem,
  setSelectedItem,
  itemsData,
  selectedType,
  selectedFeatures,
  setSelectedType,
  setMiles,
  handleBlur,
  handleFocus,
  handleFeatureChange,
  miles,
}) => {
  return (
    <>
      <div className={styles.calculatorItem}>
        <Banner image="/images/mounts.png">
          <h2>Mount Calculator</h2>
          <AnimatePresence>
            {totalCost > 0 && (
              <motion.div
                className={styles.totals}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                Total Cost: {convertToDnDCurrency(totalCost)}
              </motion.div>
            )}
          </AnimatePresence>
        </Banner>
        <AnimatePresence>
          {totalDays && (
            <motion.div
              className={styles.totals}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              Total Time: {totalDays}
            </motion.div>
          )}
        </AnimatePresence>
        <select value={selectedItem} onChange={(e) => setSelectedItem(e.target.value)}>
          <option value="">Select a Mount</option>
          {itemsData.map((item, index) => (
            <option
              key={index}
              value={item.item}
            >
              {item.item} - {convertToDnDCurrency(item.baseCost)}
            </option>
          ))}
        </select>

        {selectedItem && itemsData.find(item => item.item === selectedItem)?.types && (
          <select value={selectedType} onChange={(e) => setSelectedType(e.target.value)}>
            <option value="">Select Type</option>
            {itemsData.find(item => item.item === selectedItem).types.map((type, index) => (
              <option key={index} value={type.type}>{type.type}</option>
            ))}
          </select>
        )}

        {itemsData.find(item => item.item === selectedItem)?.specials && (
          itemsData.find(item => item.item === selectedItem).specials.map((special, index) => (
            <div key={index}>
              <label>
                <input
                  type="checkbox"
                  checked={selectedFeatures.includes(special.feature)}
                  onChange={(e) => handleFeatureChange(special.feature, e.target.checked)}
                />
                {special.feature} (+{special.additionalCost} gp)
              </label>
            </div>
          ))
        )}

        <label>
          <input
            type="number"
            min="0"
            value={miles}
            onChange={(e) => setMiles(parseInt(e.target.value, 10) || 0)}
            placeholder="Miles (if applicable)"
            onBlur={handleBlur(miles)}
            onFocus={handleFocus}
          />
          Miles
        </label>
      </div>
    </>
  )
}

export default function MountCalculator() {
  const [selectedItem, setSelectedItem] = useState('')
  const [selectedType, setSelectedType] = useState('')
  const [selectedFeatures, setSelectedFeatures] = useState([])
  const [miles, setMiles] = useState(0)
  const [totalCost, setTotalCost] = useState(0)
  const [totalDays, setTotalDays] = useState("")

  const { setCurrency } = useCurrency()

  useEffect(() => {
    setSelectedType('')
    setSelectedFeatures([])
    setTotalCost(0)
  }, [selectedItem])

  useEffect(() => {
    setCurrency(totalCost)
  }, [setCurrency, totalCost])

  const handleFeatureChange = (feature, isChecked) => {
    setSelectedFeatures(prev =>
      isChecked ? [...prev, feature] : prev.filter(f => f !== feature)
    )
  }

  const handleBlur = () => (e) => {
    if (e.target.value === '') {
      setMiles(0)
      e.target.value = '0'
    }
  }

  const calculateTotalCost = useCallback(() => {
    const item = itemsData.find(i => i.item === selectedItem)
    if (!item) return

    let cost = item.baseCost

    const typeCost = item.types?.find(type => type.type === selectedType)?.additionalCost || 0
    cost += typeCost

    item.specials?.forEach(({ feature, additionalCost }) => {
      if (selectedFeatures.includes(feature)) {
        cost += additionalCost
      }
    })

    if (item.perDay && miles > 0) {
      const perDayMiles = parseInt(item.perDay.split(' ')[0], 10)
      const perMileCost = item.baseCost / perDayMiles
      cost += perMileCost * miles
    }

    if (item.perDay) {
      const [distance] = item.perDay.split(' ')

      if (miles < distance) {
        const hours = Math.floor(miles / distance)
        const totalMinutes = (miles / distance * 60)
        const minutes = Math.floor(totalMinutes % 60)
        const seconds = Math.floor((totalMinutes * 60) % 60)
        setTotalDays(formatDuration(0, hours, minutes, seconds))
      } else {
        const days = Math.floor(miles / distance)
        const totalHours = (miles / distance * 24)
        const hours = Math.floor(totalHours % 24)
        const totalMinutes = (totalHours * 60)
        const minutes = Math.floor(totalMinutes % 60)
        const seconds = Math.floor((totalMinutes * 60) % 60)
        setTotalDays(formatDuration(days, hours, minutes, seconds))
      }
    }

    setTotalCost(cost)
  }, [miles, selectedFeatures, selectedItem, selectedType])

  useEffect(() => {
    calculateTotalCost()
  }, [selectedItem, selectedType, selectedFeatures, miles, calculateTotalCost])

  const mountCalculatorProps = {
    totalCost,
    totalDays,
    selectedItem,
    setSelectedItem,
    itemsData,
    selectedType,
    setSelectedType,
    selectedFeatures,
    setMiles,
    handleBlur,
    handleFocus,
    handleFeatureChange,
    miles,
  }

  return (
    <View
      {...mountCalculatorProps}
    />
  )
}
