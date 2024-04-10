import Calculator from "../components/calculator/Calculator";
import ItemCalculator from "../components/calculator/ItemsCalculator";
import ServicesCalculator from "../components/calculator/ServiceCalculator";
import TransportationCalculator from "../components/calculator/TravelCalculator";

export default function Tools() {
    return (
        <main>
            <Calculator/>
            <div className="calcGroup">
                <ServicesCalculator/>
                <TransportationCalculator/>
                <ItemCalculator/>
            </div>
        </main>
    )
}
