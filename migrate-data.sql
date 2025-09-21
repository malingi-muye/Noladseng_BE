INSERT INTO public.company_info (name, tagline, website, vision, mission, certifications) 
VALUES (
  'Nolads Engineering',
  'A Pinnacle Of Engineering Excellence',
  'https://noladsengineering.com',
  'To be the leading provider of innovative electrical engineering solutions across Africa',
  'Delivering world-class engineering services that power industrial growth and innovation',
  ARRAY[
    'ISO 9001:2015',
    'ISO 14001:2015',
    'OHSAS 18001:2007',
    'IEEE Certified'
  ]
);

INSERT INTO public.company_stats (established, incorporated, cities_covered, workforce, client_base, completed_projects)
VALUES (
  1998,
  2003,
  '10+',
  '500+',
  '100+',
  '1000+'
);

INSERT INTO public.company_offices (name, address, po_box, phone, email)
VALUES 
  ('Main Office - Nairobi', 'Enterprise Road, Industrial Area', 'P.O. Box 12345-00100', ARRAY['+254 20 123 4567'], 'info@noladsengineering.com'),
  ('Nairobi Branch', NULL, NULL, ARRAY['+254 20 123 4567'], 'nairobi@noladsengineering.com'),
  ('Genparts Division', NULL, NULL, ARRAY['+254 20 123 4568'], 'genparts@noladsengineering.com'),
  ('Western Region', NULL, NULL, ARRAY['+254 20 123 4569'], 'western@noladsengineering.com');

INSERT INTO public.company_personnel (title, phone)
VALUES 
  ('General Manager', ARRAY['+254 20 123 4567']),
  ('Financial Controller', ARRAY['+254 20 123 4567']),
  ('Technical Director', ARRAY['+254 20 123 4567']);

INSERT INTO public.company_registration (incorporation_certificate, vat_registration, pin_certificate, tax_compliance, etr_serial)
VALUES (
  'C.123456',
  'VAT123456789',
  'P123456789X',
  'TC-2024-001',
  'ETR-001-2024'
);
