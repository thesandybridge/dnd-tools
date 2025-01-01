"use client"

import { motion, AnimatePresence } from "framer-motion"
import { useState, useEffect, useCallback } from 'react'
import styles from './calculator.module.css'
import {
  convertToDnDCurrency,
  handleFocus
} from './helper'
import Banner from '../Banner'
import { useCurrency } from "../../providers/CurrencyContext"
import { FormControl, InputLabel, Select, MenuItem, Button, TextField, Checkbox, FormGroup, FormControlLabel, Box } from "@mui/material"

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
      <div className={styles.calculatorItem}>
        <Banner image="/images/blacksmith.png">
          <h2>Item Calculator</h2>
          <AnimatePresence>
            {gp > 0 && (
              <motion.div
                className={styles.totals}
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
        <FormControl sx={{gap: "1rem"}}>
          <FormGroup>
            <InputLabel id="rarity-label">Select Rarity</InputLabel>
            <Select
              labelId="Select Rarity"
              id="rarity-select"
              value={rarity}
              label="Select Rarity"
              autoWidth
              onChange={e => setRarity(e.target.value)}
            >
              <MenuItem value="">Select Rarity</MenuItem>
              <MenuItem value="Common">Common</MenuItem>
              <MenuItem value="Uncommon">Uncommon</MenuItem>
              <MenuItem value="Rare">Rare</MenuItem>
              <MenuItem value="Very Rare">Very Rare</MenuItem>
              <MenuItem value="Legendary">Legendary</MenuItem>
            </Select>
          </FormGroup>
          <FormGroup>
            <FormControlLabel
              label="Consumable"
              control={
                <Checkbox
                  checked={isConsumable}
                  onChange={e => setIsConsumable(e.target.checked)}
                />
              }
            />
            <FormControlLabel
              label="Requires Attunement"
              control={
                <Checkbox
                  checked={requiresAttunement}
                  onChange={e => setRequiresAttunement(e.target.checked)}
                />
              }
            />
          </FormGroup>
          <div
            className={styles.calcGroup}
          >
            {Object.keys(attributes).map((attr) => (
              <FormGroup key={attr} className={styles.inputGroup}>
                <TextField
                  type="number"
                  label={attr.replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase())}
                  value={attributes[attr]}
                  onChange={handleAttributeChange(attr)}
                  onFocus={handleFocus}
                  onBlur={handleBlur(attr)}
                  placeholder={attr.replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase())}
                />
              </FormGroup>
            ))}
          </div>
          {reset && (
            <Button
              onClick={resetValues}
              color="primary"
              variant="outlined"
            >
              Reset to Defaults
            </Button>
          )}
        </FormControl>
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
