import js from "@eslint/js";
import tseslint from "typescript-eslint";
import react from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";
import jsxA11y from "eslint-plugin-jsx-a11y";
import nextPlugin from "@next/eslint-plugin-next";
import importPlugin from "eslint-plugin-import";

export default [
    js.configs.recommended,
    ...tseslint.configs.recommended,
    {
        files: ["**/*.{js,jsx,ts,tsx}"],
        plugins: {
            react,
            "react-hooks": reactHooks,
            "jsx-a11y": jsxA11y,
            "@next/next": nextPlugin,
            import: importPlugin,
        },
        languageOptions: {
            ecmaVersion: "latest",
            sourceType: "module",
            parserOptions: {
                ecmaFeatures: {
                    jsx: true,
                },
            },
        },
        settings: {
            react: {
                version: "detect",
            },
        },
        rules: {
            // Next.js core-web-vitals rules
            ...(nextPlugin.configs.recommended?.rules || {}),
            ...(nextPlugin.configs["core-web-vitals"]?.rules || {}),

            // TypeScript rules
            "@typescript-eslint/no-unused-vars": ["warn", {
                argsIgnorePattern: "^_",
            }],
            "@typescript-eslint/no-explicit-any": "warn",

            // React rules
            "react-hooks/exhaustive-deps": "warn",
            "react/react-in-jsx-scope": "off", // Not needed in Next.js

            // General rules
            "prefer-const": "warn",
            "no-console": ["warn", {
                allow: ["warn", "error"],
            }],
        },
    },
    {
        files: ["**/*.js", "**/*.jsx"],
        ...tseslint.configs.disableTypeChecked,
    },
];
