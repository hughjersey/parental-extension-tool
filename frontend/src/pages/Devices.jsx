import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { devices, activationCodes } from '../services/api';

export default function Devices() {
  const [deviceList, setDeviceList] = useState([]);
  const [codes, setCodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCodeModal, setShowCodeModal] = useState(false);
  const [newCode, setNewCode] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [devicesRes, codesRes] = await Promise.all([
        devices.list(),
        activationCodes.list()
      ]);
      setDeviceList(devicesRes.data.devices);
      setCodes(codesRes.data.activation_codes);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateCode = async () => {
    try {
      const response = await activationCodes.generate(24);
      setNewCode(response.data.activation_code);
      setShowCodeModal(true);
      fetchData();
    } catch (error) {
      console.error('Failed to generate code:', error);
      alert('Failed to generate activation code');
    }
  };

  const handleDeleteDevice = async (id) => {
    if (!confirm('Are you sure you want to deactivate this device?')) return;
    try {
      await devices.delete(id);
      fetchData();
    } catch (error) {
      console.error('Failed to delete device:', error);
      alert('Failed to deactivate device');
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    alert('Code copied to clipboard!');
  };

  if (loading) {
    return (
      <Layout>
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="px-4 py-6">
        <div className="sm:flex sm:items-center sm:justify-between mb-6">
          <h1 className="text-2xl font-semibold text-gray-900">Devices</h1>
          <button
            onClick={handleGenerateCode}
            className="mt-3 sm:mt-0 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
          >
            Generate Activation Code
          </button>
        </div>

        {/* Active Devices */}
        <div className="bg-white shadow overflow-hidden sm:rounded-md mb-8">
          <div className="px-4 py-5 sm:px-6 bg-gray-50">
            <h3 className="text-lg leading-6 font-medium text-gray-900">Active Devices</h3>
          </div>
          <ul className="divide-y divide-gray-200">
            {deviceList.filter(d => d.is_active).length > 0 ? (
              deviceList.filter(d => d.is_active).map((device) => (
                <li key={device.id} className="px-4 py-4 sm:px-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{device.name}</p>
                      <p className="text-sm text-gray-500">{device.browser_type} - {device.os}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        Last seen: {device.last_seen_at ? new Date(device.last_seen_at).toLocaleString() : 'Never'}
                      </p>
                      <p className="text-xs text-gray-400">Watch events: {device.watch_events_count || 0}</p>
                    </div>
                    <button
                      onClick={() => handleDeleteDevice(device.id)}
                      className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-red-700 bg-red-100 hover:bg-red-200"
                    >
                      Deactivate
                    </button>
                  </div>
                </li>
              ))
            ) : (
              <li className="px-4 py-4 sm:px-6 text-center text-gray-500">No active devices</li>
            )}
          </ul>
        </div>

        {/* Activation Codes */}
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <div className="px-4 py-5 sm:px-6 bg-gray-50">
            <h3 className="text-lg leading-6 font-medium text-gray-900">Activation Codes</h3>
          </div>
          <ul className="divide-y divide-gray-200">
            {codes.length > 0 ? (
              codes.map((code) => (
                <li key={code.id} className="px-4 py-4 sm:px-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-mono font-medium text-gray-900">{code.code}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        Expires: {new Date(code.expires_at).toLocaleString()}
                      </p>
                      {code.device && <p className="text-xs text-gray-500">Used by: {code.device.name}</p>}
                    </div>
                    <div className="flex space-x-2">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        code.is_valid ? 'bg-green-100 text-green-800' :
                        code.is_used ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {code.is_valid ? 'Valid' : code.is_used ? 'Used' : 'Expired'}
                      </span>
                      <button
                        onClick={() => copyToClipboard(code.code)}
                        className="text-indigo-600 hover:text-indigo-900 text-xs font-medium"
                      >
                        Copy
                      </button>
                    </div>
                  </div>
                </li>
              ))
            ) : (
              <li className="px-4 py-4 sm:px-6 text-center text-gray-500">No activation codes</li>
            )}
          </ul>
        </div>

        {/* New Code Modal */}
        {showCodeModal && newCode && (
          <div className="fixed z-10 inset-0 overflow-y-auto">
            <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
              <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setShowCodeModal(false)}></div>
              <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
                <div>
                  <div className="mt-3 text-center sm:mt-5">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">Activation Code Generated</h3>
                    <div className="mt-4">
                      <p className="text-3xl font-mono font-bold text-indigo-600">{newCode.code}</p>
                      <p className="text-sm text-gray-500 mt-2">Expires in 24 hours</p>
                      <p className="text-xs text-gray-400 mt-4">Enter this code in your browser extension to activate it.</p>
                    </div>
                  </div>
                </div>
                <div className="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3">
                  <button
                    onClick={() => copyToClipboard(newCode.code)}
                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 sm:text-sm"
                  >
                    Copy Code
                  </button>
                  <button
                    onClick={() => setShowCodeModal(false)}
                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 sm:mt-0 sm:text-sm"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
