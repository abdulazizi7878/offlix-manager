// file: lib/api/client.js

export async function fetchApi(endpoint, options = {}) {
  const isFormData = options.body instanceof FormData;

  const config = {
    ...options,

    headers: {
      ...(isFormData
        ? {}
        : {
          "Content-Type": "application/json",
        }),

      ...(options.headers || {}),
    },
  };

  // Prevent manually supplied JSON Content-Type
  // from breaking FormData requests.
  if (isFormData) {
    delete config.headers["Content-Type"];
    delete config.headers["content-type"];
  }

  try {
    const response = await fetch(endpoint, config);

    const data = await response.json().catch(() => null);

    console.log("FETCH API:", {
      endpoint,
      method: options.method || "GET",
      status: response.status,
      data,
    });

    if (!response.ok || data?.success === false) {      
      const errorPayload = data?.error || {
        code:
          response.status === 429
            ? "RATE_LIMITED"
            : "INTERNAL_ERROR",

        message:
          response.status === 429
            ? "Too many attempts. Please wait a moment and try again."
            : "Something went wrong. Please try again later.",

        fields: {},
      };

      throw errorPayload;
    }

    return data;
  } catch (error) {
    console.error("FETCH API ERROR:", {
      endpoint,
      method: options.method || "GET",
      errorMessage: error?.message,
      errorName: error?.name,
      errorStack: error?.stack,
      error,
    });

    throw error;
  }
}