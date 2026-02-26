"use client"

import { motion, AnimatePresence } from "framer-motion"
import { useState, useEffect, useCallback } from "react"
import itemsData from './items.json'
import {
  convertToDnDCurrency,
  formatDuration,
  handleFocus,
  preventNonNumeric,
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
  const currentItem = itemsData.find(item => item.item === selectedItem)

  return (
    <div className="flex flex-col gap-4 w-full">
      <h2 className="text-2xl font-bold font-cinzel">Mount Calculator</h2>

      <GlassPanel corona className="p-6 flex flex-col gap-0">
        {/* Result Readout */}
        <div className="py-8 flex flex-col items-center gap-2">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Estimated Cost</h3>
          <AnimatePresence mode="wait">
            <motion.div
              key={totalCost}
              className="text-3xl sm:text-4xl font-bold font-cinzel text-primary"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
            >
              {totalCost > 0 ? convertToDnDCurrency(totalCost) : "\u2014"}
            </motion.div>
          </AnimatePresence>
          <AnimatePresence>
            {totalDays && (
              <motion.div
                className="flex flex-col items-center gap-1 mt-2"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
              >
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Travel Time</h3>
                <div className="text-lg sm:text-xl font-bold text-primary">{totalDays}</div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Divider */}
        <div className="w-12 h-px bg-white/[0.06] mx-auto my-2" />

        {/* Input Group 1: Mount + Type */}
        <div className="flex flex-col gap-4 pt-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5 group">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground transition-colors duration-200 group-focus-within:text-primary/70">Mount</Label>
              <Select value={selectedItem} onValueChange={(val) => setSelectedItem(val)}>
                <SelectTrigger className="bg-white/[0.03] border-white/[0.06] transition-all duration-200 focus:border-primary/40 focus:shadow-[0_0_8px_-3px] focus:shadow-primary/20">
                  <SelectValue placeholder="Select a Mount" />
                </SelectTrigger>
                <SelectContent>
                  {itemsData.map((item, index) => (
                    <SelectItem key={index} value={item.item}>
                      {item.item} - {convertToDnDCurrency(item.baseCost)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {currentItem?.types && (
              <div className="flex flex-col gap-1.5 group">
                <Label className="text-xs uppercase tracking-wider text-muted-foreground transition-colors duration-200 group-focus-within:text-primary/70">Type</Label>
                <Select value={selectedType} onValueChange={(val) => setSelectedType(val)}>
                  <SelectTrigger className="bg-white/[0.03] border-white/[0.06] transition-all duration-200 focus:border-primary/40 focus:shadow-[0_0_8px_-3px] focus:shadow-primary/20">
                    <SelectValue placeholder="Select Type" />
                  </SelectTrigger>
                  <SelectContent>
                    {currentItem.types.map((type, index) => (
                      <SelectItem key={index} value={type.type}>{type.type}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        </div>

        {/* Specials (conditional) */}
        {currentItem?.specials && (
          <>
            <div className="w-12 h-px bg-white/[0.06] mx-auto my-4" />
            <div className="flex flex-col gap-2">
              {currentItem.specials.map((special, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Checkbox
                    id={`special-${index}`}
                    checked={selectedFeatures.includes(special.feature)}
                    onCheckedChange={(checked) => handleFeatureChange(special.feature, !!checked)}
                  />
                  <Label
                    htmlFor={`special-${index}`}
                    className={selectedFeatures.includes(special.feature) ? "text-foreground" : "text-muted-foreground"}
                  >
                    {special.feature} (+{special.additionalCost} gp)
                  </Label>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Divider */}
        <div className="w-12 h-px bg-white/[0.06] mx-auto my-4" />

        {/* Input Group: Miles */}
        <div className="flex flex-col gap-1.5 max-w-xs group">
          <Label className="text-xs uppercase tracking-wider text-muted-foreground transition-colors duration-200 group-focus-within:text-primary/70">Miles</Label>
          <Input
            type="number"
            value={miles}
            onChange={(e) => setMiles(parseInt(e.target.value, 10) || 0)}
            onBlur={handleBlur(miles)}
            onFocus={handleFocus}
            onKeyDown={preventNonNumeric}
            className="bg-white/[0.03] border-white/[0.06] text-right transition-all duration-200 focus:border-primary/40 focus:shadow-[0_0_8px_-3px] focus:shadow-primary/20"
          />
        </div>
      </GlassPanel>
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
