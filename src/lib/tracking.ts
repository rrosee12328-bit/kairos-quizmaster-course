// Conversion tracking utilities for Meta Pixel and Google Ads

type CourseType = 'level2' | 'level3' | 'level4' | 'pepper-spray';
type PriceMap = Record<CourseType, number>;

// Use env vars with fallback to empty string
const META_PIXEL_ID = import.meta.env.VITE_META_PIXEL_ID ?? '';
const GOOGLE_ADS_ID = import.meta.env.VITE_GOOGLE_ADS_ID ?? '';
const GOOGLE_ADS_LABELS = {
  payment_completed: import.meta.env.VITE_GOOGLE_ADS_PAYMENT_LABEL ?? '',
  enrollment_started: import.meta.env.VITE_GOOGLE_ADS_ENROLLMENT_LABEL ?? '',
  course_started: import.meta.env.VITE_GOOGLE_ADS_COURSE_STARTED_LABEL ?? '',
} as const;

// Declare fbq and gtag for TypeScript
declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
    gtag?: (...args: unknown[]) => void;
    dataLayer?: unknown[];
  }
}

// Safe check for Meta Pixel availability
const hasMeta = (): boolean => {
  return typeof window !== 'undefined' && !!window.fbq && !!META_PIXEL_ID;
};

// Safe check for Google Ads availability
const hasGAds = (): boolean => {
  return typeof window !== 'undefined' && !!window.gtag && !!GOOGLE_ADS_ID;
};

// Initialize Meta Pixel
export const initMetaPixel = (): void => {
  if (!hasMeta()) return;
  
  window.fbq?.('init', META_PIXEL_ID);
  console.warn('[Tracking] Meta Pixel initialized');
};

// Initialize Google Ads
export const initGoogleAds = (): void => {
  if (!hasGAds()) return;
  
  window.gtag?.('config', GOOGLE_ADS_ID);
  console.warn('[Tracking] Google Ads initialized');
};

// Track page view
export const trackPageView = (url?: string): void => {
  const path = url || (typeof window !== 'undefined' ? window.location.pathname : '');
  
  if (hasMeta()) {
    window.fbq?.('track', 'PageView');
  }
  
  if (hasGAds()) {
    window.gtag?.('event', 'page_view', {
      page_path: path,
    });
  }
};

// Track course view (ViewContent)
export const trackViewContent = (courseType: string, coursePrice?: number): void => {
  if (hasMeta()) {
    window.fbq?.('track', 'ViewContent', {
      content_name: courseType,
      content_category: 'Security Training',
      content_type: 'product',
      value: coursePrice,
      currency: 'GBP',
    });
  }
  
  if (hasGAds()) {
    window.gtag?.('event', 'view_item', {
      items: [{
        item_id: courseType,
        item_name: courseType,
        item_category: 'Security Training',
        price: coursePrice,
      }],
    });
  }
};

// Track add to cart / enroll now click
export const trackAddToCart = (courseType: CourseType | string, coursePrice?: number): void => {
  if (hasMeta()) {
    window.fbq?.('track', 'AddToCart', {
      content_name: courseType,
      content_category: 'Security Training',
      content_type: 'product',
      value: coursePrice,
      currency: 'GBP',
    });
  }
  
  if (hasGAds()) {
    window.gtag?.('event', 'add_to_cart', {
      items: [{
        item_id: courseType,
        item_name: courseType,
        item_category: 'Security Training',
        price: coursePrice,
      }],
    });
  }
};

// Track checkout initiation
export const trackInitiateCheckout = (courseType: string, coursePrice?: number): void => {
  if (hasMeta()) {
    window.fbq?.('track', 'InitiateCheckout', {
      content_name: courseType,
      content_category: 'Security Training',
      content_type: 'product',
      value: coursePrice,
      currency: 'GBP',
    });
  }
  
  // Google Ads - Enrollment Started
  if (hasGAds() && GOOGLE_ADS_LABELS.enrollment_started) {
    window.gtag?.('event', 'conversion', {
      send_to: `${GOOGLE_ADS_ID}/${GOOGLE_ADS_LABELS.enrollment_started}`,
      value: coursePrice,
      currency: 'GBP',
      transaction_id: `${courseType}_${Date.now()}`,
    });
  }
};

// Track purchase completion
export const trackPurchase = (
  courseType: string, 
  coursePrice: number, 
  transactionId?: string, 
  userEmail?: string
): void => {
  if (hasMeta()) {
    window.fbq?.('track', 'Kairos_Enrollment_Purchase', {
      content_name: courseType,
      content_category: 'Security Training',
      content_type: 'product',
      value: coursePrice,
      currency: 'GBP',
      transaction_id: transactionId,
    });
    
    // Also track standard Purchase event
    window.fbq?.('track', 'Purchase', {
      content_name: courseType,
      content_category: 'Security Training',
      value: coursePrice,
      currency: 'GBP',
      transaction_id: transactionId,
    });
  }
  
  // Google Ads - Payment Completed
  if (hasGAds() && GOOGLE_ADS_LABELS.payment_completed) {
    window.gtag?.('event', 'conversion', {
      send_to: `${GOOGLE_ADS_ID}/${GOOGLE_ADS_LABELS.payment_completed}`,
      value: coursePrice,
      currency: 'GBP',
      transaction_id: transactionId || `${courseType}_${Date.now()}`,
    });
    
    // Enhanced conversion data
    if (userEmail) {
      window.gtag?.('set', 'user_data', {
        email: userEmail,
      });
    }
  }
};

// Track course started
export const trackCourseStarted = (courseType: string): void => {
  if (hasMeta()) {
    window.fbq?.('trackCustom', 'CourseStarted', {
      content_name: courseType,
      content_category: 'Security Training',
    });
  }
  
  // Google Ads - Course Started
  if (hasGAds() && GOOGLE_ADS_LABELS.course_started) {
    window.gtag?.('event', 'conversion', {
      send_to: `${GOOGLE_ADS_ID}/${GOOGLE_ADS_LABELS.course_started}`,
      transaction_id: `${courseType}_started_${Date.now()}`,
    });
  }
};

// Helper to get course price
export const getCoursePriceMap = (): PriceMap => ({
  'level2': 55,
  'level3': 1,
  'level4': 200,
  'pepper-spray': 50,
});

// Server-side tracking helper
export const trackServerSide = async (eventName: string, eventData: Record<string, unknown>): Promise<void> => {
  try {
    const { supabase } = await import('@/integrations/supabase/client');
    const { error } = await supabase.functions.invoke('track-conversion', {
      body: {
        eventName,
        eventData,
      },
    });
    
    if (error) {
      console.error('[Server-side Tracking] Error:', error);
    }
  } catch (error) {
    console.error('[Server-side Tracking] Failed:', error);
  }
};
