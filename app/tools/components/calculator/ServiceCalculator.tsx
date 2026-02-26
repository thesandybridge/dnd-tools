"use client"
import { motion, AnimatePresence } from 'framer-motion'
import { useReducer, useEffect, useCallback, useMemo } from "react"
import servicesData from './services.json'
import { convertToDnDCurrency, preventNonNumeric } from "./helper"
import { useCurrency } from '../../providers/CurrencyContext'
import { GlassPanel } from "@/app/components/ui/GlassPanel"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

function findServiceDetails(houseName: string, serviceName: string) {
  return servicesData.find(house => house.house === houseName)
    ?.services.flatMap(service => Object.entries(service))
    .find(([name]) => name === serviceName)?.[1]
}

function computeTotalCost(
  serviceSelections: Record<string, boolean>,
  unitInputs: Record<string, number>,
  markupPrices: Record<string, number>,
  additionalServicesSelected: Record<string, boolean>
): number {
  let cost = 0

  Object.keys(serviceSelections).forEach(key => {
    const [houseName, serviceName] = key.split('|')
    const service = findServiceDetails(houseName, serviceName)
    if (!service) return

    if (service.type === 'currency' && unitInputs[key]) {
      if (service.additionalCostPerUnit) {
        cost += service.price + (unitInputs[key] || 0) * service.additionalCostPerUnit
      } else {
        cost += service.price * (unitInputs[key] || 0)
      }
    } else if (service.type === 'markup') {
      cost += (markupPrices[key] || 0) * service.price
    } else {
      cost += service.price
    }
  })

  Object.keys(additionalServicesSelected).forEach(key => {
    if (additionalServicesSelected[key]) {
      const [houseName, serviceName, , additionalServiceName] = key.split('|')
      const service = findServiceDetails(houseName, serviceName)
      const additionalService = service?.additionalServices
        ?.find(s => Object.keys(s)[0] === additionalServiceName)?.[additionalServiceName]
      if (additionalService) {
        cost += additionalService.price
      }
    }
  })

  return cost
}

type State = {
  serviceSelections: Record<string, boolean>
  unitInputs: Record<string, number>
  markupPrices: Record<string, number>
  additionalServicesSelected: Record<string, boolean>
}

type Action =
  | { type: "TOGGLE_MAIN_ON"; key: string; isMarkup: boolean }
  | { type: "TOGGLE_MAIN_OFF"; key: string; isMarkup: boolean }
  | { type: "TOGGLE_ADDITIONAL"; key: string }
  | { type: "SET_UNIT_INPUT"; key: string; value: number }
  | { type: "SET_MARKUP_PRICE"; key: string; value: number }

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "TOGGLE_MAIN_ON":
      return {
        ...state,
        serviceSelections: { ...state.serviceSelections, [action.key]: true },
        markupPrices: action.isMarkup
          ? { ...state.markupPrices, [action.key]: 0 }
          : state.markupPrices,
      }
    case "TOGGLE_MAIN_OFF": {
      const updatedSelections = { ...state.serviceSelections }
      delete updatedSelections[action.key]
      const updatedMarkup = { ...state.markupPrices }
      if (action.isMarkup) delete updatedMarkup[action.key]
      const updatedAdditional = { ...state.additionalServicesSelected }
      Object.keys(updatedAdditional)
        .filter(addKey => addKey.startsWith(action.key))
        .forEach(addKey => delete updatedAdditional[addKey])
      return {
        ...state,
        serviceSelections: updatedSelections,
        markupPrices: updatedMarkup,
        additionalServicesSelected: updatedAdditional,
      }
    }
    case "TOGGLE_ADDITIONAL":
      return {
        ...state,
        additionalServicesSelected: {
          ...state.additionalServicesSelected,
          [action.key]: !state.additionalServicesSelected[action.key],
        },
      }
    case "SET_UNIT_INPUT":
      return {
        ...state,
        unitInputs: { ...state.unitInputs, [action.key]: action.value },
      }
    case "SET_MARKUP_PRICE":
      return {
        ...state,
        markupPrices: { ...state.markupPrices, [action.key]: action.value },
      }
    default:
      return state
  }
}

