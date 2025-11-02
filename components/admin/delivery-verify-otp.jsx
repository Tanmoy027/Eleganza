// filepath: f:\\web development\\24 project\\apu\\new version\\shuvaapumain\\components\\admin\\delivery-verify-otp.jsx
"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

export default function DeliveryVerifyOTP() {
    const [orderIdentifier, setOrderIdentifier] = useState("")
    const [otp, setOtp] = useState("")
    const [loading, setLoading] = useState(false)
    const [result, setResult] = useState(null)

    const submit = async (e) => {
        e.preventDefault()
        setLoading(true)
        setResult(null)
        try {
            const res = await fetch("/api/admin/orders/verify-delivery-otp", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ orderIdentifier, otp })
            })
            const data = await res.json()
            if (!res.ok) throw new Error(data.error || "Failed")
            setResult({ type: "success", message: `Success: ${data.message}. Status: ${data.status}${data.payment_status ? `, Payment: ${data.payment_status}` : ''}` })
            setOrderIdentifier("")
            setOtp("")
        } catch (err) {
            setResult({ type: "error", message: err.message })
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="border rounded-lg p-4 bg-white">
            <h3 className="text-lg font-semibold mb-2">Delivery OTP Verification</h3>
            <p className="text-sm text-gray-600 mb-4">Enter the Order Number (preferred) or Order ID and the customer's OTP to confirm delivery.</p>
            <form onSubmit={submit} className="space-y-3">
                <div>
                    <label className="block text-sm mb-1">Order Number or Order ID</label>
                    <Input value={orderIdentifier} onChange={(e) => setOrderIdentifier(e.target.value)} placeholder="e.g. ORD-20250101-1234 or UUID" required />
                </div>
                <div>
                    <label className="block text-sm mb-1">OTP</label>
                    <Input value={otp} onChange={(e) => setOtp(e.target.value)} placeholder="4-digit code" maxLength={8} required />
                </div>
                <Button type="submit" disabled={loading}>{loading ? "Verifying..." : "Verify & Confirm Delivery"}</Button>
            </form>
            {result && (
                <div className={`mt-3 text-sm ${result.type === "success" ? "text-green-700" : "text-red-600"}`}>
                    {result.message}
                </div>
            )}
        </div>
    )
}
