// filepath: f:\\web development\\24 project\\apu\\new version\\shuvaapumain\\components\\admin\\inventory-dashboard.jsx
"use client"

import { useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { getInventoryStatus, recordInventoryMovement, updateVariant, setProductDiscount } from "@/lib/inventory"
import { Loader2, Plus, Minus, Percent, RefreshCw, Bell } from "lucide-react"

export default function InventoryDashboard() {
    const [rows, setRows] = useState([])
    const [loading, setLoading] = useState(true)
    const [updatingId, setUpdatingId] = useState(null)
    const [filters, setFilters] = useState({ search: "", restockOnly: false, productId: null })
    const [discounting, setDiscounting] = useState(false)

    const load = async () => {
        setLoading(true)
        const { data } = await getInventoryStatus({ onlyNeedsRestock: filters.restockOnly })
        setRows(data || [])
        setLoading(false)
    }

    useEffect(() => { load() }, [filters.restockOnly])

    const filtered = useMemo(() => {
        let data = rows
        if (filters.productId) data = data.filter(r => r.product_id === filters.productId)
        const s = filters.search.trim().toLowerCase()
        if (!s) return data
        return data.filter(r =>
            r.product_name?.toLowerCase().includes(s) ||
            (r.color || '').toLowerCase().includes(s) ||
            (r.size || '').toLowerCase().includes(s)
        )
    }, [rows, filters])

    const changeStock = async (variant_id, product_id, delta) => {
        setUpdatingId(variant_id)
        await recordInventoryMovement({ product_id, variant_id, quantity: Math.abs(delta), movement_type: delta >= 0 ? 'in' : 'out', reason: delta >= 0 ? 'Manual restock' : 'Manual deduction' })
        // Refresh table only; do not full page reload
        await load()
        setUpdatingId(null)
    }

    const setThreshold = async (variant_id, value) => {
        setUpdatingId(variant_id)
        await updateVariant(variant_id, { restock_threshold: Math.max(0, parseInt(value || '0', 10)) })
        await load()
        setUpdatingId(null)
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
            <div className="flex items-center gap-3 mb-4">
                <Input placeholder="Search by product, color, size" value={filters.search} onChange={(e) => setFilters({ ...filters, search: e.target.value })} />
                <Select value={filters.restockOnly ? 'yes' : 'no'} onValueChange={(v) => setFilters({ ...filters, restockOnly: v === 'yes' })}>
                    <SelectTrigger className="w-48"><SelectValue placeholder="Restock filter" /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="no">All</SelectItem>
                        <SelectItem value="yes">Needs Restock</SelectItem>
                    </SelectContent>
                </Select>
                <Button variant="outline" onClick={load}><RefreshCw className="w-4 h-4 mr-2" />Refresh</Button>
                <Button variant="secondary" onClick={applyDiscounts} disabled={discounting}>
                    {discounting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Percent className="w-4 h-4 mr-2" />} Apply Stale Discounts
                </Button>
                {filters.productId && <Button variant="ghost" onClick={clearFocus}>Clear Focus</Button>}
            </div>

            <div className="overflow-auto">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Product</TableHead>
                            <TableHead>Color</TableHead>
                            <TableHead>Size</TableHead>
                            <TableHead>In Stock</TableHead>
                            <TableHead>Reserved</TableHead>
                            <TableHead>Threshold</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow><TableCell colSpan={8} className="text-center py-8"><Loader2 className="w-5 h-5 inline mr-2 animate-spin" /> Loading...</TableCell></TableRow>
                        ) : filtered.length === 0 ? (
                            <TableRow><TableCell colSpan={8} className="text-center py-8">No variants found</TableCell></TableRow>
                        ) : filtered.map(row => (
                            <TableRow key={row.variant_id}>
                                <TableCell className="flex items-center gap-2">
                                    <span>{row.product_name}</span>
                                    {row.needs_restock && (
                                        <button title="Low stock" onClick={() => focusLowStock(row.product_id)} className="text-red-600"><Bell className="w-4 h-4" /></button>
                                    )}
                                </TableCell>
                                <TableCell className="capitalize">{row.color || '-'}</TableCell>
                                <TableCell>{row.size || '-'}</TableCell>
                                <TableCell>{row.stock_quantity}</TableCell>
                                <TableCell>{row.reserved_quantity}</TableCell>
                                <TableCell>
                                    <Input type="number" className="w-24" defaultValue={row.restock_threshold} onBlur={(e) => setThreshold(row.variant_id, e.target.value)} />
                                </TableCell>
                                <TableCell>
                                    {row.needs_restock ? (
                                        <Badge variant="destructive">Needs Restock</Badge>
                                    ) : (
                                        <Badge variant="secondary">OK</Badge>
                                    )}
                                </TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-2">
                                        <Button size="sm" onClick={() => changeStock(row.variant_id, row.product_id, -1)} disabled={updatingId === row.variant_id}><Minus className="w-4 h-4" /></Button>
                                        <Button size="sm" onClick={() => changeStock(row.variant_id, row.product_id, +1)} disabled={updatingId === row.variant_id}><Plus className="w-4 h-4" /></Button>
                                        <Button size="sm" variant="outline" onClick={() => setDiscountForProduct(row.product_id)}><Percent className="w-4 h-4" /></Button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}
