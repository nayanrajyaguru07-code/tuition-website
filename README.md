# Hostel Admin Pro
**A professional-grade Hostel & Tuition Management System designed for efficiency and scalability.**

## 🚀 Features
- **📊 Comprehensive Dashboard**: Real-time overview of hostel activities, students, and finances.
- **🎓 Student Management**: Complete student lifecycle management with document and photo uploads.
- **💰 Smart Fee Collection**: Track payments, calculate dues, and maintain detailed transaction histories.
- **👥 Staff & Salary Management**: Manage employee records, roles, and monthly payroll.
- **💸 Expense Tracking**: Categorize and monitor daily expenses to maintain financial health.
- **🛡️ Super Admin Portal**: Global administrative control for multi-hostel management and password resets.
- **📱 Modern Responsive UI**: Fully responsive sidebar layout optimized for desktop and mobile devices.
- **☁️ Cloud-Powered Storage**: Secure handling of images and documents via Cloudinary integration.

## 🛠️ Tech Stack

### Frontend
- ![Next.js](https://img.shields.io/badge/next.js-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)
- ![React](https://img.shields.io/badge/react-%2320232a.svg?style=for-the-badge&logo=react&logoColor=%2361DAFB)
- ![Tailwind CSS](https://img.shields.io/badge/tailwindcss-%2338B2AC.svg?style=for-the-badge&logo=tailwind-css&logoColor=white)

### Backend
- ![Node.js](https://img.shields.io/badge/node.js-6DA55F?style=for-the-badge&logo=node.js&logoColor=white)
- ![Express.js](https://img.shields.io/badge/express.js-%23404d59.svg?style=for-the-badge&logo=express&logoColor=%2361DAFB)
- ![Prisma](https://img.shields.io/badge/Prisma-3982CE?style=for-the-badge&logo=Prisma&logoColor=white)

### Database & Storage
- ![PostgreSQL](https://img.shields.io/badge/postgresql-%23316192.svg?style=for-the-badge&logo=postgresql&logoColor=white)
- ![Cloudinary](https://img.shields.io/badge/Cloudinary-3448C5?style=for-the-badge&logo=Cloudinary&logoColor=white)

## Folder Structure
```text
├── frontend/                # Next.js Frontend Application
│   ├── public/              # Static assets (images, icons)
│   ├── src/
│   │   ├── app/             # App router pages and layouts
│   │   ├── components/      # Reusable UI components
│   │   ├── lib/             # API configuration and utilities
│   │   └── pages/           # Page-level components
│   └── .env                 # Frontend environment variables
├── server/                  # Node.js Express Backend
│   ├── prisma/              # Prisma schema and migrations
│   ├── src/
│   │   ├── controllers/     # Request handlers
│   │   ├── middleware/      # Auth and error handling middleware
│   │   ├── routes/          # API route definitions
│   │   ├── services/        # Business logic
│   │   └── utils/           # Helper functions (JWT, Hash, etc.)
│   ├── app.js               # Express application setup
│   ├── index.js             # Server entry point
│   └── .env                 # Backend environment variables
└── package.json             # Root-level configuration (if applicable)
```

## Environment Variables (.env example)

### Frontend (`frontend/.env`)
```env
NEXT_PUBLIC_API_URL=http://localhost:4000  # URL of the backend server
```

### Backend (`server/.env`)
```env
PORT=4000                                 # Server listening port
DATABASE_URL=postgresql://...             # PostgreSQL connection string
FRONTEND_URL=http://localhost:3000        # URL of the frontend application
JWT_SECRET=your_jwt_secret                # Secret key for signing tokens
CLOUDINARY_CLOUD_NAME=your_cloud_name     # Cloudinary cloud identifier
CLOUDINARY_API_KEY=your_api_key           # Cloudinary API access key
CLOUDINARY_API_SECRET=your_api_secret     # Cloudinary API secret
ADMIN_EMAIL=admin@tuition.com             # Super Admin login email
ADMIN_PASSWORD=your_admin_password        # Super Admin login password
ADMIN_SECRET=your_admin_secret           # Super Admin secondary secret key
```

## Installation & Setup

1. **Clone the repository**:
   ```bash
   git clone https://github.com/your-username/hostel-admin-pro.git
   cd hostel-admin-pro
   ```

2. **Setup Backend**:
   ```bash
   cd server
   npm install
   # Configure .env file
   npx prisma generate
   npx prisma db push
   npm run dev
   ```

3. **Setup Frontend**:
   ```bash
   cd ../frontend
   npm install
   # Configure .env file
   npm run dev
   ```

## API Endpoints

### Authentication
- `POST /api/auth/signup` - Register a new hostel admin
- `POST /api/auth/login` - Login as hostel or super admin
- `PUT /api/auth/admin-reset-password` - Super admin restricted password reset

### Fee Collection
- `GET /api/fee-collection/fee-history` - Fetch all fee records
- `GET /api/fee-collection/student-fee-history/:id` - Get fee history for a student
- `POST /api/fee-collection/collect-fee` - Record a new payment

### Students
- `GET /api/student/all-students` - List all registered students
- `POST /api/student/add-student` - Register a new student with document uploads

## Usage
1. Login with your Admin credentials.
2. Use the Sidebar to navigate between Students, Staff, and Fee sections.
3. On Mobile, use the menu toggle to access navigation.
4. Manage payments and expenses directly from the dashboard actions.

## Screenshots
*[Add screenshots of your dashboard and mobile view here]*

## Contributing
1. Fork the Project.
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`).
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`).
4. Push to the Branch (`git push origin feature/AmazingFeature`).
5. Open a Pull Request.

## License
Distributed under the MIT License. See `LICENSE` for more information.
