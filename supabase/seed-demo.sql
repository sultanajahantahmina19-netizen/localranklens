-- Optional DEMO data for screenshots and walkthroughs.
-- Every row is flagged is_demo = true and named "(demo)" so it can never be
-- mistaken for real usage. Remove before listing or measuring metrics:
--   DELETE FROM public.contact_messages WHERE is_demo;
--
-- Run in the SQL editor. Replace the email with an existing account to attach
-- demo locations to it.

INSERT INTO public.contact_messages (name, email, subject, message, is_demo)
VALUES
  ('Sample Sender (demo)', 'demo@example.com', 'Question about the agency plan (demo)',
   'This is a demo message used to show the admin inbox. It is not a real enquiry.', true);

INSERT INTO public.locations (user_id, business_name, primary_category, city, country, is_demo)
SELECT id, 'Northgate Dental Practice (demo)', 'Dentist', 'Leeds', 'United Kingdom', true
FROM public.profiles WHERE email = 'you@example.com'
UNION ALL
SELECT id, 'Harbour Row Barbers (demo)', 'Barber shop', 'Bristol', 'United Kingdom', true
FROM public.profiles WHERE email = 'you@example.com';
