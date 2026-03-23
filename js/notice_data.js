/* 
 This file handles the Notice Board database initialization.
 It is managed by the Management Portal.
*/
const NOTICE_INIT_SQL = `
    CREATE TABLE notices (
        id INT PRIMARY KEY,
        title STRING,
        content STRING,
        date STRING,
        category STRING
    );

    -- Initial Seed Notices
    INSERT INTO notices VALUES (1, 'Model Exam Schedule', 'The internal model exams for all departments will start from Feb 10th. Please check your department notice board for detailed timing.', '2026-01-20', 'Exam');
    INSERT INTO notices VALUES (2, 'College Cultural Fest', 'Ponjesly Fest 2026 is scheduled for March 15th. Registrations for various events are open now.', '2026-01-22', 'Event');
    INSERT INTO notices VALUES (3, 'Library Timings Update', 'The central library will remain open until 8 PM for the upcoming exam season starting next week.', '2026-01-24', 'General');
`;
