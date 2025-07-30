import React, { useState, useEffect } from "react";
import { BarChart3, TrendingUp, Users, Activity, AlertCircle, Calendar } from "lucide-react";

const Analytics = () => {
    const [stats, setStats] = useState({});
    const [loading, setLoading] = useState(false);

    const fetchActivityStats = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem("token");
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/activity-logs/stats`, {
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json"
                }
            });

            if (response.ok) {
                const data = await response.json();
                setStats(data);
            }
        } catch (err) {
            console.error("Failed to fetch analytics:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchActivityStats();
    }, []);

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-2">
                <BarChart3 className="w-6 h-6" />
                <h2 className="text-2xl font-bold">Analytics Dashboard</h2>
            </div>

            {loading ? (
                <div className="flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {/* Total Logs */}
                    <div className="bg-white p-6 rounded-lg shadow border-l-4 border-blue-500">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-600 text-sm">Total Activity Logs</p>
                                <p className="text-3xl font-bold text-blue-600">{stats.totalLogs || 0}</p>
                            </div>
                            <Activity className="w-8 h-8 text-blue-500" />
                        </div>
                    </div>

                    {/* Active Users */}
                    <div className="bg-white p-6 rounded-lg shadow border-l-4 border-green-500">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-600 text-sm">Active Users (30 days)</p>
                                <p className="text-3xl font-bold text-green-600">{stats.activeUsers || 0}</p>
                            </div>
                            <Users className="w-8 h-8 text-green-500" />
                        </div>
                    </div>

                    {/* Recent Activity */}
                    <div className="bg-white p-6 rounded-lg shadow border-l-4 border-purple-500">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-600 text-sm">Recent Activity (24h)</p>
                                <p className="text-3xl font-bold text-purple-600">{stats.recentActivity || 0}</p>
                            </div>
                            <Calendar className="w-8 h-8 text-purple-500" />
                        </div>
                    </div>

                    {/* Security Events */}
                    <div className="bg-white p-6 rounded-lg shadow border-l-4 border-red-500">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-600 text-sm">Security Events (30 days)</p>
                                <p className="text-3xl font-bold text-red-600">{stats.securityEvents || 0}</p>
                            </div>
                            <AlertCircle className="w-8 h-8 text-red-500" />
                        </div>
                    </div>

                    {/* Top Actions */}
                    <div className="bg-white p-6 rounded-lg shadow md:col-span-2">
                        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                            <TrendingUp className="w-5 h-5" />
                            Top Actions
                        </h3>
                        {stats.actionStats && stats.actionStats.length > 0 ? (
                            <div className="space-y-2">
                                {stats.actionStats.slice(0, 5).map((action, index) => (
                                    <div key={index} className="flex justify-between items-center p-2 rounded bg-gray-50">
                                        <span className="font-medium">{action._id}</span>
                                        <span className="text-gray-600">{action.count} times</span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-gray-500">No action data available</p>
                        )}
                    </div>

                    {/* Severity Distribution */}
                    <div className="bg-white p-6 rounded-lg shadow">
                        <h3 className="text-lg font-semibold mb-4">Severity Distribution</h3>
                        {stats.severityStats && stats.severityStats.length > 0 ? (
                            <div className="space-y-2">
                                {stats.severityStats.map((severity, index) => {
                                    const colors = {
                                        LOW: 'bg-green-100 text-green-800',
                                        MEDIUM: 'bg-yellow-100 text-yellow-800',
                                        HIGH: 'bg-orange-100 text-orange-800',
                                        CRITICAL: 'bg-red-100 text-red-800'
                                    };
                                    return (
                                        <div key={index} className="flex justify-between items-center">
                                            <span className={`px-2 py-1 rounded text-sm ${colors[severity._id] || 'bg-gray-100 text-gray-800'}`}>
                                                {severity._id}
                                            </span>
                                            <span className="text-gray-600">{severity.count}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <p className="text-gray-500">No severity data available</p>
                        )}
                    </div>

                    {/* Top IP Addresses */}
                    <div className="bg-white p-6 rounded-lg shadow md:col-span-2">
                        <h3 className="text-lg font-semibold mb-4">Top IP Addresses (7 days)</h3>
                        {stats.topIPs && stats.topIPs.length > 0 ? (
                            <div className="space-y-2">
                                {stats.topIPs.slice(0, 5).map((ip, index) => (
                                    <div key={index} className="flex justify-between items-center p-2 rounded bg-gray-50">
                                        <span className="font-mono text-sm">{ip._id}</span>
                                        <span className="text-gray-600">{ip.count} requests</span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-gray-500">No IP data available</p>
                        )}
                    </div>

                    {/* Success vs Failure Rate */}
                    <div className="bg-white p-6 rounded-lg shadow">
                        <h3 className="text-lg font-semibold mb-4">Success Rate</h3>
                        {stats.successStats && stats.successStats.length > 0 ? (
                            <div className="space-y-2">
                                {stats.successStats.map((stat, index) => (
                                    <div key={index} className="flex justify-between items-center">
                                        <span className={`px-2 py-1 rounded text-sm ${
                                            stat._id ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                        }`}>
                                            {stat._id ? 'Success' : 'Failed'}
                                        </span>
                                        <span className="text-gray-600">{stat.count}</span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-gray-500">No success rate data available</p>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default Analytics;
