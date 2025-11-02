"use client"

import { useState, useEffect } from "react"
import { createBrowserClient } from "@supabase/ssr"
import { Package, Truck, CheckCircle, Clock, XCircle, MapPin } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

export default function RealTimeOrderTracking({ orderId, initialOrder }) {
    const [order, setOrder] = useState(initialOrder)
    const [tracking, setTracking] = useState(initialOrder.order_tracking || [])
    const [copied, setCopied] = useState(false)

    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    )

    useEffect(() => {
        // Subscribe to order changes
        const orderChannel = supabase
            .channel(`order-${orderId}`)
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'orders',
                    filter: `id=eq.${orderId}`
                },
                (payload) => {
                    setOrder(prevOrder => ({ ...prevOrder, ...payload.new }))
                }
            )
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'order_tracking',
                    filter: `order_id=eq.${orderId}`
                },
                (payload) => {
                    setTracking(prevTracking => [payload.new, ...prevTracking])
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(orderChannel)
        }
    }, [orderId, supabase])

    const getStatusIcon = (status) => {
        switch (status?.toLowerCase()) {
            case 'pending':
                return <Clock className="w-5 h-5" />
            case 'confirmed':
            case 'processing':
                return <Package className="w-5 h-5" />
            case 'shipped':
            case 'out_for_delivery':
                return <Truck className="w-5 h-5" />
            case 'delivered':
            case 'completed':
                return <CheckCircle className="w-5 h-5" />
            case 'cancelled':
            case 'refunded':
                return <XCircle className="w-5 h-5" />
            default:
                return <Package className="w-5 h-5" />
        }
    }

    const getStatusColor = (status) => {
        switch (status?.toLowerCase()) {
            case 'pending':
                return 'bg-yellow-100 text-yellow-800 border-yellow-200'
            case 'confirmed':
            case 'processing':
                return 'bg-blue-100 text-blue-800 border-blue-200'
            case 'shipped':
            case 'out_for_delivery':
                return 'bg-purple-100 text-purple-800 border-purple-200'
            case 'delivered':
            case 'completed':
                return 'bg-green-100 text-green-800 border-green-200'
            case 'cancelled':
            case 'refunded':
                return 'bg-red-100 text-red-800 border-red-200'
            default:
                return 'bg-gray-100 text-gray-800 border-gray-200'
        }
    }

    const statusSteps = ['pending', 'confirmed', 'processing', 'shipped', 'delivered']
    const currentStepIndex = statusSteps.indexOf(order.status?.toLowerCase())

    // Extract latest OTP from tracking messages (from most recent entries)
    const latestOtpEntry = tracking.find(t => (t.status || '').toLowerCase() === 'otp')
    const otpCode = latestOtpEntry ? String(latestOtpEntry.message || '').match(/\d{4,8}/)?.[0] : null
    const orderStatus = (order.status || '').toLowerCase()

    const copyOtp = async () => {
        if (!otpCode) return
        try {
            await navigator.clipboard.writeText(otpCode)
            setCopied(true)
            setTimeout(() => setCopied(false), 1500)
        } catch (e) {
            // no-op
        }
    }

    return (
        <div className="space-y-6">
            {/* Current Status Overview */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        {getStatusIcon(order.status)}
                        Order Status
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center justify-between mb-4">
                        <Badge className={`text-sm px-4 py-2 ${getStatusColor(order.status)}`}>
                            {order.status?.charAt(0).toUpperCase() + order.status?.slice(1).replace('_', ' ')}
                        </Badge>
                        <div className="text-right">
                            <p className="text-sm text-gray-600">Last Updated</p>
                            <p className="font-medium">
                                {tracking.length > 0
                                    ? new Date(tracking[0].created_at).toLocaleDateString("en-US", {
                                        month: "short",
                                        day: "numeric",
                                        hour: "2-digit",
                                        minute: "2-digit"
                                    })
                                    : new Date(order.updated_at).toLocaleDateString("en-US", {
                                        month: "short",
                                        day: "numeric",
                                        hour: "2-digit",
                                        minute: "2-digit"
                                    })
                                }
                            </p>
                        </div>
                    </div>

                    {/* Progress Bar */}
                    {order.status !== 'cancelled' && (
                        <div className="space-y-2">
                            <div className="flex justify-between text-sm text-gray-600">
                                <span>Order Progress</span>
                                <span>{currentStepIndex >= 0 ? `${currentStepIndex + 1}/${statusSteps.length}` : '0/5'}</span>
                            </div>
                            <div className="flex items-center space-x-2">
                                {statusSteps.map((step, index) => (
                                    <div key={step} className="flex items-center">
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${index <= currentStepIndex
                                            ? 'bg-blue-600 text-white'
                                            : 'bg-gray-200 text-gray-600'
                                            }`}>
                                            {index + 1}
                                        </div>
                                        {index < statusSteps.length - 1 && (
                                            <div className={`w-8 h-1 ${index < currentStepIndex ? 'bg-blue-600' : 'bg-gray-200'
                                                }`} />
                                        )}
                                    </div>
                                ))}
                            </div>
                            <div className="flex justify-between text-xs text-gray-500 mt-1">
                                {statusSteps.map((step) => (
                                    <span key={step} className="capitalize">{step}</span>
                                ))}
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Delivery OTP Banner for customer when delivered */}
            {otpCode && orderStatus === 'delivered' && (
                <Card className="border-blue-200 bg-blue-50">
                    <CardHeader>
                        <CardTitle className="text-blue-900">Delivery OTP</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-blue-800 mb-3">Share this one-time code with the delivery person to receive your order.</p>
                        <div className="flex items-center gap-3">
                            <div className="text-2xl font-extrabold tracking-widest px-4 py-2 border-2 border-dashed border-blue-400 rounded bg-white text-blue-900 font-mono">
                                {otpCode}
                            </div>
                            <Button size="sm" onClick={copyOtp}>Copy</Button>
                            {copied && <span className="text-xs text-blue-700">Copied</span>}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Detailed Tracking Timeline */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <MapPin className="w-5 h-5" />
                        Tracking Timeline
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {tracking.length > 0 ? (
                        <div className="space-y-4">
                            {tracking
                                .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
                                .map((track, index) => (
                                    <div key={track.id} className="flex items-start gap-4">
                                        <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-white ${index === 0 ? 'bg-blue-600' : 'bg-gray-400'
                                            }`}>
                                            {getStatusIcon(track.status)}
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-center justify-between mb-1">
                                                <p className="font-semibold text-gray-900 capitalize">
                                                    {track.status?.replace('_', ' ')}
                                                </p>
                                                <p className="text-sm text-gray-500">
                                                    {new Date(track.created_at).toLocaleDateString("en-US", {
                                                        month: "short",
                                                        day: "numeric",
                                                        hour: "2-digit",
                                                        minute: "2-digit"
                                                    })}
                                                </p>
                                            </div>
                                            {track.message && (
                                                <p className="text-sm text-gray-600">{track.message}</p>
                                            )}
                                        </div>
                                    </div>
                                ))}
                        </div>
                    ) : (
                        <div className="text-center py-8">
                            <Package className="w-12 h-12 mx-auto text-gray-400 mb-3" />
                            <p className="text-gray-500">No tracking information available yet</p>
                            <p className="text-sm text-gray-400">Tracking updates will appear here as your order progresses</p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
