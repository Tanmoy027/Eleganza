// filepath: f:\\web development\\24 project\\apu\\new version\\shuvaapumain\\components\\admin\\inventory-dashboard.jsx
"use client"

import { useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { getInventoryStatus, /* recordInventoryMovement, */ updateVariant, setProductDiscount } from "@/lib/inventory"
import { Loader2, Plus, Minus, Percent, RefreshCw, Bell } from "lucide-react"

export default function InventoryDashboard() {
    const [rows, setRows] = useState([])
    const [loading, setLoading] = useState(true)
    const [updatingId, setUpdatingId] = useState(null)
    const [filters, setFilters] = useState({ search: "", productId: null })
    const [discounting, setDiscounting] = useState(false)
    const [currentPage, setCurrentPage] = useState(1)
    const itemsPerPage = 20
    const [pendingChanges, setPendingChanges] = useState({})
    const [updateStatus, setUpdateStatus] = useState({})
    const [originalStockValues, setOriginalStockValues] = useState({})
    const [additionalStock, setAdditionalStock] = useState({})

    const getStockWarningLevel = (row) => {
        const qty = Number(row?.stock_quantity ?? 0)
        if (qty < 5) return "critical"
        if (qty < 10) return "low"
        return null
    }

    const load = async () => {
        setLoading(true)
        const { data } = await getInventoryStatus()
        setRows(data || [])

        // Store original stock values when data loads
        const originalValues = {}
        if (data) {
            data.forEach(row => {
                if (row.variant_id) {
                    originalValues[row.variant_id] = {
                        stock_quantity: row.stock_quantity || 0,
                        reserved_quantity: row.reserved_quantity || 0
                    }
                }
            })
        }
        setOriginalStockValues(originalValues)
        setLoading(false)
    }

    useEffect(() => {
        let mounted = true

        const loadData = async () => {
            if (mounted) {
                await load()
            }
        }

        loadData()

        return () => {
            mounted = false
        }
    }, [])

    const filtered = useMemo(() => {
        let data = rows
        if (filters.productId) data = data.filter(r => r.product_id === filters.productId)
        const s = filters.search.trim().toLowerCase()
        if (!s) return data
        return data.filter(r => r.product_name?.toLowerCase().includes(s))
    }, [rows, filters])

    // Pagination
    const totalPages = Math.ceil(filtered.length / itemsPerPage)
    const paginatedData = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage
        return filtered.slice(startIndex, startIndex + itemsPerPage)
    }, [filtered, currentPage, itemsPerPage])

    // Reset to page 1 when filters change
    useEffect(() => {
        setCurrentPage(1)
    }, [filters.search, filters.productId])    // Change stock locally without saving
    const changeStock = (variant_id, delta) => {
        const current = rows.find(r => r.variant_id === variant_id)
        const originalStock = originalStockValues[variant_id]?.stock_quantity ?? current?.stock_quantity ?? 0

        // Store original value if not already stored
        if (!originalStockValues[variant_id]) {
            setOriginalStockValues(prev => ({
                ...prev,
                [variant_id]: {
                    stock_quantity: current?.stock_quantity || 0,
                    reserved_quantity: current?.reserved_quantity || 0
                }
            }))
        }

        // Update additional stock
        const currentAdditional = additionalStock[variant_id] || 0
        const newAdditional = Math.max(-originalStock, currentAdditional + delta)
        const totalStock = originalStock + newAdditional

        setAdditionalStock(prev => ({
            ...prev,
            [variant_id]: newAdditional
        }))

        // Update UI locally
        setRows(prev => prev.map(r => r.variant_id === variant_id
            ? { ...r, stock_quantity: totalStock, needs_restock: totalStock <= (r.restock_threshold ?? 0) }
            : r
        ))

        // Track pending change
        setPendingChanges(prev => ({
            ...prev,
            [variant_id]: { ...prev[variant_id], stock_quantity: totalStock }
        }))

        // Clear any previous status
        setUpdateStatus(prev => {
            const newStatus = { ...prev }
            delete newStatus[variant_id]
            return newStatus
        })
    }

    // Handle manual additional stock input
    const handleAdditionalStockInput = (variant_id, value) => {
        const additionalQty = parseInt(value || '0', 10)
        const current = rows.find(r => r.variant_id === variant_id)
        const originalStock = originalStockValues[variant_id]?.stock_quantity ?? current?.stock_quantity ?? 0

        // Store original value if not already stored
        if (!originalStockValues[variant_id]) {
            setOriginalStockValues(prev => ({
                ...prev,
                [variant_id]: {
                    stock_quantity: current?.stock_quantity || 0,
                    reserved_quantity: current?.reserved_quantity || 0
                }
            }))
        }

        const newAdditional = Math.max(-originalStock, additionalQty)
        const totalStock = originalStock + newAdditional

        setAdditionalStock(prev => ({
            ...prev,
            [variant_id]: newAdditional
        }))

        // Update UI locally
        setRows(prev => prev.map(r => r.variant_id === variant_id
            ? { ...r, stock_quantity: totalStock, needs_restock: totalStock <= (r.restock_threshold ?? 0) }
            : r
        ))

        // Track pending change
        setPendingChanges(prev => ({
            ...prev,
            [variant_id]: { ...prev[variant_id], stock_quantity: totalStock }
        }))

        // Clear any previous status
        setUpdateStatus(prev => {
            const newStatus = { ...prev }
            delete newStatus[variant_id]
            return newStatus
        })
    }

    // Save pending changes for a specific variant
    const saveChanges = async (variant_id) => {
        if (!pendingChanges[variant_id]) return

        setUpdatingId(variant_id)
        setUpdateStatus(prev => ({ ...prev, [variant_id]: 'saving' }))

        try {
            const { error } = await updateVariant(variant_id, pendingChanges[variant_id])
            if (error) {
                console.error('Stock update error:', error)
                setUpdateStatus(prev => ({ ...prev, [variant_id]: 'error' }))
                setTimeout(() => {
                    setUpdateStatus(prev => {
                        const newStatus = { ...prev }
                        delete newStatus[variant_id]
                        return newStatus
                    })
                }, 3000)
            } else {
                setUpdateStatus(prev => ({ ...prev, [variant_id]: 'success' }))
                setPendingChanges(prev => {
                    const newChanges = { ...prev }
                    delete newChanges[variant_id]
                    return newChanges
                })
                // Clear additional stock and update original values after successful save
                setAdditionalStock(prev => {
                    const newAdditional = { ...prev }
                    delete newAdditional[variant_id]
                    return newAdditional
                })
                setOriginalStockValues(prev => ({
                    ...prev,
                    [variant_id]: {
                        stock_quantity: rows.find(r => r.variant_id === variant_id)?.stock_quantity || 0,
                        reserved_quantity: rows.find(r => r.variant_id === variant_id)?.reserved_quantity || 0
                    }
                }))
                setTimeout(() => {
                    setUpdateStatus(prev => {
                        const newStatus = { ...prev }
                        delete newStatus[variant_id]
                        return newStatus
                    })
                }, 2000)
            }
        } catch (err) {
            console.error('Stock update failed:', err)
            setUpdateStatus(prev => ({ ...prev, [variant_id]: 'error' }))
            setTimeout(() => {
                setUpdateStatus(prev => {
                    const newStatus = { ...prev }
                    delete newStatus[variant_id]
                    return newStatus
                })
            }, 3000)
        } finally {
            setUpdatingId(null)
        }
    }

    const applyDiscounts = async () => {
        setDiscounting(true)
        await fetch("/api/admin/inventory/apply-discounts", { method: "POST" })
        await load()
        setDiscounting(false)
    }

    const setDiscountForProduct = async (product_id) => {
        const val = prompt('Set discount percentage for this product (0-90):', '15')
        if (val == null) return
        const pct = Math.max(0, Math.min(90, parseInt(val, 10) || 0))
        await setProductDiscount(product_id, pct)
        await load()
    }

    const focusLowStock = (product_id) => {
        setFilters(f => ({ ...f, productId: product_id }))
    }

    const clearFocus = () => setFilters(f => ({ ...f, productId: null }))

    return (
        <div className="bg-white border rounded-lg p-4">
            <div className="space-y-4 mb-4">
                <div className="flex items-center gap-3">
                    <Input placeholder="Search by product name" value={filters.search} onChange={(e) => setFilters({ ...filters, search: e.target.value })} />
                    <Button type="button" variant="outline" onClick={load}><RefreshCw className="w-4 h-4 mr-2" />Refresh</Button>
                    <Button type="button" variant="secondary" onClick={applyDiscounts} disabled={discounting}>
                        {discounting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Percent className="w-4 h-4 mr-2" />} Apply Stale Discounts
                    </Button>
                    {filters.productId && <Button type="button" variant="ghost" onClick={clearFocus}>Clear Focus</Button>}
                </div>
                <div className="flex items-center justify-between text-sm text-gray-600">
                    <span>Showing {paginatedData.length} of {filtered.length} items</span>
                    {totalPages > 1 && (
                        <div className="flex items-center gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                            >
                                Previous
                            </Button>
                            <span>Page {currentPage} of {totalPages}</span>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                disabled={currentPage === totalPages}
                            >
                                Next
                            </Button>
                        </div>
                    )}
                </div>
            </div>

            <div className="overflow-auto">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Product</TableHead>
                            <TableHead>Color</TableHead>
                            <TableHead>Size</TableHead>
                            <TableHead>In Stock</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow><TableCell colSpan={6} className="text-center py-8"><Loader2 className="w-5 h-5 inline mr-2 animate-spin" /> Loading...</TableCell></TableRow>
                        ) : paginatedData.length === 0 ? (
                            <TableRow><TableCell colSpan={6} className="text-center py-8">No products found</TableCell></TableRow>
                        ) : paginatedData.map((row, index) => (
                            <TableRow key={row.variant_id || `product-${row.product_id}-${index}`}>
                                <TableCell className="flex items-center gap-2">
                                    <span>{row.product_name}</span>
                                    {getStockWarningLevel(row) === "critical" && (
                                        <button type="button" title="Stock under 5" onClick={() => focusLowStock(row.product_id)} className="text-red-600"><Bell className="w-4 h-4" /></button>
                                    )}
                                    {getStockWarningLevel(row) === "low" && (
                                        <button type="button" title="Stock under 10" onClick={() => focusLowStock(row.product_id)} className="text-black"><Bell className="w-4 h-4" /></button>
                                    )}
                                    {/* Black notification for stale (no sales in 7+ days) */}
                                    {(((row.days_without_sale ?? (row.last_sold_at ? Math.floor((Date.now() - new Date(row.last_sold_at).getTime()) / 86400000) : Infinity)) >= 7) && ((row.stock_quantity ?? 0) > 0)) && (
                                        <button
                                            type="button"
                                            title="No sales in 7+ days • Click to set a discount"
                                            onClick={() => setDiscountForProduct(row.product_id)}
                                            className="text-black"
                                        >
                                            <Bell className="w-4 h-4" />
                                        </button>
                                    )}
                                </TableCell>
                                <TableCell className="capitalize">{row.color || '-'}</TableCell>
                                <TableCell>{row.size || '-'}</TableCell>
                                <TableCell>
                                    {row.variant_id ? (
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2">
                                                <div className="text-sm font-medium">
                                                    Current: {originalStockValues[row.variant_id]?.stock_quantity ?? row.stock_quantity ?? 0}
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Input
                                                    type="number"
                                                    placeholder="Add/Remove"
                                                    className={`w-24 ${additionalStock[row.variant_id] !== undefined && additionalStock[row.variant_id] !== 0 ? 'border-blue-500 bg-blue-50' : ''}`}
                                                    value={additionalStock[row.variant_id] || ''}
                                                    onChange={(e) => handleAdditionalStockInput(row.variant_id, e.target.value)}
                                                />
                                                <div className="flex items-center gap-1">
                                                    <Button
                                                        type="button"
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => changeStock(row.variant_id, -1)}
                                                        disabled={updatingId === row.variant_id}
                                                        className="h-8 w-8 p-0"
                                                    >
                                                        <Minus className="w-4 h-4" />
                                                    </Button>
                                                    <Button
                                                        type="button"
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => changeStock(row.variant_id, +1)}
                                                        disabled={updatingId === row.variant_id}
                                                        className="h-8 w-8 p-0"
                                                    >
                                                        <Plus className="w-4 h-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                            {additionalStock[row.variant_id] !== undefined && additionalStock[row.variant_id] !== 0 && (
                                                <div className="text-xs space-y-1">
                                                    <div className="text-gray-600">
                                                        <span className="text-blue-600">Old Stock: {originalStockValues[row.variant_id]?.stock_quantity ?? 0}</span>
                                                    </div>
                                                    <div className="text-gray-600">
                                                        <span className={additionalStock[row.variant_id] >= 0 ? "text-green-600" : "text-red-600"}>
                                                            {additionalStock[row.variant_id] >= 0 ? '+' : ''}{additionalStock[row.variant_id]} Stock
                                                        </span>
                                                    </div>
                                                    <div className="font-semibold text-purple-600">
                                                        Total New: {row.stock_quantity}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <span className="text-gray-400 text-xs">No variants</span>
                                    )}
                                </TableCell>
                                <TableCell>
                                    {getStockWarningLevel(row) === "critical" ? (
                                        <Badge variant="destructive">Under 5</Badge>
                                    ) : getStockWarningLevel(row) === "low" ? (
                                        <Badge className="bg-black text-white">Under 10</Badge>
                                    ) : row.variant_id ? (
                                        <Badge variant="secondary">OK</Badge>
                                    ) : (
                                        <Badge variant="outline">No Variants</Badge>
                                    )}
                                </TableCell>
                                <TableCell>
                                    {row.variant_id ? (
                                        <div className="flex items-center gap-2 flex-wrap">
                                            {pendingChanges[row.variant_id] && (
                                                <Button
                                                    type="button"
                                                    size="sm"
                                                    variant="default"
                                                    onClick={() => saveChanges(row.variant_id)}
                                                    disabled={updatingId === row.variant_id}
                                                    className="bg-blue-600 hover:bg-blue-700"
                                                >
                                                    {updatingId === row.variant_id ? (
                                                        <Loader2 className="w-4 h-4 animate-spin" />
                                                    ) : (
                                                        'Update'
                                                    )}
                                                </Button>
                                            )}
                                            {updateStatus[row.variant_id] === 'success' && (
                                                <span className="text-xs text-green-600 font-medium">✓ Saved</span>
                                            )}
                                            {updateStatus[row.variant_id] === 'error' && (
                                                <span className="text-xs text-red-600 font-medium">✗ Error</span>
                                            )}
                                            <Button
                                                type="button"
                                                size="sm"
                                                variant="outline"
                                                onClick={() => setDiscountForProduct(row.product_id)}
                                            >
                                                <Percent className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    ) : (
                                        <span className="text-gray-400 text-xs">Create variants first</span>
                                    )}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}
