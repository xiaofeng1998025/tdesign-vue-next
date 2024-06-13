import path from 'node:path';
import url from '@rollup/plugin-url';
import json from '@rollup/plugin-json';
import babel from '@rollup/plugin-babel';
import vuePlugin from 'rollup-plugin-vue';
import styles from 'rollup-plugin-styles';
import deletePlugin from 'rollup-plugin-delete';
import esbuild from 'rollup-plugin-esbuild';
import postcss from 'rollup-plugin-postcss';
import replace from '@rollup/plugin-replace';
import analyzer from 'rollup-plugin-analyzer';
import { terser } from 'rollup-plugin-terser';
import commonjs from '@rollup/plugin-commonjs';
import { DEFAULT_EXTENSIONS } from '@babel/core';
import alias from '@rollup/plugin-alias';
import multiInput from 'rollup-plugin-multi-input';

import nodeResolve from '@rollup/plugin-node-resolve';
import staticImport from 'rollup-plugin-static-import';
import ignoreImport from 'rollup-plugin-ignore-import';
import copy from 'rollup-plugin-copy';
import { globSync } from 'glob';

import pkg from './package.json';

const name = 'tdesign';

const esExternalDeps = Object.keys({
  '@babel/runtime': '^7.22.6',
  '@popperjs/core': '^2.11.8',
  '@types/lodash': '4.14.182',
  '@types/sortablejs': '^1.15.1',
  '@types/tinycolor2': '^1.4.3',
  '@types/validator': '^13.7.17',
  'dayjs': '1.11.10',
  'lodash': '^4.17.21',
  'mitt': '^3.0.1',
  'sortablejs': '^1.15.0',
  'tdesign-icons-vue-next': '^0.2.0',
  'tinycolor2': '^1.6.0',
  'validator': '^13.9.0',
} || {});
const externalDeps = esExternalDeps.concat([/lodash/, /@babel\/runtime/]);
const externalPeerDeps = Object.keys({
  '@babel/cli': '^7.22.9',
  '@babel/core': '^7.22.9',
  '@babel/helper-module-imports': '7.22.5',
  '@babel/plugin-transform-modules-commonjs': '^7.22.5',
  '@babel/plugin-transform-object-assign': '^7.22.5',
  '@babel/plugin-transform-runtime': '^7.22.9',
  '@babel/preset-env': '^7.22.9',
  '@commitlint/cli': '^16.3.0',
  '@commitlint/config-conventional': '^15.0.0',
  '@rollup/plugin-babel': '^5.3.1',
  '@rollup/plugin-commonjs': '^21.1.0',
  '@rollup/plugin-json': '^4.1.0',
  '@rollup/plugin-node-resolve': '^13.3.0',
  '@rollup/plugin-replace': '^4.0.0',
  '@rollup/plugin-url': '^7.0.0',
  '@testing-library/dom': '^8.20.1',
  '@types/babel__traverse': '~7.18.5',
  '@types/node': '18.8.0',
  '@types/raf': '^3.4.0',
  '@typescript-eslint/eslint-plugin': '^4.33.0',
  '@typescript-eslint/parser': '^4.33.0',
  '@vitejs/plugin-vue': '^2.3.4',
  '@vitejs/plugin-vue-jsx': '^1.3.10',
  '@vitest/ui': '^0.14.2',
  '@vue/babel-plugin-jsx': '1.2.2',
  '@vue/compiler-sfc': '^3.3.4',
  '@vue/eslint-config-typescript': '^10.0.0',
  '@vue/test-utils': '^2.4.1',
  'autoprefixer': '^10.4.14',
  'babel-eslint': '^10.1.0',
  'c8': '^7.14.0',
  'camelcase': '~6.3.0',
  'cli-color': '^2.0.3',
  'clipboard': '^2.0.11',
  'codesandbox': '^2.2.3',
  'cross-env': '^7.0.3',
  'cypress': '^12.17.2',
  'cz-git': '^1.7.0',
  'czg': '^1.7.0',
  'dom-parser': '^0.1.6',
  'esbuild': '^0.14.54',
  'eslint': '^7.32.0',
  'eslint-config-prettier': '^8.8.0',
  'eslint-plugin-import': '^2.27.5',
  'eslint-plugin-prettier': '^4.2.1',
  'eslint-plugin-vue': '^8.7.1',
  'glob': '^7.2.3',
  'gray-matter': '^4.0.3',
  'husky': '^7.0.4',
  'ignore': '^5.2.4',
  'jsdom': '^19.0.0',
  'less': '^4.1.3',
  'lint-staged': '^13.2.3',
  'mockdate': '^3.0.5',
  'msw': '^1.2.3',
  'npm-run-all': '^4.1.5',
  'postcss': '^8.4.26',
  'prettier': '2.8.1',
  'prismjs': '^1.29.0',
  'raf': '^3.4.1',
  'rimraf': '^5.0.1',
  'rollup': '^2.79.1',
  'rollup-plugin-analyzer': '^4.0.0',
  'rollup-plugin-copy': '^3.4.0',
  'rollup-plugin-delete': '^2.0.0',
  'rollup-plugin-esbuild': '^4.10.3',
  'rollup-plugin-ignore-import': '^1.3.2',
  'rollup-plugin-multi-input': '^1.4.1',
  'rollup-plugin-postcss': '^4.0.2',
  'rollup-plugin-static-import': '^0.1.1',
  'rollup-plugin-styles': '^4.0.0',
  'rollup-plugin-terser': '^7.0.2',
  'rollup-plugin-vue': '^6.0.0',
  'semver': '^7.5.4',
  'tdesign-icons-view': '^0.2.0',
  'tdesign-publish-cli': '^0.0.12',
  'tdesign-site-components': '^0.15.3',
  'tdesign-theme-generator': '^1.0.11',
  'typescript': '~4.8.4',
  'vite': '^2.9.16',
  'vite-plugin-pwa': '^0.12.8',
  'vite-plugin-tdoc': '^2.0.4',
  'vitest': '^0.14.2',
  'vitest-fetch-mock': '^0.1.0',
  'vue': '3.3.9',
  'vue-router': '^4.2.4',
  'workbox-precaching': '^6.6.0',
});
const banner = `/**
 * ${name} v${pkg.version}
 * (c) ${new Date().getFullYear()} ${pkg.author}
 * @license ${pkg.license}
 */
`;

