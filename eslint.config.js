import js from '@eslint/js';
import globals from 'globals';
import security from 'eslint-plugin-security';

export default [
    security.configs.recommended,
    js.configs.recommended,
    {
        languageOptions: {
            ecmaVersion: 'latest',
            sourceType: 'module',
            globals: {
                ...globals.node,
                ...globals.es2021,
                __basedir: 'readonly',
                Osthelia: 'readonly'
            }
        },
        rules: {
            'no-undef': 'error',
            'no-unused-vars': 'warn',
            semi: ['error', 'always']
        }
    }
];
