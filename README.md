# Note Rush - Modern Typing Practice App

TypeTrack is a modern typing practice application designed to help you improve your typing speed and accuracy through customizable exercises. Practice with pre-written passages on database topics, upload your own PDFs, and track your progress over time.

## ✨ Features

- **Typing Practice** - Improve speed and accuracy with targeted exercises
- **Performance Metrics** - Track WPM, accuracy, mistakes, and progress over time
- **PDF Upload** - Practice typing with content from your own PDF documents
- **Multiple Practice Categories** - Choose from database-related text or custom uploads
- **Real-time Feedback** - See mistakes and statistics as you type
- **User Accounts** - Save your progress and access from anywhere
- **Responsive Design** - Practice on any device with a keyboard
- **Subscription Tiers**:
  - **Free** - Access to basic features and up to 5 PDF uploads
  - **Pro** - Unlock premium features and up to 50 PDF uploads

## 🚀 Tech Stack

TypeTrack is built with modern web technologies:

- **Frontend**: [Next.js](https://nextjs.org), [React](https://reactjs.org), [TypeScript](https://www.typescriptlang.org)
- **Styling**: [Tailwind CSS](https://tailwindcss.com)
- **Backend**: Next.js API Routes, [tRPC](https://trpc.io) for type-safe API
- **Database**: PostgreSQL with [Prisma ORM](https://prisma.io)
- **Authentication**: Custom auth solution with secure session management
- **Payments**: [Stripe](https://stripe.com) integration for subscriptions
- **State Management**: [Zustand](https://github.com/pmndrs/zustand)
- **PDF Processing**: Custom parsing and text extraction

## 💻 Usage

1. **Create an account** or log in to start tracking your progress
2. **Choose a practice category** from the home screen
3. **Start typing** to begin the exercise
4. **View your stats** after completing each exercise
5. **Upload PDFs** to practice with your own content
6. **Track progress** over time to see your improvement

```

## 📊 Database Schema

The application uses the following main data models:

- **User** - User accounts and authentication
- **TypingEntry** - Records of typing exercises and performance
- **PDF** - Uploaded PDF documents
- **Paragraph** - Extracted text passages from PDFs
- **Subscription** - User subscription status and details

## 🚢 Deployment

The application can be deployed to any environment that supports Next.js applications:

- [Vercel](https://vercel.com) (recommended)
- [Netlify](https://netlify.com)
- [Docker](https://www.docker.com)

Follow the deployment guides in the official [T3 documentation](https://create.t3.gg/en/deployment) for detailed instructions.

## 🔒 License

[MIT](LICENSE)

## 🙏 Acknowledgements

- [T3 Stack](https://create.t3.gg/) for the project foundation
- [Prisma](https://prisma.io) for the database ORM
- [TailwindCSS](https://tailwindcss.com) for styling
- [tRPC](https://trpc.io) for type-safe APIs
