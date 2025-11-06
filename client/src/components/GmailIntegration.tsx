import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Mail, RefreshCw, CheckCircle, XCircle, Clock } from "lucide-react";

interface GmailStatus {
    connected: boolean;
    polling: boolean;
    lastSync: string | null;
}

export default function GmailIntegration() {
    const { toast } = useToast();

    const { data: status, isLoading, refetch } = useQuery<GmailStatus>({
        queryKey: ["/api/gmail/status"],
        refetchInterval: 30000, // Refetch every 30 seconds
    });

    const syncMutation = useMutation({
        mutationFn: async () => {
            const response = await fetch("/api/gmail/sync", {
                method: "POST",
            });
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || "Failed to trigger sync");
            }
            return response.json();
        },
        onSuccess: () => {
            toast({
                title: "Sync Triggered",
                description: "Manual email sync has been started.",
            });
            setTimeout(() => refetch(), 2000);
        },
        onError: (error: Error) => {
            toast({
                title: "Sync Failed",
                description: error.message,
                variant: "destructive",
            });
        },
    });

    const togglePollingMutation = useMutation({
        mutationFn: async (enable: boolean) => {
            const endpoint = enable ? "/api/gmail/polling/start" : "/api/gmail/polling/stop";
            const response = await fetch(endpoint, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ intervalMinutes: 5 }),
            });
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || `Failed to ${enable ? 'start' : 'stop'} polling`);
            }
            return response.json();
        },
        onSuccess: (_, enable) => {
            toast({
                title: enable ? "Polling Started" : "Polling Stopped",
                description: `Automatic email polling has been ${enable ? 'enabled' : 'disabled'}.`,
            });
            setTimeout(() => refetch(), 1000);
        },
        onError: (error: Error) => {
            toast({
                title: "Error",
                description: error.message,
                variant: "destructive",
            });
        },
    });

    const disconnectMutation = useMutation({
        mutationFn: async () => {
            const response = await fetch("/api/gmail/disconnect", {
                method: "POST",
            });
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || "Failed to disconnect");
            }
            return response.json();
        },
        onSuccess: () => {
            toast({
                title: "Gmail Disconnected",
                description: "Gmail integration has been disconnected.",
            });
            setTimeout(() => refetch(), 1000);
        },
        onError: (error: Error) => {
            toast({
                title: "Failed to Disconnect",
                description: error.message,
                variant: "destructive",
            });
        },
    });

    const formatLastSync = (lastSync: string | null) => {
        if (!lastSync) return "Never";
        const date = new Date(lastSync);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);

        if (diffMins < 1) return "Just now";
        if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
        const diffHours = Math.floor(diffMins / 60);
        if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
        return date.toLocaleDateString('en-IN');
    };

    return (
        <Card className="p-6">
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-lg font-semibold flex items-center gap-2">
                            <Mail className="h-5 w-5" />
                            Gmail Integration
                        </h3>
                        <p className="text-sm text-muted-foreground mt-1">
                            Automatically import expenses from bank notification emails
                        </p>
                    </div>
                    {!isLoading && (
                        <Badge variant={status?.connected ? "default" : "secondary"}>
                            {status?.connected ? (
                                <>
                                    <CheckCircle className="h-3 w-3 mr-1" />
                                    Connected
                                </>
                            ) : (
                                <>
                                    <XCircle className="h-3 w-3 mr-1" />
                                    Not Connected
                                </>
                            )}
                        </Badge>
                    )}
                </div>

                {!isLoading && status && (
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <p className="text-sm text-muted-foreground">Status</p>
                                <p className="font-medium">
                                    {status.connected ? "Active" : "Inactive"}
                                </p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-sm text-muted-foreground">Auto-Polling</p>
                                <p className="font-medium">
                                    {status.polling ? "Enabled" : "Disabled"}
                                </p>
                            </div>
                            <div className="space-y-1 col-span-2">
                                <p className="text-sm text-muted-foreground flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    Last Sync
                                </p>
                                <p className="font-medium">
                                    {formatLastSync(status.lastSync)}
                                </p>
                            </div>
                        </div>

                        {status.connected && (
                            <div className="space-y-3">
                                <div className="grid grid-cols-2 gap-3">
                                    <Button
                                        onClick={() => syncMutation.mutate()}
                                        disabled={syncMutation.isPending}
                                        variant="default"
                                        data-testid="button-manual-sync"
                                    >
                                        <RefreshCw className={`h-4 w-4 mr-2 ${syncMutation.isPending ? 'animate-spin' : ''}`} />
                                        {syncMutation.isPending ? "Syncing..." : "Manual Sync"}
                                    </Button>
                                    <Button
                                        onClick={() => togglePollingMutation.mutate(!status.polling)}
                                        disabled={togglePollingMutation.isPending}
                                        variant="outline"
                                        data-testid="button-toggle-polling"
                                    >
                                        {status.polling ? "Stop Polling" : "Start Polling"}
                                    </Button>
                                </div>
                                <Button
                                    onClick={() => disconnectMutation.mutate()}
                                    disabled={disconnectMutation.isPending}
                                    variant="destructive"
                                    className="w-full"
                                    data-testid="button-disconnect"
                                >
                                    {disconnectMutation.isPending ? "Disconnecting..." : "Disconnect Gmail"}
                                </Button>
                            </div>
                        )}

                        {!status.connected && (
                            <div className="border rounded-lg p-4 bg-muted/50">
                                <p className="text-sm text-muted-foreground">
                                    Gmail integration is not configured. To enable automatic expense import from emails,
                                    you need to set up Gmail API credentials in your environment variables.
                                </p>
                                <p className="text-sm text-muted-foreground mt-2">
                                    See the README for setup instructions.
                                </p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </Card>
    );
}
