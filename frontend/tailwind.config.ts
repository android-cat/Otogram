import type { Config } from "tailwindcss";

const config: Config = {
    content: [
        "./src/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {
            colors: {
                primary: {
                    DEFAULT: '#9333ea', // purple-600
                    light: '#d8b4fe',   // purple-300
                    dark: '#7e22ce',    // purple-700
                },
                secondary: {
                    DEFAULT: '#db2777', // pink-600
                },
                accent: {
                    DEFAULT: '#2563eb', // blue-600
                }
            },
            backgroundImage: {
                "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
                "gradient-conic":
                    "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
                "gradient-brand": "linear-gradient(135deg, #2563eb, #9333ea, #db2777)",
            },
        },
    },
    plugins: [],
};
export default config;
