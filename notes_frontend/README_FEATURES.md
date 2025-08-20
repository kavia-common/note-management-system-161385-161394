# Notes Frontend - Features

This React application implements:
- Sign In screen styled based on the provided Figma "Sign In" screen.
- Notes management: create, edit, delete.
- Search with debounced input.
- Responsive grid layout.
- Light/Dark theme toggle.
- LocalStorage persistence for notes and session.

How to run:
- npm install
- npm start

Notes:
- Authentication is client-side mocked for demo. Replace with real auth as needed.
- No external UI libraries; pure CSS with design tokens aligned to provided palette:
  - primary: #1976d2
  - secondary: #424242
  - accent: #ffca28
