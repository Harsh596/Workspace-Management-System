# WMS (Workspace Management System)

WMS is a high-end, professional productivity suite designed to consolidate your tools, resources, and thoughts into a single, cohesive workspace. It features a high-density, "Nuclear" layout with a focus on deep work and information accessibility.

## ✨ Core Functionality
- **Full-Bleed Document Engine**: 100% width, high-performance rich text editor with minimal line spacing for maximum information density.
- **Floating Vault Assistant**: A sliding "Command Center" that overlays your workspace, housing all your links, videos, and local PDFs.
- **Spatial Widget System**: Drag resources from your Vault directly into your editor to spawn resizable, draggable productivity widgets (PDF Viewers, YouTube Players, Timers, Counters).
- **Customizable Themes**: 16+ professional themes including Vercel Dark, Linear Core, and Nordic Frost.
- **Real-Time Sync**: Everything is synchronized in real-time across devices using Firebase.

## 🛠️ Tech Stack
- **Framework**: [React 19](https://react.dev/) + [Vite 8](https://vitejs.dev/)
- **Editor Engine**: [TipTap](https://tiptap.dev/) (ProseMirror)
- **Database & Storage**: [Firebase Firestore](https://firebase.google.com/docs/firestore) & [Firebase Storage](https://firebase.google.com/docs/storage)
- **Authentication**: [Firebase Auth](https://firebase.google.com/docs/auth) (Google OAuth)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Spatial UI**: [React-Rnd](https://github.com/bokuweb/react-rnd)
- **Styling**: Custom Vanilla CSS with a dynamic theme engine.

## 🚀 Installation & Setup

1. **Clone the repository**:
   ```bash
   git clone <your-repo-url>
   cd Workspace-Management-System
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure Firebase**:
   Create a `.env` file in the root directory and add your Firebase credentials:
   ```env
   VITE_FIREBASE_API_KEY=your_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   VITE_FIREBASE_APP_ID=your_app_id
   ```

4. **Run locally**:
   ```bash
   npm run dev
   ```

## 🚢 Deployment

### Vercel / Netlify (Recommended)
1. Push your code to a GitHub repository.
2. Connect your repository to [Vercel](https://vercel.com) or [Netlify](https://netlify.com).
3. Set the **Build Command** to `npm run build`.
4. Set the **Output Directory** to `dist`.
5. Add your Environment Variables in the project settings.

### Firebase Hosting
1. Install Firebase CLI: `npm install -g firebase-tools`
2. Login and initialize: `firebase login` then `firebase init`
3. Choose **Hosting** and select your project.
4. Set `public` directory to `dist`.
5. Deploy: `npm run build && firebase deploy`


There is an error for the people with inbuilt pop-up blockers, Authentication failed is shown for them. Please try to login/register from an instance without such blockers, we are currently working on it.
---

**More features to be added soon.**
