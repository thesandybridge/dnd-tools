"use client"

import styles from "./calculator.module.css";
import { useState, useEffect, useCallback, useMemo } from "react";
import transportationData from "./travel.json";
import { convertToDnDCurrency, formatDuration, handleFocus } from "./helper";

const View = ({
  selectedTransport,
  setSelectedTransport,
  transportationData,
  selectedTransportData,
  setDistance,
  resetDistance,
  distance,
  resetWeight,
  cargoWeight,
  setCargoWeight,
  totalCost,
  totalDays,
}) => {
  return (
    <div className={styles.calculatorItem}>
      <h2>Transportation Calculator</h2>
      <select value={selectedTransport} onChange={(e) => setSelectedTransport(e.target.value)}>
        <option value="">Select Transportation</option>
        {transportationData.map((option, index) => (
          <option
            key={index}
            value={option.type}
          >
            {option.type} - {option.fare}
          </option>
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
              onFocus={handleFocus}
              onBlur={resetDistance}
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
                onFocus={handleFocus}
                onBlur={resetWeight}
              />
              Weight (lbs)
            </label>
          )}
        </>
      )}

      <div className={styles.totals}>
        Total Cost: {convertToDnDCurrency(totalCost)}
      </div>
      <div className={styles.totals}>
        Total Time: {totalDays}
      </div>
    </div>
  )
}

/**
 * @typedef {Object} Rate
 * @property {number} value - The numeric value of the rate.
 * @property {number} multiplier - Multiplier for converting between different currency units.
 * @property {number} unitWeight - The unit weight for which the rate is applicable, default is 100 lbs.
 */

/**
 * TransportationCalculator is a React component that calculates the cost and duration of transportation
 * based on user inputs for distance and cargo weight. It uses a selected transportation type from a predefined
 * dataset to determine specific rates and speeds.
 *
 * @returns {JSX.Element} The rendered component which includes input fields for distance and weight, and displays the calculated total cost and time.
 */
const TransportationCalculator = () => {
  const [selectedTransport, setSelectedTransport] = useState('');
  const [distance, setDistance] = useState(0);
  const [cargoWeight, setCargoWeight] = useState(0);
  const [totalCost, setTotalCost] = useState(0);
  const [totalDays, setTotalDays] = useState("");

  const selectedTransportData = useMemo(() => {
    return transportationData.find(t => t.type === selectedTransport) || {};
  }, [selectedTransport]);

  const resetDistance = () => (e) => {
    if (e.target.value === '') {
      setDistance(0);
      e.target.value = '0';
    }
  };

  const resetWeight = () => (e) => {
    if (e.target.value === '') {
      setCargoWeight(0);
      e.target.value = '0';
    }
  };

  const calculateTotalTime = useCallback((data) => {
    if (data.speed === "Instant") {
      setTotalDays("Instant");
      return;
    }

    if (data.perDay) {
      const [milesPerDay, _] = data.perDay.split(' ');
      const miles = parseInt(milesPerDay, 10);

      if (distance < miles) {
        let hours = Math.floor(distance / miles)
        let totalMinutes = (distance / miles * 60)
        let minutes = Math.floor(totalMinutes % 60)
        let seconds = Math.floor((totalMinutes * 60) % 60)
        setTotalDays(formatDuration(0, hours, minutes, seconds))
      } else {
        let days = Math.floor(distance / miles)
        let totalHours = (distance / miles * 24)
        let hours = Math.floor(totalHours % 24)
        let totalMinutes = (totalHours * 60)
        let minutes = Math.floor(totalMinutes % 60)
        let seconds = Math.floor((totalMinutes * 60) % 60)
        setTotalDays(formatDuration(days, hours, minutes, seconds))
      }
    }
  }, [distance]);

  const calculateCost = useCallback(() => {
    if (!selectedTransport) {
      setTotalCost(0);
      setTotalDays(0);
      return;
    }

    const fareRate = parseRate(selectedTransportData.fare);
    let fareCost = 0;
    if (selectedTransportData.speed === "Instant") {
      fareCost = fareRate.value;
    } else {
      fareCost = fareRate.value * distance * fareRate.multiplier;
    }

    let cargoCostGP = 0;
    if (selectedTransportData.cargoRate) {
      const cargoRate = parseRate(selectedTransportData.cargoRate);
      if (cargoWeight >= cargoRate.unitWeight) {
        const totalCargoCost = (cargoRate.value * distance * cargoWeight) / cargoRate.unitWeight;
        cargoCostGP = totalCargoCost * cargoRate.multiplier;
      }
    }


    setTotalCost(fareCost + cargoCostGP);
  }, [selectedTransportData, distance, cargoWeight, selectedTransport]);

  useEffect(() => {
    calculateCost();
    calculateTotalTime(selectedTransportData);
  }, [selectedTransportData, calculateCost, calculateTotalTime]);



  const parseRate = (rateString) => {
    if (!rateString) return { value: 0, multiplier: 0, unitWeight: Infinity }; // Handle no rate case
    const parts = rateString.split(' ');
    const value = parseFloat(parts[0]);
    const unit = parts[1];
    const perUnitWeight = parts.length > 5 ? parseInt(parts[5], 10) : 100; // Default to 100 lbs if not specified

    const multiplier = unit === 'gp' ? 1 : unit === 'sp' ? 0.1 : unit === 'cp' ? 0.01 : 0;
    return { value, multiplier, unitWeight: perUnitWeight };
  };

  const transportationCalculatorProps = {
    selectedTransport,
    setSelectedTransport,
    transportationData,
    selectedTransportData,
    setDistance,
    resetDistance,
    distance,
    resetWeight,
    cargoWeight,
    setCargoWeight,
    totalCost,
    totalDays,
  }

  return (
    <View
      {...transportationCalculatorProps}
    />
  );
}

export default TransportationCalculator
