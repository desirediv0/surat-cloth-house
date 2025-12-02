import { useEffect, useState } from "react";
import axios from "axios";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { formatDate } from "@/lib/utils";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";

const API_URL = import.meta.env.VITE_API_URL;

type PendingPartner = {
    id: string;
    name: string;
    email: string;
    number: string;
    status: "PENDING" | "REJECTED";
    message: string;
    createdAt: string;
    city?: string;
    state?: string;
};

export default function NonApprovedPartnersTab() {
    const [partners, setPartners] = useState<PendingPartner[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    // Details dialog state
    const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
    const [selectedPartner, setSelectedPartner] = useState<PendingPartner | null>(null);

    // Approve dialog state
    const [approveDialogOpen, setApproveDialogOpen] = useState(false);
    const [approveId, setApproveId] = useState<string | null>(null);
    const [approveLoading, setApproveLoading] = useState(false);
    const [approveApiError, setApproveApiError] = useState("");

    useEffect(() => {
        async function fetchNonApprovedPartners() {
            try {
                const res = await axios.get(`${API_URL}/api/admin/partners/requests`);
                const allRequests = res.data.data.requests || [];
                // Filter only pending and rejected
                const nonApproved = allRequests.filter((p: PendingPartner) =>
                    p.status === "PENDING" || p.status === "REJECTED"
                );
                setPartners(nonApproved);
            } catch {
                setError("Failed to fetch non-approved partners");
            }
            setLoading(false);
        }
        fetchNonApprovedPartners();
    }, []);

    const openDetailsDialog = (partner: PendingPartner) => {
        setSelectedPartner(partner);
        setDetailsDialogOpen(true);
    };

    const openApproveDialog = (id: string) => {
        setApproveId(id);
        setApproveApiError("");
        setApproveDialogOpen(true);
    };

    const closeApproveDialog = () => {
        setApproveDialogOpen(false);
        setApproveId(null);
        setApproveApiError("");
    };

    const handleApprove = async () => {
        if (!window.confirm("Are you sure you want to approve this partner? They will be assigned the demo password.")) return;

        setApproveLoading(true);
        setApproveApiError("");
        try {
            const response = await axios.post(`${API_URL}/api/admin/partners/requests/${approveId}/approve`);
            // Remove from list since it's now approved
            setPartners(prev => prev.filter(p => p.id !== approveId));
            closeApproveDialog();

            // Show demo password to admin
            const demoPassword = response.data.data.demoPassword || 'genuinenutrition';
            alert(`Partner approved successfully!\nDemo Password: ${demoPassword}\nPlease share this password with the partner.`);
        } catch (err) {
            if (axios.isAxiosError(err)) {
                setApproveApiError(err.response?.data?.message || "Failed to approve partner.");
            } else {
                setApproveApiError("Failed to approve partner.");
            }
        } finally {
            setApproveLoading(false);
        }
    };

    const handleReject = async (id: string) => {
        if (!window.confirm("Are you sure you want to reject this request?")) return;
        try {
            await axios.post(`${API_URL}/api/admin/partners/requests/${id}/reject`);
            setPartners(prev => prev.map(p => p.id === id ? { ...p, status: "REJECTED" as const } : p));
        } catch {
            alert("Failed to reject partner.");
        }
    };

    if (loading) {
        return <div className="text-center py-10 text-muted-foreground">Loading non-approved partners...</div>;
    }

    if (error) {
        return <div className="text-red-600 text-center py-10">{error}</div>;
    }

    return (
        <>
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
                                No non-approved partners found.
                            </TableCell>
                        </TableRow>
                    ) : partners.map((partner) => (
                        <TableRow key={partner.id}>
                            <TableCell>{partner.name}</TableCell>
                            <TableCell>{partner.email}</TableCell>
                            <TableCell>{partner.number}</TableCell>
                            <TableCell>
                                <Badge variant={partner.status === "PENDING" ? "secondary" : "destructive"}>
                                    {partner.status}
                                </Badge>
                            </TableCell>
                            <TableCell>₹0.00</TableCell>
                            <TableCell>
                                <div className="flex gap-2">
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => openDetailsDialog(partner)}
                                    >
                                        Details
                                    </Button>
                                    {partner.status === "PENDING" && (
                                        <>
                                            <Button
                                                size="sm"
                                                variant="default"
                                                onClick={() => openApproveDialog(partner.id)}
                                            >
                                                Accept
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="destructive"
                                                onClick={() => handleReject(partner.id)}
                                            >
                                                Decline
                                            </Button>
                                        </>
                                    )}
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
                        <DialogTitle>Partner Application Details</DialogTitle>
                        <DialogDescription>
                            Application details for {selectedPartner?.name}
                        </DialogDescription>
                    </DialogHeader>

                    {selectedPartner && (
                        <div className="space-y-4">
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
                                    <label className="font-semibold text-sm">Applied Date:</label>
                                    <p className="text-sm">{formatDate(selectedPartner.createdAt)}</p>
                                </div>
                                {selectedPartner.city && (
                                    <div>
                                        <label className="font-semibold text-sm">City:</label>
                                        <p className="text-sm">{selectedPartner.city}</p>
                                    </div>
                                )}
                                {selectedPartner.state && (
                                    <div>
                                        <label className="font-semibold text-sm">State:</label>
                                        <p className="text-sm">{selectedPartner.state}</p>
                                    </div>
                                )}
                            </div>

                            <div>
                                <label className="font-semibold text-sm">Message:</label>
                                <p className="text-sm bg-accent p-3 rounded mt-1">
                                    {selectedPartner.message || "No message provided"}
                                </p>
                            </div>

                            <div>
                                <label className="font-semibold text-sm">Status:</label>
                                <Badge
                                    variant={selectedPartner.status === "PENDING" ? "secondary" : "destructive"}
                                    className="ml-2"
                                >
                                    {selectedPartner.status}
                                </Badge>
                            </div>
                        </div>
                    )}

                    <DialogFooter>
                        {selectedPartner?.status === "PENDING" && (
                            <div className="flex gap-2 mr-auto">
                                <Button
                                    variant="default"
                                    size="sm"
                                    onClick={() => {
                                        setDetailsDialogOpen(false);
                                        openApproveDialog(selectedPartner.id);
                                    }}
                                >
                                    Accept
                                </Button>
                                <Button
                                    variant="destructive"
                                    size="sm"
                                    onClick={() => {
                                        setDetailsDialogOpen(false);
                                        handleReject(selectedPartner.id);
                                    }}
                                >
                                    Decline
                                </Button>
                            </div>
                        )}
                        <DialogClose asChild>
                            <Button variant="outline">Close</Button>
                        </DialogClose>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Approve Dialog */}
            <Dialog open={approveDialogOpen} onOpenChange={setApproveDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Approve Partner</DialogTitle>
                        <DialogDescription>
                            This partner will be approved with the demo password "genuinenutrition".
                            Please share this password with the partner after approval.
                        </DialogDescription>
                    </DialogHeader>

                    {approveApiError && (
                        <Alert variant="destructive" className="mb-2">
                            <AlertTitle>Error</AlertTitle>
                            <AlertDescription>{approveApiError}</AlertDescription>
                        </Alert>
                    )}

                    <div className="bg-accent p-4 rounded-lg">
                        <p className="font-semibold text-sm mb-2">Demo Password:</p>
                        <p className="font-mono text-lg bg-background px-3 py-2 rounded border">
                            genuinenutrition
                        </p>
                        <p className="text-xs text-muted-foreground mt-2">
                            The partner can login with this password and will be prompted to change it.
                        </p>
                    </div>

                    <DialogFooter>
                        <Button onClick={handleApprove} disabled={approveLoading}>
                            {approveLoading ? "Approving..." : "Approve Partner"}
                        </Button>
                        <DialogClose asChild>
                            <Button variant="outline" type="button" disabled={approveLoading}>
                                Cancel
                            </Button>
                        </DialogClose>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
