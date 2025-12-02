import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Eye, EyeOff, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import apiService from '@/services/apiService';

const ResetPassword = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const token = searchParams.get('token');

    const [formData, setFormData] = useState({
        newPassword: '',
        confirmPassword: ''
    });
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isValidToken, setIsValidToken] = useState(true);

    useEffect(() => {
        if (!token) {
            toast.error('Invalid reset link');
            navigate('/login');
        }
    }, [token, navigate]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.newPassword || !formData.confirmPassword) {
            toast.error('Please fill in all fields');
            return;
        }

        if (formData.newPassword !== formData.confirmPassword) {
            toast.error('Passwords do not match');
            return;
        }

        if (formData.newPassword.length < 6) {
            toast.error('Password must be at least 6 characters');
            return;
        }

        setIsLoading(true);

        try {
            await apiService.resetPassword({
                token,
                newPassword: formData.newPassword
            });

            toast.success('Password reset successfully! You can now login with your new password');

            // Redirect to login after 2 seconds
            setTimeout(() => {
                navigate('/login');
            }, 2000);

        } catch (error) {
            console.error('Reset password error:', error);
            if (error.message.includes('Invalid or expired')) {
                setIsValidToken(false);
                toast.error('Reset link has expired or is invalid');
            } else {
                toast.error(error.message || 'Failed to reset password');
            }
        } finally {
            setIsLoading(false);
        }
    };

    if (!isValidToken) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50 py-12 px-4">
                <Card className="w-full max-w-md shadow-2xl border-0 bg-white/90 backdrop-blur-sm">
                    <CardContent className="p-8 text-center">
                        <AlertCircle className="mx-auto h-16 w-16 text-red-500 mb-4" />
                        <h2 className="text-xl font-bold text-gray-800 mb-2">Invalid Reset Link</h2>
                        <p className="text-gray-600 mb-6">
                            This password reset link has expired or is invalid. Please request a new one.
                        </p>
                        <Button
                            onClick={() => navigate('/login')}
                            className="w-full bg-gradient-to-r from-[#DE7A3E] to-red-500 hover:from-orange-600 hover:to-red-600"
                        >
                            Back to Login
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 py-12 px-4">
            <div className="max-w-md w-full space-y-8">
                {/* Header */}
                <div className="text-center">
                    <div className="mx-auto w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mb-6 shadow-lg">
                        <span className="text-white text-2xl font-bold">🔑</span>
                    </div>
                    <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                        Reset Password
                    </h2>
                    <p className="mt-2 text-sm text-gray-600">
                        Enter your new password below
                    </p>
                </div>

                <Card className="shadow-2xl border-0 bg-white/90 backdrop-blur-sm">
                    <CardHeader className="text-center pb-6 bg-gradient-to-r from-blue-500/10 to-purple-600/10 rounded-t-lg">
                        <CardTitle className="text-2xl font-bold text-gray-800">Set New Password</CardTitle>
                        <p className="text-gray-600">Create a strong password for your account</p>
                    </CardHeader>

                    <CardContent className="p-8">
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div>
                                <Label htmlFor="newPassword" className="text-gray-700 font-semibold flex items-center mb-2">
                                    <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                                    New Password
                                </Label>
                                <div className="relative">
                                    <Input
                                        id="newPassword"
                                        name="newPassword"
                                        type={showPassword ? 'text' : 'password'}
                                        value={formData.newPassword}
                                        onChange={handleInputChange}
                                        placeholder="Enter your new password"
                                        className="h-12 pr-12 border-2 border-gray-200 focus:border-blue-500 focus:ring-blue-500/20 transition-all duration-200"
                                        required
                                    />
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        className="absolute right-1 top-1 h-10 w-10 text-gray-500 hover:text-blue-500 transition-colors"
                                        onClick={() => setShowPassword(!showPassword)}
                                    >
                                        {showPassword ? (
                                            <EyeOff className="h-4 w-4" />
                                        ) : (
                                            <Eye className="h-4 w-4" />
                                        )}
                                    </Button>
                                </div>
                                <p className="text-xs text-gray-500 mt-1">Minimum 6 characters</p>
                            </div>

                            <div>
                                <Label htmlFor="confirmPassword" className="text-gray-700 font-semibold flex items-center mb-2">
                                    <span className="w-2 h-2 bg-purple-500 rounded-full mr-2"></span>
                                    Confirm New Password
                                </Label>
                                <div className="relative">
                                    <Input
                                        id="confirmPassword"
                                        name="confirmPassword"
                                        type={showConfirmPassword ? 'text' : 'password'}
                                        value={formData.confirmPassword}
                                        onChange={handleInputChange}
                                        placeholder="Re-enter your new password"
                                        className="h-12 pr-12 border-2 border-gray-200 focus:border-purple-500 focus:ring-purple-500/20 transition-all duration-200"
                                        required
                                    />
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        className="absolute right-1 top-1 h-10 w-10 text-gray-500 hover:text-purple-500 transition-colors"
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    >
                                        {showConfirmPassword ? (
                                            <EyeOff className="h-4 w-4" />
                                        ) : (
                                            <Eye className="h-4 w-4" />
                                        )}
                                    </Button>
                                </div>
                            </div>

                            <Button
                                type="submit"
                                className="w-full h-12 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02]"
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                        Resetting Password...
                                    </>
                                ) : (
                                    <>
                                        <CheckCircle className="mr-2 h-5 w-5" />
                                        Reset Password
                                    </>
                                )}
                            </Button>
                        </form>

                        <div className="mt-6 text-center">
                            <button
                                type="button"
                                onClick={() => navigate('/login')}
                                className="text-sm text-blue-600 hover:text-purple-600 underline font-medium transition-colors duration-200"
                            >
                                Back to Login
                            </button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default ResetPassword;
