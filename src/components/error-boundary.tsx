import { Component, type ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { dashboardNavigation } from '@/lib/bitcoin'
import { ComponentLoadError } from '@/lib/component-load-error'

type Props = { children: ReactNode; scope: 'global' | 'view' | 'chart' }
type State = { failed: boolean; loadError: boolean }

export class ErrorBoundary extends Component<Props, State> {
  state: State = { failed: false, loadError: false }

  static getDerivedStateFromError(error: unknown): State {
    return { failed: true, loadError: error instanceof ComponentLoadError }
  }

  render() {
    if (!this.state.failed) return this.props.children

    const { scope } = this.props
    const { loadError } = this.state
    const title = loadError
      ? 'Anwendungskomponente konnte nicht geladen werden'
      : scope === 'global'
        ? 'Das Dashboard konnte nicht angezeigt werden'
        : scope === 'view'
          ? 'Diese Ansicht konnte nicht angezeigt werden'
          : 'Das Diagramm konnte nicht angezeigt werden'
    const content = (
      <div role="alert" className="rounded-panel border border-border bg-card p-6 text-foreground">
        {scope === 'chart' ? (
          <h2 className="text-lg font-semibold">{title}</h2>
        ) : (
          <h1 tabIndex={-1} className="text-2xl font-semibold">
            {title}
          </h1>
        )}
        <p className="mt-2 text-sm text-muted-foreground">
          {loadError
            ? 'Bitte laden Sie die Seite neu, um die Komponente erneut zu laden.'
            : 'Ein unerwarteter Fehler ist aufgetreten. Bitte versuchen Sie es erneut oder laden Sie die Seite neu.'}
        </p>
        {scope === 'view' && (
          <p className="mt-2 text-sm text-muted-foreground">
            Über die Navigation können Sie eine andere Ansicht öffnen.
          </p>
        )}
        <div className="mt-4 flex flex-wrap gap-3">
          {scope !== 'global' && !loadError && (
            <Button onClick={() => this.setState({ failed: false, loadError: false })}>
              Erneut versuchen
            </Button>
          )}
          <Button variant="outline" onClick={() => dashboardNavigation.reload()}>
            Seite neu laden
          </Button>
        </div>
      </div>
    )

    return scope === 'global' ? (
      <main className="mx-auto flex min-h-screen max-w-2xl items-center px-4 py-8">{content}</main>
    ) : (
      content
    )
  }
}
