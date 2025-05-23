# ChadJEE - JEE Planner Application

A comprehensive JEE Mains + Advanced preparation platform that empowers students with intelligent study management, interactive progress tracking, and personalized learning experiences.

## Features

- 📝 **Task Management**: Create, track, and complete study tasks
- 📊 **Progress Tracking**: Visualize your learning journey with metrics and charts
- 📅 **Study Calendar**: Plan your study sessions efficiently
- ⏱️ **Pomodoro Timer**: Built-in study timer with customizable sessions
- 📈 **Subject Progress**: Track progress across different JEE subjects
- 🎯 **Goal Setting**: Set and monitor weekly and monthly goals

## Tech Stack

- **Frontend**: React, TypeScript, TailwindCSS, Shadcn/UI
- **Backend**: Express.js, Node.js
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: Session-based with Passport.js
- **State Management**: React Query

## Getting Started

### Prerequisites

- Node.js (v18+)
- npm or yarn
- PostgreSQL database

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/chadjee.git
   cd chadjee
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   Create a `.env` file in the root directory with:
   ```
   DATABASE_URL=postgresql://username:password@localhost:5432/chadjee
   SESSION_SECRET=your-session-secret
   ```

4. Push the database schema:
   ```bash
   npm run db:push
   ```

5. Start the development server:
   ```bash
   npm run dev
   ```

The application will be available at `http://localhost:5000`.

## Development

- **Client-side code** is located in the `client/` directory
- **Server-side code** is located in the `server/` directory
- **Shared types and schema** are in `shared/` directory

## Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed instructions on deploying the application to Render.

## Acknowledgements

- [Shadcn UI](https://ui.shadcn.com/) - For the beautiful component library
- [React Query](https://tanstack.com/query) - For data fetching and caching
- [Drizzle ORM](https://orm.drizzle.team/) - For the database ORM
- [TailwindCSS](https://tailwindcss.com/) - For the utility-first CSS framework
- [Vite](https://vitejs.dev/) - For the fast development experience

## License

This project is licensed under the MIT License - see the LICENSE file for details.