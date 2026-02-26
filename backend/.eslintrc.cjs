module.exports = {
  root: true,
  parser: "@typescript-eslint/parser",
  plugins: ["@typescript-eslint"],
  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended"
  ],
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: "module"
  },
  env: {
    node: true,
    es2020: true
  },
  ignorePatterns: ["dist", "node_modules", "coverage"],
  rules: {
    "@typescript-eslint/no-unused-vars": ["error", {
      argsIgnorePattern: "^_",
      varsIgnorePattern: "^_"
    }],
    "@typescript-eslint/no-explicit-any": "warn",
    "@typescript-eslint/no-namespace": "off",
    "@typescript-eslint/ban-types": ["error", {
      types: {
        Function: false
      },
      extendDefaults: true
    }]
  },
  overrides: [
    {
      files: ["**/__tests__/**/*.ts", "**/*.test.ts", "**/*.spec.ts"],
      rules: {
        "@typescript-eslint/no-unused-vars": ["error", {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_"
        }]
      }
    }
  ]
}
