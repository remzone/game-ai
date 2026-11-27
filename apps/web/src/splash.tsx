export function LoadingScreen({
  title,
  caption,
  error,
  onRetry,
}: {
  title: string;
  caption: string;
  error?: string;
  onRetry?: () => void;
}) {
  return (
    <div className="entry loading-screen">
      <div className="loading-copy" role="status" aria-live="polite">
        <span className="loading-seal" aria-hidden="true">
          ✧
        </span>
        <p className="eyebrow">ПЕПЕЛЬНАЯ КОРОНА</p>
        <h1>{title}</h1>
        <p>{caption}</p>
        {!error && (
          <div className="loading-rule" aria-hidden="true">
            <span />
          </div>
        )}
        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}
        {error && onRetry && (
          <button className="ornate-action" onClick={onRetry}>
            Повторить подключение
          </button>
        )}
      </div>
    </div>
  );
}
