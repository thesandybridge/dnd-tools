"use client"

import styles from "./calculator.module.css";
import { useState, useEffect } from "react";
import itemsData from './items.json';
import {
  convertToDnDCurrency,
  formatDuration,
  handleFocus,
  handleBlur
} from "./helper";

export default function MountCalculator() {
  const [selectedItem, setSelectedItem] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [selectedFeatures, setSelectedFeatures] = useState([]);
  const [miles, setMiles] = useState(0);
  const [totalCost, setTotalCost] = useState(0);
  const [totalDays, setTotalDays] = useState("");

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

  const handleBlur = (attribute) => (e) => {
    if (e.target.value === '') {
      setMiles(0);
      e.target.value = '0';
    }
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

    if (item.perDay) {
      const [distance, _] = item.perDay.split(' ');

      if (miles < distance) {
        let hours = Math.floor(miles / distance)
        let totalMinutes = (miles / distance * 60)
        let minutes = Math.floor(totalMinutes % 60)
        let seconds = Math.floor((totalMinutes * 60) % 60)
        setTotalDays(formatDuration(0, hours, minutes, seconds))
      } else {
        let days = Math.floor(miles / distance)
        let totalHours = (miles / distance * 24)
        let hours = Math.floor(totalHours % 24)
        let totalMinutes = (totalHours * 60)
        let minutes = Math.floor(totalMinutes % 60)
        let seconds = Math.floor((totalMinutes * 60) % 60)
        setTotalDays(formatDuration(days, hours, minutes, seconds))
      }
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
          onBlur={handleBlur(miles)}
          onFocus={handleFocus}
        />
        Miles
      </label>

      <div className={styles.totals}>
        Total Cost: {convertToDnDCurrency(totalCost)}
      </div>
      <div className={styles.totals}>
        Total Time: {totalDays}
      </div>
    </div>
  );
}
