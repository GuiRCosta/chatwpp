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
        version: "v25.0"
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

export interface EmbeddedSignupResult {
  code: string
  wabaId?: string
  phoneNumberId?: string
}

/**
 * Launches FB.login with WhatsApp Embedded Signup.
 * Listens for the WA_EMBEDDED_SIGNUP postMessage event to capture
 * waba_id and phone_number_id automatically, then returns them
 * along with the authorization code from FB.login.
 */
export function launchWhatsAppSignup(configId: string): Promise<EmbeddedSignupResult> {
  return new Promise((resolve, reject) => {
    if (!window.FB) {
      reject(new Error("Facebook SDK not loaded"))
      return
    }

    let settled = false
    let signupData: { wabaId?: string; phoneNumberId?: string } = {}

    const cleanup = () => {
      clearTimeout(timeoutId)
      window.removeEventListener("message", signupListener)
    }

    const settle = (fn: () => void) => {
      if (settled) return
      settled = true
      cleanup()
      fn()
    }

    const timeoutId = setTimeout(() => {
      settle(() => reject(new Error("Facebook login timed out")))
    }, SIGNUP_TIMEOUT_MS)

    const signupListener = (event: MessageEvent) => {
      if (!event.origin?.endsWith("facebook.com")) return
      try {
        const data = JSON.parse(event.data)
        if (data.type !== "WA_EMBEDDED_SIGNUP") return

        if (data.event === "FINISH") {
          signupData = {
            wabaId: data.data?.waba_id,
            phoneNumberId: data.data?.phone_number_id
          }
        } else if (data.event === "FINISH_ONLY_WABA") {
          signupData = { wabaId: data.data?.waba_id }
        } else if (data.event === "CANCEL") {
          settle(() => reject(new Error("Facebook login was cancelled or failed")))
        }
      } catch {
        // Non-JSON message, ignore
      }
    }

    window.addEventListener("message", signupListener)

    window.FB.login(
      (response: FBLoginResponse) => {
        if (response.authResponse?.code) {
          settle(() =>
            resolve({
              code: response.authResponse!.code!,
              ...signupData
            })
          )
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

