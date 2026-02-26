"use client"

import { useReducer, useEffect, useCallback, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import transportationData from "./travel.json"
import { convertToDnDCurrency, formatDuration, handleFocus, preventNonNumeric } from "./helper"
import { useCurrency } from "../../providers/CurrencyContext"
import { GlassPanel } from "@/app/components/ui/GlassPanel"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

type Rate = {
  value: number
  multiplier: number
  unitWeight: number
}

function parseRate(rateString: string | undefined): Rate {
  if (!rateString) return { value: 0, multiplier: 0, unitWeight: Infinity }
  const parts = rateString.split(' ')
  const value = parseFloat(parts[0])
  const unit = parts[1]
  const perUnitWeight = parts.length > 5 ? parseInt(parts[5], 10) : 100

  const multiplier = unit === 'gp' ? 1 : unit === 'sp' ? 0.1 : unit === 'cp' ? 0.01 : 0
  return { value, multiplier, unitWeight: perUnitWeight }
}

function computeTravelTime(transportData: any, distance: number): string {
  if (!transportData || !transportData.perDay) return ""
  if (transportData.speed === "Instant") return "Instant"

  const [milesPerDayStr] = transportData.perDay.split(' ')
  const miles = parseInt(milesPerDayStr, 10)

  if (distance < miles) {
    const hours = Math.floor(distance / miles)
    const totalMinutes = (distance / miles * 60)
    const minutes = Math.floor(totalMinutes % 60)
    const seconds = Math.floor((totalMinutes * 60) % 60)
    return formatDuration(0, hours, minutes, seconds)
  }

  const days = Math.floor(distance / miles)
  const totalHours = (distance / miles * 24)
  const hours = Math.floor(totalHours % 24)
  const totalMinutes = (totalHours * 60)
  const minutes = Math.floor(totalMinutes % 60)
  const seconds = Math.floor((totalMinutes * 60) % 60)
  return formatDuration(days, hours, minutes, seconds)
}

function computeTravelCost(transportData: any, distance: number, cargoWeight: number): number {
  if (!transportData?.fare) return 0

  const fareRate = parseRate(transportData.fare)
  let fareCost = 0
  if (transportData.speed === "Instant") {
    fareCost = fareRate.value
  } else {
    fareCost = fareRate.value * distance * fareRate.multiplier
  }

  let cargoCostGP = 0
  if (transportData.cargoRate) {
    const cargoRate = parseRate(transportData.cargoRate)
    if (cargoWeight >= cargoRate.unitWeight) {
      const totalCargoCost = (cargoRate.value * distance * cargoWeight) / cargoRate.unitWeight
      cargoCostGP = totalCargoCost * cargoRate.multiplier
    }
  }

  return fareCost + cargoCostGP
}

type State = {
  selectedTransport: string
  distance: number
  cargoWeight: number
}

type Action =
  | { type: "SET_TRANSPORT"; payload: string }
  | { type: "SET_DISTANCE"; payload: number }
  | { type: "SET_CARGO_WEIGHT"; payload: number }

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "SET_TRANSPORT":
      return { ...state, selectedTransport: action.payload }
    case "SET_DISTANCE":
      return { ...state, distance: action.payload }
    case "SET_CARGO_WEIGHT":
      return { ...state, cargoWeight: action.payload }
    default:
      return state
  }
}

