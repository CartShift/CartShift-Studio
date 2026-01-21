import js from "@eslint/js";
import tseslint from "typescript-eslint";
import react from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";
import jsxA11y from "eslint-plugin-jsx-a11y";
import nextPlugin from "@next/eslint-plugin-next";
import importPlugin from "eslint-plugin-import";
import rtlPlugin from "./eslint-plugins/rtl-logical-properties.mjs";

export default [
    // Global ignores - files/directories that don't need linting
    {
        ignores: [
            // Dependencies
            "node_modules/**",

            // Build outputs
            ".next/**",
            "build_out/**",
            "out/**",
            "dist/**",

            // Test coverage
            "coverage/**",

            // Firebase
            ".firebase/**",
            "functions/**",
            "*.rules",

            // Static assets & content
            "public/**",
            "content/**",

            // Documentation
            "docs/**",

            // IDE & tooling configs
            ".cursor/**",
            ".agent/**",
            ".gemini/**",
            ".husky/**",
            ".vscode/**",

            // Generated files
            "next-env.d.ts",
            "pnpm-lock.yaml",
            "package-lock.json",

            // Scripts (utility scripts, not app code)
            "scripts/**",
            "dev-pro.mjs",

            // Custom ESLint plugins
            "eslint-plugins/**",

            // Config files
            "*.config.js",
            "*.config.mjs",
            "*.config.ts",
            "postcss.config.*",
            "tailwind.config.*",
            "vitest.config.*",

            // Temp & debug files
            "*.log",
            "*.tmp",
            "temp_*",

            // Firebase diagnostics
            "*Diagnostic.js",
            "diagnose-*.js",
        ],
    },
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
            "rtl": rtlPlugin,
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
            "@typescript-eslint/no-unused-vars": ["error", {
                argsIgnorePattern: "^_",
                varsIgnorePattern: "^_",
                caughtErrorsIgnorePattern: "^_",
            }],
            "@typescript-eslint/no-explicit-any": "off",
            "@typescript-eslint/no-unused-expressions": "off",

            // React rules
            "react-hooks/exhaustive-deps": "off",
            "react/react-in-jsx-scope": "off",

            // Next.js rules
            "@next/next/no-img-element": "off",

            // General rules
            "prefer-const": "warn",
            "no-console": "off",
            // RTL logical properties - auto-fixable
            "rtl/enforce-logical-properties": "warn",
        },
    },
    {
        // Enforce service layer by restricting direct firebase imports in components and pages
        files: [
            "components/**/*.{ts,tsx}",
            "app/**/*.{ts,tsx}"
        ],
        rules: {
            "no-restricted-imports": ["warn", {
                "paths": [
                    {
                        "name": "firebase/firestore",
                        "message": "Direct firestore imports are not allowed in components. Use service functions or custom hooks from @/lib/services instead."
                    },
                    {
                        "name": "firebase/storage",
                        "message": "Direct storage imports are not allowed in components. Use service functions from @/lib/services instead."
                    }
                ]
            }]
        }
    },
    {
        files: ["**/*.js", "**/*.jsx"],
        ...tseslint.configs.disableTypeChecked,
    },
];
