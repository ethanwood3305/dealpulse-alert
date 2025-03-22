
interface DiagnosticInfoProps {
  diagnosticInfo: any;
}

export const DiagnosticInfo = ({ diagnosticInfo }: DiagnosticInfoProps) => {
  if (!diagnosticInfo) return null;
  
  return (
    <div className="border border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800 rounded-md p-3 text-xs font-mono">
      <details>
        <summary className="cursor-pointer text-amber-800 dark:text-amber-400 font-medium">Debug information</summary>
        <pre className="mt-2 whitespace-pre-wrap overflow-auto max-h-40 text-amber-700 dark:text-amber-300">
          {JSON.stringify(diagnosticInfo, null, 2)}
        </pre>
      </details>
    </div>
  );
};
