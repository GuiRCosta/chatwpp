import { describe, it, expect, vi, beforeEach } from "vitest"

let loadFacebookSDK: typeof import("@/lib/facebook").loadFacebookSDK
let launchWhatsAppSignup: typeof import("@/lib/facebook").launchWhatsAppSignup

beforeEach(async () => {
  // Reset module-level state (sdkLoaded, sdkLoading) on each test
  vi.resetModules()
  const mod = await import("@/lib/facebook")
  loadFacebookSDK = mod.loadFacebookSDK
  launchWhatsAppSignup = mod.launchWhatsAppSignup

  // Clean up any previous script tags
  const existingScript = document.getElementById("facebook-jssdk")
  if (existingScript) {
    existingScript.remove()
  }

  // Reset window.FB
  delete (window as Record<string, unknown>).FB
  delete (window as Record<string, unknown>).fbAsyncInit
})

describe("loadFacebookSDK", () => {
  it("creates a script tag and initializes FB", async () => {
    const promise = loadFacebookSDK("test-app-id")

    const script = document.getElementById("facebook-jssdk") as HTMLScriptElement
    expect(script).not.toBeNull()
    expect(script.src).toContain("connect.facebook.net")
    expect(script.async).toBe(true)
    expect(script.defer).toBe(true)

    // Simulate FB SDK loaded
    ;(window as Record<string, unknown>).FB = {
      init: vi.fn(),
      login: vi.fn()
    }
    window.fbAsyncInit()

    await promise

    expect(window.FB.init).toHaveBeenCalledWith({
      appId: "test-app-id",
      cookie: true,
      xfbml: true,
      version: "v22.0"
    })
  })

  it("returns cached promise if already loading", () => {
    const promise1 = loadFacebookSDK("test-app-id")
    const promise2 = loadFacebookSDK("test-app-id")

    expect(promise1).toBe(promise2)
  })

  it("resolves immediately if SDK already loaded", async () => {
    // First load
    const promise1 = loadFacebookSDK("test-app-id")

    ;(window as Record<string, unknown>).FB = {
      init: vi.fn(),
      login: vi.fn()
    }
    window.fbAsyncInit()
    await promise1

    // Second load should resolve immediately
    const promise2 = loadFacebookSDK("test-app-id")
    await expect(promise2).resolves.toBeUndefined()
  })
})

describe("launchWhatsAppSignup", () => {
  it("calls FB.login with correct params", async () => {
    const mockLogin = vi.fn().mockImplementation(
      (callback: (r: { status: string }) => void) => {
        callback({ status: "unknown" })
      }
    )
    ;(window as Record<string, unknown>).FB = {
      init: vi.fn(),
      login: mockLogin
    }

    const promise = launchWhatsAppSignup("config-123")

    expect(mockLogin).toHaveBeenCalledWith(
      expect.any(Function),
      {
        config_id: "config-123",
        response_type: "code",
        override_default_response_type: true,
        extras: {
          setup: {},
          featureType: "",
          sessionInfoVersion: "3"
        }
      }
    )

    // Settle the promise to clean up the event listener
    await expect(promise).rejects.toThrow()
  })

  it("rejects if FB not loaded", async () => {
    delete (window as Record<string, unknown>).FB

    await expect(launchWhatsAppSignup("config-123")).rejects.toThrow(
      "Facebook SDK not loaded"
    )
  })

  it("handles timeout", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true })

    const mockLogin = vi.fn()
    ;(window as Record<string, unknown>).FB = {
      init: vi.fn(),
      login: mockLogin
    }

    const promise = launchWhatsAppSignup("config-123")

    // Advance past the 5-minute timeout and immediately catch
    const resultPromise = promise.catch((err: Error) => err)
    await vi.advanceTimersByTimeAsync(5 * 60 * 1000 + 1)

    const error = await resultPromise
    expect(error).toBeInstanceOf(Error)
    expect(error.message).toBe("WhatsApp signup timed out")

    vi.useRealTimers()
  })

  it("handles cancel event from Facebook", async () => {
    const mockLogin = vi.fn()
    ;(window as Record<string, unknown>).FB = {
      init: vi.fn(),
      login: mockLogin
    }

    const promise = launchWhatsAppSignup("config-123")

    // Simulate cancel event from Facebook
    const cancelEvent = new MessageEvent("message", {
      origin: "https://www.facebook.com",
      data: JSON.stringify({
        type: "WA_EMBEDDED_SIGNUP",
        event: "CANCEL"
      })
    })
    window.dispatchEvent(cancelEvent)

    await expect(promise).rejects.toThrow("WhatsApp signup was cancelled")
  })

  it("rejects when FB.login callback has no authResponse code", async () => {
    (window as Record<string, unknown>).FB = {
      init: vi.fn(),
      login: vi.fn().mockImplementation((callback: (r: { status: string }) => void) => {
        callback({ status: "unknown" })
      })
    }

    const promise = launchWhatsAppSignup("config-123")

    await expect(promise).rejects.toThrow(
      "Facebook login was cancelled or failed"
    )
  })

  it("resolves with signup data on FINISH event", async () => {
    (window as Record<string, unknown>).FB = {
      init: vi.fn(),
      login: vi.fn().mockImplementation(
        (callback: (r: { authResponse: { code: string }; status: string }) => void) => {
          callback({
            authResponse: { code: "auth-code-123" },
            status: "connected"
          })
        }
      )
    }

    const promise = launchWhatsAppSignup("config-123")

    // Simulate FINISH event from Facebook
    const finishEvent = new MessageEvent("message", {
      origin: "https://www.facebook.com",
      data: JSON.stringify({
        type: "WA_EMBEDDED_SIGNUP",
        event: "FINISH",
        data: {
          waba_id: "waba-456",
          phone_number_id: "phone-789"
        }
      })
    })
    window.dispatchEvent(finishEvent)

    const result = await promise
    expect(result).toEqual({
      code: "auth-code-123",
      wabaId: "waba-456",
      phoneNumberId: "phone-789"
    })
  })
})
