import React, { useState, useEffect } from 'react';
import { 
    Shield, 
    ShieldCheck, 
    ShieldX, 
    QrCode, 
    Key, 
    Copy, 
    Eye, 
    EyeOff,
    AlertTriangle,
    CheckCircle,
    RefreshCw,
    Smartphone
} from 'lucide-react';
import { sanitizeInput, createSanitizedHandler } from '../utils/sanitize';

const MFASettings = () => {
    const [mfaStatus, setMfaStatus] = useState({
        mfaEnabled: false,
        mfaSetupCompleted: false,
        remainingBackupCodes: 0
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    
    // Setup states
    const [showSetup, setShowSetup] = useState(false);
    const [qrCode, setQrCode] = useState('');
    const [manualEntryKey, setManualEntryKey] = useState('');
    const [verificationToken, setVerificationToken] = useState('');
    const [backupCodes, setBackupCodes] = useState([]);
    
    // Password confirmation states
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [password, setPassword] = useState('');
    const [modalAction, setModalAction] = useState(''); // 'disable', 'regenerate'
    
    // Display states
    const [showBackupCodes, setShowBackupCodes] = useState(false);
    const [copiedCodes, setCopiedCodes] = useState(false);

    // Fetch MFA status on component mount
    useEffect(() => {
        fetchMFAStatus();
    }, []);

    const fetchMFAStatus = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/mfa/status`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const data = await response.json();
                setMfaStatus(data);
            }
        } catch (err) {
            console.error('Failed to fetch MFA status:', err);
        }
    };

    const initializeMFA = async () => {
        try {
            setLoading(true);
            setError('');
            
            const token = localStorage.getItem('token');
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/mfa/initialize`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            const data = await response.json();

            if (response.ok) {
                setQrCode(data.qrCode);
                setManualEntryKey(data.manualEntryKey);
                setShowSetup(true);
                setSuccess('MFA setup initialized. Please scan the QR code or enter the manual key.');
            } else {
                setError(data.message || 'Failed to initialize MFA');
            }
        } catch (err) {
            setError('Failed to initialize MFA');
        } finally {
            setLoading(false);
        }
    };

    const verifyMFASetup = async () => {
        try {
            setLoading(true);
            setError('');

            const token = localStorage.getItem('token');
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/mfa/verify-setup`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ token: verificationToken })
            });

            const data = await response.json();

            if (response.ok) {
                setBackupCodes(data.backupCodes);
                setShowSetup(false);
                setShowBackupCodes(true);
                setSuccess('MFA setup completed successfully! Please save your backup codes.');
                await fetchMFAStatus();
            } else {
                setError(data.message || 'Invalid verification token');
            }
        } catch (err) {
            setError('Failed to verify MFA setup');
        } finally {
            setLoading(false);
        }
    };

    const handlePasswordAction = async () => {
        try {
            setLoading(true);
            setError('');

            const token = localStorage.getItem('token');
            const endpoint = modalAction === 'disable' ? '/api/mfa/disable' : '/api/mfa/regenerate-backup-codes';
            
            const response = await fetch(`${import.meta.env.VITE_API_URL}${endpoint}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ password })
            });

            const data = await response.json();

            if (response.ok) {
                if (modalAction === 'disable') {
                    setSuccess('MFA has been disabled successfully');
                    await fetchMFAStatus();
                } else {
                    setBackupCodes(data.backupCodes);
                    setShowBackupCodes(true);
                    setSuccess('New backup codes generated successfully');
                }
                setShowPasswordModal(false);
                setPassword('');
            } else {
                setError(data.message || 'Action failed');
            }
        } catch (err) {
            setError('Failed to complete action');
        } finally {
            setLoading(false);
        }
    };

    const copyBackupCodes = () => {
        const codesText = backupCodes.join('\n');
        navigator.clipboard.writeText(codesText).then(() => {
            setCopiedCodes(true);
            setTimeout(() => setCopiedCodes(false), 3000);
        });
    };

    const openPasswordModal = (action) => {
        setModalAction(action);
        setShowPasswordModal(true);
        setPassword('');
        setError('');
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-white p-6 rounded-lg shadow">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
                            <Shield className="w-5 h-5" />
                            Multi-Factor Authentication (MFA)
                        </h3>
                        <p className="mt-1 text-sm text-gray-600">
                            Add an extra layer of security to your account
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        {mfaStatus.mfaEnabled ? (
                            <ShieldCheck className="w-8 h-8 text-green-500" />
                        ) : (
                            <ShieldX className="w-8 h-8 text-gray-400" />
                        )}
                    </div>
                </div>
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

            {/* MFA Status */}
            <div className="bg-white p-6 rounded-lg shadow">
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-700">
                            MFA Status
                        </span>
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                            mfaStatus.mfaEnabled 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-red-100 text-red-800'
                        }`}>
                            {mfaStatus.mfaEnabled ? 'Enabled' : 'Disabled'}
                        </span>
                    </div>

                    {mfaStatus.mfaEnabled && (
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-gray-700">
                                Backup Codes Remaining
                            </span>
                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                                mfaStatus.remainingBackupCodes > 3 
                                    ? 'bg-green-100 text-green-800' 
                                    : mfaStatus.remainingBackupCodes > 0
                                    ? 'bg-yellow-100 text-yellow-800'
                                    : 'bg-red-100 text-red-800'
                            }`}>
                                {mfaStatus.remainingBackupCodes}
                            </span>
                        </div>
                    )}
                </div>
            </div>

            {/* Actions */}
            <div className="bg-white p-6 rounded-lg shadow">
                <div className="space-y-4">
                    {!mfaStatus.mfaEnabled ? (
                        <button
                            onClick={initializeMFA}
                            disabled={loading}
                            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
                        >
                            {loading ? (
                                <RefreshCw className="w-4 h-4 animate-spin" />
                            ) : (
                                <Smartphone className="w-4 h-4" />
                            )}
                            Enable MFA
                        </button>
                    ) : (
                        <div className="space-y-3">
                            <button
                                onClick={() => openPasswordModal('regenerate')}
                                disabled={loading}
                                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
                            >
                                <Key className="w-4 h-4" />
                                Regenerate Backup Codes
                            </button>
                            
                            <button
                                onClick={() => openPasswordModal('disable')}
                                disabled={loading}
                                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50"
                            >
                                <ShieldX className="w-4 h-4" />
                                Disable MFA
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* MFA Setup Modal */}
            {showSetup && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
                    <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
                        <div className="mt-3">
                            <h3 className="text-lg font-medium text-gray-900 mb-4">Set Up Multi-Factor Authentication</h3>
                            
                            <div className="space-y-6">
                                {/* Step 1: Scan QR Code */}
                                <div>
                                    <h4 className="text-md font-medium text-gray-700 mb-2">Step 1: Scan QR Code</h4>
                                    <p className="text-sm text-gray-600 mb-4">
                                        Scan this QR code with Microsoft Authenticator, Google Authenticator, or any TOTP app:
                                    </p>
                                    {qrCode && (
                                        <div className="flex justify-center mb-4">
                                            <img src={qrCode} alt="MFA QR Code" className="border rounded" />
                                        </div>
                                    )}
                                </div>

                                {/* Manual Entry Option */}
                                <div>
                                    <h4 className="text-md font-medium text-gray-700 mb-2">Or Enter Manually:</h4>
                                    <div className="flex items-center gap-2 p-2 bg-gray-100 rounded">
                                        <code className="flex-1 text-sm">{manualEntryKey}</code>
                                        <button
                                            onClick={() => navigator.clipboard.writeText(manualEntryKey)}
                                            className="p-1 text-gray-600 hover:text-gray-800"
                                        >
                                            <Copy className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>

                                {/* Step 2: Verify */}
                                <div>
                                    <h4 className="text-md font-medium text-gray-700 mb-2">Step 2: Enter Verification Code</h4>
                                    <p className="text-sm text-gray-600 mb-4">
                                        Enter the 6-digit code from your authenticator app:
                                    </p>
                                    <input
                                        type="text"
                                        value={verificationToken}
                                        onChange={(e) => {
                                            const sanitizedValue = sanitizeInput(e.target.value.replace(/\D/g, '').slice(0, 6));
                                            setVerificationToken(sanitizedValue);
                                        }}
                                        placeholder="123456"
                                        className="w-full p-3 border border-gray-300 rounded text-center text-lg font-mono"
                                        maxLength="6"
                                    />
                                </div>

                                <div className="flex gap-3">
                                    <button
                                        onClick={() => {
                                            setShowSetup(false);
                                            setVerificationToken('');
                                            setError('');
                                        }}
                                        className="flex-1 px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={verifyMFASetup}
                                        disabled={loading || verificationToken.length !== 6}
                                        className="flex-1 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
                                    >
                                        {loading ? 'Verifying...' : 'Complete Setup'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Backup Codes Modal */}
            {showBackupCodes && backupCodes.length > 0 && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
                    <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
                        <div className="mt-3">
                            <h3 className="text-lg font-medium text-gray-900 mb-4">Your Backup Codes</h3>
                            
                            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
                                <div className="flex items-center">
                                    <AlertTriangle className="w-5 h-5 text-yellow-400 mr-2" />
                                    <p className="text-sm text-yellow-700">
                                        <strong>Important:</strong> Save these backup codes in a secure location. 
                                        Each code can only be used once.
                                    </p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-2 mb-4">
                                {backupCodes.map((code, index) => (
                                    <div key={index} className="p-2 bg-gray-100 rounded text-center font-mono text-sm">
                                        {code}
                                    </div>
                                ))}
                            </div>

                            <div className="flex gap-3">
                                <button
                                    onClick={copyBackupCodes}
                                    className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                                >
                                    <Copy className="w-4 h-4" />
                                    {copiedCodes ? 'Copied!' : 'Copy All Codes'}
                                </button>
                                <button
                                    onClick={() => {
                                        setShowBackupCodes(false);
                                        setBackupCodes([]);
                                    }}
                                    className="flex-1 px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
                                >
                                    I've Saved My Codes
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Password Confirmation Modal */}
            {showPasswordModal && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
                    <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
                        <div className="mt-3">
                            <h3 className="text-lg font-medium text-gray-900 mb-4">Confirm Password</h3>
                            
                            <p className="text-sm text-gray-600 mb-4">
                                Please enter your password to {modalAction === 'disable' ? 'disable MFA' : 'regenerate backup codes'}:
                            </p>

                            <input
                                type="password"
                                value={password}
                                onChange={createSanitizedHandler(setPassword)}
                                placeholder="Enter your password"
                                className="w-full p-3 border border-gray-300 rounded mb-4"
                                onKeyPress={(e) => e.key === 'Enter' && handlePasswordAction()}
                            />

                            <div className="flex gap-3">
                                <button
                                    onClick={() => {
                                        setShowPasswordModal(false);
                                        setPassword('');
                                        setError('');
                                    }}
                                    className="flex-1 px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handlePasswordAction}
                                    disabled={loading || !password}
                                    className="flex-1 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
                                >
                                    {loading ? 'Processing...' : 'Confirm'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MFASettings;
