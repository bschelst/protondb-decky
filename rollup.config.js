import deckyPlugin from '@decky/rollup';

const config = deckyPlugin();

config.output = {
  ...config.output,
  format: 'iife',
  name: 'ProtonDBBadges',
  exports: 'default',
};

export default config;
