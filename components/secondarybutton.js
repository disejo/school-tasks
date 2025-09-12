import React from 'react';

export default function PrimaryButton({ loading, loadingText = 'Enviando...', children, ...props }) {
  return (
    <button
      type="button"
      disabled={loading}
      className={`w-full bg-gray-700 text-white py-2 rounded hover:bg-gray-800 flex items-center justify-center transition-opacity duration-200 ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
      {...props}
    >
      {loading ? (
        <>
          <svg className="animate-spin mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
          </svg>
          {loadingText}
        </>
      ) : (
        children
      )}
    </button>
  );
}