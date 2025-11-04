# Conversion Tracking Setup Guide

## Overview
Your Kairos Security Academy site now has comprehensive conversion tracking integrated for both Meta (Facebook/Instagram) and Google Ads. This guide will help you complete the setup.

## 🔧 Required Configuration

### 1. Meta Pixel Setup

#### Update Tracking IDs
Edit `src/lib/tracking.ts` and replace the placeholder:
```typescript
const META_PIXEL_ID = 'YOUR_META_PIXEL_ID';  // Replace with your actual Pixel ID
```

#### Update HTML Script
Edit `index.html` line 36 and replace:
```html
<script async src="https://www.googletagmanager.com/gtag/js?id=AW-XXXXXXXXXX"></script>
```
With your actual Google Ads ID.

### 2. Google Ads Setup

#### Update Tracking IDs
Edit `src/lib/tracking.ts` and replace:
```typescript
const GOOGLE_ADS_ID = 'AW-XXXXXXXXXX';  // Your Google Ads ID
const GOOGLE_ADS_LABELS = {
  payment_completed: 'YOUR_PAYMENT_LABEL',
  enrollment_started: 'YOUR_ENROLLMENT_LABEL',
  course_started: 'YOUR_COURSE_STARTED_LABEL',
};
```

## 📊 Tracked Events

### Client-Side Tracking (Automatic)

| Event | Trigger | Meta Event | Google Event |
|-------|---------|------------|--------------|
| **PageView** | All page loads | PageView | page_view |
| **ViewContent** | Course detail page | ViewContent | view_item |
| **AddToCart** | Click "Enroll Now" | AddToCart | add_to_cart |
| **InitiateCheckout** | Reach payment form | InitiateCheckout | conversion (enrollment_started) |
| **Purchase** | Payment completed | Kairos_Enrollment_Purchase | conversion (payment_completed) |
| **CourseStarted** | User starts course | CourseStarted (custom) | conversion (course_started) |

### Tracked URLs
- ✅ Home page (`/`)
- ✅ Course pages (`/checkout/:courseType`)
- ✅ Checkout page (when payment initiated)
- ✅ Course training pages (Level 2, 3, 4, Pepper Spray)

## 🚀 Server-Side Tracking (Optional - Enhanced Accuracy)

We've created a `track-conversion` edge function for server-side tracking using Meta Conversions API and Google Enhanced Conversions.

### Required Secrets
Add these secrets to your Supabase project:

1. **META_CONVERSION_API_TOKEN** - Your Meta Conversions API access token
2. **META_PIXEL_ID** - Same as client-side
3. **GOOGLE_ADS_ID** - Your Google Ads account ID
4. **GOOGLE_ADS_CONVERSION_ID** - Your conversion action ID

### How to Get Meta Conversions API Token:
1. Go to Meta Events Manager
2. Select your Pixel
3. Settings → Conversions API → Generate Access Token
4. Copy the token and add it as a secret

### How to Get Google Conversion IDs:
1. Go to Google Ads → Tools & Settings → Conversions
2. Create conversion actions for:
   - Payment Completed
   - Enrollment Started
   - Course Started
3. Copy the conversion IDs (format: `AW-XXXXX/AbCdEfG`)

## ✅ Verification Steps

### Meta Pixel Verification
1. Install [Meta Pixel Helper](https://chrome.google.com/webstore/detail/meta-pixel-helper) Chrome extension
2. Visit your site and navigate through:
   - Home page → Should show PageView
   - Course detail page → Should show ViewContent
   - Click Enroll → Should show AddToCart
   - Checkout page → Should show InitiateCheckout
3. Use [Meta Test Events](https://business.facebook.com/events_manager) tool
4. Check for any duplicate firing or errors

### Google Ads Verification
1. Install [Google Tag Assistant](https://tagassistant.google.com/)
2. Navigate through the same flow as above
3. In Google Ads, go to Tools & Settings → Conversions
4. Check that conversions show as "Verified"
5. Wait 24-48 hours for conversion data to appear

## 📝 Event Naming Conventions

As requested, we've implemented custom event names:
- **Meta Purchase Event**: `Kairos_Enrollment_Purchase`
- **Google Payment Conversion**: Uses your `payment_completed` label → `Kairos_Payment_Completed`
- **Google Course Started**: Uses your `course_started` label → `Kairos_Course_Started`

## 🔍 Testing & Debugging

### Console Logging
All tracking events are logged to the browser console with `[Tracking]` prefix. Open DevTools → Console to see:
```
[Tracking] PageView: /
[Tracking] ViewContent: level2
[Tracking] AddToCart: level2
[Tracking] InitiateCheckout: level2
[Tracking] Purchase: level2 199
```

### Common Issues

**Pixel not firing:**
- Check browser console for errors
- Verify IDs are correctly replaced (no `YOUR_` placeholders)
- Ensure ad blockers are disabled during testing

**Duplicate events:**
- This should not happen with our implementation
- If you see duplicates, check for other tracking scripts

**Conversions not showing in Google Ads:**
- Allow 24-48 hours for data to appear
- Verify conversion labels match exactly
- Check that Google Ads account is linked correctly

## 📞 Support

If you need help:
1. Check browser console for `[Tracking]` logs
2. Use Meta Pixel Helper and Google Tag Assistant
3. Verify all placeholder IDs have been replaced
4. Ensure secrets are set in Supabase for server-side tracking

## 🎯 Next Steps

1. Replace all placeholder IDs in:
   - `src/lib/tracking.ts`
   - `index.html`
2. Add Supabase secrets for server-side tracking (optional but recommended)
3. Test with Meta Pixel Helper and Google Tag Assistant
4. Verify conversions in Meta Events Manager and Google Ads
5. Start running your ad campaigns!

---

**Important:** Make sure to update your Privacy Policy to disclose the use of Meta Pixel and Google Ads tracking pixels, as required by GDPR and other privacy regulations.
