"use client"

import { useState, useEffect, useCallback } from 'react';
import styles from './calculator.module.css';
import { convertToDnDCurrency } from './helper';

export default function ItemCalculator() {
    const [rarity, setRarity] = useState('');
    const [isConsumable, setIsConsumable] = useState(false);
    const [attributes, setAttributes] = useState({
        attackDamage: 0,
        spellAttackDC: 0,
        ac: 0,
        savingThrow: 0,
        proficiency: 0,
        resistances: 0,
        immunities: 0,
        spellSlots: 0
    });

    const [_, setPoints] = useState(0);
    const [gp, setGp] = useState(0);

    const handleAttributeChange = (attribute) => (e) => {
        const value = parseInt(e.target.value, 10) || 0;
        setAttributes(prev => ({ ...prev, [attribute]: value }));
    };

    const calculatePointsAndGp = useCallback(() => {
        const { attackDamage, spellAttackDC, ac, savingThrow, proficiency, resistances, immunities, spellSlots } = attributes;

        const rarityPointsMap = {
            'Common': 1, 'Uncommon': 1, 'Rare': 2, 'Very Rare': 3, 'Legendary': 4,
        };

        const basePoints = (
            rarityPointsMap[rarity] +
                attackDamage + spellAttackDC + ac + savingThrow + proficiency +
                resistances +
                (immunities * 3) +
                spellSlots
        );

        const finalPoints = isConsumable ? basePoints / 2 : basePoints;

        setPoints(finalPoints);

        const gpMultiplierMap = {
            'Common': 10, 'Uncommon': 100, 'Rare': 1000, 'Very Rare': 5000, 'Legendary': 10000,
        };

        const totalGp = finalPoints * (gpMultiplierMap[rarity] || 0);

        setGp(totalGp);
    }, [attributes, rarity, isConsumable]);

    useEffect(() => {
        calculatePointsAndGp()
    }, [calculatePointsAndGp])


    return (
        <div className={styles.calculatorItem}>
            <h2>Item Attributes Calculator</h2>
            <div className={styles.calcWrap}>
                <label>Rarity:
                    <select value={rarity} onChange={(e) => setRarity(e.target.value)}>
                        <option value="">Select Rarity</option>
                        <option value="Common">Common</option>
                        <option value="Uncommon">Uncommon</option>
                        <option value="Rare">Rare</option>
                        <option value="Very Rare">Very Rare</option>
                        <option value="Legendary">Legendary</option>
                    </select>
                </label>
                <label>Consumable:
                    <input type="checkbox" checked={isConsumable} onChange={(e) => setIsConsumable(e.target.checked)} />
                </label>
                <div className={styles.calcGroup}>
                    {Object.keys(attributes).map((attr) => (
                        <label key={attr} className={styles.label}>
                            {attr.replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase())}:
                            <input type="number" value={attributes[attr]} onChange={handleAttributeChange(attr)} />
                        </label>
                    ))}
                </div>
            </div>
            {gp > 0 && (
                <div className={styles.totals} style={{ marginTop: '20px' }}>
                    Total Price {convertToDnDCurrency(gp)}
                </div>
            )}

        </div>
    );
}