const View = ({
  selectedTransport,
  onTransportChange,
  transportationData,
  selectedTransportData,
  onDistanceChange,
  onDistanceBlur,
  distance,
  onWeightBlur,
  cargoWeight,
  onCargoWeightChange,
  totalCost,
  totalDays,
}) => {
  return (
    <div className="flex flex-col gap-4 w-full">
      <h2 className="text-2xl font-bold font-cinzel">Transportation Calculator</h2>

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

        {/* Inputs: Transport + Miles + Weight */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-6">
          <div className="flex flex-col gap-1.5 group">
            <Label className="text-xs uppercase tracking-wider text-muted-foreground transition-colors duration-200 group-focus-within:text-primary/70">Transportation</Label>
            <Select
              value={selectedTransport}
              onValueChange={onTransportChange}
            >
              <SelectTrigger className="bg-white/[0.03] border-white/[0.06] transition-all duration-200 focus:border-primary/40 focus:shadow-[0_0_8px_-3px] focus:shadow-primary/20">
                <SelectValue placeholder="Select Transportation" />
              </SelectTrigger>
              <SelectContent>
                {transportationData.map((option, index) => (
                  <SelectItem key={index} value={option.type}>
                    {option.type} - {option.fare}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedTransportData.speed !== "Instant" && (
            <>
              <div className="flex flex-col gap-1.5 group">
                <Label className="text-xs uppercase tracking-wider text-muted-foreground transition-colors duration-200 group-focus-within:text-primary/70">Miles</Label>
                <Input
                  type="number"
                  onChange={onDistanceChange}
                  value={distance}
                  onFocus={handleFocus}
                  onBlur={onDistanceBlur}
                  onKeyDown={preventNonNumeric}
                  className="bg-white/[0.03] border-white/[0.06] text-right transition-all duration-200 focus:border-primary/40 focus:shadow-[0_0_8px_-3px] focus:shadow-primary/20"
                />
              </div>

              {selectedTransportData.cargoRate && (
                <div className="flex flex-col gap-1.5 group">
                  <Label className="text-xs uppercase tracking-wider text-muted-foreground transition-colors duration-200 group-focus-within:text-primary/70">Weight (lbs)</Label>
                  <Input
                    type="number"
                    value={cargoWeight}
                    onChange={onCargoWeightChange}
                    onFocus={handleFocus}
                    onBlur={onWeightBlur}
                    onKeyDown={preventNonNumeric}
                    className="bg-white/[0.03] border-white/[0.06] text-right transition-all duration-200 focus:border-primary/40 focus:shadow-[0_0_8px_-3px] focus:shadow-primary/20"
                  />
                </div>
              )}
            </>
          )}
        </div>
      </GlassPanel>
    </div>
  )
}

const TransportationCalculator = () => {
  const [state, dispatch] = useReducer(reducer, {
    selectedTransport: '',
    distance: 0,
    cargoWeight: 0,
  })

  const { setCurrency } = useCurrency()

  const selectedTransportData = useMemo(
    () => transportationData.find(t => t.type === state.selectedTransport) || {},
    [state.selectedTransport]
  )

  const totalCost = useMemo(
    () => computeTravelCost(selectedTransportData, state.distance, state.cargoWeight),
    [selectedTransportData, state.distance, state.cargoWeight]
  )

  const totalDays = useMemo(
    () => state.selectedTransport ? computeTravelTime(selectedTransportData, state.distance) : "",
    [state.selectedTransport, selectedTransportData, state.distance]
  )

  useEffect(() => {
    setCurrency(totalCost)
  }, [setCurrency, totalCost])

  const onTransportChange = useCallback((val: string) => {
    dispatch({ type: "SET_TRANSPORT", payload: val })
  }, [])

  const onDistanceChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    dispatch({ type: "SET_DISTANCE", payload: parseFloat(e.target.value) || 0 })
  }, [])

  const onDistanceBlur = useCallback((e: React.FocusEvent<HTMLInputElement>) => {
    if (e.target.value === '') {
      dispatch({ type: "SET_DISTANCE", payload: 0 })
      e.target.value = '0'
    }
  }, [])

  const onCargoWeightChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    dispatch({ type: "SET_CARGO_WEIGHT", payload: parseFloat(e.target.value) || 0 })
  }, [])

  const onWeightBlur = useCallback((e: React.FocusEvent<HTMLInputElement>) => {
    if (e.target.value === '') {
      dispatch({ type: "SET_CARGO_WEIGHT", payload: 0 })
      e.target.value = '0'
    }
  }, [])

  const viewProps = useMemo(() => ({
    selectedTransport: state.selectedTransport,
    onTransportChange,
    transportationData,
    selectedTransportData,
    onDistanceChange,
    onDistanceBlur,
    distance: state.distance,
    onWeightBlur,
    cargoWeight: state.cargoWeight,
    onCargoWeightChange,
    totalCost,
    totalDays,
  }), [state, onTransportChange, selectedTransportData, onDistanceChange, onDistanceBlur, onWeightBlur, onCargoWeightChange, totalCost, totalDays])

  return <View {...viewProps} />
}

export default TransportationCalculator
