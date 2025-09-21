-- Convert hardcoded testimonials to database records
INSERT INTO testimonials (name, title, company, content, rating, avatar, is_featured, is_active, created_at, updated_at)
VALUES 
  ('Kenyatta University Teaching, Referral & Research Hospital', '', 'Healthcare Institution', 'We are impressed with your Technical team.', 5, '/placeholder.svg', true, true, NOW(), NOW()),
  ('University of Nairobi', '', 'Educational Institution', 'Our experience with Nolads Engineering is amazing. Their work dedication is unmatched. Keep up the good work.', 5, NULL, true, true, NOW(), NOW()),
  ('Agriculture & Food Authority', 'CEO and Marketing', 'Government Agency', 'It''s really wonderful. Nolads Engineering - Generator Maintenance Team service has completely surpassed our expectations.', 5, NULL, true, true, NOW(), NOW()),
  ('Co-operative Bank', '', 'Financial Institution', 'We take pleasure in having chosen you for the Generator Supply and Installation works at our Ukunda Branch. Your dedication speaks for itself.', 5, NULL, true, true, NOW(), NOW()),
  ('Kenyatta University', '', 'Educational Institution', 'We have no regrets! It fits our needs perfectly. Thanks for the great service. Nolads Engineering services are both attractive and highly adaptable.', 5, NULL, true, true, NOW(), NOW()),
  ('Kenya Railways', '', 'Transportation Authority', 'Your Services are excellent. I would also like to say thank you to all your staff. It really saves me time and effort, your turnaround response to emergency call-outs is very good.', 5, NULL, true, true, NOW(), NOW());
