import React, { useState, useEffect } from "react";
import { 
    Calendar, 
    Download, 
    Filter, 
    Search, 
    Eye, 
    AlertTriangle, 
    Shield, 
    Clock, 
    User,
    Activity,
    Trash2,
    RefreshCw,
    X
} from "lucide-react";
import { sanitizeInput } from "../../utils/sanitize";

const ActivityLogs = () => {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [stats, setStats] = useState({});
    const [summary, setSummary] = useState({});
    
    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalLogs, setTotalLogs] = useState(0);
    
    // Filter state
    const [filters, setFilters] = useState({
        action: "",
        severity: "",
        success: "",
        resourceType: "",
        userEmail: "",
        startDate: "",
        endDate: "",
        limit: 20
    });
    
    // Modal state
    const [selectedLog, setSelectedLog] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [showFilters, setShowFilters] = useState(false);

    // Fetch activity logs
    const fetchLogs = async (page = 1, appliedFilters = filters) => {
        try {
            setLoading(true);
            setError("");
            
            const token = localStorage.getItem("token");
            if (!token) {
                throw new Error("No authentication token found");
            }

            const queryParams = new URLSearchParams({
                page: page.toString(),
                limit: appliedFilters.limit.toString(),
                ...Object.fromEntries(
                    Object.entries(appliedFilters).filter(([_, value]) => value && value !== "")
                )
            });

            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
            const response = await fetch(`${apiUrl}/api/activity-logs?${queryParams}`, {
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json"
                }
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error('API Error Response:', errorText);
                
                if (response.status === 401) {
                    throw new Error("Authentication failed. Please login again.");
                } else if (response.status === 403) {
                    throw new Error("Access denied. Admin privileges required.");
                } else if (response.status === 404) {
                    throw new Error("Activity logs API endpoint not found. Please check backend setup.");
                } else {
                    throw new Error(`Server error: ${response.status} - ${errorText}`);
                }
            }

            const contentType = response.headers.get("content-type");
            if (!contentType || !contentType.includes("application/json")) {
                const responseText = await response.text();
                console.error('Non-JSON Response:', responseText);
                throw new Error("Server returned invalid response format. Check backend configuration.");
            }

            const data = await response.json();
            setLogs(data.logs || []);
            setCurrentPage(data.pagination?.currentPage || 1);
            setTotalPages(data.pagination?.totalPages || 1);
            setTotalLogs(data.pagination?.totalLogs || 0);
        } catch (err) {
            console.error('Fetch logs error:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    // Fetch statistics
    const fetchStats = async () => {
        try {
            const token = localStorage.getItem("token");
            if (!token) {
                console.warn("No token found for stats");
                return;
            }

            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
            const response = await fetch(`${apiUrl}/api/activity-logs/stats`, {
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json"
                }
            });

            if (response.ok) {
                const contentType = response.headers.get("content-type");
                if (contentType && contentType.includes("application/json")) {
                    const data = await response.json();
                    setStats(data);
                } else {
                    console.warn("Stats endpoint returned non-JSON response");
                }
            } else {
                console.warn(`Stats fetch failed with status: ${response.status}`);
            }
        } catch (err) {
            console.error("Failed to fetch stats:", err);
        }
    };

    // Fetch summary
    const fetchSummary = async () => {
        try {
            const token = localStorage.getItem("token");
            if (!token) {
                console.warn("No token found for summary");
                return;
            }

            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
            const response = await fetch(`${apiUrl}/api/activity-logs/summary`, {
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json"
                }
            });

            if (response.ok) {
                const contentType = response.headers.get("content-type");
                if (contentType && contentType.includes("application/json")) {
                    const data = await response.json();
                    setSummary(data);
                } else {
                    console.warn("Summary endpoint returned non-JSON response");
                }
            } else {
                console.warn(`Summary fetch failed with status: ${response.status}`);
            }
        } catch (err) {
            console.error("Failed to fetch summary:", err);
        }
    };

    // Export logs
    const exportLogs = async (format = 'json') => {
        try {
            const token = localStorage.getItem("token");
            const queryParams = new URLSearchParams({
                format,
                ...Object.fromEntries(
                    Object.entries(filters).filter(([_, value]) => value && value !== "")
                )
            });

            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/activity-logs/export?${queryParams}`, {
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            });

            if (response.ok) {
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.style.display = 'none';
                a.href = url;
                a.download = `activity_logs.${format}`;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
            }
        } catch (err) {
            setError("Failed to export logs");
        }
    };

    // Delete old logs
    const deleteOldLogs = async () => {
        if (!window.confirm("Are you sure you want to delete logs older than 90 days?")) {
            return;
        }

        try {
            const token = localStorage.getItem("token");
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/activity-logs/cleanup`, {
                method: "DELETE",
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ days: 90 })
            });

            if (response.ok) {
                const data = await response.json();
                alert(`Successfully deleted ${data.deletedCount} old logs`);
                fetchLogs();
                fetchStats();
                fetchSummary();
            }
        } catch (err) {
            setError("Failed to delete old logs");
        }
    };

    // Handle filter changes
    const handleFilterChange = (key, value) => {
        // Sanitize string inputs, but not numbers, dates, or boolean values
        const sanitizedValue = (typeof value === 'string' && !['startDate', 'endDate'].includes(key)) 
            ? sanitizeInput(value) 
            : value;
        setFilters(prev => ({ ...prev, [key]: sanitizedValue }));
    };

    // Apply filters
    const applyFilters = () => {
        setCurrentPage(1);
        fetchLogs(1, filters);
    };

    // Clear filters
    const clearFilters = () => {
        const clearedFilters = {
            action: "",
            severity: "",
            success: "",
            resourceType: "",
            userEmail: "",
            startDate: "",
            endDate: "",
            limit: 20
        };
        setFilters(clearedFilters);
        setCurrentPage(1);
        fetchLogs(1, clearedFilters);
    };

    // Get severity color
    const getSeverityColor = (severity) => {
        switch (severity) {
            case 'LOW': return 'text-green-600 bg-green-100';
            case 'MEDIUM': return 'text-yellow-600 bg-yellow-100';
            case 'HIGH': return 'text-orange-600 bg-orange-100';
            case 'CRITICAL': return 'text-red-600 bg-red-100';
            default: return 'text-gray-600 bg-gray-100';
        }
    };

    // Get action color
    const getActionColor = (action) => {
        if (action.includes('FAILED') || action.includes('ERROR')) {
            return 'text-red-600 bg-red-100';
        }
        if (action.includes('DELETE') || action.includes('REMOVE')) {
            return 'text-orange-600 bg-orange-100';
        }
        if (action.includes('CREATE') || action.includes('ADD')) {
            return 'text-green-600 bg-green-100';
        }
        if (action.includes('UPDATE') || action.includes('EDIT')) {
            return 'text-blue-600 bg-blue-100';
        }
        return 'text-gray-600 bg-gray-100';
    };

    useEffect(() => {
        fetchLogs();
        fetchStats();
        fetchSummary();
    }, []);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold flex items-center gap-2">
                        <Activity className="w-6 h-6" />
                        Activity Logs
                    </h2>
                    <p className="text-gray-600 mt-1">Monitor system activities and user actions</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                    >
                        <Filter className="w-4 h-4" />
                        Filters
                    </button>
                    <button
                        onClick={() => exportLogs('json')}
                        className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                    >
                        <Download className="w-4 h-4" />
                        Export JSON
                    </button>
                    <button
                        onClick={() => exportLogs('csv')}
                        className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                    >
                        <Download className="w-4 h-4" />
                        Export CSV
                    </button>
                    <button
                        onClick={deleteOldLogs}
                        className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                    >
                        <Trash2 className="w-4 h-4" />
                        Cleanup
                    </button>
                    <button
                        onClick={() => {
                            fetchLogs();
                            fetchStats();
                            fetchSummary();
                        }}
                        className="flex items-center gap-2 px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
                    >
                        <RefreshCw className="w-4 h-4" />
                        Refresh
                    </button>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <div className="bg-white p-4 rounded-lg shadow border-l-4 border-blue-500">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-gray-600 text-sm">Today</p>
                            <p className="text-2xl font-bold">{summary.today || 0}</p>
                        </div>
                        <Clock className="w-8 h-8 text-blue-500" />
                    </div>
                </div>
                
                <div className="bg-white p-4 rounded-lg shadow border-l-4 border-green-500">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-gray-600 text-sm">This Week</p>
                            <p className="text-2xl font-bold">{summary.thisWeek || 0}</p>
                        </div>
                        <Calendar className="w-8 h-8 text-green-500" />
                    </div>
                </div>
                
                <div className="bg-white p-4 rounded-lg shadow border-l-4 border-red-500">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-gray-600 text-sm">Failed Logins</p>
                            <p className="text-2xl font-bold">{summary.failedLogins || 0}</p>
                        </div>
                        <AlertTriangle className="w-8 h-8 text-red-500" />
                    </div>
                </div>
                
                <div className="bg-white p-4 rounded-lg shadow border-l-4 border-orange-500">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-gray-600 text-sm">Security Alerts</p>
                            <p className="text-2xl font-bold">{summary.securityAlerts || 0}</p>
                        </div>
                        <Shield className="w-8 h-8 text-orange-500" />
                    </div>
                </div>
                
                <div className="bg-white p-4 rounded-lg shadow border-l-4 border-purple-500">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-gray-600 text-sm">Total Logs</p>
                            <p className="text-2xl font-bold">{totalLogs}</p>
                        </div>
                        <Activity className="w-8 h-8 text-purple-500" />
                    </div>
                </div>
            </div>

            {/* Filters */}
            {showFilters && (
                <div className="bg-white p-6 rounded-lg shadow">
                    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Action</label>
                            <select
                                value={filters.action}
                                onChange={(e) => handleFilterChange('action', e.target.value)}
                                className="w-full border border-gray-300 rounded px-3 py-2"
                            >
                                <option value="">All Actions</option>
                                <option value="LOGIN">Login</option>
                                <option value="LOGOUT">Logout</option>
                                <option value="REGISTER">Register</option>
                                <option value="FAILED_LOGIN">Failed Login</option>
                                <option value="CREATE_BOOKING">Create Booking</option>
                                <option value="UPDATE_BOOKING">Update Booking</option>
                                <option value="DELETE_BOOKING">Delete Booking</option>
                                <option value="CREATE_ROOM">Create Room</option>
                                <option value="UPDATE_ROOM">Update Room</option>
                                <option value="DELETE_ROOM">Delete Room</option>
                            </select>
                        </div>
                        
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Severity</label>
                            <select
                                value={filters.severity}
                                onChange={(e) => handleFilterChange('severity', e.target.value)}
                                className="w-full border border-gray-300 rounded px-3 py-2"
                            >
                                <option value="">All Severities</option>
                                <option value="LOW">Low</option>
                                <option value="MEDIUM">Medium</option>
                                <option value="HIGH">High</option>
                                <option value="CRITICAL">Critical</option>
                            </select>
                        </div>
                        
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Success</label>
                            <select
                                value={filters.success}
                                onChange={(e) => handleFilterChange('success', e.target.value)}
                                className="w-full border border-gray-300 rounded px-3 py-2"
                            >
                                <option value="">All</option>
                                <option value="true">Success</option>
                                <option value="false">Failed</option>
                            </select>
                        </div>
                        
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Resource Type</label>
                            <select
                                value={filters.resourceType}
                                onChange={(e) => handleFilterChange('resourceType', e.target.value)}
                                className="w-full border border-gray-300 rounded px-3 py-2"
                            >
                                <option value="">All Types</option>
                                <option value="USER">User</option>
                                <option value="ROOM">Room</option>
                                <option value="BOOKING">Booking</option>
                                <option value="SYSTEM">System</option>
                                <option value="FILE">File</option>
                            </select>
                        </div>
                        
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">User Email</label>
                            <input
                                type="text"
                                value={filters.userEmail}
                                onChange={(e) => handleFilterChange('userEmail', e.target.value)}
                                placeholder="Search by email..."
                                className="w-full border border-gray-300 rounded px-3 py-2"
                            />
                        </div>
                        
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                            <input
                                type="date"
                                value={filters.startDate}
                                onChange={(e) => handleFilterChange('startDate', e.target.value)}
                                className="w-full border border-gray-300 rounded px-3 py-2"
                            />
                        </div>
                        
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                            <input
                                type="date"
                                value={filters.endDate}
                                onChange={(e) => handleFilterChange('endDate', e.target.value)}
                                className="w-full border border-gray-300 rounded px-3 py-2"
                            />
                        </div>
                        
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Limit</label>
                            <select
                                value={filters.limit}
                                onChange={(e) => handleFilterChange('limit', parseInt(e.target.value))}
                                className="w-full border border-gray-300 rounded px-3 py-2"
                            >
                                <option value={10}>10</option>
                                <option value={20}>20</option>
                                <option value={50}>50</option>
                                <option value={100}>100</option>
                            </select>
                        </div>
                    </div>
                    
                    <div className="flex gap-2 mt-4">
                        <button
                            onClick={applyFilters}
                            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                        >
                            Apply Filters
                        </button>
                        <button
                            onClick={clearFilters}
                            className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
                        >
                            Clear Filters
                        </button>
                    </div>
                </div>
            )}

            {/* Error Display */}
            {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                    {error}
                </div>
            )}

            {/* Logs Table */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
                {loading ? (
                    <div className="flex justify-center items-center h-64">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                    </div>
                ) : (
                    <>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Timestamp
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            User
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Action
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Severity
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Status
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            IP Address
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {logs.map((log) => (
                                        <tr key={log._id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                {new Date(log.timestamp).toLocaleString()}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    <User className="w-4 h-4 text-gray-400 mr-2" />
                                                    <div>
                                                        <div className="text-sm font-medium text-gray-900">
                                                            {log.userEmail || 'Anonymous'}
                                                        </div>
                                                        <div className="text-sm text-gray-500">
                                                            {log.userRole || 'N/A'}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getActionColor(log.action)}`}>
                                                    {log.action}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getSeverityColor(log.severity)}`}>
                                                    {log.severity}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                                    log.success ? 'text-green-600 bg-green-100' : 'text-red-600 bg-red-100'
                                                }`}>
                                                    {log.success ? 'Success' : 'Failed'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                {log.ipAddress || 'N/A'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                <button
                                                    onClick={() => {
                                                        setSelectedLog(log);
                                                        setShowModal(true);
                                                    }}
                                                    className="text-blue-600 hover:text-blue-900 flex items-center gap-1"
                                                >
                                                    <Eye className="w-4 h-4" />
                                                    View
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                                <div className="flex-1 flex justify-between sm:hidden">
                                    <button
                                        onClick={() => fetchLogs(currentPage - 1)}
                                        disabled={currentPage === 1}
                                        className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                                    >
                                        Previous
                                    </button>
                                    <button
                                        onClick={() => fetchLogs(currentPage + 1)}
                                        disabled={currentPage === totalPages}
                                        className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                                    >
                                        Next
                                    </button>
                                </div>
                                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                                    <div>
                                        <p className="text-sm text-gray-700">
                                            Showing{' '}
                                            <span className="font-medium">{(currentPage - 1) * filters.limit + 1}</span>
                                            {' '}to{' '}
                                            <span className="font-medium">
                                                {Math.min(currentPage * filters.limit, totalLogs)}
                                            </span>
                                            {' '}of{' '}
                                            <span className="font-medium">{totalLogs}</span>
                                            {' '}results
                                        </p>
                                    </div>
                                    <div>
                                        <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                                            <button
                                                onClick={() => fetchLogs(currentPage - 1)}
                                                disabled={currentPage === 1}
                                                className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                                            >
                                                Previous
                                            </button>
                                            {[...Array(Math.min(5, totalPages))].map((_, i) => {
                                                const page = i + 1;
                                                return (
                                                    <button
                                                        key={page}
                                                        onClick={() => fetchLogs(page)}
                                                        className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                                                            currentPage === page
                                                                ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                                                                : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                                                        }`}
                                                    >
                                                        {page}
                                                    </button>
                                                );
                                            })}
                                            <button
                                                onClick={() => fetchLogs(currentPage + 1)}
                                                disabled={currentPage === totalPages}
                                                className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                                            >
                                                Next
                                            </button>
                                        </nav>
                                    </div>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Log Detail Modal */}
            {showModal && selectedLog && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
                    <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
                        <div className="mt-3">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-medium text-gray-900">Activity Log Details</h3>
                                <button
                                    onClick={() => setShowModal(false)}
                                    className="text-gray-400 hover:text-gray-600"
                                >
                                    <X className="w-6 h-6" />
                                </button>
                            </div>
                            
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Timestamp</label>
                                        <p className="mt-1 text-sm text-gray-900">
                                            {new Date(selectedLog.timestamp).toLocaleString()}
                                        </p>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Action</label>
                                        <p className="mt-1">
                                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getActionColor(selectedLog.action)}`}>
                                                {selectedLog.action}
                                            </span>
                                        </p>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">User</label>
                                        <p className="mt-1 text-sm text-gray-900">
                                            {selectedLog.userEmail || 'Anonymous'} ({selectedLog.userRole || 'N/A'})
                                        </p>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Severity</label>
                                        <p className="mt-1">
                                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getSeverityColor(selectedLog.severity)}`}>
                                                {selectedLog.severity}
                                            </span>
                                        </p>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Status</label>
                                        <p className="mt-1">
                                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                                selectedLog.success ? 'text-green-600 bg-green-100' : 'text-red-600 bg-red-100'
                                            }`}>
                                                {selectedLog.success ? 'Success' : 'Failed'}
                                            </span>
                                        </p>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">IP Address</label>
                                        <p className="mt-1 text-sm text-gray-900">{selectedLog.ipAddress || 'N/A'}</p>
                                    </div>
                                </div>
                                
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Description</label>
                                    <p className="mt-1 text-sm text-gray-900">{selectedLog.description}</p>
                                </div>
                                
                                {selectedLog.userAgent && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">User Agent</label>
                                        <p className="mt-1 text-sm text-gray-900 break-all">{selectedLog.userAgent}</p>
                                    </div>
                                )}
                                
                                {selectedLog.requestUrl && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Request URL</label>
                                        <p className="mt-1 text-sm text-gray-900">
                                            {selectedLog.requestMethod} {selectedLog.requestUrl}
                                        </p>
                                    </div>
                                )}
                                
                                {selectedLog.errorMessage && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Error Message</label>
                                        <p className="mt-1 text-sm text-red-600">{selectedLog.errorMessage}</p>
                                    </div>
                                )}
                                
                                {selectedLog.metadata && Object.keys(selectedLog.metadata).length > 0 && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Metadata</label>
                                        <pre className="mt-1 text-sm text-gray-900 bg-gray-100 p-2 rounded overflow-x-auto">
                                            {JSON.stringify(selectedLog.metadata, null, 2)}
                                        </pre>
                                    </div>
                                )}
                            </div>
                            
                            <div className="mt-6 flex justify-end">
                                <button
                                    onClick={() => setShowModal(false)}
                                    className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ActivityLogs;
