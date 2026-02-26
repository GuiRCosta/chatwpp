import { defineConfig } from "vitest/config"
import path from "path"

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src")
    }
  },
  test: {
    globals: true,
    root: "./",
    include: ["src/**/*.test.ts", "src/**/*.spec.ts"],
    exclude: ["node_modules", "dist", "src/database/migrations/**", "src/database/seeds/**"],
    coverage: {
      provider: "v8",
      reporter: ["text", "text-summary", "lcov"],
      include: [
        "src/services/**/*.ts",
        "src/controllers/**/*.ts",
        "src/validators/**/*.ts",
        "src/middleware/**/*.ts",
        "src/helpers/**/*.ts",
        "src/libs/**/*.ts",
        "src/jobs/**/*.ts"
      ],
      exclude: [
        "src/models/**",
        "src/database/**",
        "src/config/**",
        "src/@types/**",
        "src/server.ts",
        "src/libs/bullBoard.ts"
      ],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 75,
        statements: 80
      }
    },
    setupFiles: ["./src/__tests__/setup.ts"],
    mockReset: true,
    restoreMocks: true
  }
})
