"use client"

import { useState, useEffect } from "react"
import { ChevronDown } from "lucide-react"

export default function PriceRangeFilter({
    minPrice,
    maxPrice,
    onPriceChange,
    className = ""
}) {
    const [isOpen, setIsOpen] = useState(false)
    const [localMinPrice, setLocalMinPrice] = useState(minPrice || "")
    const [localMaxPrice, setLocalMaxPrice] = useState(maxPrice || "")

    // Predefined price ranges for quick selection
    const priceRanges = [
        { label: "Under ৳500", min: 0, max: 500 },
        { label: "৳500 - ৳1,000", min: 500, max: 1000 },
        { label: "৳1,000 - ৳1,500", min: 1000, max: 1500 },
        { label: "৳1,500 - ৳2,000", min: 1500, max: 2000 },
        { label: "৳2,000 - ৳3,000", min: 2000, max: 3000 },
        { label: "৳3,000 - ৳5,000", min: 3000, max: 5000 },
        { label: "Above ৳5,000", min: 5000, max: null },
    ]

    // Update local state when props change
    useEffect(() => {
        setLocalMinPrice(minPrice || "")
        setLocalMaxPrice(maxPrice || "")
    }, [minPrice, maxPrice])

    const handleApplyRange = () => {
        const min = localMinPrice === "" ? null : Number(localMinPrice)
        const max = localMaxPrice === "" ? null : Number(localMaxPrice)

        // Validate range
        if (min !== null && max !== null && min > max) {
            alert("Minimum price cannot be greater than maximum price")
            return
        }

        onPriceChange(min, max)
        setIsOpen(false)
    }

    const handlePresetRange = (min, max) => {
        setLocalMinPrice(min || "")
        setLocalMaxPrice(max || "")
        onPriceChange(min, max)
        setIsOpen(false)
    }

    const clearFilter = () => {
        setLocalMinPrice("")
        setLocalMaxPrice("")
        onPriceChange(null, null)
        setIsOpen(false)
    }

    const getCurrentRangeLabel = () => {
        if (!minPrice && !maxPrice) return "Price Range"
        if (!minPrice) return `Up to ৳${maxPrice}`
        if (!maxPrice) return `৳${minPrice}+`
        return `৳${minPrice} - ৳${maxPrice}`
    }
    return (
        <div className={`relative ${className}`}>
            {/* Price Range Button */}      <button
                onClick={() => setIsOpen(!isOpen)}
                className={`px-3 md:px-4 py-2 text-xs font-medium border border-gray-300 hover:bg-gray-50 flex items-center gap-2 rounded-md transition-colors whitespace-nowrap ${(minPrice || maxPrice) ? "bg-black text-white border-black hover:bg-gray-800" : "bg-white text-gray-700"
                    }`}
            >
                {getCurrentRangeLabel()}
                <ChevronDown className={`w-3 h-3 transition-transform ${isOpen ? "rotate-180" : ""}`} />
            </button>{/* Dropdown Menu */}
            {isOpen && (
                <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 w-80 max-w-[90vw]">
                    <div className="p-4 space-y-4">
                        {/* Custom Range Input */}
                        <div>
                            <h4 className="text-sm font-medium text-gray-700 mb-3">Custom Range</h4>
                            <div className="flex items-center gap-2">
                                <div className="flex-1">                  <input
                                    type="number"
                                    placeholder="Min"
                                    value={localMinPrice}
                                    onChange={(e) => setLocalMinPrice(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                                    min="0"
                                />
                                </div>
                                <span className="text-gray-400">to</span>
                                <div className="flex-1">                  <input
                                    type="number"
                                    placeholder="Max"
                                    value={localMaxPrice}
                                    onChange={(e) => setLocalMaxPrice(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                                    min="0"
                                />
                                </div>
                            </div>              <div className="flex gap-2 mt-3">
                                <button
                                    onClick={handleApplyRange}
                                    className="flex-1 px-4 py-2 bg-black text-white text-xs font-medium rounded hover:bg-gray-800 transition-colors"
                                >
                                    Apply
                                </button>
                                <button
                                    onClick={clearFilter}
                                    className="px-4 py-2 border border-gray-300 text-gray-600 text-xs font-medium rounded hover:bg-gray-50 transition-colors"
                                >
                                    Clear
                                </button>
                            </div>
                        </div>

                        {/* Divider */}
                        <div className="border-t border-gray-200"></div>

                        {/* Preset Ranges */}
                        <div>
                            <h4 className="text-sm font-medium text-gray-700 mb-3">Quick Select</h4>
                            <div className="space-y-1">                {priceRanges.map((range, index) => (
                                <button
                                    key={index}
                                    onClick={() => handlePresetRange(range.min, range.max)}
                                    className="w-full text-left px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded transition-colors"
                                >
                                    {range.label}
                                </button>
                            ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Backdrop */}
            {isOpen && (
                <div
                    className="fixed inset-0 z-40"
                    onClick={() => setIsOpen(false)}
                />
            )}
        </div>
    )
}
