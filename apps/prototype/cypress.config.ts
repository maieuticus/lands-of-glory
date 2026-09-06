import { defineConfig } from 'cypress';

export default defineConfig({
  e2e: {
    baseUrl: 'http://127.0.0.1:3000',
    specPattern: 'cypress/e2e/**/*.cy.{js,ts}',
    supportFile: false,
    setupNodeEvents(_on, _config) {
      return _config;
    },
  },
  viewportWidth: 1200,
  viewportHeight: 1200,
  video: false,
  screenshotOnRunFailure: true,
});
