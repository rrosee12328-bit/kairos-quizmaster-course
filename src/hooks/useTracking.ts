import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { trackPageView, initMetaPixel, initGoogleAds } from '@/lib/tracking';

// Hook to initialize tracking and track page views
export const useTracking = () => {
  const location = useLocation();

  useEffect(() => {
    // Initialize tracking pixels on mount
    initMetaPixel();
    initGoogleAds();
  }, []);

  useEffect(() => {
    // Track page view on route change
    trackPageView(location.pathname);
  }, [location.pathname]);
};
