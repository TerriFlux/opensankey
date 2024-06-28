
import globals from "globals";
import js from "@eslint/js";
import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';

export default [
    // Recommended configs
    js.configs.recommended,
    eslint.configs.recommended,
    ...tseslint.configs.recommended,

    // Default override
    {
        files: ["**/*.js", "**/*.jsx", "**/*.tsx"],

        languageOptions: {
            ecmaVersion: 2018,
            // ecmaFeatures: {
            //     ...ecmaFeatures.jsx
            // },
            sourceType: "module",
            globals: {
                ...globals.browser,
                ...globals.node,
                myCustomGlobal: "readonly"
            }
        },

        rules: {
            "linebreak-style": 0,
            "@typescript-eslint/explicit-module-boundary-types": "off",
            "@typescript-eslint/no-unused-vars": "warn",
            "@typescript-eslint/no-explicit-any": 2,
            "@typescript-eslint/no-var-requires": 2,
            indent: [
                "error",
                2
            ],
            quotes: [
                "error",
                "single"
            ],
            semi: [
                "error",
                "never"
            ]
            // "max-len":["warn",{"code":100}]
        },
    },

    // Overrides
    {
        files: [
            "src/configmenus/SankeyConvert.tsx",
            "src/dialogs/SankeyMenuDialogs.tsx",
            "src/dialogs/SankeyMenuPreferences.tsx",
            "src/dialogs/SankeyStyle.tsx",
            "src/draw/SankeyDraw.test.tsx",
            "src/draw/SankeyDraw.tsx",
            "src/draw/SankeyDrawEventFunction.tsx",
            "src/draw/SankeyDrawFunction.tsx",
            "src/index.tsx",
            "src/topmenus/SankeyMenuExamples.tsx",
            "src/topmenus/SankeyMenuTop.tsx",
        ],
        rules: {
            "@typescript-eslint/no-var-requires": "off"
        }
    }
];

