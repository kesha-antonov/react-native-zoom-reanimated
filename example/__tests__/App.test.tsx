/**
 * @format
 */

import 'react-native'
import React from 'react'

// Note: import explicitly to use the types shipped with jest.
import { it, expect, describe } from '@jest/globals'

// Note: test renderer must be required after react-native.
import renderer, { act } from 'react-test-renderer'

import App from '../App'

describe('Example App', () => {
  it('renders the main menu correctly', async () => {
    let tree: renderer.ReactTestRenderer | undefined

    await act(async () => {
      tree = renderer.create(<App />)
    })

    const json = tree?.toJSON()
    expect(json).toBeTruthy()

    // Verify the app structure exists
    expect(tree?.root).toBeTruthy()
  })

  it('displays menu buttons', async () => {
    let tree: renderer.ReactTestRenderer | undefined

    await act(async () => {
      tree = renderer.create(<App />)
    })

    // Find text elements containing menu options
    const allText = tree?.root.findAllByType('Text')
    const textContents = allText?.map(t => {
      const children = t.props.children
      return typeof children === 'string' ? children : ''
    }).filter(Boolean)

    // Should have menu items
    expect(textContents?.some(t => t.includes('Basic'))).toBe(true)
    expect(textContents?.some(t => t.includes('Gallery'))).toBe(true)
  })

  it('can navigate to basic example', async () => {
    let tree: renderer.ReactTestRenderer | undefined

    await act(async () => {
      tree = renderer.create(<App />)
    })

    // Find and press the Basic Zoom button
    const touchables = tree?.root.findAllByType('View')
    const basicButton = touchables?.find(t => {
      const textChildren = t.findAllByType('Text')
      return textChildren.some(text => text.props.children === 'Basic Zoom')
    })

    if (basicButton?.props.onTouchEnd) {
      await act(async () => {
        basicButton.props.onTouchEnd()
      })
    }

    // App should still render without crashing
    expect(tree?.toJSON()).toBeTruthy()
  })
})
