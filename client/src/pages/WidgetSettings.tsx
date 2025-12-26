import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../config';
import { 
  Palette, 
  MessageSquare, 
  Globe, 
  Code, 
  Copy, 
  Check, 
  Save,
  Shield
} from 'lucide-react';

interface WidgetSettingsData {
  primaryColor: string;
  welcomeMessage: string;
  welcomeMessageAm: string;
  botName: string;
  botNameAm: string;
  logoUrl: string | null;
  allowedDomains: string[];
  isEnabled: boolean;
}

const WidgetSettings: React.FC = () => {
  const [settings, setSettings] = useState<WidgetSettingsData | null>(null);
  const [apiKey, setApiKey] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [newDomain, setNewDomain] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [settingsRes, profileRes] = await Promise.all([
          axios.get(`${API_BASE_URL}/api/dashboard/widget-settings`),
          axios.get(`${API_BASE_URL}/api/auth/profile`)
        ]);

        setSettings(settingsRes.data.settings);
        setApiKey(profileRes.data.company.apiKey);
      } catch (error) {
        console.error('Failed to fetch widget settings:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleSave = async () => {
    if (!settings) return;
    setSaving(true);
    try {
      await axios.put(`${API_BASE_URL}/api/dashboard/widget-settings`, settings);
      alert('Settings saved successfully!');
    } catch (error) {
      console.error('Failed to save settings:', error);
      alert('Failed to save settings. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleCopySnippet = () => {
    const snippet = `<script 
  src="${API_BASE_URL}/widget.js" 
  data-api-key="${apiKey}"
  type="module"
  async
></script>`;
    
    navigator.clipboard.writeText(snippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const addDomain = () => {
    if (newDomain && settings && !settings.allowedDomains.includes(newDomain)) {
      setSettings({
        ...settings,
        allowedDomains: [...settings.allowedDomains, newDomain]
      });
      setNewDomain('');
    }
  };

  const removeDomain = (domain: string) => {
    if (settings) {
      setSettings({
        ...settings,
        allowedDomains: settings.allowedDomains.filter(d => d !== domain)
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!settings) return <div>Error loading settings.</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Widget Settings</h1>
        <p className="text-gray-600">Customize and deploy your AI chat widget</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Visual Settings */}
        <div className="bg-white p-6 rounded-lg shadow space-y-6">
          <div className="flex items-center space-x-2 border-b pb-2">
            <Palette className="h-5 w-5 text-blue-600" />
            <h2 className="text-lg font-semibold">Appearance</h2>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Primary Color</label>
              <div className="mt-1 flex items-center space-x-3">
                <input
                  type="color"
                  value={settings.primaryColor}
                  onChange={(e) => setSettings({ ...settings, primaryColor: e.target.value })}
                  className="h-10 w-20 rounded border border-gray-300 cursor-pointer"
                />
                <input
                  type="text"
                  value={settings.primaryColor}
                  onChange={(e) => setSettings({ ...settings, primaryColor: e.target.value })}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Bot Name (English)</label>
              <input
                type="text"
                value={settings.botName}
                onChange={(e) => setSettings({ ...settings, botName: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Bot Name (Amharic)</label>
              <input
                type="text"
                value={settings.botNameAm}
                onChange={(e) => setSettings({ ...settings, botNameAm: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Messaging Settings */}
        <div className="bg-white p-6 rounded-lg shadow space-y-6">
          <div className="flex items-center space-x-2 border-b pb-2">
            <MessageSquare className="h-5 w-5 text-green-600" />
            <h2 className="text-lg font-semibold">Messaging</h2>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Welcome Message (English)</label>
              <textarea
                value={settings.welcomeMessage}
                onChange={(e) => setSettings({ ...settings, welcomeMessage: e.target.value })}
                rows={2}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Welcome Message (Amharic)</label>
              <textarea
                value={settings.welcomeMessageAm}
                onChange={(e) => setSettings({ ...settings, welcomeMessageAm: e.target.value })}
                rows={2}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Security & Domains */}
        <div className="bg-white p-6 rounded-lg shadow space-y-6">
          <div className="flex items-center space-x-2 border-b pb-2">
            <Shield className="h-5 w-5 text-orange-600" />
            <h2 className="text-lg font-semibold">Security</h2>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">API Key</label>
              <div className="mt-1 flex items-center space-x-2">
                <input
                  type="text"
                  readOnly
                  value={apiKey}
                  className="block w-full rounded-md border-gray-300 bg-gray-50 text-gray-500 shadow-sm"
                />
              </div>
              <p className="mt-1 text-xs text-gray-500">Use this key to authenticate your widget requests.</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Allowed Domains</label>
              <div className="mt-1 flex space-x-2">
                <input
                  type="text"
                  placeholder="example.com"
                  value={newDomain}
                  onChange={(e) => setNewDomain(e.target.value)}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
                <button
                  onClick={addDomain}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
                >
                  Add
                </button>
              </div>
              <div className="mt-2 space-y-2">
                {settings.allowedDomains.map((domain) => (
                  <div key={domain} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                    <span className="text-sm text-gray-700">{domain}</span>
                    <button
                      onClick={() => removeDomain(domain)}
                      className="text-red-600 hover:text-red-800 text-xs"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Deployment Snippet */}
        <div className="bg-white p-6 rounded-lg shadow space-y-6">
          <div className="flex items-center space-x-2 border-b pb-2">
            <Code className="h-5 w-5 text-purple-600" />
            <h2 className="text-lg font-semibold">Deployment</h2>
          </div>

          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Copy and paste this snippet before the closing <code>&lt;/body&gt;</code> tag on your website.
            </p>
            
            <div className="relative">
              <pre className="p-4 bg-gray-900 text-gray-100 rounded-lg text-xs overflow-x-auto">
{`<script 
  src="${API_BASE_URL}/widget.js" 
  data-api-key="${apiKey}"
  type="module"
  async
></script>`}
              </pre>
              <button
                onClick={handleCopySnippet}
                className="absolute top-2 right-2 p-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded"
                title="Copy to clipboard"
              >
                {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
              </button>
            </div>

            <div className="flex items-center space-x-2 p-3 bg-blue-50 rounded-lg text-sm text-blue-700">
              <Globe className="h-5 w-5" />
              <span>Make sure to add your domain to the allowed list!</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end pt-4">
        <button
          onClick={handleSave}
          disabled={saving}
          className={`flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 transition-colors ${saving ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {saving ? (
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
          ) : (
            <Save className="h-5 w-5 mr-2" />
          )}
          Save Settings
        </button>
      </div>
    </div>
  );
};

export default WidgetSettings;
