declare global {
  interface Window {
    __APP_CONFIG__: {
      API_URL: string;
    }
  }
}

// Load the environment configuration from the config.json file.
export async function loadApplicationConfig() {

  const response = await fetch('/assets/config.json');
  const config = await response.json() as Window['__APP_CONFIG__'];

  window.__APP_CONFIG__ = config;
}