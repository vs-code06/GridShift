import React from 'react';

export default function LoadingSpinner({ message = 'Loading data...' }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-slate-500">
      <div className="w-8 h-8 border-3 border-sky-600 border-t-transparent rounded-full animate-spin"></div>
      <p className="mt-3 text-xs font-medium tracking-wide uppercase">{message}</p>
    </div>
  );
}

