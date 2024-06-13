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
import alias from 'rollup-plugin-alias';
import multiInput from 'rollup-plugin-multi-input';

import nodeResolve from '@rollup/plugin-node-resolve';
import staticImport from 'rollup-plugin-static-import';
import ignoreImport from 'rollup-plugin-ignore-import';
import copy from 'rollup-plugin-copy';
import { globSync } from 'glob';

import pkg from './package.json';

const name = 'tdesign';

const esExternalDeps = Object.keys(pkg.dependencies || {});
const externalDeps = esExternalDeps.concat([/lodash/, /@babel\/runtime/]);
const externalPeerDeps = Object.keys(pkg.peerDependencies || {});
const banner = `/**
 * ${name} v${pkg.version}
 * (c) ${new Date().getFullYear()} ${pkg.author}
 * @license ${pkg.license}
 */
`;

const input = './index-lib.ts';
const inputList = ['src/**/*.ts', 'src/**/*.tsx', '!src/**/demos', '!src/**/*.d.ts', '!src/**/__tests__'];

// CSS 样式入口
const cssDirMap = {
  commonDir: path.join(path.resolve(__dirname), '../../packages/common'),
  commonComponentDir: path.join(path.resolve(__dirname), '../../packages/components/common/src'),
  vue3ComponentDir: path.join(path.resolve(__dirname), '../../packages/components/vue3/src'),
};

const aliasPlugin = alias({
  resolve: ['.tsx', '.ts', '.js', '.less'],
  entries: {
    '@adapter/vue': path.join(path.resolve(__dirname), '../../packages/adapter/vue/vue3'),
    '@adapter/hooks': path.join(path.resolve(__dirname), '../../packages/adapter/hooks/vue3'),
    '@td/adapter-vue': path.join(path.resolve(__dirname), '../../packages/adapter/vue'),
    '@td/adapter-hooks': path.join(path.resolve(__dirname), '../../packages/adapter/hooks'),
    '@td/utils': path.join(path.resolve(__dirname), '../../packages/utils'),
    '@td/common': path.join(path.resolve(__dirname), '../../packages/common'),
    '@td/components': path.join(path.resolve(__dirname), '../../packages/tdesign-vue-next/src'),
    '@td/components-common': path.join(path.resolve(__dirname), '../../packages/components/common'),
    '@td/components-vue3': path.join(path.resolve(__dirname), '../../packages/components/vue3'),
  },
});

function getPlugins({
  env,
  isProd = false,
  ignoreLess = true,
  extractOneCss = false,
  extractMultiCss = false,
} = {}) {
  const plugins = [
    nodeResolve(),
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
        include: ['src/**/style/css.mjs'],
      }),
      ignoreImport({
        include: [`src/*/style/*`],
        body: 'import "./style/css.mjs";',
      }),
      copy({
        targets: [
          {
            src: 'src/**/style/css.js',
            dest: 'es',
            rename: (name, extension, fullPath) => `${fullPath.substring(4, fullPath.length - 6)}${name}.mjs`,
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
  const files = globSync(`${cssDirMap.commonComponentDir}/**/style/index.js`);
  return files.map((file) => {
    return {
      input: file,
      plugins: [aliasPlugin, styles({ mode: 'extract' })],
      output: {
        banner,
        dir: `es/${file.slice(cssDirMap.commonComponentDir.length, -8)}`,
        assetFileNames: '[name].css',
      },
    };
  });
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
  plugins: [aliasPlugin, multiInput()].concat(getPlugins({ extractMultiCss: true })),
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
  // esConfig,
  // esmConfig,
  // libConfig,
  // cjsConfig,
  // umdConfig,
  // umdMinConfig,
  // resetCss,
  // deleteEmptyJSConfig,
];
