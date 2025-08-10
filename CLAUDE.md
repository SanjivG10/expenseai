# ExpenseAI Project

A React Native expense tracking application built with Expo and TailwindCSS.

## Project Structure

- **Framework**: React Native with Expo
- **Styling**: TailwindCSS + NativeWind
- **Language**: TypeScript
- **Development Tools**: ESLint, Prettier

## Development Commands

```bash
npm run dev          # Start Expo development server
```

## Key Files

- `App.tsx` - Main application entry point
- `components/` - React components
- `global.css` - Global styles
- `tailwind.config.js` - TailwindCSS configuration
- `babel.config.js` - Babel configuration for NativeWind

## Getting Started

1. Install dependencies: `npm install`
2. Start development: `npm run dev`
3. Choose platform (iOS/Android/Web) from the Expo CLI

## Notes

- Uses NativeWind for TailwindCSS in React Native
- TypeScript configured for type safety
- ESLint and Prettier for code quality

## ExpenseAI App Design & Architecture

### App Structure

- **Client**: React Native (Expo) - Mobile app for expense tracking
- **Server**: Node.js + Express + TypeScript - Backend API for AI processing
- **AI Integration**: Image processing to extract expense data from receipts

### Navigation & Screens

#### Tab Navigation (Bottom Tabs)

1. **Home/Dashboard Tab** 📊
   - Monthly expense overview
   - Quick stats (total spent, categories breakdown)
   - Recent expenses list (last 5-10 items)
   - Quick action button (+ Add Expense)

2. **Camera/Add Tab** 📷
   - Primary action: Camera interface for receipt scanning
   - Secondary actions:
     - "Take Photo" - Camera capture
     - "Choose from Gallery" - Photo picker
     - "Add Manually" - Manual entry form
     - ID, timestamp, amount, currency

- Category, description/notes
- Payment method
- Receipt image (optional)
- Location (optional)
- Manual entry form will have category (user can add new or fetch whatever they had added earlier), date and time picker, amount ,notes (optional), image (optional), location (optional), currency (US default)
  - Processing indicator while AI analyzes image

3. **Expenses Tab** 📝
   - Complete list of all expenses
   - Search and filter capabilities
   - Sort by date, amount, category
   - Swipe actions (edit, delete)
   - Category-based grouping toggle

4. **Analytics Tab** 📈
   - Monthly/weekly spending charts
   - Category breakdown (pie charts)
   - Spending trends over time
   - Budget vs actual comparisons

5. **Profile/Settings Tab** ⚙️
   - User preferences
   - Categories management
   - Export data options
   - App settings

#### Modal/Stack Screens

- **Add/Edit Expense Screen**: Detailed form for manual entry
- **Expense Detail Screen**: Full expense information with receipt image
- **Category Management Screen**: Add/edit expense categories
- **Receipt Preview Screen**: Show processed receipt with extracted data for confirmation

### Data Structure

Each expense will contain:

- ID, timestamp, amount, currency
- Category, description/notes
- Payment method
- Receipt image (optional)
- Location (optional)
- AI confidence score (for processed receipts)

### AI Workflow

1. User captures/selects receipt image
2. Image sent to backend API
3. AI processes image (OCR + data extraction)
4. Backend returns structured data
5. User reviews/confirms extracted information
6. Expense saved to database

# Preferred Library

- shadcn
- zod

### Technical Notes / Preferences

- There will be one layout file wrapped with react-native-safe-area-context. Do not use it on other pages.
- Let us use shadcn and I want black and white theme with proper animation. No other colors. Pure black and white theme.
- Always use yarn
- Use axiosInstance with base Url.
- Anything about urls, envs has to be exported from constant/urls.ts constant/envs.ts.
- router push, link, has to use the url form constant/urls.ts (NEVER hardcode the urls on component code)
- NEVER run expo / run yarn dev or yarn build. I will do it myself. Just do the tasks you are told (I will verify and will update yo later)

# Style preference

- use shadcn
- Create specific theme for tailwind and use it across
