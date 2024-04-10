"use client"

import styles from "./calculator.module.css";
import {useState, useEffect} from "react";
import servicesData from './services.json';
import transportationData from "./travel.json";
import itemsData from './items.json';

/**
 * Component Props
 * @typedef {Object} CalculatorProps
 * @property {'travel'|'items'|'service'} type - The type of the calculator.
 */

/**
 * Calculator component
 *
 * @param {CalculatorProps} props The props of the component.
 * @returns {JSX.Element} The JSX markup for the component.
 */
export default function Calculator() {
    return (
        <div className={`${styles.calculator}`}>
            <ServicesCalculator/>
            <TransportationCalculator/>
            <ItemCalculator/>
        </div>
    )
}

function convertToDnDCurrency(goldPieces) {
    let totalCopper = Math.round(goldPieces * 100); // Convert all to copper first to avoid floating point issues
    let gp = Math.floor(totalCopper / 100); // Determine gold pieces
    let sp = Math.floor((totalCopper % 100) / 10); // Determine silver pieces
    let cp = totalCopper % 10; // Remaining copper pieces

    let result = [];
    if (gp > 0) {
        result.push(`${gp}GP`);
    }
    if (sp > 0) {
        result.push(`${sp}SP`);
    }
    if (cp > 0) {
        result.push(`${cp}CP`);
    }

    return result.join(' ');
}


