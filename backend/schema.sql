-- ==========================================
-- 1. USER & AUTHENTICATION TABLES
-- ==========================================

CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR NOT NULL UNIQUE,
    password TEXT,
    gr_no VARCHAR,
    credits NUMERIC DEFAULT 0, -- For wallet/payment features
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table for Payment Gateway Integration (PhonePe, etc.)
CREATE TABLE payments (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    merchant_txn_id VARCHAR NOT NULL UNIQUE,
    amount NUMERIC NOT NULL,
    status VARCHAR NOT NULL DEFAULT 'INIT', -- INIT, SUCCESS, FAILED
    raw_payload TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table for Admin/College Info
CREATE TABLE "College" (
    id SERIAL PRIMARY KEY,
    name VARCHAR NOT NULL,
    password VARCHAR NOT NULL,
    email VARCHAR,
    role VARCHAR,
    createdAt TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- 2. ACADEMIC STRUCTURE TABLES
-- ==========================================

CREATE TABLE classes (
    id SERIAL PRIMARY KEY,
    standard VARCHAR NOT NULL,
    division VARCHAR NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (standard, division) -- Rule: No duplicate class names
);

CREATE TABLE subjects (
    id SERIAL PRIMARY KEY,
    subject_name VARCHAR NOT NULL UNIQUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE periods (
    id SERIAL PRIMARY KEY,
    day VARCHAR NOT NULL,
    period_number INTEGER NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (day, period_number) -- Rule: No duplicate period slots
);

CREATE TABLE holidays (
    id SERIAL PRIMARY KEY,
    name VARCHAR NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT check_date_range CHECK (end_date >= start_date)
);

-- ==========================================
-- 3. PEOPLE TABLES (Faculty & Students)
-- ==========================================

CREATE TABLE faculty (
    id SERIAL PRIMARY KEY,
    f_name VARCHAR NOT NULL,
    l_name VARCHAR NOT NULL,
    email VARCHAR NOT NULL UNIQUE,
    password TEXT,
    aadhar_number VARCHAR NOT NULL UNIQUE,
    address TEXT,
    role TEXT,
    phone_number VARCHAR,
    status VARCHAR DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive', 'Resigned')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE students (
    id SERIAL PRIMARY KEY,
    gr_no VARCHAR NOT NULL UNIQUE,
    student_name VARCHAR NOT NULL,
    class_id INTEGER NOT NULL REFERENCES classes(id), -- Rule: Student must belong to a class
    date_of_birth DATE,
    place_of_birth VARCHAR,
    gender VARCHAR,
    blood_group VARCHAR,
    nationality VARCHAR,
    religion VARCHAR,
    community VARCHAR,
    caste_category VARCHAR,
    admission_number VARCHAR, -- Legacy/Admin ID
    admission_date DATE,
    status VARCHAR DEFAULT 'Active',
    father_name VARCHAR,
    mother_name VARCHAR,
    parent_primary_phone VARCHAR,
    parent_secondary_phone VARCHAR,
    parent_email VARCHAR,
    address_line1 TEXT,
    address_line2 TEXT,
    city VARCHAR,
    state VARCHAR,
    pincode VARCHAR,
    student_photo_url TEXT,
    father_photo_url TEXT,
    mother_photo_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- 4. ATTENDANCE TABLES
-- ==========================================

CREATE TABLE daily_attendance (
    id SERIAL PRIMARY KEY,
    student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    class_id INTEGER NOT NULL REFERENCES classes(id),
    attendance_date DATE NOT NULL,
    status VARCHAR NOT NULL,
    remarks TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (student_id, attendance_date) -- Rule: One attendance record per student per day
);

CREATE TABLE faculty_attendance (
    id SERIAL PRIMARY KEY,
    faculty_id INTEGER NOT NULL REFERENCES faculty(id) ON DELETE CASCADE,
    attendance_date DATE NOT NULL,
    status VARCHAR NOT NULL,
    clock_in_time TIME,
    clock_out_time TIME,
    remarks TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (faculty_id, attendance_date) -- Rule: One record per faculty per day
);

-- ==========================================
-- 5. SCHEDULING & EVENTS & MEETINGS
-- ==========================================

CREATE TABLE timetable (
    id SERIAL PRIMARY KEY,
    period_id INTEGER NOT NULL REFERENCES periods(id),
    class_id INTEGER NOT NULL REFERENCES classes(id),
    subject_id INTEGER NOT NULL REFERENCES subjects(id),
    faculty_id INTEGER NOT NULL REFERENCES faculty(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (period_id, class_id), -- Rule: Class cannot be in two places at once
    UNIQUE (period_id, faculty_id) -- Rule: Faculty cannot teach two classes at once
);

CREATE TABLE events (
    id SERIAL PRIMARY KEY,
    title VARCHAR NOT NULL,
    class_id INTEGER REFERENCES classes(id) ON DELETE SET NULL, -- Optional class link
    event_date DATE NOT NULL,
    event_time TIME NOT NULL,
    location TEXT,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE meetings (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    meeting_date DATE NOT NULL,
    meeting_time TIME NOT NULL,
    location TEXT,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- 6. EXAM & MARKS TABLES
-- ==========================================

CREATE TABLE exam_schedule (
    id SERIAL PRIMARY KEY,
    exam_name VARCHAR NOT NULL,
    class_id INTEGER NOT NULL REFERENCES classes(id),
    subject_id INTEGER NOT NULL REFERENCES subjects(id),
    faculty_id INTEGER REFERENCES faculty(id), -- Optional invigilator/faculty assignment
    exam_date DATE NOT NULL,
    start_time TIME NOT NULL,
    total_marks INTEGER NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (exam_name, class_id, subject_id) -- Rule: No duplicate exam entries
);

CREATE TABLE exam_marks (
    id SERIAL PRIMARY KEY,
    exam_schedule_id INTEGER NOT NULL REFERENCES exam_schedule(id) ON DELETE CASCADE,
    student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    attendance_status VARCHAR(10) NOT NULL DEFAULT 'Present' CHECK (attendance_status IN ('Present', 'Absent')),
    marks_obtained INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (exam_schedule_id, student_id) -- Rule: One mark entry per student per exam
);

-- ==========================================
-- 7. FEES TABLES
-- ==========================================

CREATE TABLE fee_types (
    id SERIAL PRIMARY KEY,
    fee_name VARCHAR NOT NULL,
    class_id INTEGER NOT NULL REFERENCES classes(id),
    amount NUMERIC NOT NULL CHECK (amount >= 0),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (class_id, fee_name)
);

CREATE TABLE fee_payments (
    id SERIAL PRIMARY KEY,
    student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    amount_paid NUMERIC NOT NULL CHECK (amount_paid > 0),
    payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
    payment_mode VARCHAR,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- 8. TRANSPORT & LOGISTICS
-- ==========================================

CREATE TABLE transport (
    id SERIAL PRIMARY KEY,
    route_name VARCHAR NOT NULL,
    bus_no VARCHAR NOT NULL UNIQUE,
    driver_name VARCHAR NOT NULL,
    driver_mobile_no VARCHAR NOT NULL,
    driver_licence_no VARCHAR NOT NULL UNIQUE,
    conductor_name VARCHAR,
    conductor_mobile_no VARCHAR,
    insurance_due_date DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE transport_assignments (
    id SERIAL PRIMARY KEY,
    student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE UNIQUE, -- Rule: Student can only be on one route
    transport_id INTEGER NOT NULL REFERENCES transport(id) ON DELETE CASCADE,
    fee_amount NUMERIC NOT NULL CHECK (fee_amount >= 0),
    status VARCHAR DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- 9. LIBRARY MANAGEMENT
-- ==========================================

CREATE TABLE library_books (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    author VARCHAR(255) NOT NULL,
    isbn VARCHAR(20) UNIQUE NOT NULL,
    category VARCHAR(100),
    quantity INTEGER NOT NULL CHECK (quantity >= 0),
    available_quantity INTEGER NOT NULL CHECK (available_quantity >= 0), -- Track current stock
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT check_available_quantity CHECK (available_quantity <= quantity)
);

CREATE TABLE book_transactions (
    id SERIAL PRIMARY KEY,
    book_id INTEGER NOT NULL REFERENCES library_books(id) ON DELETE CASCADE,
    student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
    due_date DATE NOT NULL,
    actual_return_date DATE,
    status VARCHAR(20) NOT NULL DEFAULT 'Issued' CHECK (status IN ('Issued', 'Returned')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ==========================================
-- 10. INVENTORY MANAGEMENT
-- ==========================================

CREATE TABLE school_inventory (
    id SERIAL PRIMARY KEY,
    item_name VARCHAR(255) NOT NULL,
    category VARCHAR(100),
    description TEXT,
    total_quantity INTEGER NOT NULL CHECK (total_quantity >= 0),
    available_quantity INTEGER NOT NULL CHECK (available_quantity >= 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT check_inventory_available CHECK (available_quantity <= total_quantity)
);

CREATE TABLE inventory_transactions (
    id SERIAL PRIMARY KEY,
    item_id INTEGER NOT NULL REFERENCES school_inventory(id) ON DELETE CASCADE,
    faculty_id INTEGER NOT NULL REFERENCES faculty(id) ON DELETE CASCADE,
    quantity_issued INTEGER NOT NULL CHECK (quantity_issued >= 0),
    issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
    due_date DATE,
    actual_return_date DATE,
    status VARCHAR(20) NOT NULL DEFAULT 'Issued' CHECK (status IN ('Issued', 'Returned')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (item_id, faculty_id) -- Rule: Running total per faculty/item
);

-- ==========================================
-- 11. UTILITIES (Triggers)
-- ==========================================

-- Function to auto-update 'updated_at' columns
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers to relevant tables (Tables with updated_at)
CREATE TRIGGER update_holidays_updated_at BEFORE UPDATE ON holidays FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_faculty_updated_at BEFORE UPDATE ON faculty FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_students_updated_at BEFORE UPDATE ON students FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_timetable_updated_at BEFORE UPDATE ON timetable FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON events FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_meetings_updated_at BEFORE UPDATE ON meetings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_exam_schedule_updated_at BEFORE UPDATE ON exam_schedule FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_exam_marks_updated_at BEFORE UPDATE ON exam_marks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_fee_types_updated_at BEFORE UPDATE ON fee_types FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_transport_updated_at BEFORE UPDATE ON transport FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_transport_assignments_updated_at BEFORE UPDATE ON transport_assignments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_library_books_updated_at BEFORE UPDATE ON library_books FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_book_transactions_updated_at BEFORE UPDATE ON book_transactions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_school_inventory_updated_at BEFORE UPDATE ON school_inventory FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_inventory_transactions_updated_at BEFORE UPDATE ON inventory_transactions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();