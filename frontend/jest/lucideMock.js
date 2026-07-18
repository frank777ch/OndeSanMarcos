// lucide-react-native ships ESM-only .mjs files that Jest's default
// transform (`\.[jt]sx?$`) doesn't pick up. Icons are purely decorative
// for the screens under test, so stub the whole package with dummy
// no-op components instead of teaching Jest to transform the real one.
const React = require("react");

module.exports = new Proxy(
  {},
  {
    get: () => (props) => React.createElement("Icon", props),
  },
);
