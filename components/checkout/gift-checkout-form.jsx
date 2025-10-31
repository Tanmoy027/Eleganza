"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Loader2 } from "lucide-react"
import { createGiftCheckoutSession } from "@/lib/gift"

export function GiftCheckoutForm({ cartItems, total }) {
    const [loading, setLoading] = useState(false)
    const [formData, setFormData] = useState({
        senderName: "",
        senderEmail: "",
        senderPhone: "",
        recipientName: "",
        recipientEmail: "",
        recipientPhone: "",
        recipientAddress: "",
        recipientCity: "",
        recipientState: "",
        recipientZip: "",
        giftMessage: "",
    })

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)

        try {
            const { sessionId, error } = await createGiftCheckoutSession(cartItems, formData, total)

            if (error) {
                alert("Error creating gift checkout: " + error)
                setLoading(false)
                return
            }

            if (sessionId) {
                window.location.href = sessionId
            }
        } catch (error) {
            console.error("Gift checkout error:", error)
            alert("Error processing gift checkout: " + error.message)
            setLoading(false)
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Sender Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                            <Label htmlFor="senderName">Your Name *</Label>
                            <Input id="senderName" value={formData.senderName} onChange={(e) => setFormData({ ...formData, senderName: e.target.value })} required />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="senderEmail">Your Email *</Label>
                            <Input id="senderEmail" type="email" value={formData.senderEmail} onChange={(e) => setFormData({ ...formData, senderEmail: e.target.value })} required />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="senderPhone">Your Phone *</Label>
                        <Input id="senderPhone" type="tel" value={formData.senderPhone} onChange={(e) => setFormData({ ...formData, senderPhone: e.target.value })} required />
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Recipient Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                            <Label htmlFor="recipientName">Recipient Name *</Label>
                            <Input id="recipientName" value={formData.recipientName} onChange={(e) => setFormData({ ...formData, recipientName: e.target.value })} required />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="recipientEmail">Recipient Email *</Label>
                            <Input id="recipientEmail" type="email" value={formData.recipientEmail} onChange={(e) => setFormData({ ...formData, recipientEmail: e.target.value })} required />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="recipientPhone">Recipient Phone *</Label>
                        <Input id="recipientPhone" type="tel" value={formData.recipientPhone} onChange={(e) => setFormData({ ...formData, recipientPhone: e.target.value })} required />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="recipientAddress">Recipient Address *</Label>
                        <Input id="recipientAddress" value={formData.recipientAddress} onChange={(e) => setFormData({ ...formData, recipientAddress: e.target.value })} required />
                    </div>
                    <div className="grid gap-4 md:grid-cols-3">
                        <div className="space-y-2">
                            <Label htmlFor="recipientCity">City *</Label>
                            <Input id="recipientCity" value={formData.recipientCity} onChange={(e) => setFormData({ ...formData, recipientCity: e.target.value })} required />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="recipientState">State *</Label>
                            <Input id="recipientState" value={formData.recipientState} onChange={(e) => setFormData({ ...formData, recipientState: e.target.value })} required />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="recipientZip">ZIP Code *</Label>
                            <Input id="recipientZip" value={formData.recipientZip} onChange={(e) => setFormData({ ...formData, recipientZip: e.target.value })} required />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="giftMessage">Gift Message (Optional)</Label>
                        <Textarea id="giftMessage" rows={3} value={formData.giftMessage} onChange={(e) => setFormData({ ...formData, giftMessage: e.target.value })} placeholder="Write a message to include with the gift" />
                    </div>
                </CardContent>
            </Card>

            <Button type="submit" size="lg" className="w-full" disabled={loading}>
                {loading ? (
                    <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Processing...
                    </>
                ) : (
                    `Pay ৳${total.toFixed(2)} for Gift`
                )}
            </Button>
        </form>
    )
}
