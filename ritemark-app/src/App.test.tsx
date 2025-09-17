import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import App from './App'

describe('App', () => {
  it('renders without crashing', () => {
    render(<App />)
    expect(screen.getByRole('main')).toBeInTheDocument()
  })

  it('displays the app title', () => {
    render(<App />)
    expect(screen.getByText(/ritemark/i)).toBeInTheDocument()
  })

  it('displays description text', () => {
    render(<App />)
    expect(screen.getByText(/google drive markdown editor/i)).toBeInTheDocument()
  })
})
