'use client'

import { createContext, useState, useContext } from "react"

const CurrencyContext = createContext()

export const CurrencyProvider = ({ children }) => {
    const [currency, setCurrency] = useState(0)

    return (
        <CurrencyContext.Provider value={{ currency, setCurrency }}>
            {children}
        </CurrencyContext.Provider>
    )
}

export const useCurrency = () => {
    return useContext(CurrencyContext)
}
