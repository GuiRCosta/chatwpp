import { defineConfig } from "vitest/config"
import react from "@vitejs/plugin-react"
import path from "path"

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src")
    }
  },
  test: {
    globals: true,
    environment: "jsdom",
    include: ["src/**/*.test.ts", "src/**/*.test.tsx", "src/**/*.spec.ts", "src/**/*.spec.tsx"],
    coverage: {
      provider: "v8",
      reporter: ["text", "text-summary", "lcov"],
      include: [
        "src/stores/**/*.ts",
        "src/hooks/**/*.ts",
        "src/lib/**/*.ts",
        "src/components/shared/**/*.tsx",
        "src/components/layout/**/*.tsx",
        "src/pages/**/*.tsx"
      ],
      exclude: [
        "src/components/ui/**",
        "src/types/**",
        "src/main.tsx",
        "src/globals.css"
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
