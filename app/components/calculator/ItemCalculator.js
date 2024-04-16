"use client"

import { useState, useEffect, useCallback } from 'react';
import styles from './calculator.module.css';
import {
    convertToDnDCurrency,
    handleBlur,
    handleFocus
} from './helper';

export default function ItemCalculator() {
    const [rarity, setRarity] = useState('');
    const [isConsumable, setIsConsumable] = useState(false);
    const [requiresAttunement, setRequiresAttunement] = useState(false);
    const [attributes, setAttributes] = useState({
        attackDamage: 0,
        spellAttackDC: 0,
        ac: 0,
        savingThrow: 0,
        proficiency: 0,
        resistances: 0,
        immunities: 0,
        spellLevel: 0
    });
    const [gp, setGp] = useState(0);

    const handleAttributeChange = useCallback((attribute) => (e) => {
        const value = parseInt(e.target.value, 10) || 0;
        setAttributes(prev => ({ ...prev, [attribute]: value }));
    }, []);

    const handleBlur = (attribute) => (e) => {
        if (e.target.value === '') {
            setAttributes(prev => ({ ...prev, [attribute]: 0 }));
            e.target.value = '0';
        }
    };

    const calculatePointsAndGp = useCallback(() => {
        const rarityPointsMap = {
            'Common': 1,
            'Uncommon': 1,
            'Rare': 2,
            'Very Rare': 3,
            'Legendary': 4
        };
        const gpMultiplierMap = {
            'Uncommon': 10,
            'Common': 100,
            'Rare': 1000,
            'Very Rare': 5000,
            'Legendary': 10000
        };

        let basePoints = rarityPointsMap[rarity] || 0;

        if (!requiresAttunement && !isConsumable) {
            basePoints *= 2;
        }

        const totalBonusPoints = Object.entries(attributes).reduce((acc, [key, value]) => {
            switch (key) {
                case "immunities":
                    return acc + (value * 3)
                case "resistances":
                    return acc + (value * 1)
                case "spellLevel":
                    return acc + value
                default:
                    return acc + value
            }
        }, 0);


        const finalPoints = isConsumable ? (basePoints + totalBonusPoints) / 2 : (basePoints + totalBonusPoints);
        const totalGp = finalPoints * (gpMultiplierMap[rarity] || 0);

        setGp(totalGp);
    }, [attributes, rarity, isConsumable, requiresAttunement]);

    useEffect(() => {
        calculatePointsAndGp();
    }, [attributes, rarity, isConsumable, requiresAttunement, calculatePointsAndGp]);

    return (
        <div className={styles.calculatorItem}>
            <h2>Item Price Calculator</h2>
            <select value={rarity} onChange={(e) => setRarity(e.target.value)}>
                <option value="">Select Rarity</option>
                <option value="Uncommon">Uncommon</option>
                <option value="Common">Common</option>
                <option value="Rare">Rare</option>
                <option value="Very Rare">Very Rare</option>
                <option value="Legendary">Legendary</option>
            </select>
            <label>Consumable:
                <input type="checkbox" checked={isConsumable} onChange={(e) => setIsConsumable(e.target.checked)} />
            </label>
            <label>Requires Attunement:
                <input type="checkbox" checked={requiresAttunement} onChange={(e) => setRequiresAttunement(e.target.checked)} />
            </label>
            <div className={styles.calcGroup}>
                {Object.keys(attributes).map((attr) => (
                    <label key={attr} className={styles.label}>
                        {attr.replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase())}:
                        <input
                            type="number"
                            value={attributes[attr]}
                            onChange={handleAttributeChange(attr)}
                            onFocus={handleFocus}
                            onBlur={handleBlur(attr)}
                            placeholder={attr.replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase())}
                        />
                    </label>
                ))}
            </div>
            {gp > 0 && (
                <div className={styles.totals} style={{ marginTop: '20px' }}>
                    Total Price {convertToDnDCurrency(gp)}
                </div>
            )}
        </div>
    );
}

