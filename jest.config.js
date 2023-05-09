module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  reporters: [
    ['github-actions', {silent: false}], 
    'default'
  ],
  transform: {
    "^.+\\.ts?$": "ts-jest",
  },
  transformIgnorePatterns: ["<rootDir>/node_modules/"],
  testTimeout: 100000,
  verbose: true,
  detectOpenHandles: true,
};
