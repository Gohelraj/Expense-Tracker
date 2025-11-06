import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth";
import { Redirect, Link } from "wouter";
import { Wallet } from "lucide-react";

export default function Login() {
    const { toast } = useToast();
    const { user, login, register } = useAuth();
    const [isLoading, setIsLoading] = useState(false);
    const [loginData, setLoginData] = useState({ username: "", password: "" });
    const [registerData, setRegisterData] = useState({ username: "", email: "", password: "", confirmPassword: "" });

    // Redirect if already logged in
    if (user) {
        return <Redirect to="/" />;
    }

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!loginData.username || !loginData.password) {
            toast({
                title: "Missing Fields",
                description: "Please enter both username and password",
                variant: "destructive",
            });
            return;
        }

        setIsLoading(true);
        try {
            await login(loginData.username, loginData.password);
            toast({
                title: "Welcome back!",
                description: `Logged in as ${loginData.username}`,
            });
        } catch (error: any) {
            toast({
                title: "Login Failed",
                description: error.message,
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!registerData.username || !registerData.email || !registerData.password) {
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

        setIsLoading(true);
        try {
            await register(registerData.username, registerData.password, registerData.email);
            toast({
                title: "Account Created",
                description: "Welcome to Expense Tracker!",
            });
        } catch (error: any) {
            toast({
                title: "Registration Failed",
                description: error.message,
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
                                        <div className="flex items-center justify-between">
                                            <Label htmlFor="login-password">Password</Label>
                                            <Link href="/forgot-password">
                                                <a className="text-sm text-primary hover:underline">
                                                    Forgot password?
                                                </a>
                                            </Link>
                                        </div>
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
                                        disabled={isLoading}
                                        data-testid="button-login"
                                    >
                                        {isLoading ? "Logging in..." : "Login"}
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
                                        <Label htmlFor="register-email">Email</Label>
                                        <Input
                                            id="register-email"
                                            type="email"
                                            placeholder="Enter your email"
                                            value={registerData.email}
                                            onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })}
                                            data-testid="input-register-email"
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
                                        disabled={isLoading}
                                        data-testid="button-register"
                                    >
                                        {isLoading ? "Creating Account..." : "Create Account"}
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
