export default function ErrorAlert({ title = 'Something went wrong.', message, onRetry }) {
  return (
    <div className="error-alert">
      <div>
        <h4>{title}</h4>
        <p>{message}</p>
        {onRetry && (
          <button className="btn btn-secondary btn-sm mt-8" onClick={onRetry}>
            Retry
          </button>
        )}
      </div>
    </div>
  );
}
