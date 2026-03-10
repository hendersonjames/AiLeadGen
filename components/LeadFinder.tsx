import React, { useState } from 'react';
import { findLeads } from '../services/geminiService';
import { useGeolocation } from '../hooks/useGeolocation';
import LoadingSpinner from './common/LoadingSpinner';
import { LocationMarkerIcon, SearchIcon, MapIcon } from './common/Icons';
import type { GroundingChunk } from '../types';

declare const marked: any;

const LeadFinder: React.FC = () => {
  const [serviceType, setServiceType] = useState('plumber');
  const [location, setLocation] = useState('San Francisco, CA');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ text: string; sources: GroundingChunk[] } | null>(null);
  const { data: geoData, getLocation, loading: geoLoading, error: geoError } = useGeolocation();

  const handleUseMyLocation = () => {
    getLocation();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!serviceType || !location) {
      setError('Please fill in both service type and location.');
      return;
    }
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const userCoords = geoData?.coords;
      const response = await findLeads(serviceType, location, userCoords);
      const text = response.text;
      const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
      setResult({ text, sources });
    } catch (err) {
      setError('Failed to fetch leads. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-1 text-white">Find Local Leads</h2>
      <p className="text-content-200 mb-6">Discover potential clients in your area using real-time location data.</p>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="serviceType" className="block text-sm font-medium text-content-200 mb-1">Service Type</label>
            <input
              type="text"
              id="serviceType"
              value={serviceType}
              onChange={(e) => setServiceType(e.target.value)}
              placeholder="e.g., plumber, electrician, roofer"
              className="w-full bg-base-300 border border-base-300 text-content-100 rounded-lg p-3 focus:ring-2 focus:ring-brand-primary focus:border-brand-primary"
            />
          </div>
          <div>
            <label htmlFor="location" className="block text-sm font-medium text-content-200 mb-1">Location</label>
            <div className="flex gap-2">
              <input
                type="text"
                id="location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g., San Francisco, CA"
                className="w-full bg-base-300 border border-base-300 text-content-100 rounded-lg p-3 focus:ring-2 focus:ring-brand-primary focus:border-brand-primary"
              />
              <button
                type="button"
                onClick={handleUseMyLocation}
                disabled={geoLoading}
                className="p-3 bg-base-300 hover:bg-brand-primary/20 text-content-100 rounded-lg transition-colors flex items-center justify-center"
                title="Use my current location"
              >
                {geoLoading ? <LoadingSpinner size="w-5 h-5" /> : <LocationMarkerIcon className="w-5 h-5" />}
              </button>
            </div>
             {geoError && <p className="text-red-400 text-xs mt-1">Could not get location: {geoError.message}</p>}
             {geoData && <p className="text-green-400 text-xs mt-1">Using your current location.</p>}
          </div>
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full flex justify-center items-center gap-2 bg-brand-primary hover:bg-brand-primary/80 text-white font-bold py-3 px-4 rounded-lg transition-colors disabled:bg-base-300"
        >
          {loading ? <><LoadingSpinner /> Finding Leads...</> : <><SearchIcon className="w-5 h-5" /> Find Leads</>}
        </button>
      </form>

      {error && <p className="text-red-400 mt-4">{error}</p>}

      {result && (
        <div className="mt-8">
          <h3 className="text-xl font-bold mb-4 text-white">Generated Leads</h3>
          <div className="prose prose-invert prose-p:text-content-100 prose-headings:text-white bg-base-100 p-4 rounded-lg" dangerouslySetInnerHTML={{ __html: marked.parse(result.text) }}></div>
          
          {result.sources && result.sources.length > 0 && (
            <div className="mt-6">
              <h4 className="text-lg font-semibold mb-2 flex items-center gap-2 text-white"><MapIcon className="w-5 h-5 text-brand-secondary"/> Data Sources</h4>
              <ul className="space-y-2">
                {result.sources.map((source, index) => (
                  (source.maps && 
                    <li key={index} className="bg-base-100 p-3 rounded-lg">
                      <a href={source.maps.uri} target="_blank" rel="noopener noreferrer" className="text-brand-secondary hover:underline font-medium">
                        {source.maps.title || 'View on Google Maps'}
                      </a>
                    </li>
                  )
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default LeadFinder;