const input = './index-lib.ts';
const inputList = [
  'src/**/*.ts',
  'src/**/*.tsx',
  '!src/**/demos',
  '!src/**/*.d.ts',
  '!src/**/__tests__',
];

// CSS 样式入口
const cssDirMap = {
  commonDir: path.join(path.resolve(__dirname), '../../packages/common'),
  commonComponentDir: path.join(path.resolve(__dirname), '../../packages/components/common/src'),
  vue3ComponentDir: path.join(path.resolve(__dirname), '../../packages/components/vue3/src'),
};

function aliasPlugin(vueVersion) {
  return alias({
    resolve: ['.tsx', '.ts', '.js', '.less'],
    entries: [
      { find: '@adapter/vue', replacement: path.join(path.resolve(__dirname), `../../packages/adapter/vue/vue${vueVersion}`) },
      { find: '@adapter/hooks', replacement: path.join(path.resolve(__dirname), `../../packages/adapter/hooks/vue${vueVersion}`) },
      { find: /^@td\/components\/(.+)/, replacement: path.join(path.resolve(__dirname), `../../packages/tdesign-vue${vueVersion === 3 ? '-next' : ''}/src/$1`) },
      { find: /^@td\/components$/, replacement: path.join(path.resolve(__dirname), `../../packages/tdesign-vue${vueVersion === 3 ? '-next' : ''}`) },
      { find: '@td/common', replacement: path.join(path.resolve(__dirname), `../../packages/common`) },
    ],

  // {
  //   '@adapter/vue': path.join(path.resolve(__dirname), '../../packages/adapter/vue/vue3'),
  //   '@adapter/hooks': path.join(path.resolve(__dirname), '../../packages/adapter/hooks/vue3'),
  //   '@td/adapter-vue': path.join(path.resolve(__dirname), '../../packages/adapter/vue'),
  //   '@td/adapter-hooks': path.join(path.resolve(__dirname), '../../packages/adapter/hooks'),
  //   '@td/utils': path.join(path.resolve(__dirname), '../../packages/utils'),
  //   '@td/common': path.join(path.resolve(__dirname), '../../packages/common'),
  //   '@td/components': path.join(path.resolve(__dirname), '../../packages/tdesign-vue-next/src'),
  //   '@td/components-common': path.join(path.resolve(__dirname), '../../packages/components/common'),
  //   '@td/components-vue3': path.join(path.resolve(__dirname), '../../packages/components/vue3'),
  // },
  });
}

