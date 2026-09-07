export async function fetchApi(endpoint, options = {}) {
  const defaultHeaders = {
    "Content-Type": "application/json",
  };

  const config = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  };

  try {
    const response = await fetch(endpoint, config);
    const data = await response.json().catch(() => null);

    if (!response.ok || (data && !data.success)) {
      const errorPayload = data?.error || {
        code: response.status === 429 ? "RATE_LIMITED" : "INTERNAL_ERROR",
        message: response.status === 429 
          ? "Too many attempts. Please wait a moment and try again." 
          : "Something went wrong. Please try again later.",
        fields: {}
      };
      throw errorPayload;
    }

    return data;
  } catch (error) {
    if (error.code) throw error;
    throw { 
      code: "NETWORK_ERROR", 
      message: "Network error. Please check your connection and try again.", 
      fields: {} 
    };
  }
}