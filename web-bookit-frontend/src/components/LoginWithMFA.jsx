import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
    Mail, 
    Lock, 
    Eye, 
    EyeOff, 
    Shield, 
    Smartphone,
    Key,
    AlertTriangle,
    CheckCircle,
    ArrowLeft
} from 'lucide-react';

const LoginWithMFA = () => {
    const navigate = useNavigate();
    
    // Form states
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        mfaToken: '',
        mfaBackupCode: ''
    });
    
    // UI states
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    
    // MFA states
    const [requiresMFA, setRequiresMFA] = useState(false);
    const [userId, setUserId] = useState('');
    const [useBackupCode, setUseBackupCode] = useState(false);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
        setError(''); // Clear error when user types
    };

    const handleInitialLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/users/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    email: formData.email,
                    password: formData.password
                })
            });

            const data = await response.json();

            if (response.ok) {
                if (data.requiresMFA) {
                    // MFA is required
                    setRequiresMFA(true);
                    setUserId(data.userId);
                    setSuccess('Please enter your MFA code to complete login');
                } else {
                    // Regular login successful
                    localStorage.setItem('token', data.token);
                    localStorage.setItem('role', data.role);
                    setSuccess('Login successful!');
                    
                    // Navigate based on role
                    setTimeout(() => {
                        if (data.role === 'admin' || data.role === 'staff') {
                            navigate('/admin/rooms');
                        } else {
                            navigate('/dashboard');
                        }
                    }, 1000);
                }
            } else {
                setError(data.message || 'Login failed');
            }
        } catch (err) {
            setError('Network error. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleMFALogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            // First verify MFA
            const mfaResponse = await fetch(`${import.meta.env.VITE_API_URL}/api/mfa/verify/${userId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    token: useBackupCode ? null : formData.mfaToken,
                    backupCode: useBackupCode ? formData.mfaBackupCode : null
                })
            });

            const mfaData = await mfaResponse.json();

            if (mfaResponse.ok) {
                // MFA verified, now complete login
                const loginResponse = await fetch(`${import.meta.env.VITE_API_URL}/api/users/login`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        email: formData.email,
                        password: formData.password,
                        mfaToken: useBackupCode ? null : formData.mfaToken,
                        mfaBackupCode: useBackupCode ? formData.mfaBackupCode : null
                    })
                });

                const loginData = await loginResponse.json();

                if (loginResponse.ok) {
                    localStorage.setItem('token', loginData.token);
                    localStorage.setItem('role', loginData.role);
                    
                    if (mfaData.usedBackupCode) {
                        setSuccess(`Login successful! You have ${mfaData.remainingBackupCodes} backup codes remaining.`);
                    } else {
                        setSuccess('Login successful!');
                    }
                    
                    // Navigate based on role
                    setTimeout(() => {
                        if (loginData.role === 'admin' || loginData.role === 'staff') {
                            navigate('/admin/rooms');
                        } else {
                            navigate('/');
                        }
                    }, 1500);
                } else {
                    setError(loginData.message || 'Login failed after MFA verification');
                }
            } else {
                setError(mfaData.message || 'Invalid MFA code');
            }
        } catch (err) {
            setError('Network error. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const resetMFA = () => {
        setRequiresMFA(false);
        setUserId('');
        setUseBackupCode(false);
        setFormData(prev => ({
            ...prev,
            mfaToken: '',
            mfaBackupCode: ''
        }));
        setError('');
        setSuccess('');
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8">
                <div>
                    <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-blue-100">
                        {requiresMFA ? (
                            <Shield className="h-6 w-6 text-blue-600" />
                        ) : (
                            <Lock className="h-6 w-6 text-blue-600" />
                        )}
                    </div>
                    <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                        {requiresMFA ? 'Multi-Factor Authentication' : 'Sign in to your account'}
                    </h2>
                    <p className="mt-2 text-center text-sm text-gray-600">
                        {requiresMFA ? (
                            'Please enter your authentication code'
                        ) : (
                            <>
                                Or{' '}
                                <Link to="/register" className="font-medium text-blue-600 hover:text-blue-500">
                                    create a new account
                                </Link>
                            </>
                        )}
                    </p>
                </div>

                {/* Status Messages */}
                {error && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                        <div className="flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4" />
                            {error}
                        </div>
                    </div>
                )}

                {success && (
                    <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
                        <div className="flex items-center gap-2">
                            <CheckCircle className="w-4 h-4" />
                            {success}
                        </div>
                    </div>
                )}

                {!requiresMFA ? (
                    /* Initial Login Form */
                    <form className="mt-8 space-y-6" onSubmit={handleInitialLogin}>
                        <div className="space-y-4">
                            <div>
                                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                                    Email address
                                </label>
                                <div className="mt-1 relative">
                                    <input
                                        id="email"
                                        name="email"
                                        type="email"
                                        autoComplete="email"
                                        required
                                        value={formData.email}
                                        onChange={handleInputChange}
                                        className="appearance-none relative block w-full px-3 py-2 pl-10 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                                        placeholder="Enter your email"
                                    />
                                    <Mail className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                                </div>
                            </div>

                            <div>
                                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                                    Password
                                </label>
                                <div className="mt-1 relative">
                                    <input
                                        id="password"
                                        name="password"
                                        type={showPassword ? "text" : "password"}
                                        autoComplete="current-password"
                                        required
                                        value={formData.password}
                                        onChange={handleInputChange}
                                        className="appearance-none relative block w-full px-3 py-2 pl-10 pr-10 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                                        placeholder="Enter your password"
                                    />
                                    <Lock className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-2.5 h-4 w-4 text-gray-400 hover:text-gray-600"
                                    >
                                        {showPassword ? <EyeOff /> : <Eye />}
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div>
                            <button
                                type="submit"
                                disabled={loading}
                                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? 'Signing in...' : 'Sign in'}
                            </button>
                        </div>
                    </form>
                ) : (
                    /* MFA Verification Form */
                    <div className="mt-8 space-y-6">
                        {/* Back Button */}
                        <button
                            onClick={resetMFA}
                            className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-500"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Back to login
                        </button>

                        {/* MFA Method Toggle */}
                        <div className="flex rounded-md shadow-sm">
                            <button
                                type="button"
                                onClick={() => setUseBackupCode(false)}
                                className={`flex-1 px-4 py-2 text-sm font-medium rounded-l-md border ${
                                    !useBackupCode
                                        ? 'bg-blue-50 text-blue-700 border-blue-500'
                                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                                }`}
                            >
                                <Smartphone className="w-4 h-4 inline mr-2" />
                                Authenticator Code
                            </button>
                            <button
                                type="button"
                                onClick={() => setUseBackupCode(true)}
                                className={`flex-1 px-4 py-2 text-sm font-medium rounded-r-md border-l-0 border ${
                                    useBackupCode
                                        ? 'bg-blue-50 text-blue-700 border-blue-500'
                                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                                }`}
                            >
                                <Key className="w-4 h-4 inline mr-2" />
                                Backup Code
                            </button>
                        </div>

                        <form onSubmit={handleMFALogin} className="space-y-4">
                            {!useBackupCode ? (
                                <div>
                                    <label htmlFor="mfaToken" className="block text-sm font-medium text-gray-700">
                                        6-digit code from your authenticator app
                                    </label>
                                    <input
                                        id="mfaToken"
                                        name="mfaToken"
                                        type="text"
                                        maxLength="6"
                                        required
                                        value={formData.mfaToken}
                                        onChange={(e) => handleInputChange({
                                            target: {
                                                name: 'mfaToken',
                                                value: e.target.value.replace(/\D/g, '').slice(0, 6)
                                            }
                                        })}
                                        className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-center text-lg font-mono"
                                        placeholder="123456"
                                    />
                                    <p className="mt-1 text-xs text-gray-500">
                                        Open your authenticator app and enter the 6-digit code
                                    </p>
                                </div>
                            ) : (
                                <div>
                                    <label htmlFor="mfaBackupCode" className="block text-sm font-medium text-gray-700">
                                        Backup Code
                                    </label>
                                    <input
                                        id="mfaBackupCode"
                                        name="mfaBackupCode"
                                        type="text"
                                        required
                                        value={formData.mfaBackupCode}
                                        onChange={(e) => handleInputChange({
                                            target: {
                                                name: 'mfaBackupCode',
                                                value: e.target.value.toUpperCase()
                                            }
                                        })}
                                        className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-center font-mono"
                                        placeholder="Enter backup code"
                                    />
                                    <p className="mt-1 text-xs text-gray-500">
                                        Enter one of your backup codes. Each code can only be used once.
                                    </p>
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={loading || (!useBackupCode && formData.mfaToken.length !== 6) || (useBackupCode && !formData.mfaBackupCode)}
                                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? 'Verifying...' : 'Verify & Sign In'}
                            </button>
                        </form>

                        {/* Help Text */}
                        <div className="text-center">
                            <p className="text-xs text-gray-500">
                                Having trouble? Contact your administrator for help.
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default LoginWithMFA;
