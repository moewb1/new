import React from "react";

type IconProps = React.SVGProps<SVGSVGElement>;

export function WhatsAppIcon({ className, ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className={className}
      {...props}
    >
      <path
        fill="currentColor"
        d="M12.04 2c-5.51 0-9.98 4.33-9.98 9.66 0 1.7.46 3.35 1.34 4.8L2 22l5.69-1.44c1.42.77 3.01 1.17 4.66 1.17 5.51 0 9.98-4.33 9.98-9.66S17.55 2 12.04 2Zm5.87 13.8c-.25.71-1.46 1.34-2.02 1.41-.52.07-1.19.1-1.92-.12-.44-.14-1-.33-1.72-.64-3.03-1.32-5-4.27-5.15-4.47-.15-.2-1.23-1.63-1.23-3.12s.78-2.21 1.06-2.52c.27-.31.59-.39.78-.39.2 0 .39.01.57.01.19 0 .44-.07.69.53.25.61.85 2.11.93 2.26.08.15.13.32.02.52-.11.2-.17.32-.33.5-.15.17-.31.39-.45.52-.15.15-.3.31-.13.61.17.3.75 1.29 1.61 2.09 1.11.99 2.05 1.3 2.35 1.44.3.15.47.13.64-.07.17-.2.73-.85.93-1.14.19-.29.39-.24.65-.14.27.1 1.7.8 1.99.94.29.14.48.21.55.33.07.12.07.72-.18 1.43Z"
      />
    </svg>
  );
}

export function GmailIcon({ className, ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className={className}
      {...props}
    >
      <path
        fill="currentColor"
        d="M20.5 4H3.5A1.5 1.5 0 0 0 2 5.5v13A1.5 1.5 0 0 0 3.5 20h17a1.5 1.5 0 0 0 1.5-1.5v-13A1.5 1.5 0 0 0 20.5 4Zm-.44 2-7.56 5.66L3.94 6h16.12ZM4 18v-9.4l8.04 6 8.04-6V18H4Z"
      />
    </svg>
  );
}