const View = ({
  totalCost,
  onToggleMain,
  onToggleAdditional,
  onUnitInputChange,
  unitInputs,
  additionalServicesSelected,
  serviceSelections,
  markupPrices,
  onMarkupChange,
}) => {
  return (
    <div className="flex flex-col gap-4 w-full">
      <h2 className="text-2xl font-bold font-cinzel">Services Calculator</h2>

      <GlassPanel corona className="p-6 flex flex-col gap-0">
        {/* Result Readout */}
        <div className="py-8 flex flex-col items-center gap-2">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Total Cost</h3>
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
        </div>

        {/* Divider */}
        <div className="w-12 h-px bg-white/[0.06] mx-auto my-2" />

        {/* Service Groups */}
        <div className="flex gap-4 flex-wrap pt-6">
          {servicesData.map((house) => (
            <div key={house.house} className="flex-1 basis-[calc(50%-0.5rem)] max-md:basis-full">
              <div className="flex flex-col gap-2">
                <h3 className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">{house.house}</h3>
                {house.services.map(service => (
                  Object.entries(service).map(([serviceName, serviceDetails]) => {
                    const serviceKey = `${house.house}|${serviceName}`
                    const mainCheckboxId = `main-${serviceKey}`
                    return (
                      <div key={serviceKey}>
                        <div className="flex flex-col gap-2">
                          <div className="flex items-center gap-2">
                            <Checkbox
                              id={mainCheckboxId}
                              checked={!!serviceSelections[serviceKey]}
                              onCheckedChange={() => onToggleMain(house.house, serviceName, serviceDetails.type === 'markup')}
                            />
                            <Label
                              htmlFor={mainCheckboxId}
                              className={serviceSelections[serviceKey] ? "text-foreground" : "text-muted-foreground"}
                            >
                              {`${serviceName} - ${convertToDnDCurrency(serviceDetails.price)}`}
                            </Label>
                          </div>
                          {serviceSelections[serviceKey] && (
                            <>
                              {serviceDetails.unit && (
                                <div className="flex flex-col gap-1.5 pl-6 max-w-xs group">
                                  <Label className="text-xs uppercase tracking-wider text-muted-foreground transition-colors duration-200 group-focus-within:text-primary/70">
                                    {serviceDetails.unit.split(' / ')[1]}
                                  </Label>
                                  <Input
                                    type="number"
                                    value={unitInputs[serviceKey] || ''}
                                    onChange={(e) => onUnitInputChange(serviceKey, parseFloat(e.target.value))}
                                    onKeyDown={preventNonNumeric}
                                    className="bg-white/[0.03] border-white/[0.06] text-right transition-all duration-200 focus:border-primary/40 focus:shadow-[0_0_8px_-3px] focus:shadow-primary/20"
                                  />
                                </div>
                              )}
                              {serviceDetails.type === 'markup' && (
                                <div className="flex flex-col gap-1.5 pl-6 max-w-xs group">
                                  <Label className="text-xs uppercase tracking-wider text-muted-foreground transition-colors duration-200 group-focus-within:text-primary/70">
                                    Base Cost
                                  </Label>
                                  <Input
                                    type="number"
                                    value={markupPrices[serviceKey] || ''}
                                    onChange={(e) => onMarkupChange(serviceKey, parseFloat(e.target.value))}
                                    onKeyDown={preventNonNumeric}
                                    className="bg-white/[0.03] border-white/[0.06] text-right transition-all duration-200 focus:border-primary/40 focus:shadow-[0_0_8px_-3px] focus:shadow-primary/20"
                                  />
                                </div>
                              )}
                              {serviceDetails.additionalServices?.map(additional => {
                                const additionalServiceName = Object.keys(additional)[0]
                                const additionalServiceKey = `${serviceKey}|additional|${additionalServiceName}`
                                const additionalCheckboxId = `additional-${additionalServiceKey}`
                                return (
                                  <div key={additionalServiceKey} className="pl-6">
                                    <div className="flex items-center gap-2">
                                      <Checkbox
                                        id={additionalCheckboxId}
                                        checked={!!additionalServicesSelected[additionalServiceKey]}
                                        onCheckedChange={() => onToggleAdditional(house.house, serviceName, additionalServiceName)}
                                      />
                                      <Label
                                        htmlFor={additionalCheckboxId}
                                        className={additionalServicesSelected[additionalServiceKey] ? "text-foreground" : "text-muted-foreground"}
                                      >
                                        {additionalServiceName}
                                      </Label>
                                    </div>
                                  </div>
                                )
                              })}
                            </>
                          )}
                        </div>
                      </div>
                    )
                  })
                ))}
              </div>
            </div>
          ))}
        </div>
      </GlassPanel>
    </div>
  )
}

export default function ServicesCalculator() {
  const [state, dispatch] = useReducer(reducer, {
    serviceSelections: {},
    unitInputs: {},
    markupPrices: {},
    additionalServicesSelected: {},
  })

  const { setCurrency } = useCurrency()

  const totalCost = useMemo(
    () => computeTotalCost(state.serviceSelections, state.unitInputs, state.markupPrices, state.additionalServicesSelected),
    [state.serviceSelections, state.unitInputs, state.markupPrices, state.additionalServicesSelected]
  )

  useEffect(() => {
    setCurrency(totalCost)
  }, [setCurrency, totalCost])

  const onToggleMain = useCallback((houseName: string, serviceName: string, isMarkup: boolean) => {
    const key = `${houseName}|${serviceName}`
    if (state.serviceSelections[key]) {
      dispatch({ type: "TOGGLE_MAIN_OFF", key, isMarkup })
    } else {
      dispatch({ type: "TOGGLE_MAIN_ON", key, isMarkup })
    }
  }, [state.serviceSelections])

  const onToggleAdditional = useCallback((houseName: string, serviceName: string, additionalServiceName: string) => {
    const key = `${houseName}|${serviceName}|additional|${additionalServiceName}`
    dispatch({ type: "TOGGLE_ADDITIONAL", key })
  }, [])

  const onUnitInputChange = useCallback((key: string, value: number) => {
    dispatch({ type: "SET_UNIT_INPUT", key, value })
  }, [])

  const onMarkupChange = useCallback((key: string, value: number) => {
    dispatch({ type: "SET_MARKUP_PRICE", key, value })
  }, [])

  const viewProps = useMemo(() => ({
    totalCost,
    onToggleMain,
    onToggleAdditional,
    onUnitInputChange,
    unitInputs: state.unitInputs,
    additionalServicesSelected: state.additionalServicesSelected,
    serviceSelections: state.serviceSelections,
    markupPrices: state.markupPrices,
    onMarkupChange,
  }), [totalCost, onToggleMain, onToggleAdditional, onUnitInputChange, state, onMarkupChange])

  return <View {...viewProps} />
}
