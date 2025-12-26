import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../config';
import { 
  FileText, 
  MessageSquare, 
  Settings, 
  Activity,
  TrendingUp,
  Clock,
  Database
} from 'lucide-react';

interface DashboardStats {
  overview: {
    totalDocuments: number;
    totalConversations: number;
    totalWorkflows: number;
    activeWorkflows: number;
    storageUsedMB: number;
  };
  recentActivity: {
    documentsUploaded: number;
    conversationsStarted: number;
    workflowExecutions: number;
  };
  languageDistribution: Array<{
    language: string;
    count: number;
  }>;
}

interface Activity {
  id: string;
  type: string;
  title: string;
  timestamp: string;
  language?: string;
  status?: string;
  metadata?: {
    source?: string;
    messageCount?: number;
    workflowName?: string;
    originalName?: string;
  };
}

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'dashboard' | 'widget'>('all');

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [statsResponse, activitiesResponse] = await Promise.all([
          axios.get(`${API_BASE_URL}/api/dashboard/stats`),
          axios.get(`${API_BASE_URL}/api/dashboard/activities?limit=10`)
        ]);

        setStats(statsResponse.data.stats);
        setActivities(activitiesResponse.data.activities);
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'document':
        return <FileText className="h-4 w-4" />;
      case 'conversation':
        return <MessageSquare className="h-4 w-4" />;
      case 'workflow':
        return <Settings className="h-4 w-4" />;
      default:
        return <Activity className="h-4 w-4" />;
    }
  };

  const getLanguageLabel = (lang: string) => {
    switch (lang) {
      case 'am':
        return 'Amharic';
      case 'en':
        return 'English';
      case 'auto':
        return 'Auto-detect';
      default:
        return 'Unknown';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600">Welcome to your Amharic AI Assistant dashboard</p>
      </div>

      {/* Overview Stats */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <FileText className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Documents</p>
                <p className="text-2xl font-bold text-gray-900">{stats.overview.totalDocuments}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <MessageSquare className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Conversations</p>
                <p className="text-2xl font-bold text-gray-900">{stats.overview.totalConversations}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Settings className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active Workflows</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.overview.activeWorkflows}/{stats.overview.totalWorkflows}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Database className="h-6 w-6 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Storage Used</p>
                <p className="text-2xl font-bold text-gray-900">{stats.overview.storageUsedMB} MB</p>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">Recent Activity</h3>
            <select 
              value={filter} 
              onChange={(e) => setFilter(e.target.value as any)}
              className="text-xs border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="all">All Sources</option>
              <option value="dashboard">Dashboard Only</option>
              <option value="widget">Widget Only</option>
            </select>
          </div>
          
          {stats && (
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="text-center">
                <div className="flex items-center justify-center">
                  <TrendingUp className="h-5 w-5 text-blue-600 mr-1" />
                  <span className="text-2xl font-bold text-blue-600">
                    {stats.recentActivity.documentsUploaded}
                  </span>
                </div>
                <p className="text-xs text-gray-600">Documents (30d)</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center">
                  <MessageSquare className="h-5 w-5 text-green-600 mr-1" />
                  <span className="text-2xl font-bold text-green-600">
                    {stats.recentActivity.conversationsStarted}
                  </span>
                </div>
                <p className="text-xs text-gray-600">Chats (30d)</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center">
                  <Settings className="h-5 w-5 text-purple-600 mr-1" />
                  <span className="text-2xl font-bold text-purple-600">
                    {stats.recentActivity.workflowExecutions}
                  </span>
                </div>
                <p className="text-xs text-gray-600">Workflows (30d)</p>
              </div>
            </div>
          )}

          <div className="space-y-3">
            {activities.filter(a => {
              if (filter === 'all') return true;
              if (a.type === 'conversation' && a.metadata?.source && (filter === 'dashboard' || filter === 'widget')) {
                return a.metadata.source === filter;
              }
              return false;
            }).length > 0 ? (
              activities
                .filter(a => {
                  if (filter === 'all') return true;
                  if (a.type === 'conversation' && a.metadata?.source && (filter === 'dashboard' || filter === 'widget')) {
                    return a.metadata.source === filter;
                  }
                  return false;
                })
                .map((activity) => (
                <div key={activity.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                  <div className="flex-shrink-0">
                    {getActivityIcon(activity.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {activity.title}
                    </p>
                    <div className="flex items-center space-x-2 text-xs text-gray-500">
                      <Clock className="h-3 w-3" />
                      <span>{formatDate(activity.timestamp)}</span>
                      {activity.language && (
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded">
                          {getLanguageLabel(activity.language)}
                        </span>
                      )}
                      {activity.metadata?.source && (
                        <span className={`px-2 py-1 rounded ${
                          activity.metadata.source === 'widget' 
                            ? 'bg-purple-100 text-purple-800' 
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {activity.metadata.source === 'widget' ? 'Widget' : 'Dashboard'}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-center py-4">No recent activity</p>
            )}
          </div>
        </div>

        {/* Language Distribution */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Language Distribution</h3>
          
          {stats && stats.languageDistribution.length > 0 ? (
            <div className="space-y-4">
              {stats.languageDistribution.map((item) => (
                <div key={item.language} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <span className="text-sm font-medium text-gray-900">
                      {getLanguageLabel(item.language)}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-600">{item.count}</span>
                    <div className="w-20 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{
                          width: `${Math.min(100, (item.count / Math.max(...stats.languageDistribution.map(d => d.count))) * 100)}%`
                        }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">No documents uploaded yet</p>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <a
            href="/documents"
            className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <FileText className="h-8 w-8 text-blue-600 mr-3" />
            <div>
              <p className="font-medium text-gray-900">Upload Documents</p>
              <p className="text-sm text-gray-600">Add new documents to your library</p>
            </div>
          </a>

          <a
            href="/chat"
            className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <MessageSquare className="h-8 w-8 text-green-600 mr-3" />
            <div>
              <p className="font-medium text-gray-900">Start Chat</p>
              <p className="text-sm text-gray-600">Chat with AI in Amharic or English</p>
            </div>
          </a>

          <a
            href="/workflows"
            className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Settings className="h-8 w-8 text-purple-600 mr-3" />
            <div>
              <p className="font-medium text-gray-900">Create Workflow</p>
              <p className="text-sm text-gray-600">Automate your processes</p>
            </div>
          </a>
        </div>
      </div>
    </div>
  );
};

export default Dashboard; 