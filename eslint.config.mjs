import js from "@eslint/js";
import tseslint from "typescript-eslint";
import react from "eslint-plugin-react";
import globals from "globals";

export default tseslint.config(
    {
        ignores: [
            "**/node_modules/**",
            "**/.expo/**",
            "**/dist/**",
            "**/web-build/**",
            "babel.config.js",
            "metro.config.js",
            "jest.config.js"
        ],
    },
    js.configs.recommended,
    ...tseslint.configs.recommended,
    {
        files: ["**/*.{js,jsx,mjs,cjs,ts,tsx}"],
        plugins: {
            react,
        },
        languageOptions: {
            ecmaVersion: 2020,
            globals: {
                ...globals.browser,
                ...globals.node,
                ...globals.es2021,
                ...globals.jest,
            },
            parserOptions: {
                ecmaFeatures: {
                    jsx: true,
                },
            },
        },
        rules: {
            "react/jsx-uses-react": "off",
            "react/react-in-jsx-scope": "off",
            "@typescript-eslint/no-var-requires": "off",
            "@typescript-eslint/no-explicit-any": "warn",
            "no-unused-vars": "off",
            "@typescript-eslint/no-unused-vars": ["warn", { "argsIgnorePattern": "^_" }],
            "@typescript-eslint/no-require-imports": "warn",
            "@typescript-eslint/ban-ts-comment": "warn",
            "@typescript-eslint/no-wrapper-object-types": "warn"
        },
        settings: {
            react: {
                version: "detect",
            },
        },
    }
);
