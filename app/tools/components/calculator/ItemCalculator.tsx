"use client"

import { useReducer, useEffect, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from "framer-motion"
import {
  convertToDnDCurrency,
  handleFocus,
  preventNonNumeric,
} from './helper'
import { useCurrency } from "../../providers/CurrencyContext"
import { GlassPanel } from "@/app/components/ui/GlassPanel"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"

const RARITY_POINTS: Record<string, number> = {
  'Common': 1,
  'Uncommon': 1,
  'Rare': 2,
  'Very Rare': 3,
  'Legendary': 4,
}

const GP_MULTIPLIER: Record<string, number> = {
  'Common': 10,
  'Uncommon': 100,
  'Rare': 1000,
  'Very Rare': 5000,
  'Legendary': 10000,
}

type Attributes = {
  attackDamage: number
  spellAttackDC: number
  armorClass: number
  savingThrow: number
  proficiency: number
  resistances: number
  immunities: number
  spellLevel: number
}

const DEFAULT_ATTRIBUTES: Attributes = {
  attackDamage: 0,
  spellAttackDC: 0,
  armorClass: 0,
  savingThrow: 0,
  proficiency: 0,
  resistances: 0,
  immunities: 0,
  spellLevel: 0,
}

function calculatePointsAndGp(
  rarity: string,
  isConsumable: boolean,
  requiresAttunement: boolean,
  attributes: Attributes
): number {
  let basePoints = RARITY_POINTS[rarity] || 0

  if (!requiresAttunement && !isConsumable) {
    basePoints *= 2
  }

  const totalBonusPoints = Object.entries(attributes).reduce((acc, [key, value]) => {
    switch (key) {
      case "attackDamage":
      case "armorClass":
      case "savingThrow":
      case "spellAttackDC":
      case "proficiency":
      case "spellLevel":
        return acc + value
      case "resistances":
        return acc + value
      case "immunities":
        return acc + (value * 3)
      default:
        return acc
    }
  }, 0)

  let finalPoints = basePoints + totalBonusPoints

  if (isConsumable) {
    finalPoints /= 2
  }

  return finalPoints * (GP_MULTIPLIER[rarity] || 0)
}

type State = {
  rarity: string
  isConsumable: boolean
  requiresAttunement: boolean
  attributes: Attributes
}

type Action =
  | { type: "SET_RARITY"; payload: string }
  | { type: "TOGGLE_CONSUMABLE"; payload: boolean }
  | { type: "TOGGLE_ATTUNEMENT"; payload: boolean }
  | { type: "SET_ATTRIBUTE"; key: keyof Attributes; value: number }
  | { type: "RESET" }

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "SET_RARITY":
      return { ...state, rarity: action.payload }
    case "TOGGLE_CONSUMABLE":
      return { ...state, isConsumable: action.payload }
    case "TOGGLE_ATTUNEMENT":
      return { ...state, requiresAttunement: action.payload }
    case "SET_ATTRIBUTE":
      return { ...state, attributes: { ...state.attributes, [action.key]: action.value } }
    case "RESET":
      return { rarity: '', isConsumable: false, requiresAttunement: false, attributes: { ...DEFAULT_ATTRIBUTES } }
    default:
      return state
  }
}

