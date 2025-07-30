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
import { sanitizeInput, createSanitizedHandler } from '../utils/sanitize';

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
        const sanitizedValue = sanitizeInput(value);
        setFormData(prev => ({
            ...prev,
            [name]: sanitizedValue
        }));
        setError(''); // Clear error when user types
    };

    const [lockoutUntil, setLockoutUntil] = useState(null);
    const [lockoutTimer, setLockoutTimer] = useState(0);

    // Countdown for lockout
    React.useEffect(() => {
        if (!lockoutUntil) return;
        const interval = setInterval(() => {
            const now = Date.now();
            if (lockoutUntil > now) {
                setLockoutTimer(Math.max(0, Math.floor((lockoutUntil - now) / 1000)));
            } else {
                setLockoutUntil(null);
                setLockoutTimer(0);
                setError('');
            }
        }, 1000);
        return () => clearInterval(interval);
    }, [lockoutUntil]);

    const handleInitialLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        if (lockoutUntil && Date.now() < lockoutUntil) {
            setError(`Account is locked. Try again in ${lockoutTimer}s.`);
            setLoading(false);
            return;
        }

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
            } else if (response.status === 403) {
                // Account lockout or password expiry
                if (data.message && data.message.toLowerCase().includes('account is locked')) {
                    // Extract time from message
                    const match = data.message.match(/after\s+(\d{1,2}:\d{2}:\d{2})/);
                    if (match) {
                        const now = new Date();
                        const [h, m, s] = match[1].split(':').map(Number);
                        let lockoutTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), h, m, s).getTime();
                        // If lockout time is in the past, add a day
                        if (lockoutTime < now.getTime()) {
                            lockoutTime += 24 * 60 * 60 * 1000;
                        }
                        setLockoutUntil(lockoutTime);
                        setError(`Account is locked. Try again in ${Math.max(0, Math.floor((lockoutTime - now.getTime()) / 1000))}s.`);
                    } else {
                        setError(data.message);
                    }
                } else if (data.message && data.message.toLowerCase().includes('password has expired')) {
                    setError(data.message);
                    setTimeout(() => {
                        navigate('/reset-password');
                    }, 1500);
                } else {
                    setError(data.message);
                }
            } else if (response.status === 400) {
                setError(data.message || 'Invalid credentials or MFA token');
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
    <div className="flex justify-center items-center min-h-screen bg-gray-100">
        <div className="bg-white p-8 rounded-2xl shadow-xl w-96">
            <div className="flex justify-center mb-4">
                <div className="h-12 w-12 flex items-center justify-center rounded-full bg-emerald-100">
                    {requiresMFA ? (
                        <Shield className="h-6 w-6 text-emerald-600" />
                    ) : (
                        <Lock className="h-6 w-6 text-emerald-600" />
                    )}
                </div>
            </div>
            <h2 className="text-3xl font-bold text-center text-gray-700 mb-2">{requiresMFA ? 'Multi-Factor Authentication' : 'Login'}</h2>
            <p className="text-center text-gray-600 mb-4">
                {requiresMFA ? (
                    'Please enter your authentication code'
                ) : (
                    <>
                        Or{' '}
                        <Link to="/register" className="text-emerald-500 font-semibold hover:underline">
                            create a new account
                        </Link>
                    </>
                )}
            </p>

            {/* Status Messages */}
            {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-2">
                    <div className="flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4" />
                        {error}
                    </div>
                </div>
            )}

            {success && (
                <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-2">
                    <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4" />
                        {success}
                    </div>
                </div>
            )}

            {!requiresMFA ? (
                <form onSubmit={handleInitialLogin} className="space-y-4">
                    <div>
                        <label className="block text-gray-900 font-medium mb-1">Email</label>
                        <div className="relative">
                            <input
                                id="email"
                                name="email"
                                type="email"
                                autoComplete="email"
                                required
                                value={formData.email}
                                onChange={handleInputChange}
                                className="w-full px-4 py-2 border border-gray-300 bg-white rounded-lg focus:ring-2 focus:ring-emerald-400 outline-none pl-10"
                                placeholder="Enter your email"
                            />
                            <Mail className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                        </div>
                    </div>
                    <div>
                        <label className="block text-gray-600 font-medium mb-1">Password</label>
                        <div className="relative">
                            <input
                                id="password"
                                name="password"
                                type={showPassword ? "text" : "password"}
                                autoComplete="current-password"
                                required
                                value={formData.password}
                                onChange={handleInputChange}
                                className="w-full px-4 py-2 border border-gray-300 bg-white rounded-lg focus:ring-2 focus:ring-emerald-400 outline-none pl-10 pr-10"
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
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-2 text-white bg-emerald-500 hover:bg-emerald-600 rounded-lg transition duration-200 shadow-md font-semibold"
                    >
                        {loading ? 'Signing in...' : 'Sign in'}
                    </button>
                </form>
            ) : (
                <div className="space-y-4">
                    <button
                        onClick={resetMFA}
                        className="flex items-center gap-2 text-sm text-emerald-600 hover:text-emerald-500"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back to login
                    </button>
                    <div className="flex rounded-md shadow-sm">
                        <button
                            type="button"
                            onClick={() => setUseBackupCode(false)}
                            className={`flex-1 px-4 py-2 text-sm font-medium rounded-l-md border ${
                                !useBackupCode
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-500'
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
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-500'
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
                                <label className="block text-gray-600 font-medium mb-1">6-digit code from your authenticator app</label>
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
                                            value: sanitizeInput(e.target.value.replace(/\D/g, '').slice(0, 6))
                                        }
                                    })}
                                    className="w-full px-4 py-2 border border-gray-300 bg-white rounded-lg focus:ring-2 focus:ring-emerald-400 outline-none text-center text-lg font-mono"
                                    placeholder="123456"
                                />
                                <p className="mt-1 text-xs text-gray-500">
                                    Open your authenticator app and enter the 6-digit code
                                </p>
                            </div>
                        ) : (
                            <div>
                                <label className="block text-gray-600 font-medium mb-1">Backup Code</label>
                                <input
                                    id="mfaBackupCode"
                                    name="mfaBackupCode"
                                    type="text"
                                    required
                                    value={formData.mfaBackupCode}
                                    onChange={(e) => handleInputChange({
                                        target: {
                                            name: 'mfaBackupCode',
                                            value: sanitizeInput(e.target.value.toUpperCase())
                                        }
                                    })}
                                    className="w-full px-4 py-2 border border-gray-300 bg-white rounded-lg focus:ring-2 focus:ring-emerald-400 outline-none text-center font-mono"
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
                            className="w-full py-2 text-white bg-emerald-500 hover:bg-emerald-600 rounded-lg transition duration-200 shadow-md font-semibold"
                        >
                            {loading ? 'Verifying...' : 'Verify & Sign In'}
                        </button>
                    </form>
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
