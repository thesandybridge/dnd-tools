import styles from "./calculator.module.css";
import ServicesCalculator from "./ServiceCalculator";
import TransportationCalculator from "./TravelCalculator";
import ItemCalculator from "./ItemsCalculator";
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
