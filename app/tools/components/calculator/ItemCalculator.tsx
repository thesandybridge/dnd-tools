"use client"

import { motion, AnimatePresence } from "framer-motion"
import { useState, useEffect, useCallback } from 'react'
import {
  convertToDnDCurrency,
  handleFocus
} from './helper'
import Banner from '../Banner'
import { useCurrency } from "../../providers/CurrencyContext"
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
    <>
      <div className="p-4 border border-border rounded-lg flex flex-col gap-4 max-w-[900px] w-full overflow-y-auto">
        <Banner image="/images/blacksmith.png">
          <h2>Item Calculator</h2>
          <AnimatePresence>
            {gp > 0 && (
              <motion.div
                className="border border-primary p-4 sticky bottom-0 bg-background"
                style={{ marginTop: '20px' }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                Total Price {convertToDnDCurrency(gp)}
              </motion.div>
            )}
          </AnimatePresence>
        </Banner>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label>Select Rarity</Label>
            <Select value={rarity} onValueChange={setRarity}>
              <SelectTrigger>
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
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <Checkbox
                id="consumable"
                checked={isConsumable}
                onCheckedChange={setIsConsumable}
              />
              <Label htmlFor="consumable">Consumable</Label>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="requires-attunement"
                checked={requiresAttunement}
                onCheckedChange={setRequiresAttunement}
              />
              <Label htmlFor="requires-attunement">Requires Attunement</Label>
            </div>
          </div>
          <div className="flex gap-4 flex-wrap">
            {Object.keys(attributes).map((attr) => (
              <div key={attr} className="flex-1 basis-[calc(50%-1rem)] max-md:basis-full">
                <div className="flex flex-col gap-1.5">
                  <Label>{attr.replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase())}</Label>
                  <Input
                    type="number"
                    value={attributes[attr]}
                    onChange={handleAttributeChange(attr)}
                    onFocus={handleFocus}
                    onBlur={handleBlur(attr)}
                    placeholder={attr.replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase())}
                  />
                </div>
              </div>
            ))}
          </div>
          {reset && (
            <Button
              onClick={resetValues}
              variant="outline"
            >
              Reset to Defaults
            </Button>
          )}
        </div>
      </div>
    </>
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