function getPlugins({
  env,
  isProd = false,
  ignoreLess = true,
  extractOneCss = false,
  extractMultiCss = false,
} = {}) {
  const plugins = [
    nodeResolve({
      extensions: ['.ts'],
    }),
    vuePlugin(),
    commonjs(),
    esbuild({
      target: 'esnext',
      minify: false,
      jsx: 'preserve',
      tsconfig: 'tsconfig.build.json',
    }),
    babel({
      babelHelpers: 'runtime',
      extensions: [...DEFAULT_EXTENSIONS, '.vue', '.ts', '.tsx'],
    }),
    json(),
    url(),
    replace({
      preventAssignment: true,
      values: {
        PKG_VERSION: JSON.stringify(pkg.version),
      },
    }),
  ];

  // dist 目录
  if (extractOneCss) {
    plugins.push(
      postcss({
        extract: `${isProd ? `${name}.min` : name}.css`,
        minimize: isProd,
        sourceMap: true,
        extensions: ['.sass', '.scss', '.css', '.less'],
      }),
    );
  } else if (extractMultiCss) {
    plugins.push(
      staticImport({
        include: [
          `${cssDirMap.commonComponentDir}/**/style/css.mjs`,
          `${cssDirMap.vue3ComponentDir}/**/style/css.mjs`,
        ],
      }),
      ignoreImport({
        include: [
          `${cssDirMap.commonComponentDir}/*/style/*`,
          `${cssDirMap.vue3ComponentDir}/*/style/*`,
        ],
        body: 'import "./style/css.mjs";',
      }),
      copy({
        targets: [
          {
            src: `${cssDirMap.commonComponentDir}/**/style/css.js`,
            dest: 'es',
            rename: (name, extension, fullPath) => `${fullPath.slice(cssDirMap.commonComponentDir.length, -2)}mjs`,
          },
          {
            src: `${cssDirMap.vue3ComponentDir}/**/style/css.js`,
            dest: 'es',
            rename: (name, extension, fullPath) => `${fullPath.slice(cssDirMap.vue3ComponentDir.length, -2)}mjs`,
          },
        ],
        verbose: true,
      }),
    );
  } else if (ignoreLess) {
    plugins.push(ignoreImport({ extensions: ['*.less'] }));
  } else {
    plugins.push(
      staticImport({
        include: ['src/**/style/index.js', 'src/_common/style/web/**/*.less'],
      }),
      ignoreImport({
        include: ['src/*/style/*'],
        body: 'import "./style/index.js";',
      }),
    );
  }

  if (env) {
    plugins.push(
      replace({
        preventAssignment: true,
        values: {
          'process.env.NODE_ENV': JSON.stringify(env),
        },
      }),
    );
  }

  if (isProd) {
    plugins.push(
      terser({
        output: {
          ascii_only: true,
        },
      }),
    );
  }

  return plugins;
}

function getCssConfig() {
  function cssConfig(prefix) {
    const files = globSync(`${prefix}/**/style/index.js`);
    return files.map((file) => {
      return {
        input: file,
        plugins: [aliasPlugin(3), styles({ mode: 'extract' })],
        output: {
          banner,
          dir: `es/${file.slice(prefix.length, -8)}`,
          assetFileNames: '[name].css',
        },
      };
    });
  }

  return [
    ...cssConfig(cssDirMap.commonComponentDir),
    ...cssConfig(cssDirMap.vue3ComponentDir),
  ];
}

/** @type {import('rollup').RollupOptions} */
const cssConfig = {
  input: [`${cssDirMap.commonComponentDir}/**/style/index.js`],
  plugins: [aliasPlugin, multiInput(), styles({ mode: 'extract' })],
  output: {
    banner,
    dir: 'es',
    assetFileNames: (assetInfo) => {
      const filePathRegExp = new RegExp(`${cssDirMap.commonComponentDir}/(.*).js`);
      const name = assetInfo.facadeModuleId.match(filePathRegExp)[1];
      return `${name}.css`;
    },
    entryFileNames: (assetInfo) => {
      const filePathRegExp = new RegExp(`${cssDirMap.commonComponentDir}/(.*).js`);
      const name = assetInfo.facadeModuleId.match(filePathRegExp)[1];
      return `${name}.js`;
    },
  },
};

