"use client"

import { motion, AnimatePresence } from "framer-motion"
import { useReducer, useEffect, useCallback, useMemo } from "react"
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

function parsePerDay(perDay: string): number {
  return parseInt(perDay.split(' ')[0], 10)
}

function computeTravelTime(perDay: string | undefined, miles: number): string {
  if (!perDay) return ""
  const milesPerDay = parsePerDay(perDay)
  if (milesPerDay <= 0) return ""

  if (miles < milesPerDay) {
    const hours = Math.floor(miles / milesPerDay)
    const totalMinutes = (miles / milesPerDay * 60)
    const minutes = Math.floor(totalMinutes % 60)
    const seconds = Math.floor((totalMinutes * 60) % 60)
    return formatDuration(0, hours, minutes, seconds)
  }

  const days = Math.floor(miles / milesPerDay)
  const totalHours = (miles / milesPerDay * 24)
  const hours = Math.floor(totalHours % 24)
  const totalMinutes = (totalHours * 60)
  const minutes = Math.floor(totalMinutes % 60)
  const seconds = Math.floor((totalMinutes * 60) % 60)
  return formatDuration(days, hours, minutes, seconds)
}

function computeMountCost(
  selectedItem: string,
  selectedType: string,
  selectedFeatures: string[],
  miles: number
): number {
  const item = itemsData.find(i => i.item === selectedItem)
  if (!item) return 0

  let cost = item.baseCost

  const typeCost = item.types?.find(type => type.type === selectedType)?.additionalCost || 0
  cost += typeCost

  item.specials?.forEach(({ feature, additionalCost }) => {
    if (selectedFeatures.includes(feature)) {
      cost += additionalCost
    }
  })

  if (item.perDay && miles > 0) {
    const perDayMiles = parsePerDay(item.perDay)
    const perMileCost = item.baseCost / perDayMiles
    cost += perMileCost * miles
  }

  return cost
}

type State = {
  selectedItem: string
  selectedType: string
  selectedFeatures: string[]
  miles: number
}

type Action =
  | { type: "SET_ITEM"; payload: string }
  | { type: "SET_TYPE"; payload: string }
  | { type: "SET_MILES"; payload: number }
  | { type: "TOGGLE_FEATURE"; feature: string; checked: boolean }

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "SET_ITEM":
      return { ...state, selectedItem: action.payload, selectedType: '', selectedFeatures: [] }
    case "SET_TYPE":
      return { ...state, selectedType: action.payload }
    case "SET_MILES":
      return { ...state, miles: action.payload }
    case "TOGGLE_FEATURE":
      return {
        ...state,
        selectedFeatures: action.checked
          ? [...state.selectedFeatures, action.feature]
          : state.selectedFeatures.filter(f => f !== action.feature),
      }
    default:
      return state
  }
}

const View = ({
  totalCost,
  totalDays,
  selectedItem,
  onItemChange,
  itemsData,
  selectedType,
  onTypeChange,
  selectedFeatures,
  onMilesChange,
  onMilesBlur,
  onFeatureChange,
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

        {/* Inputs: Mount + Type + Miles */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-6">
          <div className="flex flex-col gap-1.5 group">
            <Label className="text-xs uppercase tracking-wider text-muted-foreground transition-colors duration-200 group-focus-within:text-primary/70">Mount</Label>
            <Select value={selectedItem} onValueChange={onItemChange}>
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
              <Select value={selectedType} onValueChange={onTypeChange}>
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

          <div className="flex flex-col gap-1.5 group">
            <Label className="text-xs uppercase tracking-wider text-muted-foreground transition-colors duration-200 group-focus-within:text-primary/70">Miles</Label>
            <Input
              type="number"
              value={miles}
              onChange={onMilesChange}
              onBlur={onMilesBlur}
              onFocus={handleFocus}
              onKeyDown={preventNonNumeric}
              className="bg-white/[0.03] border-white/[0.06] text-right transition-all duration-200 focus:border-primary/40 focus:shadow-[0_0_8px_-3px] focus:shadow-primary/20"
            />
          </div>
        </div>

        {/* Specials (conditional) */}
        {currentItem?.specials && (
          <>
            <div className="w-12 h-px bg-white/[0.06] mx-auto my-4" />
            <div className="flex flex-wrap gap-x-6 gap-y-2">
              {currentItem.specials.map((special, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Checkbox
                    id={`special-${index}`}
                    checked={selectedFeatures.includes(special.feature)}
                    onCheckedChange={(checked) => onFeatureChange(special.feature, !!checked)}
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
      </GlassPanel>
    </div>
  )
}

export default function MountCalculator() {
  const [state, dispatch] = useReducer(reducer, {
    selectedItem: '',
    selectedType: '',
    selectedFeatures: [],
    miles: 0,
  })

  const { setCurrency } = useCurrency()

  const currentItemData = useMemo(
    () => itemsData.find(i => i.item === state.selectedItem),
    [state.selectedItem]
  )

  const totalCost = useMemo(
    () => computeMountCost(state.selectedItem, state.selectedType, state.selectedFeatures, state.miles),
    [state.selectedItem, state.selectedType, state.selectedFeatures, state.miles]
  )

  const totalDays = useMemo(
    () => computeTravelTime(currentItemData?.perDay, state.miles),
    [currentItemData, state.miles]
  )

  useEffect(() => {
    setCurrency(totalCost)
  }, [setCurrency, totalCost])

  const onItemChange = useCallback((val: string) => {
    dispatch({ type: "SET_ITEM", payload: val })
  }, [])

  const onTypeChange = useCallback((val: string) => {
    dispatch({ type: "SET_TYPE", payload: val })
  }, [])

  const onMilesChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    dispatch({ type: "SET_MILES", payload: parseInt(e.target.value, 10) || 0 })
  }, [])

  const onMilesBlur = useCallback((e: React.FocusEvent<HTMLInputElement>) => {
    if (e.target.value === '') {
      dispatch({ type: "SET_MILES", payload: 0 })
      e.target.value = '0'
    }
  }, [])

  const onFeatureChange = useCallback((feature: string, checked: boolean) => {
    dispatch({ type: "TOGGLE_FEATURE", feature, checked })
  }, [])

  const viewProps = useMemo(() => ({
    totalCost,
    totalDays,
    selectedItem: state.selectedItem,
    onItemChange,
    itemsData,
    selectedType: state.selectedType,
    onTypeChange,
    selectedFeatures: state.selectedFeatures,
    onMilesChange,
    onMilesBlur,
    onFeatureChange,
    miles: state.miles,
  }), [totalCost, totalDays, state, onItemChange, onTypeChange, onMilesChange, onMilesBlur, onFeatureChange])

  return <View {...viewProps} />
}
