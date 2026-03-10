const nextTransformer = require('next/dist/build/swc/jest-transformer');

module.exports = {
  createTransformer(inputOptions) {
    const base = nextTransformer.createTransformer(inputOptions);
    return {
      process(src, filename, jestOptions) {
        if (src.includes('next/dynamic')) {
          src = src.replace(
            /import\s+dynamic\s+from\s+["']next\/dynamic["'];?/g,
            'const dynamic = require("next/dynamic");'
          );
        }
        return base.process(src, filename, jestOptions);
      },
    };
  },
};
