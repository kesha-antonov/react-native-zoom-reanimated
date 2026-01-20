/**
 * @format
 */

import React from 'react'
import { it, expect, describe } from '@jest/globals'
import { render, screen, fireEvent } from '@testing-library/react-native'

import App from '../App'

describe('Example App', () => {
  it('renders the main menu correctly', () => {
    render(<App />)

    // Verify the app renders
    expect(screen.root).toBeTruthy()
  })

  it('displays menu buttons', () => {
    render(<App />)

    // Should have menu items
    expect(screen.getByText('Basic Example')).toBeTruthy()
    expect(screen.getByText('Gallery Example')).toBeTruthy()
  })

  it('can navigate to basic example', () => {
    render(<App />)

    // Find and press the Basic Example button
    const basicButton = screen.getByText('Basic Example')
    fireEvent.press(basicButton)

    // App should still render without crashing
    expect(screen.root).toBeTruthy()
  })
})
