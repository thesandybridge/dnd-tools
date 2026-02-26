"use client"

import { useState, useEffect, useCallback } from 'react'
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

const View = ({
  rarity,
  setRarity,
  isConsumable,
  setIsConsumable,
  requiresAttunement,
  setRequiresAttunement,
  attributes,
  handleAttributeChange,
  handleBlur,
  gp,
  resetValues,
  reset,
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
            <Select value={rarity} onValueChange={setRarity}>
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
                onCheckedChange={setIsConsumable}
              />
              <Label htmlFor="consumable" className={isConsumable ? "text-foreground" : "text-muted-foreground"}>Consumable</Label>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="requires-attunement"
                checked={requiresAttunement}
                onCheckedChange={setRequiresAttunement}
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
                onChange={handleAttributeChange(attr)}
                onFocus={handleFocus}
                onBlur={handleBlur(attr)}
                onKeyDown={preventNonNumeric}
                className="bg-white/[0.03] border-white/[0.06] text-right transition-all duration-200 focus:border-primary/40 focus:shadow-[0_0_8px_-3px] focus:shadow-primary/20"
              />
            </div>
          ))}
        </div>

        {/* Reset */}
        {reset && (
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
  const [rarity, setRarity] = useState('')
  const [isConsumable, setIsConsumable] = useState(false)
  const [requiresAttunement, setRequiresAttunement] = useState(false)
  const [attributes, setAttributes] = useState({
    attackDamage: 0,
    spellAttackDC: 0,
    armorClass: 0,
    savingThrow: 0,
    proficiency: 0,
    resistances: 0,
    immunities: 0,
    spellLevel: 0
  })
  const [gp, setGp] = useState(0)
  const [reset, setReset] = useState(true)

  const resetValues = () => {
    setRarity('')
    setIsConsumable(false)
    setRequiresAttunement(false)
    setAttributes({
      attackDamage: 0,
      spellAttackDC: 0,
      armorClass: 0,
      savingThrow: 0,
      proficiency: 0,
      resistances: 0,
      immunities: 0,
      spellLevel: 0
    })
    setGp(0)
    setReset(false)
  }

  useEffect(() => {
    const isChanged =
      rarity !== '' ||
      isConsumable !== false ||
      requiresAttunement !== false ||
      Object.values(attributes).some((value) => value !== 0)

    setReset(isChanged)
  }, [rarity, isConsumable, requiresAttunement, attributes])

  const handleAttributeChange = useCallback((attribute) => (e) => {
    const value = parseInt(e.target.value, 10) || 0
    setAttributes(prev => ({ ...prev, [attribute]: value }))
  }, [])

  const handleBlur = (attribute) => (e) => {
    if (e.target.value === '') {
      setAttributes(prev => ({ ...prev, [attribute]: 0 }))
      e.target.value = '0'
    }
  }

  const calculatePointsAndGp = useCallback(() => {
    const rarityPointsMap = {
      'Common': 1,
      'Uncommon': 1,
      'Rare': 2,
      'Very Rare': 3,
      'Legendary': 4
    }
    const gpMultiplierMap = {
      'Common': 10,
      'Uncommon': 100,
      'Rare': 1000,
      'Very Rare': 5000,
      'Legendary': 10000
    }

    let basePoints = rarityPointsMap[rarity] || 0

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
          return acc + value
        case "resistances":
          return acc + (value * 1)
        case "immunities":
          return acc + (value * 3)
        case "spellLevel":
          return acc + value
        default:
          return acc
      }
    }, 0)

    // Step 4: Add base points and bonus points together
    let finalPoints = basePoints + totalBonusPoints

    // Step 5: If item is consumable, divide points by 2
    if (isConsumable) {
      finalPoints /= 2
    }

    // Step 6: Calculate total gold cost based on rarity multiplier
    const totalGp = finalPoints * (gpMultiplierMap[rarity] || 0)

    setGp(totalGp)
  }, [attributes, rarity, isConsumable, requiresAttunement])

  useEffect(() => {
    setCurrency(gp)
  }, [setCurrency, gp])

  useEffect(() => {
    calculatePointsAndGp()
  }, [attributes, rarity, isConsumable, requiresAttunement, calculatePointsAndGp])

  const itemCalculatorProps = {
    rarity,
    setRarity,
    isConsumable,
    setIsConsumable,
    requiresAttunement,
    setRequiresAttunement,
    handleBlur,
    attributes,
    handleAttributeChange,
    gp,
    resetValues,
    reset,
  }

  return (
    <View
      {...itemCalculatorProps}
    />
  )
}

export default ItemCalculator
