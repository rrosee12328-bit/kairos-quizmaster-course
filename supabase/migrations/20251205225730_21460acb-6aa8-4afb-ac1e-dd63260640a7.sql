-- Fix Tatiyana's enrollment record which was entered with wrong name "Stephen Taylor"
UPDATE enrollments 
SET first_name = 'Tatiyana', last_name = 'Taylor', updated_at = now()
WHERE id = '5912590c-830c-4c8f-b093-0b9f919bbf40'
AND email = 'tatiyana1taylor@gmail.com';