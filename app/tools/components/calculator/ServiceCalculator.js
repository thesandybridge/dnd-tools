"use client"
import { motion, AnimatePresence } from 'framer-motion'
import styles from "./calculator.module.css";
import { useState, useEffect } from "react";
import servicesData from './services.json';
import { convertToDnDCurrency } from "./helper";
import Banner from "../Banner";
import { useCurrency } from '../../context/CurrencyContext';

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
      <div className={styles.calculatorItem}>
        <Banner image="/images/tavern.png">
          <h2>Services Calculator</h2>
          <AnimatePresence>
            {totalCost > 0 && (
              <motion.div
                className={styles.totals}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                Total Cost: {convertToDnDCurrency(totalCost)}
              </motion.div>
            )}
          </AnimatePresence>
        </Banner>
        {servicesData.map((house, _) => (
          <div key={house.house} className={styles.calcGroup}>
            <h3>{house.house}</h3>
            {house.services.map((service, _) => (
              Object.entries(service).map(([serviceName, serviceDetails]) => {
                const serviceKey = `${house.house}|${serviceName}`;
                return (
                  <div key={serviceKey}>
                    <label>
                      <input
                        type="checkbox"
                        checked={!!serviceSelections[serviceKey]}
                        onChange={() => toggleMainService(house.house, serviceName, serviceDetails.type === 'markup')}
                      />
                      {serviceName} - {convertToDnDCurrency(serviceDetails.price)}
                      {serviceSelections[serviceKey] && (
                        <>
                          {serviceDetails.unit && (
                            <input
                              type="number"
                              placeholder={`${serviceDetails.unit.split(' / ')[1]}`}
                              value={unitInputs[serviceKey] || ''}
                              onChange={(e) => setUnitInputs({ ...unitInputs, [serviceKey]: parseFloat(e.target.value) })}
                              key={`unitInput-${serviceKey}`}
                            />
                          )}
                          {serviceDetails.type === 'markup' && (
                            <input
                              type="number"
                              placeholder="Base cost"
                              value={markupPrices[serviceKey] || ''}
                              onChange={(e) => setMarkupPrices({ ...markupPrices, [serviceKey]: parseFloat(e.target.value) })}
                              key={`markupInput-${serviceKey}`}
                            />
                          )}
                          {serviceDetails.additionalServices?.map((additional, _) => {
                            const additionalServiceName = Object.keys(additional)[0];
                            const additionalServiceKey = `${serviceKey}|additional|${additionalServiceName}`;
                            return (
                              <div key={additionalServiceKey} className={styles.additionalService}>
                                <label>
                                  <input
                                    type="checkbox"
                                    checked={!!additionalServicesSelected[additionalServiceKey]}
                                    onChange={() => toggleAdditionalService(house.house, serviceName, additionalServiceName)}
                                  />
                                  {additionalServiceName}
                                </label>
                              </div>
                            );
                          })}
                        </>
                      )}
                    </label>
                  </div>
                );
              })
            ))}
          </div>
        ))}
      </div>
    </>
  )
}

export default function ServicesCalculator() {
  const [serviceSelections, setServiceSelections] = useState({});
  const [unitInputs, setUnitInputs] = useState({});
  const [markupPrices, setMarkupPrices] = useState({});
  const [additionalServicesSelected, setAdditionalServicesSelected] = useState({});
  const [totalCost, setTotalCost] = useState(0);

  const { setCurrency } = useCurrency()

  useEffect(() => {
    setCurrency(totalCost)
  }, [setCurrency, totalCost])

  const toggleMainService = (houseName, serviceName, isMarkup = false) => {
    const key = `${houseName}|${serviceName}`;
    if (serviceSelections[key]) {
      // Deselecting service
      const updatedServices = { ...serviceSelections };
      delete updatedServices[key];
      setServiceSelections(updatedServices);
      isMarkup && delete markupPrices[key];
      // Also, deselect all related additional services
      const updatedAdditional = { ...additionalServicesSelected };
      Object.keys(updatedAdditional)
        .filter(addKey => addKey.startsWith(key))
        .forEach(addKey => delete updatedAdditional[addKey]);
      setAdditionalServicesSelected(updatedAdditional);
    } else {
      // Selecting service
      setServiceSelections({ ...serviceSelections, [key]: true });
      isMarkup && setMarkupPrices({ ...markupPrices, [key]: 0 });
    }
  };

  const toggleAdditionalService = (houseName, serviceName, additionalServiceName) => {
    const key = `${houseName}|${serviceName}|additional|${additionalServiceName}`;
    setAdditionalServicesSelected(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  useEffect(() => {
    const calculateCost = () => {
      let cost = 0;
      Object.keys(serviceSelections).forEach(key => {
        const [houseName, serviceName] = key.split('|');
        const service = servicesData.find(house => house.house === houseName)
          .services.flatMap(service => Object.entries(service))
          .find(([name]) => name === serviceName)[1];

        if (service.type === 'currency' && unitInputs[key]) {
          if (service.additionalCostPerUnit) {
            cost += service.price + (unitInputs[key] || 0) * (service.additionalCostPerUnit);
          } else {
            cost += service.price * (unitInputs[key] || 0);
          }
        } else if (service.type === 'markup') {
          cost += (markupPrices[key] || 0) * service.price;
        } else {
          cost += service.price
        }
      });

      Object.keys(additionalServicesSelected).forEach(key => {
        if (additionalServicesSelected[key]) {
          const [houseName, serviceName, , additionalServiceName] = key.split('|');
          const service = servicesData.find(house => house.house === houseName)
            .services.flatMap(s => Object.entries(s))
            .find(([name]) => name === serviceName)[1]
            .additionalServices.find(s => Object.keys(s)[0] === additionalServiceName)[additionalServiceName];
          cost += service.price;
        }
      });

      return cost;
    };

    setTotalCost(calculateCost());
  }, [serviceSelections, unitInputs, markupPrices, additionalServicesSelected]);

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
