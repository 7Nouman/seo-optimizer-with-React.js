import React from 'react';
import { render, screen } from '@testing-library/react';
import App from './App';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'https://seoop.onrender.com';

test('renders learn react link', () => {
  render(<App />);
  const linkElement = screen.getByText(/learn react/i);
  expect(linkElement).toBeInTheDocument();
});
