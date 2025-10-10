"use client"
import { useState, useEffect } from "react"

export default function CurrencyConverter({ basePrice = 75, baseCurrency = "GBP" }) {
  const [convertedPrices, setConvertedPrices] = useState({})
  const [selectedCurrency, setSelectedCurrency] = useState("USD")

  // Mock exchange rates (in a real app, you'd fetch these from an API)
  const exchangeRates = {
    GBP: {
      USD: 1.27,
      BDT: 156.5,
      GBP: 1,
    },
    USD: {
      GBP: 0.79,
      BDT: 123.45,
      USD: 1,
    },
    BDT: {
      GBP: 0.0064,
      USD: 0.0081,
      BDT: 1,
    },
  }

  const currencies = [
    { code: "USD", symbol: "$", name: "US Dollar" },
    { code: "BDT", symbol: "৳", name: "Bangladeshi Taka" },
    { code: "GBP", symbol: "£", name: "British Pound" },
  ]

  useEffect(() => {
    const converted = {}
    currencies.forEach((currency) => {
      const rate = exchangeRates[baseCurrency][currency.code]
      converted[currency.code] = (basePrice * rate).toFixed(2)
    })
    setConvertedPrices(converted)
  }, [basePrice, baseCurrency])

  const getCurrentPrice = () => {
    const currency = currencies.find((c) => c.code === selectedCurrency)
    return `${currency?.symbol}${convertedPrices[selectedCurrency] || basePrice}`
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center space-x-2">
        <span className="text-lg font-medium">{getCurrentPrice()}</span>
        <select
          value={selectedCurrency}
          onChange={(e) => setSelectedCurrency(e.target.value)}
          className="text-sm border border-gray-300 rounded px-2 py-1 bg-white"
        >
          {currencies.map((currency) => (
            <option key={currency.code} value={currency.code}>
              {currency.code}
            </option>
          ))}
        </select>
      </div>

      {/* Show all prices */}
      <div className="text-xs text-gray-500 space-y-1">
        {currencies
          .filter((c) => c.code !== selectedCurrency)
          .map((currency) => (
            <div key={currency.code}>
              {currency.symbol}
              {convertedPrices[currency.code]} {currency.code}
            </div>
          ))}
      </div>
    </div>
  )
}
