-- Update Section Labels Migration
-- Updates section codes and names to match stadium layout

-- Update section labels to match stadium configuration
UPDATE sections SET name = 'Pit GA', section_code = 'Pit GA' WHERE section_code = 'GA1';
UPDATE sections SET name = 'Seating GA', section_code = 'Seating GA' WHERE section_code = 'GA2';

-- Update Center sections to Middle sections
UPDATE sections SET name = 'Middle Left', section_code = 'ML' WHERE section_code = 'L';
UPDATE sections SET name = 'Middle Left Center', section_code = 'MLC' WHERE section_code = 'CL';
UPDATE sections SET name = 'Middle Right Center', section_code = 'MRC' WHERE section_code = 'CR';
UPDATE sections SET name = 'Middle Right', section_code = 'MR' WHERE section_code = 'R';

-- Update Back Center sections to Back X Center format
UPDATE sections SET name = 'Back Left Center', section_code = 'BLC' WHERE section_code = 'BCL';
UPDATE sections SET name = 'Back Right Center', section_code = 'BRC' WHERE section_code = 'BCR';

-- Verify the updates
SELECT section_code, name, category, price
FROM sections
ORDER BY
  CASE section_code
    WHEN 'Pit GA' THEN 1
    WHEN 'FC' THEN 2
    WHEN 'FR' THEN 3
    WHEN 'FL' THEN 4
    WHEN 'MR' THEN 5
    WHEN 'MRC' THEN 6
    WHEN 'MLC' THEN 7
    WHEN 'ML' THEN 8
    WHEN 'BR' THEN 9
    WHEN 'BRC' THEN 10
    WHEN 'BLC' THEN 11
    WHEN 'BL' THEN 12
    WHEN 'Seating GA' THEN 13
    WHEN 'SRO' THEN 14
    ELSE 99
  END;
