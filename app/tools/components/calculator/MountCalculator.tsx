"use client"

import { motion, AnimatePresence } from "framer-motion"
import { useState, useEffect, useCallback } from "react"
import itemsData from './items.json'
import {
  convertToDnDCurrency,
  formatDuration,
  handleFocus,
} from "./helper"
import { useCurrency } from "../../providers/CurrencyContext"
import { GlassPanel } from "@/app/components/ui/GlassPanel"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"

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
    <div className="flex flex-col gap-6 w-full">
      <h2 className="text-2xl font-bold">Mount Calculator</h2>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        {/* Left: Form (3 cols) */}
        <GlassPanel className="md:col-span-3 p-6 flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="mount-select">Select a Mount</Label>
            <Select value={selectedItem} onValueChange={(val) => setSelectedItem(val)}>
              <SelectTrigger id="mount-select">
                <SelectValue placeholder="Select a Mount" />
              </SelectTrigger>
              <SelectContent>
                {itemsData.map((item, index) => (
                  <SelectItem
                    key={index}
                    value={item.item}
                  >
                    {item.item} - {convertToDnDCurrency(item.baseCost)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedItem && itemsData.find(item => item.item === selectedItem)?.types && (
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="type-select">Select Type</Label>
              <Select value={selectedType} onValueChange={(val) => setSelectedType(val)}>
                <SelectTrigger id="type-select">
                  <SelectValue placeholder="Select Type" />
                </SelectTrigger>
                <SelectContent>
                  {itemsData.find(item => item.item === selectedItem).types.map((type, index) => (
                    <SelectItem
                      key={index}
                      value={type.type}
                    >
                      {type.type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {itemsData.find(item => item.item === selectedItem)?.specials && (
            <div className="flex flex-col gap-2">
              {itemsData.find(item => item.item === selectedItem).specials.map((special, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Checkbox
                    id={`special-${index}`}
                    checked={selectedFeatures.includes(special.feature)}
                    onCheckedChange={(checked) => handleFeatureChange(special.feature, !!checked)}
                  />
                  <Label htmlFor={`special-${index}`}>
                    {special.feature} (+{special.additionalCost} gp)
                  </Label>
                </div>
              ))}
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="miles-input">Miles</Label>
            <Input
              id="miles-input"
              type="number"
              value={miles}
              onChange={(e) => setMiles(parseInt(e.target.value, 10) || 0)}
              onBlur={handleBlur(miles)}
              onFocus={handleFocus}
            />
          </div>
        </GlassPanel>

        {/* Right: Result (2 cols) */}
        <GlassPanel corona className="md:col-span-2 p-6 flex flex-col items-center justify-center gap-4">
          <h3 className="text-lg font-semibold text-muted-foreground">Estimated Cost</h3>
          <div className="text-4xl font-bold text-primary">
            {totalCost > 0 ? convertToDnDCurrency(totalCost) : "\u2014"}
          </div>
          <AnimatePresence>
            {totalDays && (
              <motion.div
                className="text-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <h3 className="text-lg font-semibold text-muted-foreground">Travel Time</h3>
                <div className="text-2xl font-bold text-primary">{totalDays}</div>
              </motion.div>
            )}
          </AnimatePresence>
        </GlassPanel>
      </div>
    </div>
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
