// babel.config.js
// Babel configuration for the React Native / Metro bundler.
// The `module-resolver` plugin enables the `@/` path alias so imports can
// reference `src/` files as `@/components/Foo` instead of relative paths.

module.exports = {
  presets: ['module:@react-native/babel-preset'],
  plugins: [
    [
      'module-resolver',
      {
        root: ['.'],
        alias: {
          '@': './src',  // `@/foo` resolves to `src/foo`
        },
      },
    ],
  ],

};