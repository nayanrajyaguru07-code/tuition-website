-- 1. USERS TABLE (Updated with 'credits' for your payment logic)
CREATE TABLE
    users (
        id SERIAL PRIMARY KEY,
        email VARCHAR NOT NULL UNIQUE,
        password TEXT,
        gr_no VARCHAR,
        credits NUMERIC DEFAULT 0, -- Added this for your wallet feature
        created_at TIMESTAMPTZ DEFAULT NOW ()
    );

-- 2. PAYMENTS TABLE (New: Required for PhonePe Integration)
CREATE TABLE
    payments (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users (id),
        merchant_txn_id VARCHAR NOT NULL UNIQUE,
        amount NUMERIC NOT NULL,
        status VARCHAR NOT NULL DEFAULT 'INIT', -- INIT, SUCCESS, FAILED
        raw_payload TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW ()
    );

-- --- EXISTING TABLES FROM YOUR DUMP ---
CREATE TABLE
    College (
        id INTEGER PRIMARY KEY,
        name VARCHAR NOT NULL,
        password VARCHAR NOT NULL,
        email VARCHAR,
        role VARCHAR,
        createdAt TIMESTAMPTZ
    );

CREATE TABLE
    classes (
        id INTEGER PRIMARY KEY,
        standard VARCHAR NOT NULL,
        division VARCHAR NOT NULL,
        created_at TIMESTAMPTZ
    );

CREATE TABLE
    daily_attendance (
        id INTEGER PRIMARY KEY,
        student_id INTEGER NOT NULL,
        class_id INTEGER NOT NULL,
        attendance_date DATE NOT NULL,
        status VARCHAR NOT NULL,
        remarks TEXT,
        created_at TIMESTAMPTZ
    );

CREATE TABLE
    events (
        id INTEGER PRIMARY KEY,
        title VARCHAR NOT NULL,
        event_date DATE NOT NULL,
        event_time TIMESTAMP NOT NULL,
        location TEXT,
        description TEXT,
        class_id INTEGER,
        created_at TIMESTAMPTZ
    );

CREATE TABLE
    exam_marks (
        id INTEGER PRIMARY KEY,
        exam_schedule_id INTEGER NOT NULL,
        student_id INTEGER NOT NULL,
        marks_obtained INTEGER,
        created_at TIMESTAMPTZ,
        updated_at TIMESTAMPTZ
    );

CREATE TABLE
    exam_schedule (
        id INTEGER PRIMARY KEY,
        exam_name VARCHAR NOT NULL,
        class_id INTEGER NOT NULL,
        subject_id INTEGER NOT NULL,
        faculty_id INTEGER NOT NULL,
        exam_date DATE NOT NULL,
        start_time TIME NOT NULL,
        total_marks INTEGER NOT NULL,
        created_at TIMESTAMPTZ
    );

CREATE TABLE
    faculty (
        id INTEGER PRIMARY KEY,
        f_name VARCHAR NOT NULL,
        l_name VARCHAR NOT NULL,
        email VARCHAR NOT NULL,
        password TEXT,
        aadhar_number VARCHAR NOT NULL,
        address TEXT,
        role TEXT,
        phone_number VARCHAR,
        created_at TIMESTAMPTZ
    );

CREATE TABLE
    faculty_attendance (
        id INTEGER PRIMARY KEY,
        faculty_id INTEGER NOT NULL,
        attendance_date DATE NOT NULL,
        status VARCHAR NOT NULL, -- Was USER-DEFINED
        clock_in_time TIME,
        clock_out_time TIME,
        remarks TEXT
    );

CREATE TABLE
    fee_payments (
        id INTEGER PRIMARY KEY,
        student_id INTEGER NOT NULL,
        amount_paid NUMERIC NOT NULL,
        payment_date DATE NOT NULL,
        payment_mode VARCHAR,
        fee_type_id INTEGER,
        created_at TIMESTAMPTZ
    );

CREATE TABLE
    fee_types (
        id INTEGER PRIMARY KEY,
        fee_name VARCHAR NOT NULL,
        class_id INTEGER NOT NULL,
        amount NUMERIC NOT NULL,
        created_at TIMESTAMPTZ,
        updated_at TIMESTAMPTZ
    );

CREATE TABLE
    holidays (
        id INTEGER PRIMARY KEY,
        name VARCHAR NOT NULL,
        start_date DATE NOT NULL,
        end_date DATE NOT NULL,
        created_at TIMESTAMPTZ,
        updated_at TIMESTAMPTZ
    );

CREATE TABLE
    periods (
        id INTEGER PRIMARY KEY,
        day VARCHAR NOT NULL, -- Was USER-DEFINED
        period_number INTEGER NOT NULL,
        start_time TIME NOT NULL,
        end_time TIME NOT NULL,
        created_at TIMESTAMPTZ
    );

CREATE TABLE
    student (
        id INTEGER PRIMARY KEY,
        gr_no VARCHAR NOT NULL,
        student_name VARCHAR NOT NULL,
        class_id INTEGER NOT NULL,
        date_of_birth DATE,
        place_of_birth VARCHAR,
        gender VARCHAR,
        blood_group VARCHAR,
        nationality VARCHAR,
        religion VARCHAR,
        community VARCHAR,
        caste_category VARCHAR,
        admission_date DATE,
        status VARCHAR,
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
        created_at TIMESTAMPTZ,
        updated_at TIMESTAMPTZ
    );

CREATE TABLE
    subjects (
        id INTEGER PRIMARY KEY,
        subject_name VARCHAR NOT NULL,
        created_at TIMESTAMPTZ
    );

CREATE TABLE
    timetable (
        id INTEGER PRIMARY KEY,
        period_id INTEGER NOT NULL,
        class_id INTEGER NOT NULL,
        subject_id INTEGER NOT NULL,
        faculty_id INTEGER NOT NULL,
        created_at TIMESTAMPTZ,
        updated_at TIMESTAMPTZ
    );