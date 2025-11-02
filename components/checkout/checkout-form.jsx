"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Loader2 } from "lucide-react"
import { createCheckoutSession } from "@/lib/stripe"
import { getSavedAddresses, saveAddress } from "@/lib/addresses"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select"

export function CheckoutForm({ cartItems, total }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [savedAddresses, setSavedAddresses] = useState([])
  const [selectedAddressId, setSelectedAddressId] = useState("new")
  const [saveForNext, setSaveForNext] = useState(true)
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    zipCode: "",
    notes: "",
  })

  useEffect(() => {
    const load = async () => {
      try {
        const { addresses } = await getSavedAddresses()
        setSavedAddresses(addresses)
        if (addresses && addresses.length > 0) {
          const def = addresses.find(a => a.is_default) || addresses[0]
          setSelectedAddressId(def.id)
          setFormData((prev) => ({
            ...prev,
            fullName: def.fullName || "",
            email: def.email || "",
            phone: def.phone || "",
            address: def.address || "",
            city: def.city || "",
            state: def.state || "",
            zipCode: def.zipCode || "",
          }))
        }
      } catch (e) {
        console.warn("Failed to load saved addresses", e)
      }
    }
    load()
  }, [])

  const onSelectAddress = (value) => {
    setSelectedAddressId(value)
    if (value === "new") {
      setFormData((prev) => ({ ...prev, fullName: "", email: "", phone: "", address: "", city: "", state: "", zipCode: "" }))
      return
    }
    const found = savedAddresses.find((a) => a.id === value)
    if (found) {
      setFormData((prev) => ({
        ...prev,
        fullName: found.fullName || "",
        email: found.email || "",
        phone: found.phone || "",
        address: found.address || "",
        city: found.city || "",
        state: found.state || "",
        zipCode: found.zipCode || "",
      }))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      // If entering a new address and opted in, save it as default
      if (selectedAddressId === "new" && saveForNext) {
        try {
          await saveAddress({
            fullName: formData.fullName,
            email: formData.email,
            phone: formData.phone,
            address: formData.address,
            city: formData.city,
            state: formData.state,
            zipCode: formData.zipCode,
          }, true)
        } catch (err) {
          console.warn("Saving address failed:", err)
        }
      }

      const { sessionId, error } = await createCheckoutSession(cartItems, formData, total)

      if (error) {
        alert("Error creating checkout session: " + error)
        setLoading(false)
        return
      }

      // Redirect to Stripe Checkout using the session URL
      if (sessionId) {
        window.location.href = sessionId
      } else {
        throw new Error("No session URL received")
      }
    } catch (error) {
      console.error("Checkout error:", error)
      alert("Error processing checkout: " + error.message)
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Shipping Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Saved addresses selector */}
          {savedAddresses.length > 0 && (
            <div className="space-y-2">
              <Label>Choose Saved Address</Label>
              <Select value={selectedAddressId} onValueChange={onSelectAddress}>
                <SelectTrigger>
                  <SelectValue placeholder="Select an address" />
                </SelectTrigger>
                <SelectContent>
                  {savedAddresses.map((addr) => (
                    <SelectItem key={addr.id} value={addr.id}>
                      {addr.label ? `${addr.label} — ` : ""}{addr.fullName}, {addr.address}, {addr.city}
                      {addr.is_default ? " (Default)" : ""}
                    </SelectItem>
                  ))}
                  <SelectItem value="new">Use a new address</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name *</Label>
              <Input
                id="fullName"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number *</Label>
            <Input
              id="phone"
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Street Address *</Label>
            <Input
              id="address"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              required
            />
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="city">City *</Label>
              <Input
                id="city"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="state">State *</Label>
              <Input
                id="state"
                value={formData.state}
                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="zipCode">ZIP Code *</Label>
              <Input
                id="zipCode"
                value={formData.zipCode}
                onChange={(e) => setFormData({ ...formData, zipCode: e.target.value })}
                required
              />
            </div>
          </div>

          {/* Save new address toggle - only meaningful when entering new */}
          {selectedAddressId === "new" && (
            <div className="flex items-center space-x-2">
              <Checkbox id="saveAddress" checked={saveForNext} onCheckedChange={(v) => setSaveForNext(!!v)} />
              <Label htmlFor="saveAddress">Save this address for next time</Label>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="notes">Order Notes (Optional)</Label>
            <Textarea
              id="notes"
              rows={3}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Any special instructions for your order..."
            />
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
          `Pay ৳${total.toFixed(2)} with Stripe`
        )}
      </Button>
      <div className="text-center text-sm text-muted-foreground">
        Prefer Cash on Delivery? <a href="/checkout/cod" className="underline">Place COD order</a> · Want to send a gift? <a href="/checkout/gift" className="underline">Go to Gift Checkout</a>
      </div>
    </form>
  )
}
