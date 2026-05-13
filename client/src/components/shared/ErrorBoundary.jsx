import { Component } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });
    console.error('ErrorBoundary caught:', error, errorInfo);

    // Auto-reload page if a dynamic import/chunk fetch error is detected
    const isChunkError = 
      error && 
      (error.name === 'TypeError' && error.message?.includes('Failed to fetch dynamically imported module') ||
       error.message?.includes('chunk') ||
       error.message?.includes('MIME type of "text/html"'));

    if (isChunkError) {
      console.warn('Chunk/Module load error detected! Triggering automatic page reload to fetch the latest assets...');
      window.location.reload();
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[60vh] flex items-center justify-center p-6">
          <div className="text-center max-w-md">
            <div className="w-16 h-16 rounded-2xl bg-red-50 flex items-center justify-center mx-auto mb-6">
              <AlertTriangle size={32} className="text-red-500" />
            </div>
            <h2 className="text-2xl serif-heading text-[#111111] mb-2">Something went wrong</h2>
            <p className="text-sm text-[#666666] mb-6 leading-relaxed">
              {this.state.error?.message || 'An unexpected error occurred. Please try again.'}
            </p>
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={this.handleReset}
                className="btn-primary gap-2"
              >
                <RefreshCw size={16} />
                Try Again
              </button>
              <a href="/" className="btn-ghost gap-2">
                <Home size={16} />
                Go Home
              </a>
            </div>
            {process.env.NODE_ENV === 'development' && this.state.errorInfo && (
              <details className="mt-6 text-left">
                <summary className="text-xs text-[#888888] cursor-pointer hover:text-[#111111]">
                  Stack trace (dev only)
                </summary>
                <pre className="mt-2 p-3 rounded-lg bg-[#F0F0F0] text-xs text-[#666666] overflow-auto max-h-48 whitespace-pre-wrap">
                  {this.state.error?.stack}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
