interface ErrorAlertProps {
  errors: string[];
}

function ErrorAlert({ errors }: ErrorAlertProps) {
  if (errors.length === 0) return null;

  return (
    <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-md mb-4">
      <ul className="list-disc list-inside">
        {errors.map((err, i) => (
          <li key={i}>{err}</li>
        ))}
      </ul>
    </div>
  );
}

export default ErrorAlert;
