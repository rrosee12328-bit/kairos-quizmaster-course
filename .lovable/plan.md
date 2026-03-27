

## Problem

All four course pages (Level 2, Level 3, Level 4, Pepper Spray) have a **race condition** in their access check. `checkAdminStatus` and `checkEnrollmentStatus` are called simultaneously, but `checkEnrollmentStatus` reads `isAdmin` from React state -- which hasn't updated yet because `checkAdminStatus` is still in-flight. So admins get denied access and redirected.

Additionally, the **Courses page** redirects non-enrolled users to `/checkout/:courseType` instead of letting admins go directly to the course.

## Plan

### 1. Fix race condition in all four course pages

In each course page (`Level2Course`, `Level3Course`, `Level4Course`, `PepperSprayCourse`):

- Modify `checkEnrollmentStatus` to accept an `isAdminUser` parameter instead of reading from state
- In the `useEffect`, `await` the admin check first, then pass the result to `checkEnrollmentStatus`

```
// Before (broken):
checkAdminStatus(user.id);
checkEnrollmentStatus(user.id);

// After (fixed):
const adminStatus = await checkAdminStatus(user.id);
checkEnrollmentStatus(user.id, adminStatus);
```

- `checkAdminStatus` will return a boolean
- `checkEnrollmentStatus` will use the passed boolean instead of the stale `isAdmin` state

### 2. Update Courses page for admin bypass

On the Courses page, when an admin clicks a course card they don't own, navigate directly to the course route instead of the checkout page.

Change the card's `onClick`:
```
onClick={() => (enrolled || isAdmin) ? navigate(course.route) : navigate(`/checkout/${course.id}`)}
```

Also update the detailed course cards' buttons similarly.

### Files modified
- `src/pages/Level2Course.tsx`
- `src/pages/Level3Course.tsx`
- `src/pages/Level4Course.tsx`
- `src/pages/PepperSprayCourse.tsx`
- `src/pages/Courses.tsx`

