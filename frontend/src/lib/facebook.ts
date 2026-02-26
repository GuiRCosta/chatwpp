declare global {
  interface Window {
    FB: {
      init: (params: {
        appId: string
        cookie: boolean
        xfbml: boolean
        version: string
      }) => void
      login: (
        callback: (response: FBLoginResponse) => void,
        options: {
          config_id: string
          response_type: string
          override_default_response_type: boolean
          extras: {
            setup: Record<string, unknown>
            featureType: string
            sessionInfoVersion: string
          }
        }
      ) => void
    }
    fbAsyncInit: () => void
  }
}

interface FBLoginResponse {
  authResponse?: {
    code?: string
    accessToken?: string
    userID?: string
    expiresIn?: number
  }
  status: string
}

export interface EmbeddedSignupResult {
  code: string
  wabaId: string
  phoneNumberId: string
}

let sdkLoaded = false
let sdkLoading: Promise<void> | null = null

export function loadFacebookSDK(appId: string): Promise<void> {
  if (sdkLoaded) {
    return Promise.resolve()
  }

  if (sdkLoading) {
    return sdkLoading
  }

  sdkLoading = new Promise<void>((resolve, reject) => {
    window.fbAsyncInit = () => {
      window.FB.init({
        appId,
        cookie: true,
        xfbml: true,
        version: "v22.0"
      })
      sdkLoaded = true
      resolve()
    }

    const existingScript = document.getElementById("facebook-jssdk")
    if (existingScript) {
      if (window.FB) {
        sdkLoaded = true
        resolve()
      }
      return
    }

    const script = document.createElement("script")
    script.id = "facebook-jssdk"
    script.src = "https://connect.facebook.net/en_US/sdk.js"
    script.async = true
    script.defer = true
    script.crossOrigin = "anonymous"
    script.onerror = () => {
      sdkLoading = null
      reject(new Error("Failed to load Facebook SDK"))
    }

    const fbRoot = document.getElementById("fb-root")
    if (fbRoot?.parentNode) {
      fbRoot.parentNode.insertBefore(script, fbRoot)
    } else {
      document.body.appendChild(script)
    }
  })

  return sdkLoading
}

const SIGNUP_TIMEOUT_MS = 5 * 60 * 1000

export function launchWhatsAppSignup(configId: string): Promise<EmbeddedSignupResult> {
  return new Promise((resolve, reject) => {
    if (!window.FB) {
      reject(new Error("Facebook SDK not loaded"))
      return
    }

    let loginCode = ""
    let settled = false

    const cleanup = () => {
      window.removeEventListener("message", messageHandler)
      clearTimeout(timeoutId)
    }

    const settle = (fn: () => void) => {
      if (settled) return
      settled = true
      cleanup()
      fn()
    }

    const timeoutId = setTimeout(() => {
      settle(() => reject(new Error("WhatsApp signup timed out")))
    }, SIGNUP_TIMEOUT_MS)

    const messageHandler = (event: MessageEvent) => {
      if (
        event.origin !== "https://www.facebook.com" &&
        event.origin !== "https://web.facebook.com"
      ) {
        return
      }

      try {
        const data = typeof event.data === "string"
          ? JSON.parse(event.data)
          : event.data

        if (data.type === "WA_EMBEDDED_SIGNUP") {
          if (data.event === "FINISH") {
            const wabaId = data.data?.waba_id
            const phoneNumberId = data.data?.phone_number_id

            if (!wabaId || !phoneNumberId) {
              settle(() =>
                reject(new Error("Incomplete signup data received from Facebook"))
              )
              return
            }

            settle(() => resolve({ code: loginCode, wabaId, phoneNumberId }))
          } else if (data.event === "CANCEL") {
            settle(() => reject(new Error("WhatsApp signup was cancelled")))
          }
        }
      } catch {
        // Ignore non-JSON messages
      }
    }

    window.addEventListener("message", messageHandler)

    window.FB.login(
      (response: FBLoginResponse) => {
        if (response.authResponse?.code) {
          loginCode = response.authResponse.code
        } else {
          settle(() =>
            reject(new Error("Facebook login was cancelled or failed"))
          )
        }
      },
      {
        config_id: configId,
        response_type: "code",
        override_default_response_type: true,
        extras: {
          setup: {},
          featureType: "",
          sessionInfoVersion: "3"
        }
      }
    )
  })
}
