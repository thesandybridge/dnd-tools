"use client"
import { motion, AnimatePresence } from 'framer-motion'
import { useState, useEffect } from "react"
import servicesData from './services.json'
import { convertToDnDCurrency } from "./helper"
import Banner from "../Banner"
import { useCurrency } from '../../providers/CurrencyContext'
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

const View = ({
  totalCost,
  toggleMainService,
  toggleAdditionalService,
  setUnitInputs,
  unitInputs,
  additionalServicesSelected,
  serviceSelections,
  markupPrices,
  setMarkupPrices,
}) => {
  return (
    <>
      <div className="p-4 border border-border rounded-lg flex flex-col gap-4 max-w-[900px] w-full overflow-y-auto">
        <Banner image="/images/tavern.png">
          <h2>Services Calculator</h2>
          <AnimatePresence>
            {totalCost > 0 && (
              <motion.div
                className="border border-primary p-4 sticky bottom-0 bg-background"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                Total Cost: {convertToDnDCurrency(totalCost)}
              </motion.div>
            )}
          </AnimatePresence>
        </Banner>
        <div className="flex gap-4 flex-wrap">
        {servicesData.map(house => (
          <div key={house.house} className="flex-1 basis-[calc(50%-1rem)] max-md:basis-full flex flex-col gap-2">
            <h3 className="font-semibold text-sm text-foreground">{house.house}</h3>
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
                          onCheckedChange={() => toggleMainService(house.house, serviceName, serviceDetails.type === 'markup')}
                        />
                        <Label htmlFor={mainCheckboxId}>
                          {`${serviceName} - ${convertToDnDCurrency(serviceDetails.price)}`}
                        </Label>
                      </div>
                      {serviceSelections[serviceKey] && (
                        <>
                          {serviceDetails.unit && (
                            <div className="flex flex-col gap-1.5">
                              <Label>{serviceDetails.unit.split(' / ')[1]}</Label>
                              <Input
                                type="number"
                                value={unitInputs[serviceKey] || ''}
                                onChange={(e) => setUnitInputs({ ...unitInputs, [serviceKey]: parseFloat(e.target.value) })}
                                key={`unitInput-${serviceKey}`}
                              />
                            </div>
                          )}
                          {serviceDetails.type === 'markup' && (
                            <div className="flex flex-col gap-1.5">
                              <Label>Base Cost</Label>
                              <Input
                                type="number"
                                value={markupPrices[serviceKey] || ''}
                                onChange={(e) => setMarkupPrices({ ...markupPrices, [serviceKey]: parseFloat(e.target.value) })}
                                key={`markupInput-${serviceKey}`}
                              />
                            </div>
                          )}
                          {serviceDetails.additionalServices?.map(additional => {
                            const additionalServiceName = Object.keys(additional)[0]
                            const additionalServiceKey = `${serviceKey}|additional|${additionalServiceName}`
                            const additionalCheckboxId = `additional-${additionalServiceKey}`
                            return (
                              <div key={additionalServiceKey} className="pl-4">
                                <div className="flex items-center gap-2">
                                  <Checkbox
                                    id={additionalCheckboxId}
                                    checked={!!additionalServicesSelected[additionalServiceKey]}
                                    onCheckedChange={() => toggleAdditionalService(house.house, serviceName, additionalServiceName)}
                                  />
                                  <Label htmlFor={additionalCheckboxId}>
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
        ))}
        </div>
      </div>
    </>
  )
}

export default function ServicesCalculator() {
  const [serviceSelections, setServiceSelections] = useState({})
  const [unitInputs, setUnitInputs] = useState({})
  const [markupPrices, setMarkupPrices] = useState({})
  const [additionalServicesSelected, setAdditionalServicesSelected] = useState({})
  const [totalCost, setTotalCost] = useState(0)

  const { setCurrency } = useCurrency()

  useEffect(() => {
    setCurrency(totalCost)
  }, [setCurrency, totalCost])

  const toggleMainService = (houseName, serviceName, isMarkup = false) => {
    const key = `${houseName}|${serviceName}`
    if (serviceSelections[key]) {
      // Deselecting service
      const updatedServices = { ...serviceSelections }
      delete updatedServices[key]
      setServiceSelections(updatedServices)
      isMarkup && delete markupPrices[key]
      // Also, deselect all related additional services
      const updatedAdditional = { ...additionalServicesSelected }
      Object.keys(updatedAdditional)
        .filter(addKey => addKey.startsWith(key))
        .forEach(addKey => delete updatedAdditional[addKey])
      setAdditionalServicesSelected(updatedAdditional)
    } else {
      // Selecting service
      setServiceSelections({ ...serviceSelections, [key]: true })
      isMarkup && setMarkupPrices({ ...markupPrices, [key]: 0 })
    }
  }

  const toggleAdditionalService = (houseName, serviceName, additionalServiceName) => {
    const key = `${houseName}|${serviceName}|additional|${additionalServiceName}`
    setAdditionalServicesSelected(prev => ({
      ...prev,
      [key]: !prev[key]
    }))
  }

  useEffect(() => {
    const calculateCost = () => {
      let cost = 0
      Object.keys(serviceSelections).forEach(key => {
        const [houseName, serviceName] = key.split('|')
        const service = servicesData.find(house => house.house === houseName)
          .services.flatMap(service => Object.entries(service))
          .find(([name]) => name === serviceName)[1]

        if (service.type === 'currency' && unitInputs[key]) {
          if (service.additionalCostPerUnit) {
            cost += service.price + (unitInputs[key] || 0) * (service.additionalCostPerUnit)
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
          const service = servicesData.find(house => house.house === houseName)
            .services.flatMap(s => Object.entries(s))
            .find(([name]) => name === serviceName)[1]
            .additionalServices.find(s => Object.keys(s)[0] === additionalServiceName)[additionalServiceName]
          cost += service.price
        }
      })

      return cost
    }

    setTotalCost(calculateCost())
  }, [serviceSelections, unitInputs, markupPrices, additionalServicesSelected])

  const servicesCalculatorProps = {
    totalCost,
    toggleMainService,
    toggleAdditionalService,
    setUnitInputs,
    unitInputs,
    additionalServicesSelected,
    serviceSelections,
    markupPrices,
    setMarkupPrices,
  }

  return (
    <View
      {...servicesCalculatorProps}
    />
  )
}
