# MARCAN - B2B Marketplace Frontend

A modern React + TypeScript + Tailwind CSS application for a Canadian B2B marketplace.

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- npm, yarn, or pnpm

### Installation

1. **Clone or download the project files**
2. **Install dependencies:**

   ```bash
   npm install
   ```

3. **Start the development server:**

   ```bash
   npm run dev
   ```

4. **Open your browser to:**
   ```
   http://localhost:5173
   ```

## 📁 Project Structure

```
src/
├── components/
│   ├── ui/                 # Reusable UI components
│   ├── Header.tsx          # Header with logo and auth
│   ├── Hero.tsx            # Hero section with search
│   ├── FeaturedCategories.tsx  # Categories grid
│   ├── LatestListings.tsx  # Listings section
│   ├── ProductCard.tsx     # Product card component
│   └── FiltersSidebar.tsx  # Filters sidebar
├── pages/
│   ├── Index.tsx           # Main landing page
│   └── NotFound.tsx        # 404 page
├── lib/
│   └── utils.ts            # Utility functions
└── hooks/                  # Custom React hooks
```

## 🎨 Features

- **Responsive Design**: Works on desktop, tablet, and mobile
- **Modern UI**: Clean, professional B2B marketplace design
- **Component Library**: Pre-built UI components with Radix UI
- **TypeScript**: Full type safety
- **Tailwind CSS**: Utility-first CSS framework
- **React Router**: Client-side routing

## 🛠️ Some Scripts To Run

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## 🔧 Customization

### Colors

The design uses these primary colors:

- Primary Red: `#DB1233`
- Background: `#F9F9F9`
- Text: Various shades of black and gray

### Fonts

- **Inter**: Primary font for headings and UI
- **Inria Sans**: Secondary font for subtitles

### Adding New Pages

1. Create a new component in `src/pages/`
2. Add the route in `src/App.tsx`

## 📦 Dependencies

### Core

- React 18
- TypeScript
- Vite (build tool)
- React Router

### UI & Styling

- Tailwind CSS
- Radix UI components
- Lucide React (icons)
- Framer Motion (animations)

### State & Data

- TanStack Query
- React Hook Form
- Zod (validation)

## 🌐 Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## 📄 License

This project is private and proprietary.