function ServicesCalculator() {
    const [serviceSelections, setServiceSelections] = useState({});
    const [unitInputs, setUnitInputs] = useState({});
    const [markupPrices, setMarkupPrices] = useState({});
    const [additionalServicesSelected, setAdditionalServicesSelected] = useState({});
    const [totalCost, setTotalCost] = useState(0);

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

    return (
        <div className={styles.calculatorItem}>
            <h2>Services Calculator</h2>
            {servicesData.map((house, _) => (
                <div key={house.house}> {/* Use house name for uniqueness */}
                    <h3>{house.house}</h3>
                    {house.services.map((service, _) => (
                        Object.entries(service).map(([serviceName, serviceDetails]) => {
                            const serviceKey = `${house.house}|${serviceName}`; // Unique key for main services
                            return (
                                <div key={serviceKey}> {/* This key is already unique */}
                                    <label>
                                        <input
                                            type="checkbox"
                                            checked={!!serviceSelections[serviceKey]}
                                            onChange={() => toggleMainService(house.house, serviceName, serviceDetails.type === 'markup')}
                                        />
                                        {serviceName}
                                    </label>
                                    {serviceSelections[serviceKey] && (
                                        <>
                                            {serviceDetails.unit && (
                                                <input
                                                    type="number"
                                                    placeholder={`Enter ${serviceDetails.unit.split(' / ')[1]}`}
                                                    value={unitInputs[serviceKey] || ''}
                                                    onChange={(e) => setUnitInputs({ ...unitInputs, [serviceKey]: parseFloat(e.target.value) })}
                                                    key={`unitInput-${serviceKey}`} // Ensure key uniqueness if needed
                                                />
                                            )}
                                            {serviceDetails.type === 'markup' && (
                                                <input
                                                    type="number"
                                                    placeholder="Base cost"
                                                    value={markupPrices[serviceKey] || ''}
                                                    onChange={(e) => setMarkupPrices({ ...markupPrices, [serviceKey]: parseFloat(e.target.value) })}
                                                    key={`markupInput-${serviceKey}`} // Ensure key uniqueness if needed
                                                />
                                            )}
                                            {serviceDetails.additionalServices?.map((additional, _) => {
                                                const additionalServiceName = Object.keys(additional)[0];
                                                const additionalServiceKey = `${serviceKey}|additional|${additionalServiceName}`;
                                                return (
                                                    <div key={additionalServiceKey}> {/* Unique key for additional services */}
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
                                </div>
                            );
                        })
                    ))}
                </div>
            ))}
            <div>Total Cost: {convertToDnDCurrency(totalCost)}</div>
        </div>
    );
}

function TransportationCalculator() {
    const [selectedTransport, setSelectedTransport] = useState('');
    const [distance, setDistance] = useState(0);
    const [cargoWeight, setCargoWeight] = useState(0);
    const [totalCost, setTotalCost] = useState(0);

    const selectedTransportData = transportationData.find(t => t.type === selectedTransport) || {};

    useEffect(() => {
        calculateCost();
    }, [selectedTransport, distance, cargoWeight]);

    const calculateCost = () => {
        if (!selectedTransport) {
            setTotalCost(0);
            return;
        }

        const fareRate = parseRate(selectedTransportData.fare);
        let fareCost = 0;
        if (selectedTransportData.speed === "Instant") {
            fareCost = fareRate.value; // Assuming instant fares are fixed per use
        } else {
            fareCost = fareRate.value * distance * fareRate.multiplier; // Fare cost based on distance
        }

        // Handling cargo cost
        let cargoCostGP = 0;
        if (selectedTransportData.cargoRate) {
            const cargoRate = parseRate(selectedTransportData.cargoRate);
            // Check if cargo weight is less than the specified unit weight for the rate
            if (cargoWeight >= cargoRate.unitWeight) {
                const totalCargoCost = (cargoRate.value * distance * cargoWeight) / cargoRate.unitWeight;
                cargoCostGP = totalCargoCost * cargoRate.multiplier; // Convert cargo cost to GP
            }
        }

        setTotalCost(fareCost + cargoCostGP);
    };

    // Helper function to parse rate strings
    const parseRate = (rateString) => {
        if (!rateString) return { value: 0, multiplier: 0, unitWeight: Infinity }; // Handle no rate case
        const parts = rateString.split(' ');
        const value = parseFloat(parts[0]);
        const unit = parts[1];
        const perUnitWeight = parts.length > 5 ? parseInt(parts[5], 10) : 100; // Default to 100 lbs if not specified

        const multiplier = unit === 'gp' ? 1 : unit === 'sp' ? 0.1 : unit === 'cp' ? 0.01 : 0;
        return { value, multiplier, unitWeight: perUnitWeight };
    };

    return (
        <div className={styles.calculatorItem}>
            <h2>Transportation Calculator</h2>
            <select value={selectedTransport} onChange={(e) => setSelectedTransport(e.target.value)}>
                <option value="">Select Transportation</option>
                {transportationData.map((option, index) => (
                    <option key={index} value={option.type}>{option.type}</option>
                ))}
            </select>

            {selectedTransportData.speed !== "Instant" && (
                <>
                    <label>
                        <input
                            type="number"
                            value={distance}
                            onChange={(e) => setDistance(parseFloat(e.target.value) || 0)}
                            placeholder="Distance in miles"
                        />
                        Miles
                    </label>

                    {selectedTransportData.cargoRate && (
                        <label>
                            <input
                                type="number"
                                value={cargoWeight}
                                onChange={(e) => setCargoWeight(parseFloat(e.target.value) || 0)}
                                placeholder="Cargo weight in lbs"
                            />
                            Weight (lbs)
                        </label>
                    )}
                </>
            )}

            <div className={styles.totals}>
                {convertToDnDCurrency(totalCost)}
            </div>
        </div>
    );
}

function ItemCalculator() {
    const [selectedItem, setSelectedItem] = useState('');
    const [selectedType, setSelectedType] = useState('');
    const [selectedFeatures, setSelectedFeatures] = useState([]);
    const [miles, setMiles] = useState(0);
    const [totalCost, setTotalCost] = useState(0);

    useEffect(() => {
        setSelectedType('');
        setSelectedFeatures([]);
        setTotalCost(0);
    }, [selectedItem]);

    useEffect(() => {
        calculateTotalCost();
    }, [selectedItem, selectedType, selectedFeatures, miles]);

    const handleFeatureChange = (feature, isChecked) => {
        setSelectedFeatures(prev =>
            isChecked ? [...prev, feature] : prev.filter(f => f !== feature)
        );
    };

    const calculateTotalCost = () => {
        const item = itemsData.find(i => i.item === selectedItem);
        if (!item) return;

        let cost = item.baseCost;

        const typeCost = item.types?.find(type => type.type === selectedType)?.additionalCost || 0;
        cost += typeCost;

        item.specials?.forEach(({ feature, additionalCost }) => {
            if (selectedFeatures.includes(feature)) {
                cost += additionalCost;
            }
        });

        if (item.perDay && miles > 0) {
            const perDayMiles = parseInt(item.perDay.split(' ')[0], 10);
            const perMileCost = item.baseCost / perDayMiles;
            cost += perMileCost * miles;
        }

        setTotalCost(cost);
    };


    return (
        <div className={styles.calculatorItem}>
            <h2>Item Calculator</h2>
            <select value={selectedItem} onChange={(e) => setSelectedItem(e.target.value)}>
                <option value="">Select an Item</option>
                {itemsData.map((item, index) => (
                    <option key={index} value={item.item}>{item.item}</option>
                ))}
            </select>

            {selectedItem && itemsData.find(item => item.item === selectedItem)?.types && (
                <select value={selectedType} onChange={(e) => setSelectedType(e.target.value)}>
                    <option value="">Select Type</option>
                    {itemsData.find(item => item.item === selectedItem).types.map((type, index) => (
                        <option key={index} value={type.type}>{type.type}</option>
                    ))}
                </select>
            )}

            {itemsData.find(item => item.item === selectedItem)?.specials && (
                itemsData.find(item => item.item === selectedItem).specials.map((special, index) => (
                    <div key={index}>
                        <label>
                            <input
                                type="checkbox"
                                checked={selectedFeatures.includes(special.feature)}
                                onChange={(e) => handleFeatureChange(special.feature, e.target.checked)}
                            />
                            {special.feature} (+{special.additionalCost} gp)
                        </label>
                    </div>
                ))
            )}

            <label>
                <input
                    type="number"
                    min="0"
                    value={miles}
                    onChange={(e) => setMiles(parseInt(e.target.value, 10) || 0)}
                    placeholder="Miles (if applicable)"
                />
                Miles
            </label>

            <div className={styles.totals}>
                {convertToDnDCurrency(totalCost)}
            </div>
        </div>
    );
}
