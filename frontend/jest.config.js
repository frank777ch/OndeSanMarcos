module.exports = {
  preset: "jest-expo",
  setupFiles: ["<rootDir>/jest.setup.js"],
  moduleNameMapper: {
    "\\.svg$": "<rootDir>/jest/svgMock.js",
    "^lucide-react-native$": "<rootDir>/jest/lucideMock.js",
  },
};