const View = ({
  rarity,
  isConsumable,
  requiresAttunement,
  attributes,
  handleAttributeChange,
  handleBlur,
  gp,
  resetValues,
  isDirty,
  onRarityChange,
  onConsumableChange,
  onAttunementChange,
}) => {
  return (
    <div className="flex flex-col gap-4 w-full">
      <h2 className="text-2xl font-bold font-cinzel">Item Calculator</h2>

      <GlassPanel corona className="p-6 flex flex-col gap-0">
        {/* Result Readout */}
        <div className="py-8 flex flex-col items-center gap-2">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Estimated Price</h3>
          <AnimatePresence mode="wait">
            <motion.div
              key={gp}
              className="text-3xl sm:text-4xl font-bold font-cinzel text-primary"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
            >
              {gp > 0 ? convertToDnDCurrency(gp) : "\u2014"}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Divider */}
        <div className="w-12 h-px bg-white/[0.06] mx-auto my-2" />

        {/* Input Group 1: Rarity + Options */}
        <div className="flex flex-col sm:flex-row sm:items-end gap-4 pt-6">
          <div className="flex-1 flex flex-col gap-1.5 group">
            <Label className="text-xs uppercase tracking-wider text-muted-foreground transition-colors duration-200 group-focus-within:text-primary/70">Rarity</Label>
            <Select value={rarity} onValueChange={onRarityChange}>
              <SelectTrigger className="bg-white/[0.03] border-white/[0.06] transition-all duration-200 focus:border-primary/40 focus:shadow-[0_0_8px_-3px] focus:shadow-primary/20">
                <SelectValue placeholder="Select Rarity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Common">Common</SelectItem>
                <SelectItem value="Uncommon">Uncommon</SelectItem>
                <SelectItem value="Rare">Rare</SelectItem>
                <SelectItem value="Very Rare">Very Rare</SelectItem>
                <SelectItem value="Legendary">Legendary</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-6 sm:pb-2">
            <div className="flex items-center gap-2">
              <Checkbox
                id="consumable"
                checked={isConsumable}
                onCheckedChange={onConsumableChange}
              />
              <Label htmlFor="consumable" className={isConsumable ? "text-foreground" : "text-muted-foreground"}>Consumable</Label>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="requires-attunement"
                checked={requiresAttunement}
                onCheckedChange={onAttunementChange}
              />
              <Label htmlFor="requires-attunement" className={requiresAttunement ? "text-foreground" : "text-muted-foreground"}>Requires Attunement</Label>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="w-12 h-px bg-white/[0.06] mx-auto my-4" />

        {/* Input Group 2: Attributes */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {Object.keys(attributes).map((attr) => (
            <div key={attr} className="flex flex-col gap-1.5 group">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground transition-colors duration-200 group-focus-within:text-primary/70">
                {attr.replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase())}
              </Label>
              <Input
                type="number"
                value={attributes[attr]}
                onChange={(e) => handleAttributeChange(attr, e)}
                onFocus={handleFocus}
                onBlur={(e) => handleBlur(attr, e)}
                onKeyDown={preventNonNumeric}
                className="bg-white/[0.03] border-white/[0.06] text-right transition-all duration-200 focus:border-primary/40 focus:shadow-[0_0_8px_-3px] focus:shadow-primary/20"
              />
            </div>
          ))}
        </div>

        {/* Reset */}
        {isDirty && (
          <div className="pt-4 flex justify-center">
            <Button variant="ghost" onClick={resetValues} className="text-xs uppercase tracking-wider text-muted-foreground">
              Reset to Defaults
            </Button>
          </div>
        )}
      </GlassPanel>
    </div>
  )
}

const ItemCalculator = () => {
  const { setCurrency } = useCurrency()
  const [state, dispatch] = useReducer(reducer, {
    rarity: '',
    isConsumable: false,
    requiresAttunement: false,
    attributes: { ...DEFAULT_ATTRIBUTES },
  })

  const gp = useMemo(
    () => calculatePointsAndGp(state.rarity, state.isConsumable, state.requiresAttunement, state.attributes),
    [state.rarity, state.isConsumable, state.requiresAttunement, state.attributes]
  )

  useEffect(() => {
    setCurrency(gp)
  }, [setCurrency, gp])

  const isDirty = useMemo(() => (
    state.rarity !== '' ||
    state.isConsumable !== false ||
    state.requiresAttunement !== false ||
    Object.values(state.attributes).some((v) => v !== 0)
  ), [state])

  const handleAttributeChange = useCallback((attr: string, e: React.ChangeEvent<HTMLInputElement>) => {
    dispatch({ type: "SET_ATTRIBUTE", key: attr as keyof Attributes, value: parseInt(e.target.value, 10) || 0 })
  }, [])

  const handleBlur = useCallback((attr: string, e: React.FocusEvent<HTMLInputElement>) => {
    if (e.target.value === '') {
      dispatch({ type: "SET_ATTRIBUTE", key: attr as keyof Attributes, value: 0 })
      e.target.value = '0'
    }
  }, [])

  const resetValues = useCallback(() => {
    dispatch({ type: "RESET" })
  }, [])

  const onRarityChange = useCallback((val: string) => {
    dispatch({ type: "SET_RARITY", payload: val })
  }, [])

  const onConsumableChange = useCallback((checked: boolean) => {
    dispatch({ type: "TOGGLE_CONSUMABLE", payload: checked })
  }, [])

  const onAttunementChange = useCallback((checked: boolean) => {
    dispatch({ type: "TOGGLE_ATTUNEMENT", payload: checked })
  }, [])

  const viewProps = useMemo(() => ({
    rarity: state.rarity,
    isConsumable: state.isConsumable,
    requiresAttunement: state.requiresAttunement,
    attributes: state.attributes,
    handleAttributeChange,
    handleBlur,
    gp,
    resetValues,
    isDirty,
    onRarityChange,
    onConsumableChange,
    onAttunementChange,
  }), [state, handleAttributeChange, handleBlur, gp, resetValues, isDirty, onRarityChange, onConsumableChange, onAttunementChange])

  return <View {...viewProps} />
}

export default ItemCalculator
