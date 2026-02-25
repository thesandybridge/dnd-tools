"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import transportationData from "./travel.json"
import { convertToDnDCurrency, formatDuration, handleFocus, preventNonNumeric } from "./helper"
import { useCurrency } from "../../providers/CurrencyContext"
import { GlassPanel } from "@/app/components/ui/GlassPanel"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

const View = ({
  selectedTransport,
  setSelectedTransport,
  transportationData,
  selectedTransportData,
  setDistance,
  resetDistance,
  distance,
  resetWeight,
  cargoWeight,
  setCargoWeight,
  totalCost,
  totalDays,
}) => {
  return (
    <div className="flex flex-col gap-6 w-full">
      <h2 className="text-2xl font-bold font-cinzel">Transportation Calculator</h2>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        {/* Left: Form (3 cols) */}
        <GlassPanel className="md:col-span-3 p-6 flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label className="text-sm text-muted-foreground">Transportation</Label>
            <Select
              value={selectedTransport}
              onValueChange={(val) => setSelectedTransport(val)}
            >
              <SelectTrigger className="bg-white/[0.05] border-white/[0.08]">
                <SelectValue placeholder="Select Transportation" />
              </SelectTrigger>
              <SelectContent>
                {transportationData.map((option, index) => (
                  <SelectItem
                    key={index}
                    value={option.type}
                  >
                    {option.type} - {option.fare}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedTransportData.speed !== "Instant" && (
            <>
              <div className="flex flex-col gap-1.5 max-w-xs">
                <Label className="text-sm text-muted-foreground">Miles</Label>
                <Input
                  type="number"
                  onChange={(e) => setDistance(parseFloat(e.target.value) || 0)}
                  value={distance}
                  onFocus={handleFocus}
                  onBlur={resetDistance}
                  onKeyDown={preventNonNumeric}
                  className="bg-white/[0.05] border-white/[0.08]"
                />
              </div>

              {selectedTransportData.cargoRate && (
                <div className="flex flex-col gap-1.5 max-w-xs">
                  <Label className="text-sm text-muted-foreground">Weight (lbs)</Label>
                  <Input
                    type="number"
                    value={cargoWeight}
                    onChange={(e) => setCargoWeight(parseFloat(e.target.value) || 0)}
                    onFocus={handleFocus}
                    onBlur={resetWeight}
                    onKeyDown={preventNonNumeric}
                    className="bg-white/[0.05] border-white/[0.08]"
                  />
                </div>
              )}
            </>
          )}
        </GlassPanel>

        {/* Right: Result (2 cols) */}
        <GlassPanel corona className="md:col-span-2 p-6 flex flex-col items-center justify-center gap-4">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Estimated Cost</h3>
          <div className="text-2xl sm:text-3xl md:text-4xl font-bold text-primary whitespace-nowrap">
            {totalCost > 0 ? convertToDnDCurrency(totalCost) : "\u2014"}
          </div>
          {totalDays && (
            <>
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mt-2">Travel Time</h3>
              <div className="text-lg sm:text-xl md:text-2xl font-bold text-primary whitespace-nowrap">
                {totalDays}
              </div>
            </>
          )}
        </GlassPanel>
      </div>
    </div>
  )
}

/**
 * @typedef {Object} Rate
 * @property {number} value - The numeric value of the rate.
 * @property {number} multiplier - Multiplier for converting between different currency units.
 * @property {number} unitWeight - The unit weight for which the rate is applicable, default is 100 lbs.
 */

/**
 * TransportationCalculator is a React component that calculates the cost and duration of transportation
 * based on user inputs for distance and cargo weight. It uses a selected transportation type from a predefined
 * dataset to determine specific rates and speeds.
 *
 * @returns {JSX.Element} The rendered component which includes input fields for distance and weight, and displays the calculated total cost and time.
 */
const TransportationCalculator = () => {
  const [selectedTransport, setSelectedTransport] = useState('')
  const [distance, setDistance] = useState(0)
  const [cargoWeight, setCargoWeight] = useState(0)
  const [totalCost, setTotalCost] = useState(0)
  const [totalDays, setTotalDays] = useState("")

  const { setCurrency } = useCurrency()

  useEffect(() => {
    setCurrency(totalCost)
  }, [setCurrency, totalCost])

  const selectedTransportData = useMemo(() => {
    return transportationData.find(t => t.type === selectedTransport) || {}
  }, [selectedTransport])

  const resetDistance = () => (e) => {
    if (e.target.value === '') {
      setDistance(0)
      e.target.value = '0'
    }
  }

  const resetWeight = () => (e) => {
    if (e.target.value === '') {
      setCargoWeight(0)
      e.target.value = '0'
    }
  }

  const calculateTotalTime = useCallback((data) => {
    if (data.speed === "Instant") {
      setTotalDays("Instant")
      return
    }

    if (data.perDay) {
      const [milesPerDay] = data.perDay.split(' ')
      const miles = parseInt(milesPerDay, 10)

      if (distance < miles) {
        const hours = Math.floor(distance / miles)
        const totalMinutes = (distance / miles * 60)
        const minutes = Math.floor(totalMinutes % 60)
        const seconds = Math.floor((totalMinutes * 60) % 60)
        setTotalDays(formatDuration(0, hours, minutes, seconds))
      } else {
        const days = Math.floor(distance / miles)
        const totalHours = (distance / miles * 24)
        const hours = Math.floor(totalHours % 24)
        const totalMinutes = (totalHours * 60)
        const minutes = Math.floor(totalMinutes % 60)
        const seconds = Math.floor((totalMinutes * 60) % 60)
        setTotalDays(formatDuration(days, hours, minutes, seconds))
      }
    }
  }, [distance])

  const calculateCost = useCallback(() => {
    if (!selectedTransport) {
      setTotalCost(0)
      setTotalDays(0)
      return
    }

    const fareRate = parseRate(selectedTransportData.fare)
    let fareCost = 0
    if (selectedTransportData.speed === "Instant") {
      fareCost = fareRate.value
    } else {
      fareCost = fareRate.value * distance * fareRate.multiplier
    }

    let cargoCostGP = 0
    if (selectedTransportData.cargoRate) {
      const cargoRate = parseRate(selectedTransportData.cargoRate)
      if (cargoWeight >= cargoRate.unitWeight) {
        const totalCargoCost = (cargoRate.value * distance * cargoWeight) / cargoRate.unitWeight
        cargoCostGP = totalCargoCost * cargoRate.multiplier
      }
    }


    setTotalCost(fareCost + cargoCostGP)
  }, [selectedTransportData, distance, cargoWeight, selectedTransport])

  useEffect(() => {
    calculateCost()
    calculateTotalTime(selectedTransportData)
  }, [selectedTransportData, calculateCost, calculateTotalTime])



  const parseRate = (rateString) => {
    if (!rateString) return { value: 0, multiplier: 0, unitWeight: Infinity } // Handle no rate case
    const parts = rateString.split(' ')
    const value = parseFloat(parts[0])
    const unit = parts[1]
    const perUnitWeight = parts.length > 5 ? parseInt(parts[5], 10) : 100 // Default to 100 lbs if not specified

    const multiplier = unit === 'gp' ? 1 : unit === 'sp' ? 0.1 : unit === 'cp' ? 0.01 : 0
    return { value, multiplier, unitWeight: perUnitWeight }
  }

  const transportationCalculatorProps = {
    selectedTransport,
    setSelectedTransport,
    transportationData,
    selectedTransportData,
    setDistance,
    resetDistance,
    distance,
    resetWeight,
    cargoWeight,
    setCargoWeight,
    totalCost,
    totalDays,
  }

  return (
    <View
      {...transportationCalculatorProps}
    />
  )
}

export default TransportationCalculator
