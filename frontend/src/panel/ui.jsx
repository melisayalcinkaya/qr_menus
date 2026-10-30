// Panelde tekrar eden küçük parçalar

export function FieldError({ errors }) {
  if (!errors) return null
  const list = Array.isArray(errors) ? errors : [errors]
  return (
    <span className="form-error" role="alert">
      {list.join(' ')}
    </span>
  )
}

export function PageHeader({ title, children }) {
  return (
    <header className="page-header">
      <h1>{title}</h1>
      {children && <div className="page-header__actions">{children}</div>}
    </header>
  )
}

export function LoadState({ state, children, empty }) {
  if (state.error && !state.data)
    return (
      <div className="notice notice--error" role="alert">
        <p>{state.error.message}</p>
        <button type="button" className="btn" onClick={state.reload}>
          Tekrar dene
        </button>
      </div>
    )
  if (state.data === undefined) return <p className="panel-loading">Yükleniyor…</p>
  if (empty && empty.when) return empty.node
  return children
}
