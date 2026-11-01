module.exports = {
  preset: "jest-expo",
  setupFiles: ["<rootDir>/jest.setup.js"],
  // Los runners de GitHub son más lentos: el primer render de una pantalla
  // (carga en frío de módulos) puede pasar de los 5 s por defecto.
  testTimeout: 15000,
  moduleNameMapper: {
    "\\.svg$": "<rootDir>/jest/svgMock.js",
    "^lucide-react-native$": "<rootDir>/jest/lucideMock.js",
  },
};
