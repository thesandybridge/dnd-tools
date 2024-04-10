"use client"

import styles from "./calculator.module.css";
import {useState, useEffect} from "react";
import itemsData from './items.json';
import { convertToDnDCurrency } from "./helper";

export default function ItemCalculator() {
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
                Total Cost: {convertToDnDCurrency(totalCost)}
            </div>
        </div>
    );
}
