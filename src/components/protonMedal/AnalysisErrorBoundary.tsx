import React, { Children, cloneElement, Component, isValidElement, ReactNode } from 'react'

interface Props {
  children: ReactNode
  closeModal?: () => void
  [key: string]: unknown
}

interface State {
  hasError: boolean
}

export default class AnalysisErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError(): State {
    return { hasError: true }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            padding: '20px',
            textAlign: 'center',
            color: '#f87171',
            fontSize: '14px'
          }}
        >
          Analysis data could not be displayed.
        </div>
      )
    }

    const { children, ...injectedProps } = this.props
    return Children.map(children, (child) =>
      isValidElement(child) ? cloneElement(child, injectedProps) : child
    )
  }
}
