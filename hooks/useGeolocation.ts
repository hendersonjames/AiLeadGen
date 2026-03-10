import { useState, useCallback } from 'react';

interface GeolocationState {
  loading: boolean;
  error: GeolocationPositionError | null;
  data: GeolocationPosition | null;
}

export const useGeolocation = () => {
  const [state, setState] = useState<GeolocationState>({
    loading: false,
    error: null,
    data: null,
  });

  const getLocation = useCallback(() => {
    if (!navigator.geolocation) {
      console.error("Geolocation is not supported by this browser.");
      return;
    }

    setState({ loading: true, error: null, data: null });

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setState({ loading: false, error: null, data: position });
      },
      (error) => {
        setState({ loading: false, error, data: null });
      }
    );
  }, []);

  return { ...state, getLocation };
};
