# SyncSphere - Task & Workspace Manager
SyncSphere is a full-stack task management web application designed for teams. It features an interactive dashboard with light/dark theme switching, multiple task viewing modes, and a resilient backend database connection system.

## ✨ Features
Dual Themes: Clean, fully styled Light Mode and Dark Mode layouts.

4 View Modes: Toggle tasks instantly between Grid view, Kanban boards, Table lists, and a Calendar timeline view.

Workspace Folders: Organize tasks into distinct custom workspace categories or partitions.

Secure Login Gate: Dedicated authentication landing screen for admin access.

Database Resiliency: Connects directly to MongoDB Cloud. If firewalls or port issues block the cloud connection, it automatically switches to a local database backup so the app never crashes.

## 🛠️ Tech Stack
Frontend: React, TypeScript, Tailwind CSS, Lucide Icons

Backend: Node.js, Express, TypeScript

Database: MongoDB (Mongoose ODM)

🔑 Demo Access Credentials
Use these credentials to pass the authentication login screen:

Emails: `` shahzaib@syncsphere.com or ahmed@syncsphere.com `` 

Password: ``admin123``

⚙️ Database Configuration (For Evaluators)
To test this project with your own cloud database, update your environment variables in the backend folder.

Create a .env file inside the backend/ directory:

Bash
``cd backend
touch .env``
Add your custom configurations into the .env file:

Code snippet
``PORT=5000
MONGO_URI=mongodb+srv://<username>:<password>@<cluster-url>/taskflow_db?retryWrites=true&w=majority``
Note: If your current network environment blocks standard remote database connections (Port 27017), the server console will output a clear warning and automatically route task storage locally to mongodb://127.0.0.1:27017/taskflow_db to maintain stability.

🚀 How to Run the App Locally
Follow these commands to spin up the full application on your machine:

1. Start the Backend Server
Bash
``cd backend
npm install
npm run dev``
2. Start the Frontend Client
Bash
# Open a new terminal tab or window
``cd frontend
npm install
npm run dev``
Once running, navigate to ``http://localhost:5173`` in your browser to view the application workspace.
