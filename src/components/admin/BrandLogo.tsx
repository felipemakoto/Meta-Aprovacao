export function BrandLogo({ className = "w-10 h-10" }: { className?: string }) {
  return (
    <div
      className={`${className} shrink-0 flex items-center justify-center text-[var(--primary)]`}
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 40 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full"
      >
        <path
          d="M6 31V15.5L18.5 24L34 9V31"
          stroke="currentColor"
          strokeWidth="5.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}
