import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ApprovedPartnersTab from "../components/ApprovedPartnersTab";
import NonApprovedPartnersTab from "../components/NonApprovedPartnersTab";

export default function PartnerPage() {
    const [activeTab, setActiveTab] = useState("approved");

    return (
        <div className="p-4 md:p-8 max-w-7xl mx-auto">
            <Card>
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 px-6 pt-6">
                    <h1 className="text-2xl font-bold">Partner Management</h1>
                </div>

                <div className="p-6">
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="approved">Approved Partners</TabsTrigger>
                            <TabsTrigger value="non-approved">Non-Approved Partners</TabsTrigger>
                        </TabsList>

                        <TabsContent value="approved" className="mt-6">
                            <ApprovedPartnersTab />
                        </TabsContent>

                        <TabsContent value="non-approved" className="mt-6">
                            <NonApprovedPartnersTab />
                        </TabsContent>
                    </Tabs>
                </div>
            </Card>
        </div>
    );
}
