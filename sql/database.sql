CREATE TABLE users (
    id VARCHAR(255) PRIMARY KEY,
    password VARCHAR(255),
    name VARCHAR(255),
    dept VARCHAR(255),
    year VARCHAR(255),
    address TEXT,
    mobile VARCHAR(255),
    email VARCHAR(255),
    avatar TEXT
);

CREATE TABLE admins (
    username VARCHAR(255) PRIMARY KEY,
    password VARCHAR(255),
    name VARCHAR(255)
);

CREATE TABLE fees (
    id INT PRIMARY KEY,
    user_id VARCHAR(255),
    semester VARCHAR(255),
    amount INT,
    status VARCHAR(255),
    payment_date DATE
);

CREATE TABLE bus_pass (
    user_id VARCHAR(255) PRIMARY KEY,
    bus_no VARCHAR(255),
    route VARCHAR(255),
    valid_till VARCHAR(255),
    start_point VARCHAR(255)
);

-- Admin User
INSERT INTO admins VALUES ('admin', 'admin123', 'Principal');

-- Student Data per User Request (Avatar points to student_photo/NAME.jpg)
-- 961823205001 -> Abdullah
INSERT INTO users VALUES ('961823205001', 'password', 'Abdullah', 'IT', '3rd Year', 'Parvathipuram', '9447654321', 'abdullah@pjce.edu', 'student_photo/Abdullah.jpg');
INSERT INTO fees VALUES (1, '961823205001', 'Semester 5', 42000, 'Paid', '2023-12-20');
INSERT INTO fees VALUES (2, '961823205001', 'Semester 6', 42000, 'Due', NULL);
INSERT INTO bus_pass VALUES ('961823205001', '27', 'Nagercoil', 'Dec 2026', 'Vadasery');

-- 961823205002 -> Arun Kumar (CSE)
INSERT INTO users VALUES ('961823205002', 'password', 'Arun Kumar', 'CSE', '3rd Year', 'Nagercoil', '9441234567', 'arun@pjce.edu', 'assets/student_photo/Arun Kumar.jpg');
INSERT INTO fees VALUES (3, '961823205002', 'Semester 6', 45000, 'Due', NULL);
INSERT INTO bus_pass VALUES ('961823205002', '15', 'Kanyakumari', 'Dec 2026', 'Vivekananda Rock');

-- 961823205003 -> Bhavana S (AIDS)
INSERT INTO users VALUES ('961823205003', 'password', 'Bhavana S', 'AIDS', '2nd Year', 'Marthandam', '9881230987', 'bhavana@pjce.edu', 'assets/student_photo/Bhavana S.jpg');
INSERT INTO fees VALUES (4, '961823205003', 'Semester 3', 48000, 'Due', NULL);
INSERT INTO bus_pass VALUES ('961823205003', '12', 'Marthandam', 'Dec 2026', 'New Bus Stand');

-- 961823205004 -> Babu J (AIML)
INSERT INTO users VALUES ('961823205004', 'password', 'Babu J', 'AIML', '2nd Year', 'Kanyakumari', '9775566443', 'babu@pjce.edu', 'assets/student_photo/Babu J.jpg');
INSERT INTO fees VALUES (5, '961823205004', 'Semester 3', 48000, 'Paid', '2024-02-01');

-- 961823205005 -> Dinesh Raj (MECH)
INSERT INTO users VALUES ('961823205005', 'password', 'Dinesh Raj', 'MECH', '4th Year', 'Thuckalay', '9664433221', 'dinesh@pjce.edu', 'assets/student_photo/Dinesh Raj.jpg');
INSERT INTO fees VALUES (6, '961823205005', 'Semester 8', 35000, 'Due', NULL);
INSERT INTO bus_pass VALUES ('961823205005', '08', 'Thuckalay', 'Dec 2026', 'Bus Stand');

-- 961823205006 -> Eshwar M (ECE)
INSERT INTO users VALUES ('961823205006', 'password', 'Eshwar M', 'ECE', '3rd Year', 'Valliyur', '9332211445', 'eshwar@pjce.edu', 'assets/student_photo/Eshwar M.jpg');
INSERT INTO fees VALUES (7, '961823205006', 'Semester 6', 40000, 'Due', NULL);

-- 961823205007 -> Farzana A (EEE)
INSERT INTO users VALUES ('961823205007', 'password', 'Farzana A', 'EEE', '4th Year', 'Kuzhithurai', '9228877665', 'farzana@pjce.edu', 'assets/student_photo/Farzana A.jpg');
INSERT INTO fees VALUES (8, '961823205007', 'Semester 7', 38000, 'Paid', '2023-09-15');
INSERT INTO bus_pass VALUES ('961823205007', '21', 'Valliyur', 'Dec 2026', 'Naka');

-- 961823205008 -> Gokul Nath (CIVIL)
INSERT INTO users VALUES ('961823205008', 'password', 'Gokul Nath', 'CIVIL', '1st Year', 'Colachel', '9110022334', 'gokul@pjce.edu', 'assets/student_photo/Gokul Nath.jpg');
INSERT INTO fees VALUES (9, '961823205008', 'Semester 1', 30000, 'Due', NULL);

-- 961823205009 -> Harish V (CSE)
INSERT INTO users VALUES ('961823205009', 'password', 'Harish V', 'CSE', '3rd Year', 'Nagercoil', '9443332221', 'harish@pjce.edu', 'assets/student_photo/Harish V.jpg');
INSERT INTO fees VALUES (10, '961823205009', 'Semester 6', 45000, 'Due', NULL);
INSERT INTO bus_pass VALUES ('961823205009', '33', 'Colachel', 'Dec 2026', 'Main Road');

-- 961823205010 -> Indhu I (IT)
INSERT INTO users VALUES ('961823205010', 'password', 'Indhu I', 'IT', '3rd Year', 'Nagercoil', '9449998887', 'indhu@pjce.edu', 'assets/student_photo/Indhu I.jpg');
INSERT INTO fees VALUES (11, '961823205010', 'Semester 6', 42000, 'Due', NULL);
