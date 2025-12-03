import { useEffect, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { formatDate } from "@/lib/utils";
import { Trash2, UserMinus, Eye } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

const API_URL = import.meta.env.VITE_API_URL;

type ApprovedPartner = {
    id: string;
    name: string;
    email: string;
    number: string;
    status: string;
    monthlyEarnings: number;
    totalEarnings: number;
    registeredAt: string;
    message?: string; // Added message field
    coupons: Array<{
        id: string;
        code: string;
        description?: string;
    }>;
    earnings: {
        total: number;
        monthly: Record<string, number>;
    };
};

export default function ApprovedPartnersTab() {
    const [partners, setPartners] = useState<ApprovedPartner[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    // Details dialog state
    const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
    const [selectedPartner, setSelectedPartner] = useState<ApprovedPartner | null>(null);


    // Remove coupon state
    const [removingCouponId, setRemovingCouponId] = useState<string | null>(null);
    const [removeCouponError, setRemoveCouponError] = useState("");

    // Remove partner state
    const [removingPartnerId, setRemovingPartnerId] = useState<string | null>(null); useEffect(() => {
        async function fetchApprovedPartners() {
            try {
                const res = await axios.get(`${API_URL}/api/admin/partners/approved`);
                setPartners(res.data.data || []);
            } catch {
                setError("Failed to fetch approved partners");
            }
            setLoading(false);
        }
        fetchApprovedPartners();
    }, []);



    const handleRemoveCoupon = async (partnerId: string, couponId: string) => {
        if (!window.confirm("Remove this coupon from partner?")) return;
        setRemovingCouponId(couponId);
        setRemoveCouponError("");
        try {
            await axios.delete(`${API_URL}/api/admin/partners/${partnerId}/coupons/${couponId}`);
            // Update the selected partner's coupons
            setSelectedPartner(prev => prev ? {
                ...prev,
                coupons: prev.coupons.filter(c => c.id !== couponId)
            } : prev);
            // Also update in the main partners list
            setPartners(prev => prev.map(p => p.id === partnerId ? {
                ...p,
                coupons: p.coupons.filter(c => c.id !== couponId)
            } : p));
        } catch {
            setRemoveCouponError("Failed to remove coupon.");
        } finally {
            setRemovingCouponId(null);
        }
    };

    const handleRemovePartner = async (partnerId: string) => {
        if (!window.confirm("Are you sure you want to deactivate this partner? This will remove their access but keep their data.")) return;
        setRemovingPartnerId(partnerId);
        try {
            await axios.post(`${API_URL}/api/admin/partners/${partnerId}/deactivate`);
            // Remove from the list
            setPartners(prev => prev.filter(p => p.id !== partnerId));
            setDetailsDialogOpen(false);
            alert("Partner deactivated successfully.");
        } catch {
            alert("Failed to deactivate partner.");
        } finally {
            setRemovingPartnerId(null);
        }
    };

    if (loading) {
        return <div className="text-center py-10 text-muted-foreground">Loading approved partners...</div>;
    }

    if (error) {
        return <div className="text-red-600 text-center py-10">{error}</div>;
    }

    return (
        <>
            {/* Demo Password Info */}
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h3 className="font-semibold text-blue-800 mb-2">Partner Demo Password</h3>
                <div className="flex items-center gap-4">
                    <div className="font-mono text-lg bg-white px-3 py-2 rounded border border-blue-300">
                        suratclothhouse@2025
                    </div>
                    <p className="text-sm text-blue-700">
                        All approved partners can login with this demo password. They will be prompted to change it after first login.
                    </p>
                </div>
            </div>

            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Number</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Monthly Earnings</TableHead>
                        <TableHead>Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {partners.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                No approved partners found.
                            </TableCell>
                        </TableRow>
                    ) : partners.map((partner) => (
                        <TableRow key={partner.id}>
                            <TableCell>{partner.name}</TableCell>
                            <TableCell>{partner.email}</TableCell>
                            <TableCell>{partner.number}</TableCell>
                            <TableCell>
                                <Badge variant="default">Active</Badge>
                            </TableCell>
                            <TableCell>₹{partner.monthlyEarnings?.toFixed(2) || '0.00'}</TableCell>
                            <TableCell>
                                <div className="flex gap-2">
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        asChild
                                    >
                                        <Link to={`/partners/${partner.id}`}>
                                            <Eye className="h-4 w-4 mr-1" />
                                            View Details
                                        </Link>
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="destructive"
                                        onClick={() => handleRemovePartner(partner.id)}
                                        disabled={removingPartnerId === partner.id}
                                    >
                                        <UserMinus className="h-4 w-4 mr-1" />
                                        {removingPartnerId === partner.id ? "Removing..." : "Remove"}
                                    </Button>
                                </div>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>

            {/* Details Dialog */}
            <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
                <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Partner Details</DialogTitle>
                        <DialogDescription>
                            Detailed information about {selectedPartner?.name}
                        </DialogDescription>
                    </DialogHeader>

                    {selectedPartner && (
                        <div className="space-y-6">
                            {(
                                <>
                                    {/* Basic Info */}
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="font-semibold text-sm">Name:</label>
                                            <p className="text-sm">{selectedPartner.name}</p>
                                        </div>
                                        <div>
                                            <label className="font-semibold text-sm">Email:</label>
                                            <p className="text-sm">{selectedPartner.email}</p>
                                        </div>
                                        <div>
                                            <label className="font-semibold text-sm">Number:</label>
                                            <p className="text-sm">{selectedPartner.number}</p>
                                        </div>
                                        <div>
                                            <label className="font-semibold text-sm">Registered:</label>
                                            <p className="text-sm">{formatDate(selectedPartner.registeredAt)}</p>
                                        </div>
                                    </div>

                                    {/* Message */}
                                    {selectedPartner.message && (
                                        <div>
                                            <label className="font-semibold text-sm">Message:</label>
                                            <p className="text-sm bg-accent p-3 rounded mt-1">
                                                {selectedPartner.message}
                                            </p>
                                        </div>
                                    )}

                                    {/* Coupons */}
                                    <div>
                                        <h4 className="font-semibold mb-2">Assigned Coupons:</h4>
                                        {selectedPartner.coupons?.length === 0 ? (
                                            <p className="text-muted-foreground text-sm">No coupons assigned.</p>
                                        ) : (
                                            <div className="grid grid-cols-1 gap-2">
                                                {selectedPartner.coupons?.map(coupon => (
                                                    <div key={coupon.id} className="border rounded px-3 py-2 flex items-center justify-between">
                                                        <div>
                                                            <div className="font-mono text-sm bg-accent px-2 py-1 rounded mb-1 inline-block">
                                                                {coupon.code}
                                                            </div>
                                                            <p className="text-xs text-muted-foreground">
                                                                {coupon.description || 'No description'}
                                                            </p>
                                                        </div>
                                                        <Button
                                                            size="sm"
                                                            variant="ghost"
                                                            onClick={() => handleRemoveCoupon(selectedPartner.id, coupon.id)}
                                                            disabled={removingCouponId === coupon.id}
                                                            className="text-red-600 hover:text-red-700"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </Button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                        {removeCouponError && (
                                            <Alert variant="destructive" className="mt-2">
                                                <AlertDescription>{removeCouponError}</AlertDescription>
                                            </Alert>
                                        )}
                                    </div>

                                    {/* Earnings */}
                                    <div>
                                        <h4 className="font-semibold mb-2">Earnings:</h4>
                                        <div className="mb-3">
                                            <span className="text-lg font-bold">
                                                Total: ₹{selectedPartner.earnings?.total?.toFixed(2) || '0.00'}
                                            </span>
                                        </div>
                                        <div>
                                            <h5 className="font-semibold text-sm mb-2">Monthly Breakdown:</h5>
                                            <div className="grid grid-cols-3 gap-2 text-sm">
                                                {selectedPartner.earnings?.monthly && Object.entries(selectedPartner.earnings.monthly).map(([month, amount]) => (
                                                    <div key={month} className="bg-accent px-2 py-1 rounded">
                                                        <div className="font-semibold">{month}</div>
                                                        <div>₹{amount.toFixed(2)}</div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    )}

                    <DialogFooter>
                        <DialogClose asChild>
                            <Button variant="outline">Close</Button>
                        </DialogClose>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
