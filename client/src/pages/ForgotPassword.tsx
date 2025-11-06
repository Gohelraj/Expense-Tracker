import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import { Wallet, ArrowLeft, Mail } from "lucide-react";

export default function ForgotPassword() {
    const { toast } = useToast();
    const [email, setEmail] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [emailSent, setEmailSent] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!email) {
            toast({
                title: "Email Required",
                description: "Please enter your email address",
                variant: "destructive",
            });
            return;
        }

        setIsLoading(true);
        try {
            const response = await fetch("/api/auth/forgot-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email }),
            });

            const data = await response.json();

            if (response.ok) {
                setEmailSent(true);
                toast({
                    title: "Email Sent",
                    description: data.message,
                });
            } else {
                toast({
                    title: "Error",
                    description: data.error || "Failed to send reset email",
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
                    <p className="text-muted-foreground mt-2">Reset your password</p>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Forgot Password</CardTitle>
                        <CardDescription>
                            {emailSent
                                ? "Check your email for reset instructions"
                                : "Enter your email to receive a password reset link"}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {emailSent ? (
                            <div className="space-y-4">
                                <div className="flex items-center justify-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                                    <Mail className="h-12 w-12 text-green-600 dark:text-green-400" />
                                </div>
                                <p className="text-center text-sm text-muted-foreground">
                                    If an account exists with the email <strong>{email}</strong>, you will receive a password reset link shortly.
                                </p>
                                <p className="text-center text-sm text-muted-foreground">
                                    Please check your inbox and spam folder.
                                </p>
                                <Button
                                    variant="outline"
                                    className="w-full"
                                    onClick={() => {
                                        setEmailSent(false);
                                        setEmail("");
                                    }}
                                >
                                    Send Another Email
                                </Button>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="email">Email Address</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        placeholder="Enter your email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                    />
                                </div>
                                <Button type="submit" className="w-full" disabled={isLoading}>
                                    {isLoading ? "Sending..." : "Send Reset Link"}
                                </Button>
                            </form>
                        )}

                        <div className="mt-6 text-center">
                            <Link href="/login">
                                <Button variant="ghost" className="text-sm">
                                    <ArrowLeft className="h-4 w-4 mr-2" />
                                    Back to Login
                                </Button>
                            </Link>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
