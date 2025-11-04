// Conversion tracking utilities for Meta Pixel and Google Ads

// Meta Pixel ID - Replace with your actual Pixel ID
const META_PIXEL_ID = 'YOUR_META_PIXEL_ID';

// Google Ads IDs - Replace with your actual IDs
const GOOGLE_ADS_ID = 'AW-XXXXXXXXXX';
const GOOGLE_ADS_LABELS = {
  payment_completed: 'YOUR_PAYMENT_LABEL',
  enrollment_started: 'YOUR_ENROLLMENT_LABEL',
  course_started: 'YOUR_COURSE_STARTED_LABEL',
};

// Declare fbq for TypeScript
declare global {
  interface Window {
    fbq: any;
    gtag: any;
    dataLayer: any;
  }
}

// Initialize Meta Pixel
export const initMetaPixel = () => {
  if (typeof window === 'undefined' || !META_PIXEL_ID || META_PIXEL_ID === 'YOUR_META_PIXEL_ID') return;
  
  if (!window.fbq) {
    console.warn('Meta Pixel not loaded');
    return;
  }
  
  window.fbq('init', META_PIXEL_ID);
  console.log('[Tracking] Meta Pixel initialized');
};

// Initialize Google Ads
export const initGoogleAds = () => {
  if (typeof window === 'undefined' || !GOOGLE_ADS_ID || GOOGLE_ADS_ID === 'AW-XXXXXXXXXX') return;
  
  if (!window.gtag) {
    console.warn('Google Ads tag not loaded');
    return;
  }
  
  window.gtag('config', GOOGLE_ADS_ID);
  console.log('[Tracking] Google Ads initialized');
};

// Track page view
export const trackPageView = (url?: string) => {
  console.log('[Tracking] PageView:', url || window.location.pathname);
  
  // Meta Pixel
  if (window.fbq) {
    window.fbq('track', 'PageView');
  }
  
  // Google Ads
  if (window.gtag) {
    window.gtag('event', 'page_view', {
      page_path: url || window.location.pathname,
    });
  }
};

// Track course view (ViewContent)
export const trackViewContent = (courseType: string, coursePrice?: number) => {
  console.log('[Tracking] ViewContent:', courseType);
  
  // Meta Pixel
  if (window.fbq) {
    window.fbq('track', 'ViewContent', {
      content_name: courseType,
      content_category: 'Security Training',
      content_type: 'product',
      value: coursePrice,
      currency: 'GBP',
    });
  }
  
  // Google Ads
  if (window.gtag) {
    window.gtag('event', 'view_item', {
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
export const trackAddToCart = (courseType: string, coursePrice?: number) => {
  console.log('[Tracking] AddToCart:', courseType);
  
  // Meta Pixel
  if (window.fbq) {
    window.fbq('track', 'AddToCart', {
      content_name: courseType,
      content_category: 'Security Training',
      content_type: 'product',
      value: coursePrice,
      currency: 'GBP',
    });
  }
  
  // Google Ads
  if (window.gtag) {
    window.gtag('event', 'add_to_cart', {
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
export const trackInitiateCheckout = (courseType: string, coursePrice?: number) => {
  console.log('[Tracking] InitiateCheckout:', courseType);
  
  // Meta Pixel
  if (window.fbq) {
    window.fbq('track', 'InitiateCheckout', {
      content_name: courseType,
      content_category: 'Security Training',
      content_type: 'product',
      value: coursePrice,
      currency: 'GBP',
    });
  }
  
  // Google Ads - Enrollment Started
  if (window.gtag && GOOGLE_ADS_LABELS.enrollment_started !== 'YOUR_ENROLLMENT_LABEL') {
    window.gtag('event', 'conversion', {
      send_to: `${GOOGLE_ADS_ID}/${GOOGLE_ADS_LABELS.enrollment_started}`,
      value: coursePrice,
      currency: 'GBP',
      transaction_id: `${courseType}_${Date.now()}`,
    });
  }
};

// Track purchase completion
export const trackPurchase = (courseType: string, coursePrice: number, transactionId?: string, userEmail?: string) => {
  console.log('[Tracking] Purchase:', courseType, coursePrice);
  
  // Meta Pixel - Custom event name
  if (window.fbq) {
    window.fbq('track', 'Kairos_Enrollment_Purchase', {
      content_name: courseType,
      content_category: 'Security Training',
      content_type: 'product',
      value: coursePrice,
      currency: 'GBP',
      transaction_id: transactionId,
    });
    
    // Also track standard Purchase event
    window.fbq('track', 'Purchase', {
      content_name: courseType,
      content_category: 'Security Training',
      value: coursePrice,
      currency: 'GBP',
      transaction_id: transactionId,
    });
  }
  
  // Google Ads - Payment Completed
  if (window.gtag && GOOGLE_ADS_LABELS.payment_completed !== 'YOUR_PAYMENT_LABEL') {
    window.gtag('event', 'conversion', {
      send_to: `${GOOGLE_ADS_ID}/${GOOGLE_ADS_LABELS.payment_completed}`,
      value: coursePrice,
      currency: 'GBP',
      transaction_id: transactionId || `${courseType}_${Date.now()}`,
    });
    
    // Enhanced conversion data
    if (userEmail) {
      window.gtag('set', 'user_data', {
        email: userEmail,
      });
    }
  }
};

// Track course started
export const trackCourseStarted = (courseType: string) => {
  console.log('[Tracking] Course Started:', courseType);
  
  // Meta Pixel
  if (window.fbq) {
    window.fbq('trackCustom', 'CourseStarted', {
      content_name: courseType,
      content_category: 'Security Training',
    });
  }
  
  // Google Ads - Course Started
  if (window.gtag && GOOGLE_ADS_LABELS.course_started !== 'YOUR_COURSE_STARTED_LABEL') {
    window.gtag('event', 'conversion', {
      send_to: `${GOOGLE_ADS_ID}/${GOOGLE_ADS_LABELS.course_started}`,
      transaction_id: `${courseType}_started_${Date.now()}`,
    });
  }
};

// Helper to get course price
export const getCoursePriceMap = (): Record<string, number> => ({
  'level2': 199,
  'level3': 299,
  'level4': 399,
  'pepper-spray': 99,
});

// Server-side tracking helper
export const trackServerSide = async (eventName: string, eventData: any) => {
  try {
    const { supabase } = await import('@/integrations/supabase/client');
    const { data, error } = await supabase.functions.invoke('track-conversion', {
      body: {
        eventName,
        eventData,
      },
    });
    
    if (error) {
      console.error('[Server-side Tracking] Error:', error);
    } else {
      console.log('[Server-side Tracking] Success:', data);
    }
  } catch (error) {
    console.error('[Server-side Tracking] Failed:', error);
  }
};
