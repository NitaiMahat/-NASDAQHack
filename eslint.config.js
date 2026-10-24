import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import globals from 'globals';
import hooks from 'eslint-plugin-react-hooks';
export default tseslint.config({ignores:['dist/**','node_modules/**','data/**']},js.configs.recommended,...tseslint.configs.recommended,{files:['**/*.{ts,tsx}'],languageOptions:{globals:{...globals.browser,...globals.node}},plugins:{'react-hooks':hooks},rules:{...hooks.configs.recommended.rules,'@typescript-eslint/no-unused-vars':['error',{argsIgnorePattern:'^_'}]}},{files:['public/auth/scripts/*.js'],languageOptions:{sourceType:'script',globals:globals.browser},rules:{'@typescript-eslint/no-unused-vars':['error',{caughtErrors:'none'}]}});
