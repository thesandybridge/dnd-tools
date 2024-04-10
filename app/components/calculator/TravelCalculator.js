"use client"

import styles from "./calculator.module.css";
import {useState, useEffect} from "react";
import transportationData from "./travel.json";
import { convertToDnDCurrency } from "./helper";

export default function TransportationCalculator() {
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
                Total Cost: {convertToDnDCurrency(totalCost)}
            </div>
        </div>
    );
}