// lodash会使ssr无法运行,@babel\runtime affix组件报错,tinycolor2 颜色组件报错,dayjs 日期组件报错
const exception = ['tinycolor2', 'dayjs'];
const esExternal = esExternalDeps
  .concat(externalPeerDeps)
  .filter(value => !exception.includes(value));

const esConfig = {
  input: inputList.concat('!src/index-lib.ts'),
  // 为了保留 style/css.js
  treeshake: false,
  external: esExternal,
  plugins: [aliasPlugin(3), multiInput(), ...getPlugins({ extractMultiCss: true })],
  output: {
    banner,
    dir: 'es/',
    format: 'esm',
    sourcemap: true,
    entryFileNames: '[name].mjs',
    chunkFileNames: '_chunks/dep-[hash].mjs',
  },
};

/** @type {import('rollup').RollupOptions} */
const esmConfig = {
  input: inputList.concat('!src/index-lib.ts'),
  // 为了保留 style/index.js
  treeshake: false,
  external: externalDeps.concat(externalPeerDeps),
  plugins: [aliasPlugin, multiInput()].concat(getPlugins({ ignoreLess: false })),
  output: {
    banner,
    dir: 'esm/',
    format: 'esm',
    sourcemap: true,
    chunkFileNames: '_chunks/dep-[hash].js',
  },
};

/** @type {import('rollup').RollupOptions} */
const libConfig = {
  input: inputList,
  external: externalDeps.concat(externalPeerDeps),
  plugins: [aliasPlugin, multiInput()].concat(getPlugins()),
  output: {
    banner,
    dir: 'lib/',
    format: 'esm',
    sourcemap: true,
    chunkFileNames: '_chunks/dep-[hash].js',
  },
};

/** @type {import('rollup').RollupOptions} */
const cjsConfig = {
  input: inputList,
  external: externalDeps.concat(externalPeerDeps),
  plugins: [aliasPlugin, multiInput()].concat(getPlugins()),
  output: {
    banner,
    dir: 'cjs/',
    format: 'cjs',
    sourcemap: true,
    exports: 'named',
    chunkFileNames: '_chunks/dep-[hash].js',
  },
};

/** @type {import('rollup').RollupOptions} */
const umdConfig = {
  input,
  external: externalPeerDeps,
  plugins: [aliasPlugin].concat(getPlugins({
    env: 'development',
    extractOneCss: true,
  }).concat(
    analyzer({
      limit: 5,
      summaryOnly: true,
    }),
  )),
  output: {
    name: 'TDesign',
    banner,
    format: 'umd',
    exports: 'named',
    globals: { vue: 'Vue', lodash: '_' },
    sourcemap: true,
    file: `dist/${name}.js`,
  },
};

/** @type {import('rollup').RollupOptions} */
const umdMinConfig = {
  input,
  external: externalPeerDeps,
  plugins: [aliasPlugin].concat(getPlugins({
    isProd: true,
    extractOneCss: true,
    env: 'production',
  })),
  output: {
    name: 'TDesign',
    banner,
    format: 'umd',
    exports: 'named',
    globals: { vue: 'Vue', lodash: '_' },
    sourcemap: true,
    file: `dist/${name}.min.js`,
  },
};

// 单独导出 reset.css 到 dist 目录，兼容旧版本样式
const resetCss = {
  input: `${cssDirMap.commonDir}/style/web/_reset.less`,
  output: {
    file: 'dist/reset.css',
  },
  plugins: [postcss({ extract: true })],
};

// 用于清空无效的 style 目录文件，减少冗余
const deleteEmptyJSConfig = {
  input: './rollup-empty-input.js',
  plugins: [deletePlugin({ targets: 'es/**/style/index.js', runOnce: true })],
};

export default [
  // cssConfig,
  ...getCssConfig(),
  esConfig,
  // esmConfig,
  // libConfig,
  // cjsConfig,
  // umdConfig,
  // umdMinConfig,
  // resetCss,
  // deleteEmptyJSConfig,
];
