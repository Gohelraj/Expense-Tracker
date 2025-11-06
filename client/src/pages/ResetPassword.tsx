import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useLocation, Link } from "wouter";
import { Wallet, ArrowLeft, CheckCircle2 } from "lucide-react";

export default function ResetPassword() {
    const { toast } = useToast();
    const [, setLocation] = useLocation();
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [isVerifying, setIsVerifying] = useState(true);
    const [isValidToken, setIsValidToken] = useState(false);
    const [resetSuccess, setResetSuccess] = useState(false);
    const [token, setToken] = useState("");

    useEffect(() => {
        // Get token from URL query params
        const params = new URLSearchParams(window.location.search);
        const tokenParam = params.get("token");

        if (!tokenParam) {
            toast({
                title: "Invalid Link",
                description: "No reset token found in the URL",
                variant: "destructive",
            });
            setIsVerifying(false);
            return;
        }

        setToken(tokenParam);

        // Verify token
        fetch(`/api/auth/verify-reset-token/${tokenParam}`)
            .then((res) => res.json())
            .then((data) => {
                if (data.valid) {
                    setIsValidToken(true);
                } else {
                    toast({
                        title: "Invalid or Expired Link",
                        description: data.message || "This reset link is no longer valid",
                        variant: "destructive",
                    });
                }
            })
            .catch(() => {
                toast({
                    title: "Error",
                    description: "Failed to verify reset token",
                    variant: "destructive",
                });
            })
            .finally(() => {
                setIsVerifying(false);
            });
    }, [toast]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!password || !confirmPassword) {
            toast({
                title: "Missing Fields",
                description: "Please fill in all fields",
                variant: "destructive",
            });
            return;
        }

        if (password !== confirmPassword) {
            toast({
                title: "Password Mismatch",
                description: "Passwords do not match",
                variant: "destructive",
            });
            return;
        }

        if (password.length < 6) {
            toast({
                title: "Weak Password",
                description: "Password must be at least 6 characters",
                variant: "destructive",
            });
            return;
        }

        setIsLoading(true);
        try {
            const response = await fetch("/api/auth/reset-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ token, password }),
            });

            const data = await response.json();

            if (response.ok) {
                setResetSuccess(true);
                toast({
                    title: "Success",
                    description: data.message,
                });
                // Redirect to login after 3 seconds
                setTimeout(() => {
                    setLocation("/login");
                }, 3000);
            } else {
                toast({
                    title: "Error",
                    description: data.error || "Failed to reset password",
                    variant: "destructive",
                });
            }
        } catch (error: any) {
            toast({
                title: "Error",
                description: "An error occurred. Please try again.",
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-secondary/10 p-4">
            <div className="w-full max-w-md">
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
                        <Wallet className="h-8 w-8 text-primary" />
                    </div>
                    <h1 className="text-3xl font-bold">Expense Tracker</h1>
                    <p className="text-muted-foreground mt-2">Create a new password</p>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Reset Password</CardTitle>
                        <CardDescription>
                            {resetSuccess
                                ? "Your password has been reset"
                                : "Enter your new password below"}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {isVerifying ? (
                            <div className="text-center py-8">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                                <p className="mt-4 text-sm text-muted-foreground">Verifying reset link...</p>
                            </div>
                        ) : !isValidToken ? (
                            <div className="space-y-4">
                                <div className="text-center py-4">
                                    <p className="text-sm text-muted-foreground">
                                        This password reset link is invalid or has expired.
                                    </p>
                                    <p className="text-sm text-muted-foreground mt-2">
                                        Please request a new password reset link.
                                    </p>
                                </div>
                                <Link href="/forgot-password">
                                    <Button className="w-full">Request New Link</Button>
                                </Link>
                            </div>
                        ) : resetSuccess ? (
                            <div className="space-y-4">
                                <div className="flex items-center justify-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                                    <CheckCircle2 className="h-12 w-12 text-green-600 dark:text-green-400" />
                                </div>
                                <p className="text-center text-sm text-muted-foreground">
                                    Your password has been successfully reset.
                                </p>
                                <p className="text-center text-sm text-muted-foreground">
                                    Redirecting to login page...
                                </p>
                                <Link href="/login">
                                    <Button className="w-full">Go to Login</Button>
                                </Link>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="password">New Password</Label>
                                    <Input
                                        id="password"
                                        type="password"
                                        placeholder="Enter new password (min 6 characters)"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="confirm-password">Confirm Password</Label>
                                    <Input
                                        id="confirm-password"
                                        type="password"
                                        placeholder="Confirm new password"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        required
                                    />
                                </div>
                                <Button type="submit" className="w-full" disabled={isLoading}>
                                    {isLoading ? "Resetting..." : "Reset Password"}
                                </Button>
                            </form>
                        )}

                        {!resetSuccess && (
                            <div className="mt-6 text-center">
                                <Link href="/login">
                                    <Button variant="ghost" className="text-sm">
                                        <ArrowLeft className="h-4 w-4 mr-2" />
                                        Back to Login
                                    </Button>
                                </Link>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
