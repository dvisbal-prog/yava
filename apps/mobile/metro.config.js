// En web, react-native-maps se reemplaza por src/lib/maps-web.tsx (el paquete no carga en react-native-web).
const path = require("path");
const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);
const mapsWeb = path.resolve(__dirname, "src/lib/maps-web.tsx");
const upstream = config.resolver.resolveRequest;

config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (platform === "web" && moduleName === "react-native-maps") {
    return { type: "sourceFile", filePath: mapsWeb };
  }
  return (upstream ?? context.resolveRequest)(context, moduleName, platform);
};

module.exports = config;
