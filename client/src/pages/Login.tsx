import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Wallet } from "lucide-react";

interface AuthResponse {
    success: boolean;
    user?: {
        id: string;
        username: string;
    };
    error?: string;
}

export default function Login() {
    const { toast } = useToast();
    const [loginData, setLoginData] = useState({ username: "", password: "" });
    const [registerData, setRegisterData] = useState({ username: "", password: "", confirmPassword: "" });

    const loginMutation = useMutation({
        mutationFn: async (data: { username: string; password: string }) => {
            const response = await fetch("/api/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || "Login failed");
            }
            return response.json() as Promise<AuthResponse>;
        },
        onSuccess: (data) => {
            toast({
                title: "Welcome back!",
                description: `Logged in as ${data.user?.username}`,
            });
            // In a real app, you'd redirect or update global auth state here
            window.location.href = "/";
        },
        onError: (error: Error) => {
            toast({
                title: "Login Failed",
                description: error.message,
                variant: "destructive",
            });
        },
    });

    const registerMutation = useMutation({
        mutationFn: async (data: { username: string; password: string }) => {
            const response = await fetch("/api/auth/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || "Registration failed");
            }
            return response.json();
        },
        onSuccess: () => {
            toast({
                title: "Account Created",
                description: "You can now log in with your credentials",
            });
            // Auto-login after registration
            loginMutation.mutate({ username: registerData.username, password: registerData.password });
        },
        onError: (error: Error) => {
            toast({
                title: "Registration Failed",
                description: error.message,
                variant: "destructive",
            });
        },
    });

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        if (!loginData.username || !loginData.password) {
            toast({
                title: "Missing Fields",
                description: "Please enter both username and password",
                variant: "destructive",
            });
            return;
        }
        loginMutation.mutate(loginData);
    };

    const handleRegister = (e: React.FormEvent) => {
        e.preventDefault();
        if (!registerData.username || !registerData.password) {
            toast({
                title: "Missing Fields",
                description: "Please fill in all fields",
                variant: "destructive",
            });
            return;
        }
        if (registerData.password !== registerData.confirmPassword) {
            toast({
                title: "Password Mismatch",
                description: "Passwords do not match",
                variant: "destructive",
            });
            return;
        }
        if (registerData.password.length < 6) {
            toast({
                title: "Weak Password",
                description: "Password must be at least 6 characters",
                variant: "destructive",
            });
            return;
        }
        registerMutation.mutate({ username: registerData.username, password: registerData.password });
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-secondary/10 p-4">
            <div className="w-full max-w-md">
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
                        <Wallet className="h-8 w-8 text-primary" />
                    </div>
                    <h1 className="text-3xl font-bold">Expense Tracker</h1>
                    <p className="text-muted-foreground mt-2">Manage your finances with ease</p>
                </div>

                <Tabs defaultValue="login" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="login">Login</TabsTrigger>
                        <TabsTrigger value="register">Register</TabsTrigger>
                    </TabsList>

                    <TabsContent value="login">
                        <Card>
                            <CardHeader>
                                <CardTitle>Welcome Back</CardTitle>
                                <CardDescription>Enter your credentials to access your account</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <form onSubmit={handleLogin} className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="login-username">Username</Label>
                                        <Input
                                            id="login-username"
                                            type="text"
                                            placeholder="Enter your username"
                                            value={loginData.username}
                                            onChange={(e) => setLoginData({ ...loginData, username: e.target.value })}
                                            data-testid="input-login-username"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="login-password">Password</Label>
                                        <Input
                                            id="login-password"
                                            type="password"
                                            placeholder="Enter your password"
                                            value={loginData.password}
                                            onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                                            data-testid="input-login-password"
                                        />
                                    </div>
                                    <Button
                                        type="submit"
                                        className="w-full"
                                        disabled={loginMutation.isPending}
                                        data-testid="button-login"
                                    >
                                        {loginMutation.isPending ? "Logging in..." : "Login"}
                                    </Button>
                                </form>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="register">
                        <Card>
                            <CardHeader>
                                <CardTitle>Create Account</CardTitle>
                                <CardDescription>Sign up to start tracking your expenses</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <form onSubmit={handleRegister} className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="register-username">Username</Label>
                                        <Input
                                            id="register-username"
                                            type="text"
                                            placeholder="Choose a username"
                                            value={registerData.username}
                                            onChange={(e) => setRegisterData({ ...registerData, username: e.target.value })}
                                            data-testid="input-register-username"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="register-password">Password</Label>
                                        <Input
                                            id="register-password"
                                            type="password"
                                            placeholder="Choose a password (min 6 characters)"
                                            value={registerData.password}
                                            onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
                                            data-testid="input-register-password"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="register-confirm-password">Confirm Password</Label>
                                        <Input
                                            id="register-confirm-password"
                                            type="password"
                                            placeholder="Confirm your password"
                                            value={registerData.confirmPassword}
                                            onChange={(e) => setRegisterData({ ...registerData, confirmPassword: e.target.value })}
                                            data-testid="input-register-confirm-password"
                                        />
                                    </div>
                                    <Button
                                        type="submit"
                                        className="w-full"
                                        disabled={registerMutation.isPending}
                                        data-testid="button-register"
                                    >
                                        {registerMutation.isPending ? "Creating Account..." : "Create Account"}
                                    </Button>
                                </form>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>

                <div className="mt-6 text-center text-sm text-muted-foreground">
                    <p>Demo Mode: Authentication is for demonstration purposes</p>
                </div>
            </div>
        </div>
    );
}
