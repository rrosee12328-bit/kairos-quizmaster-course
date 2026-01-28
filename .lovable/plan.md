

# Send Notification Email to Darrin Mullen

## Overview

Create a simple edge function to send a personalized email to Darrin Mullen (`Darrinmullen82@icloud.com`) informing him that his Level 3 exam is now accessible.

## Email Content

**To:** Darrinmullen82@icloud.com  
**Subject:** Your Level 3 Exam is Now Ready - Kairos Security Academy

**Message will include:**
- Confirmation that his Level 2 prerequisite has been verified
- His Level 3 exam is now unlocked and ready to take
- Step-by-step instructions:
  1. Go to https://www.kairossecurityacademy.com/auth
  2. Sign in with email: Darrinmullen82@icloud.com
  3. Navigate to the Level 3 Course
  4. Click "Start Exam" to begin
- Passing score requirement: 70%
- Support contact information

## Implementation

**New Edge Function:**
`supabase/functions/send-custom-notification/index.ts`

This function will:
1. Accept recipient email, subject, and HTML content
2. Validate inputs using Zod
3. Send via Resend API (already configured in project)
4. Return success/error response

**Config Update:**
Add entry to `supabase/config.toml` with `verify_jwt = false`

## Execution

After creating the function:
1. Deploy the edge function
2. Call it with Darrin's email and the notification content
3. Confirm delivery

---

## Technical Details

| Component | Value |
|-----------|-------|
| Recipient | Darrinmullen82@icloud.com |
| From | Kairos Security Academy info@kairossecurityacademy.com |
| API | Resend (RESEND_API_KEY already configured) |
| Template | Professional HTML matching existing academy emails |

