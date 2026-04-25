module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      [
        'module-resolver',
        {
          root: ['./src'],
          alias: {
            '@': './src',
            '@features': './src/features',
            '@shared': './src/shared',
            '@services': './src/services',
            '@constants': './src/constants',
            '@store': './src/core/store',
            '@navigation': './src/core/navigation',
            '@providers': './src/core/providers',
          },
        },
      ],
    ],
  };
};